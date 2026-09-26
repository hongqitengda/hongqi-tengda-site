(() => {
  'use strict';
  const CART_KEY='hqtd_en_requirement_cart_v2';
  const topics={
    'JS-201':{id:'JS-201',title:"Catalyst Mechanism and Deficiencies Project",serviceType:"Computational Simulation",board:"Computational Simulation",category:"Advanced Computational Simulation",qty:1,unit:"projects",price:0,priceText:"To Be Assessed",note:"Oxygen vacancies, active sites, electronic structures, reaction pathways, PMS/O3/PI activation and dissertation mechanistic analysis",sourceUrl:'high-end-simulation.html#catalysis'},
    'JS-202':{id:'JS-202',title:"Topic of membrane separation and molecular interface",serviceType:"Computational Simulation",board:"Computational Simulation",category:"Advanced Computational Simulation",qty:1,unit:"projects",price:0,priceText:"To Be Assessed",note:"Interfacial polymerization, free volume, diffusion, solvation, passover and selective mechanistic analysis",sourceUrl:'high-end-simulation.html#membrane'},
    'JS-203':{id:'JS-203',title:"The topic of complex pollutant interface response",serviceType:"Computational Simulation",board:"Computational Simulation",category:"Advanced Computational Simulation",qty:1,unit:"projects",price:0,priceText:"To Be Assessed",note:"PFAS enrichment, activation, defluorinated and reaction energy analysis of heavy metals, microdrops and complex environmental interfaces",sourceUrl:'high-end-simulation.html#interface'},
    'JS-205':{id:'JS-205',title:"Topic of the interface between energy and electrochemicals",serviceType:"Computational Simulation",board:"Computational Simulation",category:"Advanced Computational Simulation",qty:1,unit:"projects",price:0,priceText:"To Be Assessed",note:"Zinc water battery, electrolyte solvation, electrode interface, CO2RR, liquid battery and charge transfer dynamics analysis",sourceUrl:'high-end-simulation.html#energy'},
    'JS-206':{id:'JS-206',title:"The topic of the polymer-composite interface",serviceType:"Computational Simulation",board:"Computational Simulation",category:"Advanced Computational Simulation",qty:1,unit:"projects",price:0,priceText:"To Be Assessed",note:"Molecular dynamics analysis of polymer/inorganic interfacial coupling, interactions, thermal resistance and heat/mass transmission mechanisms",sourceUrl:'high-end-simulation.html#polymer'},
    'JS-204':{id:'JS-204',title:"Custom Advanced Simulation",serviceType:"Computational Simulation",board:"Computational Simulation",category:"Advanced Computational Simulation",qty:1,unit:"projects",price:0,priceText:"To Be Assessed",note:"A combination of DFT, MD, AIMD, free energy, response pathways and multi-scale analysis to generate paper-level customization for non-standard scientific issues",sourceUrl:'high-end-simulation.html#custom'}
  };
  const read=()=>{try{const x=JSON.parse(localStorage.getItem(CART_KEY)||'[]');return Array.isArray(x)?x:[];}catch(_){return[];}};
  const save=rows=>localStorage.setItem(CART_KEY,JSON.stringify(rows.slice(0,100)));
  const toast=msg=>{let t=document.querySelector('.hqtd-highsim-toast');if(!t){t=document.createElement('div');t.className='hqtd-highsim-toast';document.body.appendChild(t);}t.textContent=msg;t.classList.add('show');clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove('show'),1500);};
  const add=id=>{const item=topics[id];if(!item)return;const rows=read();const existing=rows.find(x=>x.id===id);if(existing)existing.qty=Math.min(999,Number(existing.qty||1)+1);else rows.push({...item,cartKey:`${id}-${Date.now()}`});save(rows);toast(existing?"Already included in the list of needs, the number has increased":"Added to the list of needs");};

  const ensureSharedCss=()=>{if(document.querySelector('link[href*="home-topic-grid-v106.css"]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='/en/assets/css/home-topic-grid-v106.css?v=20260921-v106';document.head.appendChild(l);
    if(!document.querySelector('link[href*="high-end-simulation-v106-addon.css"]')){const a=document.createElement('link');a.rel='stylesheet';a.href='/en/assets/css/high-end-simulation-v106-addon.css?v=20260921-v106';document.head.appendChild(a);}};
  const home=()=>{const p=String(location.pathname||'').toLowerCase();return /\/(index\.html)?$/.test(p)||document.body.classList.contains('homepage-redone');};

  const renderHome=()=>{
    if(!home())return;
    const sec=document.getElementById('high-end-simulation');
    if(!sec||sec.dataset.v106==='1')return;
    sec.dataset.v106='1';sec.className='section hqtd-six-topic-section highsim-six';
    const c=sec.querySelector('.container')||document.createElement('div');if(!c.parentNode){c.className='container';sec.appendChild(c);}
    c.innerHTML=`
      <div class="hqtd-six-head"><div><span class="section-en">ADVANCED COMPUTATIONAL SCIENCE</span><h2>Advanced Computational Simulation</h2></div><p>Multiscale computation and mechanistic interpretation around catalytic, membrane separation, complex interfaces, energy electrochemicals and polymer systems.</p></div>
      <div class="hqtd-six-grid">
        <a class="hqtd-six-card a1" href="high-end-simulation.html#catalysis"><span class="topic-en">CATALYSIS &amp; DEFECT</span><h3>Catalytic Mechanisms and Defect Engineering</h3><p>Oxygen vacancies, active sites, electron transfer, and reaction pathways.</p><div class="hqtd-six-tags"><span>DFT</span><span>Bader</span><span>NEB</span></div><strong class="hqtd-six-link">Get to the subject.</strong></a>
        <a class="hqtd-six-card a2" href="high-end-simulation.html#membrane"><span class="topic-en">MEMBRANE &amp; INTERFACE</span><h3>Membrane Separation and Molecular Interfaces</h3><p>Interfacial polymerization, free volume, diffusive transport, and the origins of selectivity.</p><div class="hqtd-six-tags"><span>MD</span><span>MSD</span><span>Free Volume</span></div><strong class="hqtd-six-link">Get to the subject.</strong></a>
        <a class="hqtd-six-card a3" href="high-end-simulation.html#interface"><span class="topic-en">COMPLEX INTERFACE</span><h3>Interfacial Reactions of Complex Contaminants</h3><p>PFAS, heavy metals, microdrop interface enrichment and key activation.</p><div class="hqtd-six-tags"><span>MD</span><span>DFT</span><span>CI-NEB</span></div><strong class="hqtd-six-link">Get to the subject.</strong></a>
        <a class="hqtd-six-card a4" href="high-end-simulation.html#energy"><span class="topic-en">ENERGY &amp; ELECTROCHEMISTRY</span><h3>Energy and Electrochemical Interfaces</h3><p>Solventization, electrode interface, charge transfer and key intermediates.</p><div class="hqtd-six-tags"><span>DFT</span><span>MD</span><span>AIMD</span></div><strong class="hqtd-six-link">Get to the subject.</strong></a>
        <a class="hqtd-six-card a5" href="high-end-simulation.html#polymer"><span class="topic-en">POLYMER &amp; COMPOSITE</span><h3>Polymer and Composite Interfaces</h3><p>Interfacial coupling, heat transport, interaction and structural-performance relationships.</p><div class="hqtd-six-tags"><span>MD</span><span>RDF</span><span>Thermal</span></div><strong class="hqtd-six-link">Get to the subject.</strong></a>
        <a class="hqtd-six-card a6" href="high-end-simulation.html#custom"><span class="topic-en">CUSTOM ADVANCED SIMULATION</span><h3>Custom Advanced Simulation</h3><p>DFT, MD, AIMD and multi-scale approaches for non-standard scientific issues.</p><div class="hqtd-six-tags"><span>DFT</span><span>MD</span><span>AIMD</span></div><strong class="hqtd-six-link">Get into custom</strong></a>
      </div>
      <div class="hqtd-six-footer"><span>The representative case covers Nature Commissions, JACS, Environmental Science &amp; Technology, Engineering Chemie, etc..</span><a href="high-end-simulation.html">View full case and calculation route</a></div>`;
  };

  const enhanceCoreCalc=()=>{
    if(!home())return;
    const high=document.getElementById('high-end-simulation');const core=high?.previousElementSibling;
    if(!core||!core.classList.contains('hqt-capability-section'))return;
    core.classList.add('hqtd-calc-core-enhanced');
    if(core.querySelector('.hqtd-calc-core-note'))return;
    const container=core.querySelector('.container');if(!container)return;
    const note=document.createElement('div');note.className='hqtd-calc-core-note';
    note.innerHTML="<span><b>Basic computing services:</b> CFC / DFT / MD / Polyphysic Field / Quanticochemistry can be selected directly by project; Below is the “high-end computational simulation topic”, which organizes mechanical research and multiscale programmes by scientific issue..</span><a href=\"/en/board/computational-simulation.html\">Enter all computing simulations</a>";
    container.appendChild(note);
  };


  const simulationCardsHtml=()=>`
    <div class="hqtd-six-head"><div><span class="section-en">ADVANCED COMPUTATIONAL SCIENCE</span><h2>Advanced Computational Simulation</h2></div><p>Multiscale computation and mechanistic interpretation around catalytic, membrane separation, complex interfaces, energy electrochemicals and polymer systems.</p></div>
    <div class="hqtd-six-grid">
      <a class="hqtd-six-card a1" href="high-end-simulation.html#catalysis"><span class="topic-en">CATALYSIS &amp; DEFECT</span><h3>Catalytic Mechanisms and Defect Engineering</h3><p>Oxygen vacancies, active sites, electron transfer, and reaction pathways.</p><div class="hqtd-six-tags"><span>DFT</span><span>Bader</span><span>NEB</span></div><strong class="hqtd-six-link">Get to the subject.</strong></a>
      <a class="hqtd-six-card a2" href="high-end-simulation.html#membrane"><span class="topic-en">MEMBRANE &amp; INTERFACE</span><h3>Membrane Separation and Molecular Interfaces</h3><p>Interfacial polymerization, free volume, diffusive transport, and the origins of selectivity.</p><div class="hqtd-six-tags"><span>MD</span><span>MSD</span><span>Free Volume</span></div><strong class="hqtd-six-link">Get to the subject.</strong></a>
      <a class="hqtd-six-card a3" href="high-end-simulation.html#interface"><span class="topic-en">COMPLEX INTERFACE</span><h3>Interfacial Reactions of Complex Contaminants</h3><p>PFAS, heavy metals, microdrop interface enrichment and key activation.</p><div class="hqtd-six-tags"><span>MD</span><span>DFT</span><span>CI-NEB</span></div><strong class="hqtd-six-link">Get to the subject.</strong></a>
      <a class="hqtd-six-card a4" href="high-end-simulation.html#energy"><span class="topic-en">ENERGY &amp; ELECTROCHEMISTRY</span><h3>Energy and Electrochemical Interfaces</h3><p>Solventization, electrode interface, charge transfer and key intermediates.</p><div class="hqtd-six-tags"><span>DFT</span><span>MD</span><span>AIMD</span></div><strong class="hqtd-six-link">Get to the subject.</strong></a>
      <a class="hqtd-six-card a5" href="high-end-simulation.html#polymer"><span class="topic-en">POLYMER &amp; COMPOSITE</span><h3>Polymer and Composite Interfaces</h3><p>Interfacial coupling, heat transport, interaction and structural-performance relationships.</p><div class="hqtd-six-tags"><span>MD</span><span>RDF</span><span>Thermal</span></div><strong class="hqtd-six-link">Get to the subject.</strong></a>
      <a class="hqtd-six-card a6" href="high-end-simulation.html#custom"><span class="topic-en">CUSTOM ADVANCED SIMULATION</span><h3>Custom Advanced Simulation</h3><p>DFT, MD, AIMD and multi-scale approaches for non-standard scientific issues.</p><div class="hqtd-six-tags"><span>DFT</span><span>MD</span><span>AIMD</span></div><strong class="hqtd-six-link">Get into custom</strong></a>
    </div>
    <div class="hqtd-six-footer"><span>General calculation items can be selected directly from the item; Complex research issues can be accessed on the thematic page to see representative cases and calculation routes.</span><a href="Catalog.html? board=calculation simulation=high-end calculation simulation">Query for high-end computing items</a></div>`;

  const renderSimulationBoard=()=>{
    const path=String(location.pathname||'').replace(/\\/g,'/').toLowerCase();
    if(!path.endsWith('/en/board/computational-simulation.html')&&!path.endsWith('/en/board/computational-simulation.html'))return;
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
    const hub=document.createElement('aside');hub.className='highsim-floating-hub-v103';hub.setAttribute('data-highsim-floating-hub','');hub.setAttribute('aria-label',"Advanced Computational Simulation");
    hub.innerHTML=`<button class="highsim-floating-close" type="button" aria-label="Close">×</button><div class="highsim-floating-panel-head"><span class="highsim-floating-panel-kicker">ADVANCED SIMULATION</span><h2>Advanced Computational Simulation</h2></div><div class="highsim-floating-panel-grid">
      <a class="highsim-floating-topic-card highsim-blue" href="high-end-simulation.html#catalysis"><span class="highsim-floating-topic-en">CATALYSIS &amp; DEFECT</span><h3>Catalytic Mechanisms and Defect Engineering</h3><p>Oxygen vacancies, active sites, and reaction pathways.</p><div class="highsim-floating-chip-row"><span>DFT</span><span>Bader</span><span>NEB</span></div><strong>Explore Topic →</strong></a>
      <a class="highsim-floating-topic-card highsim-cyan" href="high-end-simulation.html#membrane"><span class="highsim-floating-topic-en">MEMBRANE &amp; INTERFACE</span><h3>Membrane Separation and Molecular Interfaces</h3><p>Free volume, diffusion, and structure–transport relationships.</p><div class="highsim-floating-chip-row"><span>MD</span><span>MSD</span><span>Free Volume</span></div><strong>Explore Topic →</strong></a>
      <a class="highsim-floating-topic-card highsim-violet" href="high-end-simulation.html#interface"><span class="highsim-floating-topic-en">COMPLEX INTERFACE</span><h3>Interfacial Reactions of Complex Contaminants</h3><p>PFAS, heavy metals, interface enrichment and key activation.</p><div class="highsim-floating-chip-row"><span>MD</span><span>DFT</span><span>CI-NEB</span></div><strong>Explore Topic →</strong></a>
      <a class="highsim-floating-topic-card highsim-energy" href="high-end-simulation.html#energy"><span class="highsim-floating-topic-en">ENERGY &amp; ELECTROCHEMISTRY</span><h3>Energy and Electrochemical Interfaces</h3><p>Solvation, electrode interfaces, and charge transfer.</p><div class="highsim-floating-chip-row"><span>DFT</span><span>MD</span><span>AIMD</span></div><strong>Explore Topic →</strong></a>
      <a class="highsim-floating-topic-card highsim-polymer" href="high-end-simulation.html#polymer"><span class="highsim-floating-topic-en">POLYMER &amp; COMPOSITE</span><h3>Polymer and Composite Interfaces</h3><p>Interfacial coupling, heat transfer, and structure–property relationships.</p><div class="highsim-floating-chip-row"><span>MD</span><span>RDF</span><span>Thermal</span></div><strong>Explore Topic →</strong></a>
      <a class="highsim-floating-topic-card highsim-amber" href="high-end-simulation.html#custom"><span class="highsim-floating-topic-en">CUSTOM ADVANCED SIMULATION</span><h3>Custom Advanced Simulation</h3><p>Combining DFT, MD, AIMD with multiscale methods.</p><div class="highsim-floating-chip-row"><span>DFT</span><span>MD</span><span>AIMD</span></div><strong>Explore Topic →</strong></a>
    </div><div class="highsim-floating-panel-tip">Multiscale calculations, interface behaviour and reactor understanding of complex systems focused on</div>`;
    document.body.appendChild(hub);
    const reopen=document.createElement('button');reopen.type='button';reopen.className='highsim-floating-reopen-v103';reopen.hidden=true;reopen.innerHTML="<strong>Advanced Simulation</strong><small>Click to expand the six thematic portals</small>";document.body.appendChild(reopen);
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
