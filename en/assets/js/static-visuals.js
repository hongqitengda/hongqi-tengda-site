(() => {
  "use strict";

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
    if (Array.isArray(data)) return data.reduce((acc, item) => { if (item?.id) acc[item.id] = item; return acc; }, {});
    return data;
  };
  const imageUrl = visual => {
    const src = String(visual?.image || "");
    if (!src) return "";
    if (/^(https?:)?\/\//i.test(src) || src.startsWith("/")) return withAssetVersion(src);
    return withAssetVersion(`${base}${src}`);
  };
  const isEquipment = visual => String(visual?.platformKind || visual?.imageSourceType || "").includes("Instrument");
  const projectHref = id => `${base}project/${String(id).toLowerCase()}.html`;

  function addVisualToCard(card, visual) {
    if (!card || !visual || card.dataset.visualReady === "1") return;
    card.dataset.visualReady = "1";
    const id = card.querySelector(".static-item-top span")?.textContent?.trim();
    const src = imageUrl(visual);
    const title = card.querySelector("h2 a")?.textContent?.trim() || visual.title || id || "Project";
    const top = card.querySelector(".static-item-top");
    if (src && top) {
      const media = document.createElement("a");
      media.className = "static-item-media";
      media.href = card.querySelector("h2 a")?.getAttribute("href") || projectHref(id);
      media.setAttribute("aria-label", `View${title}Physical charts and project details`);
      media.innerHTML = `<span class="real-photo-badge">${isEquipment(visual) ? "Physical reference of instruments" : "Material in-kind reference"}</span><img src="${escapeHtml(src)}" alt="${escapeHtml(visual.imageAlt || `${title}Physical reference diagrams`)}" loading="lazy" decoding="async" width="640" height="360">`;
      top.insertAdjacentElement("afterend", media);
    }
    if (isEquipment(visual) && (visual.instrumentShort || visual.instrumentModel)) {
      const category = card.querySelector(".static-item-category");
      const desc = [...card.children].find(el => el.tagName === "P" && !el.classList.contains("static-item-category") && !el.classList.contains("static-item-instrument"));
      const info = document.createElement("p");
      info.className = "static-item-instrument";
      info.innerHTML = `<span>Reference brand/model</span><strong>${escapeHtml(visual.instrumentShort || visual.instrumentModel)}</strong>`;
      (desc || category)?.insertAdjacentElement("afterend", info);
    }
  }

  function hydrateStaticCards(visualMap) {
    const cards = [...document.querySelectorAll(".static-item-card")];
    if (!cards.length) return;
    const hydrate = card => {
      const id = card.querySelector(".static-item-top span")?.textContent?.trim();
      if (id && visualMap[id]) addVisualToCard(card, visualMap[id]);
    };
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          hydrate(entry.target);
          observer.unobserve(entry.target);
        });
      }, { rootMargin: "700px 0px" });
      cards.forEach(card => observer.observe(card));
    } else {
      cards.forEach(hydrate);
    }
  }

  function renderShowcase(items, visualMap) {
    if (!/\/board\/research-supplies\.html$/i.test(location.pathname)) return;
    if (document.querySelector(".real-photo-showcase")) return;
    const curatedIds = [
      "SUP-0136", "SUP-0264", "SUP-0138", "SUP-0142", "SUP-0286", "SUP-0293",
      "SUP-0042", "SUP-0046", "SUP-0108", "SUP-0002", "SUP-0213", "SUP-0221"
    ];
    const itemMap = new Map(items.map(item => [item.id, item]));
    const cards = curatedIds.map(id => {
      const item = itemMap.get(id);
      const visual = visualMap[id];
      if (!item || !visual?.image) return "";
      const equipment = isEquipment(visual);
      const name = item.service || item.name || visual.title;
      const specLabel = equipment ? "Reference brand/model" : "Common Specifications";
      const specValue = equipment ? (visual.instrumentShort || visual.instrumentModel || item.details) : item.details;
      return `<article class="real-product-card">
        <a class="real-product-photo" href="${escapeHtml(projectHref(id))}">
          <span class="real-photo-badge">${equipment ? "Instruments in kind" : "Materials in kind"}</span>
          <img src="${escapeHtml(imageUrl(visual))}" alt="${escapeHtml(visual.imageAlt || `${name}Physical Charts`)}" loading="lazy" decoding="async" width="640" height="420">
        </a>
        <div class="real-product-body">
          <span class="real-product-id">${escapeHtml(id)}</span>
          <h3><a href="${escapeHtml(projectHref(id))}">${escapeHtml(name)}</a></h3>
          <p>${escapeHtml(item.details || "Please contact the consultant to confirm the specifications.")}</p>
          <div class="real-product-spec"><span>${specLabel}</span><strong>${escapeHtml(specValue || "Type by Needs")}</strong></div>
          <a class="real-product-link" href="${escapeHtml(projectHref(id))}"'See physical and project details.</a>
        </div>
      </article>`;
    }).filter(Boolean).join("");
    if (!cards) return;

    const section = document.createElement("section");
    section.className = "real-photo-showcase";
    section.innerHTML = `<div class="container">
      <div class="real-photo-showcase-head">
        <div><span class="section-en">REAL PRODUCT PHOTOS</span><h2>Physical reference for instruments and consumables</h2></div>
        <p>Presentation of photographs of real instruments and consumables, with commonly used models or specifications to facilitate rapid identification of product types by clients. Pictures are the same type of physical reference, with the final brand, model, packaging and appearance based on the result of the confirmation of the purchase.</p>
      </div>
      <div class="real-product-grid">${cards}</div>
      <div class="real-photo-showcase-actions"><a class="button" href="${escapeHtml(base)}catalog.html?board=${encodeURIComponent("Experimental consumables and instruments")}"'See more instruments and consumables.</a><button class="button button-ghost" type="button" data-open-admin>Sending product photos for consultation</button></div>
    </div>`;
    const hero = document.querySelector(".static-directory-hero");
    hero?.insertAdjacentElement("afterend", section);
  }

  Promise.all([
    fetch(`${base}assets/data/project-visuals.json?v=20260715-v57`).then(response => response.ok ? response.json() : {}),
    fetch(`${base}assets/data/catalog.json?v=20260715-v57`).then(response => response.ok ? response.json() : []).catch(() => [])
  ]).then(([visuals, items]) => {
    const visualMap = normalizeVisuals(visuals);
    hydrateStaticCards(visualMap);
    renderShowcase(Array.isArray(items) ? items : [], visualMap);
  }).catch(error => console.warn("Failed to load physical pictures", error));
})();
