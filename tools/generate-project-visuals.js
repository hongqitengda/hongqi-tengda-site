const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const ROOT = path.resolve(process.argv[2] || "G:/hongqi-tengda-site");
const CATALOG_PATH = path.join(ROOT, "assets", "data", "catalog.json");
const VISUALS_PATH = path.join(ROOT, "assets", "data", "project-visuals.json");
const SOURCE_PATH = path.join(ROOT, "assets", "data", "project-real-photo-sources.json");
const PHOTO_DIR = path.join(ROOT, "assets", "images", "project-photos");
const TOOLS_DIR = path.join(ROOT, "tools");
const REPO_SCRIPT_PATH = path.join(TOOLS_DIR, "generate-project-visuals.js");
const DOC_PATH = path.join(ROOT, "项目图片配置说明.md");
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT = "HQT research platform visual alignment/1.0 (https://www.hongqitengda.com/)";

const photoThemeMeta = {
  "lab-coat": { label: "实验服实物", type: "耗材实物图", title: "File:Laboratory_Coat.jpg" },
  "sem-instrument": { label: "扫描电子显微镜设备", type: "仪器设备图", title: "File:ScanningMicroscopeJLM.jpg" },
  "centrifuge-instrument": { label: "实验室离心机设备", type: "仪器设备图", title: "File:Eppendorf_centrifuge.JPG" },
  "centrifuge-tubes": { label: "离心管/微量离心管实物", type: "耗材实物图", title: "File:Laboratory_microcentrifuge_tubes_and_pipette_tips_02.jpg" },
  "pipette-tips": { label: "移液枪头实物", type: "耗材实物图", title: "File:Disposable_Pipette_Tips_in_Laboratory_Tip_Boxes.jpg" },
  "pipette-instrument": { label: "移液器/移液枪设备", type: "仪器设备图", title: "File:Micropipettors_and_disposable_micropipettor_tips.jpg" },
  "analytical-instrument": { label: "分析仪器平台", type: "仪器设备图", title: "File:HPLC_autosampler_close_up.jpg" },
  "hplc-instrument": { label: "HPLC/色谱仪平台", type: "仪器设备图", title: "File:HPLC_autosampler_close_up.jpg" },
  "ph-test-paper": { label: "pH 试纸/指示纸实物", type: "耗材实物图", title: "File:Universal_indicator_paper.jpg" },
  "three-d-filament": { label: "3D 打印线材/加工耗材实物", type: "耗材实物图", title: "File:3D_Printing_Materials_(16863368275).jpg" },
  "microscope-slides": { label: "载玻片/盖玻片/显微耗材实物", type: "耗材实物图", title: "File:MicroscopeSlides.jpg" },
  "electronics-meter": { label: "电子测量仪表设备", type: "仪器设备图", title: "File:Benchtop_multimeter.jpg" },
  "incubator-instrument": { label: "培养箱/恒温培养设备", type: "仪器设备图", title: "File:Bacteriological_incubator.jpg" },
  "water-bath": { label: "恒温水浴/水浴锅设备", type: "仪器设备图", title: "File:Shaking_water_bath_2015.JPG" },
  "lab-coats-rack": { label: "实验服/白大褂实物组", type: "耗材实物图", title: "File:Lab_coats.jpg" },
  "sem-stub": { label: "电镜/显微制样耗材实物", type: "耗材实物图", alias: "microscope-slides" },
  "lab-glassware": { label: "玻璃器皿实物", type: "耗材实物图", alias: "lab-glassware" },
  "chemical-reagents": { label: "试剂/标准品实物", type: "耗材实物图", alias: "chemical-reagents" },
  "sample-vials": { label: "样品瓶/样品容器实物", type: "耗材实物图", alias: "sample-vials" },
  "chromatography-vials": { label: "色谱进样瓶/样品瓶实物", type: "耗材实物图", alias: "chromatography-vials" },
  "membrane-filter": { label: "滤膜/针式过滤器实物", type: "耗材实物图", alias: "membrane-filter" },
  "nitrile-gloves": { label: "实验手套实物", type: "耗材实物图", alias: "nitrile-gloves" },
  "safety-goggles": { label: "护目镜/眼面防护实物", type: "耗材实物图", alias: "safety-goggles" },
  "petri-dish": { label: "培养皿实物", type: "耗材实物图", alias: "petri-dish" },
  "cell-culture": { label: "细胞培养耗材/平台", type: "耗材实物图", alias: "cell-culture" },
  "pcr-biology": { label: "PCR/分子生物学平台", type: "仪器设备图", alias: "cell-culture" },
  "battery-electrochemical": { label: "电化学/电池耗材实物", type: "耗材实物图", title: "File:Button_batterys_CR2032_3V.jpg" },
  "balance": { label: "电子天平设备", type: "仪器设备图", alias: "balance" },
  "hotplate-stirrer": { label: "磁力搅拌/加热平台", type: "仪器设备图", alias: "hotplate-stirrer" },
  "ultrasonic-cleaner": { label: "超声清洗/分散设备", type: "仪器设备图", alias: "ultrasonic-cleaner" },
  "drying-oven": { label: "烘箱/干燥箱设备", type: "仪器设备图", alias: "drying-oven" },
  "fume-hood": { label: "通风橱/安全操作设备", type: "仪器设备图", alias: "fume-hood" },
  "freezer-cold-storage": { label: "低温存储设备", type: "仪器设备图", alias: "freezer-cold-storage" },
  "rotary-evaporator": { label: "旋转蒸发设备", type: "仪器设备图", alias: "rotary-evaporator" },
  "ph-meter": { label: "pH/电导仪表设备", type: "仪器设备图", alias: "ph-meter" },
  "three-d-printer": { label: "3D 打印/加工设备", type: "仪器设备图", alias: "three-d-printer" },
  "microscope": { label: "光学显微镜设备", type: "仪器设备图", alias: "microscope" },
  "tem": { label: "透射电子显微镜设备", type: "仪器设备图", alias: "tem" },
  "afm": { label: "原子力显微镜设备", type: "仪器设备图", alias: "afm" },
  "fib-sem": { label: "FIB-SEM 设备", type: "仪器设备图", alias: "fib-sem" },
  "xps": { label: "XPS 光电子能谱设备", type: "仪器设备图", alias: "xps" },
  "xrd": { label: "XRD 衍射仪设备", type: "仪器设备图", alias: "xrd" },
  "raman": { label: "Raman 光谱设备", type: "仪器设备图", alias: "raman" },
  "ftir": { label: "FTIR 红外光谱设备", type: "仪器设备图", alias: "ftir" },
  "uv-vis": { label: "UV-Vis/荧光光谱设备", type: "仪器设备图", alias: "uv-vis" },
  "epr": { label: "EPR 顺磁共振设备", type: "仪器设备图", alias: "epr" },
  "nmr": { label: "NMR 核磁设备", type: "仪器设备图", alias: "nmr" },
  "gc-ms": { label: "GC-MS/质谱平台", type: "仪器设备图", alias: "gc-ms" },
  "icp": { label: "ICP 元素分析平台", type: "仪器设备图", alias: "icp" },
  "ion-chromatography": { label: "离子色谱平台", type: "仪器设备图", alias: "ion-chromatography" },
  "bet-surface-area": { label: "BET/气体吸附设备", type: "仪器设备图", alias: "bet-surface-area" },
  "thermal-analysis": { label: "TGA/DSC 热分析设备", type: "仪器设备图", alias: "thermal-analysis" },
  "potentiostat": { label: "电化学工作站设备", type: "仪器设备图", alias: "potentiostat" },
  "particle-size": { label: "粒径/Zeta 分析设备", type: "仪器设备图", alias: "particle-size" },
  "tensile-testing": { label: "力学测试设备", type: "仪器设备图", alias: "tensile-testing" },
  "electrical-testing": { label: "电学测试平台", type: "仪器设备图", alias: "electrical-testing" },
  "magnetometer": { label: "磁性测试平台", type: "仪器设备图", alias: "magnetometer" },
  "synchrotron": { label: "同步辐射平台", type: "仪器设备图", alias: "synchrotron" },
  "tof-sims": { label: "TOF-SIMS 平台", type: "仪器设备图", alias: "tof-sims" },
  "water-testing": { label: "水质/环境检测平台", type: "仪器设备图", alias: "water-testing" },
  "environmental-sampling": { label: "环境采样实物", type: "耗材实物图", alias: "environmental-sampling" },
  "soil-sample": { label: "土壤样品/采样耗材", type: "耗材实物图", alias: "soil-sample" },
  "hpc-server": { label: "高性能计算平台", type: "科研平台图", alias: "hpc-server" },
  "workstation": { label: "科研工作站/计算终端", type: "科研平台图", alias: "workstation" },
  "molecular-model": { label: "分子模型/计算模拟", type: "科研平台图", alias: "molecular-model" },
  "cfd-engineering": { label: "工程仿真/流体模拟", type: "科研平台图", alias: "cfd-engineering" },
  "data-visualization": { label: "数据分析/可视化平台", type: "科研平台图", alias: "data-visualization" },
  "scientific-figure": { label: "科研绘图/论文图平台", type: "科研平台图", alias: "scientific-figure" },
  "research-writing": { label: "科研写作/资料整理", type: "科研平台图", alias: "research-writing" }
};

const instrumentDefaults = {
  "sem-instrument": {
    model: "Thermo Scientific Apreo 2 / Zeiss GeminiSEM 560 / Hitachi SU8600 或同级场发射 SEM 平台",
    short: "Apreo 2 / GeminiSEM 560",
    config: "二次电子、背散射、EDS 点扫/线扫/Mapping，低真空或喷金制样按样品选择。",
    scope: "适用于粉末、薄膜、块体、涂层、断面形貌观察及元素分布分析。"
  },
  tem: {
    model: "Thermo Fisher Talos F200X / FEI Tecnai G2 F20 / JEOL JEM-F200 或同级 TEM/STEM 平台",
    short: "Talos F200X / JEM-F200",
    config: "200 kV 场发射源，可配 STEM、EDS、SAED、高分辨成像和冷冻/低剂量附件。",
    scope: "适用于纳米材料、晶格条纹、界面结构、电子衍射和元素分布分析。"
  },
  "fib-sem": {
    model: "Thermo Fisher Helios 5 / Zeiss Crossbeam 550 / Tescan S8000G 或同级 FIB-SEM 平台",
    short: "Helios 5 / Crossbeam 550",
    config: "Ga/FIB 或等离子 FIB，配 SEM 成像、截面制样、EDS/EBSD 和微纳加工模块。",
    scope: "适用于截面观察、TEM 薄片制备、三维重构和微区加工。"
  },
  afm: {
    model: "Bruker Dimension Icon / Oxford Asylum Cypher / Park NX10 或同级 AFM 平台",
    short: "Dimension Icon / Cypher",
    config: "轻敲、接触、相位、KPFM/PFM/MFM 等模式按样品需求配置探针。",
    scope: "适用于薄膜、二维材料、聚合物和纳米结构的形貌、粗糙度及局域物性分析。"
  },
  xps: {
    model: "Thermo Scientific K-Alpha / Kratos Axis Supra / PHI VersaProbe III 或同级 XPS 平台",
    short: "K-Alpha / Axis Supra",
    config: "单色 Al Kα 光源，窄谱/全谱、深度剖析和电荷校正按样品选择。",
    scope: "适用于表面元素组成、价态、化学键和深度分布分析。"
  },
  xrd: {
    model: "Bruker D8 Advance / Rigaku SmartLab / Malvern Panalytical Empyrean 或同级 XRD 平台",
    short: "D8 Advance / SmartLab",
    config: "Cu Kα 光源，粉末/薄膜/小角/高温原位附件按测试方案配置。",
    scope: "适用于物相鉴定、晶体结构、晶粒尺寸、取向和应力分析。"
  },
  raman: {
    model: "Horiba LabRAM HR Evolution / Renishaw inVia / WITec alpha300 或同级 Raman 平台",
    short: "LabRAM HR / inVia",
    config: "可选 532/633/785 nm 激光、显微共焦、Mapping 和低功率测试模式。",
    scope: "适用于碳材料、二维材料、半导体、聚合物和应力/缺陷分析。"
  },
  ftir: {
    model: "Thermo Nicolet iS50 / Bruker Vertex 70 / PerkinElmer Spectrum 3 或同级 FTIR 平台",
    short: "Nicolet iS50 / Vertex 70",
    config: "ATR、透射、漫反射和原位附件按固体、液体、薄膜样品选择。",
    scope: "适用于官能团、化学键、聚合物、膜材料和表面改性分析。"
  },
  "uv-vis": {
    model: "Shimadzu UV-2600i / Agilent Cary 60 / Edinburgh FLS1000 或同级 UV-Vis/荧光平台",
    short: "UV-2600i / Cary 60",
    config: "吸收、透过率、反射、荧光发射/寿命附件按测试需求配置。",
    scope: "适用于溶液、薄膜、粉末的光吸收、带隙、荧光和量子效率分析。"
  },
  epr: {
    model: "Bruker EMXplus / Magnettech ESR5000 / JEOL JES 系列或同级 EPR 平台",
    short: "EMXplus / ESR5000",
    config: "X-band 常规测试，可配低温、原位光照和自由基捕获实验。",
    scope: "适用于自由基、缺陷态、顺磁中心和反应活性物种分析。"
  },
  nmr: {
    model: "Bruker AVANCE NEO 400/500/600 MHz / JEOL ECZ 系列或同级 NMR 平台",
    short: "AVANCE NEO / ECZ",
    config: "液体/固体探头，多核测试、二维谱和变温实验按样品确认。",
    scope: "适用于有机结构解析、聚合物、材料表面配位和反应过程分析。"
  },
  icp: {
    model: "Agilent 7900 ICP-MS / Agilent 5800 ICP-OES / PerkinElmer Avio 500 或同级元素分析平台",
    short: "7900 ICP-MS / 5800 ICP-OES",
    config: "酸消解/微波消解进样，内标校正，多元素定量和痕量检测按基体优化。",
    scope: "适用于金属元素、痕量元素、环境水样、材料消解液和生物样品分析。"
  },
  "ion-chromatography": {
    model: "Thermo Dionex ICS-6000 / Metrohm 940 IC / Shimadzu HIC-ESP 或同级离子色谱平台",
    short: "Dionex ICS-6000 / 940 IC",
    config: "阴/阳离子柱、电导检测、抑制器和自动进样按离子体系选择。",
    scope: "适用于水样、萃取液、环境样品和工艺液中的无机阴阳离子检测。"
  },
  "hplc-instrument": {
    model: "Agilent 1260/1290 Infinity II / Waters Arc HPLC / Shimadzu Nexera 或同级 HPLC/UPLC 平台",
    short: "1260/1290 / Nexera",
    config: "UV/DAD/FLD/RI/ELSD 检测器，C18、HILIC、GPC 等色谱柱按方法配置。",
    scope: "适用于有机小分子、药物、聚合物、添加剂和复杂混合物分离定量。"
  },
  "gc-ms": {
    model: "Agilent 7890B-5977B GC-MS / Thermo ISQ / Waters Xevo TQ / Thermo Q Exactive 或同级色谱质谱平台",
    short: "7890B-5977B / Q Exactive",
    config: "GC-MS、LC-MS、HRMS、MALDI 或 GPC 平台按挥发性、分子量和基体选择。",
    scope: "适用于有机污染物、代谢物、未知物鉴定、分子量和痕量定量分析。"
  },
  "bet-surface-area": {
    model: "Micromeritics ASAP 2460 / Quantachrome Autosorb iQ / BSD-PS 系列或同级比表面积平台",
    short: "ASAP 2460 / Autosorb iQ",
    config: "N2/CO2 吸附、BET、BJH/DFT 孔径分析，脱气温度和时间按样品确认。",
    scope: "适用于多孔材料、催化剂、吸附剂、碳材料和膜材料孔结构分析。"
  },
  "thermal-analysis": {
    model: "TA Instruments Discovery TGA/DSC / Netzsch STA 449 / Mettler Toledo TGA2 或同级热分析平台",
    short: "Discovery TGA/DSC / STA 449",
    config: "氮气/空气气氛，升温速率、坩埚类型和联用气体分析按材料设定。",
    scope: "适用于热稳定性、玻璃化转变、相变、分解温度和残炭率分析。"
  },
  potentiostat: {
    model: "CHI 760E / BioLogic VMP3 / Gamry Reference 600+ / LAND CT3002A 或同级电化学平台",
    short: "CHI 760E / VMP3",
    config: "三电极、两电极、电池测试、CV/LSV/EIS/GCD 和循环寿命按体系配置。",
    scope: "适用于电催化、电池、腐蚀、传感器、膜电极和界面动力学研究。"
  },
  "particle-size": {
    model: "Malvern Zetasizer Ultra / Mastersizer 3000 / Beckman Coulter LS 系列或同级粒度平台",
    short: "Zetasizer Ultra / Mastersizer",
    config: "DLS、激光粒度、Zeta 电位和分散介质参数按样品体系设置。",
    scope: "适用于纳米颗粒、乳液、粉体、胶体和分散体系粒径/电位分析。"
  },
  "tensile-testing": {
    model: "Instron 5967/68 / MTS Criterion / ZwickRoell Z 系列或同级力学测试平台",
    short: "Instron / MTS",
    config: "拉伸、压缩、弯曲、剥离、疲劳和温控夹具按样品尺寸配置。",
    scope: "适用于薄膜、纤维、复合材料、金属、聚合物和结构件力学性能测试。"
  },
  "electrical-testing": {
    model: "Keithley 2400/2450 SourceMeter / Lake Shore Hall 系统 / Keysight B2900 或同级电学测试平台",
    short: "Keithley 2450 / B2900",
    config: "源表、四探针、霍尔、温变和屏蔽测试环境按样品电阻范围设置。",
    scope: "适用于导电薄膜、半导体器件、二维材料和传感器电输运测试。"
  },
  "electronics-meter": {
    model: "Keysight 34465A / Tektronix TBS2000B / Rigol DP832 / Fluke 179 或同级电子测量平台",
    short: "Keysight / Tektronix / Rigol",
    config: "万用表、示波器、稳压电源、温控与基础电子调试按实验台配置。",
    scope: "适用于科研电子搭建、传感器调试、设备维护和实验电路基础测量。"
  },
  magnetometer: {
    model: "Quantum Design MPMS3 SQUID / Lake Shore 8600 VSM / PPMS VSM 或同级磁性测试平台",
    short: "MPMS3 / PPMS VSM",
    config: "变温、变场、M-H/M-T 曲线和低温附件按材料磁性范围配置。",
    scope: "适用于磁性材料、催化剂、纳米颗粒、薄膜和超导/顺磁体系分析。"
  },
  synchrotron: {
    model: "同步辐射 XAFS/XANES/EXAFS 束线平台或同级大科学装置",
    short: "XAFS / EXAFS",
    config: "透射、荧光、原位反应池和标准样品按元素边与样品浓度配置。",
    scope: "适用于配位结构、价态演变、原位催化和复杂材料局域结构分析。"
  },
  "tof-sims": {
    model: "IONTOF TOF.SIMS 5/6 / PHI nanoTOF 或同级 TOF-SIMS 平台",
    short: "TOF.SIMS 5/6",
    config: "高质量分辨、成像、深度剖析和正/负离子模式按样品表面设置。",
    scope: "适用于表面分子碎片、污染物、界面层、薄膜和电池材料深度分布分析。"
  },
  "water-testing": {
    model: "Shimadzu TOC-L / Hach DR3900 / Thermo Dionex ICS / YSI ProDSS 或同级环境检测平台",
    short: "TOC-L / DR3900",
    config: "TOC、COD、氨氮、总磷、总氮、电导、pH 和离子分析按水样指标配置。",
    scope: "适用于地表水、废水、膜处理水、环境样品和现场采样检测。"
  },
  balance: {
    model: "Sartorius Entris II / Mettler Toledo MS-TS / Ohaus Explorer 或同级称量平台",
    short: "Entris II / MS-TS",
    config: "万分之一、千分之一或百分之一精度，防风罩、校准和量程按称量需求选择。",
    scope: "适用于样品称量、试剂配制、耗材验收和常规实验前处理。"
  },
  "hotplate-stirrer": {
    model: "IKA C-MAG / Heidolph Hei-PLATE / Thermo Cimarec 或同级磁力搅拌加热平台",
    short: "IKA / Heidolph",
    config: "温控、转速、加热盘尺寸、外接探头和防腐涂层按反应体系选择。",
    scope: "适用于溶液配制、温和反应、材料前驱体混合和日常实验加热搅拌。"
  },
  "ultrasonic-cleaner": {
    model: "Branson / Elma / KQ 系列超声清洗机或探头式超声破碎仪",
    short: "Branson / Elma",
    config: "水浴式或探头式，频率、功率、温控和容积按分散/清洗目标选择。",
    scope: "适用于材料分散、样品清洗、纳米颗粒处理和制样前处理。"
  },
  "drying-oven": {
    model: "Memmert UN/UF / Binder ED/FD / Yamato DKN 或同级烘箱/干燥箱平台",
    short: "Memmert / Binder",
    config: "鼓风、真空、温度范围、容积和安全保护按样品干燥条件选择。",
    scope: "适用于样品干燥、热处理、玻璃器皿烘干和材料前处理。"
  },
  "fume-hood": {
    model: "ESCO / Labconco / Thermo Scientific 或同级通风橱、生物安全柜、超净工作台",
    short: "ESCO / Labconco",
    config: "排风量、过滤等级、操作面宽度、照明和报警系统按实验安全等级配置。",
    scope: "适用于化学操作、生物安全、洁净操作和实验室安全防护。"
  },
  "freezer-cold-storage": {
    model: "Haier Biomedical / Thermo TSX / Panasonic MDF 或同级低温存储平台",
    short: "Haier / Thermo TSX",
    config: "-20、-40、-80 摄氏度，容量、温控精度、报警和样品架按存储需求确认。",
    scope: "适用于样品、试剂、细胞、生物材料和低温耗材储存。"
  },
  "rotary-evaporator": {
    model: "Buchi R-300 / IKA RV 10 / Heidolph Hei-VAP 或同级旋转蒸发平台",
    short: "Buchi R-300 / Hei-VAP",
    config: "真空泵、冷凝器、浴锅温度、转速和防爆要求按溶剂体系选择。",
    scope: "适用于溶剂去除、样品浓缩、材料合成后处理和小试工艺优化。"
  },
  "ph-meter": {
    model: "Mettler Toledo SevenCompact / Thermo Orion Star A211 / Hach HQ 系列或同级 pH/电导平台",
    short: "SevenCompact / Orion Star",
    config: "pH、电导、ORP、溶解氧和温补电极按水样或溶液体系配置。",
    scope: "适用于溶液 pH、电导率、环境水样和化学实验过程监测。"
  },
  "three-d-printer": {
    model: "Bambu Lab X1E/P1S / Ultimaker S5 / Raise3D Pro3 或同级 FDM/工程打印平台",
    short: "X1E / Ultimaker S5",
    config: "喷嘴直径、材料类型、打印温度、平台温度和后处理按结构件需求配置。",
    scope: "适用于科研夹具、实验辅助结构件、样品托架和小批量原型加工。"
  },
  "incubator-instrument": {
    model: "Thermo Heracell / Binder CB/BD / Memmert IN/ICO 或同级培养箱平台",
    short: "Heracell / Binder",
    config: "温度、CO2、湿度、振荡、容积和洁净等级按细胞/微生物培养需求配置。",
    scope: "适用于细胞培养、微生物培养、恒温反应和生物样品稳定培养。"
  },
  "water-bath": {
    model: "Julabo / Grant / Thermo Precision / 博迅 HH 系列或同级恒温水浴平台",
    short: "Julabo / Thermo",
    config: "温度范围、循环/振荡、槽体容量、控温精度和盖板形式按实验流程选择。",
    scope: "适用于恒温孵育、样品预热、酶反应、细胞/微生物前处理和常规湿实验。"
  },
  microscope: {
    model: "Leica DM/DMi 系列 / Nikon Eclipse / Olympus BX/IX 或同级光学显微平台",
    short: "Leica / Nikon / Olympus",
    config: "明场、荧光、相差、偏光和图像采集模块按样品类型选择。",
    scope: "适用于细胞、薄膜、颗粒、截面和常规显微观察。"
  },
  "pipette-instrument": {
    model: "Eppendorf Research plus / Gilson PIPETMAN / Sartorius Picus 或同级移液平台",
    short: "Research plus / PIPETMAN",
    config: "单道、多道、电动或助吸器，量程、校准和灭菌兼容性按实验流程选择。",
    scope: "适用于液体转移、样品制备、细胞/分子实验和常规湿实验操作。"
  },
  "centrifuge-instrument": {
    model: "Eppendorf 5425/5810R / Thermo MicroCL 21R / Beckman Allegra 或同级离心平台",
    short: "5425 / 5810R",
    config: "转速、离心力、温控、转子容量和管型兼容性按样品体积选择。",
    scope: "适用于细胞收集、样品分离、PCR 管/离心管处理和常规前处理。"
  },
  "analytical-instrument": {
    model: "Agilent / Thermo Fisher / Shimadzu / Waters / Bruker 等同级分析测试平台",
    short: "主流分析测试平台",
    config: "检测器、进样系统、环境控制和方法参数按具体测试项目确认。",
    scope: "适用于材料表征、成分分析、环境检测、生物分析和跨学科科研测试。"
  },
  "pcr-biology": {
    model: "Bio-Rad CFX96 / Applied Biosystems QuantStudio / Eppendorf Mastercycler 或同级 PCR/qPCR 平台",
    short: "CFX96 / QuantStudio",
    config: "普通 PCR、qPCR、梯度温控和荧光通道按实验设计配置。",
    scope: "适用于分子生物学、核酸扩增、表达分析和生物样品检测。"
  }
};

const forceDefaultInstrumentThemes = new Set([
  "electronics-meter",
  "incubator-instrument",
  "water-bath"
]);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function normalizeSourceThemes(sourceData) {
  const raw = sourceData?.themes && typeof sourceData.themes === "object" ? sourceData.themes : sourceData;
  return Object.fromEntries(Object.entries(raw || {}).filter(([, value]) => value && typeof value === "object" && value.localPath));
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value), "utf8");
}

function writeText(file, value) {
  fs.writeFileSync(file, value, "utf8");
}

function requestBuffer(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https:") ? https : http;
    const req = lib.get(url, { headers: { "User-Agent": USER_AGENT } }, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirects < 5) {
        res.resume();
        requestBuffer(new URL(res.headers.location, url).href, redirects + 1).then(resolve, reject);
        return;
      }
      const chunks = [];
      res.on("data", chunk => chunks.push(chunk));
      res.on("end", () => {
        const buffer = Buffer.concat(chunks);
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}: ${buffer.toString("utf8", 0, 200)}`));
          return;
        }
        resolve({ buffer, headers: res.headers });
      });
    });
    req.setTimeout(45000, () => req.destroy(new Error(`Timeout for ${url}`)));
    req.on("error", reject);
  });
}

async function requestJson(url) {
  const { buffer } = await requestBuffer(url);
  return JSON.parse(buffer.toString("utf8"));
}

function cleanText(value) {
  return String(value || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function licenseText(meta = {}) {
  return cleanText(meta.LicenseShortName?.value || meta.UsageTerms?.value || "Wikimedia Commons license");
}

function extensionFor(headers, url) {
  const type = String(headers["content-type"] || "").split(";")[0].toLowerCase();
  if (type === "image/png") return ".png";
  if (type === "image/webp") return ".webp";
  if (type === "image/jpeg" || type === "image/jpg") return ".jpg";
  const ext = path.extname(new URL(url).pathname).toLowerCase();
  return ext === ".jpeg" ? ".jpg" : (ext || ".jpg");
}

function fileNameForTheme(themeId, title, ext) {
  const safe = themeId.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${safe}${ext}`;
}

async function commonsSourceFromTitle(themeId, meta) {
  const url = new URL(COMMONS_API);
  url.searchParams.set("action", "query");
  url.searchParams.set("titles", meta.title);
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url|mime|size|extmetadata");
  url.searchParams.set("iiurlwidth", "1200");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  const data = await requestJson(url.href);
  const page = Object.values(data.query?.pages || {})[0];
  const info = page?.imageinfo?.[0];
  if (!info?.url) throw new Error(`No imageinfo for ${meta.title}`);
  const imageUrl = info.thumburl || info.url;
  const downloaded = await requestBuffer(imageUrl);
  const filename = fileNameForTheme(themeId, meta.title, extensionFor(downloaded.headers, imageUrl));
  const localPath = `assets/images/project-photos/${filename}`;
  fs.writeFileSync(path.join(ROOT, localPath), downloaded.buffer);
  const ext = info.extmetadata || {};
  const author = cleanText(ext.Artist?.value || ext.Credit?.value || "Wikimedia Commons contributor");
  const license = licenseText(ext);
  return {
    themeId,
    themeLabel: meta.label,
    imageSourceType: meta.type,
    title: cleanText(page.title || meta.title),
    localPath,
    sourceUrl: info.descriptionurl || "",
    filePageUrl: info.descriptionurl || "",
    originalUrl: info.url,
    downloadedUrl: imageUrl,
    license,
    author,
    attributionRequired: String(ext.AttributionRequired?.value || "").toLowerCase() || (license.includes("CC BY") ? "true" : ""),
    credit: cleanText(ext.Credit?.value || author),
    width: info.thumbwidth || info.width,
    height: info.thumbheight || info.height,
    sourceNote: `真实图片来源：Wikimedia Commons，文件：${cleanText(page.title || meta.title)}，许可：${license}，作者/署名：${author}。用于${meta.label}，已下载本地副本。`
  };
}

function sourceFromAlias(themeId, meta, sources) {
  const aliasSource = sources[meta.alias];
  if (!aliasSource?.localPath) return null;
  return {
    ...aliasSource,
    themeId,
    themeLabel: meta.label,
    imageSourceType: meta.type,
    sourceNote: `真实图片来源：Wikimedia Commons，文件：${aliasSource.title || aliasSource.filePageUrl || meta.alias}，许可：${aliasSource.license || "见源文件页面"}，作者/署名：${aliasSource.author || "Wikimedia Commons contributor"}。用于${meta.label}，同类科研项目共用该实物/设备参考图。`
  };
}

const genericServices = new Set([
  "计算模拟分析服务", "材料表征服务", "分析检测服务", "高端表征服务",
  "生物实验服务", "环境检测服务", "数据分析服务", "科研绘图服务"
]);

function displayName(item) {
  return genericServices.has(String(item.service || "")) ? (item.name || item.service) : (item.service || item.name);
}

function textFor(item) {
  return `${item.board || ""} ${item.category || ""} ${item.service || ""} ${item.name || ""} ${item.details || ""}`.toLowerCase();
}

function textHas(text, patterns) {
  return patterns.some(pattern => pattern.test(text));
}

function classifyTheme(item, old = {}) {
  const t = textFor(item);
  const board = String(item.board || "");

  if (board.includes("计算模拟")) {
    if (textHas(t, [/分子|动力学|量子|dft|gaussian|orca|vasp|lammps|gromacs/])) return "molecular-model";
    if (textHas(t, [/流体|cfd|有限元|comsol|ansys|工程/])) return "cfd-engineering";
    if (textHas(t, [/ai|机器学习|数据建模/])) return "data-visualization";
    return "hpc-server";
  }
  if (board.includes("数据分析") || board.includes("科研绘图")) {
    if (textHas(t, [/绘图|figure|graphical|toc|封面|机制|示意图|排版/])) return "scientific-figure";
    if (textHas(t, [/写作|方法|结果|补充信息|论文/])) return "research-writing";
    return "data-visualization";
  }

  if (textHas(t, [/ph试纸|ph 试纸|指示纸|试纸/])) return "ph-test-paper";
  if (textHas(t, [/3d打印耗材|打印\/加工耗材|pla线材|pla basic|pla-cf|tpu|打印喷嘴|打印平台贴膜|打印材料|线材/])) return "three-d-filament";
  if (textHas(t, [/载玻片|盖玻片|显微玻片|microscope slide/])) return "microscope-slides";
  if (textHas(t, [/铜网|钼网|电镜网|微栅|tem样品盒|sem样品台|导电胶|导电碳胶带|导电铜胶带|喷金靶材|afm探针|云母片|硅片基底|xps样品台|xrd样品槽/])) return "sem-stub";
  if (textHas(t, [/称量纸|称量舟|擦拭纸|无尘布|封口膜|parafilm|铝箔|锡箔|自封袋|洗瓶|磁子|镊子|药勺|刮刀|刷子|标签|样品盒|冷冻盒|试管刷|瓶刷|实验垃圾袋|危废标签|警示牌/])) return "sample-vials";
  if (textHas(t, [/真空泵油|硅油|导热硅脂|pvdf粘结剂|nmp溶剂|导电炭黑|氧化石墨烯分散液|tio2|前驱体|试剂包/])) return "chemical-reagents";
  if (textHas(t, [/聚四氟乙烯内衬|水热反应釜|石英舟|刚玉舟|坩埚|球磨罐|球磨珠|样品筛|涂布棒|真空袋|硅胶管|ptfe管|pfa管|peek管|鲁尔接头|不锈钢接头|垫片|隔板|夹具|反应釜|软管|泵管/])) return "lab-glassware";
  if (textHas(t, [/万用表|示波器|稳压电源|直流电源|温控器|热电偶|arduino|树莓派|开发板|ups|不间断电源|标签打印机|显示器/])) return "electronics-meter";
  if (textHas(t, [/水浴锅|恒温水浴|油浴锅|金属浴|干式恒温器|恒温器/])) return "water-bath";
  if (textHas(t, [/培养箱|恒温振荡器|电泳仪电源|蓝光切胶仪|酶标仪|小型培养箱/])) return "incubator-instrument";
  if (textHas(t, [/隔膜泵|真空泵|真空抽滤装置|热封机|数显游标卡尺|微型蠕动泵|蠕动泵$/])) return "analytical-instrument";

  if (textHas(t, [/sem|扫描电镜|扫描电子显微镜|eds|mapping|线扫|点扫/])) return "sem-instrument";
  if (textHas(t, [/tem|透射电镜|透射电子显微镜|stem|saed|电子衍射|hrtem|cryo[-\s]?tem|冷冻电镜/])) return "tem";
  if (textHas(t, [/fib|聚焦离子束/])) return "fib-sem";
  if (textHas(t, [/afm|kpfm|pfm|mfm|efm|原子力/])) return "afm";
  if (textHas(t, [/xps|价态|结合能|光电子能谱/])) return "xps";
  if (textHas(t, [/xrd|衍射|晶体结构|rietveld|小角散射|saxs|waxs/])) return "xrd";
  if (textHas(t, [/raman|拉曼/])) return "raman";
  if (textHas(t, [/ftir|红外/])) return "ftir";
  if (textHas(t, [/uv|紫外|荧光|eem|发光|pl光谱/])) return "uv-vis";
  if (textHas(t, [/epr|顺磁|电子自旋/])) return "epr";
  if (textHas(t, [/nmr|核磁|磁共振/])) return "nmr";
  if (textHas(t, [/icp|元素分析|金属元素|痕量元素/])) return "icp";
  if (textHas(t, [/离子色谱|阴离子|阳离子/])) return "ion-chromatography";
  if (textHas(t, [/hplc|uplc|液相色谱/])) return "hplc-instrument";
  if (textHas(t, [/gc-ms|lc-ms|质谱|色谱质谱|maldi|hrms|气相色谱|gpc/])) return "gc-ms";
  if (textHas(t, [/bet|比表面积|孔结构|孔径|吸附|压汞/])) return "bet-surface-area";
  if (textHas(t, [/tga|dsc|热重|热分析|热学|导热|lfa|hot disk/])) return "thermal-analysis";
  if (textHas(t, [/电化学工作站|cv|lsv|eis|循环伏安|阻抗|极化曲线/])) return "potentiostat";
  if (textHas(t, [/粒径|zeta|颗粒|dls/])) return "particle-size";
  if (textHas(t, [/力学|拉伸|压缩|弯曲|万能试验|硬度|疲劳/])) return "tensile-testing";
  if (textHas(t, [/电学|电输运|霍尔|方阻|探针|电阻率/])) return "electrical-testing";
  if (textHas(t, [/磁性|磁滞|磁化|vsm|squid/])) return "magnetometer";
  if (textHas(t, [/同步辐射|xafs|xanes|exafs|束线/])) return "synchrotron";
  if (textHas(t, [/tof-sims|二次离子/])) return "tof-sims";

  if (textHas(t, [/实验服|白大褂|防护服/])) return "lab-coat";
  if (textHas(t, [/丁腈|乳胶|手套|防割手套|耐酸碱手套/])) return "nitrile-gloves";
  if (textHas(t, [/护目镜|防护眼镜|安全眼镜|面屏|口罩|鞋套|帽|围裙|ppe|安全防护/])) return "safety-goggles";
  if (textHas(t, [/移液枪头|滤芯吸头|枪头|吸头|tip|tips/])) return "pipette-tips";
  if (textHas(t, [/移液器|移液枪|单道移液|多道移液|电动移液|连续分液/])) return "pipette-instrument";
  if (textHas(t, [/离心机|微型离心|台式离心|冷冻离心|迷你离心/])) return "centrifuge-instrument";
  if (textHas(t, [/离心管|ep管|冻存管|冻存盒|pcr管|八联管|pcr板|样品管|离心瓶/])) return "centrifuge-tubes";
  if (textHas(t, [/培养皿|琼脂|平板/])) return "petri-dish";
  if (textHas(t, [/细胞培养板|培养瓶|培养皿|培养基|血清|胰酶|pbs|elisa|酶标板|western|冻存液|cryo/])) return "cell-culture";
  if (textHas(t, [/色谱瓶|进样瓶|顶空瓶|vial|样品瓶|瓶盖|隔垫|内插管/])) return "chromatography-vials";
  if (textHas(t, [/样品瓶|采样瓶|螺口瓶|安捷伦瓶|密封瓶|棕色瓶|储存瓶|样品容器/])) return "sample-vials";
  if (textHas(t, [/针式过滤|滤膜|过滤膜|滤芯|过滤器|滤纸|pvdf|pes|ptfe|尼龙膜|微孔膜|超滤膜|透析袋|spe柱|固相萃取/])) return "membrane-filter";
  if (textHas(t, [/烧杯|锥形瓶|容量瓶|量筒|试管|玻璃棒|分液漏斗|滴定管|移液管|玻璃器皿|反应瓶|圆底烧瓶|冷凝管/])) return "lab-glassware";
  if (textHas(t, [/试剂|标准品|溶剂|缓冲液|酸|碱|盐酸|硫酸|硝酸|乙醇|甲醇|丙酮|乙腈|异丙醇|化学品/])) return "chemical-reagents";
  if (textHas(t, [/电极|参比|玻碳|铂电极|nafion|碳布|碳纸|隔膜|扣式电池|电池壳|集流体|电解液|垫片|弹片|电池耗材/])) return "battery-electrochemical";
  if (textHas(t, [/tem铜网|铜网|电镜网|微栅|sem样品台|导电胶|碳胶|银浆|喷金靶材|溅射靶/])) return "sem-stub";
  if (textHas(t, [/称量纸|称量舟|擦拭纸|无尘布|封口膜|parafilm|铝箔|自封袋|洗瓶|磁子|镊子|药勺|刮刀|刷子|标签|样品盒|冷冻盒/])) return "sample-vials";

  if (textHas(t, [/天平|称量/])) return "balance";
  if (textHas(t, [/搅拌|加热板|磁力/])) return "hotplate-stirrer";
  if (textHas(t, [/超声|清洗机|分散/])) return "ultrasonic-cleaner";
  if (textHas(t, [/烘箱|干燥箱|马弗|管式炉|真空干燥/])) return "drying-oven";
  if (textHas(t, [/通风橱|安全柜|超净|生物安全柜/])) return "fume-hood";
  if (textHas(t, [/冰箱|冷冻|低温|液氮/])) return "freezer-cold-storage";
  if (textHas(t, [/旋蒸|旋转蒸发/])) return "rotary-evaporator";
  if (textHas(t, [/ph|酸度|电导|溶氧/])) return "ph-meter";
  if (textHas(t, [/3d|打印|机加工|夹具/])) return "three-d-printer";
  if (textHas(t, [/显微|显微镜/])) return "microscope";

  if (textHas(t, [/水质|toc|cod|氨氮|总磷|总氮|环境检测|采样|现场检测/])) return "water-testing";
  if (textHas(t, [/土壤|沉积物/])) return "soil-sample";
  if (old.photoTheme && photoThemeMeta[old.photoTheme]) return old.photoTheme;
  if (board.includes("材料表征") || board.includes("高端")) return "analytical-instrument";
  return "sample-vials";
}

function derivePlatformKind(themeId, item) {
  const meta = photoThemeMeta[themeId] || {};
  if (meta.type) return meta.type;
  if (String(item.board || "").includes("实验耗材")) return "耗材实物图";
  if (String(item.board || "").includes("计算") || String(item.board || "").includes("数据")) return "科研平台图";
  return "仪器设备图";
}

function instrumentFields(themeId, old = {}, source = {}) {
  const fallback = instrumentDefaults[themeId] || instrumentDefaults["analytical-instrument"];
  const reuseOld = old.photoTheme === themeId && !forceDefaultInstrumentThemes.has(themeId);
  const model = (reuseOld && old.instrumentModel) || fallback.model;
  if (!model) return {};
  return {
    visualKind: "equipment",
    instrumentModel: model,
    instrumentShort: (reuseOld && old.instrumentShort) || fallback.short || model.split("/").slice(0, 2).join("/").trim(),
    instrumentConfig: (reuseOld && old.instrumentConfig) || fallback.config,
    instrumentScope: (reuseOld && old.instrumentScope) || fallback.scope,
    instrumentSourceNote: `仪器型号为红祺腾达按项目类型整理的参考平台，具体设备、机时、参数和排期以最终测试/采购方案为准。图片来源：${source.filePageUrl || source.sourceUrl || "见图片来源文件"}。`,
    instrumentTag: (reuseOld && old.instrumentTag) || photoThemeMeta[themeId]?.label || themeId
  };
}

function clearInstrumentOnlyFields(value) {
  const cleaned = { ...value };
  for (const key of ["instrumentModel", "instrumentShort", "instrumentConfig", "instrumentScope", "instrumentSourceNote", "instrumentTag"]) {
    delete cleaned[key];
  }
  return cleaned;
}

async function ensureThemeSource(themeId, sources) {
  const meta = photoThemeMeta[themeId];
  if (!meta) throw new Error(`Missing theme metadata: ${themeId}`);
  if (meta.title) {
    const existing = sources[themeId];
    const expectedPath = existing?.localPath && path.join(ROOT, existing.localPath);
    const expectedTitle = existing?.title === meta.title || existing?.title === meta.title.replace(/_/g, " ");
    if (expectedPath && fs.existsSync(expectedPath) && expectedTitle) return existing;
    const source = await commonsSourceFromTitle(themeId, meta);
    sources[themeId] = source;
    return source;
  }
  const aliased = sourceFromAlias(themeId, meta, sources);
  if (aliased) {
    sources[themeId] = aliased;
    return aliased;
  }
  if (meta.alias && sources[meta.alias]) {
    sources[themeId] = { ...sources[meta.alias], themeId, themeLabel: meta.label };
    return sources[themeId];
  }
  throw new Error(`Missing aliased source: ${themeId} -> ${meta.alias}`);
}

function buildDoc(stats) {
  return `# 项目图片与科研平台配置说明

本次更新的目标不是把官网做成普通宣传页，而是把 1612 个项目做成可查询、可比对、可追溯的科研服务平台。

## 当前配置

- 项目总数：${stats.total} 项
- 已配置设备/实物/平台图：${stats.visuals} 项
- 仪器设备图项目：${stats.instrumentImages} 项
- 耗材实物图项目：${stats.supplyImages} 项
- 科研计算/数据平台图项目：${stats.platformImages} 项
- 带参考仪器型号/平台说明项目：${stats.instrumentMetadata} 项
- 当前使用图片主题：${stats.themeCount} 类

## 配图原则

1. 分析测试、表征、小型仪器等项目使用对应仪器/设备照片，并保留建议仪器型号、关键配置和适用范围。
2. 实验耗材项目使用对应实物照片，例如实验服、手套、移液枪头、离心管、色谱瓶、滤膜、玻璃器皿等。
3. 计算模拟、数据分析、科研绘图项目使用科研平台/计算可视化类图片，不冒充实体仪器。
4. 同一规格族允许共用一张可追溯图片，避免随意抓取厂商或电商图片造成版权风险。
5. 后续如有自有拍摄或供应商授权图片，只需替换 \`assets/images/project-photos/\` 中对应文件或更新 \`project-visuals.json\` 的 \`image\` 字段。

## 关键文件

- \`assets/data/project-visuals.json\`：逐项目图片、图片来源、平台类型和仪器元数据。
- \`assets/data/project-real-photo-sources.json\`：图片主题、许可、作者和源文件页面。
- \`assets/images/project-photos/\`：本地图片副本。
- \`tools/generate-project-visuals.js\`：重新生成项目视觉配置的脚本。

## GitHub Desktop 上传

1. 打开 GitHub Desktop，选择 \`G:\\hongqi-tengda-site\` 仓库。
2. 检查本次变更：\`assets/data/project-visuals.json\`、\`assets/data/project-real-photo-sources.json\`、\`assets/images/project-photos/\`、\`tools/generate-project-visuals.js\`、JS/CSS 和本文档。
3. Commit message 建议：\`Align project visuals with research platform data\`。
4. Commit 后 Push origin。
`;
}

async function main() {
  ensureDir(PHOTO_DIR);
  ensureDir(TOOLS_DIR);
  const catalog = readJson(CATALOG_PATH, []);
  const oldVisuals = readJson(VISUALS_PATH, {});
  const oldSourceData = readJson(SOURCE_PATH, {});
  const sources = { ...normalizeSourceThemes(oldSourceData) };

  const themeUsage = new Map();
  for (const item of catalog) {
    const themeId = classifyTheme(item, oldVisuals[item.id] || {});
    themeUsage.set(themeId, (themeUsage.get(themeId) || 0) + 1);
  }

  const failures = [];
  for (const themeId of [...themeUsage.keys()].sort()) {
    try {
      const source = await ensureThemeSource(themeId, sources);
      process.stdout.write(`theme ${themeId} -> ${source.localPath}\n`);
    } catch (error) {
      failures.push({ themeId, message: error.message });
      const fallback = sources["sample-vials"] || sources["analytical-instrument"] || Object.values(sources).find(source => source.localPath);
      if (!fallback) throw error;
      sources[themeId] = {
        ...fallback,
        themeId,
        themeLabel: photoThemeMeta[themeId]?.label || themeId,
        fallbackFrom: fallback.themeId || "fallback",
        sourceNote: `${fallback.sourceNote || "真实图片来源见源文件页面。"} 当前作为 ${photoThemeMeta[themeId]?.label || themeId} 的临时同类参考图。`
      };
    }
  }

  const updated = {};
  const stats = {
    total: catalog.length,
    visuals: 0,
    instrumentImages: 0,
    supplyImages: 0,
    platformImages: 0,
    instrumentMetadata: 0,
    themeCount: themeUsage.size
  };

  for (const item of catalog) {
    const old = oldVisuals[item.id] || {};
    const themeId = classifyTheme(item, old);
    const source = sources[themeId];
    const platformKind = derivePlatformKind(themeId, item);
    const isInstrument = platformKind.includes("仪器");
    if (platformKind.includes("仪器")) stats.instrumentImages++;
    else if (platformKind.includes("耗材")) stats.supplyImages++;
    else stats.platformImages++;
    const base = clearInstrumentOnlyFields(old);
    const equipmentFields = isInstrument ? instrumentFields(themeId, old, source) : {};
    if (equipmentFields.instrumentModel) stats.instrumentMetadata++;
    stats.visuals++;
    updated[item.id] = {
      ...base,
      id: item.id,
      title: old.title || displayName(item),
      board: item.board,
      category: item.category,
      image: source.localPath,
      imageAlt: `${displayName(item)} ${platformKind}`,
      imageSourceType: platformKind,
      imageSourceNote: source.sourceNote,
      photoTheme: themeId,
      photoThemeLabel: source.themeLabel || photoThemeMeta[themeId]?.label || themeId,
      photoSourceUrl: source.filePageUrl || source.sourceUrl,
      photoLicense: source.license,
      photoAuthor: source.author,
      platformKind,
      platformDataLevel: isInstrument ? "仪器型号+关键配置+适用范围+图片来源" : "项目规格+实物/平台图片+图片来源",
      visualKind: isInstrument ? "equipment" : (platformKind.includes("耗材") ? "supply" : "platform"),
      ...equipmentFields
    };
  }

  writeJson(VISUALS_PATH, updated);
  writeJson(SOURCE_PATH, {
    generatedAt: new Date().toISOString(),
    source: "Wikimedia Commons and curated local aliases",
    version: "20260711-research-platform-alignment",
    failures,
    themes: Object.fromEntries(Object.entries(sources).sort(([a], [b]) => a.localeCompare(b)))
  });
  writeText(DOC_PATH, buildDoc(stats));
  writeText(REPO_SCRIPT_PATH, fs.readFileSync(__filename, "utf8"));

  console.log(JSON.stringify({ root: ROOT, stats, failures }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
