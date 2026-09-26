(() => {
  'use strict';

  const cfg = window.HQTD_CONFIG || {};
  const CART_KEY = 'hqtd_en_requirement_cart_v1';
  const CONTACT_KEY = 'hqtd_en_cart_contact_v1';
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
    data = window.HQTDEnglish.toCanonical(data);
    if (!cfg.WEB_PORTAL_URL) throw new Error("The network business interface is not yet configured");
    const response = await fetch(cfg.WEB_PORTAL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token() ? { Authorization: `Bearer ${token()}` } : {})
      },
      body: JSON.stringify({ action, ...data })
    });
    const rawResult = await response.json().catch(() => ({ ok: false, message: "Interface returned an error in format" }));
    const result = window.HQTDEnglish.fromBackend(rawResult);
    if (!response.ok || result.ok === false) throw new Error(result.message || result.error || `Request Failed (${response.status}）`);
    return result;
  }

  function notify(text, type = 'status') {
    const box = $('#cartMessage');
    if (box) box.innerHTML = text ? `<div class="${type}">${text}</div>` : '';
  }

  function formatMoney(value) {
    return `¥${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
      container.innerHTML = "<div class=\"empty-state cart-empty\"><b>The list of needs is empty</b><span>Click Add to the Needs List or List Immediately from a specific item page.</span><a class=\"btn btn-primary\" href=\"../catalog.html\">Find Items</a></div>";
      $('#cartSummary').textContent = "Total 0 projects";
      return;
    }
    container.innerHTML = rows.map((item, index) => {
      const price = Number(item.price || 0);
      const detail = rowDetails(item);
      return `<article class="cart-item" data-cart-key="${escapeHtml(item.cartKey || `${item.id}-${index}`)}">
        <div class="cart-item-main">
          <span class="cart-item-type">${escapeHtml(item.serviceType || item.board || "Scientific research services")}</span>
          <h3>${escapeHtml(item.name || item.title || "Unnamed Item")}</h3>
          <p>${escapeHtml(item.id || item.projectId || '')}${detail ? `｜${escapeHtml(detail)}` : ''}</p>
          <label><span>Additional requests</span><textarea data-cart-note placeholder="For example: number of structures, number of samples, delivery documents, precision of calculation, etc.">${escapeHtml(item.note || '')}</textarea></label>
        </div>
        <div class="cart-item-side">
          <b>${price > 0 ? formatMoney(price) : "To Be Assessed"}</b>
          <label><span>Quantity</span><input data-cart-qty type="number" min="1" max="999" value="${Math.max(1, Number(item.qty || 1))}"></label>
          <button data-cart-remove type="button">Delete</button>
        </div>
      </article>`;
    }).join('');
    const priced = rows.reduce((sum, item) => sum + Number(item.price || 0) * Math.max(1, Number(item.qty || 1)), 0);
    const inquiry = rows.filter(item => Number(item.price || 0) <= 0).length;
    $('#cartSummary').textContent = `Total ${rows.length} Projects${priced ? `| Subtotal, reference ${formatMoney(priced)}` : ''}${inquiry ? `｜${inquiry} Items to be assessed` : ''}`;

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
    if (file.size > 5 * 1024 * 1024) throw new Error(`${file.name} More than 5 MB`);
    notify(`Uploading attachments ${index + 1}/${total}：${escapeHtml(file.name)}`);
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
    const rawResult = await response.json().catch(() => ({ ok: false, message: "Attachment upload interface returned format error" }));
    const result = window.HQTDEnglish.fromBackend(rawResult);
    if (!response.ok || result.ok === false) throw new Error(result.message || `${file.name} Upload failed`);
    return result.file || result;
  }

  async function uploadFiles(files) {
    const list = [...files];
    if (list.length > 10) throw new Error("Upload a maximum of 10 attachments at a time");
    const result = [];
    for (let i = 0; i < list.length; i += 1) result.push(await uploadOne(list[i], i, list.length));
    return result;
  }

  function itemPayload(item) {
    const optionText = rowDetails(item);
    return {
      id: item.id || item.projectId || '', title: item.name || item.title || '', name: item.name || item.title || '',
      board: item.board || item.serviceType || '', category: item.category || '', serviceType: item.serviceType || item.board || '',
      qty: Math.max(1, Number(item.qty || 1)), price: Math.max(0, Number(item.price || 0)), unit: item.unit || "projects",
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
    if (!rows.length) return notify("Please add at least one item.", 'error');
    if (!name) return notify("Please enter a contact name.", 'error');
    if (!phone && !email) return notify("Please provide a phone number or email address.", 'error');
    if (!description) return notify("Please complete the overall research objectives or additional information.", 'error');
    if (!$('#cartConsent')?.checked) return notify("Please confirm the precise requirements and contact details.", 'error');
    if (!token()) return notify("Please log in or register a client account and then submit an order.", 'error');

    submitting = true;
    const buttons = [$('#cartSubmitBtn'), $('#cartSubmitWordBtn')].filter(Boolean);
    buttons.forEach(button => { button.disabled = true; });
    saveContact();
    notify(exportWord ? "Submiting an order and generating Word, please wait..." : "Could not close temporary folder: %s");
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
        serviceType: "Service orders for online scientific research",
        projectName: `Consolidated list of needs${rows.length}item)`,
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
      const download = downloadUrl ? `<a class="result-download" href="${escapeHtml(downloadUrl)}" target="_blank" rel="noopener"> Download Word Consolidated request list</a>` : '';
      notify(`<div class="submit-success"><b>Next report successful.</b><span>Operational designator:<strong>${escapeHtml(businessNo || "Generated")}</strong></span>${download}${exportNote && !downloadUrl ? `<small>${escapeHtml(exportNote)}</small>` : ''}</div>`);
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
      if (!readCart().length || confirm("Are you sure you need a clean-up list??")) writeCart([]);
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
