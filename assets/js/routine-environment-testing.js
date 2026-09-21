(() => {
  'use strict';
  const source = window.HQTD_WATER_SOIL_DATA || {records:[]};
  const group = document.body.dataset.routineGroup === 'soil' ? 'soil' : 'water';
  const records = (Array.isArray(source.records) ? source.records : []).filter(r => r.group === group);
  const state = {category:'all',query:''};
  const $ = s => document.querySelector(s);
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clean = v => String(v || '').replace(/\s+/g,' ').trim();

  const bundles = group === 'water' ? [
    {id:'ENV-WATER-BASIC',title:'水质基础理化组合',desc:'PH值、电导率、TDS、COD、BOD5、悬浮颗粒物等常规指标，可按研究需求增减。',tags:['PH值','电导率','TDS','COD','BOD5']},
    {id:'ENV-WATER-NUTRIENT',title:'水体营养盐组合',desc:'TN、NH4+、NO3-、NO2-、TP、SRP、溶解态硅酸盐等，适合水环境与生地化研究。',tags:['TN','NH4+','NO3-','TP','SRP']},
    {id:'ENV-WATER-ION-METAL',title:'离子与元素组合',desc:'常见阴阳离子及 Cu、Zn、Ni、Pb、Cd、Cr、Fe、Mn、As、Hg 等元素/重金属。',tags:['IC','ICPMS','元素','重金属']}
  ] : [
    {id:'ENV-SOIL-BASIC',title:'土壤基础理化组合',desc:'PH值、电导率、含水率、阳离子交换量等基础指标。',tags:['PH值','电导率','含水率','CEC']},
    {id:'ENV-SOIL-NUTRIENT',title:'土壤养分组合',desc:'TN、铵态氮、硝态氮、亚硝态氮、碱解氮、TP、AP、IP 等。',tags:['TN','NH4+','NO3-','TP','AP']},
    {id:'ENV-SOIL-CARBON',title:'土壤碳与腐殖质组合',desc:'DOC、TOC、HFOC、LFOC、腐殖酸、富里酸、胡敏酸等。',tags:['DOC','TOC','HFOC','LFOC','腐殖质']},
    {id:'ENV-SOIL-METAL',title:'土壤元素与重金属组合',desc:'重金属前处理、五步提取、铁形态及多元素 ICPMS / 原子荧光 / 原子吸收。',tags:['ICPMS','重金属','形态提取','Fe']}
  ];

  function payload(r){
    return {
      id:r.id,title:r.test,name:r.test,serviceType:'环境检测',board:'环境检测',
      category:group === 'water' ? '水质常规检测' : '土壤常规检测',
      qty:1,unit:'项',price:0,priceText:'待评估',
      note:`${r.sample} · ${r.category}`,
      spec:`${clean(r.instrument)}${r.standard && r.standard !== '/' ? `；${clean(r.standard)}` : ''}`,
      details:{sample:r.sample,instrument:r.instrument,standard:r.standard,source:group === 'water' ? '水质常规检测专题' : '土壤常规检测专题'},
      sourceUrl:location.href
    };
  }
  function addPayload(item, button){
    if (window.HQTDEnvCart) window.HQTDEnvCart.add(item);
    else {
      const key='hqtd_requirement_cart_v2'; let rows=[];
      try{rows=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(rows))rows=[];}catch(_){rows=[];}
      rows.push({...item,cartKey:`${item.id}-${Date.now()}`});
      localStorage.setItem(key,JSON.stringify(rows.slice(0,100)));
    }
    if(button){const old=button.textContent;button.textContent='已加入 ✓';button.classList.add('added');setTimeout(()=>{button.textContent=old;button.classList.remove('added')},1200);}
  }
  function filtered(){
    const q=state.query.toLowerCase();
    return records.filter(r=>{
      if(state.category!=='all' && r.category!==state.category) return false;
      if(!q) return true;
      return `${r.test} ${r.sample} ${r.instrument} ${r.standard} ${r.category}`.toLowerCase().includes(q);
    });
  }
  function renderFilters(){
    const root=$('[data-rt-categories]'); if(!root) return;
    const cats=[...new Set(records.map(r=>r.category))];
    root.innerHTML=['all',...cats].map(cat=>`<button type="button" class="${state.category===cat?'active':''}" data-rt-category="${esc(cat)}">${cat==='all'?'全部项目':esc(cat.replace(/^水质|^土壤/,''))}</button>`).join('');
  }
  function render(){
    renderFilters();
    const rows=filtered();
    $('[data-rt-count]').textContent=String(rows.length);
    const grid=$('[data-rt-grid]');
    grid.innerHTML=rows.map(r=>{
      const standard=clean(r.standard), instrument=clean(r.instrument);
      return `<article class="rt-item" data-id="${esc(r.id)}">
        <div class="rt-item-top"><span>${group==='water'?'水质':'土壤'}</span><b>${esc(r.id)}</b></div>
        <h3>${esc(r.test)}</h3>
        <p class="rt-cat">${esc(r.category)}</p>
        <dl><div><dt>样品</dt><dd>${esc(r.sample)}</dd></div>${instrument?`<div><dt>仪器</dt><dd>${esc(instrument)}</dd></div>`:''}</dl>
        ${standard && standard!=='/'?`<details><summary>查看检测依据</summary><p>${esc(standard)}</p></details>`:'<p class="rt-method-note">检测方法与条件按样品及研究需求确认</p>'}
        <div class="rt-item-actions"><button type="button" data-rt-add="${esc(r.id)}">加入需求清单</button><a href="demand-list.html">查看清单</a></div>
      </article>`;
    }).join('');
    if(!rows.length) grid.innerHTML=`<div class="rt-empty"><strong>未找到匹配项目</strong><span>${group==='water'?'可尝试 PH值、TN、TP、TOC、COD、重金属、离子等关键词。':'可尝试 PH值、TN、AP、TOC、腐殖酸、重金属、发芽指数等关键词。'}</span></div>`;
  }
  function renderBundles(){
    const root=$('[data-rt-bundles]'); if(!root) return;
    root.innerHTML=bundles.map(b=>`<article class="rt-bundle"><span>RECOMMENDED COMBINATION</span><h3>${esc(b.title)}</h3><p>${esc(b.desc)}</p><div class="rt-bundle-tags">${b.tags.map(x=>`<i>${esc(x)}</i>`).join('')}</div><button type="button" data-rt-bundle="${esc(b.id)}">加入组合需求 →</button></article>`).join('');
  }

  document.addEventListener('click',e=>{
    const cat=e.target.closest('[data-rt-category]');
    if(cat){state.category=cat.dataset.rtCategory;render();return;}
    const add=e.target.closest('[data-rt-add]');
    if(add){const r=records.find(x=>x.id===add.dataset.rtAdd);if(r)addPayload(payload(r),add);return;}
    const bundle=e.target.closest('[data-rt-bundle]');
    if(bundle){
      const b=bundles.find(x=>x.id===bundle.dataset.rtBundle); if(!b)return;
      addPayload({id:b.id,title:b.title,name:b.title,serviceType:'环境检测',board:'环境检测',category:group==='water'?'水质常规检测 · 组合方案':'土壤常规检测 · 组合方案',qty:1,unit:'套',price:0,priceText:'待评估',note:b.desc,spec:b.tags.join('、'),details:{source:group==='water'?'水质常规检测专题':'土壤常规检测专题'},sourceUrl:location.href},bundle);
    }
  });
  const search=$('[data-rt-search]');
  search?.addEventListener('input',()=>{state.query=search.value.trim();render();});
  renderBundles(); render();

  const target=new URLSearchParams(location.search).get('target');
  if(target) setTimeout(()=>{const el=document.querySelector(`[data-id="${CSS.escape(target)}"]`);el?.scrollIntoView({behavior:'smooth',block:'center'});el?.classList.add('focus');},120);
})();