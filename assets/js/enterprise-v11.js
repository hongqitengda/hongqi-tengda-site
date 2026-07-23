(() => {
  'use strict';
  const FAVORITES_KEY='hqtd_favorites_v11';
  const RECENT_KEY='hqtd_recent_orders_v11';
  const read=(k,d=[])=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(e){return d}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  window.HQTDEnterprise={
    getFavorites:()=>read(FAVORITES_KEY),
    toggleFavorite(project){const list=read(FAVORITES_KEY);const i=list.findIndex(x=>x.id===project.id);if(i>=0)list.splice(i,1);else list.unshift({...project,savedAt:Date.now()});write(FAVORITES_KEY,list.slice(0,50));return i<0},
    saveRecentOrder(order){const list=read(RECENT_KEY).filter(x=>x.businessNo!==order.businessNo);list.unshift({...order,savedAt:Date.now()});write(RECENT_KEY,list.slice(0,20));},
    getRecentOrders:()=>read(RECENT_KEY),
    copyOrder(order){return {...order,businessNo:'',status:'draft',copiedFrom:order.businessNo||'',createdAt:new Date().toISOString()}},
    timeline(status){const steps=['已提交','已受理','已报价','已确认','进行中','已完成','已交付'];const aliases={pending:'已提交',submitted:'已提交',accepted:'已受理',quoted:'已报价',confirmed:'已确认',processing:'进行中',completed:'已完成',delivered:'已交付'};const current=aliases[status]||status||'已提交';const idx=Math.max(0,steps.indexOf(current));return steps.map((name,i)=>({name,done:i<=idx,current:i===idx}));}
  };
})();