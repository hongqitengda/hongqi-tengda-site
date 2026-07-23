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
    summary.innerHTML = `
      <div class="summary">
        <b>共 ${rows.length} 种项目，${total} 项</b>
        <div class="bottom-actions">
          <button class="btn secondary" id="clearDemandList">清空</button>
          <a class="btn primary" href="customer-portal/index.html">进入客户中心提交</a>
        </div>
      </div>`;
    document.getElementById('clearDemandList').addEventListener('click', () => {
      if (confirm('确定清空需求清单吗？')) write([]);
    });
  }
  window.addEventListener('storage', event => { if (event.key === KEY) render(); });
  render();
})();