(() => {
  'use strict';
  const FAVORITES_KEY='hqtd_en_favorites_v11';
  const RECENT_KEY='hqtd_en_recent_orders_v11';
  const read=(k,d=[])=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(e){return d}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  window.HQTDEnterprise={
    getFavorites:()=>read(FAVORITES_KEY),
    toggleFavorite(project){const list=read(FAVORITES_KEY);const i=list.findIndex(x=>x.id===project.id);if(i>=0)list.splice(i,1);else list.unshift({...project,savedAt:Date.now()});write(FAVORITES_KEY,list.slice(0,50));return i<0},
    saveRecentOrder(order){const list=read(RECENT_KEY).filter(x=>x.businessNo!==order.businessNo);list.unshift({...order,savedAt:Date.now()});write(RECENT_KEY,list.slice(0,20));},
    getRecentOrders:()=>read(RECENT_KEY),
    copyOrder(order){return {...order,businessNo:'',status:'draft',copiedFrom:order.businessNo||'',createdAt:new Date().toISOString()}},
    timeline(status){const steps=["Submitted","Accepted","Quoted","Confirmed","In Progress","Completed","Delivery"];const aliases={pending:"Submitted",submitted:"Submitted",accepted:"Accepted",quoted:"Quoted",confirmed:"Confirmed",processing:"In Progress",completed:"Completed",delivered:"Delivery"};const current=aliases[status]||status||"Submitted";const idx=Math.max(0,steps.indexOf(current));return steps.map((name,i)=>({name,done:i<=idx,current:i===idx}));}
  };
})();