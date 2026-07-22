(() => {
'use strict';
const data=(window.HQTD_CATALOG_DATA||[]).filter(x=>x.board==='耗材仪器');
const cards=[...document.querySelectorAll('[data-supply-category]')],panel=document.getElementById('supply-category-projects'),title=document.getElementById('supply-category-title'),count=document.getElementById('supply-category-count'),grid=document.getElementById('supply-category-results'),search=document.getElementById('supply-category-search'),more=document.getElementById('supply-category-more'),allLink=document.getElementById('supply-category-all-link');
if(!cards.length||!panel)return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v??'').normalize('NFKC').toLowerCase().replace(/[\s·•_—–\-\/\\（）()【】\[\]，,、；;：:'"“”‘’.]+/g,'');
let category='',rows=[],shown=18;
function itemCard(i){return `<article class="supply-project-card"><div><span>${esc(i.id)}</span><strong>${esc(i.service)}</strong><small>${esc(i.details||i.category)}</small></div><div class="supply-project-meta"><span>${esc(i.priceText||(i.price==null?'面议':`¥${i.price}`))} / ${esc(i.unit||'项')}</span><a href="${esc(i.detailUrl)}">查看详情</a></div></article>`;}
function render(){const q=norm(search.value),filtered=rows.filter(i=>!q||norm([i.id,i.service,i.details].join(' ')).includes(q));grid.innerHTML=filtered.slice(0,shown).map(itemCard).join('');count.textContent=`${filtered.length} 项`;more.hidden=filtered.length<=shown;allLink.href='catalog.html?'+new URLSearchParams({board:'耗材仪器',category}).toString();if(!filtered.length)grid.innerHTML='<div class="supply-no-result">当前关键词没有匹配项目，可进入项目查询或联系表征/耗材顾问。</div>';}
function open(cat,source){category=cat;rows=data.filter(i=>norm(i.category)===norm(cat));shown=18;search.value='';title.textContent=cat;cards.forEach(c=>{const active=c===source;c.classList.toggle('active',active);c.setAttribute('aria-expanded',String(active));});panel.hidden=false;render();setTimeout(()=>panel.scrollIntoView({behavior:'smooth',block:'start'}),50);}
cards.forEach(c=>c.addEventListener('click',e=>{e.preventDefault();open(c.dataset.supplyCategory,c);}));search.oninput=()=>{shown=18;render();};more.onclick=()=>{shown+=18;render();};
})();