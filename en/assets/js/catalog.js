(() => {
  "use strict";
  const state = { items: [], filtered: [], page: 1, perPage: 24, query: "", board: "", category: "", price: "", sort: "relevance", view: "grid" };
  const els = {
    search: document.getElementById("search-input"), clear: document.getElementById("clear-search"),
    board: document.getElementById("board-filter"), category: document.getElementById("category-filter"),
    price: document.getElementById("price-filter"), sort: document.getElementById("sort-filter"),
    reset: document.getElementById("reset-filters"), grid: document.getElementById("results-grid"),
    summary: document.getElementById("result-summary"), active: document.getElementById("active-filters"),
    pagination: document.getElementById("pagination"), empty: document.getElementById("empty-state"),
    gridView: document.getElementById("grid-view"), listView: document.getElementById("list-view")
  };
  const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
  const normalize = value => String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  const priceLabel = item => item.priceText || (typeof item.price === "number" ? `¥${Number(item.price).toLocaleString("en-US")}` : "Price on Request");
  const debounce = (fn, delay = 160) => { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); }; };
  const initialParams = new URLSearchParams(window.location.search);
  function inlineItems() {
    const node = document.getElementById("catalog-data");
    if (!node) return null;
    try {
      const payload = JSON.parse(node.textContent || "{}");
      return Array.isArray(payload) ? payload : payload.items;
    } catch (error) {
      console.warn("Inline catalog data parse failed", error);
      return null;
    }
  }
  function searchScore(item, terms) { return window.HQTDSearch.score(item, terms.join(' ')); }
  function parsePriceRange(value) {
    if (!value) return null;
    if (value === "quote") return { quote: true };
    const [min, max] = value.split("-");
    return { min: Number(min || 0), max: max === "" ? Infinity : Number(max) };
  }
  function updateCategoryOptions() {
    const current = els.category.value || state.category;
    const categories = [...new Set(state.items.filter(item => !state.board || item.board === state.board).map(item => item.category).filter(Boolean))].sort((a,b) => a.localeCompare(b, "en-US"));
    els.category.innerHTML = "<option value=\"\">All Categories</option>" + categories.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
    if (categories.includes(current)) els.category.value = current;
  }
  function applyFilters(resetPage = true, preferState = false) {
    if (resetPage) state.page = 1;
    state.query = els.search.value.trim() || (preferState ? state.query : "");
    state.board = els.board.value || (preferState ? state.board : "");
    state.category = els.category.value || (preferState ? state.category : "");
    state.price = els.price.value || (preferState ? state.price : "");
    state.sort = els.sort.value || (preferState ? state.sort : "relevance");
    if (preferState) {
      if (state.board && els.board.value !== state.board) els.board.value = state.board;
      if (state.price && els.price.value !== state.price) els.price.value = state.price;
      if (state.sort && els.sort.value !== state.sort) els.sort.value = state.sort;
    }
    els.clear.hidden = !state.query;
    const terms = normalize(state.query).split(" ").filter(Boolean);
    const range = parsePriceRange(state.price);
    state.filtered = state.items.map(item => ({ item, score: searchScore(item, terms) })).filter(({ item, score }) => {
      if (!score) return false;
      if (state.board && item.board !== state.board) return false;
      if (state.category && item.category !== state.category) return false;
      if (range?.quote) return item.price === null || item.price === undefined;
      if (range && (item.price === null || item.price === undefined || Number(item.price) < range.min || Number(item.price) > range.max)) return false;
      return true;
    });
    const sorters = {
      relevance: (a,b) => b.score - a.score || a.item.board.localeCompare(b.item.board, "en-US") || a.item.service.localeCompare(b.item.service, "en-US"),
      "price-asc": (a,b) => (a.item.price ?? Infinity) - (b.item.price ?? Infinity),
      "price-desc": (a,b) => (b.item.price ?? -1) - (a.item.price ?? -1),
      name: (a,b) => a.item.service.localeCompare(b.item.service, "en-US")
    };
    state.filtered.sort(sorters[state.sort]);
    updateCategoryOptions();
    syncUrl();
    render();
  }
  function cardHtml(item) {
    return `<article class="result-card hqt-result-card">
      ${item.image ? `<a class="result-media" href="${escapeHtml(item.detailUrl)}"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt || item.service)}" loading="lazy" width="640" height="360"></a>` : `<a class="result-media result-media-placeholder" href="${escapeHtml(item.detailUrl)}"aria-label="${escapeHtml(item.service)}Details.<span>${escapeHtml(item.id)}</span></a>`}
      <div class="result-top"><span class="board-tag">${escapeHtml(item.board)}</span><span class="item-id">${escapeHtml(item.id)}</span></div>
      <div class="result-main"><h2><a class="result-title-link" href="${escapeHtml(item.detailUrl)}">${escapeHtml(item.service)}</a></h2><p class="result-category"><a href="${escapeHtml(item.categoryUrl)}">${escapeHtml(item.category)}</a></p></div>
      <div class="result-description"><p class="result-detail">${escapeHtml(item.details || "Please contact the consultant to confirm the specifications and service content..")}</p></div>
      <div class="result-meta"><div><span>Unit</span><strong>${escapeHtml(item.unit || "projects")}</strong></div><div><span>Estimated Lead Time</span><strong>${escapeHtml(item.cycle || "To Be Confirmed")}</strong></div></div>
      <div class="result-bottom"><span class="price">${escapeHtml(priceLabel(item))} <small>/ ${escapeHtml(item.unit || "projects")}</small></span><div class="result-card-actions"><a class="detail-page-button" href="${escapeHtml(item.detailUrl)}"''Detail Page</a></div></div>
    </article>`;
  }
  function render() {
    const total = state.filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / state.perPage));
    if (state.page > totalPages) state.page = totalPages;
    const start = (state.page - 1) * state.perPage;
    const pageItems = state.filtered.slice(start, start + state.perPage).map(entry => entry.item);
    els.summary.innerHTML = total ? `Found  <strong>${total.toLocaleString("en-US")}</strong>  results; showing  ${start + 1}-${Math.min(start + state.perPage, total)} projects` : "No matching projects found";
    els.grid.classList.toggle("list", state.view === "list");
    els.grid.hidden = !total;
    els.empty.hidden = Boolean(total);
    els.grid.innerHTML = pageItems.map(cardHtml).join("");
    renderPagination(totalPages);
    renderActiveFilters();
  }
  function renderPagination(totalPages) {
    if (totalPages <= 1) { els.pagination.innerHTML = ""; return; }
    const pages = new Set([1, totalPages, state.page - 2, state.page - 1, state.page, state.page + 1, state.page + 2]);
    const valid = [...pages].filter(page => page >= 1 && page <= totalPages).sort((a,b) => a-b);
    let html = `<button type="button" data-page="${state.page - 1}" ${state.page === 1 ? "disabled" : ""}> Previous Page</button>`;
    let prev = 0;
    valid.forEach(page => {
      if (prev && page - prev > 1) html += `<button type="button" disabled>...</button>`;
      html += `<button type="button" data-page="${page}" class="${page === state.page ? "active" : ""}" aria-current="${page === state.page ? "page" : "false"}">${page}</button>`;
      prev = page;
    });
    html += `<button type="button" data-page="${state.page + 1}" ${state.page === totalPages ? "disabled" : ""}> Next Page</button>`;
    els.pagination.innerHTML = html;
    els.pagination.querySelectorAll("button[data-page]:not(:disabled)").forEach(button => button.addEventListener("click", () => {
      state.page = Number(button.dataset.page); render(); window.scrollTo({ top: document.querySelector(".results-toolbar").offsetTop - 90, behavior: "smooth" });
    }));
  }
  function renderActiveFilters() {
    const chips = [];
    if (state.query) chips.push(["query", `Keywords: ${state.query}`]);
    if (state.board) chips.push(["board", state.board]);
    if (state.category) chips.push(["category", state.category]);
    if (state.price) chips.push(["price", `Price:${els.price.selectedOptions[0].textContent}`]);
    els.active.innerHTML = chips.map(([key,label]) => `<span class="filter-chip">${escapeHtml(label)}<button type="button" data-remove="${key}"aria-label=" Remove${escapeHtml(label)}">×</button></span>`).join("");
    els.active.querySelectorAll("[data-remove]").forEach(button => button.addEventListener("click", () => {
      const key = button.dataset.remove;
      if (key === "query") els.search.value = "";
      if (key === "board") els.board.value = "";
      if (key === "category") els.category.value = "";
      if (key === "price") els.price.value = "";
      applyFilters();
    }));
  }
  function syncUrl() {
    const params = new URLSearchParams();
    if (state.query) params.set("q", state.query);
    if (state.board) params.set("board", state.board);
    if (state.category) params.set("category", state.category);
    if (state.price) params.set("price", state.price);
    if (state.sort !== "relevance") params.set("sort", state.sort);
    try { history.replaceState(null, "", `${location.pathname}${params.toString() ? `?${params}` : ""}`); } catch (error) {}
  }
  function hydrateFromUrl() {
    els.search.value = initialParams.get("q") || "";
    state.board = initialParams.get("board") || "";
    state.category = initialParams.get("category") || "";
    els.price.value = initialParams.get("price") || "";
    els.sort.value = initialParams.get("sort") || "relevance";
  }
  function boot(items) {
    state.items = Array.isArray(items) ? items : [];
    const boards = [...new Set(state.items.map(item => item.board))];
    els.board.innerHTML += boards.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
    hydrateFromUrl();
    if (state.board) els.board.value = state.board;
    updateCategoryOptions();
    if (state.category) els.category.value = state.category;
    applyFilters(false, true);
  }
  document.getElementById("search-submit")?.addEventListener("click", () => applyFilters());
  els.search.addEventListener("keydown", event => { if (event.key === "Enter") applyFilters(); });
  els.search.addEventListener("input", debounce(() => applyFilters()));
  els.clear.addEventListener("click", () => { els.search.value = ""; applyFilters(); els.search.focus(); });
  [els.board, els.category, els.price, els.sort].forEach(el => el.addEventListener("change", () => applyFilters()));
  els.reset.addEventListener("click", () => { els.search.value = ""; els.board.value = ""; els.category.value = ""; els.price.value = ""; els.sort.value = "relevance"; applyFilters(); });
  els.gridView.addEventListener("click", () => { state.view = "grid"; els.gridView.classList.add("active"); els.listView.classList.remove("active"); render(); });
  els.listView.addEventListener("click", () => { state.view = "list"; els.listView.classList.add("active"); els.gridView.classList.remove("active"); render(); });
  const embedded = inlineItems();
  if (embedded?.length) {
    boot(embedded);
  } else {
    fetch("/en/assets/data/catalog.json?v=20260719-contact-catalog-final")
      .then(response => { if (!response.ok) throw new Error("Failed to load project data"); return response.json(); })
      .then(boot)
      .catch(error => {
        console.error(error);
        els.summary.textContent = "Failed to load the project data. Please update the page or contact the technical adviser via mailbox.";
        els.empty.hidden = false;
      });
  }
})();