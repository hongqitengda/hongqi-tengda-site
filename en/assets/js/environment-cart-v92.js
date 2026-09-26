(() => {
  'use strict';
  const KEY = 'hqtd_en_requirement_cart_v2';

  function read() {
    try {
      const rows = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(rows) ? rows : [];
    } catch (_) { return []; }
  }
  function write(rows) {
    localStorage.setItem(KEY, JSON.stringify(rows.slice(0, 100)));
    updateCount();
    window.dispatchEvent(new CustomEvent('hqtd-cart-updated'));
  }
  function safe(value) { return String(value == null ? '' : value); }
  function add(item) {
    const rows = read();
    const id = safe(item.id || item.cartKey || item.title || item.name);
    const found = rows.find(row => safe(row.id) === id && safe(row.serviceType || row.board) === safe(item.serviceType || item.board));
    if (found) {
      found.qty = Math.min(999, Number(found.qty || 1) + Number(item.qty || 1));
    } else {
      rows.push({
        id,
        title: item.title || item.name || id,
        name: item.title || item.name || id,
        serviceType: item.serviceType || item.board || "Environmental Testing",
        board: item.board || item.serviceType || "Environmental Testing",
        category: item.category || '',
        qty: Number(item.qty || 1),
        unit: item.unit || "projects",
        price: Number(item.price || 0),
        priceText: item.priceText || "To Be Assessed",
        spec: item.spec || item.specification || '',
        note: item.note || '',
        details: item.details || {},
        sourceUrl: item.sourceUrl || location.href,
        cartKey: item.cartKey || `${id}-${Date.now()}`
      });
    }
    write(rows);
    toast(found ? "Consolidated to list of needs" : "Added to the list of needs");
  }
  function count() { return read().reduce((sum, row) => sum + Number(row.qty || 1), 0); }
  function updateCount() {
    const n = count();
    document.querySelectorAll('[data-env-cart-count]').forEach(el => { el.textContent = String(n); });
    const dock = document.querySelector('[data-env-cart-dock]');
    if (dock) dock.hidden = n === 0;
  }
  function toast(message) {
    let el = document.querySelector('.hqtd-env-cart-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'hqtd-env-cart-toast';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 1800);
  }
  function ensureDock() {
    if (document.querySelector('[data-env-cart-dock]')) { updateCount(); return; }
    const dock = document.createElement('a');
    dock.href = 'demand-list.html';
    dock.className = 'hqtd-env-cart-dock';
    dock.setAttribute('data-env-cart-dock', '');
    dock.innerHTML = "<span>Request List</span><b data-env-cart-count>0</b>";
    document.body.appendChild(dock);
    updateCount();
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-env-cart-item]');
    if (!button) return;
    event.preventDefault();
    let item = {};
    try { item = JSON.parse(button.dataset.envCartItem || '{}'); } catch (_) {}
    if (!item.id) return;
    add(item);
    button.classList.add('added');
    const old = button.textContent;
    button.textContent = "We're on the list.";
    setTimeout(() => { button.textContent = old; button.classList.remove('added'); }, 1500);
  });

  window.HQTDEnvCart = { add, read, write, count, updateCount, ensureDock };
  window.addEventListener('storage', event => { if (event.key === KEY) updateCount(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureDock, { once: true }); else ensureDock();
})();
