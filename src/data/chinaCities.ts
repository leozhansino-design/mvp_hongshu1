// 中国省市数据 - 基于 china_city_dataset 项目
// 包含所有省份及其下属城市，按行政区划组织

export interface Province {
  name: string;
  cities: City[];
}

export interface City {
  name: string;
  fullName: string;
  tier?: string; // 城市等级：一线、新一线、二线、三线、四线、五线
}

// 城市等级常量
export const CITY_TIERS = {
  FIRST: '一线',
  NEW_FIRST: '新一线',
  SECOND: '二线',
  THIRD: '三线',
  FOURTH: '四线',
  FIFTH: '五线',
};

// 中国所有省份及城市数据
export const CHINA_PROVINCES: Province[] = [
  // 直辖市
  {
    name: '北京市',
    cities: [
      { name: '北京', fullName: '北京市', tier: CITY_TIERS.FIRST },
    ],
  },
  {
    name: '上海市',
    cities: [
      { name: '上海', fullName: '上海市', tier: CITY_TIERS.FIRST },
    ],
  },
  {
    name: '天津市',
    cities: [
      { name: '天津', fullName: '天津市', tier: CITY_TIERS.NEW_FIRST },
    ],
  },
  {
    name: '重庆市',
    cities: [
      { name: '重庆', fullName: '重庆市', tier: CITY_TIERS.NEW_FIRST },
    ],
  },
  // 广东省
  {
    name: '广东省',
    cities: [
      { name: '广州', fullName: '广州市', tier: CITY_TIERS.FIRST },
      { name: '深圳', fullName: '深圳市', tier: CITY_TIERS.FIRST },
      { name: '东莞', fullName: '东莞市', tier: CITY_TIERS.NEW_FIRST },
      { name: '佛山', fullName: '佛山市', tier: CITY_TIERS.SECOND },
      { name: '珠海', fullName: '珠海市', tier: CITY_TIERS.SECOND },
      { name: '惠州', fullName: '惠州市', tier: CITY_TIERS.THIRD },
      { name: '中山', fullName: '中山市', tier: CITY_TIERS.THIRD },
      { name: '汕头', fullName: '汕头市', tier: CITY_TIERS.THIRD },
      { name: '江门', fullName: '江门市', tier: CITY_TIERS.THIRD },
      { name: '湛江', fullName: '湛江市', tier: CITY_TIERS.THIRD },
      { name: '肇庆', fullName: '肇庆市', tier: CITY_TIERS.FOURTH },
      { name: '茂名', fullName: '茂名市', tier: CITY_TIERS.FOURTH },
      { name: '揭阳', fullName: '揭阳市', tier: CITY_TIERS.FOURTH },
      { name: '梅州', fullName: '梅州市', tier: CITY_TIERS.FOURTH },
      { name: '清远', fullName: '清远市', tier: CITY_TIERS.FOURTH },
      { name: '阳江', fullName: '阳江市', tier: CITY_TIERS.FOURTH },
      { name: '韶关', fullName: '韶关市', tier: CITY_TIERS.FOURTH },
      { name: '河源', fullName: '河源市', tier: CITY_TIERS.FIFTH },
      { name: '云浮', fullName: '云浮市', tier: CITY_TIERS.FIFTH },
      { name: '汕尾', fullName: '汕尾市', tier: CITY_TIERS.FIFTH },
      { name: '潮州', fullName: '潮州市', tier: CITY_TIERS.FIFTH },
    ],
  },
  // 江苏省
  {
    name: '江苏省',
    cities: [
      { name: '南京', fullName: '南京市', tier: CITY_TIERS.NEW_FIRST },
      { name: '苏州', fullName: '苏州市', tier: CITY_TIERS.NEW_FIRST },
      { name: '无锡', fullName: '无锡市', tier: CITY_TIERS.SECOND },
      { name: '常州', fullName: '常州市', tier: CITY_TIERS.SECOND },
      { name: '南通', fullName: '南通市', tier: CITY_TIERS.SECOND },
      { name: '徐州', fullName: '徐州市', tier: CITY_TIERS.SECOND },
      { name: '扬州', fullName: '扬州市', tier: CITY_TIERS.THIRD },
      { name: '盐城', fullName: '盐城市', tier: CITY_TIERS.THIRD },
      { name: '泰州', fullName: '泰州市', tier: CITY_TIERS.THIRD },
      { name: '镇江', fullName: '镇江市', tier: CITY_TIERS.THIRD },
      { name: '淮安', fullName: '淮安市', tier: CITY_TIERS.THIRD },
      { name: '连云港', fullName: '连云港市', tier: CITY_TIERS.FOURTH },
      { name: '宿迁', fullName: '宿迁市', tier: CITY_TIERS.FOURTH },
    ],
  },
  // 浙江省
  {
    name: '浙江省',
    cities: [
      { name: '杭州', fullName: '杭州市', tier: CITY_TIERS.NEW_FIRST },
      { name: '宁波', fullName: '宁波市', tier: CITY_TIERS.NEW_FIRST },
      { name: '温州', fullName: '温州市', tier: CITY_TIERS.SECOND },
      { name: '嘉兴', fullName: '嘉兴市', tier: CITY_TIERS.THIRD },
      { name: '绍兴', fullName: '绍兴市', tier: CITY_TIERS.THIRD },
      { name: '金华', fullName: '金华市', tier: CITY_TIERS.THIRD },
      { name: '台州', fullName: '台州市', tier: CITY_TIERS.THIRD },
      { name: '湖州', fullName: '湖州市', tier: CITY_TIERS.THIRD },
      { name: '丽水', fullName: '丽水市', tier: CITY_TIERS.FOURTH },
      { name: '衢州', fullName: '衢州市', tier: CITY_TIERS.FOURTH },
      { name: '舟山', fullName: '舟山市', tier: CITY_TIERS.FOURTH },
    ],
  },
  // 山东省
  {
    name: '山东省',
    cities: [
      { name: '青岛', fullName: '青岛市', tier: CITY_TIERS.NEW_FIRST },
      { name: '济南', fullName: '济南市', tier: CITY_TIERS.SECOND },
      { name: '烟台', fullName: '烟台市', tier: CITY_TIERS.SECOND },
      { name: '潍坊', fullName: '潍坊市', tier: CITY_TIERS.THIRD },
      { name: '临沂', fullName: '临沂市', tier: CITY_TIERS.THIRD },
      { name: '淄博', fullName: '淄博市', tier: CITY_TIERS.THIRD },
      { name: '济宁', fullName: '济宁市', tier: CITY_TIERS.THIRD },
      { name: '泰安', fullName: '泰安市', tier: CITY_TIERS.THIRD },
      { name: '威海', fullName: '威海市', tier: CITY_TIERS.THIRD },
      { name: '日照', fullName: '日照市', tier: CITY_TIERS.FOURTH },
      { name: '德州', fullName: '德州市', tier: CITY_TIERS.FOURTH },
      { name: '聊城', fullName: '聊城市', tier: CITY_TIERS.FOURTH },
      { name: '滨州', fullName: '滨州市', tier: CITY_TIERS.FOURTH },
      { name: '菏泽', fullName: '菏泽市', tier: CITY_TIERS.FOURTH },
      { name: '枣庄', fullName: '枣庄市', tier: CITY_TIERS.FOURTH },
      { name: '东营', fullName: '东营市', tier: CITY_TIERS.FOURTH },
    ],
  },
  // 河南省
  {
    name: '河南省',
    cities: [
      { name: '郑州', fullName: '郑州市', tier: CITY_TIERS.NEW_FIRST },
      { name: '洛阳', fullName: '洛阳市', tier: CITY_TIERS.THIRD },
      { name: '开封', fullName: '开封市', tier: CITY_TIERS.FOURTH },
      { name: '南阳', fullName: '南阳市', tier: CITY_TIERS.THIRD },
      { name: '新乡', fullName: '新乡市', tier: CITY_TIERS.FOURTH },
      { name: '安阳', fullName: '安阳市', tier: CITY_TIERS.FOURTH },
      { name: '许昌', fullName: '许昌市', tier: CITY_TIERS.FOURTH },
      { name: '商丘', fullName: '商丘市', tier: CITY_TIERS.FOURTH },
      { name: '信阳', fullName: '信阳市', tier: CITY_TIERS.FOURTH },
      { name: '周口', fullName: '周口市', tier: CITY_TIERS.FOURTH },
      { name: '驻马店', fullName: '驻马店市', tier: CITY_TIERS.FOURTH },
      { name: '平顶山', fullName: '平顶山市', tier: CITY_TIERS.FOURTH },
      { name: '焦作', fullName: '焦作市', tier: CITY_TIERS.FOURTH },
      { name: '濮阳', fullName: '濮阳市', tier: CITY_TIERS.FIFTH },
      { name: '漯河', fullName: '漯河市', tier: CITY_TIERS.FIFTH },
      { name: '三门峡', fullName: '三门峡市', tier: CITY_TIERS.FIFTH },
      { name: '鹤壁', fullName: '鹤壁市', tier: CITY_TIERS.FIFTH },
    ],
  },
  // 四川省
  {
    name: '四川省',
    cities: [
      { name: '成都', fullName: '成都市', tier: CITY_TIERS.NEW_FIRST },
      { name: '绵阳', fullName: '绵阳市', tier: CITY_TIERS.THIRD },
      { name: '德阳', fullName: '德阳市', tier: CITY_TIERS.FOURTH },
      { name: '南充', fullName: '南充市', tier: CITY_TIERS.FOURTH },
      { name: '宜宾', fullName: '宜宾市', tier: CITY_TIERS.FOURTH },
      { name: '自贡', fullName: '自贡市', tier: CITY_TIERS.FOURTH },
      { name: '乐山', fullName: '乐山市', tier: CITY_TIERS.FOURTH },
      { name: '泸州', fullName: '泸州市', tier: CITY_TIERS.FOURTH },
      { name: '达州', fullName: '达州市', tier: CITY_TIERS.FOURTH },
      { name: '内江', fullName: '内江市', tier: CITY_TIERS.FIFTH },
      { name: '遂宁', fullName: '遂宁市', tier: CITY_TIERS.FIFTH },
      { name: '攀枝花', fullName: '攀枝花市', tier: CITY_TIERS.FIFTH },
      { name: '眉山', fullName: '眉山市', tier: CITY_TIERS.FIFTH },
      { name: '广安', fullName: '广安市', tier: CITY_TIERS.FIFTH },
      { name: '资阳', fullName: '资阳市', tier: CITY_TIERS.FIFTH },
      { name: '广元', fullName: '广元市', tier: CITY_TIERS.FIFTH },
      { name: '雅安', fullName: '雅安市', tier: CITY_TIERS.FIFTH },
      { name: '巴中', fullName: '巴中市', tier: CITY_TIERS.FIFTH },
    ],
  },
  // 湖北省
  {
    name: '湖北省',
    cities: [
      { name: '武汉', fullName: '武汉市', tier: CITY_TIERS.NEW_FIRST },
      { name: '宜昌', fullName: '宜昌市', tier: CITY_TIERS.THIRD },
      { name: '襄阳', fullName: '襄阳市', tier: CITY_TIERS.THIRD },
      { name: '荆州', fullName: '荆州市', tier: CITY_TIERS.FOURTH },
      { name: '黄冈', fullName: '黄冈市', tier: CITY_TIERS.FOURTH },
      { name: '十堰', fullName: '十堰市', tier: CITY_TIERS.FOURTH },
      { name: '孝感', fullName: '孝感市', tier: CITY_TIERS.FOURTH },
      { name: '荆门', fullName: '荆门市', tier: CITY_TIERS.FOURTH },
      { name: '咸宁', fullName: '咸宁市', tier: CITY_TIERS.FIFTH },
      { name: '鄂州', fullName: '鄂州市', tier: CITY_TIERS.FIFTH },
      { name: '随州', fullName: '随州市', tier: CITY_TIERS.FIFTH },
      { name: '黄石', fullName: '黄石市', tier: CITY_TIERS.FOURTH },
      { name: '恩施', fullName: '恩施土家族苗族自治州', tier: CITY_TIERS.FIFTH },
    ],
  },
  // 湖南省
  {
    name: '湖南省',
    cities: [
      { name: '长沙', fullName: '长沙市', tier: CITY_TIERS.NEW_FIRST },
      { name: '株洲', fullName: '株洲市', tier: CITY_TIERS.THIRD },
      { name: '湘潭', fullName: '湘潭市', tier: CITY_TIERS.FOURTH },
      { name: '衡阳', fullName: '衡阳市', tier: CITY_TIERS.THIRD },
      { name: '岳阳', fullName: '岳阳市', tier: CITY_TIERS.THIRD },
      { name: '常德', fullName: '常德市', tier: CITY_TIERS.FOURTH },
      { name: '郴州', fullName: '郴州市', tier: CITY_TIERS.FOURTH },
      { name: '娄底', fullName: '娄底市', tier: CITY_TIERS.FOURTH },
      { name: '邵阳', fullName: '邵阳市', tier: CITY_TIERS.FOURTH },
      { name: '益阳', fullName: '益阳市', tier: CITY_TIERS.FOURTH },
      { name: '永州', fullName: '永州市', tier: CITY_TIERS.FOURTH },
      { name: '怀化', fullName: '怀化市', tier: CITY_TIERS.FIFTH },
      { name: '张家界', fullName: '张家界市', tier: CITY_TIERS.FIFTH },
      { name: '湘西', fullName: '湘西土家族苗族自治州', tier: CITY_TIERS.FIFTH },
    ],
  },
  // 福建省
  {
    name: '福建省',
    cities: [
      { name: '福州', fullName: '福州市', tier: CITY_TIERS.SECOND },
      { name: '厦门', fullName: '厦门市', tier: CITY_TIERS.SECOND },
      { name: '泉州', fullName: '泉州市', tier: CITY_TIERS.SECOND },
      { name: '漳州', fullName: '漳州市', tier: CITY_TIERS.THIRD },
      { name: '莆田', fullName: '莆田市', tier: CITY_TIERS.FOURTH },
      { name: '宁德', fullName: '宁德市', tier: CITY_TIERS.FOURTH },
      { name: '三明', fullName: '三明市', tier: CITY_TIERS.FOURTH },
      { name: '南平', fullName: '南平市', tier: CITY_TIERS.FIFTH },
      { name: '龙岩', fullName: '龙岩市', tier: CITY_TIERS.FOURTH },
    ],
  },
  // 安徽省
  {
    name: '安徽省',
    cities: [
      { name: '合肥', fullName: '合肥市', tier: CITY_TIERS.NEW_FIRST },
      { name: '芜湖', fullName: '芜湖市', tier: CITY_TIERS.THIRD },
      { name: '蚌埠', fullName: '蚌埠市', tier: CITY_TIERS.FOURTH },
      { name: '淮南', fullName: '淮南市', tier: CITY_TIERS.FOURTH },
      { name: '马鞍山', fullName: '马鞍山市', tier: CITY_TIERS.FOURTH },
      { name: '淮北', fullName: '淮北市', tier: CITY_TIERS.FIFTH },
      { name: '铜陵', fullName: '铜陵市', tier: CITY_TIERS.FIFTH },
      { name: '安庆', fullName: '安庆市', tier: CITY_TIERS.FOURTH },
      { name: '黄山', fullName: '黄山市', tier: CITY_TIERS.FIFTH },
      { name: '阜阳', fullName: '阜阳市', tier: CITY_TIERS.FOURTH },
      { name: '宿州', fullName: '宿州市', tier: CITY_TIERS.FOURTH },
      { name: '滁州', fullName: '滁州市', tier: CITY_TIERS.FOURTH },
      { name: '六安', fullName: '六安市', tier: CITY_TIERS.FOURTH },
      { name: '宣城', fullName: '宣城市', tier: CITY_TIERS.FIFTH },
      { name: '池州', fullName: '池州市', tier: CITY_TIERS.FIFTH },
      { name: '亳州', fullName: '亳州市', tier: CITY_TIERS.FOURTH },
    ],
  },
  // 江西省
  {
    name: '江西省',
    cities: [
      { name: '南昌', fullName: '南昌市', tier: CITY_TIERS.SECOND },
      { name: '赣州', fullName: '赣州市', tier: CITY_TIERS.THIRD },
      { name: '九江', fullName: '九江市', tier: CITY_TIERS.FOURTH },
      { name: '宜春', fullName: '宜春市', tier: CITY_TIERS.FOURTH },
      { name: '吉安', fullName: '吉安市', tier: CITY_TIERS.FOURTH },
      { name: '上饶', fullName: '上饶市', tier: CITY_TIERS.FOURTH },
      { name: '抚州', fullName: '抚州市', tier: CITY_TIERS.FIFTH },
      { name: '景德镇', fullName: '景德镇市', tier: CITY_TIERS.FOURTH },
      { name: '萍乡', fullName: '萍乡市', tier: CITY_TIERS.FIFTH },
      { name: '新余', fullName: '新余市', tier: CITY_TIERS.FIFTH },
      { name: '鹰潭', fullName: '鹰潭市', tier: CITY_TIERS.FIFTH },
    ],
  },
  // 河北省
  {
    name: '河北省',
    cities: [
      { name: '石家庄', fullName: '石家庄市', tier: CITY_TIERS.SECOND },
      { name: '唐山', fullName: '唐山市', tier: CITY_TIERS.THIRD },
      { name: '保定', fullName: '保定市', tier: CITY_TIERS.THIRD },
      { name: '廊坊', fullName: '廊坊市', tier: CITY_TIERS.THIRD },
      { name: '邯郸', fullName: '邯郸市', tier: CITY_TIERS.THIRD },
      { name: '沧州', fullName: '沧州市', tier: CITY_TIERS.FOURTH },
      { name: '秦皇岛', fullName: '秦皇岛市', tier: CITY_TIERS.THIRD },
      { name: '张家口', fullName: '张家口市', tier: CITY_TIERS.FOURTH },
      { name: '邢台', fullName: '邢台市', tier: CITY_TIERS.FOURTH },
      { name: '承德', fullName: '承德市', tier: CITY_TIERS.FIFTH },
      { name: '衡水', fullName: '衡水市', tier: CITY_TIERS.FIFTH },
    ],
  },
  // 辽宁省
  {
    name: '辽宁省',
    cities: [
      { name: '沈阳', fullName: '沈阳市', tier: CITY_TIERS.NEW_FIRST },
      { name: '大连', fullName: '大连市', tier: CITY_TIERS.NEW_FIRST },
      { name: '鞍山', fullName: '鞍山市', tier: CITY_TIERS.FOURTH },
      { name: '抚顺', fullName: '抚顺市', tier: CITY_TIERS.FIFTH },
      { name: '本溪', fullName: '本溪市', tier: CITY_TIERS.FIFTH },
      { name: '丹东', fullName: '丹东市', tier: CITY_TIERS.FOURTH },
      { name: '锦州', fullName: '锦州市', tier: CITY_TIERS.FOURTH },
      { name: '营口', fullName: '营口市', tier: CITY_TIERS.FIFTH },
      { name: '阜新', fullName: '阜新市', tier: CITY_TIERS.FIFTH },
      { name: '辽阳', fullName: '辽阳市', tier: CITY_TIERS.FIFTH },
      { name: '盘锦', fullName: '盘锦市', tier: CITY_TIERS.FOURTH },
      { name: '铁岭', fullName: '铁岭市', tier: CITY_TIERS.FIFTH },
      { name: '朝阳', fullName: '朝阳市', tier: CITY_TIERS.FIFTH },
      { name: '葫芦岛', fullName: '葫芦岛市', tier: CITY_TIERS.FIFTH },
    ],
  },
  // 陕西省
  {
    name: '陕西省',
    cities: [
      { name: '西安', fullName: '西安市', tier: CITY_TIERS.NEW_FIRST },
      { name: '咸阳', fullName: '咸阳市', tier: CITY_TIERS.FOURTH },
      { name: '宝鸡', fullName: '宝鸡市', tier: CITY_TIERS.FOURTH },
      { name: '渭南', fullName: '渭南市', tier: CITY_TIERS.FOURTH },
      { name: '汉中', fullName: '汉中市', tier: CITY_TIERS.FOURTH },
      { name: '安康', fullName: '安康市', tier: CITY_TIERS.FIFTH },
      { name: '榆林', fullName: '榆林市', tier: CITY_TIERS.FOURTH },
      { name: '延安', fullName: '延安市', tier: CITY_TIERS.FIFTH },
      { name: '商洛', fullName: '商洛市', tier: CITY_TIERS.FIFTH },
      { name: '铜川', fullName: '铜川市', tier: CITY_TIERS.FIFTH },
    ],
  },
  // 山西省
  {
    name: '山西省',
    cities: [
      { name: '太原', fullName: '太原市', tier: CITY_TIERS.SECOND },
      { name: '大同', fullName: '大同市', tier: CITY_TIERS.FOURTH },
      { name: '运城', fullName: '运城市', tier: CITY_TIERS.FOURTH },
      { name: '长治', fullName: '长治市', tier: CITY_TIERS.FOURTH },
      { name: '晋城', fullName: '晋城市', tier: CITY_TIERS.FOURTH },
      { name: '临汾', fullName: '临汾市', tier: CITY_TIERS.FOURTH },
      { name: '晋中', fullName: '晋中市', tier: CITY_TIERS.FOURTH },
      { name: '吕梁', fullName: '吕梁市', tier: CITY_TIERS.FIFTH },
      { name: '忻州', fullName: '忻州市', tier: CITY_TIERS.FIFTH },
      { name: '阳泉', fullName: '阳泉市', tier: CITY_TIERS.FIFTH },
      { name: '朔州', fullName: '朔州市', tier: CITY_TIERS.FIFTH },
    ],
  },
  // 云南省
  {
    name: '云南省',
    cities: [
      { name: '昆明', fullName: '昆明市', tier: CITY_TIERS.NEW_FIRST },
      { name: '曲靖', fullName: '曲靖市', tier: CITY_TIERS.FOURTH },
      { name: '大理', fullName: '大理白族自治州', tier: CITY_TIERS.FOURTH },
      { name: '玉溪', fullName: '玉溪市', tier: CITY_TIERS.FOURTH },
      { name: '昭通', fullName: '昭通市', tier: CITY_TIERS.FIFTH },
      { name: '保山', fullName: '保山市', tier: CITY_TIERS.FIFTH },
      { name: '丽江', fullName: '丽江市', tier: CITY_TIERS.FOURTH },
      { name: '普洱', fullName: '普洱市', tier: CITY_TIERS.FIFTH },
      { name: '临沧', fullName: '临沧市', tier: CITY_TIERS.FIFTH },
      { name: '红河', fullName: '红河哈尼族彝族自治州', tier: CITY_TIERS.FOURTH },
      { name: '文山', fullName: '文山壮族苗族自治州', tier: CITY_TIERS.FIFTH },
      { name: '西双版纳', fullName: '西双版纳傣族自治州', tier: CITY_TIERS.FIFTH },
    ],
  },
  // 贵州省
  {
    name: '贵州省',
    cities: [
      { name: '贵阳', fullName: '贵阳市', tier: CITY_TIERS.SECOND },
      { name: '遵义', fullName: '遵义市', tier: CITY_TIERS.THIRD },
      { name: '六盘水', fullName: '六盘水市', tier: CITY_TIERS.FIFTH },
      { name: '安顺', fullName: '安顺市', tier: CITY_TIERS.FIFTH },
      { name: '毕节', fullName: '毕节市', tier: CITY_TIERS.FIFTH },
      { name: '铜仁', fullName: '铜仁市', tier: CITY_TIERS.FIFTH },
      { name: '黔南', fullName: '黔南布依族苗族自治州', tier: CITY_TIERS.FIFTH },
      { name: '黔东南', fullName: '黔东南苗族侗族自治州', tier: CITY_TIERS.FIFTH },
      { name: '黔西南', fullName: '黔西南布依族苗族自治州', tier: CITY_TIERS.FIFTH },
    ],
  },
  // 广西壮族自治区
  {
    name: '广西壮族自治区',
    cities: [
      { name: '南宁', fullName: '南宁市', tier: CITY_TIERS.SECOND },
      { name: '柳州', fullName: '柳州市', tier: CITY_TIERS.THIRD },
      { name: '桂林', fullName: '桂林市', tier: CITY_TIERS.THIRD },
      { name: '梧州', fullName: '梧州市', tier: CITY_TIERS.FIFTH },
      { name: '北海', fullName: '北海市', tier: CITY_TIERS.FOURTH },
      { name: '玉林', fullName: '玉林市', tier: CITY_TIERS.FOURTH },
      { name: '钦州', fullName: '钦州市', tier: CITY_TIERS.FIFTH },
      { name: '百色', fullName: '百色市', tier: CITY_TIERS.FIFTH },
      { name: '贵港', fullName: '贵港市', tier: CITY_TIERS.FIFTH },
      { name: '河池', fullName: '河池市', tier: CITY_TIERS.FIFTH },
      { name: '来宾', fullName: '来宾市', tier: CITY_TIERS.FIFTH },
      { name: '崇左', fullName: '崇左市', tier: CITY_TIERS.FIFTH },
      { name: '防城港', fullName: '防城港市', tier: CITY_TIERS.FIFTH },
      { name: '贺州', fullName: '贺州市', tier: CITY_TIERS.FIFTH },
    ],
  },
  // 黑龙江省
  {
    name: '黑龙江省',
    cities: [
      { name: '哈尔滨', fullName: '哈尔滨市', tier: CITY_TIERS.SECOND },
      { name: '齐齐哈尔', fullName: '齐齐哈尔市', tier: CITY_TIERS.FOURTH },
      { name: '大庆', fullName: '大庆市', tier: CITY_TIERS.FOURTH },
      { name: '牡丹江', fullName: '牡丹江市', tier: CITY_TIERS.FOURTH },
      { name: '佳木斯', fullName: '佳木斯市', tier: CITY_TIERS.FIFTH },
      { name: '鸡西', fullName: '鸡西市', tier: CITY_TIERS.FIFTH },
      { name: '双鸭山', fullName: '双鸭山市', tier: CITY_TIERS.FIFTH },
      { name: '伊春', fullName: '伊春市', tier: CITY_TIERS.FIFTH },
      { name: '七台河', fullName: '七台河市', tier: CITY_TIERS.FIFTH },
      { name: '鹤岗', fullName: '鹤岗市', tier: CITY_TIERS.FIFTH },
      { name: '绥化', fullName: '绥化市', tier: CITY_TIERS.FIFTH },
      { name: '黑河', fullName: '黑河市', tier: CITY_TIERS.FIFTH },
    ],
  },
  // 吉林省
  {
    name: '吉林省',
    cities: [
      { name: '长春', fullName: '长春市', tier: CITY_TIERS.SECOND },
      { name: '吉林', fullName: '吉林市', tier: CITY_TIERS.FOURTH },
      { name: '四平', fullName: '四平市', tier: CITY_TIERS.FIFTH },
      { name: '通化', fullName: '通化市', tier: CITY_TIERS.FIFTH },
      { name: '白城', fullName: '白城市', tier: CITY_TIERS.FIFTH },
      { name: '辽源', fullName: '辽源市', tier: CITY_TIERS.FIFTH },
      { name: '松原', fullName: '松原市', tier: CITY_TIERS.FIFTH },
      { name: '白山', fullName: '白山市', tier: CITY_TIERS.FIFTH },
      { name: '延边', fullName: '延边朝鲜族自治州', tier: CITY_TIERS.FOURTH },
    ],
  },
  // 甘肃省
  {
    name: '甘肃省',
    cities: [
      { name: '兰州', fullName: '兰州市', tier: CITY_TIERS.THIRD },
      { name: '天水', fullName: '天水市', tier: CITY_TIERS.FIFTH },
      { name: '白银', fullName: '白银市', tier: CITY_TIERS.FIFTH },
      { name: '庆阳', fullName: '庆阳市', tier: CITY_TIERS.FIFTH },
      { name: '平凉', fullName: '平凉市', tier: CITY_TIERS.FIFTH },
      { name: '酒泉', fullName: '酒泉市', tier: CITY_TIERS.FIFTH },
      { name: '张掖', fullName: '张掖市', tier: CITY_TIERS.FIFTH },
      { name: '武威', fullName: '武威市', tier: CITY_TIERS.FIFTH },
      { name: '定西', fullName: '定西市', tier: CITY_TIERS.FIFTH },
      { name: '陇南', fullName: '陇南市', tier: CITY_TIERS.FIFTH },
      { name: '嘉峪关', fullName: '嘉峪关市', tier: CITY_TIERS.FIFTH },
      { name: '金昌', fullName: '金昌市', tier: CITY_TIERS.FIFTH },
    ],
  },
  // 内蒙古自治区
  {
    name: '内蒙古自治区',
    cities: [
      { name: '呼和浩特', fullName: '呼和浩特市', tier: CITY_TIERS.THIRD },
      { name: '包头', fullName: '包头市', tier: CITY_TIERS.FOURTH },
      { name: '鄂尔多斯', fullName: '鄂尔多斯市', tier: CITY_TIERS.FOURTH },
      { name: '赤峰', fullName: '赤峰市', tier: CITY_TIERS.FOURTH },
      { name: '通辽', fullName: '通辽市', tier: CITY_TIERS.FIFTH },
      { name: '呼伦贝尔', fullName: '呼伦贝尔市', tier: CITY_TIERS.FIFTH },
      { name: '巴彦淖尔', fullName: '巴彦淖尔市', tier: CITY_TIERS.FIFTH },
      { name: '乌兰察布', fullName: '乌兰察布市', tier: CITY_TIERS.FIFTH },
      { name: '乌海', fullName: '乌海市', tier: CITY_TIERS.FIFTH },
    ],
  },
  // 宁夏回族自治区
  {
    name: '宁夏回族自治区',
    cities: [
      { name: '银川', fullName: '银川市', tier: CITY_TIERS.THIRD },
      { name: '吴忠', fullName: '吴忠市', tier: CITY_TIERS.FIFTH },
      { name: '石嘴山', fullName: '石嘴山市', tier: CITY_TIERS.FIFTH },
      { name: '固原', fullName: '固原市', tier: CITY_TIERS.FIFTH },
      { name: '中卫', fullName: '中卫市', tier: CITY_TIERS.FIFTH },
    ],
  },
  // 青海省
  {
    name: '青海省',
    cities: [
      { name: '西宁', fullName: '西宁市', tier: CITY_TIERS.FOURTH },
      { name: '海东', fullName: '海东市', tier: CITY_TIERS.FIFTH },
      { name: '海西', fullName: '海西蒙古族藏族自治州', tier: CITY_TIERS.FIFTH },
      { name: '海北', fullName: '海北藏族自治州', tier: CITY_TIERS.FIFTH },
      { name: '海南', fullName: '海南藏族自治州', tier: CITY_TIERS.FIFTH },
      { name: '黄南', fullName: '黄南藏族自治州', tier: CITY_TIERS.FIFTH },
      { name: '果洛', fullName: '果洛藏族自治州', tier: CITY_TIERS.FIFTH },
      { name: '玉树', fullName: '玉树藏族自治州', tier: CITY_TIERS.FIFTH },
    ],
  },
  // 新疆维吾尔自治区
  {
    name: '新疆维吾尔自治区',
    cities: [
      { name: '乌鲁木齐', fullName: '乌鲁木齐市', tier: CITY_TIERS.SECOND },
      { name: '克拉玛依', fullName: '克拉玛依市', tier: CITY_TIERS.FIFTH },
      { name: '吐鲁番', fullName: '吐鲁番市', tier: CITY_TIERS.FIFTH },
      { name: '哈密', fullName: '哈密市', tier: CITY_TIERS.FIFTH },
      { name: '阿克苏', fullName: '阿克苏地区', tier: CITY_TIERS.FIFTH },
      { name: '喀什', fullName: '喀什地区', tier: CITY_TIERS.FIFTH },
      { name: '和田', fullName: '和田地区', tier: CITY_TIERS.FIFTH },
      { name: '伊犁', fullName: '伊犁哈萨克自治州', tier: CITY_TIERS.FOURTH },
      { name: '塔城', fullName: '塔城地区', tier: CITY_TIERS.FIFTH },
      { name: '阿勒泰', fullName: '阿勒泰地区', tier: CITY_TIERS.FIFTH },
      { name: '库尔勒', fullName: '巴音郭楞蒙古自治州', tier: CITY_TIERS.FOURTH },
      { name: '昌吉', fullName: '昌吉回族自治州', tier: CITY_TIERS.FIFTH },
      { name: '博乐', fullName: '博尔塔拉蒙古自治州', tier: CITY_TIERS.FIFTH },
      { name: '克州', fullName: '克孜勒苏柯尔克孜自治州', tier: CITY_TIERS.FIFTH },
    ],
  },
  // 西藏自治区
  {
    name: '西藏自治区',
    cities: [
      { name: '拉萨', fullName: '拉萨市', tier: CITY_TIERS.FOURTH },
      { name: '日喀则', fullName: '日喀则市', tier: CITY_TIERS.FIFTH },
      { name: '昌都', fullName: '昌都市', tier: CITY_TIERS.FIFTH },
      { name: '林芝', fullName: '林芝市', tier: CITY_TIERS.FIFTH },
      { name: '山南', fullName: '山南市', tier: CITY_TIERS.FIFTH },
      { name: '那曲', fullName: '那曲市', tier: CITY_TIERS.FIFTH },
      { name: '阿里', fullName: '阿里地区', tier: CITY_TIERS.FIFTH },
    ],
  },
  // 海南省
  {
    name: '海南省',
    cities: [
      { name: '海口', fullName: '海口市', tier: CITY_TIERS.THIRD },
      { name: '三亚', fullName: '三亚市', tier: CITY_TIERS.THIRD },
      { name: '三沙', fullName: '三沙市', tier: CITY_TIERS.FIFTH },
      { name: '儋州', fullName: '儋州市', tier: CITY_TIERS.FIFTH },
      { name: '琼海', fullName: '琼海市', tier: CITY_TIERS.FIFTH },
      { name: '文昌', fullName: '文昌市', tier: CITY_TIERS.FIFTH },
      { name: '万宁', fullName: '万宁市', tier: CITY_TIERS.FIFTH },
      { name: '东方', fullName: '东方市', tier: CITY_TIERS.FIFTH },
    ],
  },
  // 港澳台
  {
    name: '香港特别行政区',
    cities: [
      { name: '香港', fullName: '香港特别行政区', tier: CITY_TIERS.FIRST },
    ],
  },
  {
    name: '澳门特别行政区',
    cities: [
      { name: '澳门', fullName: '澳门特别行政区', tier: CITY_TIERS.SECOND },
    ],
  },
  {
    name: '台湾省',
    cities: [
      { name: '台北', fullName: '台北市', tier: CITY_TIERS.FIRST },
      { name: '高雄', fullName: '高雄市', tier: CITY_TIERS.SECOND },
      { name: '台中', fullName: '台中市', tier: CITY_TIERS.SECOND },
      { name: '台南', fullName: '台南市', tier: CITY_TIERS.THIRD },
      { name: '新北', fullName: '新北市', tier: CITY_TIERS.SECOND },
      { name: '桃园', fullName: '桃园市', tier: CITY_TIERS.THIRD },
    ],
  },
];

// 获取所有省份名称列表
export function getProvinceNames(): string[] {
  return CHINA_PROVINCES.map(p => p.name);
}

// 根据省份名获取城市列表
export function getCitiesByProvince(provinceName: string): City[] {
  const province = CHINA_PROVINCES.find(p => p.name === provinceName);
  return province ? province.cities : [];
}

// 根据省份名获取城市名称列表
export function getCityNamesByProvince(provinceName: string): string[] {
  return getCitiesByProvince(provinceName).map(c => c.name);
}

// 搜索城市（跨省份）
export function searchCities(keyword: string): { province: string; city: City }[] {
  const results: { province: string; city: City }[] = [];
  for (const province of CHINA_PROVINCES) {
    for (const city of province.cities) {
      if (city.name.includes(keyword) || city.fullName.includes(keyword)) {
        results.push({ province: province.name, city });
      }
    }
  }
  return results;
}

// 获取所有城市的扁平列表（兼容旧版 CHINA_CITIES）
export function getAllCityNames(): string[] {
  const cities: string[] = [];
  for (const province of CHINA_PROVINCES) {
    for (const city of province.cities) {
      cities.push(city.fullName);
    }
  }
  return cities;
}
