/**
 * 支付宝支付工具库
 * Alipay payment utility library for Next.js server-side API routes.
 *
 * 仅用于服务端，使用 Node.js 内置 crypto 模块，无第三方依赖。
 * Uses Node.js built-in crypto module — no third-party alipay-sdk dependency.
 *
 * 环境变量 (Environment variables):
 *   ALIPAY_APP_ID        - 应用 App ID
 *   ALIPAY_PRIVATE_KEY   - 应用私钥 (PKCS8 格式, 无 PEM 头尾)
 *   ALIPAY_PUBLIC_KEY    - 支付宝公钥 (无 PEM 头尾)
 *   ALIPAY_GATEWAY       - 网关地址，默认正式环境 (https://openapi.alipay.com/gateway.do)
 *                          沙箱环境请设置为: https://openapi-sandbox.dl.alipaydev.com/gateway.do
 *   NEXT_PUBLIC_SITE_URL - 站点地址，用于构造 return_url
 */

import crypto from "crypto";

// ---------------------------------------------------------------------------
// 内部辅助函数 (Internal helpers)
// ---------------------------------------------------------------------------

/**
 * 金额转换：分 -> 元，保留两位小数。
 * 数据库以「分」存储，支付宝接口要求「元」且保留两位小数。
 *
 * Convert cents (分) to yuan (元) string with exactly 2 decimal places.
 * e.g. 990 -> "9.90", 1000 -> "10.00", 1 -> "0.01"
 */
function formatAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * 获取当前时间戳，格式为 "yyyy-MM-dd HH:mm:ss"，使用 Asia/Shanghai 时区。
 * Get current timestamp in "yyyy-MM-dd HH:mm:ss" format (Asia/Shanghai timezone).
 */
function getTimestamp(): string {
  const now = new Date();
  // 使用 Intl.DateTimeFormat 获取上海时区的各个时间分量
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "00";

  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = get("hour");
  const minute = get("minute");
  const second = get("second");

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

/**
 * 将原始 base64 私钥包装为 PEM 格式。
 * 环境变量中存储的是不带 PEM 头尾的 base64 字符串。
 *
 * Wrap raw base64 private key with PEM headers (PKCS8 format).
 */
function wrapPrivateKey(rawKey: string): string {
  return `-----BEGIN PRIVATE KEY-----\n${rawKey}\n-----END PRIVATE KEY-----`;
}

/**
 * 将原始 base64 公钥包装为 PEM 格式。
 *
 * Wrap raw base64 public key with PEM headers.
 */
function wrapPublicKey(rawKey: string): string {
  return `-----BEGIN PUBLIC KEY-----\n${rawKey}\n-----END PUBLIC KEY-----`;
}

/**
 * 使用应用私钥对内容进行 RSA-SHA256 签名。
 *
 * 签名流程:
 *   1. 使用 PKCS8 格式的私钥
 *   2. 算法: SHA256withRSA (对应支付宝 RSA2)
 *   3. 输出 Base64 编码的签名
 *
 * Sign content using RSA-SHA256 with the app private key.
 */
function signContent(content: string, privateKey: string): string {
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(content, "utf-8");
  sign.end();
  return sign.sign(privateKey, "base64");
}

/**
 * 使用支付宝公钥验证签名。
 *
 * Verify signature using RSA-SHA256 with Alipay public key.
 */
function verifySignature(
  content: string,
  signature: string,
  publicKey: string
): boolean {
  const verify = crypto.createVerify("RSA-SHA256");
  verify.update(content, "utf-8");
  verify.end();
  return verify.verify(publicKey, signature, "base64");
}

/**
 * 构造待签名字符串：将参数按 key 字典序排列，拼接为 key1=value1&key2=value2&... 格式。
 * 跳过值为空字符串、undefined、null 的参数。
 *
 * Build the sign content string: sort params by key alphabetically,
 * join as key1=value1&key2=value2&..., skipping empty values.
 */
function buildSignContent(params: Record<string, string>): string {
  return Object.keys(params)
    .filter((key) => {
      const val = params[key];
      return val !== undefined && val !== null && val !== "";
    })
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
}

// ---------------------------------------------------------------------------
// 导出函数 (Exported functions)
// ---------------------------------------------------------------------------

/**
 * 创建支付宝电脑网站支付订单 (alipay.trade.page.pay)
 *
 * 构造包含签名的完整支付 URL，前端可通过 window.location.href 跳转或表单提交。
 *
 * Create an Alipay PC website payment order.
 * Returns a full URL that the client can redirect to for payment.
 *
 * @param params.orderId    - 商户订单号 (out_trade_no)
 * @param params.amount     - 金额，单位：分
 * @param params.subject    - 订单标题
 * @param params.returnUrl  - 同步跳转地址 (支付完成后浏览器跳转)
 * @param params.notifyUrl  - 异步通知地址 (支付宝服务器回调)
 */
export async function createAlipayOrder(params: {
  orderId: string;
  amount: number;
  subject: string;
  returnUrl: string;
  notifyUrl: string;
}): Promise<{ success: boolean; payUrl?: string; error?: string }> {
  try {
    const appId = process.env.ALIPAY_APP_ID;
    const privateKeyRaw = process.env.ALIPAY_PRIVATE_KEY;
    const gateway =
      process.env.ALIPAY_GATEWAY || "https://openapi.alipay.com/gateway.do";

    if (!appId || !privateKeyRaw) {
      throw new Error(
        "支付宝配置缺失：ALIPAY_APP_ID 或 ALIPAY_PRIVATE_KEY 未设置"
      );
    }

    const privateKey = wrapPrivateKey(privateKeyRaw);

    // 构造业务参数 (biz_content)
    const bizContent = JSON.stringify({
      out_trade_no: params.orderId,
      total_amount: formatAmount(params.amount),
      subject: params.subject,
      product_code: "FAST_INSTANT_TRADE_PAY",
    });

    // 构造系统级请求参数
    const requestParams: Record<string, string> = {
      app_id: appId,
      method: "alipay.trade.page.pay",
      charset: "utf-8",
      sign_type: "RSA2",
      timestamp: getTimestamp(),
      version: "1.0",
      notify_url: params.notifyUrl,
      return_url: params.returnUrl,
      biz_content: bizContent,
    };

    // 签名流程:
    // 1. 将所有参数按 key 字典序排列
    // 2. 拼接为 key=value&key=value 格式
    // 3. 使用 RSA-SHA256 + 应用私钥签名
    const signContentStr = buildSignContent(requestParams);
    const signature = signContent(signContentStr, privateKey);

    // 将签名加入参数
    requestParams.sign = signature;

    // 构造完整的支付跳转 URL
    const queryString = Object.keys(requestParams)
      .map(
        (key) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(requestParams[key])}`
      )
      .join("&");

    const payUrl = `${gateway}?${queryString}`;

    return { success: true, payUrl };
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    console.error("[Alipay] 创建订单失败:", message);
    return { success: false, error: message };
  }
}

/**
 * 验证支付宝异步通知签名
 *
 * 支付宝异步通知验签流程:
 *   1. 从通知参数中取出 sign 和 sign_type
 *   2. 将剩余参数按 key 字典序排列，拼接为待验签字符串
 *   3. 使用支付宝公钥 + RSA-SHA256 验证签名
 *
 * Verify Alipay async notification signature.
 * Returns true if the signature is valid.
 *
 * @param params - 支付宝 POST 过来的所有参数 (all POST params from Alipay)
 */
export async function verifyAlipayNotify(
  params: Record<string, string>
): Promise<boolean> {
  try {
    const publicKeyRaw = process.env.ALIPAY_PUBLIC_KEY;
    if (!publicKeyRaw) {
      console.error("[Alipay] 验签失败：ALIPAY_PUBLIC_KEY 未设置");
      return false;
    }

    const publicKey = wrapPublicKey(publicKeyRaw);

    // 提取签名值
    const sign = params.sign;
    if (!sign) {
      console.error("[Alipay] 验签失败：通知参数中缺少 sign");
      return false;
    }

    // 移除 sign 和 sign_type，用剩余参数构造待验签字符串
    const filteredParams: Record<string, string> = {};
    for (const key of Object.keys(params)) {
      if (key !== "sign" && key !== "sign_type") {
        filteredParams[key] = params[key];
      }
    }

    const signContentStr = buildSignContent(filteredParams);

    // 使用支付宝公钥验证签名
    const isValid = verifySignature(signContentStr, sign, publicKey);

    if (!isValid) {
      console.error("[Alipay] 验签失败：签名不匹配");
    }

    return isValid;
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    console.error("[Alipay] 验签异常:", message);
    return false;
  }
}

/**
 * 创建支付宝退款请求 (alipay.trade.refund)
 *
 * 向支付宝网关发送退款请求并解析响应。
 *
 * Create an Alipay refund request.
 * Makes a server-side request to the Alipay gateway with signed params.
 *
 * @param params.tradeNo       - 支付宝交易号 (trade_no)
 * @param params.refundAmount  - 退款金额，单位：分
 * @param params.refundReason  - 退款原因 (可选)
 * @param params.outRequestNo  - 退款请求号 (用于部分退款时标识唯一退款请求)
 */
export async function createAlipayRefund(params: {
  tradeNo: string;
  refundAmount: number;
  refundReason?: string;
  outRequestNo: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const appId = process.env.ALIPAY_APP_ID;
    const privateKeyRaw = process.env.ALIPAY_PRIVATE_KEY;
    const gateway =
      process.env.ALIPAY_GATEWAY || "https://openapi.alipay.com/gateway.do";

    if (!appId || !privateKeyRaw) {
      throw new Error(
        "支付宝配置缺失：ALIPAY_APP_ID 或 ALIPAY_PRIVATE_KEY 未设置"
      );
    }

    const privateKey = wrapPrivateKey(privateKeyRaw);

    // 构造业务参数 (biz_content)
    const bizContentObj: Record<string, string> = {
      trade_no: params.tradeNo,
      refund_amount: formatAmount(params.refundAmount),
      out_request_no: params.outRequestNo,
    };
    if (params.refundReason) {
      bizContentObj.refund_reason = params.refundReason;
    }
    const bizContent = JSON.stringify(bizContentObj);

    // 构造系统级请求参数
    const requestParams: Record<string, string> = {
      app_id: appId,
      method: "alipay.trade.refund",
      charset: "utf-8",
      sign_type: "RSA2",
      timestamp: getTimestamp(),
      version: "1.0",
      biz_content: bizContent,
    };

    // 签名
    const signContentStr = buildSignContent(requestParams);
    const signature = signContent(signContentStr, privateKey);
    requestParams.sign = signature;

    // 发送请求到支付宝网关
    const queryString = Object.keys(requestParams)
      .map(
        (key) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(requestParams[key])}`
      )
      .join("&");

    const response = await fetch(`${gateway}?${queryString}`);
    const data = await response.json();

    // 解析退款响应
    // 支付宝退款响应结构: { alipay_trade_refund_response: { code, msg, ... } }
    const refundResponse = data.alipay_trade_refund_response;

    if (!refundResponse) {
      throw new Error("支付宝退款响应格式异常");
    }

    // code 为 "10000" 表示成功
    if (refundResponse.code === "10000") {
      return { success: true };
    }

    const errorMsg =
      refundResponse.sub_msg || refundResponse.msg || "退款失败";
    console.error(
      "[Alipay] 退款失败:",
      refundResponse.code,
      refundResponse.sub_code,
      errorMsg
    );
    return { success: false, error: errorMsg };
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    console.error("[Alipay] 退款异常:", message);
    return { success: false, error: message };
  }
}
