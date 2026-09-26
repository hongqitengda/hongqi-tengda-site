/* HQTD V12.5 — LANGUAGE ONLY
   This file changes visible language only. It does not change ordering,
   cart/order/PDF/customer-center links, data, API payloads, or sitemap. */
window.HQTD_I18N={
"zh-hant":{"html_lang":"zh-Hant","dir":"ltr","label":"繁體中文","company":"上海紅祺騰達信息技術有限公司","site":"紅祺騰達科研服務","nav":["首頁","AI 專案","計算模擬","材料表徵 / 環境檢測","耗材儀器","專案查詢"],"browse":"瀏覽全部專案","contact":"技術諮詢","search":"搜尋專案、方法、儀器或型號","request":"需求清單","add":"加入需求清單","more":"瞭解更多","price":"參考費用","cycle":"週期","category":"分類","board":"板塊","quote":"待評估","original":"原始目錄名稱","results":"項結果","clear":"清空","remove":"移除","email":"郵件諮詢"},
"en":{"html_lang":"en","dir":"ltr","label":"English","company":"Shanghai Hongqi Tengda Information Technology Co., Ltd.","site":"HQTD Scientific Services","nav":["Home","AI Projects","Computational Simulation","Characterization & Testing","Supplies & Instruments","Project Catalog"],"browse":"Browse all projects","contact":"Technical consultation","search":"Search projects, methods, instruments or models","request":"Request List","add":"Add to request list","more":"Learn more","price":"Reference price","cycle":"Lead time","category":"Category","board":"Service area","quote":"Quote on request","original":"Source catalog name","results":"results","clear":"Clear list","remove":"Remove","email":"Email"},
"fr":{"html_lang":"fr","dir":"ltr","label":"Français","company":"Shanghai Hongqi Tengda Information Technology Co., Ltd.","site":"Services scientifiques HQTD","nav":["Accueil","Projets IA","Simulation numérique","Caractérisation & analyses","Fournitures & instruments","Catalogue des projets"],"browse":"Parcourir les projets","contact":"Consultation technique","search":"Rechercher un projet, une méthode, un instrument ou un modèle","request":"Liste des demandes","add":"Ajouter à la demande","more":"En savoir plus","price":"Prix indicatif","cycle":"Délai","category":"Catégorie","board":"Domaine","quote":"Sur devis","original":"Nom du catalogue source","results":"résultats","clear":"Vider la liste","remove":"Supprimer","email":"E-mail"},
"es":{"html_lang":"es","dir":"ltr","label":"Español","company":"Shanghai Hongqi Tengda Information Technology Co., Ltd.","site":"Servicios científicos HQTD","nav":["Inicio","Proyectos de IA","Simulación computacional","Caracterización y ensayos","Suministros e instrumentos","Catálogo de proyectos"],"browse":"Explorar proyectos","contact":"Consulta técnica","search":"Buscar proyectos, métodos, instrumentos o modelos","request":"Lista de solicitudes","add":"Añadir a la solicitud","more":"Más información","price":"Precio de referencia","cycle":"Plazo","category":"Categoría","board":"Área","quote":"Cotización previa","original":"Nombre del catálogo de origen","results":"resultados","clear":"Vaciar lista","remove":"Eliminar","email":"Correo"},
"ar":{"html_lang":"ar","dir":"rtl","label":"العربية","company":"Shanghai Hongqi Tengda Information Technology Co., Ltd.","site":"خدمات HQTD العلمية","nav":["الرئيسية","مشروعات الذكاء الاصطناعي","المحاكاة الحاسوبية","التوصيف والاختبارات","المستلزمات والأجهزة","دليل المشروعات"],"browse":"استعراض المشروعات","contact":"استشارة تقنية","search":"ابحث عن مشروع أو طريقة أو جهاز أو طراز","request":"قائمة الطلبات","add":"إضافة إلى قائمة الطلب","more":"معرفة المزيد","price":"السعر المرجعي","cycle":"مدة التنفيذ","category":"الفئة","board":"مجال الخدمة","quote":"حسب التقييم","original":"اسم الدليل الأصلي","results":"نتيجة","clear":"مسح القائمة","remove":"إزالة","email":"البريد الإلكتروني"},
"ru":{"html_lang":"ru","dir":"ltr","label":"Русский","company":"Shanghai Hongqi Tengda Information Technology Co., Ltd.","site":"Научные услуги HQTD","nav":["Главная","ИИ-проекты","Вычислительное моделирование","Характеризация и анализ","Расходные материалы и приборы","Каталог проектов"],"browse":"Открыть каталог","contact":"Техническая консультация","search":"Поиск проекта, метода, прибора или модели","request":"Список запросов","add":"Добавить в запрос","more":"Подробнее","price":"Ориентировочная цена","cycle":"Срок","category":"Категория","board":"Направление","quote":"По запросу","original":"Название в исходном каталоге","results":"результатов","clear":"Очистить","remove":"Удалить","email":"E-mail"}
};

(()=>{'use strict';
const p=location.pathname.match(/^\/(zh-hant|en|fr|es|ar|ru)\//);
const L=p?p[1]:'';
if(!L)return;
localStorage.setItem('hqtd_locale',L);
document.documentElement.lang=window.HQTD_I18N[L]?.html_lang||L;
document.documentElement.dir=window.HQTD_I18N[L]?.dir||'ltr';

const T={
'en':{
'首页':'Home','项目查询':'Project Catalog','项目详情':'Project Details','全部':'All','分类':'Category','板块':'Service Area','搜索项目':'Search Projects',
'立即下单':'Order Now','直接下单':'Order Now','下单':'Order','加入需求清单':'Add to Request List','需求清单':'Request List','查看需求清单':'View Request List',
'提交需求':'Submit Request','技术咨询':'Technical Consultation','在线咨询':'Online Consultation','联系我们':'Contact Us','客户中心':'Customer Center',
'查看案例':'View Case','案例详情':'Case Details','查看 PDF':'View PDF','查看PDF':'View PDF','下载 PDF':'Download PDF','下载PDF':'Download PDF','下载案例 PDF':'Download Case PDF',
'了解更多':'Learn More','参考费用':'Reference Price','周期':'Lead Time','待评估':'Quote on Request','清空':'Clear','移除':'Remove',
'AI项目':'AI Projects','计算模拟':'Computational Simulation','分析表征':'Characterization & Testing','表征&检测':'Characterization & Testing','耗材仪器':'Supplies & Instruments',
'AI医学影像':'AI Medical Imaging','AI材料筛选':'AI Materials Screening','AI工艺优化':'AI Process Optimization','AI知识库':'AI Knowledge Base','AI多模态分析':'AI Multimodal Analysis','AI预测建模':'AI Predictive Modeling','AI实验设计':'AI Experimental Design','AI智能体':'AI Agents','AI定制开发':'Custom AI Development',
'计算流体力学':'Computational Fluid Dynamics','第一性原理计算':'First-Principles / DFT','分子动力学':'Molecular Dynamics','多物理场与有限元仿真':'Multiphysics & FEA','量子化学与分子计算':'Quantum Chemistry',
'谱学物相':'Spectroscopy & Phase Analysis','形貌结构':'Morphology & Structure','成分元素':'Composition & Elemental Analysis','表面界面与润湿性':'Surface / Interface / Wettability','性能可靠性':'Performance & Reliability',
'温室气体':'Greenhouse Gases','微塑料':'Microplastics','水质常规检测':'Routine Water Testing','土壤常规检测':'Routine Soil Testing','综合检测与方法开发':'Custom Analysis & Method Development','高端计算模拟':'Advanced Computational Science',
'返回':'Back','关闭':'Close','咨询':'Consult','查看详情':'View Details','提交':'Submit','登录':'Log In','注册':'Register'
},
'fr':{
'首页':'Accueil','项目查询':'Catalogue des projets','项目详情':'Détails du projet','全部':'Tous','分类':'Catégorie','板块':'Domaine','搜索项目':'Rechercher des projets',
'立即下单':'Commander','直接下单':'Commander','下单':'Commander','加入需求清单':'Ajouter à la demande','需求清单':'Liste des demandes','查看需求清单':'Voir la liste des demandes',
'提交需求':'Envoyer la demande','技术咨询':'Consultation technique','在线咨询':'Consultation en ligne','联系我们':'Nous contacter','客户中心':'Centre client',
'查看案例':'Voir le cas','案例详情':'Détails du cas','查看 PDF':'Voir le PDF','查看PDF':'Voir le PDF','下载 PDF':'Télécharger le PDF','下载PDF':'Télécharger le PDF','下载案例 PDF':'Télécharger le PDF du cas',
'了解更多':'En savoir plus','参考费用':'Prix indicatif','周期':'Délai','待评估':'Sur devis','清空':'Vider','移除':'Supprimer',
'AI项目':'Projets IA','计算模拟':'Simulation numérique','分析表征':'Caractérisation & analyses','表征&检测':'Caractérisation & analyses','耗材仪器':'Fournitures & instruments',
'AI医学影像':'Imagerie médicale par IA','AI材料筛选':'Criblage de matériaux par IA','AI工艺优化':'Optimisation de procédés par IA','AI知识库':'Base de connaissances IA','AI多模态分析':'Analyse multimodale IA','AI预测建模':'Modélisation prédictive IA','AI实验设计':'Planification expérimentale IA','AI智能体':'Agents IA','AI定制开发':'Développement IA sur mesure',
'计算流体力学':'Mécanique des fluides numérique','第一性原理计算':'Calculs ab initio / DFT','分子动力学':'Dynamique moléculaire','多物理场与有限元仿真':'Multiphysique & éléments finis','量子化学与分子计算':'Chimie quantique',
'谱学物相':'Spectroscopie & phases','形貌结构':'Morphologie & structure','成分元素':'Composition & analyse élémentaire','表面界面与润湿性':'Surface / interface / mouillabilité','性能可靠性':'Performance & fiabilité',
'温室气体':'Gaz à effet de serre','微塑料':'Microplastiques','水质常规检测':'Analyse courante de l’eau','土壤常规检测':'Analyse courante des sols','综合检测与方法开发':'Analyse sur mesure & développement de méthodes','高端计算模拟':'Simulation scientifique avancée',
'返回':'Retour','关闭':'Fermer','咨询':'Consulter','查看详情':'Voir les détails','提交':'Envoyer','登录':'Connexion','注册':'Inscription'
},
'es':{
'首页':'Inicio','项目查询':'Catálogo de proyectos','项目详情':'Detalles del proyecto','全部':'Todos','分类':'Categoría','板块':'Área','搜索项目':'Buscar proyectos',
'立即下单':'Realizar pedido','直接下单':'Realizar pedido','下单':'Realizar pedido','加入需求清单':'Añadir a la solicitud','需求清单':'Lista de solicitudes','查看需求清单':'Ver lista de solicitudes',
'提交需求':'Enviar solicitud','技术咨询':'Consulta técnica','在线咨询':'Consulta en línea','联系我们':'Contáctenos','客户中心':'Centro de clientes',
'查看案例':'Ver caso','案例详情':'Detalles del caso','查看 PDF':'Ver PDF','查看PDF':'Ver PDF','下载 PDF':'Descargar PDF','下载PDF':'Descargar PDF','下载案例 PDF':'Descargar PDF del caso',
'了解更多':'Más información','参考费用':'Precio de referencia','周期':'Plazo','待评估':'Cotización previa','清空':'Vaciar','移除':'Eliminar',
'AI项目':'Proyectos de IA','计算模拟':'Simulación computacional','分析表征':'Caracterización y ensayos','表征&检测':'Caracterización y ensayos','耗材仪器':'Suministros e instrumentos',
'AI医学影像':'Imágenes médicas con IA','AI材料筛选':'Cribado de materiales con IA','AI工艺优化':'Optimización de procesos con IA','AI知识库':'Base de conocimiento con IA','AI多模态分析':'Análisis multimodal con IA','AI预测建模':'Modelado predictivo con IA','AI实验设计':'Diseño experimental con IA','AI智能体':'Agentes de IA','AI定制开发':'Desarrollo de IA a medida',
'计算流体力学':'Dinámica de fluidos computacional','第一性原理计算':'Cálculos de primeros principios / DFT','分子动力学':'Dinámica molecular','多物理场与有限元仿真':'Multifísica y elementos finitos','量子化学与分子计算':'Química cuántica',
'谱学物相':'Espectroscopia y análisis de fases','形貌结构':'Morfología y estructura','成分元素':'Composición y análisis elemental','表面界面与润湿性':'Superficie / interfaz / humectabilidad','性能可靠性':'Rendimiento y fiabilidad',
'温室气体':'Gases de efecto invernadero','微塑料':'Microplásticos','水质常规检测':'Análisis rutinario de agua','土壤常规检测':'Análisis rutinario de suelo','综合检测与方法开发':'Análisis personalizado y desarrollo de métodos','高端计算模拟':'Ciencia computacional avanzada',
'返回':'Volver','关闭':'Cerrar','咨询':'Consultar','查看详情':'Ver detalles','提交':'Enviar','登录':'Iniciar sesión','注册':'Registrarse'
},
'ar':{
'首页':'الرئيسية','项目查询':'دليل المشروعات','项目详情':'تفاصيل المشروع','全部':'الكل','分类':'الفئة','板块':'مجال الخدمة','搜索项目':'البحث عن المشروعات',
'立即下单':'اطلب الآن','直接下单':'اطلب الآن','下单':'اطلب','加入需求清单':'إضافة إلى قائمة الطلب','需求清单':'قائمة الطلبات','查看需求清单':'عرض قائمة الطلبات',
'提交需求':'إرسال الطلب','技术咨询':'استشارة تقنية','在线咨询':'استشارة عبر الإنترنت','联系我们':'اتصل بنا','客户中心':'مركز العملاء',
'查看案例':'عرض الحالة','案例详情':'تفاصيل الحالة','查看 PDF':'عرض PDF','查看PDF':'عرض PDF','下载 PDF':'تنزيل PDF','下载PDF':'تنزيل PDF','下载案例 PDF':'تنزيل ملف PDF للحالة',
'了解更多':'معرفة المزيد','参考费用':'السعر المرجعي','周期':'مدة التنفيذ','待评估':'حسب التقييم','清空':'مسح','移除':'إزالة',
'AI项目':'مشروعات الذكاء الاصطناعي','计算模拟':'المحاكاة الحاسوبية','分析表征':'التوصيف والاختبارات','表征&检测':'التوصيف والاختبارات','耗材仪器':'المستلزمات والأجهزة',
'AI医学影像':'التصوير الطبي بالذكاء الاصطناعي','AI材料筛选':'فحص المواد بالذكاء الاصطناعي','AI工艺优化':'تحسين العمليات بالذكاء الاصطناعي','AI知识库':'قاعدة معرفة بالذكاء الاصطناعي','AI多模态分析':'تحليل متعدد الوسائط بالذكاء الاصطناعي','AI预测建模':'نمذجة تنبؤية بالذكاء الاصطناعي','AI实验设计':'تصميم التجارب بالذكاء الاصطناعي','AI智能体':'وكلاء الذكاء الاصطناعي','AI定制开发':'تطوير ذكاء اصطناعي مخصص',
'计算流体力学':'ديناميكا الموائع الحسابية','第一性原理计算':'حسابات المبادئ الأولى / DFT','分子动力学':'الديناميكا الجزيئية','多物理场与有限元仿真':'محاكاة متعددة الفيزياء والعناصر المحددة','量子化学与分子计算':'الكيمياء الكمومية',
'谱学物相':'التحليل الطيفي وتحليل الأطوار','形貌结构':'المورفولوجيا والبنية','成分元素':'التركيب والتحليل العنصري','表面界面与润湿性':'السطح / الواجهة / قابلية البلل','性能可靠性':'الأداء والموثوقية',
'温室气体':'غازات الدفيئة','微塑料':'الجسيمات البلاستيكية الدقيقة','水质常规检测':'اختبارات المياه الروتينية','土壤常规检测':'اختبارات التربة الروتينية','综合检测与方法开发':'تحليل مخصص وتطوير الطرق','高端计算模拟':'علوم حاسوبية متقدمة',
'返回':'رجوع','关闭':'إغلاق','咨询':'استشارة','查看详情':'عرض التفاصيل','提交':'إرسال','登录':'تسجيل الدخول','注册':'إنشاء حساب'
},
'ru':{
'首页':'Главная','项目查询':'Каталог проектов','项目详情':'Детали проекта','全部':'Все','分类':'Категория','板块':'Направление','搜索项目':'Поиск проектов',
'立即下单':'Заказать','直接下单':'Заказать','下单':'Заказать','加入需求清单':'Добавить в запрос','需求清单':'Список запросов','查看需求清单':'Открыть список запросов',
'提交需求':'Отправить запрос','技术咨询':'Техническая консультация','在线咨询':'Онлайн-консультация','联系我们':'Связаться с нами','客户中心':'Клиентский центр',
'查看案例':'Открыть кейс','案例详情':'Детали кейса','查看 PDF':'Открыть PDF','查看PDF':'Открыть PDF','下载 PDF':'Скачать PDF','下载PDF':'Скачать PDF','下载案例 PDF':'Скачать PDF кейса',
'了解更多':'Подробнее','参考费用':'Ориентировочная цена','周期':'Срок','待评估':'По запросу','清空':'Очистить','移除':'Удалить',
'AI项目':'ИИ-проекты','计算模拟':'Вычислительное моделирование','分析表征':'Характеризация и анализ','表征&检测':'Характеризация и анализ','耗材仪器':'Расходные материалы и приборы',
'AI医学影像':'Медицинская визуализация с ИИ','AI材料筛选':'ИИ-скрининг материалов','AI工艺优化':'ИИ-оптимизация процессов','AI知识库':'База знаний с ИИ','AI多模态分析':'Мультимодальный анализ с ИИ','AI预测建模':'Предиктивное моделирование с ИИ','AI实验设计':'Планирование эксперимента с ИИ','AI智能体':'ИИ-агенты','AI定制开发':'Индивидуальная разработка ИИ',
'计算流体力学':'Вычислительная гидродинамика','第一性原理计算':'Расчёты из первых принципов / DFT','分子动力学':'Молекулярная динамика','多物理场与有限元仿真':'Мультифизика и МКЭ','量子化学与分子计算':'Квантовая химия',
'谱学物相':'Спектроскопия и фазовый анализ','形貌结构':'Морфология и структура','成分元素':'Состав и элементный анализ','表面界面与润湿性':'Поверхность / интерфейс / смачиваемость','性能可靠性':'Характеристики и надёжность',
'温室气体':'Парниковые газы','微塑料':'Микропластик','水质常规检测':'Стандартный анализ воды','土壤常规检测':'Стандартный анализ почвы','综合检测与方法开发':'Индивидуальный анализ и разработка методов','高端计算模拟':'Передовое вычислительное моделирование',
'返回':'Назад','关闭':'Закрыть','咨询':'Консультация','查看详情':'Подробнее','提交':'Отправить','登录':'Войти','注册':'Регистрация'
},
'zh-hant':{
'首页':'首頁','项目查询':'專案查詢','项目详情':'專案詳情','全部':'全部','分类':'分類','板块':'板塊','搜索项目':'搜尋專案',
'立即下单':'立即下單','直接下单':'直接下單','下单':'下單','加入需求清单':'加入需求清單','需求清单':'需求清單','查看需求清单':'查看需求清單',
'提交需求':'提交需求','技术咨询':'技術諮詢','在线咨询':'線上諮詢','联系我们':'聯絡我們','客户中心':'客戶中心',
'查看案例':'查看案例','案例详情':'案例詳情','查看 PDF':'查看 PDF','查看PDF':'查看 PDF','下载 PDF':'下載 PDF','下载PDF':'下載 PDF','下载案例 PDF':'下載案例 PDF',
'了解更多':'瞭解更多','参考费用':'參考費用','周期':'週期','待评估':'待評估','清空':'清空','移除':'移除',
'AI项目':'AI 專案','计算模拟':'計算模擬','分析表征':'分析表徵','表征&检测':'表徵&檢測','耗材仪器':'耗材儀器',
'温室气体':'溫室氣體','微塑料':'微塑膠','水质常规检测':'水質常規檢測','土壤常规检测':'土壤常規檢測','综合检测与方法开发':'綜合檢測與方法開發','高端计算模拟':'高階計算模擬',
'返回':'返回','关闭':'關閉','咨询':'諮詢','查看详情':'查看詳情','提交':'提交','登录':'登入','注册':'註冊'
}
}[L]||{};

function replaceText(s){
 let out=s;
 Object.keys(T).sort((a,b)=>b.length-a.length).forEach(k=>{ if(out.includes(k)) out=out.split(k).join(T[k]); });
 return out;
}
function translate(root=document){
 const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 const nodes=[]; while(w.nextNode()) nodes.push(w.currentNode);
 nodes.forEach(n=>{
   if(n.parentElement?.closest('script,style,textarea')) return;
   const v=n.nodeValue, nv=replaceText(v);
   if(nv!==v)n.nodeValue=nv;
 });
 root.querySelectorAll?.('[placeholder],[title],[aria-label]').forEach(el=>{
   ['placeholder','title','aria-label'].forEach(a=>{
     const v=el.getAttribute(a); if(!v)return;
     const nv=replaceText(v); if(nv!==v)el.setAttribute(a,nv);
   });
 });
}
let busy=false;
function run(){if(busy)return;busy=true;try{translate(document)}finally{busy=false}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
new MutationObserver(()=>requestAnimationFrame(run)).observe(document.documentElement,{subtree:true,childList:true});
})();
