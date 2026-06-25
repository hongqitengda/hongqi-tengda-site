(() => {
  "use strict";
  const state = {
    items: [], filtered: [], page: 1, perPage: 24,
    query: "", board: "", category: "", price: "", sort: "relevance", view: "grid"
  };
  const els = {
    search: document.getElementById("search-input"), clear: document.getElementById("clear-search"),
    board: document.getElementById("board-filter"), category: document.getElementById("category-filter"),
    price: document.getElementById("price-filter"), sort: document.getElementById("sort-filter"),
    reset: document.getElementById("reset-filters"), grid: document.getElementById("results-grid"),
    summary: document.getElementById("result-summary"), active: document.getElementById("active-filters"),
    pagination: document.getElementById("pagination"), empty: document.getElementById("empty-state"),
    gridView: document.getElementById("grid-view"), listView: document.getElementById("list-view"),
    total: document.getElementById("stat-total"), categories: document.getElementById("stat-categories"),
    modal: document.getElementById("item-modal"), modalContent: document.getElementById("modal-content")
  };

  const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
  const normalize = value => String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  const formatPrice = price => Number(price).toLocaleString("zh-CN", { maximumFractionDigits: 2 });
  const genericServices = new Set(["计算模拟分析服务","材料表征服务","分析检测服务","高端表征服务","生物实验服务","环境检测服务","数据分析服务","科研绘图服务"]);
  const displayName = item => genericServices.has(String(item.service || "")) ? (item.name || item.service) : (item.service || item.name);
  const debounce = (fn, delay = 180) => { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); }; };

  function searchScore(item, terms) {
    if (!terms.length) return 1;
    const service = normalize(displayName(item));
    const category = normalize(item.category);
    const details = normalize(item.details);
    const board = normalize(item.board);
    let score = 0;
    for (const term of terms) {
      if (!(service.includes(term) || category.includes(term) || details.includes(term) || board.includes(term) || normalize(item.name).includes(term))) return 0;
      if (service === term) score += 15;
      else if (service.startsWith(term)) score += 10;
      else if (service.includes(term)) score += 7;
      if (category.includes(term)) score += 4;
      if (details.includes(term)) score += 2;
      if (board.includes(term)) score += 1;
    }
    return score;
  }

  function parsePriceRange(value) {
    if (!value) return null;
    const [min, max] = value.split("-");
    return { min: Number(min || 0), max: max === "" ? Infinity : Number(max) };
  }

  function applyFilters(resetPage = true) {
    if (resetPage) state.page = 1;
    state.query = els.search.value.trim();
    state.board = els.board.value;
    state.category = els.category.value;
    state.price = els.price.value;
    state.sort = els.sort.value;
    els.clear.hidden = !state.query;
    const terms = normalize(state.query).split(" ").filter(Boolean);
    const range = parsePriceRange(state.price);
    state.filtered = state.items.map(item => ({ item, score: searchScore(item, terms) })).filter(({ item, score }) => {
      if (!score) return false;
      if (state.board && item.board !== state.board) return false;
      if (state.category && item.category !== state.category) return false;
      if (range && (Number(item.price) < range.min || Number(item.price) > range.max)) return false;
      return true;
    });
    const sorters = {
      relevance: (a,b) => b.score - a.score || a.item.board.localeCompare(b.item.board, "zh-CN") || a.item.service.localeCompare(b.item.service, "zh-CN"),
      "price-asc": (a,b) => Number(a.item.price) - Number(b.item.price),
      "price-desc": (a,b) => Number(b.item.price) - Number(a.item.price),
      name: (a,b) => a.item.service.localeCompare(b.item.service, "zh-CN")
    };
    state.filtered.sort(sorters[state.sort]);
    updateCategoryOptions();
    syncUrl();
    render();
  }

  function updateCategoryOptions() {
    const current = state.category;
    const categories = [...new Set(state.items.filter(item => !state.board || item.board === state.board).map(item => item.category).filter(Boolean))].sort((a,b) => a.localeCompare(b, "zh-CN"));
    els.category.innerHTML = '<option value="">全部分类</option>' + categories.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
    if (categories.includes(current)) els.category.value = current; else state.category = "";
  }

  function render() {
    const total = state.filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / state.perPage));
    if (state.page > totalPages) state.page = totalPages;
    const start = (state.page - 1) * state.perPage;
    const pageItems = state.filtered.slice(start, start + state.perPage).map(entry => entry.item);
    els.summary.innerHTML = total ? `共找到 <strong>${total.toLocaleString("zh-CN")}</strong> 项，当前显示第 ${start + 1}–${Math.min(start + state.perPage, total)} 项` : "未找到符合条件的项目";
    els.grid.classList.toggle("list", state.view === "list");
    els.grid.hidden = !total;
    els.empty.hidden = Boolean(total);
    els.grid.innerHTML = pageItems.map(cardHtml).join("");
    renderPagination(totalPages);
    renderActiveFilters();
    els.grid.querySelectorAll("[data-item-id]").forEach(button => button.addEventListener("click", () => openItem(button.dataset.itemId)));
  }

  function cardHtml(item) {
    return `<article class="result-card">
      <div class="result-top"><span class="board-tag">${escapeHtml(item.board)}</span><span class="item-id">${escapeHtml(item.id)}</span></div>
      <div><h2>${escapeHtml(displayName(item))}</h2><p class="result-category">${escapeHtml(item.category)}</p></div>
      <p class="result-detail">${escapeHtml(item.details || "请联系技术顾问确认具体规格与服务内容。")}</p>
      <div class="result-meta"><div><span>单位</span><strong>${escapeHtml(item.unit || "项")}</strong></div><div><span>预计周期</span><strong>${escapeHtml(item.cycle || "沟通确认")}</strong></div></div>
      <div class="result-bottom"><span class="price">¥${formatPrice(item.price)} <small>/ ${escapeHtml(item.unit || "项")}</small></span><button class="detail-button" type="button" data-item-id="${escapeHtml(item.id)}">查看与咨询</button></div>
    </article>`;
  }

  function renderPagination(totalPages) {
    if (totalPages <= 1) { els.pagination.innerHTML = ""; return; }
    const pages = new Set([1, totalPages, state.page - 2, state.page - 1, state.page, state.page + 1, state.page + 2]);
    const valid = [...pages].filter(page => page >= 1 && page <= totalPages).sort((a,b) => a-b);
    let html = `<button type="button" data-page="${state.page - 1}" ${state.page === 1 ? "disabled" : ""}>上一页</button>`;
    let prev = 0;
    valid.forEach(page => {
      if (prev && page - prev > 1) html += `<button type="button" disabled>…</button>`;
      html += `<button type="button" data-page="${page}" class="${page === state.page ? "active" : ""}" aria-current="${page === state.page ? "page" : "false"}">${page}</button>`;
      prev = page;
    });
    html += `<button type="button" data-page="${state.page + 1}" ${state.page === totalPages ? "disabled" : ""}>下一页</button>`;
    els.pagination.innerHTML = html;
    els.pagination.querySelectorAll("button[data-page]:not(:disabled)").forEach(button => button.addEventListener("click", () => {
      state.page = Number(button.dataset.page); render(); window.scrollTo({ top: document.querySelector(".results-toolbar").offsetTop - 90, behavior: "smooth" });
    }));
  }

  function renderActiveFilters() {
    const chips = [];
    if (state.query) chips.push(["query", `关键词：${state.query}`]);
    if (state.board) chips.push(["board", state.board]);
    if (state.category) chips.push(["category", state.category]);
    if (state.price) chips.push(["price", `价格：${els.price.selectedOptions[0].textContent}`]);
    els.active.innerHTML = chips.map(([key,label]) => `<span class="filter-chip">${escapeHtml(label)}<button type="button" data-remove="${key}" aria-label="移除${escapeHtml(label)}">×</button></span>`).join("");
    els.active.querySelectorAll("[data-remove]").forEach(button => button.addEventListener("click", () => {
      const key = button.dataset.remove;
      if (key === "query") els.search.value = "";
      if (key === "board") els.board.value = "";
      if (key === "category") els.category.value = "";
      if (key === "price") els.price.value = "";
      applyFilters();
    }));
  }

  function openItem(id) {
    const item = state.items.find(entry => entry.id === id);
    if (!item) return;
    const title = displayName(item);
    const subject = encodeURIComponent(`咨询项目：${title}（${item.id}）`);
    const body = encodeURIComponent(`您好，我想咨询以下项目：\n\n项目编号：${item.id}\n业务板块：${item.board}\n项目名称：${title}\n规格/内容：${item.details}\n参考价格：¥${formatPrice(item.price)} / ${item.unit}\n预计周期：${item.cycle}\n\n我的具体需求：`);
    els.modalContent.innerHTML = `<span class="modal-board">${escapeHtml(item.board)} · ${escapeHtml(item.id)}</span>
      <h2 id="modal-item-title">${escapeHtml(title)}</h2><p class="modal-category">${escapeHtml(item.category)}</p>
      <div class="modal-details">${escapeHtml(item.details || "请联系技术顾问确认具体规格与服务内容。")}</div>
      <div class="modal-info-grid"><div><span>参考报价</span><strong class="modal-price">¥${formatPrice(item.price)} / ${escapeHtml(item.unit || "项")}</strong></div><div><span>预计周期</span><strong>${escapeHtml(item.cycle || "沟通确认")}</strong></div><div><span>服务优先级</span><strong>${escapeHtml(item.priority || "常规")}</strong></div><div><span>项目编号</span><strong>${escapeHtml(item.id)}</strong></div></div>
      <div class="modal-actions"><a class="button" href="mailto:hongqi@tengda54.freeqiye.com?subject=${subject}&body=${body}">邮件询价</a><button class="button button-ghost" type="button" id="copy-item">复制项目信息</button></div><p class="copy-status" id="copy-status"></p>`;
    els.modal.hidden = false; document.body.classList.add("modal-open"); els.modal.querySelector(".modal-close")?.focus();
    document.getElementById("copy-item").addEventListener("click", async () => {
      const text = `项目编号：${item.id}\n业务板块：${item.board}\n项目名称：${title}\n规格/内容：${item.details}\n参考价格：¥${formatPrice(item.price)} / ${item.unit}\n预计周期：${item.cycle}`;
      const status = document.getElementById("copy-status");
      try { await navigator.clipboard.writeText(text); status.textContent = "项目信息已复制，可发送给企业微信顾问。"; }
      catch { status.textContent = "复制失败，请手动选择项目信息。"; }
    });
  }

  function closeModal() { els.modal.hidden = true; document.body.classList.remove("modal-open"); }
  els.modal.querySelectorAll("[data-close-modal]").forEach(el => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", event => { if (event.key === "Escape" && !els.modal.hidden) closeModal(); });

  function syncUrl() {
    const params = new URLSearchParams();
    if (state.query) params.set("q", state.query);
    if (state.board) params.set("board", state.board);
    if (state.category) params.set("category", state.category);
    if (state.price) params.set("price", state.price);
    if (state.sort !== "relevance") params.set("sort", state.sort);
    history.replaceState(null, "", `${location.pathname}${params.toString() ? `?${params}` : ""}`);
  }

  function hydrateFromUrl() {
    const params = new URLSearchParams(location.search);
    els.search.value = params.get("q") || "";
    els.board.value = params.get("board") || "";
    els.price.value = params.get("price") || "";
    els.sort.value = params.get("sort") || "relevance";
    state.category = params.get("category") || "";
  }

  const searchSubmit = document.getElementById("search-submit");
  if (searchSubmit) searchSubmit.addEventListener("click", () => applyFilters());
  els.search.addEventListener("keydown", event => { if (event.key === "Enter") applyFilters(); });
  els.search.addEventListener("input", debounce(() => applyFilters()));
  els.clear.addEventListener("click", () => { els.search.value = ""; applyFilters(); els.search.focus(); });
  [els.board, els.category, els.price, els.sort].forEach(el => el.addEventListener("change", () => applyFilters()));
  els.reset.addEventListener("click", () => { els.search.value = ""; els.board.value = ""; els.category.value = ""; els.price.value = ""; els.sort.value = "relevance"; applyFilters(); });
  document.querySelectorAll("[data-keyword]").forEach(button => button.addEventListener("click", () => { els.search.value = button.dataset.keyword; applyFilters(); }));
  els.gridView.addEventListener("click", () => { state.view = "grid"; els.gridView.classList.add("active"); els.listView.classList.remove("active"); render(); });
  els.listView.addEventListener("click", () => { state.view = "list"; els.listView.classList.add("active"); els.gridView.classList.remove("active"); render(); });

  Promise.all([
    fetch("assets/data/catalog.json").then(response => { if (!response.ok) throw new Error("项目数据加载失败"); return response.json(); }),
    fetch("assets/data/summary.json").then(response => response.json())
  ]).then(([items, summary]) => {
    state.items = items;
    els.total.textContent = Number(summary.total).toLocaleString("zh-CN");
    els.categories.textContent = summary.categories;
    const boards = [...new Set(items.map(item => item.board))];
    els.board.innerHTML += boards.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
    hydrateFromUrl();
    updateCategoryOptions();
    if (state.category) els.category.value = state.category;
    applyFilters(false);
  }).catch(error => {
    console.error(error); els.summary.textContent = "项目数据加载失败，请刷新页面或通过邮箱联系技术顾问。"; els.empty.hidden = false;
  });
})();
