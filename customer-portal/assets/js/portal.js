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
    return `¥${number.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function dateText(value) {
    if (!value) return '';
    if (typeof value === 'string') return value.replace('T', ' ').slice(0, 16);
    if (value.$date) return dateText(value.$date);
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('zh-CN', { hour12: false });
  }

  function message(element, text, type = 'status') {
    if (!element) return;
    element.innerHTML = text ? `<div class="${type}">${text}</div>` : '';
  }

  async function api(action, data = {}) {
    if (!cfg.WEB_PORTAL_URL) throw new Error('官网业务接口尚未配置');
    const response = await fetch(cfg.WEB_PORTAL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(state.token ? { Authorization: `Bearer ${state.token}` } : {})
      },
      body: JSON.stringify({ action, ...data })
    });
    const result = await response.json().catch(() => ({ ok: false, message: '接口返回格式错误' }));
    if (!response.ok || result.ok === false) {
      throw new Error(result.message || result.error || `请求失败（${response.status}）`);
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
      fetch('assets/form-templates.json').then(response => response.json()),
      fetch('../assets/data/catalog.json').then(response => response.json()),
      fetch('assets/project-template-map.json?v=11.4.0').then(response => response.json())
    ]);
    state.registry = registry;
    state.catalog = Array.isArray(catalog) ? catalog : [];
    state.projectTemplateMap = projectTemplateMap || {};
    fixTemplatePaths();
  }

  function fixTemplatePaths() {
    const map = {
      'ai-general': 'templates/HQTD-AI-Project-Requirement-Form.docx',
      'calc-general': 'templates/模拟计算需求单-动态参考模板.docx',
      'supplies-general': 'templates/耗材仪器采购需求表.docx'
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
        service: projectName || projectId || '自定义项目',
        name: projectName || projectId || '自定义项目',
        board: serviceType || inferType(projectId, projectName),
        category: '', price: null, priceText: '待评估', cycle: '沟通确认'
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
    if (code.startsWith('AI-')) return 'AI项目';
    if (code.startsWith('JS-')) return '计算模拟';
    if (code.startsWith('FX-')) return '分析表征';
    if (code.startsWith('HC-')) return '耗材仪器';
    const source = String(text);
    if (/AI|人工智能|机器学习|知识库|智能体/.test(source)) return 'AI项目';
    if (/计算|模拟|DFT|分子动力学|有限元|CFD/.test(source)) return '计算模拟';
    if (/表征|测试|光谱|色谱|显微|XRD|XPS|SEM|TEM/.test(source)) return '分析表征';
    return '耗材仪器';
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
    if ((project?.board || inferType(code, project?.service)) === '耗材仪器') {
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
    if (title) title.textContent = '登录查看订单与项目进度';
    if (paragraph) paragraph.innerHTML = `已选择：<strong>${escapeHtml(state.selectedProject.service)}</strong>。登录或注册后，项目会自动带入，无需重新查找。`;
  }

  function renderProjectSelection() {
    const card = $('#selectedProjectCard');
    const formArea = $('#orderFormArea');
    const orderBar = $('#orderBar');
    if (!card) return;
    if (!state.selectedProject) {
      card.classList.add('empty');
      card.innerHTML = `<div><small>尚未选择</small><strong>先选择一个具体项目</strong><span>一个需求单对应一个项目，便于快速评估和报价。</span></div><button class="btn btn-outline" id="changeProjectBtn" type="button">选择项目</button>`;
      $('#projectChooser')?.classList.remove('hidden');
      formArea?.classList.add('hidden');
      orderBar?.classList.add('hidden');
      bindChangeProject();
      renderProjectList();
      return;
    }
    const project = state.selectedProject;
    card.classList.remove('empty');
    card.innerHTML = `<div><small>${escapeHtml(project.id || project.board || '已选择')}</small><strong>${escapeHtml(project.service || project.name)}</strong><span>${escapeHtml([project.category, project.cycle, priceText(project)].filter(Boolean).join('｜'))}</span></div><button class="btn btn-outline" id="changeProjectBtn" type="button">更换项目</button>`;
    formArea?.classList.remove('hidden');
    orderBar?.classList.remove('hidden');
    $('#orderBarProject').textContent = project.service || project.name || '当前项目';
    $('#orderBarPrice').textContent = `${priceText(project)}｜最终以技术评估报价为准`;
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
    if (!project) return '价格待评估';
    if (project.priceText) return project.priceText;
    if (project.price == null) return '价格待评估';
    return `参考 ¥${Number(project.price).toLocaleString('zh-CN')}/${project.unit || '项'}`;
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
        <em>${escapeHtml(priceText(item))}｜${escapeHtml(item.cycle || '沟通确认')}</em>
      </button>`).join('') : '<div class="empty-state">没有找到匹配项目，可缩短关键词后重试。</div>';
    if (rows.length > visible.length) {
      list.insertAdjacentHTML('beforeend', `<div class="project-list-note">共找到 ${rows.length} 项，当前显示前 ${visible.length} 项。输入项目名称或编号可快速定位。</div>`);
    }
    $$('[data-project-id]', list).forEach(button => {
      button.onclick = () => {
        const project = state.catalog.find(item => item.id === button.dataset.projectId);
        if (project) chooseProject(project);
      };
    });
  }

  function quickSchema(type) {
    if (type === 'AI项目') return [
      { key: 'goal', label: '主要目标', type: 'select', options: ['预测/分类', '候选筛选', '工艺或配方优化', '知识库/RAG', '智能体/自动化', '图像或多模态分析', '其他'] },
      { key: 'dataStatus', label: '现有数据', type: 'select', options: ['暂无数据，需要共同规划', '有少量原始数据', '已有整理后的表格数据', '有图像/谱图/文本等多模态数据', '已有模型或代码需要优化'] },
      { key: 'deliverables', label: '希望获得', type: 'multi', options: ['模型与指标', '候选结果/推荐方案', '可解释分析', '图表与报告', '代码与使用说明', '网页/软件原型'] }
    ];
    if (type === '计算模拟') return [
      { key: 'systemType', label: '研究体系', type: 'select', options: ['分子/团簇', '晶体/表面', '界面/吸附', '膜与传质', '流体与反应器', '结构与力学', '不确定，请评估'] },
      { key: 'inputFiles', label: '已有文件', type: 'select', options: ['CIF/POSCAR', 'PDB/MOL/XYZ', '实验结构或图片', '已有计算输入文件', '暂时没有'] },
      { key: 'deliverables', label: '重点结果', type: 'multi', options: ['结构优化', '能量与反应路径', '电子结构/轨道', '动力学与扩散', '流场/温度/应力', '高分辨率科研图片', '完整技术报告'] }
    ];
    if (type === '分析表征') return [
      { key: 'sampleCount', label: '样品数量', type: 'number', placeholder: '例如 3' },
      { key: 'sampleState', label: '样品状态', type: 'select', options: ['粉末', '块体/片材', '薄膜/涂层', '液体/溶液', '生物样品', '其他'] },
      { key: 'hazard', label: '安全情况', type: 'select', options: ['无毒、无危险性', '易燃/易爆', '腐蚀性', '有毒或生物风险', '含挥发性成分', '不确定，请评估'] },
      { key: 'analysisNeed', label: '数据分析', type: 'select', options: ['仅需原始数据', '需要基础分析与绘图', '需要深度分析与报告', '不确定，请推荐'] }
    ];
    return [
      { key: 'quantity', label: '采购数量', type: 'number', placeholder: '例如 10' },
      { key: 'specification', label: '规格/型号', type: 'text', placeholder: '不知道可填写“请协助选型”' },
      { key: 'usage', label: '使用场景', type: 'select', options: ['实验室日常使用', '材料制备', '分析测试', '生物实验', '环境采样', '设备配套', '其他'] }
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
        return `<label class="quick-field"><span>${escapeHtml(field.label)}</span><select data-quick-key="${escapeHtml(field.key)}"><option value="">请选择</option>${field.options.map(option => `<option>${escapeHtml(option)}</option>`).join('')}</select></label>`;
      }
      return `<label class="quick-field"><span>${escapeHtml(field.label)}</span><input data-quick-key="${escapeHtml(field.key)}" type="${field.type === 'number' ? 'number' : 'text'}" min="0" placeholder="${escapeHtml(field.placeholder || '')}"></label>`;
    }).join('');
    renderDescriptionTools(type);
    const description = $('#requestDescription');
    if (description) description.placeholder = descriptionPlaceholder(type);
    bindDraftAutosave();
  }

  function descriptionPlaceholder(type) {
    if (type === 'AI项目') return '例如：已有约300组实验数据，希望预测材料性能、筛选关键因素，并交付模型、图表和可复现代码。';
    if (type === '计算模拟') return '例如：希望比较3种材料对目标分子的吸附能力，已有CIF结构，需要吸附能、电子结构和高分辨率图片。';
    if (type === '分析表征') return '例如：3个粉末样品，需要确认物相和晶粒尺寸；样品无毒，希望提供原始数据、绘图和简要分析。';
    return '例如：需要采购某型号滤膜50片，用于水样过滤；如无指定品牌，请协助选型并报价。';
  }

  function renderDescriptionTools(type) {
    let tools = $('#descriptionTools');
    if (!tools) {
      tools = document.createElement('div');
      tools.id = 'descriptionTools';
      tools.className = 'description-tools';
      $('.description-field')?.insertAdjacentElement('beforebegin', tools);
    }
    tools.innerHTML = `<span>不会描述？</span><button type="button" data-description-preset="structured">使用填写提示</button><button type="button" data-description-preset="evaluate">请技术人员评估</button><button type="button" data-description-preset="clear">清空</button>`;
    $$('[data-description-preset]', tools).forEach(button => {
      button.onclick = () => {
        const textarea = $('#requestDescription');
        if (!textarea) return;
        if (button.dataset.descriptionPreset === 'clear') textarea.value = '';
        if (button.dataset.descriptionPreset === 'evaluate') {
          textarea.value = `我对具体参数不确定。请根据“${state.selectedProject?.service || ''}”项目和我的研究目标，协助评估合适的方案、所需资料、周期和报价。\n研究目标：\n已有样品/结构/数据：\n希望获得的结果：`;
        }
        if (button.dataset.descriptionPreset === 'structured') textarea.value = structuredDescription(type);
        textarea.focus();
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      };
    });
  }

  function structuredDescription(type) {
    if (type === 'AI项目') return '项目背景与目标：\n已有数据（类型、数量、格式）：\n希望解决的问题：\n期望交付（模型/报告/代码/系统）：\n其他要求：';
    if (type === '计算模拟') return '研究体系与材料：\n计算目的：\n已有结构或输入文件：\n希望获得的参数/图表：\n需要比较的方案：\n其他要求：';
    if (type === '分析表征') return '样品名称、数量及状态：\n主要成分与安全性：\n希望测试的内容：\n特殊测试条件：\n是否需要数据分析与绘图：\n其他要求：';
    return '产品名称：\n规格/型号：\n数量：\n使用场景：\n品牌要求（如有）：\n交付时间与其他要求：';
  }

  function renderAdvancedFields() {
    const box = $('#advancedFields');
    if (!box) return;
    const template = state.selectedTemplate;
    if (!template) {
      box.innerHTML = '<div class="empty-state">暂无对应专业模板，直接填写需求描述即可。</div>';
      return;
    }
    const fields = (template.fields || []).filter(field => !commonFieldKeys.has(field.key));
    box.innerHTML = fields.map(field => renderAdvancedField(field)).join('') || '<div class="empty-state">该项目无需额外专业字段。</div>';
  }

  function renderAdvancedField(field) {
    const hint = field.templateHint ? `<small>${escapeHtml(field.templateHint)}</small>` : '';
    if (field.type === 'textarea') return `<label class="field full"><span>${escapeHtml(field.label)}</span><textarea data-advanced-key="${escapeHtml(field.key)}" placeholder="${escapeHtml(field.placeholder || '选填')}"></textarea>${hint}</label>`;
    if (field.type === 'select') return `<label class="field"><span>${escapeHtml(field.label)}</span><select data-advanced-key="${escapeHtml(field.key)}"><option value="">请选择</option>${(field.options || []).map(option => `<option>${escapeHtml(option)}</option>`).join('')}</select>${hint}</label>`;
    if (field.type === 'multiselect') return `<fieldset class="field full advanced-checks"><legend>${escapeHtml(field.label)}</legend><div class="option-grid">${(field.options || []).map(option => `<label class="option-check"><input data-advanced-multi="${escapeHtml(field.key)}" type="checkbox" value="${escapeHtml(option)}"><span>${escapeHtml(option)}</span></label>`).join('')}</div>${hint}</fieldset>`;
    if (field.type === 'table') return `<label class="field full"><span>${escapeHtml(field.label)}</span><textarea data-advanced-key="${escapeHtml(field.key)}" placeholder="可按行填写，或直接上传现有表格/Word 文件"></textarea>${hint}</label>`;
    const inputType = ['date', 'email', 'tel', 'number'].includes(field.type) ? field.type : 'text';
    return `<label class="field"><span>${escapeHtml(field.label)}</span><input data-advanced-key="${escapeHtml(field.key)}" type="${inputType}" placeholder="${escapeHtml(field.placeholder || '选填')}">${hint}</label>`;
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
    if (file.size > 5 * 1024 * 1024) throw new Error(`${file.name} 超过 5 MB，请压缩后上传或在小程序中补充`);
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
    const result = await response.json().catch(() => ({ ok: false, message: '附件上传接口返回格式错误' }));
    if (!response.ok || result.ok === false) throw new Error(result.message || `${file.name} 上传失败`);
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
    if (!state.selectedProject) return message($('#submitMessage'), '请先选择具体项目', 'error');
    const description = $('#requestDescription')?.value.trim() || '';
    const contactName = $('#orderContactName')?.value.trim() || '';
    const phone = $('#orderPhone')?.value.trim() || '';
    const email = $('#orderEmail')?.value.trim() || '';
    if (!description) return message($('#submitMessage'), '请填写一句话需求描述；不确定参数时可点击“请技术人员评估”', 'error');
    if (!contactName) return message($('#submitMessage'), '请填写联系人', 'error');
    if (!phone && !email) return message($('#submitMessage'), '手机号或邮箱至少填写一项', 'error');

    state.submitting = true;
    const buttons = [$('#submitRequirementBtn'), $('#submitAndWordBtn')].filter(Boolean);
    buttons.forEach(button => { button.disabled = true; });
    message($('#submitMessage'), exportWord ? '正在提交并生成 Word 需求单，请稍候……' : '正在提交需求，请稍候……');

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
        templateName: state.selectedTemplate?.title || `${formData.serviceType}需求表`,
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
      const numberText = businessNo ? `业务编号：<strong>${escapeHtml(businessNo)}</strong>` : '需求已写入客户账户';
      const download = downloadUrl ? `<a class="result-download" href="${escapeHtml(downloadUrl)}" target="_blank" rel="noopener">下载 Word 需求单</a>` : '';
      const note = exportWord && !downloadUrl ? `<small>${escapeHtml(exportMessage || 'Word 导出任务已创建，可稍后在业务进度中查看。')}</small>` : '';
      message($('#submitMessage'), `<div class="submit-success"><b>提交成功</b><span>${numberText}</span>${download}${note}</div>`);
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
    return `hqtd_draft_${state.selectedProject?.id || state.selectedProject?.service || 'general'}`;
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
    await loadDashboard();
    loadBusinessData();
  }

  let dashboardRefreshTimer = setInterval(() => { if (!document.hidden && state.token) { loadDashboard().catch(() => {}); loadBusinessData().catch(() => {}); } }, 15000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && state.token) { loadDashboard().catch(() => {}); loadBusinessData().catch(() => {}); } });

  async function loadDashboard() {
    const result = await apiOptional('dashboard');
    if (result.optionalError) {
      $('#homeAccountMeta').textContent = result.message || '账户信息暂时无法加载';
      return;
    }
    state.profile = profileFrom(result) || state.profile;
    state.accounts = result.accounts || result.data?.accounts || [];
    const account = result.account || result.currentAccount || result.data?.account || {};
    const summary = result.summary || result.metrics || result.data?.summary || {};
    const counts = result.counts || result.data?.counts || {};
    $('#homeAccountName').textContent = account.name || account.accountName || state.profile?.organization || state.profile?.name || '当前客户账户';
    $('#homeAccountMeta').textContent = [
      state.profile?.name,
      state.profile?.customerNo ? `客户编号 ${state.profile.customerNo}` : '',
      account.accountNo ? `账户编号 ${account.accountNo}` : '',
      summary.balanceCents != null ? `可用余额 ${formatMoney(summary.balanceCents)}` : ''
    ].filter(Boolean).join('｜') || '官网与小程序共用同一客户账户';
    $('#metricQuotes').textContent = counts.quotes ?? summary.pendingQuotes ?? summary.quotes ?? result.quotes?.length ?? 0;
    $('#metricProjects').textContent = counts.projects ?? summary.activeProjects ?? summary.projects ?? result.projects?.length ?? 0;
    $('#metricDeliveries').textContent = counts.deliveries ?? summary.pendingDeliveries ?? summary.deliveries ?? result.deliveries?.length ?? 0;
    $('#metricAfterSales').textContent = counts.afterSales ?? summary.activeAfterSales ?? summary.afterSales ?? result.afterSales?.length ?? 0;
    $('#accountSwitchBtn')?.classList.toggle('hidden', state.accounts.length < 2);
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
    return record.projectName || record.title || record.serviceName || record.name || record.templateName || '业务记录';
  }

  function recordNo(record) {
    return record.quoteNo || record.projectNo || record.orderNo || record.businessNo || record.demandNo || record.requirementNo || record.no || record._id || '';
  }

  function recordStatus(record) {
    return record.statusText || record.statusName || record.status || '处理中';
  }

  function renderRecord(record, options = {}) {
    const amount = record.amountCents != null ? formatMoney(record.amountCents) : (record.amount ? `¥${Number(record.amount).toLocaleString('zh-CN')}` : '');
    const files = []
      .concat(Array.isArray(record.attachments) ? record.attachments : [])
      .concat(Array.isArray(record.files) ? record.files : [])
      .concat(record.deliveryFiles && Array.isArray(record.deliveryFiles) ? record.deliveryFiles : []);
    const actions = [];
    const directUrl = record.downloadUrl || record.fileUrl || record.url || record.documentUrl || '';
    if (directUrl) actions.push(`<a href="${escapeHtml(directUrl)}" target="_blank" rel="noopener">下载文件</a>`);
    files.forEach((file, index) => {
      const url = file.tempURL || file.downloadUrl || file.url || '';
      if (url) actions.push(`<a href="${escapeHtml(url)}" target="_blank" rel="noopener">下载：${escapeHtml(file.name || file.filename || `文件${index + 1}`)}</a>`);
      else if (file.fileID) actions.push(`<button type="button" data-download-file="${escapeHtml(file.fileID)}" data-file-name="${escapeHtml(file.name || file.filename || '项目文件')}">下载：${escapeHtml(file.name || file.filename || `文件${index + 1}`)}</button>`);
    });
    const businessId = record._id || record.id || '';
    const businessType = record._type || record.kind || '';
    if (businessId) actions.push(`<label class="record-upload-label">上传补充文件<input type="file" hidden data-business-upload="${escapeHtml(businessId)}" data-business-type="${escapeHtml(businessType)}"></label>`);
    if (record._type === 'quote' && /待|pending|confirm/i.test(recordStatus(record))) {
      actions.push(`<button type="button" data-confirm-quote="${escapeHtml(record._id || record.id || recordNo(record))}">确认报价</button>`);
      actions.push(`<button type="button" data-change-quote="${escapeHtml(record._id || record.id || recordNo(record))}">申请改价</button>`);
    }
    return `<article class="record-card" data-record-type="${escapeHtml(record._type || '')}">
      <div class="record-main"><span class="record-type">${escapeHtml(typeLabel(record._type))}</span><h3>${escapeHtml(recordTitle(record))}</h3><p>${escapeHtml(recordNo(record))}</p></div>
      <div class="record-meta"><b>${escapeHtml(recordStatus(record))}</b>${amount ? `<span>${escapeHtml(amount)}</span>` : ''}<small>${escapeHtml(dateText(record.updatedAtText || record.updatedAt || record.createdAtText || record.createdAt))}</small></div>
      ${actions.length ? `<div class="record-actions">${actions.join('')}</div>` : ''}
    </article>`;
  }

  function typeLabel(type) {
    return ({ quote: '报价', project: '项目', order: '订单', requirement: '需求', delivery: '交付', afterSale: '售后' })[type] || '业务';
  }

  function renderRecentBusiness() {
    const box = $('#recentBusiness');
    if (!box) return;
    const rows = allBusinessRows().sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)).slice(0, 5);
    box.innerHTML = rows.length ? rows.map(row => renderRecord(row)).join('') : `<div class="empty-state">暂无业务记录。选择具体项目后即可提交第一个需求。</div>`;
    bindRecordActions(box);
  }

  function renderBusiness(filter = 'all') {
    const box = $('#businessList');
    if (!box) return;
    const map = { quotes: 'quote', projects: 'project', deliveries: 'delivery', afterSales: 'afterSale' };
    const type = map[filter];
    const rows = allBusinessRows().filter(row => !type || row._type === type);
    box.innerHTML = rows.length ? rows.map(row => renderRecord(row)).join('') : `<div class="empty-state">暂无相关记录</div>`;
    $$('#businessTabs button').forEach(button => button.classList.toggle('active', button.dataset.filter === filter));
    bindRecordActions(box);
  }

  function bindRecordActions(root) {
    $$('[data-download-file]', root).forEach(button => button.onclick = async () => {
      button.disabled = true;
      try {
        const result = await api('getBusinessFileUrl', { fileID: button.dataset.downloadFile, filename: button.dataset.fileName });
        const url = result.downloadUrl || result.url || result.tempFileURL;
        if (!url) throw new Error('暂时无法生成下载地址');
        window.open(url, '_blank', 'noopener');
      } catch (error) { alert(error.message); }
      finally { button.disabled = false; }
    });
    $$('[data-business-upload]', root).forEach(input => input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const label = input.closest('.record-upload-label');
      const original = label?.childNodes?.[0]?.textContent || '上传补充文件';
      if (label) label.childNodes[0].textContent = '上传中…';
      try {
        if (file.size > 10 * 1024 * 1024) throw new Error('单个文件不能超过 10 MB');
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
        if (!response.ok || result.ok === false) throw new Error(result.message || '上传失败');
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
      const reason = prompt('请简要说明希望调整的价格或原因：');
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
    box.innerHTML = rows.length ? rows.map(row => renderRecord(row)).join('') : '<div class="empty-state">暂无交付文件</div>';
  }

  function renderAfterSales() {
    const box = $('#afterSalesList');
    if (!box) return;
    const rows = (state.business?.afterSales || state.business?.after_sales || []).map(row => ({ ...row, _type: 'afterSale' }));
    box.innerHTML = rows.length ? rows.map(row => renderRecord(row)).join('') : '<div class="empty-state">暂无售后记录</div>';
  }

  async function loadWallet() {
    const result = await apiOptional('wallet');
    if (result.optionalError) {
      $('#walletTransactions').innerHTML = `<div class="empty-state">${escapeHtml(result.message)}</div>`;
      return;
    }
    const data = result.data || result;
    $('#walletBalance').textContent = formatMoney(data.availableBalanceCents || data.balanceCents || 0);
    $('#walletTotals').textContent = `累计充值 ${formatMoney(data.totalRechargeCents)}｜累计消费 ${formatMoney(data.totalSpentCents)}｜累计退款 ${formatMoney(data.totalRefundCents)}`;
    const rows = data.transactions || [];
    $('#walletTransactions').innerHTML = rows.length ? rows.map(row => `<article class="record-card"><div class="record-main"><span class="record-type">流水</span><h3>${escapeHtml(row.title || row.typeText || row.type || '账户变动')}</h3><p>${escapeHtml(row.remark || row.businessNo || '')}</p></div><div class="record-meta"><b>${escapeHtml(row.amountCents >= 0 ? `+${formatMoney(row.amountCents)}` : `-${formatMoney(Math.abs(row.amountCents))}`)}</b><small>${escapeHtml(dateText(row.createdAtText || row.createdAt))}</small></div></article>`).join('') : '<div class="empty-state">暂无资金流水</div>';
  }

  async function loadContracts() {
    const rows = state.business?.contracts || (await apiOptional('listContracts')).contracts || [];
    $('#contractsList').innerHTML = rows.length ? rows.map(row => renderRecord({ ...row, _type: 'contract' })).join('') : '<div class="empty-state">暂无合同</div>';
  }

  async function loadInvoices() {
    const result = await apiOptional('listInvoices');
    const rows = result.invoices || state.business?.invoices || [];
    $('#invoicesList').innerHTML = rows.length ? rows.map(row => renderRecord({ ...row, _type: 'invoice' })).join('') : '<div class="empty-state">暂无发票记录</div>';
  }

  async function loadMessages() {
    const result = await apiOptional('listNotifications');
    const rows = result.notifications || result.messages || state.business?.notifications || [];
    $('#messagesList').innerHTML = rows.length ? rows.map(row => `<article class="record-card"><div class="record-main"><span class="record-type">消息</span><h3>${escapeHtml(row.title || '业务通知')}</h3><p>${escapeHtml(row.content || row.message || '')}</p></div><div class="record-meta"><small>${escapeHtml(dateText(row.createdAtText || row.createdAt))}</small></div></article>`).join('') : '<div class="empty-state">暂无消息</div>';
  }

  async function loadMembers() {
    const result = await apiOptional('listAccountMembers');
    const rows = result.members || state.business?.members || [];
    $('#membersList').innerHTML = rows.length ? rows.map(row => `<article class="record-card"><div class="record-main"><span class="record-type">${escapeHtml(row.roleName || row.role || '成员')}</span><h3>${escapeHtml(row.name || row.displayName || '账户成员')}</h3><p>${escapeHtml(row.phone || row.email || '')}</p></div></article>`).join('') : '<div class="empty-state">暂无成员信息</div>';
  }

  function renderAccountList() {
    const list = $('#accountList');
    if (!list) return;
    list.innerHTML = state.accounts.length ? state.accounts.map(account => `<button type="button" class="account-option" data-account-id="${escapeHtml(account.accountId || account._id || account.id)}"><strong>${escapeHtml(account.name || account.accountName || '客户账户')}</strong><small>${escapeHtml(account.accountNo || account.organization || '')}</small></button>`).join('') : '<div class="empty-state">当前只有一个客户账户</div>';
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
      if (label) label.textContent = $('#advancedDetails').open ? '收起' : '展开';
    });
    $('#downloadTemplateBtn').onclick = () => {
      const path = state.selectedTemplate?.originalPath;
      if (!path) return message($('#submitMessage'), '该项目暂无单独 Word 模板，直接在线填写即可', 'warning');
      location.href = encodeURI(path);
    };
    $('#submitRequirementBtn').onclick = () => submitRequirement(false);
    $('#submitAndWordBtn').onclick = () => submitRequirement(true);

    $('#loginSubmit').onclick = async () => {
      try {
        message($('#authMessage'), '正在登录……');
        const result = await api('login', { identity: $('#loginIdentity').value.trim(), password: $('#loginPassword').value });
        state.token = result.token;
        localStorage.setItem('hqtd_token', state.token);
        message($('#authMessage'), '登录成功');
        await showPortal();
      } catch (error) { message($('#authMessage'), escapeHtml(error.message), 'error'); }
    };
    $('#registerSubmit').onclick = async () => {
      try {
        message($('#authMessage'), '正在创建账户……');
        const result = await api('register', {
          name: $('#regName').value.trim(), organization: $('#regOrganization').value.trim(),
          phone: $('#regPhone').value.trim(), email: $('#regEmail').value.trim(), password: $('#regPassword').value
        });
        state.token = result.token;
        localStorage.setItem('hqtd_token', state.token);
        message($('#authMessage'), '注册成功');
        await showPortal();
      } catch (error) { message($('#authMessage'), escapeHtml(error.message), 'error'); }
    };
    $('#wechatLoginBtn').onclick = async () => {
      try {
        const result = await api('wechatLoginStart', { callbackUrl: cfg.WECHAT_CALLBACK_URL });
        if (!result.authorizeUrl) throw new Error(result.message || '微信扫码登录尚未配置');
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
        message($('#profileMessage'), '资料已保存，并将与小程序账户同步');
        await loadProfile();
      } catch (error) { message($('#profileMessage'), escapeHtml(error.message), 'error'); }
    };
    $('#createAfterSaleBtn').onclick = async () => {
      const description = $('#afterSaleDescription').value.trim();
      if (!description) return message($('#afterSaleMessage'), '请填写问题说明', 'error');
      try {
        await api('createAfterSale', {
          businessNo: $('#afterSaleBusinessNo').value.trim(), type: $('#afterSaleType').value, description
        });
        message($('#afterSaleMessage'), '售后申请已提交');
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
        message($('#invoiceMessage'), '发票申请已提交');
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
})();
