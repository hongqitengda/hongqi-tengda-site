(() => {
  "use strict";

  const copyFallback = text => {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    el.remove();
  };

  document.querySelectorAll("[data-copy-project]").forEach(button => button.addEventListener("click", async () => {
    const status = document.querySelector("[data-copy-status]");
    try {
      const text = button.dataset.copyText || "";
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text); else copyFallback(text);
      if (status) status.textContent = "Project information has been copied and can be sent directly to the Enterprise Micro-Intelligence Adviser.";
    } catch (error) {
      if (status) status.textContent = "Copying failed, select page information manually.";
    }
  }));

  const base = document.body?.dataset?.base || "";
  const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
  const ASSET_VERSION = "20260715-v57";
  const withAssetVersion = src => {
    const value = String(src || "");
    if (!value || value.includes("?") || !value.includes("project-gallery-v4/")) return value;
    return `${value}?v=${ASSET_VERSION}`;
  };
  const normalizeVisuals = data => {
    if (!data || typeof data !== "object") return {};
    if (Array.isArray(data)) return data.reduce((acc, entry) => { if (entry?.id) acc[entry.id] = entry; return acc; }, {});
    return data;
  };
  const projectId = (() => {
    const label = document.querySelector(".project-board-label")?.textContent || "";
    const found = label.match(/[A-Z]{3}-\d{4}/i);
    if (found) return found[0].toUpperCase();
    const file = location.pathname.match(/\/([a-z]{3}-\d{4})\.html$/i);
    return file ? file[1].toUpperCase() : "";
  })();
  const imageUrl = visual => {
    const src = String(visual?.image || "");
    if (!src) return "";
    if (/^(https?:)?\/\//i.test(src) || src.startsWith("/")) return withAssetVersion(src);
    return withAssetVersion(`${base}${src}`);
  };
  const isEquipment = visual => String(visual?.platformKind || visual?.imageSourceType || "").includes("Instrument");

  function renderVisual(visual) {
    if (!visual || !document.querySelector(".project-main-card") || document.querySelector(".project-visual-panel")) return;
    const mainCard = document.querySelector(".project-main-card");
    const infoTable = mainCard.querySelector(".project-info-table");
    const src = imageUrl(visual);
    if (!src) return;
    const equipment = isEquipment(visual);
    const shortCaption = equipment
      ? "Physical reference maps for real instruments. The brands and models listed on the page are used for reference selection, and the final supply is based on mutually confirmed quotations."
      : "Physical reference maps for real materials. The appearance of different brands, batches and packagings may vary slightly, ultimately based on actual supply.";
    const sourceDetail = visual.imageSourceNote || "Picture is a physical reference for real products or similar equipment.";
    const figure = document.createElement("figure");
    figure.className = "project-visual-panel";
    figure.innerHTML = `<div class="project-real-photo-wrap"><span class="real-photo-badge">${equipment ? "Physical reference of instruments" : "Material in-kind reference"}</span><img src="${escapeHtml(src)}" alt="${escapeHtml(visual.imageAlt || `${visual.title || projectId}Physical reference diagrams`)}" loading="eager" decoding="async" width="960" height="540"></div><figcaption><strong>${escapeHtml(visual.photoThemeLabel || visual.imageSourceType || "Physical reference diagrams")}</strong><span>${escapeHtml(shortCaption)}</span><details class="project-photo-source"><summary>View Image Source Description</summary><p>${escapeHtml(sourceDetail)}</p></details></figcaption>`;
    infoTable?.insertAdjacentElement("beforebegin", figure);

    if (equipment && (visual.instrumentModel || visual.instrumentConfig || visual.instrumentScope)) {
      const rows = [];
      if (visual.instrumentModel) rows.push(["Reference brands and models", visual.instrumentModel]);
      if (visual.instrumentConfig) rows.push(["Key Configuration", visual.instrumentConfig]);
      if (visual.instrumentScope) rows.push(["Scope of application", visual.instrumentScope]);
      const panel = document.createElement("section");
      panel.className = "project-instrument-panel";
      panel.innerHTML = `<span class="section-en">MODEL REFERENCE</span><h3>Instrument type and configuration reference</h3><div class="instrument-detail-grid">${rows.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}</div><p class="instrument-reference-note">Model is a common selection reference and does not represent a fixed inventory or brand authorization; Specific brands, models, parameters, annexes and delivery cycles are based on the outcome of the procurement confirmation.</p>`;
      figure.insertAdjacentElement("afterend", panel);
    }
  }

  if (projectId) {
    fetch(`${base}assets/data/project-visuals.json?v=20260715-v57`)
      .then(response => {
        if (!response.ok) throw new Error("Failed to load physical pictures");
        return response.json();
      })
      .then(data => renderVisual(normalizeVisuals(data)[projectId]))
      .catch(error => console.warn("Failed to load physical pictures", error));
  }
})();
