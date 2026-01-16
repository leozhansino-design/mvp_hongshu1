/**
 * 中国城市数据集
 * 数据来源: https://github.com/brightgems/china_city_dataset
 * 包含省份、城市、城市等级(一线至五线)、地区分类
 */

export type CityTier =
  | '一线'
  | '新一线'
  | '二线'
  | '三线'
  | '四线'
  | '五线';

export type Region = '华北' | '东北' | '华东' | '华中' | '华南' | '西南' | '西北' | '港澳台';

export interface City {
  name: string;           // 城市名称
  nameEn: string;         // 英文名
  tier: CityTier;         // 城市等级
}

export interface Province {
  name: string;           // 省份名称
  nameEn: string;         // 英文名
  region: Region;         // 地区
  cities: City[];         // 下属城市
}

// 完整的中国城市数据
export const CHINA_PROVINCES: Province[] = [
  // ==================== 华北地区 ====================
  {
    name: '北京市',
    nameEn: 'Beijing',
    region: '华北',
    cities: [
      { name: '北京', nameEn: 'Beijing', tier: '一线' },
    ],
  },
  {
    name: '天津市',
    nameEn: 'Tianjin',
    region: '华北',
    cities: [
      { name: '天津', nameEn: 'Tianjin', tier: '新一线' },
    ],
  },
  {
    name: '河北省',
    nameEn: 'Hebei',
    region: '华北',
    cities: [
      { name: '石家庄', nameEn: 'Shijiazhuang', tier: '二线' },
      { name: '唐山', nameEn: 'Tangshan', tier: '三线' },
      { name: '保定', nameEn: 'Baoding', tier: '三线' },
      { name: '邯郸', nameEn: 'Handan', tier: '三线' },
      { name: '廊坊', nameEn: 'Langfang', tier: '三线' },
      { name: '沧州', nameEn: 'Cangzhou', tier: '三线' },
      { name: '秦皇岛', nameEn: 'Qinhuangdao', tier: '三线' },
      { name: '张家口', nameEn: 'Zhangjiakou', tier: '四线' },
      { name: '邢台', nameEn: 'Xingtai', tier: '四线' },
      { name: '承德', nameEn: 'Chengde', tier: '四线' },
      { name: '衡水', nameEn: 'Hengshui', tier: '四线' },
    ],
  },
  {
    name: '山西省',
    nameEn: 'Shanxi',
    region: '华北',
    cities: [
      { name: '太原', nameEn: 'Taiyuan', tier: '二线' },
      { name: '大同', nameEn: 'Datong', tier: '四线' },
      { name: '运城', nameEn: 'Yuncheng', tier: '四线' },
      { name: '长治', nameEn: 'Changzhi', tier: '四线' },
      { name: '临汾', nameEn: 'Linfen', tier: '四线' },
      { name: '晋中', nameEn: 'Jinzhong', tier: '四线' },
      { name: '晋城', nameEn: 'Jincheng', tier: '四线' },
      { name: '阳泉', nameEn: 'Yangquan', tier: '五线' },
      { name: '吕梁', nameEn: 'Lvliang', tier: '五线' },
      { name: '忻州', nameEn: 'Xinzhou', tier: '五线' },
      { name: '朔州', nameEn: 'Shuozhou', tier: '五线' },
    ],
  },
  {
    name: '内蒙古自治区',
    nameEn: 'Inner Mongolia',
    region: '华北',
    cities: [
      { name: '呼和浩特', nameEn: 'Hohhot', tier: '三线' },
      { name: '包头', nameEn: 'Baotou', tier: '三线' },
      { name: '鄂尔多斯', nameEn: 'Ordos', tier: '三线' },
      { name: '赤峰', nameEn: 'Chifeng', tier: '四线' },
      { name: '通辽', nameEn: 'Tongliao', tier: '四线' },
      { name: '呼伦贝尔', nameEn: 'Hulunbuir', tier: '四线' },
      { name: '巴彦淖尔', nameEn: 'Bayannur', tier: '五线' },
      { name: '乌兰察布', nameEn: 'Ulanqab', tier: '五线' },
      { name: '乌海', nameEn: 'Wuhai', tier: '五线' },
      { name: '锡林郭勒盟', nameEn: 'Xilingol', tier: '五线' },
      { name: '兴安盟', nameEn: 'Hinggan', tier: '五线' },
      { name: '阿拉善盟', nameEn: 'Alxa', tier: '五线' },
    ],
  },

  // ==================== 东北地区 ====================
  {
    name: '辽宁省',
    nameEn: 'Liaoning',
    region: '东北',
    cities: [
      { name: '沈阳', nameEn: 'Shenyang', tier: '二线' },
      { name: '大连', nameEn: 'Dalian', tier: '二线' },
      { name: '鞍山', nameEn: 'Anshan', tier: '四线' },
      { name: '锦州', nameEn: 'Jinzhou', tier: '四线' },
      { name: '抚顺', nameEn: 'Fushun', tier: '四线' },
      { name: '营口', nameEn: 'Yingkou', tier: '四线' },
      { name: '盘锦', nameEn: 'Panjin', tier: '四线' },
      { name: '丹东', nameEn: 'Dandong', tier: '四线' },
      { name: '辽阳', nameEn: 'Liaoyang', tier: '五线' },
      { name: '本溪', nameEn: 'Benxi', tier: '五线' },
      { name: '葫芦岛', nameEn: 'Huludao', tier: '五线' },
      { name: '朝阳', nameEn: 'Chaoyang', tier: '五线' },
      { name: '阜新', nameEn: 'Fuxin', tier: '五线' },
      { name: '铁岭', nameEn: 'Tieling', tier: '五线' },
    ],
  },
  {
    name: '吉林省',
    nameEn: 'Jilin',
    region: '东北',
    cities: [
      { name: '长春', nameEn: 'Changchun', tier: '二线' },
      { name: '吉林', nameEn: 'Jilin', tier: '四线' },
      { name: '四平', nameEn: 'Siping', tier: '五线' },
      { name: '通化', nameEn: 'Tonghua', tier: '五线' },
      { name: '松原', nameEn: 'Songyuan', tier: '五线' },
      { name: '延边', nameEn: 'Yanbian', tier: '五线' },
      { name: '白城', nameEn: 'Baicheng', tier: '五线' },
      { name: '辽源', nameEn: 'Liaoyuan', tier: '五线' },
      { name: '白山', nameEn: 'Baishan', tier: '五线' },
    ],
  },
  {
    name: '黑龙江省',
    nameEn: 'Heilongjiang',
    region: '东北',
    cities: [
      { name: '哈尔滨', nameEn: 'Harbin', tier: '二线' },
      { name: '大庆', nameEn: 'Daqing', tier: '四线' },
      { name: '齐齐哈尔', nameEn: 'Qiqihar', tier: '四线' },
      { name: '绥化', nameEn: 'Suihua', tier: '五线' },
      { name: '牡丹江', nameEn: 'Mudanjiang', tier: '五线' },
      { name: '佳木斯', nameEn: 'Jiamusi', tier: '五线' },
      { name: '鸡西', nameEn: 'Jixi', tier: '五线' },
      { name: '双鸭山', nameEn: 'Shuangyashan', tier: '五线' },
      { name: '鹤岗', nameEn: 'Hegang', tier: '五线' },
      { name: '黑河', nameEn: 'Heihe', tier: '五线' },
      { name: '伊春', nameEn: 'Yichun', tier: '五线' },
      { name: '七台河', nameEn: 'Qitaihe', tier: '五线' },
      { name: '大兴安岭', nameEn: 'Daxinganling', tier: '五线' },
    ],
  },

  // ==================== 华东地区 ====================
  {
    name: '上海市',
    nameEn: 'Shanghai',
    region: '华东',
    cities: [
      { name: '上海', nameEn: 'Shanghai', tier: '一线' },
    ],
  },
  {
    name: '江苏省',
    nameEn: 'Jiangsu',
    region: '华东',
    cities: [
      { name: '南京', nameEn: 'Nanjing', tier: '新一线' },
      { name: '苏州', nameEn: 'Suzhou', tier: '新一线' },
      { name: '无锡', nameEn: 'Wuxi', tier: '二线' },
      { name: '南通', nameEn: 'Nantong', tier: '二线' },
      { name: '常州', nameEn: 'Changzhou', tier: '二线' },
      { name: '徐州', nameEn: 'Xuzhou', tier: '二线' },
      { name: '扬州', nameEn: 'Yangzhou', tier: '三线' },
      { name: '盐城', nameEn: 'Yancheng', tier: '三线' },
      { name: '泰州', nameEn: 'Taizhou', tier: '三线' },
      { name: '镇江', nameEn: 'Zhenjiang', tier: '三线' },
      { name: '淮安', nameEn: 'Huaian', tier: '三线' },
      { name: '连云港', nameEn: 'Lianyungang', tier: '三线' },
      { name: '宿迁', nameEn: 'Suqian', tier: '四线' },
    ],
  },
  {
    name: '浙江省',
    nameEn: 'Zhejiang',
    region: '华东',
    cities: [
      { name: '杭州', nameEn: 'Hangzhou', tier: '新一线' },
      { name: '宁波', nameEn: 'Ningbo', tier: '新一线' },
      { name: '温州', nameEn: 'Wenzhou', tier: '二线' },
      { name: '嘉兴', nameEn: 'Jiaxing', tier: '二线' },
      { name: '金华', nameEn: 'Jinhua', tier: '二线' },
      { name: '绍兴', nameEn: 'Shaoxing', tier: '二线' },
      { name: '台州', nameEn: 'Taizhou', tier: '三线' },
      { name: '湖州', nameEn: 'Huzhou', tier: '三线' },
      { name: '丽水', nameEn: 'Lishui', tier: '四线' },
      { name: '衢州', nameEn: 'Quzhou', tier: '四线' },
      { name: '舟山', nameEn: 'Zhoushan', tier: '四线' },
    ],
  },
  {
    name: '安徽省',
    nameEn: 'Anhui',
    region: '华东',
    cities: [
      { name: '合肥', nameEn: 'Hefei', tier: '新一线' },
      { name: '芜湖', nameEn: 'Wuhu', tier: '三线' },
      { name: '蚌埠', nameEn: 'Bengbu', tier: '四线' },
      { name: '阜阳', nameEn: 'Fuyang', tier: '四线' },
      { name: '安庆', nameEn: 'Anqing', tier: '四线' },
      { name: '马鞍山', nameEn: 'Maanshan', tier: '四线' },
      { name: '滁州', nameEn: 'Chuzhou', tier: '四线' },
      { name: '淮南', nameEn: 'Huainan', tier: '四线' },
      { name: '宿州', nameEn: 'Suzhou', tier: '四线' },
      { name: '六安', nameEn: 'Luan', tier: '四线' },
      { name: '亳州', nameEn: 'Bozhou', tier: '四线' },
      { name: '淮北', nameEn: 'Huaibei', tier: '五线' },
      { name: '铜陵', nameEn: 'Tongling', tier: '五线' },
      { name: '宣城', nameEn: 'Xuancheng', tier: '五线' },
      { name: '黄山', nameEn: 'Huangshan', tier: '五线' },
      { name: '池州', nameEn: 'Chizhou', tier: '五线' },
    ],
  },
  {
    name: '福建省',
    nameEn: 'Fujian',
    region: '华东',
    cities: [
      { name: '福州', nameEn: 'Fuzhou', tier: '二线' },
      { name: '厦门', nameEn: 'Xiamen', tier: '二线' },
      { name: '泉州', nameEn: 'Quanzhou', tier: '二线' },
      { name: '漳州', nameEn: 'Zhangzhou', tier: '三线' },
      { name: '莆田', nameEn: 'Putian', tier: '三线' },
      { name: '宁德', nameEn: 'Ningde', tier: '四线' },
      { name: '龙岩', nameEn: 'Longyan', tier: '四线' },
      { name: '三明', nameEn: 'Sanming', tier: '四线' },
      { name: '南平', nameEn: 'Nanping', tier: '五线' },
    ],
  },
  {
    name: '江西省',
    nameEn: 'Jiangxi',
    region: '华东',
    cities: [
      { name: '南昌', nameEn: 'Nanchang', tier: '二线' },
      { name: '赣州', nameEn: 'Ganzhou', tier: '三线' },
      { name: '九江', nameEn: 'Jiujiang', tier: '四线' },
      { name: '上饶', nameEn: 'Shangrao', tier: '四线' },
      { name: '宜春', nameEn: 'Yichun', tier: '四线' },
      { name: '吉安', nameEn: 'Jian', tier: '四线' },
      { name: '抚州', nameEn: 'Fuzhou', tier: '四线' },
      { name: '景德镇', nameEn: 'Jingdezhen', tier: '四线' },
      { name: '萍乡', nameEn: 'Pingxiang', tier: '五线' },
      { name: '新余', nameEn: 'Xinyu', tier: '五线' },
      { name: '鹰潭', nameEn: 'Yingtan', tier: '五线' },
    ],
  },
  {
    name: '山东省',
    nameEn: 'Shandong',
    region: '华东',
    cities: [
      { name: '青岛', nameEn: 'Qingdao', tier: '新一线' },
      { name: '济南', nameEn: 'Jinan', tier: '二线' },
      { name: '烟台', nameEn: 'Yantai', tier: '二线' },
      { name: '潍坊', nameEn: 'Weifang', tier: '三线' },
      { name: '临沂', nameEn: 'Linyi', tier: '三线' },
      { name: '济宁', nameEn: 'Jining', tier: '三线' },
      { name: '淄博', nameEn: 'Zibo', tier: '三线' },
      { name: '威海', nameEn: 'Weihai', tier: '三线' },
      { name: '菏泽', nameEn: 'Heze', tier: '四线' },
      { name: '德州', nameEn: 'Dezhou', tier: '四线' },
      { name: '聊城', nameEn: 'Liaocheng', tier: '四线' },
      { name: '泰安', nameEn: 'Taian', tier: '四线' },
      { name: '枣庄', nameEn: 'Zaozhuang', tier: '四线' },
      { name: '滨州', nameEn: 'Binzhou', tier: '四线' },
      { name: '东营', nameEn: 'Dongying', tier: '四线' },
      { name: '日照', nameEn: 'Rizhao', tier: '四线' },
    ],
  },

  // ==================== 华中地区 ====================
  {
    name: '河南省',
    nameEn: 'Henan',
    region: '华中',
    cities: [
      { name: '郑州', nameEn: 'Zhengzhou', tier: '新一线' },
      { name: '洛阳', nameEn: 'Luoyang', tier: '三线' },
      { name: '南阳', nameEn: 'Nanyang', tier: '三线' },
      { name: '许昌', nameEn: 'Xuchang', tier: '三线' },
      { name: '周口', nameEn: 'Zhoukou', tier: '四线' },
      { name: '新乡', nameEn: 'Xinxiang', tier: '四线' },
      { name: '信阳', nameEn: 'Xinyang', tier: '四线' },
      { name: '商丘', nameEn: 'Shangqiu', tier: '四线' },
      { name: '驻马店', nameEn: 'Zhumadian', tier: '四线' },
      { name: '焦作', nameEn: 'Jiaozuo', tier: '四线' },
      { name: '平顶山', nameEn: 'Pingdingshan', tier: '四线' },
      { name: '开封', nameEn: 'Kaifeng', tier: '四线' },
      { name: '安阳', nameEn: 'Anyang', tier: '四线' },
      { name: '濮阳', nameEn: 'Puyang', tier: '四线' },
      { name: '漯河', nameEn: 'Luohe', tier: '五线' },
      { name: '三门峡', nameEn: 'Sanmenxia', tier: '五线' },
      { name: '鹤壁', nameEn: 'Hebi', tier: '五线' },
      { name: '济源', nameEn: 'Jiyuan', tier: '五线' },
    ],
  },
  {
    name: '湖北省',
    nameEn: 'Hubei',
    region: '华中',
    cities: [
      { name: '武汉', nameEn: 'Wuhan', tier: '新一线' },
      { name: '宜昌', nameEn: 'Yichang', tier: '三线' },
      { name: '襄阳', nameEn: 'Xiangyang', tier: '三线' },
      { name: '荆州', nameEn: 'Jingzhou', tier: '四线' },
      { name: '黄冈', nameEn: 'Huanggang', tier: '四线' },
      { name: '孝感', nameEn: 'Xiaogan', tier: '四线' },
      { name: '十堰', nameEn: 'Shiyan', tier: '四线' },
      { name: '咸宁', nameEn: 'Xianning', tier: '四线' },
      { name: '黄石', nameEn: 'Huangshi', tier: '四线' },
      { name: '荆门', nameEn: 'Jingmen', tier: '四线' },
      { name: '恩施', nameEn: 'Enshi', tier: '五线' },
      { name: '随州', nameEn: 'Suizhou', tier: '五线' },
      { name: '鄂州', nameEn: 'Ezhou', tier: '五线' },
      { name: '天门', nameEn: 'Tianmen', tier: '五线' },
      { name: '潜江', nameEn: 'Qianjiang', tier: '五线' },
      { name: '仙桃', nameEn: 'Xiantao', tier: '五线' },
      { name: '神农架', nameEn: 'Shennongjia', tier: '五线' },
    ],
  },
  {
    name: '湖南省',
    nameEn: 'Hunan',
    region: '华中',
    cities: [
      { name: '长沙', nameEn: 'Changsha', tier: '新一线' },
      { name: '岳阳', nameEn: 'Yueyang', tier: '三线' },
      { name: '株洲', nameEn: 'Zhuzhou', tier: '三线' },
      { name: '常德', nameEn: 'Changde', tier: '三线' },
      { name: '衡阳', nameEn: 'Hengyang', tier: '三线' },
      { name: '郴州', nameEn: 'Chenzhou', tier: '四线' },
      { name: '湘潭', nameEn: 'Xiangtan', tier: '四线' },
      { name: '邵阳', nameEn: 'Shaoyang', tier: '四线' },
      { name: '永州', nameEn: 'Yongzhou', tier: '四线' },
      { name: '怀化', nameEn: 'Huaihua', tier: '四线' },
      { name: '益阳', nameEn: 'Yiyang', tier: '四线' },
      { name: '娄底', nameEn: 'Loudi', tier: '五线' },
      { name: '湘西', nameEn: 'Xiangxi', tier: '五线' },
      { name: '张家界', nameEn: 'Zhangjiajie', tier: '五线' },
    ],
  },

  // ==================== 华南地区 ====================
  {
    name: '广东省',
    nameEn: 'Guangdong',
    region: '华南',
    cities: [
      { name: '广州', nameEn: 'Guangzhou', tier: '一线' },
      { name: '深圳', nameEn: 'Shenzhen', tier: '一线' },
      { name: '东莞', nameEn: 'Dongguan', tier: '新一线' },
      { name: '佛山', nameEn: 'Foshan', tier: '新一线' },
      { name: '惠州', nameEn: 'Huizhou', tier: '二线' },
      { name: '珠海', nameEn: 'Zhuhai', tier: '二线' },
      { name: '中山', nameEn: 'Zhongshan', tier: '二线' },
      { name: '江门', nameEn: 'Jiangmen', tier: '三线' },
      { name: '茂名', nameEn: 'Maoming', tier: '三线' },
      { name: '湛江', nameEn: 'Zhanjiang', tier: '三线' },
      { name: '汕头', nameEn: 'Shantou', tier: '三线' },
      { name: '肇庆', nameEn: 'Zhaoqing', tier: '三线' },
      { name: '揭阳', nameEn: 'Jieyang', tier: '四线' },
      { name: '清远', nameEn: 'Qingyuan', tier: '四线' },
      { name: '韶关', nameEn: 'Shaoguan', tier: '四线' },
      { name: '阳江', nameEn: 'Yangjiang', tier: '四线' },
      { name: '梅州', nameEn: 'Meizhou', tier: '四线' },
      { name: '河源', nameEn: 'Heyuan', tier: '四线' },
      { name: '潮州', nameEn: 'Chaozhou', tier: '四线' },
      { name: '汕尾', nameEn: 'Shanwei', tier: '五线' },
      { name: '云浮', nameEn: 'Yunfu', tier: '五线' },
    ],
  },
  {
    name: '广西壮族自治区',
    nameEn: 'Guangxi',
    region: '华南',
    cities: [
      { name: '南宁', nameEn: 'Nanning', tier: '二线' },
      { name: '柳州', nameEn: 'Liuzhou', tier: '三线' },
      { name: '桂林', nameEn: 'Guilin', tier: '三线' },
      { name: '玉林', nameEn: 'Yulin', tier: '四线' },
      { name: '贵港', nameEn: 'Guigang', tier: '四线' },
      { name: '百色', nameEn: 'Baise', tier: '五线' },
      { name: '北海', nameEn: 'Beihai', tier: '四线' },
      { name: '钦州', nameEn: 'Qinzhou', tier: '四线' },
      { name: '梧州', nameEn: 'Wuzhou', tier: '四线' },
      { name: '河池', nameEn: 'Hechi', tier: '五线' },
      { name: '来宾', nameEn: 'Laibin', tier: '五线' },
      { name: '贺州', nameEn: 'Hezhou', tier: '五线' },
      { name: '崇左', nameEn: 'Chongzuo', tier: '五线' },
      { name: '防城港', nameEn: 'Fangchenggang', tier: '五线' },
    ],
  },
  {
    name: '海南省',
    nameEn: 'Hainan',
    region: '华南',
    cities: [
      { name: '海口', nameEn: 'Haikou', tier: '三线' },
      { name: '三亚', nameEn: 'Sanya', tier: '三线' },
      { name: '儋州', nameEn: 'Danzhou', tier: '五线' },
      { name: '三沙', nameEn: 'Sansha', tier: '五线' },
      { name: '琼海', nameEn: 'Qionghai', tier: '五线' },
      { name: '文昌', nameEn: 'Wenchang', tier: '五线' },
      { name: '万宁', nameEn: 'Wanning', tier: '五线' },
      { name: '东方', nameEn: 'Dongfang', tier: '五线' },
      { name: '五指山', nameEn: 'Wuzhishan', tier: '五线' },
    ],
  },

  // ==================== 西南地区 ====================
  {
    name: '重庆市',
    nameEn: 'Chongqing',
    region: '西南',
    cities: [
      { name: '重庆', nameEn: 'Chongqing', tier: '新一线' },
    ],
  },
  {
    name: '四川省',
    nameEn: 'Sichuan',
    region: '西南',
    cities: [
      { name: '成都', nameEn: 'Chengdu', tier: '新一线' },
      { name: '绵阳', nameEn: 'Mianyang', tier: '三线' },
      { name: '宜宾', nameEn: 'Yibin', tier: '三线' },
      { name: '德阳', nameEn: 'Deyang', tier: '四线' },
      { name: '南充', nameEn: 'Nanchong', tier: '四线' },
      { name: '泸州', nameEn: 'Luzhou', tier: '四线' },
      { name: '乐山', nameEn: 'Leshan', tier: '四线' },
      { name: '达州', nameEn: 'Dazhou', tier: '四线' },
      { name: '内江', nameEn: 'Neijiang', tier: '四线' },
      { name: '遂宁', nameEn: 'Suining', tier: '四线' },
      { name: '自贡', nameEn: 'Zigong', tier: '四线' },
      { name: '眉山', nameEn: 'Meishan', tier: '四线' },
      { name: '广安', nameEn: 'Guangan', tier: '五线' },
      { name: '资阳', nameEn: 'Ziyang', tier: '五线' },
      { name: '攀枝花', nameEn: 'Panzhihua', tier: '五线' },
      { name: '广元', nameEn: 'Guangyuan', tier: '五线' },
      { name: '雅安', nameEn: 'Yaan', tier: '五线' },
      { name: '巴中', nameEn: 'Bazhong', tier: '五线' },
      { name: '凉山', nameEn: 'Liangshan', tier: '五线' },
      { name: '甘孜', nameEn: 'Garze', tier: '五线' },
      { name: '阿坝', nameEn: 'Aba', tier: '五线' },
    ],
  },
  {
    name: '贵州省',
    nameEn: 'Guizhou',
    region: '西南',
    cities: [
      { name: '贵阳', nameEn: 'Guiyang', tier: '二线' },
      { name: '遵义', nameEn: 'Zunyi', tier: '三线' },
      { name: '毕节', nameEn: 'Bijie', tier: '四线' },
      { name: '黔南', nameEn: 'Qiannan', tier: '五线' },
      { name: '黔东南', nameEn: 'Qiandongnan', tier: '五线' },
      { name: '六盘水', nameEn: 'Liupanshui', tier: '五线' },
      { name: '铜仁', nameEn: 'Tongren', tier: '五线' },
      { name: '安顺', nameEn: 'Anshun', tier: '五线' },
      { name: '黔西南', nameEn: 'Qianxinan', tier: '五线' },
    ],
  },
  {
    name: '云南省',
    nameEn: 'Yunnan',
    region: '西南',
    cities: [
      { name: '昆明', nameEn: 'Kunming', tier: '二线' },
      { name: '曲靖', nameEn: 'Qujing', tier: '四线' },
      { name: '大理', nameEn: 'Dali', tier: '四线' },
      { name: '红河', nameEn: 'Honghe', tier: '四线' },
      { name: '玉溪', nameEn: 'Yuxi', tier: '四线' },
      { name: '昭通', nameEn: 'Zhaotong', tier: '五线' },
      { name: '楚雄', nameEn: 'Chuxiong', tier: '五线' },
      { name: '文山', nameEn: 'Wenshan', tier: '五线' },
      { name: '保山', nameEn: 'Baoshan', tier: '五线' },
      { name: '普洱', nameEn: 'Puer', tier: '五线' },
      { name: '西双版纳', nameEn: 'Xishuangbanna', tier: '五线' },
      { name: '临沧', nameEn: 'Lincang', tier: '五线' },
      { name: '德宏', nameEn: 'Dehong', tier: '五线' },
      { name: '丽江', nameEn: 'Lijiang', tier: '五线' },
      { name: '迪庆', nameEn: 'Diqing', tier: '五线' },
      { name: '怒江', nameEn: 'Nujiang', tier: '五线' },
    ],
  },
  {
    name: '西藏自治区',
    nameEn: 'Tibet',
    region: '西南',
    cities: [
      { name: '拉萨', nameEn: 'Lhasa', tier: '四线' },
      { name: '日喀则', nameEn: 'Shigatse', tier: '五线' },
      { name: '昌都', nameEn: 'Chamdo', tier: '五线' },
      { name: '林芝', nameEn: 'Nyingchi', tier: '五线' },
      { name: '山南', nameEn: 'Shannan', tier: '五线' },
      { name: '那曲', nameEn: 'Nagqu', tier: '五线' },
      { name: '阿里', nameEn: 'Ngari', tier: '五线' },
    ],
  },

  // ==================== 西北地区 ====================
  {
    name: '陕西省',
    nameEn: 'Shaanxi',
    region: '西北',
    cities: [
      { name: '西安', nameEn: 'Xian', tier: '新一线' },
      { name: '咸阳', nameEn: 'Xianyang', tier: '三线' },
      { name: '宝鸡', nameEn: 'Baoji', tier: '四线' },
      { name: '渭南', nameEn: 'Weinan', tier: '四线' },
      { name: '榆林', nameEn: 'Yulin', tier: '四线' },
      { name: '汉中', nameEn: 'Hanzhong', tier: '四线' },
      { name: '延安', nameEn: 'Yanan', tier: '四线' },
      { name: '安康', nameEn: 'Ankang', tier: '五线' },
      { name: '商洛', nameEn: 'Shangluo', tier: '五线' },
      { name: '铜川', nameEn: 'Tongchuan', tier: '五线' },
    ],
  },
  {
    name: '甘肃省',
    nameEn: 'Gansu',
    region: '西北',
    cities: [
      { name: '兰州', nameEn: 'Lanzhou', tier: '三线' },
      { name: '天水', nameEn: 'Tianshui', tier: '四线' },
      { name: '庆阳', nameEn: 'Qingyang', tier: '五线' },
      { name: '白银', nameEn: 'Baiyin', tier: '五线' },
      { name: '酒泉', nameEn: 'Jiuquan', tier: '五线' },
      { name: '平凉', nameEn: 'Pingliang', tier: '五线' },
      { name: '定西', nameEn: 'Dingxi', tier: '五线' },
      { name: '武威', nameEn: 'Wuwei', tier: '五线' },
      { name: '陇南', nameEn: 'Longnan', tier: '五线' },
      { name: '张掖', nameEn: 'Zhangye', tier: '五线' },
      { name: '嘉峪关', nameEn: 'Jiayuguan', tier: '五线' },
      { name: '金昌', nameEn: 'Jinchang', tier: '五线' },
      { name: '临夏', nameEn: 'Linxia', tier: '五线' },
      { name: '甘南', nameEn: 'Gannan', tier: '五线' },
    ],
  },
  {
    name: '青海省',
    nameEn: 'Qinghai',
    region: '西北',
    cities: [
      { name: '西宁', nameEn: 'Xining', tier: '三线' },
      { name: '海东', nameEn: 'Haidong', tier: '五线' },
      { name: '海西', nameEn: 'Haixi', tier: '五线' },
      { name: '海北', nameEn: 'Haibei', tier: '五线' },
      { name: '黄南', nameEn: 'Huangnan', tier: '五线' },
      { name: '海南', nameEn: 'Hainan', tier: '五线' },
      { name: '果洛', nameEn: 'Guoluo', tier: '五线' },
      { name: '玉树', nameEn: 'Yushu', tier: '五线' },
    ],
  },
  {
    name: '宁夏回族自治区',
    nameEn: 'Ningxia',
    region: '西北',
    cities: [
      { name: '银川', nameEn: 'Yinchuan', tier: '三线' },
      { name: '吴忠', nameEn: 'Wuzhong', tier: '五线' },
      { name: '石嘴山', nameEn: 'Shizuishan', tier: '五线' },
      { name: '中卫', nameEn: 'Zhongwei', tier: '五线' },
      { name: '固原', nameEn: 'Guyuan', tier: '五线' },
    ],
  },
  {
    name: '新疆维吾尔自治区',
    nameEn: 'Xinjiang',
    region: '西北',
    cities: [
      { name: '乌鲁木齐', nameEn: 'Urumqi', tier: '三线' },
      { name: '昌吉', nameEn: 'Changji', tier: '四线' },
      { name: '伊犁', nameEn: 'Yili', tier: '四线' },
      { name: '巴音郭楞', nameEn: 'Bayingol', tier: '五线' },
      { name: '喀什', nameEn: 'Kashgar', tier: '五线' },
      { name: '阿克苏', nameEn: 'Aksu', tier: '五线' },
      { name: '哈密', nameEn: 'Hami', tier: '五线' },
      { name: '克拉玛依', nameEn: 'Karamay', tier: '五线' },
      { name: '博尔塔拉', nameEn: 'Bortala', tier: '五线' },
      { name: '吐鲁番', nameEn: 'Turpan', tier: '五线' },
      { name: '和田', nameEn: 'Hotan', tier: '五线' },
      { name: '石河子', nameEn: 'Shihezi', tier: '五线' },
      { name: '克孜勒苏', nameEn: 'Kizilsu', tier: '五线' },
      { name: '阿勒泰', nameEn: 'Altay', tier: '五线' },
      { name: '塔城', nameEn: 'Tacheng', tier: '五线' },
    ],
  },

  // ==================== 港澳台地区 ====================
  {
    name: '香港特别行政区',
    nameEn: 'Hong Kong',
    region: '港澳台',
    cities: [
      { name: '香港', nameEn: 'Hong Kong', tier: '一线' },
    ],
  },
  {
    name: '澳门特别行政区',
    nameEn: 'Macau',
    region: '港澳台',
    cities: [
      { name: '澳门', nameEn: 'Macau', tier: '二线' },
    ],
  },
  {
    name: '台湾省',
    nameEn: 'Taiwan',
    region: '港澳台',
    cities: [
      { name: '台北', nameEn: 'Taipei', tier: '一线' },
      { name: '高雄', nameEn: 'Kaohsiung', tier: '二线' },
      { name: '台中', nameEn: 'Taichung', tier: '二线' },
      { name: '台南', nameEn: 'Tainan', tier: '三线' },
      { name: '新北', nameEn: 'New Taipei', tier: '二线' },
      { name: '桃园', nameEn: 'Taoyuan', tier: '三线' },
      { name: '新竹', nameEn: 'Hsinchu', tier: '三线' },
      { name: '基隆', nameEn: 'Keelung', tier: '四线' },
      { name: '嘉义', nameEn: 'Chiayi', tier: '四线' },
      { name: '彰化', nameEn: 'Changhua', tier: '四线' },
      { name: '屏东', nameEn: 'Pingtung', tier: '四线' },
      { name: '宜兰', nameEn: 'Yilan', tier: '四线' },
      { name: '花莲', nameEn: 'Hualien', tier: '四线' },
      { name: '台东', nameEn: 'Taitung', tier: '五线' },
      { name: '南投', nameEn: 'Nantou', tier: '五线' },
      { name: '苗栗', nameEn: 'Miaoli', tier: '五线' },
      { name: '云林', nameEn: 'Yunlin', tier: '五线' },
      { name: '澎湖', nameEn: 'Penghu', tier: '五线' },
      { name: '金门', nameEn: 'Kinmen', tier: '五线' },
      { name: '连江', nameEn: 'Lienchiang', tier: '五线' },
    ],
  },
];

// 获取所有省份名称
export const getProvinceNames = (): string[] => {
  return CHINA_PROVINCES.map(p => p.name);
};

// 根据省份名获取城市列表
export const getCitiesByProvince = (provinceName: string): City[] => {
  const province = CHINA_PROVINCES.find(p => p.name === provinceName);
  return province?.cities || [];
};

// 根据省份名获取城市名称列表
export const getCityNamesByProvince = (provinceName: string): string[] => {
  return getCitiesByProvince(provinceName).map(c => c.name);
};

// 获取城市详细信息
export const getCityInfo = (provinceName: string, cityName: string): City | undefined => {
  const province = CHINA_PROVINCES.find(p => p.name === provinceName);
  return province?.cities.find(c => c.name === cityName);
};

// 获取省份详细信息
export const getProvinceInfo = (provinceName: string): Province | undefined => {
  return CHINA_PROVINCES.find(p => p.name === provinceName);
};

// 城市等级标签
export const TIER_LABELS: Record<CityTier, string> = {
  '一线': '一线城市',
  '新一线': '新一线城市',
  '二线': '二线城市',
  '三线': '三线城市',
  '四线': '四线城市',
  '五线': '五线城市',
};

// 地区标签
export const REGION_LABELS: Record<Region, string> = {
  '华北': '华北地区',
  '东北': '东北地区',
  '华东': '华东地区',
  '华中': '华中地区',
  '华南': '华南地区',
  '西南': '西南地区',
  '西北': '西北地区',
  '港澳台': '港澳台地区',
};

// 省份选项（用于下拉框）
export const PROVINCE_OPTIONS = CHINA_PROVINCES.map(p => ({
  value: p.name,
  label: p.name,
  region: p.region,
}));

// 统计信息
export const getCityStatistics = () => {
  const stats = {
    total: 0,
    byTier: {} as Record<CityTier, number>,
    byRegion: {} as Record<Region, number>,
  };

  CHINA_PROVINCES.forEach(province => {
    province.cities.forEach(city => {
      stats.total++;
      stats.byTier[city.tier] = (stats.byTier[city.tier] || 0) + 1;
    });
    stats.byRegion[province.region] = (stats.byRegion[province.region] || 0) + province.cities.length;
  });

  return stats;
};
