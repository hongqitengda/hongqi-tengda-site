(() => {
  'use strict';
  if (!Array.isArray(window.HQTD_CATALOG_DATA)) window.HQTD_CATALOG_DATA = [];
  const source = window.HQTD_EMERGING_DATA;
  if (!source || !Array.isArray(source.records)) return;

  const has = new Set(window.HQTD_CATALOG_DATA.map(item => String(item.id || '')));
  const fmt = value => (typeof value === 'number' && Number.isFinite(value)) ? `${Number(value).toFixed(1)}%` : (value ? String(value) : '—');
  const average = r => {
    if (typeof r.recoveryAvg === 'number' && Number.isFinite(r.recoveryAvg) && !(r.recoveryAvg === 0 && ![r.recovery1,r.recovery2].some(v => typeof v === 'number' && v > 0))) return r.recoveryAvg;
    const nums = [r.recovery1, r.recovery2].filter(v => typeof v === 'number' && Number.isFinite(v));
    return nums.length ? nums.reduce((a,b) => a+b,0) / nums.length : null;
  };
  const code = r => `ENV-${String(r.acronym || r.categoryId || 'TARGET').replace(/[^A-Za-z0-9]+/g,'').toUpperCase()}-${String(Number(r.serial || 0)).padStart(3,'0')}`;

  source.records.forEach(r => {
    const id = code(r);
    if (has.has(id)) return;
    const avg = average(r);
    const recText = `回收率1 ${fmt(r.recovery1)}；回收率2 ${fmt(r.recovery2)}；平均 ${avg == null ? '—' : fmt(avg)}`;
    window.HQTD_CATALOG_DATA.push({
      id,
      board: '环境检测',
      category: r.category || '新污染物',
      service: r.cn || r.en || '新污染物目标物检测',
      details: `${r.en || ''}${r.abbr ? ` · ${r.abbr}` : ''}${r.cas ? ` · CAS ${r.cas}` : ''} · ${recText}`,
      unit: '项',
      price: null,
      priceText: '待评估',
      cycle: '技术评估后确认',
      priority: '专题项目',
      image: 'assets/images/environment-topics/emerging-contaminants.png',
      imageAlt: `${r.cn || r.en || '新污染物'} 环境检测`,
      detailUrl: `emerging-contaminants.html?target=${encodeURIComponent(r.id)}#database`,
      envRecordId: r.id,
      recovery1: r.recovery1,
      recovery2: r.recovery2,
      recoveryAvg: avg
    });
  });
})();

;(() => {
  if (!Array.isArray(window.HQTD_CATALOG_DATA)) return;
  const has = new Set(window.HQTD_CATALOG_DATA.map(item => String(item.id || '')));
  const extra = [
    {id:'ENV-GHG-CH4',board:'环境检测',category:'温室气体',service:'CH₄ 甲烷精准检测',details:'S-GC/GC 检测；适用于土壤及环境样品，具体采样容器、浓度范围与质控方案按项目确认。',unit:'项',price:null,priceText:'待评估',cycle:'技术评估后确认',image:'assets/images/environment-topics/greenhouse-gas.png',imageAlt:'甲烷温室气体检测',detailUrl:'greenhouse-gas-detection.html'},
    {id:'ENV-GHG-CO2',board:'环境检测',category:'温室气体',service:'CO₂ 二氧化碳精准检测',details:'S-GC/GC 检测；支持科研监测与排放分析，采样时间、点位与浓度范围按项目确认。',unit:'项',price:null,priceText:'待评估',cycle:'技术评估后确认',image:'assets/images/environment-topics/greenhouse-gas.png',imageAlt:'二氧化碳温室气体检测',detailUrl:'greenhouse-gas-detection.html'},
    {id:'ENV-GHG-N2O',board:'环境检测',category:'温室气体',service:'N₂O 氧化亚氮精准检测',details:'S-GC/GC 检测；适用于环境样品与排放研究，具体检测路线按浓度范围与采样条件确认。',unit:'项',price:null,priceText:'待评估',cycle:'技术评估后确认',image:'assets/images/environment-topics/greenhouse-gas.png',imageAlt:'氧化亚氮温室气体检测',detailUrl:'greenhouse-gas-detection.html'},
    {id:'ENV-MP-COUNT',board:'环境检测',category:'微塑料',service:'微塑料颗粒计数与粒径/形貌分析',details:'适用于水样、沉积物及环境样品；颗粒计数、粒径区间与形貌统计按样品条件确认。',unit:'项',price:null,priceText:'待评估',cycle:'技术评估后确认',image:'assets/images/environment-topics/microplastics.png',imageAlt:'微塑料检测',detailUrl:'microplastics-detection.html'},
    {id:'ENV-MP-RAMAN',board:'环境检测',category:'微塑料',service:'Raman 微塑料聚合物识别',details:'基于 Raman 光谱进行微塑料聚合物识别与匹配，具体粒径范围与前处理方案按样品确认。',unit:'项',price:null,priceText:'待评估',cycle:'技术评估后确认',image:'assets/images/environment-topics/microplastics.png',imageAlt:'Raman微塑料识别',detailUrl:'microplastics-detection.html'},
    {id:'ENV-MP-FTIR',board:'环境检测',category:'微塑料',service:'μ-FTIR 微塑料聚合物识别',details:'基于 μ-FTIR 进行聚合物类型识别与谱库匹配，具体适用粒径和样品前处理按项目评估。',unit:'项',price:null,priceText:'待评估',cycle:'技术评估后确认',image:'assets/images/environment-topics/microplastics.png',imageAlt:'μ-FTIR微塑料识别',detailUrl:'microplastics-detection.html'},
    {id:'ENV-CUSTOM-6PPDQ',board:'环境检测',category:'综合检测与方法开发',service:'6PPD-Q 类及相关目标物检测',details:'面向轮胎源污染物、转化产物及其他特定有机目标物；前处理、仪器与定量路线按基质和研究目标确认。',unit:'项',price:null,priceText:'待评估',cycle:'技术评估后确认',image:'assets/images/environment-topics/method-development-soil-carbon.png',imageAlt:'综合检测与方法开发',detailUrl:'comprehensive-testing-method-development.html'},
    {id:'ENV-CUSTOM-ELEMENTS',board:'环境检测',category:'综合检测与方法开发',service:'重金属与多元素分析',details:'适用于水、土壤、沉积物、材料等样品；元素范围、消解方案和检出要求按项目确认。',unit:'项',price:null,priceText:'待评估',cycle:'技术评估后确认',image:'assets/images/environment-topics/method-development-soil-carbon.png',imageAlt:'重金属与多元素分析',detailUrl:'comprehensive-testing-method-development.html'},
    {id:'ENV-CUSTOM-SOILCARBON',board:'环境检测',category:'综合检测与方法开发',service:'土壤碳指标及不同碳组分分析',details:'TC、TOC、DOC、POC、MAOC、MBC、重组TOC、轻组TOC等可按研究目的组合。',unit:'项',price:null,priceText:'待评估',cycle:'技术评估后确认',image:'assets/images/environment-topics/method-development-soil-carbon.png',imageAlt:'土壤碳指标及组分分析',detailUrl:'comprehensive-testing-method-development.html'},
    {id:'ENV-CUSTOM-METHOD',board:'环境检测',category:'综合检测与方法开发',service:'检测方法开发与定制',details:'针对特殊基质、新目标物或非标准科研问题，支持前处理、仪器条件、校准、质量控制和数据交付方案定制。',unit:'项',price:null,priceText:'待评估',cycle:'技术评估后确认',image:'assets/images/environment-topics/method-development-soil-carbon.png',imageAlt:'检测方法开发',detailUrl:'comprehensive-testing-method-development.html'}
  ];
  extra.forEach(item => { if (!has.has(item.id)) window.HQTD_CATALOG_DATA.push(item); });
})();
;(() => {
  if (!Array.isArray(window.HQTD_CATALOG_DATA)) return;
  const has = new Set(window.HQTD_CATALOG_DATA.map(item => String(item.id || '')));
  const source = [{"id":"ENV-WS-W001","group":"water","serial":1,"sample":"水","test":"PH值","instrument":"ph计，雷磁PHS-3E","standard":"HJ1147-2020 水质 pH值的测定 电极法","category":"水质基础理化"},{"id":"ENV-WS-W002","group":"water","serial":2,"sample":"水","test":"电导率","instrument":"电导率仪，雷磁DDSJ-308A","standard":"DZ/T 0064.6-2021 地下水质分析方法 第6部分：\n电导率的测定 电极法","category":"水质基础理化"},{"id":"ENV-WS-W003","group":"water","serial":3,"sample":"水","test":"TDS","instrument":"电导率仪，雷磁DDSJ-308A","standard":"/","category":"水质基础理化"},{"id":"ENV-WS-W004","group":"water","serial":4,"sample":"水","test":"CODMn","instrument":"滴定管","standard":"GB/T 15456-2019 工业循环冷却水中化学需氧量（COD）的测定 高锰酸盐指数","category":"水质基础理化"},{"id":"ENV-WS-W005","group":"water","serial":5,"sample":"水","test":"CODCr","instrument":"滴定管","standard":"GB/T 15456-2019 工业循环冷却水中化学需氧量（COD）的测定 高锰酸盐指数法","category":"水质基础理化"},{"id":"ENV-WS-W006","group":"water","serial":6,"sample":"水","test":"DOC","instrument":"总有机碳分析仪，岛津TOC-L","standard":"NPOC法","category":"水质有机碳"},{"id":"ENV-WS-W007","group":"water","serial":7,"sample":"水","test":"TOC","instrument":"总有机碳分析仪，岛津TOC-L","standard":"NPOC法","category":"水质有机碳"},{"id":"ENV-WS-W008","group":"water","serial":8,"sample":"水","test":"TC,TIC,TOC","instrument":"总有机碳分析仪，岛津TOC-L","standard":"差值法","category":"水质有机碳"},{"id":"ENV-WS-W009","group":"water","serial":9,"sample":"水","test":"TN，全氮","instrument":"连续流动分析仪，SEAL AAA","standard":"HJ 636-2012 水质 总氮的测定 碱性过硫酸钾消解紫外分光光度法","category":"水质营养盐"},{"id":"ENV-WS-W010","group":"water","serial":10,"sample":"水","test":"NH4+，铵态氮","instrument":"连续流动分析仪，SEAL AAA","standard":"水杨酸法-连续流动分析仪","category":"水质营养盐"},{"id":"ENV-WS-W011","group":"water","serial":11,"sample":"水","test":"NO3-，硝态氮","instrument":"连续流动分析仪，SEAL AAA","standard":"硫酸肼法-连续流动分析仪","category":"水质营养盐"},{"id":"ENV-WS-W012","group":"water","serial":12,"sample":"水","test":"NO2-，亚硝态氮","instrument":"连续流动分析仪，SEAL AAA","standard":"/","category":"水质营养盐"},{"id":"ENV-WS-W013","group":"water","serial":13,"sample":"水","test":"TP，全磷","instrument":"连续流动分析仪，SEAL AAA","standard":"HJ 670-2013 水质连续流动-钼酸铵分光光度法","category":"水质营养盐"},{"id":"ENV-WS-W014","group":"water","serial":14,"sample":"水","test":"SRP，磷酸盐","instrument":"连续流动分析仪，SEAL AAA","standard":"HJ 670-2013 水质 磷酸盐和总磷的测定 \n连续流动-钼酸铵分光光度法","category":"水质营养盐"},{"id":"ENV-WS-W015","group":"water","serial":15,"sample":"水","test":"溶解态硅酸盐","instrument":"连续流动分析仪，SEAL AAA","standard":"/","category":"水质营养盐"},{"id":"ENV-WS-W016","group":"water","serial":16,"sample":"水","test":"硫化氢","instrument":"连续流动分析仪，SEAL AAA","standard":"/","category":"水质营养盐"},{"id":"ENV-WS-W017","group":"water","serial":17,"sample":"污水","test":"TN（需消解）","instrument":"连续流动分析仪，SEAL AAA；高压灭菌锅","standard":"HJ 636-2012 水质 总氮的测定 碱性过硫酸钾消解紫外分光光度法","category":"水质营养盐"},{"id":"ENV-WS-W018","group":"water","serial":18,"sample":"污水","test":"TP（需消解）","instrument":"连续流动分析仪，SEAL AAA；高压灭菌锅","standard":"/","category":"水质营养盐"},{"id":"ENV-WS-W019","group":"water","serial":19,"sample":"水","test":"BOD5","instrument":"滴定管","standard":"HJ 505-2009 水质 五日生化需氧量（BOD5）的测定 稀释与接种法","category":"水质基础理化"},{"id":"ENV-WS-W020","group":"water","serial":20,"sample":"水","test":"Cu、Zn、Ni、Pb、Cd、Cr、K、Ca、Na、Mg、Fe、As、Mo、Mn、Au、Hg、Co等重金属","instrument":"ICPMS，赛默飞世尔，ICAPQ","standard":"HJ 700-2014 水质 65 种元素的测定 \n电感耦合等离子体质谱法\nDB35/T 1142-2020","category":"水质元素与重金属"},{"id":"ENV-WS-W021","group":"water","serial":21,"sample":"水","test":"As 、Hg、Se","instrument":"原子荧光，北京海光，AFS-9700A","standard":"/","category":"水质元素与重金属"},{"id":"ENV-WS-W022","group":"water","serial":22,"sample":"水","test":"Cu、 Zn、 Ni、 Pb、 Cd 、Cr、Fe、Mn等","instrument":"原子吸收，PE，PinAAcle900T","standard":"GB/T 7475-1987 水质 铜、锌、铅、镉的测定 \n原子吸收分光光度法","category":"水质元素与重金属"},{"id":"ENV-WS-W023","group":"water","serial":23,"sample":"水","test":"二价铁","instrument":"紫外可见分光光度计，普析 T10","standard":"/","category":"水质元素与重金属"},{"id":"ENV-WS-W024","group":"water","serial":24,"sample":"水","test":"三价铁","instrument":"紫外可见分光光度计，普析 T10\nICPMS，赛默飞世尔，ICAPQ","standard":"总铁-二价铁","category":"水质元素与重金属"},{"id":"ENV-WS-W025","group":"water","serial":25,"sample":"水","test":"六价铬","instrument":"紫外可见分光光度计，普析 T10","standard":"GB/T 7467-1987 水质 六价铬的测定 二苯碳酰二肼分光光度法","category":"水质元素与重金属"},{"id":"ENV-WS-W026","group":"water","serial":26,"sample":"水","test":"叶绿素A","instrument":"紫外可见分光光度计，普析 T10","standard":"HJ 897-2017 水质 叶绿素a的测定 分光光度法","category":"水质基础理化"},{"id":"ENV-WS-W027","group":"water","serial":27,"sample":"水","test":"阳离子：K+ 、Na+ 、Ca2+、 Mg2+","instrument":"离子色谱仪，赛默飞世尔，ICS2100","standard":"HJ 812-2016 水质 可溶性阳离子（Li+、\nNa+、NH4+、K+、Ca2+、Mg2+）\n的测定 离子色谱法","category":"水质离子"},{"id":"ENV-WS-W028","group":"water","serial":28,"sample":"水","test":"阴离子：F-、Cl- 、SO42-、NO3-","instrument":"离子色谱仪，赛默飞世尔，ICS2100","standard":"HJ 84-2016 水质 无机阴离子（F-、Cl-、NO2-、Br-、NO3-、PO43-、SO32-、SO42-）的测定 离子色谱法","category":"水质离子"},{"id":"ENV-WS-W029","group":"water","serial":29,"sample":"水","test":"碳酸根、碳酸氢根","instrument":"滴定管","standard":"DZ/T 0064.49-2021 地下水质分析方法第49部分：碳酸根、重碳酸根和氢氧根离子的测定 \n滴定法","category":"水质离子"},{"id":"ENV-WS-W030","group":"water","serial":30,"sample":"水","test":"悬浮颗粒物","instrument":"抽滤装置，烘箱","standard":"GB/T 11901-1989 水质 悬浮物的测定 \n重量法","category":"水质基础理化"},{"id":"ENV-WS-S001","group":"soil","serial":1,"sample":"土壤","test":"PH值","instrument":"ph计，雷磁PHS-3E","standard":"HJ962-2018 土壤 pH值的测定 电位法","category":"土壤基础理化"},{"id":"ENV-WS-S002","group":"soil","serial":2,"sample":"土壤","test":"电导率","instrument":"电导率仪，雷磁DDSJ-308A","standard":"HJ802-2016 土壤 电导率的测定 电极法","category":"土壤基础理化"},{"id":"ENV-WS-S003","group":"soil","serial":3,"sample":"土壤","test":"含水率","instrument":"电热恒温鼓风干燥箱，\n上海三发DHG-9202-3A型","standard":"HJ 613-2011 \n土壤 干物质和水分的测定 重量法","category":"土壤基础理化"},{"id":"ENV-WS-S004","group":"soil","serial":4,"sample":"土壤","test":"冷冻干燥研磨过筛","instrument":"真空冷冻干燥机，\n德国christ Alphal-4Ldplus","standard":"/","category":"土壤基础理化"},{"id":"ENV-WS-S005","group":"soil","serial":5,"sample":"土壤","test":"TN，全氮","instrument":"连续流动分析仪，SEAL AAA","standard":"NY/T 53-1987                                            \n 土壤全氮测定法 (半微量开氏法)","category":"土壤养分"},{"id":"ENV-WS-S006","group":"soil","serial":6,"sample":"土壤","test":"NH4+，铵态氮","instrument":"连续流动分析仪，SEAL AAA","standard":"GB/T 42487-2023 土壤质量 土壤硝态氮、亚硝态氮和铵态氮的测定 氯化钾溶液浸提流动分析法","category":"土壤养分"},{"id":"ENV-WS-S007","group":"soil","serial":7,"sample":"土壤","test":"NO3-，硝态氮","instrument":"连续流动分析仪，SEAL AAA","standard":"GB/T 42487-2023 土壤质量 土壤硝态氮、亚硝态氮和铵态氮的测定 氯化钾溶液浸提流动分析法","category":"土壤养分"},{"id":"ENV-WS-S008","group":"soil","serial":8,"sample":"土壤","test":"NO2-，亚硝态氮","instrument":"连续流动分析仪，SEAL AAA","standard":"GB/T 42487-2023 土壤质量 土壤硝态氮、亚硝态氮和铵态氮的测定 氯化钾溶液浸提流动分析法","category":"土壤养分"},{"id":"ENV-WS-S009","group":"soil","serial":9,"sample":"土壤","test":"碱解氮（水解氮）","instrument":"滴定管、扩散皿","standard":"/","category":"土壤养分"},{"id":"ENV-WS-S010","group":"soil","serial":10,"sample":"土壤","test":"TP，全磷","instrument":"连续流动分析仪，SEAL AAA","standard":"HCLO4-H2SO4消煮法                              \n《土壤农化分析》 DB23/T 1942-2017 土壤\n 全磷的测定 流动注射-钼酸铵分光光度法","category":"土壤养分"},{"id":"ENV-WS-S011","group":"soil","serial":11,"sample":"土壤","test":"AP，有效磷","instrument":"紫外可见分光光度计","standard":"NaHCOS浸提-钼锑抗比色法                           \n《土壤农化分析》","category":"土壤养分"},{"id":"ENV-WS-S012","group":"soil","serial":12,"sample":"土壤","test":"IP，无机磷","instrument":"紫外可见分光光度计","standard":"/","category":"土壤养分"},{"id":"ENV-WS-S013","group":"soil","serial":13,"sample":"土壤","test":"阳离子交换量","instrument":"紫外可见分光光度计","standard":"HJ 889-2017                                               \n土壤 阴阳离子交换量的测定 \n三氯化六氨合钴浸提-分光光度法","category":"土壤基础理化"},{"id":"ENV-WS-S014","group":"soil","serial":14,"sample":"土壤","test":"SiO3，硅酸盐","instrument":"连续流动分析仪，SEAL AAA","standard":"/","category":"土壤养分"},{"id":"ENV-WS-S015","group":"soil","serial":15,"sample":"土壤","test":"阳离子：K+ 、Na+ 、Ca2+、 Mg2+","instrument":"离子色谱仪，赛默飞世尔，ICS2100","standard":"T/NAIA 099-2021 设施土壤中无机阴阳离子含量的测定 离子色谱法","category":"土壤离子"},{"id":"ENV-WS-S016","group":"soil","serial":16,"sample":"土壤","test":"阴离子：F-、Cl- 、SO42-、NO3-","instrument":"离子色谱仪，赛默飞世尔，ICS2100","standard":"T/NAIA 099-2021 设施土壤中无机阴阳离子含量的测定 离子色谱法","category":"土壤离子"},{"id":"ENV-WS-S017","group":"soil","serial":17,"sample":"土壤","test":"DOC，溶解性有机碳","instrument":"总有机碳分析仪，岛津TOC-L","standard":"GB/T17145—2019\n土壤水溶性有机碳的测定","category":"土壤碳与腐殖质"},{"id":"ENV-WS-S018","group":"soil","serial":18,"sample":"土壤","test":"TOC，总有机碳（有机质）","instrument":"滴定管","standard":"LY/T 1237-1999 森林土壤有机质的测定及碳氮比的计算","category":"土壤碳与腐殖质"},{"id":"ENV-WS-S019","group":"soil","serial":19,"sample":"土壤","test":"HFOC，重组有机碳","instrument":"滴定管","standard":"/","category":"土壤碳与腐殖质"},{"id":"ENV-WS-S020","group":"soil","serial":20,"sample":"土壤","test":"LFOC，轻组有机碳","instrument":"滴定管","standard":"/","category":"土壤碳与腐殖质"},{"id":"ENV-WS-S021","group":"soil","serial":21,"sample":"土壤","test":"腐殖酸","instrument":"滴定管","standard":"NY/T 1867-2010                                             \n土壤腐殖质组成的测定","category":"土壤碳与腐殖质"},{"id":"ENV-WS-S022","group":"soil","serial":22,"sample":"土壤","test":"富里酸","instrument":"滴定管","standard":"NY/T 1867-2010                                             \n土壤腐殖质组成的测定","category":"土壤碳与腐殖质"},{"id":"ENV-WS-S023","group":"soil","serial":23,"sample":"土壤","test":"胡敏酸","instrument":"滴定管","standard":"NY/T 1867-2010                                             \n土壤腐殖质组成的测定","category":"土壤碳与腐殖质"},{"id":"ENV-WS-S024","group":"soil","serial":24,"sample":"土壤","test":"重金属样品前处理","instrument":"微波消解仪，美国CEM公司","standard":"土壤中砷、铅、铜、锌、镉、铬、镍、\n镁、钾、钙、锰、铁、硒、钼的测定 \n电感耦合等离子体质谱法","category":"土壤元素与重金属"},{"id":"ENV-WS-S025","group":"soil","serial":25,"sample":"土壤","test":"常规重金属的五步提取法","instrument":"ICPMS","standard":"Analytical Chemistry, 51(7): 844-851","category":"土壤元素与重金属"},{"id":"ENV-WS-S026","group":"soil","serial":26,"sample":"土壤","test":"二价铁","instrument":"紫外可见分光光度计","standard":"土壤农化分析","category":"土壤元素与重金属"},{"id":"ENV-WS-S027","group":"soil","serial":27,"sample":"土壤","test":"三价铁","instrument":"总铁-二价铁","standard":"/","category":"土壤元素与重金属"},{"id":"ENV-WS-S028","group":"soil","serial":28,"sample":"土壤提取液","test":"Cu、Zn、Ni、Pb、Cd、Cr、K、Ca、Na、Mg、Fe、As、Mo、Mn、Au、Hg、Co等重金属","instrument":"ICPMS，赛默飞世尔，ICAPQ","standard":"土壤中砷、铅、铜、锌、镉、铬、镍、\n镁、钾、钙、锰、铁、硒、钼的测定 \n电感耦合等离子体质谱法","category":"土壤元素与重金属"},{"id":"ENV-WS-S029","group":"soil","serial":29,"sample":"土壤提取液","test":"As 、Hg、Se等","instrument":"原子荧光，北京海光，AFS-9700A","standard":"标准GB/T 22105.1-2008                               \n《总汞 总砷 总铅的测定 原子荧光法》\n第一部分","category":"土壤元素与重金属"},{"id":"ENV-WS-S030","group":"soil","serial":30,"sample":"土壤提取液","test":"Cu、 Zn、 Ni、 Pb、 Cd 、Cr、Fe、Mn等","instrument":"原子吸收，PE，PinAAcle900T","standard":"土壤中砷、铅、铜、锌、镉、铬、镍、\n镁、钾、钙、锰、铁、硒、钼的测定 \n电感耦合等离子体质谱法","category":"土壤元素与重金属"},{"id":"ENV-WS-S031","group":"soil","serial":31,"sample":"固体粉末","test":"官能团","instrument":"傅里叶红外光谱仪，\n赛默飞Nicolet iS10","standard":"/","category":"土壤/固体表征"},{"id":"ENV-WS-S032","group":"soil","serial":32,"sample":"土壤","test":"种子发芽指数","instrument":"智能光照培养箱","standard":"NY/T 525-2021《有机肥料》\nGB/T 23486－2009","category":"土壤生态指标"},{"id":"ENV-WS-S033","group":"soil","serial":33,"sample":"土壤","test":"种子发芽率","instrument":"智能光照培养箱","standard":"NY/T 525-2021《有机肥料》 \nGB/T 23486－2009","category":"土壤生态指标"},{"id":"ENV-WS-S034","group":"soil","serial":34,"sample":"土壤","test":"总糖","instrument":"紫外可见分光光度计","standard":"/","category":"土壤生态指标"},{"id":"ENV-WS-S035","group":"soil","serial":35,"sample":"土壤","test":"蛋白","instrument":"紫外可见分光光度计","standard":"/","category":"土壤生态指标"}]
  source.forEach(r => {
    if (has.has(r.id)) return;
    const standard = String(r.standard || '').replace(/\s+/g,' ').trim();
    const instrument = String(r.instrument || '').replace(/\s+/g,' ').trim();
    window.HQTD_CATALOG_DATA.push({
      id:r.id,
      board:'环境检测',
      category:r.group === 'water' ? '水质常规检测' : '土壤常规检测',
      service:r.test,
      details:`${r.sample} · ${r.category}${instrument ? ` · ${instrument}` : ''}${standard && standard !== '/' ? ` · ${standard}` : ''}`,
      unit:'项',
      price:null,
      priceText:'待评估',
      cycle:'技术评估后确认',
      priority:r.group === 'water' ? '水质常规检测专题' : '土壤常规检测专题',
      image:null,
      imageAlt:`${r.test} ${r.group === 'water' ? '水质常规检测' : '土壤常规检测'}`,
      detailUrl:`${r.group === 'water' ? 'water-testing.html' : 'soil-testing.html'}?target=${encodeURIComponent(r.id)}#project-list`,
      routineEnvironment:true,
      instrument:r.instrument || '',
      standard:r.standard || ''
    });
  });
})();

;(() => {
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const envTopics=[
    {title:'新污染物精准检测',en:'EMERGING CONTAMINANTS',desc:'PFAS、农药、抗生素、药物、激素及其他目标物。',href:'emerging-contaminants.html',query:'catalog.html?board=环境检测&q=PFAS'},
    {title:'温室气体精准检测',en:'GREENHOUSE GAS',desc:'CO₂、CH₄、N₂O 等环境与排放监测。',href:'greenhouse-gas-detection.html',query:'catalog.html?board=环境检测&category=温室气体'},
    {title:'微塑料及裂解微塑料',en:'MICROPLASTIC ANALYTICS',desc:'颗粒计数、聚合物识别与来源分析。',href:'microplastics-detection.html',query:'catalog.html?board=环境检测&category=微塑料'},
    {title:'水质常规检测',en:'ROUTINE WATER TESTING',desc:'30 项基础理化、营养盐、离子及元素/重金属。',href:'water-testing.html',query:'catalog.html?board=环境检测&category=水质常规检测'},
    {title:'土壤常规检测',en:'ROUTINE SOIL TESTING',desc:'35 项理化、养分、碳/腐殖质、重金属与生态指标。',href:'soil-testing.html',query:'catalog.html?board=环境检测&category=土壤常规检测'},
    {title:'综合检测与方法开发',en:'METHOD DEVELOPMENT',desc:'复杂基质、新目标物与非常规科研检测方案。',href:'comprehensive-testing-method-development.html',query:'catalog.html?board=环境检测&category=综合检测与方法开发'}
  ];
  const highTopics=[
    {title:'催化机理与缺陷工程',en:'CATALYSIS & DEFECT',desc:'氧空位、活性位点、电子转移与反应路径。',href:'high-end-simulation.html#catalysis',query:'catalog.html?board=计算模拟&category=高端计算模拟&q=催化机理'},
    {title:'膜分离与分子界面',en:'MEMBRANE & INTERFACE',desc:'自由体积、扩散输运与选择性来源。',href:'high-end-simulation.html#membrane',query:'catalog.html?board=计算模拟&category=高端计算模拟&q=膜分离'},
    {title:'复杂污染物界面反应',en:'COMPLEX INTERFACE',desc:'PFAS、微液滴、界面富集与键活化。',href:'high-end-simulation.html#interface',query:'catalog.html?board=计算模拟&category=高端计算模拟&q=复杂污染物'},
    {title:'能源与电化学界面',en:'ENERGY & ELECTROCHEMISTRY',desc:'溶剂化、电极界面与电荷转移。',href:'high-end-simulation.html#energy',query:'catalog.html?board=计算模拟&category=高端计算模拟&q=能源'},
    {title:'聚合物与复合材料界面',en:'POLYMER & COMPOSITE',desc:'界面耦合、热输运与结构—性能关系。',href:'high-end-simulation.html#polymer',query:'catalog.html?board=计算模拟&category=高端计算模拟&q=聚合物'},
    {title:'高端计算方案定制',en:'CUSTOM ADVANCED SIMULATION',desc:'DFT、MD、AIMD 与多尺度计算路线组合。',href:'high-end-simulation.html#custom',query:'catalog.html?board=计算模拟&category=高端计算模拟&q=定制'}
  ];

  const ensureCss=()=>{
    if(document.querySelector('link[href*="catalog-topic-v107.css"]'))return;
    const l=document.createElement('link');l.rel='stylesheet';l.href='assets/css/catalog-topic-v107.css?v=20260921-v107';document.head.appendChild(l);
  };

  const renderCards=(items)=>items.map(x=>`<a class="catalog-topic-card" href="${esc(x.href)}"><small>${esc(x.en)}</small><b>${esc(x.title)}</b><p>${esc(x.desc)}</p><strong>进入专题 →</strong></a>`).join('');

  const enhanceSearch=()=>{
    const input=document.getElementById('search-input');
    if(input)input.placeholder='输入项目、方法或仪器，例如：水质、土壤、PFAS、DFT、XPS、ICPMS';
    const box=document.querySelector('.catalog-big-search');
    if(box && !document.querySelector('.catalog-search-suggestions-v107')){
      const row=document.createElement('div');row.className='catalog-search-suggestions-v107';
      row.innerHTML='<a href="catalog.html?board=环境检测&category=水质常规检测">水质常规检测</a><a href="catalog.html?board=环境检测&category=土壤常规检测">土壤常规检测</a><a href="catalog.html?board=环境检测&q=PFAS">PFAS</a><a href="catalog.html?board=环境检测&category=微塑料">微塑料</a><a href="catalog.html?board=计算模拟&category=高端计算模拟">高端计算</a>';
      box.parentElement?.appendChild(row);
    }
  };

  const enhanceEnvCategoryGroup=()=>{
    const group=document.querySelector('.hqt-class-group-environment');
    const wrap=group?.querySelector(':scope>div');if(!group||!wrap||group.dataset.v107==='1')return;
    group.dataset.v107='1';group.classList.add('v107');
    const links=[
      ['新污染物目标物库','387','emerging-contaminants.html#database'],
      ['温室气体','3','catalog.html?board=环境检测&category=温室气体'],
      ['微塑料','3','catalog.html?board=环境检测&category=微塑料'],
      ['水质常规检测','30','catalog.html?board=环境检测&category=水质常规检测'],
      ['土壤常规检测','35','catalog.html?board=环境检测&category=土壤常规检测'],
      ['综合检测与方法开发','4','catalog.html?board=环境检测&category=综合检测与方法开发']
    ];
    links.reverse().forEach(([name,count,href])=>{
      if([...wrap.querySelectorAll('span')].some(x=>x.textContent.trim()===name))return;
      const a=document.createElement('a');a.href=href;a.className='v107-priority';a.innerHTML=`<span>${name}</span><b>${count}</b>`;wrap.prepend(a);
    });
  };

  const enhanceTopicHub=()=>{
    if(document.querySelector('.catalog-topic-hub-v107'))return;
    const main=document.querySelector('.catalog-main')||document.querySelector('main');
    if(!main)return;
    const sec=document.createElement('section');sec.className='catalog-topic-hub-v107';
    sec.innerHTML=`<div class="container"><div class="hub-head"><div><span>SPECIAL TOPICS</span><h2>专题快速入口</h2></div><p>按“环境检测专题”和“高端计算专题”快速进入。进入专题看完整能力，进入项目查询可直接筛选具体服务。</p></div><div class="catalog-topic-tabs"><button type="button" class="active" data-v107-tab="environment">环境检测 · 6 个专题</button><button type="button" data-v107-tab="simulation">高端计算 · 6 个专题</button></div><div class="catalog-topic-grid" data-v107-grid>${renderCards(envTopics)}</div><div class="catalog-topic-quick"><a href="catalog.html?board=环境检测">全部环境检测项目</a><a href="catalog.html?board=计算模拟&category=高端计算模拟">全部高端计算项目</a><a href="demand-list.html">查看需求清单</a></div></div>`;
    main.parentElement?.insertBefore(sec,main);
    sec.addEventListener('click',e=>{
      const b=e.target.closest('[data-v107-tab]');if(!b)return;
      sec.querySelectorAll('[data-v107-tab]').forEach(x=>x.classList.toggle('active',x===b));
      sec.querySelector('[data-v107-grid]').innerHTML=renderCards(b.dataset.v107Tab==='simulation'?highTopics:envTopics);
    });
  };

  const enhanceHighsimFeature=()=>{
    const sec=document.querySelector('.catalog-highsim-feature');
    const grid=sec?.querySelector('.catalog-highsim-grid');if(!sec||!grid||sec.dataset.v107==='1')return;
    sec.dataset.v107='1';sec.classList.add('v107-six');
    const p=sec.querySelector('.catalog-highsim-head p');
    if(p)p.textContent='六个高端计算方向均可从项目查询直接筛选，也可进入专题页查看代表案例和计算路线。';
    grid.innerHTML=highTopics.map(x=>`<a class="catalog-highsim-card" href="${esc(x.query)}"><b>${esc(x.title)}</b><small>${esc(x.desc)}</small></a>`).join('');
    const more=sec.querySelector('.catalog-highsim-more');
    if(more)more.innerHTML='<span>六个方向已全部接入项目查询，不再只展示三个代表方向。</span><a href="high-end-simulation.html">进入高端计算专题 →</a>';
  };

  const fixCartSource=()=>{
    const timer=setInterval(()=>{
      if(!window.HQTDEnvCart||window.HQTDEnvCart.__v107Wrapped)return;
      const original=window.HQTDEnvCart.add;
      if(typeof original!=='function')return;
      window.HQTDEnvCart.add=function(item){
        const x={...item};
        if(x.details&&typeof x.details==='object'){
          const cat=String(x.category||'');
          x.details={...x.details,source:cat==='水质常规检测'?'水质常规检测专题':cat==='土壤常规检测'?'土壤常规检测专题':cat==='温室气体'?'温室气体检测专题':cat==='微塑料'?'微塑料检测专题':cat==='综合检测与方法开发'?'综合检测与方法开发':'新污染物目标物项目库'};
        }
        return original.call(this,x);
      };
      window.HQTDEnvCart.__v107Wrapped=true;clearInterval(timer);
    },50);
    setTimeout(()=>clearInterval(timer),4000);
  };

  const init=()=>{ensureCss();enhanceSearch();enhanceEnvCategoryGroup();enhanceTopicHub();enhanceHighsimFeature();fixCartSource();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

