(() => {
  'use strict';
  const KEY = 'hqtd_en_requirement_cart_v2';
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
  const CONTACT_KEY = 'hqtd_en_quick_contact_v2';

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
        ? `Procurement of consumables${rows.length}(specified)`
        : `Integrated needs (Multiple needs)${rows.length}projects)`,
      serviceType: suppliesOnly ? "Supplies & Instruments" : (serviceTypes.length === 1 ? serviceTypes[0] : "Integrated services"),
      category: suppliesOnly ? "Procurement of consumables" : "Scientific research services",
      description: fields.note || (
        suppliesOnly
          ? `Purchasing ${rows.length} Planting materials, all of them. ${total} piece`
          : `Submit ${rows.length} Science and research services, total ${total} projects`
      ),
      detail: fields.note || '',
      cartItems: rows.map(item => ({
        id: item.id,
        title: item.title || item.name,
        name: item.title || item.name,
        qty: Number(item.qty || 1),
        unit: item.unit || "piece",
        price: Number(item.price || 0),
        priceText: item.priceText || "Pending Confirmation",
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
      body: JSON.stringify(window.HQTDEnglish.toCanonical(payload))
    });
    const result = window.HQTDEnglish.fromBackend(await response.json());
    if (!response.ok || result.ok === false) throw new Error(result.message || "Failed to submit");
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
        status.textContent = "Please fill in your contact and cell number/wissmail..";
        status.style.color = '#b42318';
        return;
      }
      submit.disabled = true;
      status.textContent = options.suppliesOnly ? "Presenting purchase order..." : "Submiting demand...";
      status.style.color = '#475569';
      try {
        const result = await submitSupplyOrder(rows, fields, options);
        localStorage.setItem(CONTACT_KEY, JSON.stringify(fields));
        localStorage.removeItem(KEY);
        status.textContent = `Successful submission, practice number:${result.businessNo || result.demandNo || "Generated"}`;
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
      list.innerHTML = "<div class=\"empty\"><strong>The list of needs is empty</strong><span>Please add a list of needs to the AI, Calculating Simulations, Material Expressions or Environmental Detection Project page first..</span></div>";
      summary.innerHTML = "<div class=\"summary\"><span>No items currently pending submission</span><div class=\"bottom-actions\"><a class=\"btn primary\" href=\"index.html\">Select a Project</a></div></div>";
      return;
    }
    list.innerHTML = rows.map((item, index) => `
      <article class="item">
        <div>
          <span class="code">${esc(item.id || item.serviceType || "Project")}</span>
          <strong class="name">${esc(item.title || item.name || "Unnamed Item")}</strong>
          <span class="desc">${esc(item.note || item.spec || item.category || "Saved Project Needs")}</span>
        </div>
        <div class="actions"><div class="qty-stepper"><button type="button" data-minus="${index}">−</button><input type="number" min="1" max="999" value="${Number(item.qty || 1)}" data-qty="${index}"><button type="button" data-plus="${index}">＋</button></div><button class="remove" data-index="${index}">Delete</button></div>
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
    const suppliesOnly = rows.every(item => item.serviceType === "Supplies & Instruments" || item.board === "Supplies & Instruments" || /^HC-/.test(item.id || ''));
    const hasResearchServices = rows.some(item =>
      /^(AI|JS|FX)-/.test(item.id || '') ||
      ["AI Projects","Computational Simulation","Characterization & Testing","Material Characterization","Environmental Testing"].includes(item.serviceType || item.board)
    );
    summary.innerHTML = `
      <div class="summary">
        <b>Total ${rows.length} It's a kind of project.${total} projects</b>
        <div class="bottom-actions">
          <button class="btn secondary" id="clearDemandList">Clear</button>
          <button class="btn primary" id="directSupplySubmit">${suppliesOnly ? "Direct submission of purchase orders" : "Direct submission requirements"}</button>
        </div>
      </div>
      <section class="direct-order" id="directOrderForm" hidden>
        <h3>${suppliesOnly ? "Procurement contacts" : "Contacts and needs information"}</h3>
        <p>${suppliesOnly
          ? "Without entering the customer centre, submit the purchase order directly after completing this."
          : "AI, computing simulations, material representation and environmental detection projects can also be submitted directly to the current list without having to access customer centres."}</p>
        <div class="direct-grid">
          <label>Contact Name<input id="directName" maxlength="80" required></label>
          <label>Cell phone number/Weasel<input id="directContact" maxlength="80" required></label>
          <label>Unit<input id="directOrganization" maxlength="160"></label>
          <label>Email<input id="directEmail" type="email" maxlength="160"></label>
          <label class="full">Address of receipt<input id="directAddress" maxlength="300"></label>
          <label class="full">Supplementary explanation<textarea id="directNote" maxlength="2000" placeholder="Additional requirements such as branding, specifications, deadline, billing, etc."></textarea></label>
        </div>
        <div class="bottom-actions" style="margin-top:14px">
          <button class="btn secondary" id="cancelDirectSubmit">Cancel</button>
          <button class="btn primary" id="confirmDirectSubmit">Confirm the submission</button>
        </div>
        <div class="direct-status" id="directStatus"></div>
      </section>`;
    document.getElementById('clearDemandList').addEventListener('click', () => {
      if (confirm("Are you sure you need a clean-up list??")) write([]);
    });
    bindDirectSupplySubmit(rows, { suppliesOnly, hasResearchServices });
  }
  window.addEventListener('storage', event => { if (event.key === KEY) render(); });
  render();
})();