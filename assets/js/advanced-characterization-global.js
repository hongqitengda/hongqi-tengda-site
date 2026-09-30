(() => {
'use strict';
const KEY='hqtd_requirement_cart_v2';
const en=(document.documentElement.lang||'').toLowerCase().startsWith('en');
const prefix=en?'/en/':'/';
const items={
'FX-201':['高端材料表征与原位分析','Advanced Materials Characterization & In-situ Analysis','项','待评估'],
'FX-202':['球差校正 TEM / STEM','Aberration-corrected TEM / STEM','小时','2600 元/小时起'],
'FX-203':['FIB 精准制样','FIB Site-specific Sample Preparation','样','2600 元/样起'],
'FX-204':['AFM 纳米力学与力曲线','AFM Nanomechanics & Force Mapping','小时','550 元/小时起'],
'FX-205':['单晶 XRD / 原位 XRD','Single-crystal / In-situ XRD','样','350 元/样起'],
'FX-206':['XPS / UPS / 深度分析','XPS / UPS / Depth Profiling','样','待评估'],
'FX-207':['EPR / ESR 缺陷与自由基分析','EPR / ESR Defects & Radicals','对象','250 元/对象起'],
'FX-208':['原位 FTIR / DRIFTS','In-situ FTIR / DRIFTS','项','方案评估'],
'FX-209':['原位 Raman','In-situ Raman','项','方案评估'],
'FX-210':['原位 XPS / Operando 电化学','In-situ XPS / Operando Electrochemistry','项','方案评估'],
'FX-211':['工业 CT / Micro-CT / Nano-CT','Industrial CT / Micro-CT / Nano-CT','样','1300 元/样起'],
'FX-212':['同步辐射 XAFS / XANES / EXAFS','Synchrotron XAFS / XANES / EXAFS','元素','2600 元/元素起'],
'FX-213':['飞秒瞬态吸收 fs-TAS','Femtosecond Transient Absorption fs-TAS','样','3100 元/样起'],
'FX-214':['穆斯堡谱','Mössbauer Spectroscopy','谱','2600 元/谱起'],
'FX-215':['正电子湮灭','Positron Annihilation Spectroscopy','样','1700 元/样起']
};
const read=()=>{try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a:[]}catch(_){return[]}};
const write=a=>localStorage.setItem(KEY,JSON.stringify(a.slice(0,100)));
const toast=msg=>{let t=document.querySelector('.hqtd-advchar-toast');if(!t){t=document.createElement('div');t.className='hqtd-advchar-toast';document.body.appendChild(t)}t.textContent=msg;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),1600)};
function add(id){
 const x=items[id];if(!x)return;
 const rows=read(),old=rows.find(r=>r.id===id);
 if(old)old.qty=Math.min(999,Number(old.qty||1)+1);
 else rows.push({id,title:en?x[1]:x[0],serviceType:en?'Material Characterization':'材料表征',board:en?'Material Characterization':'材料表征',category:en?'Advanced Characterization':'高端材料表征',qty:1,unit:x[2],price:0,priceText:x[3],note:en?'Advanced characterization project; final scope and price depend on sample and workflow.':'高端材料表征项目；具体测试条件与价格以样品及方案评估为准。',sourceUrl:prefix+'advanced-material-characterization.html'});
 write(rows);toast(old?(en?'Quantity updated':'已在需求清单中，数量已增加'):(en?'Added to request list':'已加入需求清单'));
}
function decorate(){
 document.querySelectorAll('[data-fx-id]').forEach(card=>{
   const id=card.dataset.fxId;if(!items[id]||card.querySelector('[data-advchar-add]'))return;
   const b=document.createElement('button');b.type='button';b.className='hqtd-advchar-add';b.dataset.advcharAdd=id;b.textContent=en?'Add to Request List':'加入需求清单';card.appendChild(b);
 });
 /* Fallback: cards/sections containing FX codes */
 Object.keys(items).forEach(id=>{
   [...document.querySelectorAll('article,.highend-card,.characterization-card,.service-card')].filter(el=>(el.textContent||'').includes(id)).forEach(el=>{
    if(el.querySelector('[data-advchar-add]'))return;el.dataset.fxId=id;
    const b=document.createElement('button');b.type='button';b.className='hqtd-advchar-add';b.dataset.advcharAdd=id;b.textContent=en?'Add to Request List':'加入需求清单';el.appendChild(b);
   });
 });
}
function ensureFloat(){
 const path=String(location.pathname||'').toLowerCase();
 const home=/\/(en\/)?(index\.html)?$/.test(path);
 const board=path.endsWith('/board/characterization-analysis.html');
 const topic=path.endsWith('/advanced-material-characterization.html');
 if(!(home||board||topic)||document.querySelector('[data-advchar-floating-hub]'))return;
 const hub=document.createElement('aside');hub.className='advchar-floating-hub';hub.dataset.advcharFloatingHub='';
 hub.innerHTML=`<button class="advchar-floating-close" type="button" aria-label="close">×</button>
 <span class="advchar-kicker">ADVANCED CHARACTERIZATION</span>
 <h2>${en?'Advanced Characterization':'高端材料表征专题'}</h2>
 <p>${en?'In-situ · Synchrotron · 3D · Advanced Spectroscopy':'原位 · 同步辐射 · 三维成像 · 先进谱学'}</p>
 <div class="advchar-float-actions"><a href="${prefix}advanced-material-characterization.html">${en?'Explore Topic →':'进入专题 →'}</a><button type="button" data-advchar-add="FX-201">${en?'Add Topic':'加入需求清单'}</button></div>`;
 document.body.appendChild(hub);
 const reopen=document.createElement('button');reopen.type='button';reopen.className='advchar-floating-reopen';reopen.innerHTML=`<strong>${en?'Advanced Characterization':'高端表征专题'}</strong><small>${en?'In-situ · Synchrotron · 3D':'原位 · 同步辐射 · 3D'}</small>`;document.body.appendChild(reopen);
 hub.querySelector('.advchar-floating-close').onclick=()=>{hub.hidden=true;reopen.classList.add('show')};
 reopen.onclick=()=>{reopen.classList.remove('show');hub.hidden=false};
 if(matchMedia('(max-width:820px)').matches){hub.hidden=true;reopen.classList.add('show')}
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-advchar-add]');if(b){e.preventDefault();add(b.dataset.advcharAdd)}});
const init=()=>{decorate();ensureFloat();new MutationObserver(()=>decorate()).observe(document.body,{childList:true,subtree:true})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();