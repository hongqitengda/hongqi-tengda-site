
(function(){
  const premium = [
    ["FX-201","高端材料表征与原位分析","分析表征","高端材料表征","同步辐射 原位 Operando 球差电镜 FIB CT 先进谱学 多技术联用","advanced-material-characterization.html"],
    ["FX-202","球差校正 TEM / STEM","分析表征","高端材料表征","原子分辨 HAADF STEM EDS EELS 界面 缺陷","advanced-material-characterization.html#microscopy"],
    ["FX-203","FIB 精准制样","分析表征","高端材料表征","FIB 截面 定点取样 TEM lamella","advanced-material-characterization.html#microscopy"],
    ["FX-204","AFM 纳米力学与力曲线","分析表征","高端材料表征","AFM force mapping adhesion modulus 粘附力 模量","advanced-material-characterization.html#microscopy"],
    ["FX-205","单晶 XRD / 原位 XRD","分析表征","高端材料表征","SC-XRD 原位XRD 变温XRD 晶体结构 物相演变","advanced-material-characterization.html#structure"],
    ["FX-206","XPS / UPS / 深度分析","分析表征","高端材料表征","XPS UPS 价态 价带 功函数 depth profile","advanced-material-characterization.html#surface"],
    ["FX-207","EPR / ESR 缺陷与自由基分析","分析表征","高端材料表征","EPR ESR 自由基 缺陷 未配对电子","advanced-material-characterization.html#surface"],
    ["FX-208","原位 FTIR / DRIFTS","分析表征","高端材料表征","原位红外 FTIR DRIFTS 中间体 催化","advanced-material-characterization.html#insitu"],
    ["FX-209","原位 Raman","分析表征","高端材料表征","原位拉曼 Raman 电化学 气氛 加热","advanced-material-characterization.html#insitu"],
    ["FX-210","原位 XPS / Operando 电化学","分析表征","高端材料表征","原位XPS Operando 电化学 界面演化","advanced-material-characterization.html#insitu"],
    ["FX-211","工业 CT / Micro-CT / Nano-CT","分析表征","高端材料表征","CT 工业CT microCT nanoCT 三维 无损 成像","advanced-material-characterization.html#ct"],
    ["FX-212","同步辐射 XAFS / XANES / EXAFS","分析表征","高端材料表征","同步辐射 XAFS XANES EXAFS 配位 价态 局域结构","advanced-material-characterization.html#synchrotron"],
    ["FX-213","飞秒瞬态吸收 fs-TAS","分析表征","高端材料表征","飞秒 瞬态吸收 fs-TAS 激发态 载流子 动力学","advanced-material-characterization.html#synchrotron"],
    ["FX-214","穆斯堡谱","分析表征","高端材料表征","Mossbauer 穆斯堡 价态 磁性 核环境","advanced-material-characterization.html#synchrotron"],
    ["FX-215","正电子湮灭","分析表征","高端材料表征","正电子湮灭 PALS 空位 缺陷 自由体积","advanced-material-characterization.html#synchrotron"],
  ];
  window.HQTD_PREMIUM_CHARACTERIZATION = premium.map(x => ({
    id:x[0], name:x[1], board:x[2], category:x[3], keywords:x[4], url:x[5]
  }));
  function inject(){
    const input=document.getElementById("search-input");
    const host=document.querySelector(".hqt-catalog-overview .container");
    if(!input||!host||document.getElementById("premium-characterization-search")) return;
    const box=document.createElement("section");
    box.id="premium-characterization-search";
    box.className="premium-characterization-search";
    box.innerHTML='<div class="premium-head"><div><span>ADVANCED MATERIALS CHARACTERIZATION</span><h2>高端材料表征专题项目</h2></div><a href="advanced-material-characterization.html">进入专题 →</a></div><div class="premium-results"></div>';
    host.prepend(box);
    const list=box.querySelector(".premium-results");
    const render=()=>{
      const q=(input.value||"").trim().toLowerCase();
      const rows=window.HQTD_PREMIUM_CHARACTERIZATION.filter(r=>!q || (r.id+" "+r.name+" "+r.category+" "+r.keywords).toLowerCase().includes(q));
      list.innerHTML=rows.slice(0,q?50:6).map(r=>'<a class="premium-item" href="'+r.url+'"><b>'+r.id+'</b><span><strong>'+r.name+'</strong><small>'+r.category+' · '+r.keywords+'</small></span><em>查看 →</em></a>').join("");
      box.hidden = q && rows.length===0;
    };
    input.addEventListener("input",render);
    render();
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",inject); else inject();
})();
