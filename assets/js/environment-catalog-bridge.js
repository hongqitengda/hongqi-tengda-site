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
