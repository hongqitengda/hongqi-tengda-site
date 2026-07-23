(() => {
'use strict';

const data = (window.HQTD_CATALOG_DATA || []).filter(item => item.board === '耗材仪器');
const cards = [...document.querySelectorAll('[data-supply-category]')];
const panel = document.getElementById('supply-category-projects');
const title = document.getElementById('supply-category-title');
const count = document.getElementById('supply-category-count');
const grid = document.getElementById('supply-category-results');
const search = document.getElementById('supply-category-search');
const more = document.getElementById('supply-category-more');
const allLink = document.getElementById('supply-category-all-link');

if (!cards.length || !panel || !grid) return;

const CART_KEY = 'hqtd_requirement_cart_v2';
const STATE_KEY = 'hqtd_supplies_directory_state_v1164';
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const norm = value => String(value ?? '')
  .normalize('NFKC')
  .toLowerCase()
  .replace(/[\s·•_—–\-\/\\（）()【】\[\]，,、；;：:'"“”‘’.]+/g, '');

let category = '';
let rows = [];
let shown = 18;
let selected = {};

const bar = document.createElement('div');
bar.className = 'hqtd-batch-bar';
bar.innerHTML = `
  <div>
    <strong>采购清单</strong>
    <span data-batch-summary>已选 0 种 / 0 件</span>
  </div>
  <button type="button" data-batch-clear>清空</button>
  <button type="button" class="secondary" data-batch-add>加入清单</button>
  <a class="primary" href="../demand-list.html" data-open-cart>查看清单</a>
`;
document.body.appendChild(bar);

const toast = document.createElement('div');
toast.className = 'hqtd-inline-toast';
toast.hidden = true;
document.body.appendChild(toast);

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { toast.hidden = true; }, 2200);
}

function saveState(extra = {}) {
  sessionStorage.setItem(STATE_KEY, JSON.stringify({
    category,
    keyword: search ? search.value : '',
    shown,
    scrollY: window.scrollY,
    ...extra
  }));
}

function restoreState() {
  try {
    return JSON.parse(sessionStorage.getItem(STATE_KEY) || '{}');
  } catch (_) {
    return {};
  }
}

function itemCard(item) {
  const qty = Number(selected[item.id] || 0);
  return `
    <article class="supply-project-card batch-card" data-id="${esc(item.id)}">
      <div>
        <span>${esc(item.id)}</span>
        <strong>${esc(item.service)}</strong>
        <small>${esc(item.details || item.category)}</small>
      </div>
      <div class="supply-project-meta">
        <span>${esc(item.priceText || (item.price == null ? '面议' : `¥${item.price}`))} / ${esc(item.unit || '项')}</span>
        <div class="batch-stepper">
          <button type="button" data-minus aria-label="减少数量">−</button>
          <input type="number" min="0" max="999" value="${qty}" data-qty aria-label="采购数量">
          <button type="button" data-plus aria-label="增加数量">＋</button>
        </div>
        <a href="${esc(item.detailUrl)}" data-detail-link>详情</a>
      </div>
    </article>
  `;
}

function updateBar() {
  const values = Object.values(selected).map(Number).filter(value => value > 0);
  const localCart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  const cartQty = localCart
    .filter(item => item.serviceType === '耗材仪器')
    .reduce((sum, item) => sum + Number(item.qty || 0), 0);

  bar.querySelector('[data-batch-summary]').textContent =
    values.length
      ? `本页已选 ${values.length} 种 / ${values.reduce((a, b) => a + b, 0)} 件`
      : `清单内共 ${cartQty} 件`;

  bar.classList.add('show');
}

function bindRows() {
  grid.querySelectorAll('.batch-card').forEach(card => {
    const id = card.dataset.id;
    const input = card.querySelector('[data-qty]');

    const setQty = next => {
      const qty = Math.max(0, Math.min(999, Number(next) || 0));
      input.value = qty;
      if (qty) selected[id] = qty;
      else delete selected[id];
      updateBar();
    };

    card.querySelector('[data-minus]').addEventListener('click', () => setQty(Number(input.value) - 1));
    card.querySelector('[data-plus]').addEventListener('click', () => setQty(Number(input.value) + 1));
    input.addEventListener('change', () => setQty(input.value));

    const detail = card.querySelector('[data-detail-link]');
    detail.addEventListener('click', () => {
      saveState({ returnPending: true });
    });
  });
}

function render() {
  const keyword = norm(search.value);
  const filtered = rows.filter(item =>
    !keyword || norm([item.id, item.service, item.details, item.category].join(' ')).includes(keyword)
  );

  grid.innerHTML = filtered.slice(0, shown).map(itemCard).join('');
  bindRows();

  count.textContent = `${filtered.length} 项`;
  more.hidden = filtered.length <= shown;
  allLink.href = '../catalog.html?' + new URLSearchParams({
    board: '耗材仪器',
    category
  }).toString();

  if (!filtered.length) {
    grid.innerHTML = '<div class="supply-no-result">当前关键词没有匹配项目，可调整关键词或联系耗材顾问。</div>';
  }
}

function openCategory(cat, source, options = {}) {
  category = cat;
  rows = data.filter(item => norm(item.category) === norm(cat));
  shown = Number(options.shown || 18);
  search.value = options.keyword || '';
  title.textContent = cat;

  cards.forEach(card => {
    const active = norm(card.dataset.supplyCategory) === norm(cat);
    card.classList.toggle('active', active);
    card.setAttribute('aria-expanded', String(active));
  });

  panel.hidden = false;
  render();

  if (options.restoreScroll) {
    requestAnimationFrame(() => {
      window.scrollTo({ top: Number(options.scrollY || 0), behavior: 'auto' });
    });
  } else {
    setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }
}

bar.querySelector('[data-batch-clear]').addEventListener('click', () => {
  selected = {};
  render();
  updateBar();
});

bar.querySelector('[data-batch-add]').addEventListener('click', () => {
  const current = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  let addedKinds = 0;
  let addedQty = 0;

  Object.entries(selected).forEach(([id, qty]) => {
    const item = data.find(row => row.id === id);
    if (!item) return;

    const existing = current.find(row => row.id === id && row.serviceType === '耗材仪器');
    if (existing) {
      existing.qty = Math.min(999, Number(existing.qty || 0) + Number(qty));
    } else {
      current.push({
        id,
        title: item.service,
        name: item.service,
        serviceType: '耗材仪器',
        board: '耗材仪器',
        category: item.category || '',
        qty: Number(qty),
        unit: item.unit || '件',
        price: Number(item.price || 0),
        priceText: item.priceText || '待评估',
        note: '批量采购',
        details: {},
        cartKey: `${id}-${Date.now()}`
      });
    }

    addedKinds += 1;
    addedQty += Number(qty);
  });

  if (!addedKinds) {
    showToast('请先选择商品数量');
    return;
  }

  localStorage.setItem(CART_KEY, JSON.stringify(current));
  selected = {};
  render();
  updateBar();
  showToast(`已加入采购清单：${addedKinds} 种，共 ${addedQty} 件`);
});

cards.forEach(card => card.addEventListener('click', event => {
  event.preventDefault();
  openCategory(card.dataset.supplyCategory, card);
}));

search.addEventListener('input', () => {
  shown = 18;
  render();
  saveState();
});

more.addEventListener('click', () => {
  shown += 18;
  render();
  saveState();
});

window.addEventListener('pagehide', () => saveState());
window.addEventListener('pageshow', event => {
  const state = restoreState();
  if (state.category) {
    openCategory(state.category, null, {
      keyword: state.keyword,
      shown: state.shown,
      scrollY: state.scrollY,
      restoreScroll: event.persisted || state.returnPending
    });
    sessionStorage.setItem(STATE_KEY, JSON.stringify({ ...state, returnPending: false }));
  } else {
    updateBar();
  }
});

const initialState = restoreState();
if (initialState.category) {
  openCategory(initialState.category, null, {
    keyword: initialState.keyword,
    shown: initialState.shown,
    scrollY: initialState.scrollY,
    restoreScroll: Boolean(initialState.returnPending)
  });
} else {
  updateBar();
}
})();