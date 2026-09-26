window.HQTD_CONFIG = {
  WEB_PORTAL_URL: 'https://cloud1-d3gji859l94c3e5ec-1447812542.ap-shanghai.app.tcloudbase.com/api/webPortal',
  PDF_CONVERTER_BASE_URL: 'https://cloud1-d3gji859l94c3e5ec-1447812542.ap-shanghai.app.tcloudbase.com/api/pdf-converter',
  SITE_URL: 'https://www.hongqitengda.com/',
  WECHAT_WEB_APPID: '',
  WECHAT_CALLBACK_URL: 'https://www.hongqitengda.com/wechat-callback.html',
  FEATURES: {
    wechatLogin: false,
    smsVerification: false,
    officialAccountNotification: true,
    documentExport: true
  }
};


/* HQTD V12.4 customer-center multilingual layer.
   Free-text customer input is preserved exactly as submitted.
   Structured project fields are normalized to Chinese using project ID. */
(()=>{'use strict';
const q=new URLSearchParams(location.search);
let L=(q.get('lang')||localStorage.getItem('hqtd_locale')||document.documentElement.lang||navigator.language||'zh').toLowerCase();
L=L.startsWith('zh-hant')||L==='zh-tw'||L==='zh-hk'?'zh-hant':L.startsWith('zh')?'zh':L.slice(0,2);
if(!['zh','zh-hant','en','fr','es','ar','ru'].includes(L))L='en';
localStorage.setItem('hqtd_locale',L);
if(L==='zh'||L==='zh-hant')return;
document.documentElement.lang=L;document.documentElement.dir=L==='ar'?'rtl':'ltr';
const M={
en:{'客户中心':'Customer Center','首页':'Home','业务进度':'Business Progress','交付文件':'Deliverables','售后服务':'After-sales Service','合同':'Contracts','发票':'Invoices','消息':'Messages','账户':'Account','登录':'Log in','注册':'Register','退出登录':'Log out','提交需求':'Submit Request','选择项目':'Select Project','更换项目':'Change Project','查找项目':'Find Projects','保存':'Save','提交':'Submit','联系人':'Contact','单位':'Organization','手机号':'Phone','邮箱':'Email','预算':'Budget','预计日期':'Expected Date'},
fr:{'客户中心':'Centre client','首页':'Accueil','业务进度':'Suivi des projets','交付文件':'Livrables','售后服务':'Service après-vente','合同':'Contrats','发票':'Factures','消息':'Messages','账户':'Compte','登录':'Connexion','注册':'Inscription','退出登录':'Déconnexion','提交需求':'Envoyer la demande','选择项目':'Choisir un projet','更换项目':'Changer de projet','查找项目':'Rechercher des projets','保存':'Enregistrer','提交':'Envoyer','联系人':'Contact','单位':'Organisation','手机号':'Téléphone','邮箱':'E-mail','预算':'Budget','预计日期':'Date souhaitée'},
es:{'客户中心':'Centro de clientes','首页':'Inicio','业务进度':'Progreso','交付文件':'Archivos entregados','售后服务':'Servicio posventa','合同':'Contratos','发票':'Facturas','消息':'Mensajes','账户':'Cuenta','登录':'Iniciar sesión','注册':'Registrarse','退出登录':'Cerrar sesión','提交需求':'Enviar solicitud','选择项目':'Seleccionar proyecto','更换项目':'Cambiar proyecto','查找项目':'Buscar proyectos','保存':'Guardar','提交':'Enviar','联系人':'Contacto','单位':'Organización','手机号':'Teléfono','邮箱':'Correo electrónico','预算':'Presupuesto','预计日期':'Fecha prevista'},
ar:{'客户中心':'مركز العملاء','首页':'الرئيسية','业务进度':'تقدم الأعمال','交付文件':'ملفات التسليم','售后服务':'خدمة ما بعد البيع','合同':'العقود','发票':'الفواتير','消息':'الرسائل','账户':'الحساب','登录':'تسجيل الدخول','注册':'إنشاء حساب','退出登录':'تسجيل الخروج','提交需求':'إرسال الطلب','选择项目':'اختيار مشروع','更换项目':'تغيير المشروع','查找项目':'البحث عن المشاريع','保存':'حفظ','提交':'إرسال','联系人':'جهة الاتصال','单位':'المؤسسة','手机号':'الهاتف','邮箱':'البريد الإلكتروني','预算':'الميزانية','预计日期':'التاريخ المتوقع'},
ru:{'客户中心':'Клиентский центр','首页':'Главная','业务进度':'Ход работ','交付文件':'Файлы','售后服务':'Поддержка','合同':'Договоры','发票':'Счета','消息':'Сообщения','账户':'Аккаунт','登录':'Войти','注册':'Регистрация','退出登录':'Выйти','提交需求':'Отправить запрос','选择项目':'Выбрать проект','更换项目':'Сменить проект','查找项目':'Найти проекты','保存':'Сохранить','提交':'Отправить','联系人':'Контакт','单位':'Организация','手机号':'Телефон','邮箱':'E-mail','预算':'Бюджет','预计日期':'Желаемая дата'}
}[L];
const han=/[\u3400-\u9fff]/;
function trText(s){let x=s;Object.entries(M).sort((a,b)=>b[0].length-a[0].length).forEach(([a,b])=>x=x.split(a).join(b));return x}
function translate(root=document){
 const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),a=[];while(w.nextNode())a.push(w.currentNode);
 a.forEach(n=>{if(n.parentElement?.closest('script,style'))return;const s=n.nodeValue;if(han.test(s)){const t=trText(s);if(t!==s)n.nodeValue=t}});
 document.querySelectorAll('input[placeholder],textarea[placeholder]').forEach(n=>{const s=n.getAttribute('placeholder')||'',t=trText(s);if(t!==s)n.setAttribute('placeholder',t)});
}
let lock=false;function run(){if(lock)return;lock=true;try{translate()}finally{lock=false}}
document.addEventListener('DOMContentLoaded',run);new MutationObserver(()=>requestAnimationFrame(run)).observe(document.documentElement,{subtree:true,childList:true});

let catalog=[];
fetch('../assets/data/catalog.json').then(r=>r.json()).then(x=>catalog=Array.isArray(x)?x:[]).catch(()=>{});
function canon(x){
 if(!x||typeof x!=='object')return x;
 const id=String(x.id||x.projectId||x.projectCode||'').toUpperCase();
 const c=catalog.find(v=>String(v.id||'').toUpperCase()===id);
 if(!c)return x;
 return {...x,projectId:id||x.projectId,projectCode:id||x.projectCode,
   projectName:c.service||x.projectName,title:c.service||x.title,name:c.service||x.name,
   serviceType:c.board||x.serviceType,board:c.board||x.board,category:c.category||x.category};
}
const nativeFetch=window.fetch.bind(window);
window.fetch=async function(input,init){
 try{
  if(init?.method==='POST'&&typeof init.body==='string'){
   const b=JSON.parse(init.body),a=b.action||'';
   if(['createRequirement','createOrder','createAfterSale','createInvoiceRequest'].includes(a)){
    b.sourceLocale=L;b.backendLanguage='zh-CN';
    /* Customer-written description/note/contact text is deliberately NOT translated. */
    if(b.projectId||b.projectCode)Object.assign(b,canon(b));
    if(b.formData)b.formData=canon(b.formData);
    if(Array.isArray(b.items))b.items=b.items.map(canon);
    if(Array.isArray(b.cartItems))b.cartItems=b.cartItems.map(canon);
    init={...init,body:JSON.stringify(b)};
   }
  }
 }catch(_){}
 return nativeFetch(input,init);
};
})();