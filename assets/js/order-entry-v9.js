(() => {
  'use strict';

  const API_URL = 'https://cloud1-d3gji859l94c3e5ec-1447812542.ap-shanghai.app.tcloudbase.com/api/webPortal';
  const CART_KEY = 'hqtd_requirement_cart_v2';
  const CONTACT_KEY = 'hqtd_quick_contact_v2';
  const TOKEN_KEY = 'hqtd_token';
  const isProjectPage = /\/project\/[a-z]+-\d+\.html$/i.test(location.pathname);
  const isHomePage = /\/(?:index\.html)?$/i.test(location.pathname) && !/\/project\//i.test(location.pathname);

  if (isHomePage) enhanceHomeCustomerCenter();
  if (!isProjectPage || document.querySelector('.hqtd-order-shell')) return;

  const project = readProject();
  const state = { mode: 'single', current: project, submitting: false, registry: null };
  injectShell();
  bindEvents();
  updateCartCount();

  function readProject() {
    const match = location.pathname.match(/\/([a-z]+-\d+)\.html$/i);
    const id = match ? match[1].toUpperCase() : '';
    const serviceType = id.startsWith('HC-') ? '耗材仪器' : id.startsWith('FX-') ? '分析表征' : id.startsWith('JS-') ? '计算模拟' : 'AI项目';
    const title = (document.querySelector('h1')?.textContent || document.title.split('｜')[0] || '当前项目').trim();
    const data = { id, title, name: title, projectName: title, serviceType, board: serviceType, qty: 1, unit: serviceType === '耗材仪器' ? '件' : '项', price: 0, priceText: '待评估', category: '', spec: '', cycle: '', note: '', details: {}, sourceUrl: location.href };
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
          if (prop.name === '规格型号') data.spec = prop.value || '';
          if (prop.name === '计价单位') data.unit = prop.value || data.unit;
          if (prop.name === '预计周期') data.cycle = prop.value || '';
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

  function enhanceHomeCustomerCenter() {
    const old = [...document.querySelectorAll('a[href^="customer-portal"]')].find(a => /客户注册|在线下单|客户中心/.test(a.textContent));
    if (!old) return;
    old.className = 'hqtd-home-customer-center';
    old.removeAttribute('style');
    old.setAttribute('aria-label', '进入客户中心查看订单、报价、进度和文件');
    old.innerHTML = '<span>客户中心</span><small>订单 · 报价 · 进度 · 文件</small>';
    const nav = document.querySelector('.unified-site-nav');
    if (nav) nav.insertBefore(old, nav.firstChild);
  }

  function injectShell() {
    const supply = project.serviceType === '耗材仪器';
    const bar = document.createElement('aside');
    bar.className = 'hqtd-order-shell';
    bar.innerHTML = `
      <div class="hqtd-order-product"><small>${escapeHtml(project.id)}</small><strong>${escapeHtml(project.title)}</strong><span>${escapeHtml(project.priceText)}${project.unit ? ` / ${escapeHtml(project.unit)}` : ''}</span></div>
      ${supply ? '<div class="hqtd-order-qty"><button type="button" data-qty-minus>−</button><input data-qty value="1" inputmode="numeric" aria-label="购买数量"><button type="button" data-qty-plus>＋</button></div>' : ''}
      <button class="hqtd-order-secondary" type="button" data-open-form>${supply ? '加入清单' : '填写需求'}</button>
      <button class="hqtd-order-primary" type="button" data-buy-now>${supply ? '立即下单' : '立即提交'}</button>
      <button class="hqtd-order-cart" type="button" data-open-cart aria-label="打开需求清单">清单 <b data-cart-count>0</b></button>`;
    document.body.appendChild(bar);

    const overlay = document.createElement('div');
    overlay.className = 'hqtd-order-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="hqtd-order-backdrop" data-close-order></div>
      <section class="hqtd-order-panel" role="dialog" aria-modal="true" aria-label="项目下单">
        <header><div><small id="hqtdPanelKicker">当前项目</small><h2 id="hqtdPanelTitle"></h2></div><button type="button" data-close-order aria-label="关闭">×</button></header>
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
      if (project.serviceType === '耗材仪器') addSupplyToCart(false);
      else openProjectForm('cart');
    });
    shell.querySelector('[data-buy-now]').addEventListener('click', () => {
      if (project.serviceType === '耗材仪器') openCheckout([supplyItem()]);
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
    const existing = rows.find(item => item.id === project.id && item.serviceType === '耗材仪器');
    if (existing) existing.qty = Math.min(999, Number(existing.qty || 1) + readQty());
    else rows.push(supplyItem());
    writeCart(rows);
    showToast(existing ? '数量已合并到需求清单' : '已加入需求清单');
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
      if (project.serviceType !== '分析表征') return;
      event.preventDefault();
      const link = event.currentTarget;
      link.textContent = '正在匹配模板…';
      link.href = await analysisTemplateUrl(project);
      link.textContent = '下载 Word 表格（备选）';
      location.href = link.href;
    });
    body.querySelector('[data-form-cart]')?.addEventListener('click', () => saveProjectForm(false));
    body.querySelector('[data-form-submit]')?.addEventListener('click', () => saveProjectForm(true));
  }

  function buildProjectForm(item) {
    const template = templateUrl(item);
    const templateBlock = item.serviceType === '耗材仪器' ? '' : `
      <div class="hqtd-fill-mode"><div class="active"><b>在线填写</b><span>推荐 · 约 1 分钟</span></div><a href="${escapeHtml(template)}" data-template-link download><b>Word 填写</b><span>下载填写后上传</span></a></div>`;
    let fields = '';
    if (item.serviceType === 'AI项目') {
      fields = `
        <label class="hqtd-field full"><span>定制需求 <em>*</em></span><textarea id="hqtdNeed" maxlength="2000" placeholder="一句话说明想做什么、现有数据和希望得到的结果。"></textarea></label>
        <label class="hqtd-field"><span>现有数据</span><select id="hqtdDataStatus"><option>已有数据</option><option>部分数据</option><option>暂无数据，需要评估</option></select></label>`;
    } else if (item.serviceType === '计算模拟') {
      fields = `
        <label class="hqtd-field"><span>研究对象/体系 <em>*</em></span><input id="hqtdSystem" maxlength="300" placeholder="例如：MoS₂表面吸附CO₂"></label>
        <label class="hqtd-field full"><span>想计算什么 <em>*</em></span><textarea id="hqtdNeed" maxlength="2000" placeholder="例如：结构优化、吸附能、电荷、DOS；不确定可写“请技术人员评估”。"></textarea></label>`;
    } else {
      fields = `
        <label class="hqtd-field"><span>样品数量 <em>*</em></span><input id="hqtdSampleCount" type="number" min="1" max="999" value="1"></label>
        <label class="hqtd-field"><span>样品状态</span><select id="hqtdSampleState"><option>粉末</option><option>块体</option><option>薄膜/涂层</option><option>液体/分散液</option><option>其他</option></select></label>
        <label class="hqtd-field full"><span>主要成分/化学式</span><input id="hqtdComposition" maxlength="300" placeholder="例如：TiO₂；不清楚可写未知"></label>
        <fieldset class="hqtd-choice-group full"><legend>样品危险性</legend><label><input type="radio" name="hqtdHazard" value="无毒、无危险性" checked> 无毒、无危险性</label><label><input type="radio" name="hqtdHazard" value="有毒/易燃易爆/腐蚀性"> 有毒、易燃易爆或腐蚀性</label><label><input type="radio" name="hqtdHazard" value="不确定，请评估"> 不确定，请评估</label></fieldset>
        <label class="hqtd-field full"><span>测试参数/分析要求</span><textarea id="hqtdNeed" maxlength="1500" placeholder="可直接写“常规测试，请技术人员评估参数”。"></textarea></label>`;
    }
    return `
      <div class="hqtd-selected-project"><b>${escapeHtml(item.id)}</b><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.category || item.serviceType)}${item.priceText ? ` · ${escapeHtml(item.priceText)}` : ''}</span></div></div>
      <div class="hqtd-simple-tip">只填写关键信息，不确定的参数可留空或写“请技术人员评估”。</div>
      <div class="hqtd-form-grid">${fields}</div>
      ${templateBlock}
      <label class="hqtd-upload"><span>附件（选填）</span><input id="hqtdFiles" type="file" multiple accept=".doc,.docx,.pdf,.xls,.xlsx,.csv,.zip,.rar,.7z,.png,.jpg,.jpeg,.cif,.pdb,.mol,.mol2,.xyz,.txt,.dat,.log,.gjf,.com,.inp,.vasp"><small>最多 5 个，单个不超过 5 MB。附件在订单提交成功后上传，不影响下单速度。</small></label>
      <div class="hqtd-panel-actions"><button type="button" class="secondary" data-form-cart>加入需求清单</button><button type="button" class="primary" data-form-submit>立即提交</button></div>
      <div class="hqtd-order-message" id="hqtdOrderMessage" aria-live="polite"></div>`;
  }

  function collectProjectForm() {
    const files = [...(document.getElementById('hqtdFiles')?.files || [])];
    let note = '';
    const details = {};
    if (project.serviceType === 'AI项目') {
      const need = value('hqtdNeed');
      if (!need) throw new Error('请简单说明定制需求');
      details.dataStatus = value('hqtdDataStatus');
      details.customNeed = need;
      note = `定制需求：${need}\n现有数据：${details.dataStatus}`;
    } else if (project.serviceType === '计算模拟') {
      const system = value('hqtdSystem');
      const need = value('hqtdNeed');
      if (!system) throw new Error('请填写研究对象或体系');
      if (!need) throw new Error('请简单说明想计算什么');
      details.system = system;
      details.calculationNeed = need;
      note = `研究对象/体系：${system}\n计算需求：${need}`;
    } else {
      const count = Math.max(1, Number(value('hqtdSampleCount') || 1));
      details.sampleCount = count;
      details.sampleState = value('hqtdSampleState');
      details.testNeed = value('hqtdNeed') || '常规测试，请技术人员评估参数';
      note = `样品数量：${count}\n样品状态：${details.sampleState}\n测试要求：${details.testNeed}`;
    }
    return { ...project, qty: project.serviceType === '分析表征' ? Number(details.sampleCount || 1) : 1, note, details, files, cartKey: `${project.id}-${Date.now()}` };
  }

  function saveProjectForm(submitNow) {
    try {
      const item = collectProjectForm();
      if (submitNow) return openCheckout([item], item.files);
      const rows = readCart();
      rows.push({ ...item, files: [] });
      writeCart(rows);
      closePanel();
      showToast('已加入需求清单，可继续选择其他项目');
    } catch (error) { setMessage(error.message, 'error'); }
  }

  function openCart() {
    state.mode = 'cart';
    document.getElementById('hqtdPanelKicker').textContent = '需求清单';
    document.getElementById('hqtdPanelTitle').textContent = '已选择的项目';
    renderCartPanel();
    openPanel();
  }

  function renderCartPanel() {
    const rows = readCart();
    const body = document.getElementById('hqtdPanelBody');
    if (!rows.length) {
      body.innerHTML = '<div class="hqtd-empty-cart"><strong>需求清单为空</strong><span>返回项目页面，选择数量或填写简单需求即可加入。</span></div>';
      return;
    }
    body.innerHTML = `
      <div class="hqtd-cart-list">${rows.map((item, index) => `
        <article class="hqtd-cart-row" data-cart-index="${index}">
          <div><small>${escapeHtml(item.id || item.serviceType)}</small><strong>${escapeHtml(item.title || item.name)}</strong><span>${escapeHtml(summaryForItem(item))}</span></div>
          <div class="hqtd-cart-row-actions">${item.serviceType === '耗材仪器' ? `<input type="number" min="1" max="999" value="${Number(item.qty || 1)}" data-cart-qty>` : `<b>× ${Number(item.qty || 1)}</b>`}<button type="button" data-cart-remove>删除</button></div>
        </article>`).join('')}</div>
      <div class="hqtd-cart-summary">共 ${rows.length} 种项目 · ${rows.reduce((sum, item) => sum + Number(item.qty || 1), 0)} 项</div>
      <div class="hqtd-panel-actions"><button type="button" class="secondary" data-clear-cart>清空</button><button type="button" class="primary" data-cart-checkout>去提交</button></div>`;
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
    document.getElementById('hqtdPanelKicker').textContent = '最后一步';
    document.getElementById('hqtdPanelTitle').textContent = '填写联系方式';
    const body = document.getElementById('hqtdPanelBody');
    body.innerHTML = `
      <div class="hqtd-checkout-summary"><strong>${items.length === 1 ? escapeHtml(items[0].title) : `共 ${items.length} 种项目`}</strong><span>提交后将获得业务编号，报价和进度在客户中心查看。</span></div>
      <div class="hqtd-form-grid contact-grid">
        <label class="hqtd-field"><span>联系人 <em>*</em></span><input id="hqtdContactName" maxlength="80" value="${escapeHtml(contact.name || '')}"></label>
        <label class="hqtd-field"><span>手机号 <em>*</em></span><input id="hqtdPhone" inputmode="tel" maxlength="20" value="${escapeHtml(contact.phone || '')}"></label>
        <label class="hqtd-field full"><span>单位/学校（选填）</span><input id="hqtdOrganization" maxlength="150" value="${escapeHtml(contact.organization || '')}"></label>
        ${items.some(x => x.serviceType === '耗材仪器') ? `<label class="hqtd-field full"><span>规格或收货说明（选填）</span><textarea id="hqtdCheckoutNote" maxlength="500" placeholder="品牌、规格、收货时间等可简要说明；地址可在确认报价后补充。"></textarea></label>` : ''}
      </div>
      ${files.length ? `<div class="hqtd-file-ready">已选择 ${files.length} 个附件，订单创建后自动上传。</div>` : ''}
      <div class="hqtd-login-note">已有客户账户无需先登录；使用相同手机号提交后，订单会自动关联已有客户中心。</div>
      <div class="hqtd-panel-actions"><button type="button" class="secondary" data-checkout-back>返回</button><button type="button" class="primary" data-submit-order>确认提交</button></div>
      <div class="hqtd-order-message" id="hqtdOrderMessage" aria-live="polite"></div>`;
    openPanel();
    body.querySelector('[data-checkout-back]').addEventListener('click', () => items.length > 1 ? openCart() : (project.serviceType === '耗材仪器' ? closePanel() : openProjectForm('submit')));
    body.querySelector('[data-submit-order]').addEventListener('click', submitOrder);
  }

  async function submitOrder() {
    if (state.submitting) return;
    const name = value('hqtdContactName');
    const phone = value('hqtdPhone').replace(/\D/g, '');
    const organization = value('hqtdOrganization');
    if (!name) return setMessage('请填写联系人', 'error');
    if (phone.length < 7) return setMessage('请填写有效手机号', 'error');
    const items = state.checkoutItems || [];
    if (!items.length) return setMessage('没有可提交的项目', 'error');
    const contact = { name, phone, organization };
    localStorage.setItem(CONTACT_KEY, JSON.stringify(contact));
    state.submitting = true;
    const button = document.querySelector('[data-submit-order]');
    if (button) { button.disabled = true; button.textContent = '正在提交…'; }
    setMessage('正在创建订单…');
    try {
      const overallNote = value('hqtdCheckoutNote');
      const payloadItems = items.map(item => ({
        id: item.id, title: item.title, name: item.title, board: item.serviceType, serviceType: item.serviceType,
        category: item.category || '', qty: Math.max(1, Number(item.qty || 1)), price: Math.max(0, Number(item.price || 0)), unit: item.unit || '项',
        note: [item.note || '', overallNote || ''].filter(Boolean).join('\n')
      }));
      const description = items.map((item, i) => `${i + 1}. ${item.title} × ${Math.max(1, Number(item.qty || 1))}${item.note ? `\n${item.note}` : ''}`).join('\n\n');
      const result = await api('createOrder', {
        submissionMode: 'project_page_simple_checkout', name, contactName: name, phone, organization,
        serviceType: items.length === 1 ? items[0].serviceType : '官网综合订单',
        projectName: items.length === 1 ? items[0].title : `综合订单（${items.length}种）`,
        description, details: description, items: payloadItems, cartItems: payloadItems,
        sourcePage: location.href, clientVersion: 'web-10.0.0-simple'
      });
      const recordId = result.order?.id || result.requirementId || result.id || '';
      const demandNo = result.businessNo || result.demandNo || result.order?.demandNo || '已提交';
      const files = state.checkoutFiles || [];
      setMessage(successHtml(demandNo, files.length ? `订单已创建，${files.length} 个附件正在后台上传` : '技术人员将尽快评估'), 'success', true);
      if (button) { button.disabled = false; button.textContent = '提交成功'; }
      state.submitting = false;
      showToast(`提交成功：${demandNo}`);
      if (files.length) {
        Promise.resolve().then(() => uploadFiles(files, recordId, phone)).then(failures => {
          if (failures.length) showToast(`${failures.length} 个附件未上传，可在客户中心补充`);
          else showToast('附件上传完成');
        }).catch(() => showToast('附件上传未完成，可在客户中心补充'));
      }
      setTimeout(closePanel, 900);
      if ((state.checkoutItems || []).length > 1 || readCart().length) writeCart([]);
    } catch (error) {
      setMessage(error.message || '提交失败，请稍后重试', 'error');
    } finally {
      state.submitting = false;
      if (button) { button.disabled = false; button.textContent = '确认提交'; }
    }
  }

  function successHtml(no, note) {
    const portal = new URL('customer-portal/', document.baseURI).href;
    return `<div class="hqtd-submit-success"><b>提交成功</b><strong>${escapeHtml(no)}</strong><span>${escapeHtml(note)}</span><a href="${portal}">进入客户中心查看状态</a></div>`;
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
        const result = await response.json().catch(() => ({ ok: false, message: '附件上传失败' }));
        if (!response.ok || result.ok === false) return file.name;
        return '';
      } catch (_) { return file.name; }
    });
    return (await Promise.all(tasks)).filter(Boolean);
  }

  async function api(action, data = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const token = localStorage.getItem(TOKEN_KEY) || '';
      const response = await fetch(API_URL, {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ action, ...data })
      });
      const result = await response.json().catch(() => ({ ok: false, message: '接口返回格式错误' }));
      if (!response.ok || result.ok === false) throw new Error(result.message || `请求失败（${response.status}）`);
      return result;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('提交超时，请检查网络后重试；已填写内容不会丢失');
      throw error;
    } finally { clearTimeout(timer); }
  }

  function templateUrl(item) {
    if (item.serviceType === 'AI项目') return new URL('customer-portal/templates/AI项目需求表.docx', document.baseURI).href;
    if (item.serviceType === '计算模拟') return new URL('customer-portal/templates/模拟计算需求单-动态参考模板.docx', document.baseURI).href;
    if (item.serviceType === '分析表征') return new URL('customer-portal/templates/analysis/A01.docx', document.baseURI).href;
    return new URL('customer-portal/templates/耗材仪器采购需求表.docx', document.baseURI).href;
  }

  async function analysisTemplateUrl(item) {
    try {
      if (!state.registry) state.registry = await fetch(new URL('customer-portal/assets/form-templates.json', document.baseURI)).then(r => r.json());
      const templates = (state.registry.templates || []).filter(x => x.serviceType === '分析表征');
      const source = `${item.title} ${item.category}`.toLowerCase();
      const score = template => String(template.title || '').toLowerCase().split(/[与及、（）()\s/+-]+/).filter(x => x.length > 1).reduce((sum, term) => sum + (source.includes(term) ? term.length : 0), 0);
      const selected = templates.slice().sort((a, b) => score(b) - score(a))[0];
      return new URL(`customer-portal/${selected?.originalPath || 'templates/analysis/A01.docx'}`, document.baseURI).href;
    } catch (_) { return templateUrl(item); }
  }

  function readCart() { try { const rows = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); return Array.isArray(rows) ? rows.slice(0, 30) : []; } catch (_) { return []; } }
  function writeCart(rows) { localStorage.setItem(CART_KEY, JSON.stringify(rows.slice(0, 30))); updateCartCount(); }
  function updateCartCount() { const count = readCart().length; document.querySelectorAll('[data-cart-count]').forEach(node => { node.textContent = String(count); }); }
  function readContact() { try { return JSON.parse(localStorage.getItem(CONTACT_KEY) || '{}'); } catch (_) { return {}; } }
  function summaryForItem(item) { return item.serviceType === '耗材仪器' ? `${item.spec || '规格按页面'} · ${item.priceText || '待确认'}` : (item.note || '已填写关键需求').replace(/\n/g, '；').slice(0, 100); }
  function openPanel() { const overlay = document.querySelector('.hqtd-order-overlay'); overlay.hidden = false; requestAnimationFrame(() => overlay.classList.add('open')); document.documentElement.classList.add('hqtd-order-open'); }
  function closePanel() { const overlay = document.querySelector('.hqtd-order-overlay'); overlay.classList.remove('open'); document.documentElement.classList.remove('hqtd-order-open'); setTimeout(() => { overlay.hidden = true; }, 180); }
  function setMessage(text, type = 'status', raw = false) { const box = document.getElementById('hqtdOrderMessage'); if (!box) return; box.innerHTML = raw ? text : `<div class="${type}">${escapeHtml(text)}</div>`; }
  function showToast(text) { const toast = document.querySelector('.hqtd-order-toast'); toast.textContent = text; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200); }
  function value(id) { return String(document.getElementById(id)?.value || '').trim(); }
  function formatNumber(value) { return Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 2 }); }
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
})();
