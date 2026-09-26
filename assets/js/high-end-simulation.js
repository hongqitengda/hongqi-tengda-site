(() => {
  'use strict';
  const CART_KEY='hqtd_requirement_cart_v2';
  const topics={
    'JS-201':{id:'JS-201',title:'催化机理与缺陷工程专题',serviceType:'计算模拟',board:'计算模拟',category:'高端计算模拟',qty:1,unit:'项',price:0,priceText:'待评估',note:'氧空位、活性位点、电子结构、反应路径、PMS/O3/PI 活化及论文级机理分析',sourceUrl:'high-end-simulation.html#catalysis'},
    'JS-202':{id:'JS-202',title:'膜分离与分子界面专题',serviceType:'计算模拟',board:'计算模拟',category:'高端计算模拟',qty:1,unit:'项',price:0,priceText:'待评估',note:'界面聚合、自由体积、扩散、溶剂化、传质与选择性机理分析',sourceUrl:'high-end-simulation.html#membrane'},
    'JS-203':{id:'JS-203',title:'复杂污染物界面反应专题',serviceType:'计算模拟',board:'计算模拟',category:'高端计算模拟',qty:1,unit:'项',price:0,priceText:'待评估',note:'PFAS、重金属、微液滴及复杂环境界面的富集、活化、脱氟与反应能垒分析',sourceUrl:'high-end-simulation.html#interface'},
    'JS-205':{id:'JS-205',title:'能源与电化学界面专题',serviceType:'计算模拟',board:'计算模拟',category:'高端计算模拟',qty:1,unit:'项',price:0,priceText:'待评估',note:'水系锌电池、电解液溶剂化、电极界面、CO2RR、液流电池与电荷转移动力学分析',sourceUrl:'high-end-simulation.html#energy'},
    'JS-206':{id:'JS-206',title:'聚合物与复合材料界面专题',serviceType:'计算模拟',board:'计算模拟',category:'高端计算模拟',qty:1,unit:'项',price:0,priceText:'待评估',note:'聚合物/无机相界面耦合、相互作用、热阻与热/质传输机制的分子动力学分析',sourceUrl:'high-end-simulation.html#polymer'},
    'JS-204':{id:'JS-204',title:'高端计算方案定制',serviceType:'计算模拟',board:'计算模拟',category:'高端计算模拟',qty:1,unit:'项',price:0,priceText:'待评估',note:'针对非标准科研问题，组合 DFT、MD、AIMD、自由能、反应路径与多尺度分析形成论文级定制方案',sourceUrl:'high-end-simulation.html#custom'}
  };
  const read=()=>{try{const x=JSON.parse(localStorage.getItem(CART_KEY)||'[]');return Array.isArray(x)?x:[];}catch(_){return[];}};
  const save=rows=>localStorage.setItem(CART_KEY,JSON.stringify(rows.slice(0,100)));
  const toast=msg=>{let t=document.querySelector('.hqtd-highsim-toast');if(!t){t=document.createElement('div');t.className='hqtd-highsim-toast';document.body.appendChild(t);}t.textContent=msg;t.classList.add('show');clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove('show'),1500);};
  const add=id=>{const item=topics[id];if(!item)return;const rows=read();const existing=rows.find(x=>x.id===id);if(existing)existing.qty=Math.min(999,Number(existing.qty||1)+1);else rows.push({...item,cartKey:`${id}-${Date.now()}`});save(rows);toast(existing?'已在需求清单中，数量已增加':'已加入需求清单');};

  const ensureSharedCss=()=>{if(document.querySelector('link[href*="home-topic-grid-v106.css"]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='assets/css/home-topic-grid-v106.css?v=20260921-v106';document.head.appendChild(l);
    if(!document.querySelector('link[href*="high-end-simulation-v106-addon.css"]')){const a=document.createElement('link');a.rel='stylesheet';a.href='assets/css/high-end-simulation-v106-addon.css?v=20260921-v106';document.head.appendChild(a);}};
  const home=()=>{const p=String(location.pathname||'').toLowerCase();return /\/(index\.html)?$/.test(p)||document.body.classList.contains('homepage-redone');};

  const renderHome=()=>{
    if(!home())return;
    const sec=document.getElementById('high-end-simulation');
    if(!sec||sec.dataset.v106==='1')return;
    sec.dataset.v106='1';sec.className='section hqtd-six-topic-section highsim-six';
    const c=sec.querySelector('.container')||document.createElement('div');if(!c.parentNode){c.className='container';sec.appendChild(c);}
    c.innerHTML=`
      <div class="hqtd-six-head"><div><span class="section-en">ADVANCED COMPUTATIONAL SCIENCE</span><h2>高端计算模拟专题</h2></div><p>围绕催化、膜分离、复杂界面、能源电化学与聚合物体系，提供 DFT / MD / AIMD 等多尺度计算与机理解析。</p></div>
      <div class="hqtd-six-grid">
        <a class="hqtd-six-card a1" href="high-end-simulation.html#catalysis"><span class="topic-en">CATALYSIS & DEFECT</span><h3>催化机理与缺陷工程</h3><p>氧空位、活性位点、电子转移与反应路径。</p><div class="hqtd-six-tags"><span>DFT</span><span>Bader</span><span>NEB</span></div><strong class="hqtd-six-link">进入专题 →</strong></a>
        <a class="hqtd-six-card a2" href="high-end-simulation.html#membrane"><span class="topic-en">MEMBRANE & INTERFACE</span><h3>膜分离与分子界面</h3><p>界面聚合、自由体积、扩散输运与选择性来源。</p><div class="hqtd-six-tags"><span>MD</span><span>MSD</span><span>Free Volume</span></div><strong class="hqtd-six-link">进入专题 →</strong></a>
        <a class="hqtd-six-card a3" href="high-end-simulation.html#interface"><span class="topic-en">COMPLEX INTERFACE</span><h3>复杂污染物界面反应</h3><p>PFAS、重金属、微液滴界面富集与键活化。</p><div class="hqtd-six-tags"><span>MD</span><span>DFT</span><span>CI-NEB</span></div><strong class="hqtd-six-link">进入专题 →</strong></a>
        <a class="hqtd-six-card a4" href="high-end-simulation.html#energy"><span class="topic-en">ENERGY & ELECTROCHEMISTRY</span><h3>能源与电化学界面</h3><p>溶剂化、电极界面、电荷转移与关键中间体。</p><div class="hqtd-six-tags"><span>DFT</span><span>MD</span><span>AIMD</span></div><strong class="hqtd-six-link">进入专题 →</strong></a>
        <a class="hqtd-six-card a5" href="high-end-simulation.html#polymer"><span class="topic-en">POLYMER & COMPOSITE</span><h3>聚合物与复合材料界面</h3><p>界面耦合、热输运、相互作用与结构—性能关系。</p><div class="hqtd-six-tags"><span>MD</span><span>RDF</span><span>Thermal</span></div><strong class="hqtd-six-link">进入专题 →</strong></a>
        <a class="hqtd-six-card a6" href="high-end-simulation.html#custom"><span class="topic-en">CUSTOM ADVANCED SIMULATION</span><h3>高端计算方案定制</h3><p>针对非标准科研问题组合 DFT、MD、AIMD 与多尺度方法。</p><div class="hqtd-six-tags"><span>DFT</span><span>MD</span><span>AIMD</span></div><strong class="hqtd-six-link">进入定制 →</strong></a>
      </div>
      <div class="hqtd-six-footer"><span>代表案例覆盖 Nature Communications、JACS、Environmental Science & Technology、Angewandte Chemie 等。</span><a href="high-end-simulation.html">查看完整案例与计算路线 →</a></div>`;
  };

  const enhanceCoreCalc=()=>{
    if(!home())return;
    const high=document.getElementById('high-end-simulation');const core=high?.previousElementSibling;
    if(!core||!core.classList.contains('hqt-capability-section'))return;
    core.classList.add('hqtd-calc-core-enhanced');
    if(core.querySelector('.hqtd-calc-core-note'))return;
    const container=core.querySelector('.container');if(!container)return;
    const note=document.createElement('div');note.className='hqtd-calc-core-note';
    note.innerHTML='<span><b>基础计算服务：</b> CFD / DFT / MD / 多物理场 / 量子化学可直接按项目选择；下方“高端计算模拟专题”则按科学问题组织机理研究与多尺度方案。</span><a href="board/computational-simulation.html">进入全部计算模拟项目 →</a>';
    container.appendChild(note);
  };


  const simulationCardsHtml=()=>`
    <div class="hqtd-six-head"><div><span class="section-en">ADVANCED COMPUTATIONAL SCIENCE</span><h2>高端计算模拟专题</h2></div><p>围绕催化、膜分离、复杂界面、能源电化学与聚合物体系，提供 DFT / MD / AIMD 等多尺度计算与机理解析。</p></div>
    <div class="hqtd-six-grid">
      <a class="hqtd-six-card a1" href="high-end-simulation.html#catalysis"><span class="topic-en">CATALYSIS & DEFECT</span><h3>催化机理与缺陷工程</h3><p>氧空位、活性位点、电子转移与反应路径。</p><div class="hqtd-six-tags"><span>DFT</span><span>Bader</span><span>NEB</span></div><strong class="hqtd-six-link">进入专题 →</strong></a>
      <a class="hqtd-six-card a2" href="high-end-simulation.html#membrane"><span class="topic-en">MEMBRANE & INTERFACE</span><h3>膜分离与分子界面</h3><p>界面聚合、自由体积、扩散输运与选择性来源。</p><div class="hqtd-six-tags"><span>MD</span><span>MSD</span><span>Free Volume</span></div><strong class="hqtd-six-link">进入专题 →</strong></a>
      <a class="hqtd-six-card a3" href="high-end-simulation.html#interface"><span class="topic-en">COMPLEX INTERFACE</span><h3>复杂污染物界面反应</h3><p>PFAS、重金属、微液滴界面富集与键活化。</p><div class="hqtd-six-tags"><span>MD</span><span>DFT</span><span>CI-NEB</span></div><strong class="hqtd-six-link">进入专题 →</strong></a>
      <a class="hqtd-six-card a4" href="high-end-simulation.html#energy"><span class="topic-en">ENERGY & ELECTROCHEMISTRY</span><h3>能源与电化学界面</h3><p>溶剂化、电极界面、电荷转移与关键中间体。</p><div class="hqtd-six-tags"><span>DFT</span><span>MD</span><span>AIMD</span></div><strong class="hqtd-six-link">进入专题 →</strong></a>
      <a class="hqtd-six-card a5" href="high-end-simulation.html#polymer"><span class="topic-en">POLYMER & COMPOSITE</span><h3>聚合物与复合材料界面</h3><p>界面耦合、热输运、相互作用与结构—性能关系。</p><div class="hqtd-six-tags"><span>MD</span><span>RDF</span><span>Thermal</span></div><strong class="hqtd-six-link">进入专题 →</strong></a>
      <a class="hqtd-six-card a6" href="high-end-simulation.html#custom"><span class="topic-en">CUSTOM ADVANCED SIMULATION</span><h3>高端计算方案定制</h3><p>针对非标准科研问题组合 DFT、MD、AIMD 与多尺度方法。</p><div class="hqtd-six-tags"><span>DFT</span><span>MD</span><span>AIMD</span></div><strong class="hqtd-six-link">进入定制 →</strong></a>
    </div>
    <div class="hqtd-six-footer"><span>常规计算项目可直接从项目查询选择；复杂研究问题可进入专题页查看代表案例和计算路线。</span><a href="catalog.html?board=计算模拟&category=高端计算模拟">查询高端计算项目 →</a></div>`;

  const renderSimulationBoard=()=>{
    const path=String(location.pathname||'').replace(/\\/g,'/').toLowerCase();
    if(!path.endsWith('/board/computational-simulation.html')&&!path.endsWith('board/computational-simulation.html'))return;
    if(document.querySelector('.hqtd-board-highsim-six'))return;
    const main=document.querySelector('main');if(!main)return;
    const first=main.querySelector('.hqt-capability-section')||main.firstElementChild;if(!first)return;
    const sec=document.createElement('section');sec.className='hqtd-board-highsim-six hqtd-six-topic-section highsim-six';
    sec.innerHTML=`<div class="container">${simulationCardsHtml()}</div>`;
    first.insertAdjacentElement('afterend',sec);
  };

  const ensureFloat=()=>{
    if(!home()||document.querySelector('[data-highsim-floating-hub]'))return;
    document.querySelectorAll('.hqtd-highsim-float,.hqtd-highsim-float-reopen,[data-highsim-float]').forEach(el=>el.remove());
    const hub=document.createElement('aside');hub.className='highsim-floating-hub-v103';hub.setAttribute('data-highsim-floating-hub','');hub.setAttribute('aria-label','高端计算模拟专题');
    hub.innerHTML=`<button class="highsim-floating-close" type="button" aria-label="关闭">×</button><div class="highsim-floating-panel-head"><span class="highsim-floating-panel-kicker">ADVANCED SIMULATION</span><h2>高端计算模拟专题</h2></div><div class="highsim-floating-panel-grid">
      <a class="highsim-floating-topic-card highsim-blue" href="high-end-simulation.html#catalysis"><span class="highsim-floating-topic-en">CATALYSIS & DEFECT</span><h3>催化机理与缺陷工程</h3><p>氧空位、活性位点与反应路径。</p><div class="highsim-floating-chip-row"><span>DFT</span><span>Bader</span><span>NEB</span></div><strong>点击进入 →</strong></a>
      <a class="highsim-floating-topic-card highsim-cyan" href="high-end-simulation.html#membrane"><span class="highsim-floating-topic-en">MEMBRANE & INTERFACE</span><h3>膜分离与分子界面</h3><p>自由体积、扩散与结构—传质。</p><div class="highsim-floating-chip-row"><span>MD</span><span>MSD</span><span>Free Volume</span></div><strong>点击进入 →</strong></a>
      <a class="highsim-floating-topic-card highsim-violet" href="high-end-simulation.html#interface"><span class="highsim-floating-topic-en">COMPLEX INTERFACE</span><h3>复杂污染物界面反应</h3><p>PFAS、重金属、界面富集与键活化。</p><div class="highsim-floating-chip-row"><span>MD</span><span>DFT</span><span>CI-NEB</span></div><strong>点击进入 →</strong></a>
      <a class="highsim-floating-topic-card highsim-energy" href="high-end-simulation.html#energy"><span class="highsim-floating-topic-en">ENERGY & ELECTROCHEMISTRY</span><h3>能源与电化学界面</h3><p>溶剂化、电极界面与电荷转移。</p><div class="highsim-floating-chip-row"><span>DFT</span><span>MD</span><span>AIMD</span></div><strong>点击进入 →</strong></a>
      <a class="highsim-floating-topic-card highsim-polymer" href="high-end-simulation.html#polymer"><span class="highsim-floating-topic-en">POLYMER & COMPOSITE</span><h3>聚合物与复合材料界面</h3><p>界面耦合、热输运与结构—性能。</p><div class="highsim-floating-chip-row"><span>MD</span><span>RDF</span><span>Thermal</span></div><strong>点击进入 →</strong></a>
      <a class="highsim-floating-topic-card highsim-amber" href="high-end-simulation.html#custom"><span class="highsim-floating-topic-en">CUSTOM ADVANCED SIMULATION</span><h3>高端计算方案定制</h3><p>组合 DFT、MD、AIMD 与多尺度方法。</p><div class="highsim-floating-chip-row"><span>DFT</span><span>MD</span><span>AIMD</span></div><strong>点击进入 →</strong></a>
    </div><div class="highsim-floating-panel-tip">聚焦复杂体系的多尺度计算、界面行为与反应机理解析</div>`;
    document.body.appendChild(hub);
    const reopen=document.createElement('button');reopen.type='button';reopen.className='highsim-floating-reopen-v103';reopen.hidden=true;reopen.innerHTML='<strong>高端计算专题</strong><small>点击展开六专题入口</small>';document.body.appendChild(reopen);
    hub.querySelector('.highsim-floating-close').onclick=()=>{hub.hidden=true;reopen.hidden=false;};reopen.onclick=()=>{reopen.hidden=true;hub.hidden=false;};
    if(window.matchMedia('(max-width:820px)').matches){hub.hidden=true;reopen.hidden=false;}
  };

  document.addEventListener('click',e=>{
    const a=e.target.closest('[data-highsim-add]');if(a){e.preventDefault();add(a.dataset.highsimAdd);return;}
    const s=e.target.closest('[data-highsim-submit]');if(s){e.preventDefault();add(s.dataset.highsimSubmit);location.href='demand-list.html';return;}
  });

  const init=()=>{ensureSharedCss();renderHome();enhanceCoreCalc();renderSimulationBoard();ensureFloat();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
