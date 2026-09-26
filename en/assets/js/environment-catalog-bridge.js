(() => {
  'use strict';
  if (!Array.isArray(window.HQTD_CATALOG_DATA)) window.HQTD_CATALOG_DATA = [];
  const source = window.HQTD_EMERGING_DATA;
  if (!source || !Array.isArray(source.records)) return;

  const has = new Set(window.HQTD_CATALOG_DATA.map(item => String(item.id || '')));
  const fmt = value => (typeof value === 'number' && Number.isFinite(value)) ? `${Number(value).toFixed(1)}%` : (value ? String(value) : '—');
  const average = r => {
    if (typeof r.recoveryAvg === 'number' && Number.isFinite(r.recoveryAvg) && !(r.recoveryAvg === 0 && ![r.recovery1,r.recovery2].some(v => typeof v === 'number' && v > 0))) return r.recoveryAvg;
    const nums = [r.recovery1, r.recovery2].filter(v => typeof v === 'number' && Number.isFinite(v));
    return nums.length ? nums.reduce((a,b) => a+b,0) / nums.length : null;
  };
  const code = r => `ENV-${String(r.acronym || r.categoryId || 'TARGET').replace(/[^A-Za-z0-9]+/g,'').toUpperCase()}-${String(Number(r.serial || 0)).padStart(3,'0')}`;

  source.records.forEach(r => {
    const id = code(r);
    if (has.has(id)) return;
    const avg = average(r);
    const recText = `Recovery rate1 ${fmt(r.recovery1)}; Recovery rate2 ${fmt(r.recovery2)}; Average ${avg == null ? '—' : fmt(avg)}`;
    window.HQTD_CATALOG_DATA.push({
      id,
      board: "Environmental Testing",
      category: r.category || "Emerging Contaminants",
      service: r.cn || r.en || "Target detection for new pollutants",
      details: `${r.en || ''}${r.abbr ? ` · ${r.abbr}` : ''}${r.cas ? ` · CAS ${r.cas}` : ''} · ${recText}`,
      unit: "projects",
      price: null,
      priceText: "To Be Assessed",
      cycle: "Technical assessment confirmed",
      priority: "Thematic items",
      image: '/assets/images/environment-topics/emerging-contaminants.png',
      imageAlt: `${r.cn || r.en || "Emerging Contaminants"} Environmental Testing`,
      detailUrl: `emerging-contaminants.html?target=${encodeURIComponent(r.id)}#database`,
      envRecordId: r.id,
      recovery1: r.recovery1,
      recovery2: r.recovery2,
      recoveryAvg: avg
    });
  });
})();

;(() => {
  if (!Array.isArray(window.HQTD_CATALOG_DATA)) return;
  const has = new Set(window.HQTD_CATALOG_DATA.map(item => String(item.id || '')));
  const extra = [
    {id:'ENV-GHG-CH4',board:"Environmental Testing",category:"Greenhouse Gases",service:"CH₄ Methane precision detection",details:"S-GC/GC Test; Applicable to soil and environmental samples, specific sample containers, concentration ranges and quality control programme confirmed by project.",unit:"projects",price:null,priceText:"To Be Assessed",cycle:"Technical assessment confirmed",image:'/assets/images/environment-topics/greenhouse-gas.png',imageAlt:"Methane greenhouse gas monitoring",detailUrl:'greenhouse-gas-detection.html'},
    {id:'ENV-GHG-CO2',board:"Environmental Testing",category:"Greenhouse Gases",service:"CO₂ Carbon dioxide precision detection",details:"S-GC/GC Test; Support for scientific monitoring and emission analysis, with sampling time, location and concentration range confirmed by project.",unit:"projects",price:null,priceText:"To Be Assessed",cycle:"Technical assessment confirmed",image:'/assets/images/environment-topics/greenhouse-gas.png',imageAlt:"Carbon dioxide greenhouse gas (CO2) monitoring",detailUrl:'greenhouse-gas-detection.html'},
    {id:'ENV-GHG-N2O',board:"Environmental Testing",category:"Greenhouse Gases",service:"N₂O Nitrogen oxide precision testing",details:"S-GC/GC Test; Applicable to environmental sample and emission studies, with specific detection routes confirmed by concentration range and sampling conditions.",unit:"projects",price:null,priceText:"To Be Assessed",cycle:"Technical assessment confirmed",image:'/assets/images/environment-topics/greenhouse-gas.png',imageAlt:"N2O greenhouse gas (GHG) testing",detailUrl:'greenhouse-gas-detection.html'},
    {id:'ENV-MP-COUNT',board:"Environmental Testing",category:"Microplastics",service:"Microplastic particle count and particle size/form analysis",details:"Applicable to water samples, sediments and environmental samples; Particle count, particle size range and shape statistics confirmed by sample condition.",unit:"projects",price:null,priceText:"To Be Assessed",cycle:"Technical assessment confirmed",image:'/assets/images/environment-topics/microplastics.png',imageAlt:"Microplastic testing",detailUrl:'microplastics-detection.html'},
    {id:'ENV-MP-RAMAN',board:"Environmental Testing",category:"Microplastics",service:"Raman Microplastic polymer identification",details:"Microplastic polymer identification and matching based on Raman spectra, with specific particle ranges confirmed by sample according to the pre-treatment programme.",unit:"projects",price:null,priceText:"To Be Assessed",cycle:"Technical assessment confirmed",image:'/assets/images/environment-topics/microplastics.png',imageAlt:"Raman microplastic recognition",detailUrl:'microplastics-detection.html'},
    {id:'ENV-MP-FTIR',board:"Environmental Testing",category:"Microplastics",service:"μ-FTIR Microplastic polymer recognition",details:"μ-FTIR based polymer type identification and spectrometer matching, with specific application of particle size and sample pre-treatment to project assessment.",unit:"projects",price:null,priceText:"To Be Assessed",cycle:"Technical assessment confirmed",image:'/assets/images/environment-topics/microplastics.png',imageAlt:"Mi-FTIR Microplastic Identification",detailUrl:'microplastics-detection.html'},
    {id:'ENV-CUSTOM-6PPDQ',board:"Environmental Testing",category:"Comprehensive Testing and Method Development",service:"6PPD-Q Class and associated object detection",details:"For tyre source pollutants, transformation products and other specific organic targets; Pre-treatment, instrumentation and quantitative route confirmation by matrix and research target.",unit:"projects",price:null,priceText:"To Be Assessed",cycle:"Technical assessment confirmed",image:'/assets/images/environment-topics/method-development-soil-carbon.png',imageAlt:"Comprehensive Testing and Method Development",detailUrl:'comprehensive-testing-method-development.html'},
    {id:'ENV-CUSTOM-ELEMENTS',board:"Environmental Testing",category:"Comprehensive Testing and Method Development",service:"Heavy metal and multi-element analysis",details:"Samples applicable to water, soil, sediment, materials, etc.; Element ranges, decomposition programs and checkout requirements confirmed by project.",unit:"projects",price:null,priceText:"To Be Assessed",cycle:"Technical assessment confirmed",image:'/assets/images/environment-topics/method-development-soil-carbon.png',imageAlt:"Heavy metal and multi-element analysis",detailUrl:'comprehensive-testing-method-development.html'},
    {id:'ENV-CUSTOM-SOILCARBON',board:"Environmental Testing",category:"Comprehensive Testing and Method Development",service:"Soil carbon indicators and analysis of different carbon components",details:"TC, TOC, DOC, POC, MAOC, MBC, reorganization of TOC, light groups of TOC, etc. can be grouped for research purposes.",unit:"projects",price:null,priceText:"To Be Assessed",cycle:"Technical assessment confirmed",image:'/assets/images/environment-topics/method-development-soil-carbon.png',imageAlt:"Soil carbon indicators and component analysis",detailUrl:'comprehensive-testing-method-development.html'},
    {id:'ENV-CUSTOM-METHOD',board:"Environmental Testing",category:"Comprehensive Testing and Method Development",service:"Test methodology development and customization",details:"Support pre-processing, instrument conditions, calibration, quality control and data delivery programme customization for special matrices, new targets or non-standard scientific issues.",unit:"projects",price:null,priceText:"To Be Assessed",cycle:"Technical assessment confirmed",image:'/assets/images/environment-topics/method-development-soil-carbon.png',imageAlt:"Test methodology development",detailUrl:'comprehensive-testing-method-development.html'}
  ];
  extra.forEach(item => { if (!has.has(item.id)) window.HQTD_CATALOG_DATA.push(item); });
})();
;(() => {
  if (!Array.isArray(window.HQTD_CATALOG_DATA)) return;
  const has = new Set(window.HQTD_CATALOG_DATA.map(item => String(item.id || '')));
  const source = [{"id":"ENV-WS-W001","group":"water","serial":1,"sample":"Water","test":"PH","instrument":"PHS-3E.","standard":"HJ1147-2020 Measurement of water quality pH","category":"Water quality basic management"},{"id":"ENV-WS-W002","group":"water","serial":2,"sample":"Water","test":"Electrical Conductivity","instrument":"Conductivity Meter, Thunder Magnetic DDSJ-308A","standard":"DZ/T 0064.6-2021 Groundwater Quality Analysis Method Part 6:\nElectro-dependencies.","category":"Water quality basic management"},{"id":"ENV-WS-W003","group":"water","serial":3,"sample":"Water","test":"TDS","instrument":"Conductivity Meter, Thunder Magnetic DDSJ-308A","standard":"/","category":"Water quality basic management"},{"id":"ENV-WS-W004","group":"water","serial":4,"sample":"Water","test":"CODMn","instrument":"Dip the tube.","standard":"GB/T 15456-2019 Measurement of chemical oxygen requirements (COD) in industrial cooling water","category":"Water quality basic management"},{"id":"ENV-WS-W005","group":"water","serial":5,"sample":"Water","test":"CODCr","instrument":"Dip the tube.","standard":"GB/T 15456-2019 Measurement of chemical oxygen demand (COD) in industrial cycle cooling water","category":"Water quality basic management"},{"id":"ENV-WS-W006","group":"water","serial":6,"sample":"Water","test":"DOC","instrument":"Total organic carbon analyser, Toc-L, Shimazu","standard":"NPO Act","category":"Water quality organic carbon"},{"id":"ENV-WS-W007","group":"water","serial":7,"sample":"Water","test":"TOC","instrument":"Total organic carbon analyser, Toc-L, Shimazu","standard":"NPO Act","category":"Water quality organic carbon"},{"id":"ENV-WS-W008","group":"water","serial":8,"sample":"Water","test":"TC,TIC,TOC","instrument":"Total organic carbon analyser, Toc-L, Shimazu","standard":"margin method","category":"Water quality organic carbon"},{"id":"ENV-WS-W009","group":"water","serial":9,"sample":"Water","test":"TN, full nitrogen.","instrument":"Continuous mobility analyser, SEAL AAA","standard":"HJ 636-2012 Water quality and total nitrogen measurements alkaline potassium persulphate digestion of ultraviolet light","category":"Water quality and nutritional salt"},{"id":"ENV-WS-W010","group":"water","serial":10,"sample":"Water","test":"NH4+, ammonium nitrogen","instrument":"Continuous mobility analyser, SEAL AAA","standard":"Aqueous acids - continuous flow analyser","category":"Water quality and nutritional salt"},{"id":"ENV-WS-W011","group":"water","serial":11,"sample":"Water","test":"NO3-, Nitrogen","instrument":"Continuous mobility analyser, SEAL AAA","standard":"Aluminium sulphate method - Continuous flow analyser","category":"Water quality and nutritional salt"},{"id":"ENV-WS-W012","group":"water","serial":12,"sample":"Water","test":"NO2-, Nitrogen","instrument":"Continuous mobility analyser, SEAL AAA","standard":"/","category":"Water quality and nutritional salt"},{"id":"ENV-WS-W013","group":"water","serial":13,"sample":"Water","test":"TP, all-phosphorus","instrument":"Continuous mobility analyser, SEAL AAA","standard":"HJ 670-2013 Continuous flow of water quality - Ammonium Molybdate spectrophotometry","category":"Water quality and nutritional salt"},{"id":"ENV-WS-W014","group":"water","serial":14,"sample":"Water","test":"SRP, Phosphoric Acid","instrument":"Continuous mobility analyser, SEAL AAA","standard":"HJ 670-2013 Water quality, Phosphoric Acid and total phosphorus determination \nContinuous flow - Ammonium Molybdate spectrometry","category":"Water quality and nutritional salt"},{"id":"ENV-WS-W015","group":"water","serial":15,"sample":"Water","test":"Dissolved silicate","instrument":"Continuous mobility analyser, SEAL AAA","standard":"/","category":"Water quality and nutritional salt"},{"id":"ENV-WS-W016","group":"water","serial":16,"sample":"Water","test":"Hydrogen sulfide","instrument":"Continuous mobility analyser, SEAL AAA","standard":"/","category":"Water quality and nutritional salt"},{"id":"ENV-WS-W017","group":"water","serial":17,"sample":"Sewage","test":"TN (negative)","instrument":"Continuous mobility analyser, SEAL AAA; Autoclave","standard":"HJ 636-2012 Water quality and total nitrogen measurements alkaline potassium persulphate digestion of ultraviolet light","category":"Water quality and nutritional salt"},{"id":"ENV-WS-W018","group":"water","serial":18,"sample":"Sewage","test":"TP (resolved)","instrument":"Continuous mobility analyser, SEAL AAA; Autoclave","standard":"/","category":"Water quality and nutritional salt"},{"id":"ENV-WS-W019","group":"water","serial":19,"sample":"Water","test":"BOD5","instrument":"Dip the tube.","standard":"HJ 505-2009 Water Quality Five Days Biochemical Oxygen (BOD5) Determination Dilution and Inoculation","category":"Water quality basic management"},{"id":"ENV-WS-W020","group":"water","serial":20,"sample":"Water","test":"Cu, Zn, Ni, Pb, Cd, Cr, K, Ca, Na, Mg, Fe, As, Mo, Mun, Au, Hg, Co, etc.","instrument":"ICPMS, Semyr Feissel, ICAPQ","standard":"HJ 700-2014 Water quality determination of 65 elements \nElectronlytic coupling plasma mass spectrometry\nDB35/T 1142-2020","category":"Water quality elements and heavy metals"},{"id":"ENV-WS-W021","group":"water","serial":21,"sample":"Water","test":"As 、Hg、Se","instrument":"Atomic fluorescent, Beijing Hae-goon, AFS-9700A","standard":"/","category":"Water quality elements and heavy metals"},{"id":"ENV-WS-W022","group":"water","serial":22,"sample":"Water","test":"Cu, Zn, Ni, Pb, Cd, Cr, Fe, Mn, etc.","instrument":"Atom Absorption, PE, PinAcle 900T","standard":"GB/T 7475-1987 Water quality measurements of copper, zinc, lead, cadmium \nAtom Absorption Spectrometry","category":"Water quality elements and heavy metals"},{"id":"ENV-WS-W023","group":"water","serial":23,"sample":"Water","test":"Bivalent iron.","instrument":"Ultraviolet Visible Spectrometer, Psychic T10","standard":"/","category":"Water quality elements and heavy metals"},{"id":"ENV-WS-W024","group":"water","serial":24,"sample":"Water","test":"Triple iron.","instrument":"Ultraviolet Visible Spectrometer, Psychic T10\nICPMS, Semyr Feissel, ICAPQ","standard":"Total iron - dual price iron","category":"Water quality elements and heavy metals"},{"id":"ENV-WS-W025","group":"water","serial":25,"sample":"Water","test":"Hexavalent chromium","instrument":"Ultraviolet Visible Spectrometer, Psychic T10","standard":"GB/T 7467-1987 Water quality, hexavalent chromium dibenzocarbonyl diazine spectrophotometry","category":"Water quality elements and heavy metals"},{"id":"ENV-WS-W026","group":"water","serial":26,"sample":"Water","test":"chlorophyll A","instrument":"Ultraviolet Visible Spectrometer, Psychic T10","standard":"HJ 897-2017 Water quality chlorophylla determination spectrophotometry","category":"Water quality basic management"},{"id":"ENV-WS-W027","group":"water","serial":27,"sample":"Water","test":"Anion: K+, Na+, Ca2+, Mg2+","instrument":"Ion chromatographer, Sam Faisal, ICS 2100.","standard":"HJ 812-2016 Water quality soluble positive ions (Li+,\nNa+、NH4+、K+、Ca2+、Mg2+）\nIon chromatography.","category":"Water quality ion"},{"id":"ENV-WS-W028","group":"water","serial":28,"sample":"Water","test":"Anion: F-, Cl-, SO42-, NO3-","instrument":"Ion chromatographer, Sam Faisal, ICS 2100.","standard":"HJ 84-2016 Measurement of inorganic anion (F-, Cl-, NO2-, Br-, NO3-, PO43-, SO32-, SO42-)","category":"Water quality ion"},{"id":"ENV-WS-W029","group":"water","serial":29,"sample":"Water","test":"Carbonate root, hydrogen carbonate root","instrument":"Dip the tube.","standard":"DZ/T 0064.49-2021 Part 49 of the groundwater quality analysis methodology: determination of carbonate roots, heavy carbonate roots and hydroxyl ion \nIt's a trick.","category":"Water quality ion"},{"id":"ENV-WS-W030","group":"water","serial":30,"sample":"Water","test":"Suspended particulate matter","instrument":"Leaching devices, ovens.","standard":"GB/T 11901-1989 Water quality determination \nWeight Method","category":"Water quality basic management"},{"id":"ENV-WS-S001","group":"soil","serial":1,"sample":"Soil","test":"PH","instrument":"PHS-3E.","standard":"HJ962-2018 Soil pH determination method","category":"Soil fundamentals"},{"id":"ENV-WS-S002","group":"soil","serial":2,"sample":"Soil","test":"Electrical Conductivity","instrument":"Conductivity Meter, Thunder Magnetic DDSJ-308A","standard":"HJ802-2016 Soil conductivity determination Electrodes","category":"Soil fundamentals"},{"id":"ENV-WS-S003","group":"soil","serial":3,"sample":"Soil","test":"Water content rate","instrument":"It's hot and hot. It's dry.\nThree rounds of DHG-9202-3A in Shanghai","standard":"HJ 613-2011 \nSoil, dry matter and moisture measurement, weight method.","category":"Soil fundamentals"},{"id":"ENV-WS-S004","group":"soil","serial":4,"sample":"Soil","test":"Refrigerated dry grinding sift.","instrument":"Vacuum freezers,\nGerman christ Alpha-4Ldplus","standard":"/","category":"Soil fundamentals"},{"id":"ENV-WS-S005","group":"soil","serial":5,"sample":"Soil","test":"TN, full nitrogen.","instrument":"Continuous mobility analyser, SEAL AAA","standard":"NY/T 53-1987                                            \n Soil whole nitrogen measurement (semi-microgram)","category":"Soil nutrients"},{"id":"ENV-WS-S006","group":"soil","serial":6,"sample":"Soil","test":"NH4+, ammonium nitrogen","instrument":"Continuous mobility analyser, SEAL AAA","standard":"GB/T 42487-2023 Soil Quality Determination of Nitro, Nitro and Ammonium Nitro","category":"Soil nutrients"},{"id":"ENV-WS-S007","group":"soil","serial":7,"sample":"Soil","test":"NO3-, Nitrogen","instrument":"Continuous mobility analyser, SEAL AAA","standard":"GB/T 42487-2023 Soil Quality Determination of Nitro, Nitro and Ammonium Nitro","category":"Soil nutrients"},{"id":"ENV-WS-S008","group":"soil","serial":8,"sample":"Soil","test":"NO2-, Nitrogen","instrument":"Continuous mobility analyser, SEAL AAA","standard":"GB/T 42487-2023 Soil Quality Determination of Nitro, Nitro and Ammonium Nitro","category":"Soil nutrients"},{"id":"ENV-WS-S009","group":"soil","serial":9,"sample":"Soil","test":"Nitrogen alkaline ( Nitrogen hydrolysis )","instrument":"Dip the pipe, spread the vessel.","standard":"/","category":"Soil nutrients"},{"id":"ENV-WS-S010","group":"soil","serial":10,"sample":"Soil","test":"TP, all-phosphorus","instrument":"Continuous mobility analyser, SEAL AAA","standard":"HCLO4-H2SO4 Boiling method \nSoil Agricultural Analysis DB23/T 1942-2017 Soil\n All-phosphate measurements Mobile injection - Ammonium Molybdate spectrophotometry","category":"Soil nutrients"},{"id":"ENV-WS-S011","group":"soil","serial":11,"sample":"Soil","test":"AP, active phosphorus","instrument":"Ultraviolet Visible Spectrometer","standard":"NHCOS impregnated - anticolour method \nSoil Agro-Analysis","category":"Soil nutrients"},{"id":"ENV-WS-S012","group":"soil","serial":12,"sample":"Soil","test":"IP, inorganic phosphorus.","instrument":"Ultraviolet Visible Spectrometer","standard":"/","category":"Soil nutrients"},{"id":"ENV-WS-S013","group":"soil","serial":13,"sample":"Soil","test":"Anion exchange","instrument":"Ultraviolet Visible Spectrometer","standard":"HJ 889-2017                                               \nSoil, cyanide ion exchange measurements. \nTrichloride Hexamethane Leaching - Spectrophotometry","category":"Soil fundamentals"},{"id":"ENV-WS-S014","group":"soil","serial":14,"sample":"Soil","test":"SiO3, silicate","instrument":"Continuous mobility analyser, SEAL AAA","standard":"/","category":"Soil nutrients"},{"id":"ENV-WS-S015","group":"soil","serial":15,"sample":"Soil","test":"Anion: K+, Na+, Ca2+, Mg2+","instrument":"Ion chromatographer, Sam Faisal, ICS 2100.","standard":"T/NAIA 099-2021 determination of inorganic anion levels in the soil of the facility","category":"Soil ion"},{"id":"ENV-WS-S016","group":"soil","serial":16,"sample":"Soil","test":"Anion: F-, Cl-, SO42-, NO3-","instrument":"Ion chromatographer, Sam Faisal, ICS 2100.","standard":"T/NAIA 099-2021 determination of inorganic anion levels in the soil of the facility","category":"Soil ion"},{"id":"ENV-WS-S017","group":"soil","serial":17,"sample":"Soil","test":"DOC, dissolved organic carbon","instrument":"Total organic carbon analyser, Toc-L, Shimazu","standard":"GB/T17145—2019\nMeasurement of soil water soluble organic carbon","category":"Soil carbon and decomposition"},{"id":"ENV-WS-S018","group":"soil","serial":18,"sample":"Soil","test":"TOC, total organic carbon (organic)","instrument":"Dip the tube.","standard":"LY/T 1237-1999 Measurement of forest soil organic matter and calculation of carbon nitrogen ratio","category":"Soil carbon and decomposition"},{"id":"ENV-WS-S019","group":"soil","serial":19,"sample":"Soil","test":"HFOC, Reassembly Organic Carbon","instrument":"Dip the tube.","standard":"/","category":"Soil carbon and decomposition"},{"id":"ENV-WS-S020","group":"soil","serial":20,"sample":"Soil","test":"LFOC, light group organic carbon","instrument":"Dip the tube.","standard":"/","category":"Soil carbon and decomposition"},{"id":"ENV-WS-S021","group":"soil","serial":21,"sample":"Soil","test":"Corrosive acid","instrument":"Dip the tube.","standard":"NY/T 1867-2010                                             \nMeasurement of soil curate composition","category":"Soil carbon and decomposition"},{"id":"ENV-WS-S022","group":"soil","serial":22,"sample":"Soil","test":"Furry acid","instrument":"Dip the tube.","standard":"NY/T 1867-2010                                             \nMeasurement of soil curate composition","category":"Soil carbon and decomposition"},{"id":"ENV-WS-S023","group":"soil","serial":23,"sample":"Soil","test":"Hu Mint acid","instrument":"Dip the tube.","standard":"NY/T 1867-2010                                             \nMeasurement of soil curate composition","category":"Soil carbon and decomposition"},{"id":"ENV-WS-S024","group":"soil","serial":24,"sample":"Soil","test":"Pre-treatment of heavy metal samples","instrument":"Microwave digestor, CEM, USA","standard":"Arsenic, lead, copper, zinc, cadmium, chromium, nickel,\nMeasurement of magnesium, potassium, calcium, manganese, iron, selenium, molybdenum \nElectronlytic coupling plasma mass spectrometry","category":"Soil elements and heavy metals"},{"id":"ENV-WS-S025","group":"soil","serial":25,"sample":"Soil","test":"Five-step extraction of conventional heavy metals","instrument":"ICPMS","standard":"Analytical Chemistry, 51(7): 844-851","category":"Soil elements and heavy metals"},{"id":"ENV-WS-S026","group":"soil","serial":26,"sample":"Soil","test":"Bivalent iron.","instrument":"Ultraviolet Visible Spectrometer","standard":"Soil agro-analysis","category":"Soil elements and heavy metals"},{"id":"ENV-WS-S027","group":"soil","serial":27,"sample":"Soil","test":"Triple iron.","instrument":"Total iron - dual price iron","standard":"/","category":"Soil elements and heavy metals"},{"id":"ENV-WS-S028","group":"soil","serial":28,"sample":"Soil extraction fluids","test":"Cu, Zn, Ni, Pb, Cd, Cr, K, Ca, Na, Mg, Fe, As, Mo, Mun, Au, Hg, Co, etc.","instrument":"ICPMS, Semyr Feissel, ICAPQ","standard":"Arsenic, lead, copper, zinc, cadmium, chromium, nickel,\nMeasurement of magnesium, potassium, calcium, manganese, iron, selenium, molybdenum \nElectronlytic coupling plasma mass spectrometry","category":"Soil elements and heavy metals"},{"id":"ENV-WS-S029","group":"soil","serial":29,"sample":"Soil extraction fluids","test":"As, Hg, Se, etc.","instrument":"Atomic fluorescent, Beijing Hae-goon, AFS-9700A","standard":"Standard GB/T 22105.1-2008 \nTotal Mercury Total Arsenic Lead Determination Atomic Fluorescent Act\nPart I","category":"Soil elements and heavy metals"},{"id":"ENV-WS-S030","group":"soil","serial":30,"sample":"Soil extraction fluids","test":"Cu, Zn, Ni, Pb, Cd, Cr, Fe, Mn, etc.","instrument":"Atom Absorption, PE, PinAcle 900T","standard":"Arsenic, lead, copper, zinc, cadmium, chromium, nickel,\nMeasurement of magnesium, potassium, calcium, manganese, iron, selenium, molybdenum \nElectronlytic coupling plasma mass spectrometry","category":"Soil elements and heavy metals"},{"id":"ENV-WS-S031","group":"soil","serial":31,"sample":"Solid powder","test":"The Council.","instrument":"The Fourier Infrared Spectrometer,\nNicolet iS10.","standard":"/","category":"Soil/solid representation"},{"id":"ENV-WS-S032","group":"soil","serial":32,"sample":"Soil","test":"Seed sprouts index","instrument":"Smart light incubator","standard":"NY/T 525-2021 Organic Fertilizers\nGB/T 23486－2009","category":"Soil ecological indicators"},{"id":"ENV-WS-S033","group":"soil","serial":33,"sample":"Soil","test":"Seed sprout rate","instrument":"Smart light incubator","standard":"NY/T 525-2021 Organic Fertilizers \nGB/T 23486－2009","category":"Soil ecological indicators"},{"id":"ENV-WS-S034","group":"soil","serial":34,"sample":"Soil","test":"Total Sugar","instrument":"Ultraviolet Visible Spectrometer","standard":"/","category":"Soil ecological indicators"},{"id":"ENV-WS-S035","group":"soil","serial":35,"sample":"Soil","test":"Protein.","instrument":"Ultraviolet Visible Spectrometer","standard":"/","category":"Soil ecological indicators"}]
  source.forEach(r => {
    if (has.has(r.id)) return;
    const standard = String(r.standard || '').replace(/\s+/g,' ').trim();
    const instrument = String(r.instrument || '').replace(/\s+/g,' ').trim();
    window.HQTD_CATALOG_DATA.push({
      id:r.id,
      board:"Environmental Testing",
      category:r.group === 'water' ? "Routine Water Testing" : "Routine Soil Testing",
      service:r.test,
      details:`${r.sample} · ${r.category}${instrument ? ` · ${instrument}` : ''}${standard && standard !== '/' ? ` · ${standard}` : ''}`,
      unit:"projects",
      price:null,
      priceText:"To Be Assessed",
      cycle:"Technical assessment confirmed",
      priority:r.group === 'water' ? "The topic of routine water quality testing" : "General soil detection topic",
      image:null,
      imageAlt:`${r.test} ${r.group === 'water' ? "Routine Water Testing" : "Routine Soil Testing"}`,
      detailUrl:`${r.group === 'water' ? 'water-testing.html' : 'soil-testing.html'}?target=${encodeURIComponent(r.id)}#project-list`,
      routineEnvironment:true,
      instrument:r.instrument || '',
      standard:r.standard || ''
    });
  });
})();

;(() => {
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const envTopics=[
    {title:"Precision testing for new contaminants",en:'EMERGING CONTAMINANTS',desc:"PFAS, pesticides, antibiotics, drugs, hormones and other targets.",href:'emerging-contaminants.html',query:"Catalog.html? board=Environmental & q=PFAS"},
    {title:"Accurate monitoring of greenhouse gases",en:'GREENHOUSE GAS',desc:"CO₂, CH₄, N₂O and other environmental and emission monitoring.",href:'greenhouse-gas-detection.html',query:"Catalog.html?Board=Environmental &Category= Greenhouse gases"},
    {title:"Microplastics and crack microplastics",en:'MICROPLASTIC ANALYTICS',desc:"Particle count, polymer identification and source analysis.",href:'microplastics-detection.html',query:"Catalog.html? board=environmental &category=microplastics"},
    {title:"Routine Water Testing",en:'ROUTINE WATER TESTING',desc:"30 basic studies, nutrients, ion and elements/heavy metals.",href:'water-testing.html',query:"Catalog.html?Board=environmental &category=standard water quality test"},
    {title:"Routine Soil Testing",en:'ROUTINE SOIL TESTING',desc:"35 Decoration, nutrients, carbon/curate, heavy metals and ecological indicators.",href:'soil-testing.html',query:"Catalog.html?Board=Environmental &Category=Soil General"},
    {title:"Comprehensive Testing and Method Development",en:'METHOD DEVELOPMENT',desc:"Complex matrix, new target and non-conventional scientific testing programme.",href:'comprehensive-testing-method-development.html',query:"Catalog.html?Board=Environmental &Category=Integration and Methodologies Development"}
  ];
  const highTopics=[
    {title:"Catalytic Mechanisms and Defect Engineering",en:'CATALYSIS & DEFECT',desc:"Oxygen vacancies, active sites, electron transfer, and reaction pathways.",href:'high-end-simulation.html#catalysis',query:"Catalog.html? board=calculation simulation=high-end calculation simulation&q=catalyst"},
    {title:"Membrane Separation and Molecular Interfaces",en:'MEMBRANE & INTERFACE',desc:"Free volume, diffusive transport, and the origins of selectivity.",href:'high-end-simulation.html#membrane',query:"Catalog.html? board=calculation simulation=high-end calculation simulation&q= membrane separation"},
    {title:"Interfacial Reactions of Complex Contaminants",en:'COMPLEX INTERFACE',desc:"PFAS, microdrops, interface enrichment and key activation.",href:'high-end-simulation.html#interface',query:"Catalog.html? board=calculation simulation=high-end calculation simulation&q=complex contaminants"},
    {title:"Energy and Electrochemical Interfaces",en:'ENERGY & ELECTROCHEMISTRY',desc:"Solvation, electrode interfaces, and charge transfer.",href:'high-end-simulation.html#energy',query:"Catalog.html? board=calculation simulation=high-end calculation simulation&q=energy"},
    {title:"Polymer and Composite Interfaces",en:'POLYMER & COMPOSITE',desc:"Interfacial coupling, heat transfer, and structure–property relationships.",href:'high-end-simulation.html#polymer',query:"Catalog.html? board=calculation simulation=high-end calculation simulation&q=polymer"},
    {title:"Custom Advanced Simulation",en:'CUSTOM ADVANCED SIMULATION',desc:"DFT, MD, AIMD and Multiscale Calculator Routes.",href:'high-end-simulation.html#custom',query:"Catalog.html? board=calculation simulation=high-end calculation simulation&q=customing"}
  ];

  const ensureCss=()=>{
    if(document.querySelector('link[href*="catalog-topic-v107.css"]'))return;
    const l=document.createElement('link');l.rel='stylesheet';l.href='/en/assets/css/catalog-topic-v107.css?v=20260921-v109';document.head.appendChild(l);
  };

  const renderCards=(items)=>items.map(x=>`<a class="catalog-topic-card" href="${esc(x.href)}"><small>${esc(x.en)}</small><b>${esc(x.title)}</b><p>${esc(x.desc)}</p><strong>Get to the subject.</strong></a>`).join('');

  const enhanceSearch=()=>{
    const input=document.getElementById('search-input');
    if(input)input.placeholder="Input projects, methods or instruments such as: water quality, soil, PFAS, DFT, XPS, ICPMS";
    const box=document.querySelector('.catalog-big-search');
    if(box && !document.querySelector('.catalog-search-suggestions-v107')){
      const row=document.createElement('div');row.className='catalog-search-suggestions-v107';
      row.innerHTML="<a href=\"Catalog.html?Board=environmental &amp;category=standard water quality test\">Routine Water Testing</a><a href=\"Catalog.html?Board=Environmental &amp;Category=Soil General\">Routine Soil Testing</a><a href=\"Catalog.html? board=Environmental &amp; q=PFAS\">PFAS</a><a href=\"Catalog.html? board=environmental &amp;category=microplastics\">Microplastics</a><a href=\"Catalog.html? board=calculation simulation=high-end calculation simulation\">High-end calculations</a>";
      box.parentElement?.appendChild(row);
    }
  };

  const enhanceEnvCategoryGroup=()=>{
    const group=document.querySelector('.hqt-class-group-environment');
    const wrap=group?.querySelector(':scope>div');if(!group||!wrap||group.dataset.v107==='1')return;
    group.dataset.v107='1';group.classList.add('v107');
    const links=[
      ["Target repository for new pollutants",'387','emerging-contaminants.html#database'],
      ["Greenhouse Gases",'3',"Catalog.html?Board=Environmental &Category= Greenhouse gases"],
      ["Microplastics",'3',"Catalog.html? board=environmental &category=microplastics"],
      ["Routine Water Testing",'30',"Catalog.html?Board=environmental &category=standard water quality test"],
      ["Routine Soil Testing",'35',"Catalog.html?Board=Environmental &Category=Soil General"],
      ["Comprehensive Testing and Method Development",'4',"Catalog.html?Board=Environmental &Category=Integration and Methodologies Development"]
    ];
    links.reverse().forEach(([name,count,href])=>{
      if([...wrap.querySelectorAll('span')].some(x=>x.textContent.trim()===name))return;
      const a=document.createElement('a');a.href=href;a.className='v107-priority';a.innerHTML=`<span>${name}</span><b>${count}</b>`;wrap.prepend(a);
    });
  };

  const enhanceTopicHub=()=>{
    if(document.querySelector('.catalog-topic-hub-v107'))return;
    const main=document.querySelector('.catalog-main')||document.querySelector('main');
    if(!main)return;
    const sec=document.createElement('section');sec.className='catalog-topic-hub-v107';
    sec.innerHTML=`<div class="container"><div class="hub-head"><div><span>SPECIAL TOPICS</span><h2>Topical fast-track entrance</h2></div><p>Quick access by “environmental detection topics” and “high-end topics”. Access to topic-based integrity, access to project queries, and direct screening of specific services.</p></div><div class="catalog-topic-tabs"><button type="button" class="active" data-v107-tab="environment">Environmental testing 6 topics</button><button type="button" data-v107-tab="simulation">High-end calculations 6 topics</button></div><div class="catalog-topic-grid" data-v107-grid>${renderCards(envTopics)}</div><div class="catalog-topic-quick"><a href="-Catalog.html?">All environmental detection projects</a><a href="Catalog.html? board=calculation simulation=high-end calculation simulation">All high-end computing items</a><a href="demand-list.html">View Needs List</a></div></div>`;
    main.parentElement?.insertBefore(sec,main);
    sec.addEventListener('click',e=>{
      const b=e.target.closest('[data-v107-tab]');if(!b)return;
      sec.querySelectorAll('[data-v107-tab]').forEach(x=>x.classList.toggle('active',x===b));
      sec.querySelector('[data-v107-grid]').innerHTML=renderCards(b.dataset.v107Tab==='simulation'?highTopics:envTopics);
    });
  };

  const enhanceHighsimFeature=()=>{
    const sec=document.querySelector('.catalog-highsim-feature');
    const grid=sec?.querySelector('.catalog-highsim-grid');if(!sec||!grid||sec.dataset.v107==='1')return;
    sec.dataset.v107='1';sec.classList.add('v107-six');
    const p=sec.querySelector('.catalog-highsim-head p');
    if(p)p.textContent="Each of the six high-end computational directions can be directly screened from the project search, and the representative case and calculation route can be viewed on the thematic page..";
    grid.innerHTML=highTopics.map(x=>`<a class="catalog-highsim-card" href="${esc(x.query)}"><b>${esc(x.title)}</b><small>${esc(x.desc)}</small></a>`).join('');
    const more=sec.querySelector('.catalog-highsim-more');
    if(more)more.innerHTML="<span>All six have access to the project query, no longer showing only three representational directions.</span><a href=\"high-end-simulation.html\">Enter the high-end computation theme</a>";
  };

  const fixCartSource=()=>{
    const timer=setInterval(()=>{
      if(!window.HQTDEnvCart||window.HQTDEnvCart.__v107Wrapped)return;
      const original=window.HQTDEnvCart.add;
      if(typeof original!=='function')return;
      window.HQTDEnvCart.add=function(item){
        const x={...item};
        if(x.details&&typeof x.details==='object'){
          const cat=String(x.category||'');
          x.details={...x.details,source:cat==="Routine Water Testing"?"The topic of routine water quality testing":cat==="Routine Soil Testing"?"General soil detection topic":cat==="Greenhouse Gases"?"The topic of greenhouse gas monitoring":cat==="Microplastics"?"Microplastic testing topic":cat==="Comprehensive Testing and Method Development"?"Comprehensive Testing and Method Development":"Project bank for new contaminants"};
        }
        return original.call(this,x);
      };
      window.HQTDEnvCart.__v107Wrapped=true;clearInterval(timer);
    },50);
    setTimeout(()=>clearInterval(timer),4000);
  };

  const init=()=>{ensureCss();enhanceSearch();enhanceEnvCategoryGroup();enhanceTopicHub();enhanceHighsimFeature();fixCartSource();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

;(() => {
  'use strict';

  const TOTAL_ENVIRONMENT_COUNT = 462;

  const normalizeCatalogV109 = () => {
    document.querySelectorAll('.hqt-board-stat-analysis > span:first-child').forEach(x => x.textContent = "Material Characterization");
    document.querySelectorAll('.hqt-board-stat-env > span:first-child').forEach(x => x.textContent = "Environmental Testing");

    document.querySelectorAll('.hqt-board-stat-env').forEach(el => {
      el.classList.add('v109-clean');
      el.style.setProperty('border', '1px solid #dbe6ef', 'important');
      el.style.setProperty('border-top', '1px solid #dbe6ef', 'important');
      el.style.setProperty('background', '#fff', 'important');
      el.style.setProperty('box-shadow', 'none', 'important');
    });

    document.querySelectorAll("[data-board-count= \"environmental test\"]").forEach(node => {
      node.textContent = TOTAL_ENVIRONMENT_COUNT.toLocaleString('en-US');
    });

    const envGroup = document.querySelector('.hqt-class-group-environment');
    if (envGroup) {
      const h3 = envGroup.querySelector('h3');
      if (h3) h3.textContent = "Environmental Testing";
    }

    document.querySelectorAll('.hqt-class-group h3').forEach(h3 => {
      if (h3.textContent.trim() === "Material Characterization") h3.textContent = "Material Characterization";
    });
  };

  const run = () => {
    normalizeCatalogV109();
    [80,250,700,1500].forEach(ms => setTimeout(normalizeCatalogV109, ms));
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, {once:true});
  else run();
})();

