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
      if (status) status.textContent = "项目信息已复制，可直接发送给企业微信顾问。";
    } catch (error) {
      if (status) status.textContent = "复制失败，请手动选择页面信息。";
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
  const isEquipment = visual => String(visual?.platformKind || visual?.imageSourceType || "").includes("仪器");

  function renderVisual(visual) {
    if (!visual || !document.querySelector(".project-main-card") || document.querySelector(".project-visual-panel")) return;
    const mainCard = document.querySelector(".project-main-card");
    const infoTable = mainCard.querySelector(".project-info-table");
    const src = imageUrl(visual);
    if (!src) return;
    const equipment = isEquipment(visual);
    const shortCaption = equipment
      ? "真实仪器实物参考图。页面所列品牌与型号用于选型参考，最终供货以双方确认的报价单为准。"
      : "真实耗材实物参考图。不同品牌、批次和包装的外观可能略有差异，最终以实际供货为准。";
    const sourceDetail = visual.imageSourceNote || "图片为真实产品或同类设备实物参考。";
    const figure = document.createElement("figure");
    figure.className = "project-visual-panel";
    figure.innerHTML = `<div class="project-real-photo-wrap"><span class="real-photo-badge">${equipment ? "仪器实物参考" : "耗材实物参考"}</span><img src="${escapeHtml(src)}" alt="${escapeHtml(visual.imageAlt || `${visual.title || projectId}实物参考图`)}" loading="eager" decoding="async" width="960" height="540"></div><figcaption><strong>${escapeHtml(visual.photoThemeLabel || visual.imageSourceType || "实物参考图")}</strong><span>${escapeHtml(shortCaption)}</span><details class="project-photo-source"><summary>查看图片来源说明</summary><p>${escapeHtml(sourceDetail)}</p></details></figcaption>`;
    infoTable?.insertAdjacentElement("beforebegin", figure);

    if (equipment && (visual.instrumentModel || visual.instrumentConfig || visual.instrumentScope)) {
      const rows = [];
      if (visual.instrumentModel) rows.push(["参考品牌与型号", visual.instrumentModel]);
      if (visual.instrumentConfig) rows.push(["关键配置", visual.instrumentConfig]);
      if (visual.instrumentScope) rows.push(["适用范围", visual.instrumentScope]);
      const panel = document.createElement("section");
      panel.className = "project-instrument-panel";
      panel.innerHTML = `<span class="section-en">MODEL REFERENCE</span><h3>仪器型号与配置参考</h3><div class="instrument-detail-grid">${rows.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}</div><p class="instrument-reference-note">型号为常用选型参考，不代表固定库存或品牌授权；具体品牌、型号、参数、附件和交付周期以采购确认结果为准。</p>`;
      figure.insertAdjacentElement("afterend", panel);
    }
  }

  if (projectId) {
    fetch(`${base}assets/data/project-visuals.json?v=20260715-v57`)
      .then(response => {
        if (!response.ok) throw new Error("实物图片加载失败");
        return response.json();
      })
      .then(data => renderVisual(normalizeVisuals(data)[projectId]))
      .catch(error => console.warn("实物图片加载失败", error));
  }
})();
