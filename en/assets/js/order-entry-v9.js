(() => {
  'use strict';

  const API_URL = 'https://cloud1-d3gji859l94c3e5ec-1447812542.ap-shanghai.app.tcloudbase.com/api/webPortal';
  const CART_KEY = 'hqtd_en_requirement_cart_v2';
  const CONTACT_KEY = 'hqtd_en_quick_contact_v2';
  const TOKEN_KEY = 'hqtd_token';
  const isProjectPage = /\/project\/[a-z]+-\d+\.html$/i.test(location.pathname);
  const isHomePage = /\/(?:index\.html)?$/i.test(location.pathname) && !/\/project\//i.test(location.pathname);

  const portalRoot = isProjectPage ? '/en/customer-portal/' : '/en/customer-portal/';
  enhanceGlobalCustomerCenter();
  if (!isProjectPage || document.querySelector('.hqtd-order-shell')) return;

  const project = readProject();
  const state = { mode: 'single', current: project, submitting: false, registry: null, projectTemplateMap: null };
  injectShell();
  bindEvents();
  updateCartCount();

  function readProject() {
    const match = location.pathname.match(/\/([a-z]+-\d+)\.html$/i);
    const id = match ? match[1].toUpperCase() : '';
    const serviceType = id.startsWith('HC-') ? "Supplies & Instruments" : id.startsWith('FX-') ? "Material Characterization" : id.startsWith('JS-') ? "Computational Simulation" : "AI Projects";
    const title = (document.querySelector('h1')?.textContent || document.title.split('｜')[0] || "Current Project").trim();
    const data = { id, title, name: title, projectName: title, serviceType, board: serviceType, qty: 1, unit: serviceType === "Supplies & Instruments" ? "piece" : "projects", price: 0, priceText: "To Be Assessed", category: '', spec: '', cycle: '', note: '', details: {}, sourceUrl: location.href };
    try {
      const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')];
      for (const node of scripts) {
        const json = JSON.parse(node.textContent || '{}');
        const graph = Array.isArray(json['@graph']) ? json['@graph'] : [json];
        const product = graph.find(item => item && item['@type'] === 'Product');
        if (!product) continue;
        data.title = product.name || data.title;
        data.name = data.title;
        data.projectName = data.title;
        data.category = product.category || '';
        const props = Array.isArray(product.additionalProperty) ? product.additionalProperty : [];
        for (const prop of props) {
          if (prop.name === "Specifications") data.spec = prop.value || '';
          if (prop.name === "Pricing Unit") data.unit = prop.value || data.unit;
          if (prop.name === "Estimated Lead Time") data.cycle = prop.value || '';
        }
        const offer = product.offers || {};
        if (offer['@type'] === 'Offer' && Number(offer.price) > 0) {
          data.price = Number(offer.price);
          data.priceText = `¥${formatNumber(data.price)}`;
        } else if (offer.lowPrice || offer.highPrice) {
          data.priceText = `¥${offer.lowPrice || '?'}${offer.highPrice ? `–${offer.highPrice}` : ''}`;
        }
        break;
      }
    } catch (_) {}
    const boardLabel = document.querySelector('.project-board-label')?.textContent || '';
    if (!data.category && boardLabel.includes('·')) data.category = boardLabel.split('·')[0].trim();
    return data;
  }

  function enhanceGlobalCustomerCenter() {
    let old = [...document.querySelectorAll('a[href*="customer-portal"]')].find(a => /Customer Registration|Place an Order|Customer Center/.test(a.textContent));
    if (!old) { old = document.createElement('a'); old.href = new URL(portalRoot, document.baseURI).href; document.body.appendChild(old); }
    old.href = new URL(portalRoot, document.baseURI).href;
    old.className = 'hqtd-global-customer-center';
    old.removeAttribute('style');
    old.setAttribute('aria-label', "Access to client centres for orders, quotations, progress and documents");
    old.innerHTML = "<span>Customer Center</span><small>Orders, Quotes &amp; Files</small>";
    const nav = document.querySelector('.unified-site-nav');
    if (nav && old.parentElement !== nav) nav.insertBefore(old, nav.firstChild);
  }

  function injectShell() {
    const supply = project.serviceType === "Supplies & Instruments";
    const bar = document.createElement('aside');
    bar.className = 'hqtd-order-shell';
    bar.innerHTML = `
      <div class="hqtd-order-product"><small>${escapeHtml(project.id)}</small><strong>${escapeHtml(project.title)}</strong><span>${escapeHtml(project.priceText)}${project.unit ? ` / ${escapeHtml(project.unit)}` : ''}</span></div>
      ${supply ? "<div class=\"hqtd-order-qty\"><button type=\"button\" data-qty-minus>−</button><input data-qty value=\"1\" inputmode=\"numeric\" aria-label=\"Quantity\"><button type=\"button\" data-qty-plus>＋</button></div>" : ''}
      <button class="hqtd-order-secondary" type="button" data-open-form>${supply ? "Add to List" : "Request Details"}</button>
      <button class="hqtd-order-primary" type="button" data-buy-now>${supply ? "Order Now" : "Submit Now"}</button>
      <button class="hqtd-order-cart" type="button" data-open-cart aria-label="Open Request List">List <b data-cart-count>0</b></button>`;
    document.body.appendChild(bar);

    const overlay = document.createElement('div');
    overlay.className = 'hqtd-order-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="hqtd-order-backdrop" data-close-order></div>
      <section class="hqtd-order-panel" role="dialog" aria-modal="true" aria-label="Project Request">
        <header><div><small id="hqtdPanelKicker">Current Project</small><h2 id="hqtdPanelTitle"></h2></div><button type="button" data-close-order aria-label="Close">×</button></header>
        <div class="hqtd-order-panel-body" id="hqtdPanelBody"></div>
      </section>`;
    document.body.appendChild(overlay);

    const toast = document.createElement('div');
    toast.className = 'hqtd-order-toast';
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }

  function bindEvents() {
    const shell = document.querySelector('.hqtd-order-shell');
    shell.querySelector('[data-open-form]').addEventListener('click', () => {
      if (project.serviceType === "Supplies & Instruments") addSupplyToCart(false);
      else openProjectForm('cart');
    });
    shell.querySelector('[data-buy-now]').addEventListener('click', () => {
      if (project.serviceType === "Supplies & Instruments") openCheckout([supplyItem()]);
      else openProjectForm('submit');
    });
    shell.querySelector('[data-open-cart]').addEventListener('click', openCart);
    shell.querySelector('[data-qty-minus]')?.addEventListener('click', () => setQty(readQty() - 1));
    shell.querySelector('[data-qty-plus]')?.addEventListener('click', () => setQty(readQty() + 1));
    shell.querySelector('[data-qty]')?.addEventListener('change', () => setQty(readQty()));
    document.querySelectorAll('[data-close-order]').forEach(button => button.addEventListener('click', closePanel));
    window.addEventListener('storage', event => { if (event.key === CART_KEY) updateCartCount(); });
  }

  function readQty() {
    const value = Number(document.querySelector('[data-qty]')?.value || 1);
    return Math.max(1, Math.min(999, Number.isFinite(value) ? Math.round(value) : 1));
  }
  function setQty(value) {
    const input = document.querySelector('[data-qty]');
    if (input) input.value = String(Math.max(1, Math.min(999, Number(value) || 1)));
  }

  function supplyItem() {
    return { ...project, qty: readQty(), note: '', details: { specification: project.spec || '' }, cartKey: `${project.id}-${Date.now()}` };
  }

  function addSupplyToCart(openAfter) {
    const rows = readCart();
    const existing = rows.find(item => item.id === project.id && item.serviceType === "Supplies & Instruments");
    if (existing) existing.qty = Math.min(999, Number(existing.qty || 1) + readQty());
    else rows.push(supplyItem());
    writeCart(rows);
    showToast(existing ? "Quantities have been consolidated into the list of needs" : "Added to the list of needs");
    if (openAfter) openCart();
  }

  async function openProjectForm(action) {
    state.mode = action;
    const body = document.getElementById('hqtdPanelBody');
    document.getElementById('hqtdPanelKicker').textContent = project.serviceType;
    document.getElementById('hqtdPanelTitle').textContent = project.title;
    body.innerHTML = buildProjectForm(project);
    openPanel();
    body.querySelector('[data-template-link]')?.addEventListener('click', async event => {
      event.preventDefault();
      const link = event.currentTarget;
      const original = link.textContent;
      link.textContent = "Checking item numbers with templates...";
      try {
        const template = await exactTemplate(project);
        link.href = template.url;
        link.download = template.filename;
        if (!template.titleMatched) {
          throw new Error(`Project ID ${template.code} The corresponding template is '${template.projectName}, the current page is entitled${project.title}”. Failed to download the error template.`);
        }
        const anchor = document.createElement('a');
        anchor.href = template.url;
        anchor.download = template.filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        link.textContent = `Download ${template.code} Special Templates`;
      } catch (error) {
        link.textContent = original;
        setMessage(error.message, 'error');
      }
    });
    body.querySelectorAll('[data-fill-mode]').forEach(button => button.addEventListener('click', () => {
      body.querySelectorAll('[data-fill-mode]').forEach(x => x.classList.toggle('active', x === button));
      body.dataset.fillMode = button.dataset.fillMode;
      const online = button.dataset.fillMode === 'online';
      body.querySelector('.hqtd-form-grid')?.toggleAttribute('hidden', !online);
      body.querySelector('.hqtd-word-mode')?.toggleAttribute('hidden', online);
    }));
    body.dataset.fillMode = 'online';
    body.querySelector('[data-form-cart]')?.addEventListener('click', () => saveProjectForm(false));
    body.querySelector('[data-form-generate]')?.addEventListener('click', generateCurrentWord);
    body.querySelector('[data-form-submit]')?.addEventListener('click', () => saveProjectForm(true));
  }


  function normalizedProjectCode(raw, serviceType) {
    const value = String(raw || '').trim().toUpperCase();
    let match = value.match(/^AI-0*(\d+)$/); if (match) return `AI-${Number(match[1])}`;
    match = value.match(/^JS-0*(\d+)$/); if (match) return `JS-${Number(match[1])}`;
    match = value.match(/^FX-0*(\d+)$/); if (match) return `FX-${Number(match[1])}`;
    match = value.match(/^HC-0*(\d+)$/); if (match) return `HC-${Number(match[1])}`;
    match = value.match(/^A0*(\d+)$/); if (match) return `FX-${Number(match[1])}`;
    if (serviceType === "AI Projects") return 'AI-1';
    if (serviceType === "Computational Simulation") return 'JS-1';
    if (serviceType === "Material Characterization") return 'FX-1';
    if (serviceType === "Supplies & Instruments") return 'HC-1';
    return value || 'ZH-1';
  }

  function draftBusinessNo(item) {
    const now = new Date();
    const ymd = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
    return `HQTD-${ymd}-${normalizedProjectCode(item.id, item.serviceType)}-DRAFT`;
  }

  function projectSpecificProfile(item) {
 const text = `${item.id || ''} ${item.title || ''} ${item.category || ''}`;
 if (item.serviceType === "AI Projects" && /image|medical|segmentation|recognition|detection/i.test(text)) return {"title": "Project-Specific Parameters: Medical / Image Analysis", "fields": [{"key": "imageModality", "label": "Image Type", "placeholder": "CT, MRI, SEM, optical images", "type": "text"}, {"key": "annotationStatus", "label": "Annotation Status", "placeholder": "Annotated, partially annotated, or unannotated", "type": "text"}, {"key": "targetTask", "label": "Task", "placeholder": "Classification, detection, segmentation, registration", "type": "text"}, {"key": "evaluationMetric", "label": "Evaluation Metrics", "placeholder": "AUC, F1, Dice, IoU", "type": "text"}, {"key": "deploymentEnvironment", "label": "Deployment Environment", "placeholder": "Local machine, server, website, or Mini Program", "type": "text"}]};
 if (item.serviceType === "AI Projects" && /material|screen|performance|molecul|formulation/i.test(text)) return {"title": "Project-Specific Parameters: Materials and Molecular Screening", "fields": [{"key": "candidateSpace", "label": "Candidate Space", "placeholder": "Materials, molecules, or formulations", "type": "text"}, {"key": "descriptorSource", "label": "Descriptor Sources", "placeholder": "Composition, structure, experimental or computational descriptors", "type": "text"}, {"key": "targetProperty", "label": "Target Property", "placeholder": "Property to predict or optimize", "type": "text"}, {"key": "validationPlan", "label": "Validation Method", "placeholder": "Holdout set, external data, experiments, or computation", "type": "text"}, {"key": "screeningOutput", "label": "Screening Outputs", "placeholder": "Top-N candidates, ranking, interpretation, uncertainty", "type": "text"}]};
 if (item.serviceType === "AI Projects" && /agent|llm|rag|knowledge base|large language/i.test(text)) return {"title": "Project-Specific Parameters: LLM / RAG / Agent", "fields": [{"key": "knowledgeSource", "label": "Knowledge Sources", "placeholder": "Papers, SOPs, databases, internal documents", "type": "text"}, {"key": "toolIntegration", "label": "Tool Integration", "placeholder": "Search, databases, scripts, business systems", "type": "text"}, {"key": "workflow", "label": "Workflow", "placeholder": "Input → reasoning → tools → review → output", "type": "text"}, {"key": "outputFormat", "label": "Output Format", "placeholder": "Report, JSON, table, webpage, or message", "type": "text"}, {"key": "permissionBoundary", "label": "Permissions and Safety Boundaries", "placeholder": "User roles, data access, human approval steps", "type": "text"}]};
 if (item.serviceType === "AI Projects") return {"title": "Project-Specific Parameters: Prediction and Data Analysis", "fields": [{"key": "inputFeatures", "label": "Input Features", "placeholder": "Main variables or data fields", "type": "text"}, {"key": "predictionTarget", "label": "Prediction Target", "placeholder": "Class labels or continuous targets", "type": "text"}, {"key": "baselineModel", "label": "Baseline Model", "placeholder": "Existing methods or models for comparison", "type": "text"}, {"key": "evaluationMetric", "label": "Evaluation Metrics", "placeholder": "MAE, RMSE, R², AUC, F1", "type": "text"}, {"key": "dataSplit", "label": "Data Split", "placeholder": "Training / validation / test sets or cross-validation", "type": "text"}]};
 if (item.serviceType === "Computational Simulation" && /molecular dynamics|\bmd\b|gromacs|lammps/i.test(text)) return {"title": "Project-Specific Parameters: Molecular Dynamics", "fields": [{"key": "forceField", "label": "Force Field", "placeholder": "CHARMM, AMBER, OPLS, COMPASS", "type": "text"}, {"key": "boxComposition", "label": "System Composition and Box Size", "placeholder": "Molecule counts, solvent, ions, dimensions", "type": "text"}, {"key": "ensemble", "label": "Ensemble and Conditions", "placeholder": "NVT / NPT, temperature, pressure", "type": "text"}, {"key": "simulationTime", "label": "Simulation Duration", "placeholder": "Equilibration and production durations", "type": "text"}, {"key": "trajectoryAnalysis", "label": "Trajectory Analysis", "placeholder": "RDF, MSD, hydrogen bonds, free energy", "type": "text"}]};
 if (item.serviceType === "Computational Simulation" && /cfd|fluid|fluent/i.test(text)) return {"title": "Project-Specific Parameters: CFD", "fields": [{"key": "geometrySource", "label": "Geometry", "placeholder": "CAD, dimensions, or schematic", "type": "text"}, {"key": "fluidProperties", "label": "Fluid Properties", "placeholder": "Density, viscosity, composition", "type": "text"}, {"key": "boundaryConditions", "label": "Boundary Conditions", "placeholder": "Inlets, outlets, walls, thermal boundaries", "type": "text"}, {"key": "meshRequirement", "label": "Mesh Requirements", "placeholder": "Mesh size, boundary layers, mesh-independence study", "type": "text"}, {"key": "outputVariables", "label": "Output Variables", "placeholder": "Velocity, pressure, temperature, mass transfer", "type": "text"}]};
 if (item.serviceType === "Computational Simulation" && /comsol|multiphysics|finite element|structural|abaqus|ansys/i.test(text)) return {"title": "Project-Specific Parameters: Multiphysics / Finite Element Analysis", "fields": [{"key": "physicsCoupling", "label": "Coupled Physics", "placeholder": "Structural, thermal, fluid, electrical, mass transfer", "type": "text"}, {"key": "materialProperties", "label": "Material Properties", "placeholder": "Elastic, thermal, electrical, diffusion parameters", "type": "text"}, {"key": "loadsConstraints", "label": "Loads and Constraints", "placeholder": "Force, displacement, temperature, electric potential", "type": "text"}, {"key": "geometryMesh", "label": "Geometry and Mesh", "placeholder": "Dimensions, contacts, meshing strategy", "type": "text"}, {"key": "resultRequest", "label": "Required Results", "placeholder": "Stress, deformation, field distributions, parameter sweeps", "type": "text"}]};
 if (item.serviceType === "Computational Simulation" && /quantum chemistry|gaussian|orca|molecular orbital/i.test(text)) return {"title": "Project-Specific Parameters: Quantum Chemistry", "fields": [{"key": "molecularCharge", "label": "Charge and Multiplicity", "placeholder": "For example: 0 1", "type": "text"}, {"key": "methodBasis", "label": "Method and Basis Set", "placeholder": "B3LYP-D3/def2-TZVP", "type": "text"}, {"key": "solventModel", "label": "Solvent Model", "placeholder": "Gas phase, PCM, SMD", "type": "text"}, {"key": "calculationTasks", "label": "Calculation Tasks", "placeholder": "Optimization, frequencies, excited states, NBO, ESP", "type": "text"}, {"key": "conformerTreatment", "label": "Conformer Treatment", "placeholder": "Specified conformer or conformational search", "type": "text"}]};
 if (item.serviceType === "Computational Simulation") return {"title": "Project-Specific Parameters: DFT / First-Principles Calculations", "fields": [{"key": "structureFormat", "label": "Structure Files", "placeholder": "CIF, POSCAR, or structure source", "type": "text"}, {"key": "functional", "label": "Functional and Dispersion", "placeholder": "PBE, HSE06, DFT-D3", "type": "text"}, {"key": "cutoffKpoints", "label": "Cutoff Energy and k-Points", "placeholder": "Specified values or convergence testing", "type": "text"}, {"key": "spinU", "label": "Spin and Hubbard U", "placeholder": "Magnetism, initial moments, DFT+U", "type": "text"}, {"key": "calculationOutputs", "label": "Required Outputs", "placeholder": "Bands, DOS, adsorption energies, charges, transition states", "type": "text"}]};
 if (item.serviceType === "Material Characterization" && /sem|scanning electron|eds|energy.dispersive/i.test(text)) return {"title": "Project-Specific Parameters: SEM / EDS", "fields": [{"key": "coatingRequirement", "label": "Gold / Carbon Coating", "placeholder": "Required, not required, or assessment requested", "type": "text"}, {"key": "magnification", "label": "Magnification", "placeholder": "Target magnification or field of view", "type": "text"}, {"key": "acceleratingVoltage", "label": "Accelerating Voltage", "placeholder": "Range or assessment requested", "type": "text"}, {"key": "edsPosition", "label": "EDS Locations and Elements", "placeholder": "Points, lines, maps, and target elements", "type": "text"}, {"key": "crossSection", "label": "Cross-Section Preparation", "placeholder": "Surface / cross-section and cutting method", "type": "text"}]};
 if (item.serviceType === "Material Characterization" && /xrd|diffraction|phase analysis/i.test(text)) return {"title": "Project-Specific Parameters: XRD", "fields": [{"key": "scanRange", "label": "Scan Range", "placeholder": "For example: 5–80°", "type": "text"}, {"key": "stepSpeed", "label": "Step Size / Scan Speed", "placeholder": "Specified or standard", "type": "text"}, {"key": "measurementMode", "label": "Measurement Mode", "placeholder": "Powder, thin film, grazing incidence", "type": "text"}, {"key": "phaseAnalysis", "label": "Phase Analysis", "placeholder": "Identification, quantification, crystallite size", "type": "text"}, {"key": "samplePreparation", "label": "Sample Preparation", "placeholder": "Powder amount, substrate, grinding", "type": "text"}]};
 if (item.serviceType === "Material Characterization" && /xps|photoelectron/i.test(text)) return {"title": "Project-Specific Parameters: XPS", "fields": [{"key": "targetElements", "label": "Target Elements", "placeholder": "Survey spectrum and high-resolution elements", "type": "text"}, {"key": "depthProfiling", "label": "Sputtering / Depth Profiling", "placeholder": "Required depth or sputtering time", "type": "text"}, {"key": "chargeCorrection", "label": "Charge Correction", "placeholder": "C 1s or another reference", "type": "text"}, {"key": "peakFitting", "label": "Peak Fitting", "placeholder": "Oxidation states, peak shapes, constraints", "type": "text"}, {"key": "sampleHandling", "label": "Sample Storage", "placeholder": "Light protection, inert atmosphere, vacuum transfer", "type": "text"}]};
 if (item.serviceType === "Material Characterization" && /bet|specific surface|pore|adsorption/i.test(text)) return {"title": "Project-Specific Parameters: BET / Pore Size", "fields": [{"key": "degassingTemperature", "label": "Degassing Temperature", "placeholder": "°C", "type": "text"}, {"key": "degassingTime", "label": "Degassing Time", "placeholder": "h", "type": "text"}, {"key": "adsorptiveGas", "label": "Adsorptive Gas", "placeholder": "N₂, Ar, CO₂", "type": "text"}, {"key": "poreModel", "label": "Pore Size Model", "placeholder": "BJH, DFT, NLDFT", "type": "text"}, {"key": "sampleMass", "label": "Sample Mass", "placeholder": "mg or g", "type": "text"}]};
 if (item.serviceType === "Material Characterization" && /icp|element|mass spectrom|oes/i.test(text)) return {"title": "Project-Specific Parameters: ICP Elemental Analysis", "fields": [{"key": "targetElements", "label": "Target Elements", "placeholder": "List elements to measure", "type": "text"}, {"key": "expectedConcentration", "label": "Expected Concentration Range", "placeholder": "For selecting dilution factors", "type": "text"}, {"key": "matrixAcidity", "label": "Matrix and Acidity", "placeholder": "Acid type, concentration, salt content", "type": "text"}, {"key": "digestionNeed", "label": "Digestion Requirements", "placeholder": "Whether digestion is required and sample mass", "type": "text"}, {"key": "qcRequirement", "label": "Quality Control", "placeholder": "Blanks, replicates, spike recovery, internal standards", "type": "text"}]};
 if (item.serviceType === "Material Characterization") return {"title": "Project-Specific Parameters: Characterization", "fields": [{"key": "instrumentParameters", "label": "Instrument Parameters", "placeholder": "Scan range, resolution, mode", "type": "text"}, {"key": "samplePreparation", "label": "Sample Preparation", "placeholder": "Dimensions, mass, substrate, pretreatment", "type": "text"}, {"key": "dataFormat", "label": "Data Format", "placeholder": "Raw data, Excel, images", "type": "text"}, {"key": "analysisModel", "label": "Analysis Method", "placeholder": "Fitting, database identification, statistics", "type": "text"}]};
 return {title:'Project-Specific Parameters',fields:[]};
  }

  function renderProjectSpecificFields(item) {
    const profile=projectSpecificProfile(item);
    if (!profile.fields.length) return '';
    return `<section class="hqtd-scroll-section hqtd-specific-section"><h3>${escapeHtml(profile.title)}</h3><div class="hqtd-form-grid">${profile.fields.map(f=>`<label class="hqtd-field ${f.type==='textarea'?'full':''}"><span>${escapeHtml(f.label)}</span>${f.type==='textarea'?`<textarea data-profile-field="${escapeHtml(f.key)}" maxlength="1200" placeholder="${escapeHtml(f.placeholder)}"></textarea>`:`<input data-profile-field="${escapeHtml(f.key)}" maxlength="500" placeholder="${escapeHtml(f.placeholder)}">`}</label>`).join('')}</div></section>`;
  }

  function buildProjectForm(item) {
    const template = templateUrl(item);
    const templateBlock = item.serviceType === "Supplies & Instruments" ? '' : `
      <section class="hqtd-scroll-section hqtd-fill-choice">
        <h3>Fill by</h3>
        <div class="hqtd-fill-mode">
          <button type="button" class="active" data-fill-mode="online"><b>Fill In Online (Recommended)</b><span>Complete the form online to generate your request document.</span></button>
          <button type="button" data-fill-mode="word"><b>Upload Word</b><span>Download the current project template and upload it directly after filling in</span></button>
        </div>
        <div class="hqtd-word-mode" hidden>
          <a href="#" data-template-link>Download and check ${escapeHtml(normalizedProjectCode(item.id, item.serviceType))} Special Word Templates</a>
          <label class="hqtd-upload"><span>Upload completed templates or related information <em>*</em></span><input id="hqtdWordFile" type="file" accept=".doc,.docx,.pdf,.xls,.xlsx,.csv,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar,.7z"></label>
        </div>
      </section>`;
    let fields = '';
    if (item.serviceType === "AI Projects") {
      fields = `
        <section class="hqtd-scroll-section"><h3>1. Basic information on the project</h3><div class="hqtd-form-grid">
          <label class="hqtd-field"><span>Project ID</span><input value="${escapeHtml(normalizedProjectCode(item.id, item.serviceType))}" readonly></label>
          <label class="hqtd-field"><span>Project name <em>*</em></span><input id="hqtdProjectName" value="${escapeHtml(item.title)}" maxlength="200"></label>
          <label class="hqtd-field full"><span>Project objectives <em>*</em></span><textarea id="hqtdNeed" maxlength="3000" placeholder="What problems, what functions to achieve or what results to achieve"></textarea></label>
        </div></section>
        <section class="hqtd-scroll-section"><h3>2. Data and technical conditions</h3><div class="hqtd-form-grid">
          <label class="hqtd-field"><span>Available data</span><select id="hqtdDataStatus"><option>Data available</option><option>Selected data</option><option>Data not available, needs assessment</option></select></label>
          <label class="hqtd-field"><span>Data type and size</span><input id="hqtdDataScale" maxlength="300" placeholder="Tables, images, text, time series data; Number of articles/GB"></label>
          <fieldset class="hqtd-choice-group full"><legend>Functions to be achieved (multi-optional)</legend>${["Projection models","Data Analysis","Image Recognition","Knowledge base/RAG","Smart","Website/ applet","Technical assessment requested"].map(x=>`<label><input type="checkbox" name="hqtdAiTasks" value="${x}"> ${x}</label>`).join('')}</fieldset>
          <label class="hqtd-field full"><span>Expected deliverables</span><textarea id="hqtdDeliverables" maxlength="1500" placeholder="Models, codes, reports, deployment systems, charts, etc."></textarea></label>
        </div></section>`;
    } else if (item.serviceType === "Computational Simulation") {
      fields = `
        <section class="hqtd-scroll-section"><h3>1. Research systems</h3><div class="hqtd-form-grid">
          <label class="hqtd-field"><span>Project ID</span><input value="${escapeHtml(normalizedProjectCode(item.id, item.serviceType))}" readonly></label>
          <label class="hqtd-field"><span>Project name</span><input id="hqtdProjectName" value="${escapeHtml(item.title)}" maxlength="200"></label>
          <label class="hqtd-field full"><span>Research Subject / System <em>*</em></span><textarea id="hqtdSystem" maxlength="1000" placeholder="Materials, molecules, interfaces, response systems, fluid areas, etc."></textarea></label>
        </div></section>
        <section class="hqtd-scroll-section"><h3>2. Calculation of content and parameters</h3><div class="hqtd-form-grid">
          <fieldset class="hqtd-choice-group full"><legend>Calculate content (multi-optional)</legend>${["Geometry Optimization","Adsorption Energy",'DOS/PDOS',"Bader Charge","Charge density/ELF","Band Structure","Transition State","Molecular Dynamics","CFCD/Multiphysical Fields","Technical assessment requested"].map(x=>`<label><input type="checkbox" name="hqtdCalcTasks" value="${x}"> ${x}</label>`).join('')}</fieldset>
          <label class="hqtd-field"><span>Software / Method Requirements</span><input id="hqtdMethod" maxlength="300" placeholder="Like VASP, Gaussian, GROMACS, COMSOL; I can leave it empty."></label>
          <label class="hqtd-field"><span>Key Parameters</span><input id="hqtdParameters" maxlength="500" placeholder="General, base group, temperature, pressure, time scale, etc."></label>
          <label class="hqtd-field full"><span>Specific calculation requirements <em>*</em></span><textarea id="hqtdNeed" maxlength="3000" placeholder="Describe the purpose of the study, the indicators to be calculated and the outcome of the desired output"></textarea></label>
          <label class="hqtd-field full"><span>Expected Outputs</span><textarea id="hqtdDeliverables" maxlength="1200" placeholder="Original documents, data sheets, diagrams, reports, methodological notes, etc."></textarea></label>
        </div></section>`;
    } else {
      fields = `
        <section class="hqtd-scroll-section"><h3>1. Sample information</h3><div class="hqtd-form-grid">
          <label class="hqtd-field"><span>Project ID</span><input value="${escapeHtml(normalizedProjectCode(item.id, item.serviceType))}" readonly></label>
          <label class="hqtd-field"><span>Number of Samples <em>*</em></span><input id="hqtdSampleCount" type="number" min="1" max="999" value="1"></label>
          <label class="hqtd-field"><span>Sample number</span><input id="hqtdSampleCodes" maxlength="500" placeholder="Default 1,2,3…; Or you can fill in yourself"></label>
          <label class="hqtd-field"><span>Sample Condition</span><select id="hqtdSampleState"><option>Powder</option><option>Blocks</option><option>Film/painting</option><option>Liquid/dispersible liquid</option><option>Gases</option><option>Other</option></select></label>
          <label class="hqtd-field full"><span>Composition name and chemical formula</span><textarea id="hqtdComposition" maxlength="1200" placeholder="Please fill in the main ingredients by item; Unknown to indicate unknown"></textarea></label>
          <fieldset class="hqtd-choice-group full"><legend>Sample risk (multi-optional)</legend>${["No poison, no danger.","Poison.","Flammable and explosive","Corrosiveness","Volatile substances","Biological hazards","I'm not sure. Please evaluate."].map(x=>`<label><input type="checkbox" name="hqtdHazards" value="${x}"> ${x}</label>`).join('')}</fieldset>
        </div></section>
        <section class="hqtd-scroll-section"><h3>2. Test parameters</h3><div class="hqtd-form-grid">
          <label class="hqtd-field"><span>Test temperature/range</span><input id="hqtdTemperature" maxlength="300" placeholder="Temperature, room temperature - 800°C, etc."></label>
          <label class="hqtd-field"><span>Test atmosphere/environment</span><input id="hqtdAtmosphere" maxlength="300" placeholder="Air, nitrogen, vacuum, humidity, etc."></label>
          <fieldset class="hqtd-choice-group full"><legend>Data analysis services</legend><label><input type="radio" name="hqtdAnalysisService" value="Yes." checked> Yes.</label><label><input type="radio" name="hqtdAnalysisService" value="I don&#x27;t need it."> I don't need it.</label><label><input type="radio" name="hqtdAnalysisService" value="Please evaluate."> Please evaluate.</label></fieldset>
          <label class="hqtd-field full"><span>Test parameters/specific analysis requirements <em>*</em></span><textarea id="hqtdNeed" maxlength="3000" placeholder="Instrument parameters, scanning ranges, sampling methods, data formats, drawings or analytical requirements"></textarea></label>
          <label class="hqtd-field full"><span>Experimental message.</span><textarea id="hqtdExperimentNote" maxlength="1500" placeholder="Other matters"></textarea></label>
        </div></section>`;
    }
    return `
      <div class="hqtd-selected-project"><b>${escapeHtml(normalizedProjectCode(item.id, item.serviceType))}</b><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.category || item.serviceType)}${item.priceText ? ` · ${escapeHtml(item.priceText)}` : ''}</span></div></div>
      ${templateBlock}
      <div class="hqtd-simple-tip"><b>Please choose how to fill in:</b>Scroll-in online to continue directly down; After selecting " Upload Word " , download the current project-specific template, fill it in and upload it..</div>
      <div class="hqtd-form-scroll">${fields}${renderProjectSpecificFields(item)}</div>
      <section class="hqtd-scroll-section"><h3>3. Annexes and submissions</h3><label class="hqtd-upload"><span>Annex (optional)</span><input id="hqtdFiles" type="file" multiple accept=".doc,.docx,.pdf,.xls,.xlsx,.csv,.zip,.rar,.7z,.png,.jpg,.jpeg,.cif,.pdb,.mol,.mol2,.xyz,.txt,.dat,.log,.gjf,.com,.inp,.vasp"><small>A maximum of 5 and not more than 5 MB each. Orders are created first and attachments are uploaded.</small></label></section>
      <div class="hqtd-panel-actions three-actions"><button type="button" class="secondary" data-form-cart>Add to Request List</button><button type="button" class="secondary" data-form-generate>Generate Word</button><button type="button" class="primary" data-form-submit>Submit Now</button></div>
      <div class="hqtd-order-message" id="hqtdOrderMessage" aria-live="polite"></div>`;
  }


  async function generateCurrentWord() {
    const button = document.querySelector('[data-form-generate]');
    try {
      const item = collectProjectForm();
      if (item.fillMethod === 'word') throw new Error("Word mode: Download template to fill and upload; Online fill mode to generate Word directly");
      if (button) { button.disabled = true; button.textContent = "Generating..."; }
      setMessage("Word...");
      const type = project.serviceType === "AI Projects" ? 'ai' : project.serviceType === "Computational Simulation" ? 'calculation' : 'analysis';
      const demandNo = draftBusinessNo(project);
      const result = await api('generateRequirementDocuments', {
        type,
        demandNo,
        form: {
          demandNo,
          projectId: normalizedProjectCode(project.id, project.serviceType),
          projectName: project.title,
          description: item.note,
          ...(item.details || {})
        }
      });
      const docx = result.item && result.item.docx;
      const filename = (docx && docx.filename) || `${demandNo}.docx`;
      const base64 = docx && docx.base64;
      const url = docx && (docx.tempURL || docx.downloadUrl || docx.url);

      if (base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], {
          type: (docx && docx.mimeType) || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 3000);
        setMessage(`Word has generated and started downloading:${escapeHtml(filename)}`, 'success');
      } else if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setMessage(`Word has generated and started downloading:${escapeHtml(filename)}`, 'success');
      } else {
        throw new Error("Word Generated, No downloadable files received, Redeployment, please webPortal V8.1.6");
      }
    } catch (error) {
      setMessage(error.message || "Failed to generate Word", 'error');
    } finally {
      if (button) { button.disabled = false; button.textContent = "Generate Word"; }
    }
  }

  function checkedValues(name) {
    return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(x => x.value);
  }


  function clearRequiredFieldErrors() {
    document.querySelectorAll('.hqtd-required-error').forEach(node => node.classList.remove('hqtd-required-error'));
    document.querySelectorAll('.hqtd-field-error-tip').forEach(node => node.remove());
  }

  function locateRequiredField(target, message) {
    if (!target) {
      setMessage(message || "Please complete the required entries.", 'error');
      return;
    }
    clearRequiredFieldErrors();
    const wrapper = target.closest('.hqtd-field, .hqtd-upload, .hqtd-choice-group') || target;
    wrapper.classList.add('hqtd-required-error');

    const tip = document.createElement('div');
    tip.className = 'hqtd-field-error-tip';
    tip.textContent = message || "This entry is required";
    wrapper.appendChild(tip);

    const scrollBox = document.querySelector('.hqtd-form-scroll');
    const panelBody = document.getElementById('hqtdPanelBody');
    const scroller = scrollBox && scrollBox.scrollHeight > scrollBox.clientHeight ? scrollBox : panelBody;
    if (scroller) {
      const top = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 90;
      scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    setTimeout(() => {
      try { target.focus({ preventScroll: true }); } catch (_) { try { target.focus(); } catch (_) {} }
      if (typeof target.reportValidity === 'function') target.reportValidity();
    }, 420);
    setMessage(message || "Please complete the required entries.", 'error');
  }

  function requireField(id, message) {
    const target = document.getElementById(id);
    const value = String(target?.value || '').trim();
    if (!value) {
      locateRequiredField(target, message);
      const error = new Error(message);
      error.hqtdLocated = true;
      throw error;
    }
    return value;
  }

  function requireUploadedWord(message) {
    const target = document.getElementById('hqtdWordFile');
    const file = target?.files?.[0];
    if (!file) {
      locateRequiredField(target, message);
      const error = new Error(message);
      error.hqtdLocated = true;
      throw error;
    }
    return file;
  }

  function collectProjectForm() {
    const files = [...(document.getElementById('hqtdFiles')?.files || [])];
    const fillMethod = document.getElementById('hqtdPanelBody')?.dataset.fillMode || 'online';
    const wordFile = document.getElementById('hqtdWordFile')?.files?.[0];
    if (fillMethod === 'word') {
      const requiredWordFile = wordFile || requireUploadedWord("Please upload completed Word templates");
      files.push(requiredWordFile);
      return { ...project, qty: 1, note: `Item number:${normalizedProjectCode(project.id, project.serviceType)}
Client submits using completed Word template`, details: { projectId: normalizedProjectCode(project.id, project.serviceType), fillMethod: 'word' }, files, fillMethod, cartKey: `${project.id}-${Date.now()}` };
    }
    let note = '';
    const details = { projectId: normalizedProjectCode(project.id, project.serviceType), projectName: value('hqtdProjectName') || project.title };
    if (project.serviceType === "AI Projects") {
      const need = requireField('hqtdNeed', "Please fill in your project objectives.");
      Object.assign(details, { dataStatus: value('hqtdDataStatus'), dataScale: value('hqtdDataScale'), aiTasks: checkedValues('hqtdAiTasks'), deliverables: value('hqtdDeliverables'), customNeed: need });
      note = `Item number:${normalizedProjectCode(project.id, project.serviceType)}
Project objectives:${need}
Available data:${details.dataStatus}
Function:${details.aiTasks.join('、') || "Please evaluate."}
Delivery:${details.deliverables || "Pending Confirmation"}`;
    } else if (project.serviceType === "Computational Simulation") {
      const system = requireField('hqtdSystem', "Please fill in the research object or system");
      const need = requireField('hqtdNeed', "Please fill in the calculation requirements.");
      Object.assign(details, { system, calculationNeed: need, calculationTasks: checkedValues('hqtdCalcTasks'), method: value('hqtdMethod'), parameters: value('hqtdParameters'), deliverables: value('hqtdDeliverables') });
      note = `Item number:${normalizedProjectCode(project.id, project.serviceType)}
Research systems:${system}
Calculated content:${details.calculationTasks.join('、') || "Please evaluate."}
Specific needs:${need}
Methodological parameters:${[details.method, details.parameters].filter(Boolean).join('；') || "To Be Assessed"}`;
    } else {
      const count = Math.max(1, Number(value('hqtdSampleCount') || 1));
      const need = requireField('hqtdNeed', "Please fill in the test parameters or specific analysis requirements");
      Object.assign(details, { sampleCount: count, sampleCodes: value('hqtdSampleCodes') || Array.from({length:Math.min(count,100)},(_,i)=>i+1).join(','), sampleState: value('hqtdSampleState'), composition: value('hqtdComposition'), hazards: checkedValues('hqtdHazards'), temperature: value('hqtdTemperature'), atmosphere: value('hqtdAtmosphere'), dataAnalysis: document.querySelector('input[name="hqtdAnalysisService"]:checked')?.value || "Please evaluate.", testNeed: need, experimentNote: value('hqtdExperimentNote') });
      note = `Item number:${normalizedProjectCode(project.id, project.serviceType)}
Number of samples:${count}
Sample number:${details.sampleCodes}
Sample status:${details.sampleState}
Component:${details.composition || "Not specified"}
Hazard:${details.hazards.join('、') || "No Selection"}
Test requirements:${need}`;
    }
    const profileData = {}; document.querySelectorAll('[data-profile-field]').forEach(node => { const key=node.dataset.profileField; const val=String(node.value||'').trim(); if(key && val) profileData[key]=val; }); details.projectSpecific = profileData; if(Object.keys(profileData).length) note += `
Project-specific parameters:${Object.entries(profileData).map(([k,v])=>`${k}=${v}`).join('；')}`;
    return { ...project, title: details.projectName || project.title, fillMethod, qty: project.serviceType === "Material Characterization" ? Number(details.sampleCount || 1) : 1, note, details, files, cartKey: `${project.id}-${Date.now()}` };
  }


  document.addEventListener('input', event => {
    const wrapper = event.target.closest?.('.hqtd-required-error');
    if (wrapper && String(event.target.value || '').trim()) {
      wrapper.classList.remove('hqtd-required-error');
      wrapper.querySelector('.hqtd-field-error-tip')?.remove();
    }
  });
  document.addEventListener('change', event => {
    const wrapper = event.target.closest?.('.hqtd-required-error');
    if (wrapper && (event.target.files?.length || String(event.target.value || '').trim())) {
      wrapper.classList.remove('hqtd-required-error');
      wrapper.querySelector('.hqtd-field-error-tip')?.remove();
    }
  });

  function saveProjectForm(submitNow) {
    try {
      const item = collectProjectForm();
      if (submitNow) return openCheckout([item], item.files);
      const rows = readCart();
      rows.push({ ...item, files: [] });
      writeCart(rows);
      closePanel();
      showToast("The list of needs has been added and other items can continue to be selected");
    } catch (error) {
      if (!error.hqtdLocated) setMessage(error.message, 'error');
    }
  }

  function openCart() {
    state.mode = 'cart';
    document.getElementById('hqtdPanelKicker').textContent = "Request List";
    document.getElementById('hqtdPanelTitle').textContent = "Selected items";
    renderCartPanel();
    openPanel();
  }

  function renderCartPanel() {
    const rows = readCart();
    const body = document.getElementById('hqtdPanelBody');
    if (!rows.length) {
      body.innerHTML = "<div class=\"hqtd-empty-cart\"><strong>The list of needs is empty</strong><span>Returns the item page, select the number or fill in a simple requirement to join.</span></div>";
      return;
    }
    body.innerHTML = `
      <div class="hqtd-cart-list">${rows.map((item, index) => `
        <article class="hqtd-cart-row" data-cart-index="${index}">
          <div><small>${escapeHtml(item.id || item.serviceType)}</small><strong>${escapeHtml(item.title || item.name)}</strong><span>${escapeHtml(summaryForItem(item))}</span></div>
          <div class="hqtd-cart-row-actions">${item.serviceType === "Supplies & Instruments" ? `<input type="number" min="1" max="999" value="${Number(item.qty || 1)}" data-cart-qty>` : `<b>× ${Number(item.qty || 1)}</b>`}<button type="button" data-cart-remove>Delete</button></div>
        </article>`).join('')}</div>
      <div class="hqtd-cart-summary">Total ${rows.length} Plantation . ${rows.reduce((sum, item) => sum + Number(item.qty || 1), 0)} projects</div>
      <div class="hqtd-panel-actions"><button type="button" class="secondary" data-clear-cart>Clear</button><button type="button" class="primary" data-cart-checkout>I'm going to submit it.</button></div>`;
    body.querySelectorAll('.hqtd-cart-row').forEach(row => {
      const index = Number(row.dataset.cartIndex);
      row.querySelector('[data-cart-remove]').addEventListener('click', () => { const next = readCart(); next.splice(index, 1); writeCart(next); renderCartPanel(); });
      row.querySelector('[data-cart-qty]')?.addEventListener('change', event => { const next = readCart(); if (next[index]) next[index].qty = Math.max(1, Math.min(999, Number(event.target.value || 1))); writeCart(next); renderCartPanel(); });
    });
    body.querySelector('[data-clear-cart]').addEventListener('click', () => { writeCart([]); renderCartPanel(); });
    body.querySelector('[data-cart-checkout]').addEventListener('click', () => openCheckout(readCart()));
  }

  function openCheckout(items, files = []) {
    state.checkoutItems = items;
    state.checkoutFiles = files;
    const contact = readContact();
    document.getElementById('hqtdPanelKicker').textContent = "Last step.";
    document.getElementById('hqtdPanelTitle').textContent = "_Other Organiser";
    const body = document.getElementById('hqtdPanelBody');
    body.innerHTML = `
      <div class="hqtd-checkout-summary"><strong>${items.length === 1 ? escapeHtml(items[0].title) : `Total ${items.length} kind items`}</strong><span>Once submitted, business numbers will be obtained, quotations and progress will be viewed at the client centre.</span></div>
      <div class="hqtd-form-grid contact-grid">
        <label class="hqtd-field"><span>Contact Name <em>*</em></span><input id="hqtdContactName" maxlength="80" value="${escapeHtml(contact.name || '')}"></label>
        <label class="hqtd-field"><span>Mobile Number <em>*</em></span><input id="hqtdPhone" inputmode="tel" maxlength="20" value="${escapeHtml(contact.phone || '')}"></label>
        <label class="hqtd-field full"><span>Unit/school (selection)</span><input id="hqtdOrganization" maxlength="150" value="${escapeHtml(contact.organization || '')}"></label>
        ${items.some(x => x.serviceType === "Supplies & Instruments") ? `<label class="hqtd-field full"><span>Specification or description of receipt (selection)</span><textarea id="hqtdCheckoutNote" maxlength="500" placeholder="Branding, specifications, time of receipt, etc.; The address can be added after confirmation of the offer."></textarea></label>` : ''}
      </div>
      ${files.length ? `<div class="hqtd-file-ready">Selected ${files.length} An attachment, automatically upload once an order is created.</div>` : ''}
      <div class="hqtd-login-note">There is no need to log in to an existing customer account; Once submitted using the same cell phone number, the order is automatically linked to the existing customer centre.</div>
      <div class="hqtd-panel-actions"><button type="button" class="secondary" data-checkout-back>Back</button><button type="button" class="primary" data-submit-order>Confirm the submission</button></div>
      <div class="hqtd-order-message" id="hqtdOrderMessage" aria-live="polite"></div>`;
    openPanel();
    body.querySelector('[data-checkout-back]').addEventListener('click', () => items.length > 1 ? openCart() : (project.serviceType === "Supplies & Instruments" ? closePanel() : openProjectForm('submit')));
    body.querySelector('[data-submit-order]').addEventListener('click', submitOrder);
  }

  async function submitOrder() {
    if (state.submitting) return;
    const name = value('hqtdContactName');
    const phone = value('hqtdPhone').replace(/\D/g, '');
    const organization = value('hqtdOrganization');
    if (!name) return setMessage("Please enter a contact name.", 'error');
    if (phone.length < 7) return setMessage("Please fill in a valid phone number.", 'error');
    const items = state.checkoutItems || [];
    if (!items.length) return setMessage("No projects to be submitted", 'error');
    const contact = { name, phone, organization };
    localStorage.setItem(CONTACT_KEY, JSON.stringify(contact));
    state.submitting = true;
    const button = document.querySelector('[data-submit-order]');
    if (button) { button.disabled = true; button.textContent = "Committing..."; }
    setMessage("Creating an order...");
    try {
      const overallNote = value('hqtdCheckoutNote');
      const payloadItems = items.map(item => ({
        id: item.id, title: item.title, name: item.title, board: item.serviceType, serviceType: item.serviceType,
        category: item.category || '', qty: Math.max(1, Number(item.qty || 1)), price: Math.max(0, Number(item.price || 0)), unit: item.unit || "projects",
        note: [item.note || '', overallNote || ''].filter(Boolean).join('\n'), details: item.details || {}, fillMethod: item.fillMethod || 'online'
      }));
      const description = items.map((item, i) => `${i + 1}. ${item.title} × ${Math.max(1, Number(item.qty || 1))}${item.note ? `\n${item.note}` : ''}`).join('\n\n');
      const result = await api('createOrder', {
        submissionMode: 'project_page_simple_checkout', name, contactName: name, phone, organization,
        serviceType: items.length === 1 ? items[0].serviceType : "Consolidated official network orders",
        projectName: items.length === 1 ? items[0].title : `Consolidated Orders (Performance)${items.length}(specified)`,
        description, details: description, items: payloadItems, cartItems: payloadItems,
        sourcePage: location.href, clientVersion: 'web-11.0.0-enterprise'
      });
      const recordId = result.order?.id || result.requirementId || result.id || '';
      const demandNo = result.businessNo || result.demandNo || result.order?.demandNo || "Submitted";
      const onlineItem = items.length === 1 && (items[0].fillMethod || 'online') === 'online' ? items[0] : null;
      if (onlineItem && ["AI Projects","Computational Simulation","Material Characterization"].includes(onlineItem.serviceType)) {
        const type = onlineItem.serviceType === "AI Projects" ? 'ai' : onlineItem.serviceType === "Computational Simulation" ? 'calculation' : 'analysis';
        api('generateRequirementDocuments', { type, demandNo: demandNo, form: { demandNo, projectName: onlineItem.title, name, phone, organization, description: onlineItem.note, ...(onlineItem.details || {}) } }).catch(() => {});
      }
      const files = state.checkoutFiles || [];
      setMessage(successHtml(demandNo, files.length ? `The order has been created.${files.length} An attachment is being uploaded backstage` : "Word Demand Sheet will be generated backstage; When PDF services are not available for the time being, this does not affect submission"), 'success', true);
      if (button) { button.disabled = false; button.textContent = "Successful submission"; }
      state.submitting = false;
      showToast(`Presented successfully:${demandNo}`);
      if (files.length) {
        Promise.resolve().then(() => uploadFiles(files, recordId, phone)).then(failures => {
          if (failures.length) showToast(`${failures.length} Annexes are not uploaded and can be added to client centres`);
          else showToast("Upload complete.");
        }).catch(() => showToast("The uploading of attachments is not complete and can be supplemented at the client centre"));
      }
      // 成功提交后只清除本次已提交清单，避免重复下单。
      const submittedKeys = new Set(items.map(item => item.cartKey).filter(Boolean));
      const remaining = readCart().filter(item => !submittedKeys.has(item.cartKey));
      writeCart(remaining);
      updateCartCount();
      setTimeout(closePanel, 1200);
    } catch (error) {
      setMessage(error.message || "Could not close temporary folder: %s", 'error');
    } finally {
      state.submitting = false;
      if (button) { button.disabled = false; button.textContent = "Confirm the submission"; }
    }
  }

  function successHtml(no, note) {
    const portal = new URL(portalRoot, document.baseURI).href;
    return `<div class="hqtd-submit-success"><b>Successful submission</b><strong>${escapeHtml(no)}</strong><span>${escapeHtml(note)}</span><a href="${portal}"'Enter client center to see status.'</a></div>`;
  }

  async function uploadFiles(files, requirementId, phone) {
    const list = files.slice(0, 5);
    const tasks = list.map(async file => {
      if (file.size > 5 * 1024 * 1024) return file.name;
      try {
        const url = new URL(API_URL);
        url.searchParams.set('action', 'uploadAttachment');
        url.searchParams.set('requirementId', requirementId);
        url.searchParams.set('contact', phone);
        const response = await fetch(url.href, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream', 'X-Filename': encodeURIComponent(file.name),
            'X-Mime-Type': file.type || 'application/octet-stream', 'X-File-Size': String(file.size),
            ...(localStorage.getItem(TOKEN_KEY) ? { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` } : {})
          },
          body: file
        });
        const rawResult = await response.json().catch(() => ({ ok: false, message: "Attachment upload failed" }));
    const result = window.HQTDEnglish.fromBackend(rawResult);
        if (!response.ok || result.ok === false) return file.name;
        return '';
      } catch (_) { return file.name; }
    });
    return (await Promise.all(tasks)).filter(Boolean);
  }

  async function api(action, data = {}) {
    data = window.HQTDEnglish.toCanonical(data);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const token = localStorage.getItem(TOKEN_KEY) || '';
      const response = await fetch(API_URL, {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ action, ...data })
      });
      const rawResult = await response.json().catch(() => ({ ok: false, message: "Interface returned an error in format" }));
    const result = window.HQTDEnglish.fromBackend(rawResult);
      if (!response.ok || result.ok === false) throw new Error(result.message || `Request Failed (${response.status}）`);
      return result;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error("Submit timeout. Check the network and try again.; Filled in not to be lost");
      throw error;
    } finally { clearTimeout(timer); }
  }

  async function loadProjectTemplateMap() {
    if (state.projectTemplateMap) return state.projectTemplateMap;
    const url = new URL('/en/customer-portal/assets/project-template-map.json?v=20260723-v1166', document.baseURI);
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error("Failed to load project template map");
    state.projectTemplateMap = await response.json();
    return state.projectTemplateMap;
  }

  async function exactTemplate(item) {
    const code = normalizedProjectCode(item.id, item.serviceType);
    const map = await loadProjectTemplateMap();
    const config = map[code];
    if (!config || !config.filename) {
      throw new Error(`Not found ${code} The corresponding dedicated Word template`);
    }
    const expectedName = String(config.projectName || '').trim();
    const actualName = String(item.title || item.name || '').trim();
    return {
      code,
      filename: config.filename,
      projectName: expectedName,
      titleMatched: !expectedName || !actualName || expectedName === actualName,
      url: new URL(`/en/customer-portal/templates/projects/${encodeURIComponent(config.filename)}`, document.baseURI).href
    };
  }

  function templateUrl(item) {
    return '#';
  }

  async function analysisTemplateUrl(item) {
    const template = await exactTemplate(item);
    return template.url;
  }

  function readCart() { try { const rows = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); return Array.isArray(rows) ? rows.slice(0, 30) : []; } catch (_) { return []; } }
  function writeCart(rows) { localStorage.setItem(CART_KEY, JSON.stringify(rows.slice(0, 30))); updateCartCount(); }
  function updateCartCount() { const count = readCart().length; document.querySelectorAll('[data-cart-count]').forEach(node => { node.textContent = String(count); }); }
  function readContact() { try { return JSON.parse(localStorage.getItem(CONTACT_KEY) || '{}'); } catch (_) { return {}; } }
  function summaryForItem(item) { return item.serviceType === "Supplies & Instruments" ? `${item.spec || "Specifications by Page"} · ${item.priceText || "Pending Confirmation"}` : (item.note || "Key requirements filled").replace(/\n/g, '；').slice(0, 100); }
  function openPanel() { const overlay = document.querySelector('.hqtd-order-overlay'); overlay.hidden = false; requestAnimationFrame(() => overlay.classList.add('open')); document.documentElement.classList.add('hqtd-order-open'); }
  function closePanel() { const overlay = document.querySelector('.hqtd-order-overlay'); overlay.classList.remove('open'); document.documentElement.classList.remove('hqtd-order-open'); setTimeout(() => { overlay.hidden = true; }, 180); }
  function setMessage(text, type = 'status', raw = false) { const box = document.getElementById('hqtdOrderMessage'); if (!box) return; box.innerHTML = raw ? text : `<div class="${type}">${escapeHtml(text)}</div>`; }
  function showToast(text) { const toast = document.querySelector('.hqtd-order-toast'); toast.textContent = text; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200); }
  function value(id) { return String(document.getElementById(id)?.value || '').trim(); }
  function formatNumber(value) { return Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 }); }
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
})();
