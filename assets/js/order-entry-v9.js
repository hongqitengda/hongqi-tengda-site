(() => {
  'use strict';

  const path = location.pathname;
  if (!/\/project\//.test(path) || document.querySelector('.hqtd-project-order-bar')) return;

  const CART_KEY = 'hqtd_requirement_cart_v1';
  const match = path.match(/\/([a-z]+-\d+)\.html/i);
  const projectId = match ? match[1].toUpperCase() : '';
  const title = (document.querySelector('h1')?.textContent || document.title || '当前项目').trim();
  const category = (document.querySelector('.category-name, .project-category, [data-category]')?.textContent || '').trim();
  const serviceType = projectId.startsWith('AI-') ? 'AI项目'
    : projectId.startsWith('JS-') ? '计算模拟'
      : projectId.startsWith('FX-') ? '分析表征'
        : projectId.startsWith('HC-') ? '耗材仪器' : '';

  const params = new URLSearchParams({ serviceType, project: title, projectId });
  const singleUrl = `../customer-portal/index.html?${params.toString()}#submit`;
  const cartUrl = '../customer-portal/index.html#cart';

  const bar = document.createElement('aside');
  bar.className = 'hqtd-project-order-bar';
  bar.setAttribute('aria-label', '项目下单入口');
  bar.innerHTML = `
    <div class="hqtd-project-order-copy">
      <small>当前项目</small>
      <strong>${escapeHtml(title)}</strong>
      <span>科研服务先下单，技术评估后确认报价</span>
    </div>
    <button class="hqtd-project-cart-add" type="button">加入需求清单</button>
    <button class="hqtd-project-buy-now" type="button">立即下单</button>
    <a class="hqtd-project-cart-link" href="${cartUrl}" aria-label="打开需求清单">需求清单 <b data-cart-count>0</b></a>`;
  document.body.appendChild(bar);

  const toast = document.createElement('div');
  toast.className = 'hqtd-cart-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.appendChild(toast);

  function readCart() {
    try {
      const rows = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return Array.isArray(rows) ? rows.slice(0, 30) : [];
    } catch (_) { return []; }
  }

  function currentItem() {
    return {
      cartKey: `${projectId || title}-${Date.now()}`,
      id: projectId,
      projectId,
      name: title,
      title,
      serviceType,
      board: serviceType,
      category,
      qty: 1,
      price: 0,
      unit: '项',
      note: '',
      quickOptions: {},
      advancedOptions: {},
      addedAt: new Date().toISOString(),
      sourceUrl: location.href
    };
  }

  function addCurrent({ redirect = false } = {}) {
    const rows = readCart();
    const key = projectId || title;
    const found = rows.find(item => String(item.id || item.projectId || item.name) === key);
    if (!found) rows.push(currentItem());
    localStorage.setItem(CART_KEY, JSON.stringify(rows.slice(0, 30)));
    updateCount();
    window.dispatchEvent(new CustomEvent('hqtd-cart-updated'));
    if (redirect) {
      location.href = cartUrl;
      return;
    }
    showToast(found ? '该项目已在需求清单中' : '已加入需求清单，可继续选择其他项目');
  }

  function updateCount() {
    const count = readCart().length;
    document.querySelectorAll('[data-cart-count]').forEach(node => { node.textContent = String(count); });
  }

  function showToast(text) {
    toast.textContent = text;
    toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2200);
  }

  bar.querySelector('.hqtd-project-cart-add').addEventListener('click', () => addCurrent());
  bar.querySelector('.hqtd-project-buy-now').addEventListener('click', () => addCurrent({ redirect: true }));
  bar.querySelector('.hqtd-project-order-copy').addEventListener('dblclick', () => { location.href = singleUrl; });

  window.addEventListener('storage', event => { if (event.key === CART_KEY) updateCount(); });
  updateCount();

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }
})();
