(() => {
'use strict';
const EN=(document.documentElement.lang||'').toLowerCase().startsWith('en');
const KEY=EN?'hqtd_en_requirement_cart_v2':'hqtd_requirement_cart_v2';
const ROOT=EN?'/en/':'/';
const all={
'FX-202':['球差校正 TEM / STEM','Aberration-corrected TEM / STEM','小时','2600 元/小时起','TEM · STEM · EELS'],
'FX-203':['FIB 精准制样','FIB Site-specific Sample Preparation','样','2600 元/样起','FIB · Lamella · Cross-section'],
'FX-204':['AFM / 纳米力学','AFM / Nanomechanics','小时','550 元/小时起','AFM · Force Mapping · Modulus'],
'FX-205':['单晶 XRD / 原位 XRD','Single-crystal / In-situ XRD','样','350 元/样起','SC-XRD · In-situ XRD'],
'FX-206':['XPS / UPS / 深度分析','XPS / UPS / Depth Profiling','项','方案评估','XPS · UPS · Depth'],
'FX-207':['EPR / ESR','EPR / ESR','对象','250 元/对象起','Radical · Defect · Spin'],
'FX-208':['原位 FTIR / DRIFTS','In-situ FTIR / DRIFTS','项','方案评估','FTIR · DRIFTS · Intermediate'],
'FX-209':['原位 Raman','In-situ Raman','项','方案评估','Raman · In-situ'],
'FX-210':['原位 XPS / Operando 电化学','In-situ XPS / Operando Electrochemistry','项','方案评估','XPS · Operando · Electrochemistry'],
'FX-211':['工业 / Micro / Nano CT','Industrial / Micro / Nano CT','样','1300 元/样起','CT · 3D · NDT'],
'FX-212':['同步辐射 XAFS / XANES / EXAFS','Synchrotron XAFS / XANES / EXAFS','元素','2600 元/元素起','XAFS · XANES · EXAFS'],
'FX-213':['飞秒瞬态吸收 fs-TAS','Femtosecond Transient Absorption fs-TAS','样','3100 元/样起','fs-TAS · Carrier Dynamics'],
'FX-214':['穆斯堡谱','Mössbauer Spectroscopy','谱','2600 元/谱起','Mössbauer · Valence'],
'FX-215':['正电子湮灭','Positron Annihilation Spectroscopy','样','1700 元/样起','PALS · Vacancy · Free Volume']
};
const featured=['FX-202','FX-203','FX-204','FX-210','FX-211','FX-212'];
const read=()=>{try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a:[]}catch(_){return[]}};
const save=a=>localStorage.setItem(KEY,JSON.stringify(a.slice(0,100)));
const item=id=>{const x=all[id];return {id,title:EN?x[1]:x[0],serviceType:EN?'Material Characterization':'材料表征',board:EN?'Material Characterization':'材料表征',category:EN?'Advanced Characterization':'高端材料表征',qty:1,unit:x[2],price:0,priceText:x[3],note:EN?'Single advanced-characterization request; final scope and quotation depend on sample and workflow.':'单项高端表征需求；具体条件与报价以样品和方案评估为准。',sourceUrl:ROOT+'advanced-material-characterization.html'}};
const toast=m=>{let t=document.querySelector('.hqtd-advchar-toast');if(!t){t=document.createElement('div');t.className='hqtd-advchar-toast';document.body.appendChild(t)}t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),1500)};
function add(id){if(!all[id])return;const rows=read(),old=rows.find(v=>v.id===id);if(old)old.qty=Math.min(999,Number(old.qty||1)+1);else rows.push(item(id));save(rows);toast(old?(EN?'Quantity updated':'数量已增加'):(EN?'Added to Request List':'已加入需求清单'))}
function submitOne(id){if(!all[id])return;localStorage.setItem(KEY,JSON.stringify([item(id)]));location.href=ROOT+'demand-list.html?single='+encodeURIComponent(id)}
function actionHtml(id){return `<div class="advchar-final-actions"><a href="${ROOT}advanced-material-characterization.html">${EN?'Details →':'查看详情 →'}</a><button type="button" data-advchar-add="${id}">${EN?'Add':'加入清单'}</button><button type="button" data-advchar-submit-one="${id}">${EN?'Submit This Item':'单项提交'}</button></div>`}
function sectionHtml(){return `<div class="container"><div class="hqtd-six-head"><div><span class="section-en">ADVANCED MATERIALS CHARACTERIZATION</span><h2>${EN?'Advanced Materials Characterization & In-situ Analysis':'高端材料表征与原位分析'}</h2></div><p>${EN?'Advanced microscopy, in-situ/operando, synchrotron and 3D imaging organized around research questions.':'球差电镜、原位 / Operando、同步辐射与三维成像，围绕科研问题组织高端表征证据链。'}</p></div><div class="hqtd-six-grid">${featured.map((id,i)=>{const x=all[id];return `<article class="hqtd-six-card a${i+1}"><span class="topic-en">${x[4]}</span><h3>${EN?x[1]:x[0]}</h3><p>${EN?'Independent technique request with workflow design and data interpretation.':'每一项均可独立提交需求，并按样品与科研目标设计测试及数据解析方案。'}</p><div class="hqtd-six-tags">${x[4].split(' · ').map(v=>`<span>${v}</span>`).join('')}</div>${actionHtml(id)}</article>`}).join('')}</div><div class="hqtd-six-footer"><span>${EN?'Each technique can be submitted independently.':'每个高端表征项目均可单项提交，不会捆绑其他项目。'}</span><a href="${ROOT}advanced-material-characterization.html">${EN?'View all advanced characterization →':'查看全部高端表征 →'}</a></div></div>`}
function ensureSection(){
 const p=String(location.pathname||'').replace(/\\/g,'/').toLowerCase();
 const home=p==='/'||p==='/index.html'||p==='/en/'||p==='/en/index.html'||document.body.classList.contains('homepage-redone');
 const board=p.endsWith('/board/characterization-analysis.html');
 if(!(home||board)||document.getElementById('advanced-characterization-topic'))return;
 const main=document.querySelector('main');if(!main)return;
 /* Exact requested position: immediately AFTER the existing "更多检测方向 / More testing directions" strip,
    i.e. after its whole section; before CATEGORIES on board, and before the next homepage section. */
 const strip=main.querySelector('.hqt-more-strip');
 const hostSection=strip?.closest('section');
 if(!hostSection)return;
 const sec=document.createElement('section');sec.id='advanced-characterization-topic';sec.className='section hqtd-six-topic-section advchar-final-section';sec.innerHTML=sectionHtml();
 hostSection.insertAdjacentElement('afterend',sec);
}
function ensureFloat(){
 const p=String(location.pathname||'').replace(/\\/g,'/').toLowerCase();
 const home=p==='/'||p==='/index.html'||p==='/en/'||p==='/en/index.html'||document.body.classList.contains('homepage-redone');
 if(!home||document.querySelector('[data-advchar-floating-hub]'))return;
 const colors=['#1f6fd6','#178f87','#6b5fd7','#c58a28','#4e7aa3','#8a6f48'];
 const hub=document.createElement('aside');hub.className='advchar-floating-hub-final';hub.dataset.advcharFloatingHub='';
 hub.innerHTML=`<button class="advchar-floating-close" type="button" aria-label="${EN?'Close':'关闭'}">×</button><div class="advchar-floating-panel-head"><span class="advchar-floating-panel-kicker">ADVANCED CHARACTERIZATION</span><h2>${EN?'Advanced Characterization':'高端材料表征专题'}</h2></div><div class="advchar-floating-panel-grid">${featured.map((id,i)=>{const x=all[id];return `<article class="advchar-floating-topic-card" style="--adv:${colors[i]}"><span class="advchar-floating-topic-en">${x[4]}</span><h3>${EN?x[1]:x[0]}</h3><p>${EN?'Independent request and workflow.':'可独立提交测试需求。'}</p><div class="advchar-floating-chip-row">${x[4].split(' · ').map(v=>`<span>${v}</span>`).join('')}</div><div class="advchar-floating-card-actions"><a href="${ROOT}advanced-material-characterization.html">${EN?'Details →':'详情 →'}</a><button data-advchar-add="${id}">${EN?'Add':'加入'}</button><button data-advchar-submit-one="${id}">${EN?'Submit':'单项提交'}</button></div></article>`}).join('')}</div>`;
 document.body.appendChild(hub);
 const reopen=document.createElement('button');reopen.type='button';reopen.className='advchar-floating-reopen-final';reopen.hidden=true;reopen.innerHTML=`<strong>${EN?'Advanced Characterization':'高端表征专题'}</strong><small>${EN?'Open six technique groups':'展开 6 类高端表征'}</small>`;document.body.appendChild(reopen);
 hub.querySelector('.advchar-floating-close').onclick=()=>{hub.hidden=true;reopen.hidden=false};reopen.onclick=()=>{reopen.hidden=true;hub.hidden=false};
 if(matchMedia('(max-width:820px)').matches){hub.hidden=true;reopen.hidden=false}
}
function decorateTopicPage(){
 const p=String(location.pathname||'').toLowerCase();if(!p.endsWith('/advanced-material-characterization.html'))return;
 const mapping=[
 [/球差|aberration-corrected/i,'FX-202'],[/FIB/i,'FX-203'],[/AFM|nanomechan/i,'FX-204'],[/单晶 XRD|single-crystal|原位 \/ 变温 XRD|in-situ XRD/i,'FX-205'],[/XPS \/ UPS|depth profil/i,'FX-206'],[/EPR|ESR/i,'FX-207'],[/FTIR|DRIFTS/i,'FX-208'],[/原位 Raman|in-situ Raman/i,'FX-209'],[/原位 XPS|Operando Electrochem/i,'FX-210'],[/工业 CT|Micro-CT|Nano-CT|Industrial CT/i,'FX-211'],[/XAFS|XANES|EXAFS/i,'FX-212'],[/fs-TAS|transient absorption/i,'FX-213'],[/穆斯堡|Mössbauer/i,'FX-214'],[/正电子|positron annihilation|PALS/i,'FX-215']
 ];
 document.querySelectorAll('main article').forEach(a=>{if(a.querySelector('.amc-card-actions-final'))return;const txt=a.textContent||'';const m=mapping.find(([rx])=>rx.test(txt));if(!m)return;const id=m[1],box=document.createElement('div');box.className='amc-card-actions-final';box.innerHTML=`<button type="button" data-advchar-add="${id}">${EN?'Add to Request List':'加入需求清单'}</button><button type="button" data-advchar-submit-one="${id}">${EN?'Submit This Item':'单项提交此项'}</button>`;a.appendChild(box)});
}
document.addEventListener('click',e=>{const one=e.target.closest('[data-advchar-submit-one]');if(one){e.preventDefault();submitOne(one.dataset.advcharSubmitOne);return}const addBtn=e.target.closest('[data-advchar-add]');if(addBtn){e.preventDefault();add(addBtn.dataset.advcharAdd)}});
const init=()=>{ensureSection();ensureFloat();decorateTopicPage()};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();