document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('.hqtd-language-bar a').forEach(a=>{const target=new URL(a.href);const params=new URLSearchParams(location.search);for(const key of ['q','id','sort','price'])if(params.has(key))target.searchParams.set(key,params.get(key));target.hash=location.hash;a.href=target.pathname+target.search+target.hash;});});window.addEventListener('load',()=>{if(!matchMedia('(max-width:820px)').matches)return;document.querySelectorAll('button').forEach(b=>{if(/floating-close/.test(b.className))b.click();});const launchers=[...document.querySelectorAll('button')].filter(b=>/floating-reopen/.test(b.className));if(launchers.length&&document.querySelector('main')){const row=document.createElement('div');row.className='hqtd-mobile-topics';launchers.forEach(b=>row.append(b));document.querySelector('main').prepend(row);}const chat=document.querySelector('.hq-chat-launcher');if(chat)chat.setAttribute('aria-label',document.documentElement.lang==='en'?'Contact Support':'联系顾问');});

/* HQTD Advanced Characterization global integration 2026-09-30 */
document.addEventListener('DOMContentLoaded',()=>{
  const en=(document.documentElement.lang||'').toLowerCase().startsWith('en');
  const root=en?'/en/':'/';
  const topic=root+'advanced-material-characterization.html';

  /* 1. 全站顶部导航：在现有“材料表征 / 环境检测”后加入高端表征入口 */
  document.querySelectorAll('.unified-site-nav').forEach(nav=>{
    if(nav.querySelector('[data-advanced-characterization-nav]'))return;
    const links=[...nav.querySelectorAll('a[href]')];
    const anchor=links.find(a=>(a.getAttribute('href')||'').includes('characterization-analysis.html'));
    if(!anchor)return;
    const a=document.createElement('a');
    a.href=topic;
    a.dataset.advancedCharacterizationNav='';
    a.textContent=en?'Advanced Characterization':'高端表征';
    if(location.pathname.endsWith('/advanced-material-characterization.html'))a.classList.add('active');
    anchor.insertAdjacentElement('afterend',a);
  });

  /* 2. 页脚服务导航同步 */
  document.querySelectorAll('.footer-column').forEach(col=>{
    if(col.querySelector('[data-advanced-characterization-footer]'))return;
    const anchor=[...col.querySelectorAll('a[href]')].find(a=>(a.getAttribute('href')||'').includes('characterization-analysis.html'));
    if(!anchor)return;
    const a=document.createElement('a');
    a.href=topic;a.dataset.advancedCharacterizationFooter='';
    a.textContent=en?'Advanced Characterization':'高端材料表征';
    anchor.insertAdjacentElement('afterend',a);
  });

  /* 3. 表征&检测 Board：环境代表性检测项目完整结束后，追加高端材料表征专题 */
  const p=String(location.pathname||'').replace(/\\/g,'/').toLowerCase();
  if(p.endsWith('/board/characterization-analysis.html')){
    const main=document.querySelector('main');
    if(main&&!document.getElementById('advanced-characterization-topic')){
      const env=document.getElementById('environment-representative-projects') ||
        [...main.querySelectorAll('section')].find(s=>/环境代表性检测项目|environmental projects/i.test(s.textContent||''));
      if(env){
        const css=document.createElement('link');css.rel='stylesheet';css.href='/assets/css/advanced-characterization-board-entry.css?v=20260930-final';document.head.appendChild(css);
        const sec=document.createElement('section');
        sec.className='section hqtd-advanced-characterization-entry';sec.id='advanced-characterization-topic';
        sec.innerHTML=en?`<div class="container"><div class="hqt-capability-head reveal"><div><span class="section-en">ADVANCED MATERIALS CHARACTERIZATION</span><h2>Advanced Materials Characterization &amp; In-situ Analysis</h2></div><p>Synchrotron, in-situ / operando, aberration-corrected TEM/STEM, FIB, 3D CT and advanced spectroscopy for research-question-driven evidence chains.</p></div><article class="hqtd-advanced-characterization-banner"><a class="hqtd-advanced-characterization-media" href="/en/advanced-material-characterization.html"><img src="/assets/images/homepage-color/07-material-characterization.webp" alt="Advanced Materials Characterization" loading="lazy"></a><div class="hqtd-advanced-characterization-copy"><span>ADVANCED CHARACTERIZATION · IN-SITU · SYNCHROTRON</span><h3><a href="/en/advanced-material-characterization.html">From collecting data to building a mechanistic evidence chain</a></h3><p>For catalysis, energy materials, membranes, MOFs/COFs, polymers and composites.</p><div class="ai-showcase-tags"><span>XAFS</span><span>Operando</span><span>Aberration-corrected TEM</span><span>FIB</span><span>Micro/Nano-CT</span><span>fs-TAS</span></div><div class="hqtd-advanced-characterization-actions"><a class="button" href="/en/advanced-material-characterization.html">Explore Topic →</a><a href="/en/catalog.html?q=advanced+characterization">Search Projects</a><button data-open-admin type="button">Discuss a Workflow</button></div></div></article></div>`:
        `<div class="container"><div class="hqt-capability-head reveal"><div><span class="section-en">ADVANCED MATERIALS CHARACTERIZATION</span><h2>高端材料表征与原位分析专题</h2></div><p>同步辐射、原位 / Operando、球差校正 TEM/STEM、FIB、三维 CT 与先进谱学，多技术联用解决复杂材料机理问题。</p></div><article class="hqtd-advanced-characterization-banner"><a class="hqtd-advanced-characterization-media" href="/advanced-material-characterization.html"><img src="/assets/images/homepage-color/07-material-characterization.webp" alt="高端材料表征与原位分析" loading="lazy"></a><div class="hqtd-advanced-characterization-copy"><span>ADVANCED CHARACTERIZATION · IN-SITU · SYNCHROTRON</span><h3><a href="/advanced-material-characterization.html">从“测数据”升级为“围绕科研问题构建证据链”</a></h3><p>面向催化、能源、膜材料、MOF/COF、聚合物与复合材料，按目标机制组合显微、谱学、原位与三维表征。</p><div class="ai-showcase-tags"><span>XAFS</span><span>Operando</span><span>球差 TEM</span><span>FIB</span><span>Micro/Nano-CT</span><span>fs-TAS</span></div><div class="hqtd-advanced-characterization-actions"><a class="button" href="/advanced-material-characterization.html">进入专题 →</a><a href="/catalog.html?q=高端材料表征">查询相关项目</a><button data-open-admin type="button">咨询表征方案</button></div></div></article></div>`;
        /* 正确次序：高端材料表征完整结束后，才进入环境代表性检测项目 */
        env.insertAdjacentElement('beforebegin',sec);
      }
    }
  }

  /* 4. Catalog：自动加载高端表征检索层，不再手工改 catalog.html */
  if(p.endsWith('/catalog.html')){
    const css=document.createElement('link');css.rel='stylesheet';
    css.href=en?'/en/assets/css/advanced-characterization-catalog.css?v=20260930-final':'/assets/css/advanced-characterization-catalog.css?v=20260930-final';
    document.head.appendChild(css);
    const s=document.createElement('script');
    s.src=en?'/en/assets/js/advanced-characterization-catalog.js?v=20260930-final':'/assets/js/advanced-characterization-catalog.js?v=20260930-final';
    document.body.appendChild(s);
  }
});
