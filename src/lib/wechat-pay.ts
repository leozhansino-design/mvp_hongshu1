/**
 * 微信支付 V3 工具库
 * WeChat Pay V3 utility library for Next.js server-side API routes.
 *
 * 仅用于服务端，使用 Node.js 内置 crypto 模块，无第三方依赖。
 * Uses Node.js built-in crypto module — no third-party dependencies.
 *
 * 环境变量 (Environment variables):
 *   WECHAT_APP_ID        - 公众号/小程序/应用 AppID
 *   WECHAT_MCH_ID        - 商户号 (Merchant ID)
 *   WECHAT_API_V3_KEY    - API V3 密钥 (for AES-GCM decryption of callbacks)
 *   WECHAT_CERT_SERIAL   - 商户证书序列号 (Certificate serial number)
 *   WECHAT_PRIVATE_KEY   - 商户私钥 PEM 格式 (RSA private key in PEM format)
 */

import crypto from "crypto";

// ---------------------------------------------------------------------------
// 内部辅助函数 (Internal helpers)
// ---------------------------------------------------------------------------

/**
 * 从环境变量中读取商户私钥，处理可能被转义的换行符。
 * Read the merchant private key from the environment variable, handling
 * escaped newlines that are common in .env files.
 */
function getPrivateKey(): string {
  const raw = process.env.WECHAT_PRIVATE_KEY;
  if (!raw) {
    throw new Error("WECHAT_PRIVATE_KEY 环境变量未设置");
  }
  // 环境变量中的 \\n 替换为真正的换行符
  return raw.replace(/\\n/g, "\n");
}

/**
 * 生成随机字符串 (nonce)，用于签名和订单号。
 */
function generateNonce(length = 32): string {
  return crypto.randomBytes(length).toString("hex").slice(0, length);
}

/**
 * 获取当前 Unix 时间戳（秒）。
 */
function getTimestamp(): string {
  return Math.floor(Date.now() / 1000).toString();
}

/**
 * 使用商户私钥对签名串进行 RSA-SHA256 签名。
 *
 * 签名流程 (Signing flow):
 *   1. 构造签名串: ${method}\n${urlPath}\n${timestamp}\n${nonce}\n${body}\n
 *   2. 使用 RSA-SHA256 + 商户私钥签名
 *   3. 对签名结果进行 Base64 编码
 */
function signRequest(
  method: string,
  urlPath: string,
  timestamp: string,
  nonce: string,
  body: string
): string {
  const signString = `${method}\n${urlPath}\n${timestamp}\n${nonce}\n${body}\n`;
  const privateKey = getPrivateKey();

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signString);
  sign.end();

  return sign.sign(privateKey, "base64");
}

/**
 * 构建微信支付 V3 Authorization 头。
 *
 * 格式:
 *   WECHATPAY2-SHA256-RSA2048 mchid="...",nonce_str="...",signature="...",timestamp="...",serial_no="..."
 */
function buildAuthorizationHeader(
  method: string,
  urlPath: string,
  body: string
): string {
  const mchId = process.env.WECHAT_MCH_ID;
  const serialNo = process.env.WECHAT_CERT_SERIAL;

  if (!mchId) throw new Error("WECHAT_MCH_ID 环境变量未设置");
  if (!serialNo) throw new Error("WECHAT_CERT_SERIAL 环境变量未设置");

  const timestamp = getTimestamp();
  const nonce = generateNonce();
  const signature = signRequest(method, urlPath, timestamp, nonce, body);

  return (
    `WECHATPAY2-SHA256-RSA2048 ` +
    `mchid="${mchId}",` +
    `nonce_str="${nonce}",` +
    `signature="${signature}",` +
    `timestamp="${timestamp}",` +
    `serial_no="${serialNo}"`
  );
}

// ---------------------------------------------------------------------------
// 导出函数 (Exported functions)
// ---------------------------------------------------------------------------

/**
 * 生成唯一订单号。
 * Generate a unique order ID in the format: ORD_{timestamp}_{random}
 *
 * @example
 *   generateOrderId() // => "ORD_1706344800_a1b2c3"
 */
export function generateOrderId(): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const random = crypto.randomBytes(3).toString("hex"); // 6 hex chars
  return `ORD_${timestamp}_${random}`;
}

// ---------------------------------------------------------------------------
// Native Pay 下单 (Create Native Pay order)
// ---------------------------------------------------------------------------

interface CreateNativePayOrderParams {
  /** 商户订单号 */
  orderId: string;
  /** 金额，单位: 分 */
  amount: number;
  /** 商品描述 */
  description: string;
  /** 回调通知地址 */
  notifyUrl: string;
}

interface CreateNativePayOrderResult {
  success: boolean;
  /** 二维码链接，success 为 true 时返回 */
  codeUrl?: string;
  error?: string;
}

/**
 * 创建微信 Native Pay 订单（扫码支付）。
 *
 * POST https://api.mch.weixin.qq.com/v3/pay/transactions/native
 *
 * @param params - 订单参数
 * @returns 包含 code_url 的结果，或错误信息
 */
export async function createNativePayOrder(
  params: CreateNativePayOrderParams
): Promise<CreateNativePayOrderResult> {
  const { orderId, amount, description, notifyUrl } = params;

  const appId = process.env.WECHAT_APP_ID;
  const mchId = process.env.WECHAT_MCH_ID;
  if (!appId) {
    return { success: false, error: "WECHAT_APP_ID 环境变量未设置" };
  }
  if (!mchId) {
    return { success: false, error: "WECHAT_MCH_ID 环境变量未设置" };
  }
  if (!appId) {
    return { success: false, error: "WECHAT_APP_ID 环境变量未设置" };
  }

  const apiUrl =
    "https://api.mch.weixin.qq.com/v3/pay/transactions/native";
  const urlPath = "/v3/pay/transactions/native";

  // 请求体
  const requestBody = JSON.stringify({
    appid: appId,
    mchid: mchId,
    out_trade_no: orderId,
    description,
    notify_url: notifyUrl,
    amount: {
      total: amount,
      currency: "CNY",
    },
  });

  try {
    const authorization = buildAuthorizationHeader("POST", urlPath, requestBody);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authorization,
      },
      body: requestBody,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("微信支付下单失败 (WeChat Pay order creation failed):", {
        status: response.status,
        data,
      });
      return {
        success: false,
        error: data.message || `HTTP ${response.status}`,
      };
    }

    // 成功时返回 code_url（用于生成二维码）
    return {
      success: true,
      codeUrl: data.code_url,
    };
  } catch (err) {
    console.error("微信支付下单异常 (WeChat Pay order exception):", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ---------------------------------------------------------------------------
// 回调通知验证与解密 (Verify and decrypt WeChat payment notification)
// ---------------------------------------------------------------------------

interface WechatNotifyHeaders {
  /** 微信回调时间戳 */
  "Wechatpay-Timestamp": string;
  /** 微信回调随机串 */
  "Wechatpay-Nonce": string;
  /** 微信回调签名 */
  "Wechatpay-Signature": string;
  /** 微信平台证书序列号 */
  "Wechatpay-Serial": string;
  [key: string]: string;
}

interface WechatNotifyData {
  out_trade_no: string;
  trade_state: string;
  transaction_id: string;
  amount: {
    total: number;
  };
}

interface VerifyWechatNotifyResult {
  success: boolean;
  data?: WechatNotifyData;
  error?: string;
}

/**
 * 使用 AES-256-GCM 解密微信回调通知中的 resource 字段。
 *
 * @param ciphertext  - Base64 编码的密文
 * @param nonce       - 随机串 (associated_data 中的 nonce)
 * @param associatedData - 附加数据
 * @param apiV3Key    - API V3 密钥（32 字节）
 */
function decryptResource(
  ciphertext: string,
  nonce: string,
  associatedData: string,
  apiV3Key: string
): string {
  // 密文是 Base64 编码，末尾 16 字节是 authentication tag
  const buf = Buffer.from(ciphertext, "base64");
  const authTag = buf.subarray(buf.length - 16);
  const encrypted = buf.subarray(0, buf.length - 16);

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    Buffer.from(apiV3Key, "utf-8"),
    Buffer.from(nonce, "utf-8")
  );
  decipher.setAuthTag(authTag);
  decipher.setAAD(Buffer.from(associatedData, "utf-8"));

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf-8");
}

/**
 * 验证并解密微信支付回调通知。
 *
 * TODO: 完整的签名验证需要微信平台证书（定期从微信下载）。
 *       当前实现仅解密 resource 并校验内容，生产环境请补充签名验证。
 *
 * @param headers - 微信回调请求头
 * @param body    - 微信回调原始请求体（JSON 字符串）
 * @returns 解密后的支付结果，或错误信息
 */
export async function verifyWechatNotify(
  headers: WechatNotifyHeaders,
  body: string
): Promise<VerifyWechatNotifyResult> {
  const apiV3Key = process.env.WECHAT_API_V3_KEY;
  if (!apiV3Key) {
    return { success: false, error: "WECHAT_API_V3_KEY 环境变量未设置" };
  }

  try {
    // 解析回调请求体
    const notification = JSON.parse(body);

    // TODO: 签名验证 (Signature verification)
    // 生产环境需要使用微信平台证书公钥验证签名:
    //   签名串 = ${Wechatpay-Timestamp}\n${Wechatpay-Nonce}\n${body}\n
    //   使用微信平台证书公钥 + RSA-SHA256 验证 Wechatpay-Signature
    // 当前跳过，仅记录日志以便调试
    const wechatTimestamp = headers["Wechatpay-Timestamp"];
    const wechatNonce = headers["Wechatpay-Nonce"];
    const wechatSignature = headers["Wechatpay-Signature"];
    const wechatSerial = headers["Wechatpay-Serial"];

    console.log("微信回调签名信息 (WeChat notify signature info):", {
      timestamp: wechatTimestamp,
      nonce: wechatNonce,
      serial: wechatSerial,
      signaturePresent: !!wechatSignature,
    });

    // 检查通知类型
    if (notification.event_type !== "TRANSACTION.SUCCESS") {
      return {
        success: false,
        error: `未处理的事件类型: ${notification.event_type}`,
      };
    }

    // 解密 resource 字段
    const resource = notification.resource;
    if (!resource) {
      return { success: false, error: "回调通知缺少 resource 字段" };
    }

    const decryptedStr = decryptResource(
      resource.ciphertext,
      resource.nonce,
      resource.associated_data || "",
      apiV3Key
    );

    const decryptedData = JSON.parse(decryptedStr) as WechatNotifyData;

    // 校验必要字段
    if (!decryptedData.out_trade_no || !decryptedData.trade_state) {
      return { success: false, error: "解密后的数据缺少必要字段" };
    }

    return {
      success: true,
      data: {
        out_trade_no: decryptedData.out_trade_no,
        trade_state: decryptedData.trade_state,
        transaction_id: decryptedData.transaction_id,
        amount: {
          total: decryptedData.amount?.total,
        },
      },
    };
  } catch (err) {
    console.error("微信回调处理异常 (WeChat notify processing error):", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ---------------------------------------------------------------------------
// 退款 (Create refund)
// ---------------------------------------------------------------------------

interface CreateRefundParams {
  /** 原商户订单号 */
  orderId: string;
  /** 商户退款单号 */
  refundId: string;
  /** 原订单总金额（分） */
  totalAmount: number;
  /** 退款金额（分） */
  refundAmount: number;
  /** 退款原因（可选） */
  reason?: string;
}

interface CreateRefundResult {
  success: boolean;
  /** 微信退款单号 */
  refundId?: string;
  error?: string;
}

/**
 * 创建退款申请。
 *
 * POST https://api.mch.weixin.qq.com/v3/refund/domestic/refunds
 *
 * @param params - 退款参数
 * @returns 退款结果，或错误信息
 */
export async function createRefund(
  params: CreateRefundParams
): Promise<CreateRefundResult> {
  const { orderId, refundId, totalAmount, refundAmount, reason } = params;

  const apiUrl =
    "https://api.mch.weixin.qq.com/v3/refund/domestic/refunds";
  const urlPath = "/v3/refund/domestic/refunds";

  // 请求体
  const requestBody = JSON.stringify({
    out_trade_no: orderId,
    out_refund_no: refundId,
    reason: reason || "用户申请退款",
    amount: {
      refund: refundAmount,
      total: totalAmount,
      currency: "CNY",
    },
  });

  try {
    const authorization = buildAuthorizationHeader("POST", urlPath, requestBody);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authorization,
      },
      body: requestBody,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("微信退款失败 (WeChat refund failed):", {
        status: response.status,
        data,
      });
      return {
        success: false,
        error: data.message || `HTTP ${response.status}`,
      };
    }

    // 成功时返回微信退款单号
    return {
      success: true,
      refundId: data.refund_id,
    };
  } catch (err) {
    console.error("微信退款异常 (WeChat refund exception):", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
