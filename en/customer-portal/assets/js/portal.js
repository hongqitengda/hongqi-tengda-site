(() => {
  'use strict';

  const cfg = window.HQTD_CONFIG || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const state = {
    registry: { templates: [] },
    projectTemplateMap: {},
    catalog: [],
    token: localStorage.getItem('hqtd_token') || '',
    profile: null,
    accounts: [],
    selectedProject: null,
    selectedTemplate: null,
    chooserType: '',
    business: null,
    initialView: 'home',
    pendingProject: null,
    submitting: false
  };

  const commonFieldKeys = new Set([
    'organization', 'contactName', 'phone', 'email', 'projectName',
    'expectedDate', 'budget', 'attachments', 'remarks'
  ]);

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function formatMoney(cents) {
    const number = Number(cents || 0) / 100;
    return `¥${number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function dateText(value) {
    if (!value) return '';
    if (typeof value === 'string') return value.replace('T', ' ').slice(0, 16);
    if (value.$date) return dateText(value.$date);
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('en-US', { hour12: false });
  }

  function message(element, text, type = 'status') {
    if (!element) return;
    element.innerHTML = text ? `<div class="${type}">${text}</div>` : '';
  }

  async function api(action, data = {}) {
    data = window.HQTDEnglish.toCanonical(data);
    if (!cfg.WEB_PORTAL_URL) throw new Error("The network business interface is not yet configured");
    const endpoint = `${cfg.WEB_PORTAL_URL}${cfg.WEB_PORTAL_URL.includes('?') ? '&' : '?'}_ts=${Date.now()}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(state.token ? { Authorization: `Bearer ${state.token}` } : {})
      },
      body: JSON.stringify({ action, ...data, requestNonce: `${Date.now()}-${Math.random().toString(36).slice(2,8)}` })
    });
    const rawResult = await response.json().catch(() => ({ ok: false, message: "Interface returned an error in format" }));
    const result = window.HQTDEnglish.fromBackend(rawResult);
    if (!response.ok || result.ok === false) {
      throw new Error(result.message || result.error || `Request Failed (${response.status}）`);
    }
    return result;
  }

  async function apiOptional(action, data = {}) {
    try {
      return await api(action, data);
    } catch (error) {
      return { ok: false, message: error.message, optionalError: true };
    }
  }

  function switchAuth(kind) {
    $$('[data-auth]').forEach(button => button.classList.toggle('active', button.dataset.auth === kind));
    ['login', 'register', 'wechat'].forEach(name => {
      const panel = $(`#${name}Panel`);
      if (panel) panel.classList.toggle('hidden', name !== kind);
    });
  }

  function showAuth() {
    $('#authView')?.classList.remove('hidden');
    $('#portalContent')?.classList.add('hidden');
    $('#logoutBtn')?.classList.add('hidden');
    $('#accountSwitchBtn')?.classList.add('hidden');
    updateAuthProjectHint();
  }

  async function showPortal() {
    $('#authView')?.classList.add('hidden');
    $('#portalContent')?.classList.remove('hidden');
    $('#logoutBtn')?.classList.remove('hidden');
    await loadInitialData();
    setView('home');
  }

  function viewGroup(view) {
    if (['business', 'files', 'afterSales', 'contracts', 'invoices', 'messages'].includes(view)) return 'business';
    if (['wallet', 'members', 'account'].includes(view)) return 'account';
    return view;
  }

  function setView(view) {
    if (view === 'submit' || view === 'cart') view = 'home';
    const section = $(`[data-section="${view}"]`);
    if (!section) view = 'home';
    $$('[data-section]').forEach(item => item.classList.toggle('hidden', item.dataset.section !== view));
    const group = viewGroup(view);
    $$('.app-tab').forEach(button => button.classList.toggle('active', button.dataset.view === group));
    location.hash = view;
    if (view === 'business') renderBusiness('all');
    if (view === 'files') renderFiles();
    if (view === 'afterSales') renderAfterSales();
    if (view === 'wallet') loadWallet();
    if (view === 'contracts') loadContracts();
    if (view === 'invoices') loadInvoices();
    if (view === 'messages') loadMessages();
    if (view === 'members') loadMembers();
    if (view === 'account') populateProfile();
    if (view === 'submit') {
      renderProjectSelection();
      window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
    }
  }

  async function loadRegistry() {
    const [registry, catalog, projectTemplateMap] = await Promise.all([
      fetch('/en/customer-portal/assets/form-templates.json').then(response => response.json()),
      fetch('/en/assets/data/catalog.json').then(response => response.json()),
      fetch('/en/customer-portal/assets/project-template-map.json?v=11.4.0').then(response => response.json())
    ]);
    state.registry = registry;
    state.catalog = Array.isArray(catalog) ? catalog : [];
    state.projectTemplateMap = projectTemplateMap || {};
    fixTemplatePaths();
  }

  function fixTemplatePaths() {
    const map = {
      'ai-general': 'templates/HQTD-AI-Project-Requirement-Form.docx',
      'calc-general': "templates/Simulation-Requirements-Dynamic.docx",
      'supplies-general': "templates/Supplies-and-Instruments-Request-Form.docx"
    };
    state.registry.templates.forEach(template => {
      if (map[template.key]) template.originalPath = map[template.key];
    });
  }

  function parseIncomingProject() {
    const params = new URLSearchParams(location.search);
    const projectId = (params.get('projectId') || '').toUpperCase();
    const projectName = (params.get('project') || '').trim();
    const serviceType = (params.get('serviceType') || '').trim();
    const found = state.catalog.find(item =>
      (projectId && String(item.id).toUpperCase() === projectId) ||
      (projectName && item.service === projectName)
    );
    if (found) {
      chooseProject(found, false);
      state.initialView = 'submit';
      return;
    }
    if (projectName || projectId) {
      const fallback = {
        id: projectId || '',
        service: projectName || projectId || "Customised Items",
        name: projectName || projectId || "Customised Items",
        board: serviceType || inferType(projectId, projectName),
        category: '', price: null, priceText: "To Be Assessed", cycle: "To Be Confirmed"
      };
      chooseProject(fallback, false);
      state.initialView = 'submit';
    } else if (serviceType) {
      state.chooserType = serviceType;
      state.initialView = 'submit';
    }
    const hash = location.hash.replace('#', '');
    if (hash && $(`[data-section="${hash}"]`)) state.initialView = hash;
  }

  function inferType(id = '', text = '') {
    const code = String(id).toUpperCase();
    if (code.startsWith('AI-')) return "AI Projects";
    if (code.startsWith('JS-')) return "Computational Simulation";
    if (code.startsWith('FX-')) return "Material Characterization";
    if (code.startsWith('HC-')) return "Supplies & Instruments";
    const source = String(text);
    if (/AI|Artificial Intelligence|Machine learning\.|Knowledge base|Smart/.test(source)) return "AI Projects";
    if (/Simulation|Simulation|DFT|Molecular Dynamics|Limited Dollar|CFD/.test(source)) return "Computational Simulation";
    if (/Characterization|Test|Spectra|Colours|Magnitude|XRD|XPS|SEM|TEM/.test(source)) return "Material Characterization";
    return "Supplies & Instruments";
  }

  function templateForProject(project) {
    const code = String(project?.id || project?.projectCode || '').toUpperCase().replace(/^([A-Z]+)(\d+)$/, '$1-$2');
    const exact = state.projectTemplateMap?.[code];
    if (exact) {
      return {
        key: code,
        projectCode: code,
        serviceType: project?.board || inferType(code, project?.service),
        title: `${code}-${exact.projectName}`,
        originalPath: exact.webPath,
        filename: exact.filename,
        exactProjectTemplate: true,
        fields: []
      };
    }
    if ((project?.board || inferType(code, project?.service)) === "Supplies & Instruments") {
      return state.registry.templates.find(item => item.key === 'supplies-general') || null;
    }
    return null;
  }

  function chooseProject(project, closeChooser = true) {
    state.selectedProject = project;
    state.selectedTemplate = templateForProject(project);
    state.chooserType = project.board || inferType(project.id, project.service);
    renderProjectSelection();
    renderQuickFields();
    renderAdvancedFields();
    restoreDraft();
    updateAuthProjectHint();
    if (closeChooser) $('#projectChooser')?.classList.add('hidden');
  }

  function updateAuthProjectHint() {
    if (!state.selectedProject) return;
    const title = $('.auth-copy h1');
    const paragraph = $('.auth-copy p');
    if (title) title.textContent = "Login to see order and project progress";
    if (paragraph) paragraph.innerHTML = `Selected:<strong>${escapeHtml(state.selectedProject.service)}</strong>. After login or registration, items are automatically brought in without re-searching.`;
  }

  function renderProjectSelection() {
    const card = $('#selectedProjectCard');
    const formArea = $('#orderFormArea');
    const orderBar = $('#orderBar');
    if (!card) return;
    if (!state.selectedProject) {
      card.classList.add('empty');
      card.innerHTML = `<div><small>Not Selected</small><strong>Select a specific item first</strong><span>A demand list corresponds to a project to facilitate rapid assessment and quotations.</span></div><button class="btn btn-outline" id="changeProjectBtn" type="button">Select a Project</button>`;
      $('#projectChooser')?.classList.remove('hidden');
      formArea?.classList.add('hidden');
      orderBar?.classList.add('hidden');
      bindChangeProject();
      renderProjectList();
      return;
    }
    const project = state.selectedProject;
    card.classList.remove('empty');
    card.innerHTML = `<div><small>${escapeHtml(project.id || project.board || "Selected")}</small><strong>${escapeHtml(project.service || project.name)}</strong><span>${escapeHtml([project.category, project.cycle, priceText(project)].filter(Boolean).join('｜'))}</span></div><button class="btn btn-outline" id="changeProjectBtn" type="button">Change Project</button>`;
    formArea?.classList.remove('hidden');
    orderBar?.classList.remove('hidden');
    $('#orderBarProject').textContent = project.service || project.name || "Current Project";
    $('#orderBarPrice').textContent = `${priceText(project)}| Finally based on the technical evaluation offer.`;
    bindChangeProject();
  }

  function bindChangeProject() {
    const button = $('#changeProjectBtn');
    if (!button) return;
    button.onclick = () => {
      $('#projectChooser')?.classList.remove('hidden');
      $('#projectSearch')?.focus();
      renderProjectList();
    };
  }

  function priceText(project) {
    if (!project) return "Price to be assessed";
    if (project.priceText) return project.priceText;
    if (project.price == null) return "Price to be assessed";
    return `References ¥${Number(project.price).toLocaleString('en-US')}/${project.unit || "projects"}`;
  }

  function renderProjectList() {
    const list = $('#projectList');
    if (!list) return;
    const query = ($('#projectSearch')?.value || '').trim().toLowerCase();
    const type = state.chooserType || state.selectedProject?.board || '';
    $$('#serviceTypeCards button').forEach(button => button.classList.toggle('active', button.dataset.serviceType === type));
    let rows = state.catalog.filter(item => !type || item.board === type);
    if (query) {
      rows = rows.filter(item => [item.id, item.service, item.category, item.details]
        .join(' ').toLowerCase().includes(query));
    } else {
      rows = rows.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
    }
    const visible = rows.slice(0, query ? 60 : 24);
    list.innerHTML = visible.length ? visible.map(item => `
      <button class="project-option" type="button" data-project-id="${escapeHtml(item.id)}">
        <span><b>${escapeHtml(item.id)}</b><small>${escapeHtml(item.category || item.board)}</small></span>
        <strong>${escapeHtml(item.service)}</strong>
        <p>${escapeHtml(item.details || '')}</p>
        <em>${escapeHtml(priceText(item))}｜${escapeHtml(item.cycle || "To Be Confirmed")}</em>
      </button>`).join('') : "<div class=\"empty-state\">No matching items found to shorten keywords and try again.</div>";
    if (rows.length > visible.length) {
      list.insertAdjacentHTML('beforeend', `<div class="project-list-note">Found  ${rows.length} entry, before current display ${visible.length} project. Enter the name or number of the item to quickly locate.</div>`);
    }
    $$('[data-project-id]', list).forEach(button => {
      button.onclick = () => {
        const project = state.catalog.find(item => item.id === button.dataset.projectId);
        if (project) chooseProject(project);
      };
    });
  }

  function quickSchema(type) {
    if (type === "AI Projects") return [
      { key: 'goal', label: "Main objectives", type: 'select', options: ["Projections/classifications", "Candidate Filter", "Process or formulation optimization", "Knowledge base/RAG", "Smart/automated", "Image or multimodular analysis", "Other"] },
      { key: 'dataStatus', label: "Available data", type: 'select', options: ["No data available, needing joint planning", "There's a little raw data.", "Table data already organized", "Multi-modular data with images/spectrums/text", "Existing models or codes need to be optimized"] },
      { key: 'deliverables', label: "Wanted to get", type: 'multi', options: ["Models and indicators", "Candidate results/recommended options", "Explanatory analysis", "Charts and reports", "Code and instructions for use", "Web page/software prototype"] }
    ];
    if (type === "Computational Simulation") return [
      { key: 'systemType', label: "Research system", type: 'select', options: ["Molecular/corporate", "Crystal/surface", "Interface/Sorption", "Membrane & Passage", "Fluid and reactor", "Structure and mechanics", "I'm not sure. Please evaluate."] },
      { key: 'inputFiles', label: "Existing file", type: 'select', options: ['CIF/POSCAR', 'PDB/MOL/XYZ', "Experimental structure or pictures", "Existing calculation input file", "Not yet."] },
      { key: 'deliverables', label: "Focused results", type: 'multi', options: ["Geometry Optimization", "Energy and Reaction Path", "Electronic structure/orbit", "Dynamics and diffusion", "Fluid/temperature/stress", "High-resolution scientific pictures", "Full technical report"] }
    ];
    if (type === "Material Characterization") return [
      { key: 'sampleCount', label: "Number of Samples", type: 'number', placeholder: "For example 3" },
      { key: 'sampleState', label: "Sample Condition", type: 'select', options: ["Powder", "Blocks/Scripts", "Film/painting", "Liquids/solves", "Biological samples", "Other"] },
      { key: 'hazard', label: "Security situation", type: 'select', options: ["No poison, no danger.", "Flammable/explosive", "Corrosiveness", "Toxic or biological risk", "It's volatile.", "I'm not sure. Please evaluate."] },
      { key: 'analysisNeed', label: "Data Analysis", type: 'select', options: ["Original data only", "Need basic analysis and mapping", "Need for in-depth analysis and reporting", "I'm not sure. Please recommend."] }
    ];
    return [
      { key: 'quantity', label: "Number of procurements", type: 'number', placeholder: "For example, 10" },
      { key: 'specification', label: "Specifications/models", type: 'text', placeholder: "I don't know if I can fill in \"Please help select\"" },
      { key: 'usage', label: "Use scene", type: 'select', options: ["Daily use of laboratories", "Material preparation", "Analytic testing", "Biological experiments", "Environmental sampling", "Device support", "Other"] }
    ];
  }

  function renderQuickFields() {
    const box = $('#quickFields');
    if (!box || !state.selectedProject) return;
    const type = state.selectedProject.board || inferType(state.selectedProject.id, state.selectedProject.service);
    box.innerHTML = quickSchema(type).map(field => {
      if (field.type === 'multi') {
        return `<fieldset class="quick-field quick-field-wide"><legend>${escapeHtml(field.label)}</legend><div class="option-grid">${field.options.map(option => `<label class="option-check"><input type="checkbox" data-quick-key="${escapeHtml(field.key)}" value="${escapeHtml(option)}"><span>${escapeHtml(option)}</span></label>`).join('')}</div></fieldset>`;
      }
      if (field.type === 'select') {
        return `<label class="quick-field"><span>${escapeHtml(field.label)}</span><select data-quick-key="${escapeHtml(field.key)}"><option value="">Please choose</option>${field.options.map(option => `<option>${escapeHtml(option)}</option>`).join('')}</select></label>`;
      }
      return `<label class="quick-field"><span>${escapeHtml(field.label)}</span><input data-quick-key="${escapeHtml(field.key)}" type="${field.type === 'number' ? 'number' : 'text'}" min="0" placeholder="${escapeHtml(field.placeholder || '')}"></label>`;
    }).join('');
    renderDescriptionTools(type);
    const description = $('#requestDescription');
    if (description) description.placeholder = descriptionPlaceholder(type);
    bindDraftAutosave();
  }

  function descriptionPlaceholder(type) {
    if (type === "AI Projects") return "For example, approximately 300 sets of experimental data are available for predicting material performance, screening key factors and delivering models, graphs and compoundable modern codes.";
    if (type === "Computational Simulation") return "For example:: I'd like to compare 3 The adsorption of materials to target molecules, Existing CIF Structure, Need adsorption, Electronic structure and high-resolution pictures.";
    if (type === "Material Characterization") return "For example: 3 powder samples that require confirmation of phase and crystal size; Samples are non-toxic and are expected to provide raw data, drawings and brief analyses.";
    return "For example: 50 tablets of a model filter need to be procured for water sample filtering; In the absence of a specific brand, please assist in the selection and quotation..";
  }

  function renderDescriptionTools(type) {
    let tools = $('#descriptionTools');
    if (!tools) {
      tools = document.createElement('div');
      tools.id = 'descriptionTools';
      tools.className = 'description-tools';
      $('.description-field')?.insertAdjacentElement('beforebegin', tools);
    }
    tools.innerHTML = `<span>I can't describe it.?</span><button type="button" data-description-preset="structured">Use filling hints</button><button type="button" data-description-preset="evaluate">Technical assessment requested</button><button type="button" data-description-preset="clear">Clear</button>`;
    $$('[data-description-preset]', tools).forEach(button => {
      button.onclick = () => {
        const textarea = $('#requestDescription');
        if (!textarea) return;
        if (button.dataset.descriptionPreset === 'clear') textarea.value = '';
        if (button.dataset.descriptionPreset === 'evaluate') {
          textarea.value = `I'm not sure about the specific parameters.. Please, by${state.selectedProject?.service || ''}“The project and my research objectives to assist in the assessment of appropriate programmes, information required, periodicity and quotations. 
Research objectives:
Samples/structures/data available:
Results to be achieved:`;
        }
        if (button.dataset.descriptionPreset === 'structured') textarea.value = structuredDescription(type);
        textarea.focus();
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      };
    });
  }

  function structuredDescription(type) {
    if (type === "AI Projects") return "Project background and objectives:\nAvailable data (type, quantity, format):\nIssues to be addressed:\nExpected delivery (model/report/code/system):\nOther requirements:";
    if (type === "Computational Simulation") return "Research systems and materials:\nPurpose of calculation:\nExisting structure or input file:\nParameters/charts desired:\nProgrammes that require comparison:\nOther requirements:";
    if (type === "Material Characterization") return "Sample name, quantity and status:\nMain components and safety:\nWhat you want to test:\nSpecial test conditions:\nWhether data analysis and mapping are required:\nOther requirements:";
    return "Product name:\nSpecifications/models:\nNumber:\nUse scene:\nBrand requirements, if any:\nTime of delivery and other requirements:";
  }

  function renderAdvancedFields() {
    const box = $('#advancedFields');
    if (!box) return;
    const template = state.selectedTemplate;
    if (!template) {
      box.innerHTML = "<div class=\"empty-state\">There is no professional template. Just fill in a description of the requirements..</div>";
      return;
    }
    const fields = (template.fields || []).filter(field => !commonFieldKeys.has(field.key));
    box.innerHTML = fields.map(field => renderAdvancedField(field)).join('') || "<div class=\"empty-state\">No additional professional fields required for this project.</div>";
  }

  function renderAdvancedField(field) {
    const hint = field.templateHint ? `<small>${escapeHtml(field.templateHint)}</small>` : '';
    if (field.type === 'textarea') return `<label class="field full"><span>${escapeHtml(field.label)}</span><textarea data-advanced-key="${escapeHtml(field.key)}" placeholder="${escapeHtml(field.placeholder || "Select Fill")}"></textarea>${hint}</label>`;
    if (field.type === 'select') return `<label class="field"><span>${escapeHtml(field.label)}</span><select data-advanced-key="${escapeHtml(field.key)}"><option value="">Please choose</option>${(field.options || []).map(option => `<option>${escapeHtml(option)}</option>`).join('')}</select>${hint}</label>`;
    if (field.type === 'multiselect') return `<fieldset class="field full advanced-checks"><legend>${escapeHtml(field.label)}</legend><div class="option-grid">${(field.options || []).map(option => `<label class="option-check"><input data-advanced-multi="${escapeHtml(field.key)}" type="checkbox" value="${escapeHtml(option)}"><span>${escapeHtml(option)}</span></label>`).join('')}</div>${hint}</fieldset>`;
    if (field.type === 'table') return `<label class="field full"><span>${escapeHtml(field.label)}</span><textarea data-advanced-key="${escapeHtml(field.key)}"placeholder="can be filled in by line, or upload the existing form/Word file directly"</textarea>${hint}</label>`;
    const inputType = ['date', 'email', 'tel', 'number'].includes(field.type) ? field.type : 'text';
    return `<label class="field"><span>${escapeHtml(field.label)}</span><input data-advanced-key="${escapeHtml(field.key)}" type="${inputType}" placeholder="${escapeHtml(field.placeholder || "Select Fill")}">${hint}</label>`;
  }

  function collectQuickFields() {
    const output = {};
    $$('#quickFields [data-quick-key]').forEach(element => {
      const key = element.dataset.quickKey;
      if (element.type === 'checkbox') {
        if (!output[key]) output[key] = [];
        if (element.checked) output[key].push(element.value);
      } else {
        output[key] = element.value.trim();
      }
    });
    return output;
  }

  function collectAdvancedFields() {
    const output = {};
    $$('#advancedFields [data-advanced-key]').forEach(element => {
      if (element.value.trim()) output[element.dataset.advancedKey] = element.value.trim();
    });
    $$('#advancedFields [data-advanced-multi]').forEach(element => {
      const key = element.dataset.advancedMulti;
      if (!output[key]) output[key] = [];
      if (element.checked) output[key].push(element.value);
    });
    return output;
  }

  function uploadEndpoint() {
    const base = String(cfg.WEB_PORTAL_URL || '').replace(/\/+$/, '');
    return `${base}?action=uploadAttachment`;
  }

  async function uploadOneFile(file) {
    if (file.size > 5 * 1024 * 1024) throw new Error(`${file.name} More than 5 MB, please compress and upload or add in small programs`);
    const response = await fetch(uploadEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Filename': encodeURIComponent(file.name),
        'X-Mime-Type': file.type || 'application/octet-stream',
        'X-File-Size': String(file.size),
        ...(state.token ? { Authorization: `Bearer ${state.token}` } : {})
      },
      body: file
    });
    const rawResult = await response.json().catch(() => ({ ok: false, message: "Attachment upload interface returned format error" }));
    const result = window.HQTDEnglish.fromBackend(rawResult);
    if (!response.ok || result.ok === false) throw new Error(result.message || `${file.name} Upload failed`);
    return result.file || result.data || result;
  }

  async function uploadFiles(files) {
    const list = [...files].slice(0, 10);
    const uploaded = [];
    for (const file of list) uploaded.push(await uploadOneFile(file));
    return uploaded;
  }

  async function submitRequirement(exportWord) {
    if (state.submitting) return;
    if (!state.selectedProject) return message($('#submitMessage'), "Please select a project first.", 'error');
    const description = $('#requestDescription')?.value.trim() || '';
    const contactName = $('#orderContactName')?.value.trim() || '';
    const phone = $('#orderPhone')?.value.trim() || '';
    const email = $('#orderEmail')?.value.trim() || '';
    if (!description) return message($('#submitMessage'), "Please fill in a description.; Click \"Please assess\" if you are not sure about parameters", 'error');
    if (!contactName) return message($('#submitMessage'), "Please enter a contact name.", 'error');
    if (!phone && !email) return message($('#submitMessage'), "Please provide a phone number or email address.", 'error');

    state.submitting = true;
    const buttons = [$('#submitRequirementBtn'), $('#submitAndWordBtn')].filter(Boolean);
    buttons.forEach(button => { button.disabled = true; });
    message($('#submitMessage'), exportWord ? "Submiting and generating Word request list, please wait..." : "Submitting request, please wait...");

    try {
      const attachments = await uploadFiles([...(($('#attachments') || {}).files || [])]);
      const project = state.selectedProject;
      const quickData = collectQuickFields();
      const advancedData = $('#advancedMode')?.checked ? collectAdvancedFields() : {};
      const contact = {
        name: contactName,
        organization: $('#orderOrganization')?.value.trim() || '',
        phone,
        email
      };
      const formData = {
        projectId: project.id || '',
        projectName: project.service || project.name || '',
        serviceType: project.board || inferType(project.id, project.service),
        category: project.category || '',
        description,
        quickOptions: quickData,
        advancedOptions: advancedData,
        contact,
        expectedDate: $('#orderExpectedDate')?.value || '',
        budget: $('#orderBudget')?.value.trim() || ''
      };
      const result = await api('createRequirement', {
        submissionMode: 'project_direct_order',
        serviceType: formData.serviceType,
        projectId: formData.projectId,
        projectCode: formData.projectId || state.selectedTemplate?.projectCode || '',
        projectName: formData.projectName,
        title: formData.projectName,
        templateKey: state.selectedTemplate?.key || '',
        templateName: state.selectedTemplate?.title || `${formData.serviceType}Table of requirements`,
        description,
        contact,
        expectedDate: formData.expectedDate,
        budget: formData.budget,
        formData,
        attachments
      });
      const businessNo = result.businessNo || result.demandNo || result.requirementNo || result.no || '';
      let downloadUrl = '';
      let exportMessage = '';
      if (exportWord && businessNo && state.selectedTemplate?.key) {
        const documentResult = await apiOptional('requestDocumentExport', {
          templateKey: state.selectedTemplate.key,
          businessNo,
          format: 'docx'
        });
        downloadUrl = documentResult.downloadUrl || documentResult.url || '';
        exportMessage = documentResult.message || '';
      }
      clearDraft();
      const numberText = businessNo ? `Operational designator:<strong>${escapeHtml(businessNo)}</strong>` : "Needs are written to client accounts";
      const download = downloadUrl ? `<a class="result-download" href="${escapeHtml(downloadUrl)}" target="_blank" rel="noopener"> Download Word Demand list</a>` : '';
      const note = exportWord && !downloadUrl ? `<small>${escapeHtml(exportMessage || "Word Export Job Created, but can be viewed later in business progress.")}</small>` : '';
      message($('#submitMessage'), `<div class="submit-success"><b>Successful submission</b><span>${numberText}</span>${download}${note}</div>`);
      if (downloadUrl) window.open(downloadUrl, '_blank', 'noopener');
      await Promise.all([loadDashboard(), loadBusinessData()]);
    } catch (error) {
      message($('#submitMessage'), escapeHtml(error.message), 'error');
    } finally {
      state.submitting = false;
      buttons.forEach(button => { button.disabled = false; });
    }
  }

  function draftKey() {
    return `hqtd_en_draft_${state.selectedProject?.id || state.selectedProject?.service || 'general'}`;
  }

  let draftTimer = 0;
  function bindDraftAutosave() {
    const area = $('#orderFormArea');
    if (!area || area.dataset.draftBound) return;
    area.dataset.draftBound = 'true';
    area.addEventListener('input', scheduleDraftSave);
    area.addEventListener('change', scheduleDraftSave);
  }

  function scheduleDraftSave() {
    clearTimeout(draftTimer);
    draftTimer = window.setTimeout(saveDraft, 350);
  }

  function saveDraft() {
    if (!state.selectedProject) return;
    const draft = {
      description: $('#requestDescription')?.value || '',
      contactName: $('#orderContactName')?.value || '',
      organization: $('#orderOrganization')?.value || '',
      phone: $('#orderPhone')?.value || '',
      email: $('#orderEmail')?.value || '',
      expectedDate: $('#orderExpectedDate')?.value || '',
      budget: $('#orderBudget')?.value || '',
      quick: collectQuickFields(),
      savedAt: Date.now()
    };
    localStorage.setItem(draftKey(), JSON.stringify(draft));
  }

  function restoreDraft() {
    let draft = null;
    try { draft = JSON.parse(localStorage.getItem(draftKey()) || 'null'); } catch (_) { draft = null; }
    if (!draft) return;
    const values = {
      requestDescription: draft.description,
      orderContactName: draft.contactName,
      orderOrganization: draft.organization,
      orderPhone: draft.phone,
      orderEmail: draft.email,
      orderExpectedDate: draft.expectedDate,
      orderBudget: draft.budget
    };
    Object.entries(values).forEach(([id, value]) => { if ($(`#${id}`) && value) $(`#${id}`).value = value; });
    Object.entries(draft.quick || {}).forEach(([key, value]) => {
      const elements = $$(`[data-quick-key="${CSS.escape(key)}"]`);
      elements.forEach(element => {
        if (element.type === 'checkbox') element.checked = Array.isArray(value) && value.includes(element.value);
        else element.value = value || '';
      });
    });
  }

  function clearDraft() {
    localStorage.removeItem(draftKey());
  }

  function profileFrom(result) {
    return result.profile || result.customer || result.data?.profile || result.data?.customer || null;
  }

  async function loadInitialData() {
    await Promise.all([loadDashboard(), loadBusinessData()]);
  }

  let dashboardRefreshTimer = setInterval(() => { if (!document.hidden && state.token) { Promise.all([loadDashboard(), loadBusinessData()]).catch(() => {}); } }, 8000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && state.token) { loadDashboard().catch(() => {}); loadBusinessData().catch(() => {}); } });

  async function loadDashboard() {
    const result = await apiOptional('dashboard');
    if (result.optionalError) {
      $('#homeAccountMeta').textContent = result.message || "Account information cannot be loaded at this time";
      return;
    }
    state.profile = profileFrom(result) || state.profile;
    state.accounts = result.accounts || result.data?.accounts || [];
    const account = result.account || result.currentAccount || result.data?.account || {};
    const summary = result.summary || result.metrics || result.data?.summary || {};
    const counts = result.counts || result.data?.counts || {};
    $('#homeAccountName').textContent = account.name || account.accountName || state.profile?.organization || state.profile?.name || "Current client account";
    $('#homeAccountMeta').textContent = [
      state.profile?.name,
      state.profile?.customerNo ? `Client number ${state.profile.customerNo}` : '',
      account.accountNo ? `Account number ${account.accountNo}` : '',
      summary.balanceCents != null ? `Available Balance ${formatMoney(summary.balanceCents)}` : ''
    ].filter(Boolean).join('｜') || "The official network shares the same client account with a small program.";
    $('#metricQuotes').textContent = counts.quotes ?? summary.pendingQuotes ?? summary.quotes ?? result.quotes?.length ?? 0;
    $('#metricProjects').textContent = counts.projects ?? summary.activeProjects ?? summary.projects ?? result.projects?.length ?? 0;
    $('#metricDeliveries').textContent = counts.deliveries ?? summary.pendingDeliveries ?? summary.deliveries ?? result.deliveries?.length ?? 0;
    $('#metricAfterSales').textContent = counts.afterSales ?? summary.activeAfterSales ?? summary.afterSales ?? result.afterSales?.length ?? 0;
    $('#accountSwitchBtn')?.classList.toggle('hidden', state.accounts.length < 2);
    const refreshedAt = result.refreshedAt || result.data?.refreshedAt || new Date().toISOString();
    const meta = $('#homeAccountMeta');
    if (meta) {
      meta.dataset.refreshedAt = refreshedAt;
      const syncText = `Last synced ${dateText(refreshedAt).slice(11,16)}`;
      if (!meta.textContent.includes("Last synced")) meta.textContent = `${meta.textContent}｜${syncText}`;
    }
    renderAccountList();
    populateProfile();
  }

  async function loadProfile() {
    const result = await apiOptional('profile');
    if (!result.optionalError) state.profile = profileFrom(result) || result.data || state.profile;
    populateProfile();
  }

  function populateProfile() {
    if (!state.profile) return;
    const map = {
      profileName: state.profile.name,
      profileOrganization: state.profile.organization,
      profilePhone: state.profile.phone,
      profileEmail: state.profile.email,
      orderContactName: state.profile.name,
      orderOrganization: state.profile.organization,
      orderPhone: state.profile.phone,
      orderEmail: state.profile.email
    };
    Object.entries(map).forEach(([id, value]) => {
      const element = $(`#${id}`);
      if (element && value && !element.value) element.value = value;
    });
  }

  async function loadBusinessData() {
    const result = await apiOptional('listBusiness');
    if (result.optionalError) {
      state.business = { error: result.message, requirements: [], orders: [], quotes: [], projects: [], deliveries: [], afterSales: [] };
    } else {
      state.business = result.data || result;
    }
    renderRecentBusiness();
  }

  function allBusinessRows() {
    const data = state.business || {};
    const groups = [
      ['quote', data.quotes], ['project', data.projects], ['order', data.orders],
      ['requirement', data.requirements], ['delivery', data.deliveries], ['afterSale', data.afterSales || data.after_sales]
    ];
    return groups.flatMap(([type, rows]) => (Array.isArray(rows) ? rows : []).map(row => ({ ...row, _type: type })));
  }

  function recordTitle(record) {
    return record.projectName || record.title || record.serviceName || record.name || record.templateName || "Business records";
  }

  function recordNo(record) {
    return record.quoteNo || record.projectNo || record.orderNo || record.businessNo || record.demandNo || record.requirementNo || record.no || record._id || '';
  }

  function recordStatus(record) {
    return record.statusText || record.statusName || record.status || "Processing";
  }

  function renderRecord(record, options = {}) {
    const amount = record.amountCents != null ? formatMoney(record.amountCents) : (record.amount ? `¥${Number(record.amount).toLocaleString('en-US')}` : '');
    const files = []
      .concat(Array.isArray(record.attachments) ? record.attachments : [])
      .concat(Array.isArray(record.files) ? record.files : [])
      .concat(record.deliveryFiles && Array.isArray(record.deliveryFiles) ? record.deliveryFiles : []);
    const actions = [];
    const directUrl = record.downloadUrl || record.fileUrl || record.url || record.documentUrl || '';
    if (directUrl) actions.push(`<a href="${escapeHtml(directUrl)}" target="_blank" rel="noopener"> Download File</a>`);
    files.forEach((file, index) => {
      const url = file.tempURL || file.downloadUrl || file.url || '';
      if (url) actions.push(`<a href="${escapeHtml(url)}" target="_blank" rel="noopener"> Download:${escapeHtml(file.name || file.filename || `Files${index + 1}`)}</a>`);
      else if (file.fileID) actions.push(`<button type="button" data-download-file="${escapeHtml(file.fileID)}" data-file-name="${escapeHtml(file.name || file.filename || "Project documents")}♪ Download: ♪${escapeHtml(file.name || file.filename || `Files${index + 1}`)}</button>`);
    });
    const businessId = record._id || record.id || '';
    const businessType = record._type || record.kind || '';
    if (businessId) actions.push(`<label class="record-upload-label">Upload Additional Files<input type="file" hidden data-business-upload="${escapeHtml(businessId)}" data-business-type="${escapeHtml(businessType)}"></label>`);
    if (record._type === 'quote' && /Pending|pending|confirm/i.test(recordStatus(record))) {
      actions.push(`<button type="button" data-confirm-quote="${escapeHtml(record._id || record.id || recordNo(record))}"'"to confirm the offer.</button>`);
      actions.push(`<button type="button" data-change-quote="${escapeHtml(record._id || record.id || recordNo(record))}"and apply for a change of price.</button>`);
    }
    return `<article class="record-card" data-record-type="${escapeHtml(record._type || '')}">
      <div class="record-main"><span class="record-type">${escapeHtml(typeLabel(record._type))}</span><h3>${escapeHtml(recordTitle(record))}</h3><p>${escapeHtml(recordNo(record))}</p></div>
      <div class="record-meta"><b>${escapeHtml(recordStatus(record))}</b>${amount ? `<span>${escapeHtml(amount)}</span>` : ''}<small>${escapeHtml(dateText(record.updatedAtText || record.updatedAt || record.createdAtText || record.createdAt))}</small></div>
      ${actions.length ? `<div class="record-actions">${actions.join('')}</div>` : ''}
    </article>`;
  }

  function typeLabel(type) {
    return ({ quote: "Quotes", project: "Project", order: "Orders", requirement: "Requirements", delivery: "Delivery", afterSale: "After sale." })[type] || "Operations";
  }

  function renderRecentBusiness() {
    const box = $('#recentBusiness');
    if (!box) return;
    const rows = allBusinessRows().sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)).slice(0, 5);
    box.innerHTML = rows.length ? rows.map(row => renderRecord(row)).join('') : `<div class="empty-state">Business records not available. The first requirement can be submitted after the selection of a specific item.</div>`;
    bindRecordActions(box);
  }

  function renderBusiness(filter = 'all') {
    const box = $('#businessList');
    if (!box) return;
    const map = { quotes: 'quote', projects: 'project', deliveries: 'delivery', afterSales: 'afterSale' };
    const type = map[filter];
    const rows = allBusinessRows().filter(row => !type || row._type === type);
    box.innerHTML = rows.length ? rows.map(row => renderRecord(row)).join('') : `<div class="empty-state">No relevant records available</div>`;
    $$('#businessTabs button').forEach(button => button.classList.toggle('active', button.dataset.filter === filter));
    bindRecordActions(box);
  }

  function bindRecordActions(root) {
    $$('[data-download-file]', root).forEach(button => button.onclick = async () => {
      button.disabled = true;
      try {
        const result = await api('getBusinessFileUrl', { fileID: button.dataset.downloadFile, filename: button.dataset.fileName });
        const url = result.downloadUrl || result.url || result.tempFileURL;
        if (!url) throw new Error("Could not generate download address for now");
        window.open(url, '_blank', 'noopener');
      } catch (error) { alert(error.message); }
      finally { button.disabled = false; }
    });
    $$('[data-business-upload]', root).forEach(input => input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const label = input.closest('.record-upload-label');
      const original = label?.childNodes?.[0]?.textContent || "Upload Additional Files";
      if (label) label.childNodes[0].textContent = "Uploading...";
      try {
        if (file.size > 10 * 1024 * 1024) throw new Error("One file cannot exceed 10 MB");
        const base = String(cfg.WEB_PORTAL_URL || '').replace(/\/+$/, '');
        const response = await fetch(`${base}?action=uploadBusinessFile&businessId=${encodeURIComponent(input.dataset.businessUpload)}&businessType=${encodeURIComponent(input.dataset.businessType)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'X-Filename': encodeURIComponent(file.name),
            'X-Mime-Type': file.type || 'application/octet-stream',
            'X-File-Size': String(file.size),
            Authorization: `Bearer ${state.token}`
          },
          body: file
        });
        const result = await response.json();
        if (!response.ok || result.ok === false) throw new Error(result.message || "Upload failed");
        await loadBusinessData();
        renderBusiness('all');
      } catch (error) { alert(error.message); }
      finally {
        input.value = '';
        if (label) label.childNodes[0].textContent = original;
      }
    });
    $$('[data-confirm-quote]', root).forEach(button => button.onclick = async () => {
      button.disabled = true;
      try {
        await api('confirmQuote', { quoteId: button.dataset.confirmQuote, id: button.dataset.confirmQuote });
        await loadBusinessData();
        renderBusiness('quotes');
      } catch (error) {
        alert(error.message);
      } finally { button.disabled = false; }
    });
    $$('[data-change-quote]', root).forEach(button => button.onclick = async () => {
      const reason = prompt("Please outline the price or the reasons for the adjustment:");
      if (!reason) return;
      button.disabled = true;
      try {
        await api('requestQuoteChange', { quoteId: button.dataset.changeQuote, id: button.dataset.changeQuote, reason });
        await loadBusinessData();
        renderBusiness('quotes');
      } catch (error) {
        alert(error.message);
      } finally { button.disabled = false; }
    });
  }

  function renderFiles() {
    const box = $('#filesList');
    if (!box) return;
    const rows = (state.business?.deliveries || []).map(row => ({ ...row, _type: 'delivery' }));
    box.innerHTML = rows.length ? rows.map(row => renderRecord(row)).join('') : "<div class=\"empty-state\">No deliverables available</div>";
  }

  function renderAfterSales() {
    const box = $('#afterSalesList');
    if (!box) return;
    const rows = (state.business?.afterSales || state.business?.after_sales || []).map(row => ({ ...row, _type: 'afterSale' }));
    box.innerHTML = rows.length ? rows.map(row => renderRecord(row)).join('') : "<div class=\"empty-state\">No support requests</div>";
  }

  async function loadWallet() {
    const result = await apiOptional('wallet');
    if (result.optionalError) {
      $('#walletTransactions').innerHTML = `<div class="empty-state">${escapeHtml(result.message)}</div>`;
      return;
    }
    const data = result.data || result;
    $('#walletBalance').textContent = formatMoney(data.availableBalanceCents || data.balanceCents || 0);
    $('#walletTotals').textContent = `Cumulative full value ${formatMoney(data.totalRechargeCents)}| Cumulative consumption ${formatMoney(data.totalSpentCents)}| Cumulative refunds ${formatMoney(data.totalRefundCents)}`;
    const rows = data.transactions || [];
    $('#walletTransactions').innerHTML = rows.length ? rows.map(row => `<article class="record-card"><div class="record-main"><span class="record-type">It's flowing.</span><h3>${escapeHtml(row.title || row.typeText || row.type || "Changes in accounts")}</h3><p>${escapeHtml(row.remark || row.businessNo || '')}</p></div><div class="record-meta"><b>${escapeHtml(row.amountCents >= 0 ? `+${formatMoney(row.amountCents)}` : `-${formatMoney(Math.abs(row.amountCents))}`)}</b><small>${escapeHtml(dateText(row.createdAtText || row.createdAt))}</small></div></article>`).join('') : "<div class=\"empty-state\">No transactions</div>";
  }

  async function loadContracts() {
    const rows = state.business?.contracts || (await apiOptional('listContracts')).contracts || [];
    $('#contractsList').innerHTML = rows.length ? rows.map(row => renderRecord({ ...row, _type: 'contract' })).join('') : "<div class=\"empty-state\">No contracts</div>";
  }

  async function loadInvoices() {
    const result = await apiOptional('listInvoices');
    const rows = result.invoices || state.business?.invoices || [];
    $('#invoicesList').innerHTML = rows.length ? rows.map(row => renderRecord({ ...row, _type: 'invoice' })).join('') : "<div class=\"empty-state\">No invoices</div>";
  }

  async function loadMessages() {
    const result = await apiOptional('listNotifications');
    const rows = result.notifications || result.messages || state.business?.notifications || [];
    $('#messagesList').innerHTML = rows.length ? rows.map(row => `<article class="record-card"><div class="record-main"><span class="record-type">Message</span><h3>${escapeHtml(row.title || "Business announcements")}</h3><p>${escapeHtml(row.content || row.message || '')}</p></div><div class="record-meta"><small>${escapeHtml(dateText(row.createdAtText || row.createdAt))}</small></div></article>`).join('') : "<div class=\"empty-state\">No messages</div>";
  }

  async function loadMembers() {
    const result = await apiOptional('listAccountMembers');
    const rows = result.members || state.business?.members || [];
    $('#membersList').innerHTML = rows.length ? rows.map(row => `<article class="record-card"><div class="record-main"><span class="record-type">${escapeHtml(row.roleName || row.role || "Members")}</span><h3>${escapeHtml(row.name || row.displayName || "Account Members")}</h3><p>${escapeHtml(row.phone || row.email || '')}</p></div></article>`).join('') : "<div class=\"empty-state\">No account members</div>";
  }

  function renderAccountList() {
    const list = $('#accountList');
    if (!list) return;
    list.innerHTML = state.accounts.length ? state.accounts.map(account => `<button type="button" class="account-option" data-account-id="${escapeHtml(account.accountId || account._id || account.id)}"><strong>${escapeHtml(account.name || account.accountName || "Client accounts")}</strong><small>${escapeHtml(account.accountNo || account.organization || '')}</small></button>`).join('') : "<div class=\"empty-state\">There is currently only one client account</div>";
    $$('[data-account-id]', list).forEach(button => button.onclick = async () => {
      try {
        const result = await api('switchAccount', { accountId: button.dataset.accountId });
        if (result.token) {
          state.token = result.token;
          localStorage.setItem('hqtd_token', state.token);
        }
        $('#accountModal').classList.add('hidden');
        await loadInitialData();
      } catch (error) { alert(error.message); }
    });
  }

  function bindEvents() {
    $$('[data-auth]').forEach(button => button.onclick = () => switchAuth(button.dataset.auth));
    $$('.app-tab').forEach(button => button.onclick = () => setView(button.dataset.view));
    $$('[data-view-target]').forEach(button => button.onclick = () => setView(button.dataset.viewTarget));
    $$('[data-business-filter]').forEach(button => button.onclick = () => { setView('business'); renderBusiness(button.dataset.businessFilter); });
    $$('[data-open-filter]').forEach(button => button.onclick = () => { setView('business'); renderBusiness(button.dataset.openFilter); });
    $$('#businessTabs button').forEach(button => button.onclick = () => renderBusiness(button.dataset.filter));
    $$('#serviceTypeCards button').forEach(button => button.onclick = () => {
      state.chooserType = button.dataset.serviceType;
      renderProjectList();
    });
    $('#projectSearch')?.addEventListener('input', renderProjectList);
    $('#advancedMode')?.addEventListener('change', event => $('#advancedFields')?.classList.toggle('hidden', !event.target.checked));
    $('#advancedDetails')?.addEventListener('toggle', () => {
      const label = $('#advancedDetails summary b');
      if (label) label.textContent = $('#advancedDetails').open ? "Put it away." : "Expand";
    });
    $('#downloadTemplateBtn').onclick = () => {
      const path = state.selectedTemplate?.originalPath;
      if (!path) return message($('#submitMessage'), "There is no single Word template for this item, just fill it in online.", 'warning');
      location.href = encodeURI(path);
    };
    $('#submitRequirementBtn').onclick = () => submitRequirement(false);
    $('#submitAndWordBtn').onclick = () => submitRequirement(true);

    $('#loginSubmit').onclick = async () => {
      try {
        message($('#authMessage'), "Logging...");
        const result = await api('login', { identity: $('#loginIdentity').value.trim(), password: $('#loginPassword').value });
        state.token = result.token;
        localStorage.setItem('hqtd_token', state.token);
        message($('#authMessage'), "Login successful");
        await showPortal();
      } catch (error) { message($('#authMessage'), escapeHtml(error.message), 'error'); }
    };
    $('#registerSubmit').onclick = async () => {
      try {
        message($('#authMessage'), "Creating Account...");
        const result = await api('register', {
          name: $('#regName').value.trim(), organization: $('#regOrganization').value.trim(),
          phone: $('#regPhone').value.trim(), email: $('#regEmail').value.trim(), password: $('#regPassword').value
        });
        state.token = result.token;
        localStorage.setItem('hqtd_token', state.token);
        message($('#authMessage'), "Registered successfully");
        await showPortal();
      } catch (error) { message($('#authMessage'), escapeHtml(error.message), 'error'); }
    };
    $('#wechatLoginBtn').onclick = async () => {
      try {
        const result = await api('wechatLoginStart', { callbackUrl: cfg.WECHAT_CALLBACK_URL });
        if (!result.authorizeUrl) throw new Error(result.message || "MicroScan Login is not configured");
        location.href = result.authorizeUrl;
      } catch (error) { message($('#authMessage'), escapeHtml(error.message), 'warning'); }
    };
    $('#logoutBtn').onclick = () => {
      localStorage.removeItem('hqtd_token');
      state.token = '';
      state.profile = null;
      showAuth();
    };
    $('#accountSwitchBtn').onclick = () => $('#accountModal').classList.remove('hidden');
    $$('[data-close-account-modal]').forEach(element => element.onclick = () => $('#accountModal').classList.add('hidden'));

    $('#saveProfileBtn').onclick = async () => {
      try {
        await api('updateProfile', {
          name: $('#profileName').value.trim(), organization: $('#profileOrganization').value.trim(),
          phone: $('#profilePhone').value.trim(), email: $('#profileEmail').value.trim()
        });
        message($('#profileMessage'), "Information is saved and will be synchronized with applet accounts");
        await loadProfile();
      } catch (error) { message($('#profileMessage'), escapeHtml(error.message), 'error'); }
    };
    $('#createAfterSaleBtn').onclick = async () => {
      const description = $('#afterSaleDescription').value.trim();
      if (!description) return message($('#afterSaleMessage'), "Please complete the question note.", 'error');
      try {
        await api('createAfterSale', {
          businessNo: $('#afterSaleBusinessNo').value.trim(), type: $('#afterSaleType').value, description
        });
        message($('#afterSaleMessage'), "After the sale, the application was submitted.");
        $('#afterSaleDescription').value = '';
        await loadBusinessData();
        renderAfterSales();
      } catch (error) { message($('#afterSaleMessage'), escapeHtml(error.message), 'error'); }
    };
    $('#createInvoiceBtn').onclick = async () => {
      try {
        await api('createInvoiceRequest', {
          title: $('#invoiceTitle').value.trim(), taxNo: $('#invoiceTaxNo').value.trim(),
          businessNo: $('#invoiceBusinessNo').value.trim(), amount: $('#invoiceAmount').value.trim()
        });
        message($('#invoiceMessage'), "Invoice applications submitted");
        await loadInvoices();
      } catch (error) { message($('#invoiceMessage'), escapeHtml(error.message), 'error'); }
    };
  }

  async function init() {
    await loadRegistry();
    parseIncomingProject();
    bindEvents();
    renderProjectList();
    if (state.token) await showPortal();
    else showAuth();
  }

  init().catch(error => message($('#authMessage'), escapeHtml(error.message), 'error'));

window.addEventListener('focus', () => {
  try {
    if (state && state.token) {
      loadDashboard().catch(() => {});
      loadBusinessData().catch(() => {});
    }
  } catch (_) {}
});

window.addEventListener('pageshow', () => {
  if (state && state.token) Promise.all([loadDashboard(), loadBusinessData()]).catch(() => {});
});
})();
