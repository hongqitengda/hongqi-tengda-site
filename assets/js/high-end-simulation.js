
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
  const toast=msg=>{let t=document.querySelector('.hqtd-highsim-toast');if(!t){t=document.createElement('div');t.className='hqtd-highsim-toast';document.body.appendChild(t);}t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1500);};
  const add=id=>{const item=topics[id];if(!item)return;const rows=read();const existing=rows.find(x=>x.id===id);if(existing)existing.qty=Math.min(999,Number(existing.qty||1)+1);else rows.push({...item,cartKey:`${id}-${Date.now()}`});save(rows);toast(existing?'已在需求清单中，数量已增加':'已加入需求清单');};
  document.addEventListener('click',e=>{
    const a=e.target.closest('[data-highsim-add]');if(a){e.preventDefault();add(a.dataset.highsimAdd);return;}
    const s=e.target.closest('[data-highsim-submit]');if(s){e.preventDefault();add(s.dataset.highsimSubmit);location.href='demand-list.html';return;}
  });
  const home=()=>{const p=location.pathname.toLowerCase();return /\/(index\.html)?$/.test(p)||document.body.classList.contains('homepage-redone');};
  const ensureFloat=()=>{if(!home()||document.querySelector('[data-highsim-floating-hub]'))return;
    document.querySelectorAll('.hqtd-highsim-float,.hqtd-highsim-float-reopen,[data-highsim-float]').forEach(el=>el.remove());
    const hub=document.createElement('aside');
    hub.className='highsim-floating-hub-v103';hub.setAttribute('data-highsim-floating-hub','');hub.setAttribute('aria-label','高端计算模拟专题');
    hub.innerHTML=`<button class="highsim-floating-close" type="button" aria-label="关闭">×</button><div class="highsim-floating-panel-head"><span class="highsim-floating-panel-kicker">ADVANCED SIMULATION</span><h2>高端计算模拟专题</h2></div><div class="highsim-floating-panel-grid"><a class="highsim-floating-topic-card highsim-blue" href="high-end-simulation.html#catalysis"><span class="highsim-floating-topic-en">CATALYSIS & DEFECT</span><h3>催化机理与缺陷工程</h3><p>氧空位、活性位点、电子转移与反应路径。</p><div class="highsim-floating-chip-row"><span>DFT</span><span>Bader</span><span>NEB</span></div><strong>点击进入 →</strong></a><a class="highsim-floating-topic-card highsim-cyan" href="high-end-simulation.html#membrane"><span class="highsim-floating-topic-en">MEMBRANE & INTERFACE</span><h3>膜分离与分子界面</h3><p>自由体积、扩散、溶剂化与结构—传质关系。</p><div class="highsim-floating-chip-row"><span>MD</span><span>MSD</span><span>Free Volume</span></div><strong>点击进入 →</strong></a><a class="highsim-floating-topic-card highsim-violet" href="high-end-simulation.html#interface"><span class="highsim-floating-topic-en">COMPLEX INTERFACE</span><h3>复杂污染物界面反应</h3><p>PFAS、重金属、界面富集与键活化机理。</p><div class="highsim-floating-chip-row"><span>MD</span><span>DFT</span><span>CI-NEB</span></div><strong>点击进入 →</strong></a><a class="highsim-floating-topic-card highsim-amber" href="high-end-simulation.html#custom"><span class="highsim-floating-topic-en">CUSTOM ADVANCED SIMULATION</span><h3>高端计算方案定制</h3><p>针对非标准科研问题组合多尺度计算与机理分析。</p><div class="highsim-floating-chip-row"><span>DFT</span><span>MD</span><span>AIMD</span></div><strong>点击进入 →</strong></a></div><div class="highsim-floating-panel-tip">面向论文级机理研究与高端计算方案设计</div>`;
    document.body.appendChild(hub);
    const reopen=document.createElement('button');reopen.type='button';reopen.className='highsim-floating-reopen-v103';reopen.hidden=true;reopen.innerHTML='<strong>高端计算专题</strong><small>点击展开四个入口</small>';document.body.appendChild(reopen);
    hub.querySelector('.highsim-floating-close').onclick=()=>{hub.hidden=true;reopen.hidden=false;};reopen.onclick=()=>{reopen.hidden=true;hub.hidden=false;};
    if(window.matchMedia('(max-width:820px)').matches){hub.hidden=true;reopen.hidden=false;}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureFloat,{once:true});else ensureFloat();
})();
