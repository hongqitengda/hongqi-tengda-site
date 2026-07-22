(() => {
  'use strict';

  const cfg = window.HQTD_CONFIG || {};
  const CART_KEY = 'hqtd_requirement_cart_v1';
  const CONTACT_KEY = 'hqtd_cart_contact_v1';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  let submitting = false;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function readCart() {
    try {
      const rows = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return Array.isArray(rows) ? rows.slice(0, 30) : [];
    } catch (_) { return []; }
  }

  function writeCart(rows) {
    localStorage.setItem(CART_KEY, JSON.stringify(rows.slice(0, 30)));
    renderCart();
    window.dispatchEvent(new CustomEvent('hqtd-cart-updated'));
  }

  function token() { return localStorage.getItem('hqtd_token') || ''; }

  async function api(action, data = {}) {
    if (!cfg.WEB_PORTAL_URL) throw new Error('官网业务接口尚未配置');
    const response = await fetch(cfg.WEB_PORTAL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token() ? { Authorization: `Bearer ${token()}` } : {})
      },
      body: JSON.stringify({ action, ...data })
    });
    const result = await response.json().catch(() => ({ ok: false, message: '接口返回格式错误' }));
    if (!response.ok || result.ok === false) throw new Error(result.message || result.error || `请求失败（${response.status}）`);
    return result;
  }

  function notify(text, type = 'status') {
    const box = $('#cartMessage');
    if (box) box.innerHTML = text ? `<div class="${type}">${text}</div>` : '';
  }

  function formatMoney(value) {
    return `¥${Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function updateCounts(count) {
    $$('[data-global-cart-count]').forEach(node => { node.textContent = String(count); });
  }

  function rowDetails(item) {
    const pairs = [];
    const quick = item.quickOptions && typeof item.quickOptions === 'object' ? item.quickOptions : {};
    Object.entries(quick).forEach(([key, value]) => {
      const text = Array.isArray(value) ? value.join('、') : String(value || '');
      if (text) pairs.push(`${key}：${text}`);
    });
    return pairs.join('；');
  }

  function renderCart() {
    const rows = readCart();
    updateCounts(rows.length);
    const container = $('#cartItems');
    if (!container) return;
    if (!rows.length) {
      container.innerHTML = '<div class="empty-state cart-empty"><b>需求清单为空</b><span>从具体项目页面点击“加入需求清单”或“立即下单”。</span><a class="btn btn-primary" href="../catalog.html">查找项目</a></div>';
      $('#cartSummary').textContent = '共 0 个项目';
      return;
    }
    container.innerHTML = rows.map((item, index) => {
      const price = Number(item.price || 0);
      const detail = rowDetails(item);
      return `<article class="cart-item" data-cart-key="${escapeHtml(item.cartKey || `${item.id}-${index}`)}">
        <div class="cart-item-main">
          <span class="cart-item-type">${escapeHtml(item.serviceType || item.board || '科研服务')}</span>
          <h3>${escapeHtml(item.name || item.title || '未命名项目')}</h3>
          <p>${escapeHtml(item.id || item.projectId || '')}${detail ? `｜${escapeHtml(detail)}` : ''}</p>
          <label><span>补充要求</span><textarea data-cart-note placeholder="例如：结构数量、样品数量、交付文件、计算精度等">${escapeHtml(item.note || '')}</textarea></label>
        </div>
        <div class="cart-item-side">
          <b>${price > 0 ? formatMoney(price) : '待评估'}</b>
          <label><span>数量</span><input data-cart-qty type="number" min="1" max="999" value="${Math.max(1, Number(item.qty || 1))}"></label>
          <button data-cart-remove type="button">删除</button>
        </div>
      </article>`;
    }).join('');
    const priced = rows.reduce((sum, item) => sum + Number(item.price || 0) * Math.max(1, Number(item.qty || 1)), 0);
    const inquiry = rows.filter(item => Number(item.price || 0) <= 0).length;
    $('#cartSummary').textContent = `共 ${rows.length} 个项目${priced ? `｜参考小计 ${formatMoney(priced)}` : ''}${inquiry ? `｜${inquiry} 项待评估` : ''}`;

    $$('.cart-item').forEach((node, index) => {
      node.querySelector('[data-cart-remove]').addEventListener('click', () => {
        const next = readCart(); next.splice(index, 1); writeCart(next);
      });
      node.querySelector('[data-cart-qty]').addEventListener('change', event => {
        const next = readCart();
        if (next[index]) next[index].qty = Math.max(1, Math.min(999, Number(event.target.value || 1)));
        writeCart(next);
      });
      node.querySelector('[data-cart-note]').addEventListener('input', event => {
        const next = readCart();
        if (next[index]) next[index].note = event.target.value.slice(0, 1000);
        localStorage.setItem(CART_KEY, JSON.stringify(next));
      });
    });
  }

  function saveContact() {
    const data = {
      name: $('#cartContactName')?.value.trim() || '', organization: $('#cartOrganization')?.value.trim() || '',
      phone: $('#cartPhone')?.value.trim() || '', email: $('#cartEmail')?.value.trim() || '',
      expectedDate: $('#cartExpectedDate')?.value || '', budget: $('#cartBudget')?.value.trim() || '',
      description: $('#cartDescription')?.value.trim() || ''
    };
    localStorage.setItem(CONTACT_KEY, JSON.stringify(data));
  }

  function restoreContact() {
    try {
      const data = JSON.parse(localStorage.getItem(CONTACT_KEY) || '{}');
      const map = {
        cartContactName: 'name', cartOrganization: 'organization', cartPhone: 'phone', cartEmail: 'email',
        cartExpectedDate: 'expectedDate', cartBudget: 'budget', cartDescription: 'description'
      };
      Object.entries(map).forEach(([id, key]) => { if ($(`#${id}`) && data[key]) $(`#${id}`).value = data[key]; });
    } catch (_) {}
  }

  async function loadProfile() {
    if (!token()) return;
    try {
      const result = await api('me');
      const user = result.user || {};
      if ($('#cartContactName') && !$('#cartContactName').value) $('#cartContactName').value = user.name || '';
      if ($('#cartOrganization') && !$('#cartOrganization').value) $('#cartOrganization').value = user.organization || '';
      if ($('#cartPhone') && !$('#cartPhone').value) $('#cartPhone').value = user.phone || '';
      if ($('#cartEmail') && !$('#cartEmail').value) $('#cartEmail').value = user.email || '';
    } catch (_) {}
  }

  function uploadEndpoint() {
    const base = String(cfg.WEB_PORTAL_URL || '').replace(/\/+$/, '');
    return `${base}?action=uploadAttachment`;
  }

  async function uploadOne(file, index, total) {
    if (file.size > 5 * 1024 * 1024) throw new Error(`${file.name} 超过 5 MB`);
    notify(`正在上传附件 ${index + 1}/${total}：${escapeHtml(file.name)}`);
    const response = await fetch(uploadEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Filename': encodeURIComponent(file.name),
        'X-Mime-Type': file.type || 'application/octet-stream',
        'X-File-Size': String(file.size),
        ...(token() ? { Authorization: `Bearer ${token()}` } : {})
      },
      body: file
    });
    const result = await response.json().catch(() => ({ ok: false, message: '附件上传接口返回格式错误' }));
    if (!response.ok || result.ok === false) throw new Error(result.message || `${file.name} 上传失败`);
    return result.file || result;
  }

  async function uploadFiles(files) {
    const list = [...files];
    if (list.length > 10) throw new Error('一次最多上传 10 个附件');
    const result = [];
    for (let i = 0; i < list.length; i += 1) result.push(await uploadOne(list[i], i, list.length));
    return result;
  }

  function itemPayload(item) {
    const optionText = rowDetails(item);
    return {
      id: item.id || item.projectId || '', title: item.name || item.title || '', name: item.name || item.title || '',
      board: item.board || item.serviceType || '', category: item.category || '', serviceType: item.serviceType || item.board || '',
      qty: Math.max(1, Number(item.qty || 1)), price: Math.max(0, Number(item.price || 0)), unit: item.unit || '项',
      note: [item.note || '', optionText].filter(Boolean).join('\n')
    };
  }

  async function submitCart(exportWord) {
    if (submitting) return;
    const rows = readCart();
    const name = $('#cartContactName')?.value.trim() || '';
    const phone = $('#cartPhone')?.value.trim() || '';
    const email = $('#cartEmail')?.value.trim() || '';
    const description = $('#cartDescription')?.value.trim() || '';
    if (!rows.length) return notify('请先加入至少一个项目', 'error');
    if (!name) return notify('请填写联系人', 'error');
    if (!phone && !email) return notify('手机号或邮箱至少填写一项', 'error');
    if (!description) return notify('请填写总体研究目标或补充说明', 'error');
    if (!$('#cartConsent')?.checked) return notify('请确认需求和联系方式准确', 'error');
    if (!token()) return notify('请先登录或注册客户账户，再提交订单', 'error');

    submitting = true;
    const buttons = [$('#cartSubmitBtn'), $('#cartSubmitWordBtn')].filter(Boolean);
    buttons.forEach(button => { button.disabled = true; });
    saveContact();
    notify(exportWord ? '正在提交订单并生成 Word，请稍候……' : '正在提交订单，请稍候……');
    try {
      const files = await uploadFiles($('#cartAttachments')?.files || []);
      const result = await api('createOrder', {
        submissionMode: 'website_taobao_style_checkout',
        name,
        contactName: name,
        organization: $('#cartOrganization')?.value.trim() || '',
        phone,
        email,
        expectedDate: $('#cartExpectedDate')?.value || '',
        budget: $('#cartBudget')?.value.trim() || '',
        serviceType: '官网科研服务订单',
        projectName: `综合需求清单（${rows.length}项）`,
        description,
        items: rows.map(itemPayload),
        cartItems: rows.map(itemPayload),
        attachments: files,
        consentVersion: '2026-07-v921'
      });
      const businessNo = result.businessNo || result.demandNo || result.order?.demandNo || result.order?.orderNo || '';
      let downloadUrl = '';
      let exportNote = '';
      if (exportWord && businessNo) {
        const documentResult = await api('requestDocumentExport', { businessNo, format: 'docx' });
        downloadUrl = documentResult.downloadUrl || documentResult.url || '';
        exportNote = documentResult.message || '';
      }
      localStorage.removeItem(CART_KEY);
      renderCart();
      const download = downloadUrl ? `<a class="result-download" href="${escapeHtml(downloadUrl)}" target="_blank" rel="noopener">下载 Word 综合需求单</a>` : '';
      notify(`<div class="submit-success"><b>下单成功</b><span>业务编号：<strong>${escapeHtml(businessNo || '已生成')}</strong></span>${download}${exportNote && !downloadUrl ? `<small>${escapeHtml(exportNote)}</small>` : ''}</div>`);
      if (downloadUrl) window.open(downloadUrl, '_blank', 'noopener');
    } catch (error) {
      notify(escapeHtml(error.message), 'error');
    } finally {
      submitting = false;
      buttons.forEach(button => { button.disabled = false; });
    }
  }

  function bind() {
    $('#clearCartBtn')?.addEventListener('click', () => {
      if (!readCart().length || confirm('确定清空需求清单吗？')) writeCart([]);
    });
    $('#cartSubmitBtn')?.addEventListener('click', () => submitCart(false));
    $('#cartSubmitWordBtn')?.addEventListener('click', () => submitCart(true));
    $$('#cartContactName,#cartOrganization,#cartPhone,#cartEmail,#cartExpectedDate,#cartBudget,#cartDescription').forEach(node => {
      node.addEventListener('input', saveContact); node.addEventListener('change', saveContact);
    });
    $$('[data-view="cart"],[data-view-target="cart"],.header-cart').forEach(node => node.addEventListener('click', () => {
      renderCart(); window.setTimeout(loadProfile, 50);
    }));
    window.addEventListener('hashchange', () => { if (location.hash === '#cart') { renderCart(); loadProfile(); } });
    window.addEventListener('storage', event => { if (event.key === CART_KEY) renderCart(); });
    window.addEventListener('hqtd-cart-updated', renderCart);
  }

  restoreContact();
  bind();
  renderCart();
  if (location.hash === '#cart') window.setTimeout(loadProfile, 250);
})();
