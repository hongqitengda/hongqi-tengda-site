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
  const isEquipment = visual => String(visual?.platformKind || visual?.imageSourceType || "").includes("仪器");
  const projectHref = id => `${base}project/${String(id).toLowerCase()}.html`;

  function addVisualToCard(card, visual) {
    if (!card || !visual || card.dataset.visualReady === "1") return;
    card.dataset.visualReady = "1";
    const id = card.querySelector(".static-item-top span")?.textContent?.trim();
    const src = imageUrl(visual);
    const title = card.querySelector("h2 a")?.textContent?.trim() || visual.title || id || "项目";
    const top = card.querySelector(".static-item-top");
    if (src && top) {
      const media = document.createElement("a");
      media.className = "static-item-media";
      media.href = card.querySelector("h2 a")?.getAttribute("href") || projectHref(id);
      media.setAttribute("aria-label", `查看${title}实物图和项目详情`);
      media.innerHTML = `<span class="real-photo-badge">${isEquipment(visual) ? "仪器实物参考" : "耗材实物参考"}</span><img src="${escapeHtml(src)}" alt="${escapeHtml(visual.imageAlt || `${title}实物参考图`)}" loading="lazy" decoding="async" width="640" height="360">`;
      top.insertAdjacentElement("afterend", media);
    }
    if (isEquipment(visual) && (visual.instrumentShort || visual.instrumentModel)) {
      const category = card.querySelector(".static-item-category");
      const desc = [...card.children].find(el => el.tagName === "P" && !el.classList.contains("static-item-category") && !el.classList.contains("static-item-instrument"));
      const info = document.createElement("p");
      info.className = "static-item-instrument";
      info.innerHTML = `<span>参考品牌/型号</span><strong>${escapeHtml(visual.instrumentShort || visual.instrumentModel)}</strong>`;
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
      const specLabel = equipment ? "参考品牌/型号" : "常用规格";
      const specValue = equipment ? (visual.instrumentShort || visual.instrumentModel || item.details) : item.details;
      return `<article class="real-product-card">
        <a class="real-product-photo" href="${escapeHtml(projectHref(id))}">
          <span class="real-photo-badge">${equipment ? "仪器实物" : "耗材实物"}</span>
          <img src="${escapeHtml(imageUrl(visual))}" alt="${escapeHtml(visual.imageAlt || `${name}实物图`)}" loading="lazy" decoding="async" width="640" height="420">
        </a>
        <div class="real-product-body">
          <span class="real-product-id">${escapeHtml(id)}</span>
          <h3><a href="${escapeHtml(projectHref(id))}">${escapeHtml(name)}</a></h3>
          <p>${escapeHtml(item.details || "具体规格请联系顾问确认")}</p>
          <div class="real-product-spec"><span>${specLabel}</span><strong>${escapeHtml(specValue || "按需求选型")}</strong></div>
          <a class="real-product-link" href="${escapeHtml(projectHref(id))}">查看实物与项目详情 →</a>
        </div>
      </article>`;
    }).filter(Boolean).join("");
    if (!cards) return;

    const section = document.createElement("section");
    section.className = "real-photo-showcase";
    section.innerHTML = `<div class="container">
      <div class="real-photo-showcase-head">
        <div><span class="section-en">REAL PRODUCT PHOTOS</span><h2>仪器与耗材实物参考</h2></div>
        <p>展示真实仪器及耗材照片，并配套常用型号或规格，便于客户快速确认产品类型。图片为同类实物参考，最终品牌、型号、包装和外观以采购确认结果为准。</p>
      </div>
      <div class="real-product-grid">${cards}</div>
      <div class="real-photo-showcase-actions"><a class="button" href="${escapeHtml(base)}catalog.html?board=${encodeURIComponent("实验耗材与仪器")}">查看更多仪器与耗材</a><button class="button button-ghost" type="button" data-open-admin>发送产品照片咨询</button></div>
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
  }).catch(error => console.warn("实物图片加载失败", error));
})();
