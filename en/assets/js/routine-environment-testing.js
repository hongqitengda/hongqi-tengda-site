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
    {id:'ENV-WATER-BASIC',title:"Basic Water Quality Panel",desc:"Regular indicators such as PH, conductivity, TDS, COD, BOD5, suspended particulate matter, may increase or decrease according to research needs.",tags:["PH","Electrical Conductivity",'TDS','COD','BOD5']},
    {id:'ENV-WATER-NUTRIENT',title:"Water Nutrient Panel",desc:"TN, NH4+, NO3-, NO2-, TP, SRP, dissolved silicate etc., suitable for aquatic environment and biochemical studies.",tags:['TN','NH4+','NO3-','TP','SRP']},
    {id:'ENV-WATER-ION-METAL',title:"Ion & Element Group",desc:"Common anions and cations, plus elements and heavy metals including Cu, Zn, Ni, Pb, Cd, Cr, Fe, Mn, As, and Hg.",tags:['IC','ICPMS',"Elements","Heavy metal"]}
  ] : [
    {id:'ENV-SOIL-BASIC',title:"Soil fundamentals management combination",desc:"Basic indicators such as PH, conductivity, water content, anion exchange, etc..",tags:["PH","Electrical Conductivity","Water content rate",'CEC']},
    {id:'ENV-SOIL-NUTRIENT',title:"Soil nutrient mix",desc:"TN, ammonium nitrogen, nitric nitrogen, nitrous nitrogen, alkaline nitrogen, TP, AP, IP, etc..",tags:['TN','NH4+','NO3-','TP','AP']},
    {id:'ENV-SOIL-CARBON',title:"Soil carbon and corrosive combination",desc:"DOC, TOC, HFOC, LFOC, polycorric acids, polycrylic acids, humin acids, etc..",tags:['DOC','TOC','HFOC','LFOC',"Corrupt."]},
    {id:'ENV-SOIL-METAL',title:"Combined soil elements with heavy metals",desc:"Heavy metal pre-treatment, Five-step extraction, Iron form and multiple elements ICPMS / Atomic fluorescent / Atom absorption.",tags:['ICPMS',"Heavy metal","Form Ripping",'Fe']}
  ];

  function payload(r){
    return {
      id:r.id,title:r.test,name:r.test,serviceType:"Environmental Testing",board:"Environmental Testing",
      category:group === 'water' ? "Routine Water Testing" : "Routine Soil Testing",
      qty:1,unit:"projects",price:0,priceText:"To Be Assessed",
      note:`${r.sample} · ${r.category}`,
      spec:`${clean(r.instrument)}${r.standard && r.standard !== '/' ? `；${clean(r.standard)}` : ''}`,
      details:{sample:r.sample,instrument:r.instrument,standard:r.standard,source:group === 'water' ? "The topic of routine water quality testing" : "General soil detection topic"},
      sourceUrl:location.href
    };
  }
  function addPayload(item, button){
    if (window.HQTDEnvCart) window.HQTDEnvCart.add(item);
    else {
      const key='hqtd_en_requirement_cart_v2'; let rows=[];
      try{rows=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(rows))rows=[];}catch(_){rows=[];}
      rows.push({...item,cartKey:`${item.id}-${Date.now()}`});
      localStorage.setItem(key,JSON.stringify(rows.slice(0,100)));
    }
    if(button){const old=button.textContent;button.textContent="Joined";button.classList.add('added');setTimeout(()=>{button.textContent=old;button.classList.remove('added')},1200);}
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
    root.innerHTML=['all',...cats].map(cat=>`<button type="button" class="${state.category===cat?'active':''}" data-rt-category="${esc(cat)}">${cat==='all'?"All items":esc(cat.replace(/^Water Quality|^Soil/,''))}</button>`).join('');
  }
  function render(){
    renderFilters();
    const rows=filtered();
    $('[data-rt-count]').textContent=String(rows.length);
    const grid=$('[data-rt-grid]');
    grid.innerHTML=rows.map(r=>{
      const standard=clean(r.standard), instrument=clean(r.instrument);
      return `<article class="rt-item" data-id="${esc(r.id)}">
        <div class="rt-item-top"><span>${group==='water'?"Water Quality":"Soil"}</span><b>${esc(r.id)}</b></div>
        <h3>${esc(r.test)}</h3>
        <p class="rt-cat">${esc(r.category)}</p>
        <dl><div><dt>Sample</dt><dd>${esc(r.sample)}</dd></div>${instrument?`<div><dt>Instrument</dt><dd>${esc(instrument)}</dd></div>`:''}</dl>
        ${standard && standard!=='/'?`<details><summary>View the basis of the test</summary><p>${esc(standard)}</p></details>`:"<p class=\"rt-method-note\">Test methods and conditions are confirmed by sample and research needs</p>"}
        <div class="rt-item-actions"><button type="button" data-rt-add="${esc(r.id)}">Additional list of needs</button><a href="demand-list.html">View List</a></div>
      </article>`;
    }).join('');
    if(!rows.length) grid.innerHTML=`<div class="rt-empty"><strong>No matching items found</strong><span>${group==='water'?"Try PH, TN, TP, TOC, COD, heavy metal, ion, etc..":"Try key words like PH, TN, AP, TOC, occult acid, heavy metals, sprouts.."}</span></div>`;
  }
  function renderBundles(){
    const root=$('[data-rt-bundles]'); if(!root) return;
    root.innerHTML=bundles.map(b=>`<article class="rt-bundle"><span>RECOMMENDED COMBINATION</span><h3>${esc(b.title)}</h3><p>${esc(b.desc)}</p><div class="rt-bundle-tags">${b.tags.map(x=>`<i>${esc(x)}</i>`).join('')}</div><button type="button" data-rt-bundle="${esc(b.id)}"'to join the group's needs</button></article>`).join('');
  }

  document.addEventListener('click',e=>{
    const cat=e.target.closest('[data-rt-category]');
    if(cat){state.category=cat.dataset.rtCategory;render();return;}
    const add=e.target.closest('[data-rt-add]');
    if(add){const r=records.find(x=>x.id===add.dataset.rtAdd);if(r)addPayload(payload(r),add);return;}
    const bundle=e.target.closest('[data-rt-bundle]');
    if(bundle){
      const b=bundles.find(x=>x.id===bundle.dataset.rtBundle); if(!b)return;
      addPayload({id:b.id,title:b.title,name:b.title,serviceType:"Environmental Testing",board:"Environmental Testing",category:group==='water'?"General water quality testing":"General soil detection . Grouping programme",qty:1,unit:"set",price:0,priceText:"To Be Assessed",note:b.desc,spec:b.tags.join('、'),details:{source:group==='water'?"The topic of routine water quality testing":"General soil detection topic"},sourceUrl:location.href},bundle);
    }
  });
  const search=$('[data-rt-search]');
  search?.addEventListener('input',()=>{state.query=search.value.trim();render();});
  renderBundles(); render();

  const target=new URLSearchParams(location.search).get('target');
  if(target) setTimeout(()=>{const el=document.querySelector(`[data-id="${CSS.escape(target)}"]`);el?.scrollIntoView({behavior:'smooth',block:'center'});el?.classList.add('focus');},120);
})();