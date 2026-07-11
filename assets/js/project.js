(() => {
  "use strict";
  const copyFallback = text => { const el=document.createElement("textarea"); el.value=text; el.style.position="fixed"; el.style.opacity="0"; document.body.appendChild(el); el.select(); document.execCommand("copy"); el.remove(); };
  const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
  const addProjectPhoto = () => {
    const base = document.body?.dataset.base || "../";
    const label = document.querySelector(".project-board-label")?.textContent || "";
    const id = (label.match(/[A-Z]{3}-\d{4}/i)?.[0] || location.pathname.match(/\/([a-z]{3}-\d{4})\.html$/i)?.[1] || "").toUpperCase();
    if (!id) return;
    fetch(`${base}assets/data/project-visuals.json?v=20260711-original-layout`)
      .then(response => response.ok ? response.json() : {})
      .then(visuals => {
        const visual = visuals?.[id];
        if (!visual?.image) return;
        const rows = [...document.querySelectorAll(".project-info-table > div")];
        const targetRow = rows.find(row => row.querySelector("dt")?.textContent.includes("规格")) || rows[0];
        const cell = targetRow?.querySelector("dd");
        if (!cell || cell.querySelector(".project-info-inline-thumb")) return;
        const image = document.createElement("img");
        image.className = "project-info-inline-thumb";
        image.src = `${base}${visual.image}`;
        image.alt = visual.imageAlt || `${id} 通用实物参考图`;
        image.loading = "eager";
        image.decoding = "async";
        cell.prepend(image);
        if (visual.instrumentModel || visual.instrumentShort) {
          cell.insertAdjacentHTML("beforeend", `<small class="project-model-ref">参考品牌/型号：${escapeHtml(visual.instrumentShort || visual.instrumentModel)}</small>`);
        }
        cell.insertAdjacentHTML("beforeend", `<small class="project-photo-note">通用实物参考；具体品牌、型号、包装及外观以最终采购确认结果为准。</small>`);
      })
      .catch(() => {});
  };
  addProjectPhoto();

  document.querySelectorAll("[data-copy-project]").forEach(button => button.addEventListener("click", async () => {
    const status=document.querySelector("[data-copy-status]");
    try {
      const text=button.dataset.copyText || "";
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text); else copyFallback(text);
      if (status) status.textContent="项目信息已复制，可直接发送给企业微信顾问。";
    } catch (error) { if (status) status.textContent="复制失败，请手动选择页面信息。"; }
  }));
})();
