(() => {
  'use strict';
  const KEY = 'hqtd_requirement_cart_v2';
  const list = document.getElementById('demandList');
  const summary = document.getElementById('demandSummary');

  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
  }
  function write(rows) {
    localStorage.setItem(KEY, JSON.stringify(rows));
    render();
  }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  const API_URL = 'https://cloud1-d3gji859l94c3e5ec-1447812542.ap-shanghai.app.tcloudbase.com/api/webPortal';
  const TOKEN_KEY = 'hqtd_token';
  const CONTACT_KEY = 'hqtd_quick_contact_v2';

  function savedContact() {
    try { return JSON.parse(localStorage.getItem(CONTACT_KEY) || '{}'); } catch (_) { return {}; }
  }

  async function submitSupplyOrder(rows, fields, options = {}) {
    const total = rows.reduce((sum, item) => sum + Number(item.qty || 1), 0);
    const suppliesOnly = Boolean(options.suppliesOnly);
    const serviceTypes = [...new Set(rows.map(item => item.serviceType || item.board || '').filter(Boolean))];
    const payload = {
      action: 'createOrder',
      name: fields.name,
      contact: fields.contact,
      phone: fields.contact,
      email: fields.email,
      organization: fields.organization,
      shippingAddress: fields.address,
      projectName: suppliesOnly
        ? `耗材采购（${rows.length}种）`
        : `综合需求（${rows.length}种项目）`,
      serviceType: suppliesOnly ? '耗材仪器' : (serviceTypes.length === 1 ? serviceTypes[0] : '综合服务'),
      category: suppliesOnly ? '耗材采购' : '科研服务',
      description: fields.note || (
        suppliesOnly
          ? `采购 ${rows.length} 种耗材，共 ${total} 件`
          : `提交 ${rows.length} 种科研服务项目，共 ${total} 项`
      ),
      detail: fields.note || '',
      cartItems: rows.map(item => ({
        id: item.id,
        title: item.title || item.name,
        name: item.title || item.name,
        qty: Number(item.qty || 1),
        unit: item.unit || '件',
        price: Number(item.price || 0),
        priceText: item.priceText || '待确认',
        category: item.category || '',
        specification: item.specification || item.spec || ''
      })),
      totalQuantity: total,
      itemTypeCount: rows.length,
      requestId: `web-supply-${Date.now()}-${Math.random().toString(36).slice(2,8)}`
    };
    const token = localStorage.getItem(TOKEN_KEY) || '';
    const response = await fetch(`${API_URL}?_ts=${Date.now()}`, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok || result.ok === false) throw new Error(result.message || '提交失败');
    return result;
  }

  function bindDirectSupplySubmit(rows, options = {}) {
    const button = document.getElementById('directSupplySubmit');
    const form = document.getElementById('directOrderForm');
    const cached = savedContact();
    button?.addEventListener('click', () => {
      form.hidden = false;
      document.getElementById('directName').value ||= cached.name || cached.contactName || '';
      document.getElementById('directContact').value ||= cached.contact || cached.phone || '';
      document.getElementById('directOrganization').value ||= cached.organization || '';
      document.getElementById('directEmail').value ||= cached.email || '';
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.getElementById('cancelDirectSubmit')?.addEventListener('click', () => { form.hidden = true; });
    document.getElementById('confirmDirectSubmit')?.addEventListener('click', async event => {
      const submit = event.currentTarget;
      const status = document.getElementById('directStatus');
      const fields = {
        name: document.getElementById('directName').value.trim(),
        contact: document.getElementById('directContact').value.trim(),
        organization: document.getElementById('directOrganization').value.trim(),
        email: document.getElementById('directEmail').value.trim(),
        address: document.getElementById('directAddress').value.trim(),
        note: document.getElementById('directNote').value.trim()
      };
      if (!fields.name || !fields.contact) {
        status.textContent = '请填写联系人和手机号/微信。';
        status.style.color = '#b42318';
        return;
      }
      submit.disabled = true;
      status.textContent = options.suppliesOnly ? '正在提交采购订单…' : '正在提交需求…';
      status.style.color = '#475569';
      try {
        const result = await submitSupplyOrder(rows, fields, options);
        localStorage.setItem(CONTACT_KEY, JSON.stringify(fields));
        localStorage.removeItem(KEY);
        status.textContent = `提交成功，业务编号：${result.businessNo || result.demandNo || '已生成'}`;
        status.style.color = '#08783e';
        setTimeout(render, 800);
      } catch (error) {
        status.textContent = error.message;
        status.style.color = '#b42318';
      } finally {
        submit.disabled = false;
      }
    });
  }

  function render() {
    const rows = read();
    if (!rows.length) {
      list.innerHTML = '<div class="empty"><strong>需求清单为空</strong><span>请先在 AI、计算模拟或分析表征项目页面填写需求并加入清单。</span></div>';
      summary.innerHTML = '<div class="summary"><span>当前没有待提交项目</span><div class="bottom-actions"><a class="btn primary" href="index.html">选择项目</a></div></div>';
      return;
    }
    list.innerHTML = rows.map((item, index) => `
      <article class="item">
        <div>
          <span class="code">${esc(item.id || item.serviceType || '项目')}</span>
          <strong class="name">${esc(item.title || item.name || '未命名项目')}</strong>
          <span class="desc">${esc(item.note || item.spec || item.category || '已保存项目需求')}</span>
        </div>
        <div class="actions"><div class="qty-stepper"><button type="button" data-minus="${index}">−</button><input type="number" min="1" max="999" value="${Number(item.qty || 1)}" data-qty="${index}"><button type="button" data-plus="${index}">＋</button></div><button class="remove" data-index="${index}">删除</button></div>
      </article>`).join('');
    list.querySelectorAll('[data-index]').forEach(button => {
      button.addEventListener('click', () => {
        const next = read();
        next.splice(Number(button.dataset.index), 1);
        write(next);
      });
    });
    const setQty = (index, value) => {
      const next = read();
      if (!next[index]) return;
      next[index].qty = Math.max(1, Math.min(999, Number(value || 1)));
      write(next);
    };
    list.querySelectorAll('[data-minus]').forEach(button => button.addEventListener('click', () => {
      const index = Number(button.dataset.minus); const rows = read(); setQty(index, Number(rows[index]?.qty || 1) - 1);
    }));
    list.querySelectorAll('[data-plus]').forEach(button => button.addEventListener('click', () => {
      const index = Number(button.dataset.plus); const rows = read(); setQty(index, Number(rows[index]?.qty || 1) + 1);
    }));
    list.querySelectorAll('[data-qty]').forEach(input => input.addEventListener('change', () => setQty(Number(input.dataset.qty), input.value)));
    const total = rows.reduce((sum, item) => sum + Number(item.qty || 1), 0);
    const suppliesOnly = rows.every(item => item.serviceType === '耗材仪器' || item.board === '耗材仪器' || /^HC-/.test(item.id || ''));
    const hasResearchServices = rows.some(item =>
      /^(AI|JS|FX)-/.test(item.id || '') ||
      ['AI项目','计算模拟','分析表征'].includes(item.serviceType || item.board)
    );
    summary.innerHTML = `
      <div class="summary">
        <b>共 ${rows.length} 种项目，${total} 项</b>
        <div class="bottom-actions">
          <button class="btn secondary" id="clearDemandList">清空</button>
          <button class="btn primary" id="directSupplySubmit">${suppliesOnly ? '直接提交采购订单' : '直接提交需求'}</button>
        </div>
      </div>
      <section class="direct-order" id="directOrderForm" hidden>
        <h3>${suppliesOnly ? '采购联系人' : '联系人及需求信息'}</h3>
        <p>${suppliesOnly
          ? '无需进入客户中心，在此填写后直接提交采购订单。'
          : 'AI、计算模拟和分析表征项目也可在当前清单直接提交，无需进入客户中心。'}</p>
        <div class="direct-grid">
          <label>联系人<input id="directName" maxlength="80" required></label>
          <label>手机号/微信<input id="directContact" maxlength="80" required></label>
          <label>单位<input id="directOrganization" maxlength="160"></label>
          <label>邮箱<input id="directEmail" type="email" maxlength="160"></label>
          <label class="full">收货地址<input id="directAddress" maxlength="300"></label>
          <label class="full">采购说明<textarea id="directNote" maxlength="2000" placeholder="品牌、规格、交期、开票等补充要求"></textarea></label>
        </div>
        <div class="bottom-actions" style="margin-top:14px">
          <button class="btn secondary" id="cancelDirectSubmit">取消</button>
          <button class="btn primary" id="confirmDirectSubmit">确认提交</button>
        </div>
        <div class="direct-status" id="directStatus"></div>
      </section>`;
    document.getElementById('clearDemandList').addEventListener('click', () => {
      if (confirm('确定清空需求清单吗？')) write([]);
    });
    bindDirectSupplySubmit(rows, { suppliesOnly, hasResearchServices });
  }
  window.addEventListener('storage', event => { if (event.key === KEY) render(); });
  render();
})();