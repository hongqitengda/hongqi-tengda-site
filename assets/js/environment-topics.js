(() => {
  "use strict";

  const openModal = modal => {
    if (!modal) return;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    modal.querySelector(".env-contact-close")?.focus();
  };

  const closeModal = modal => {
    if (!modal) return;
    modal.hidden = true;
    if (!document.querySelector(".env-contact-modal:not([hidden])")) document.body.style.overflow = "";
  };

  document.addEventListener("click", event => {
    const tech = event.target.closest("[data-env-tech]");
    if (tech) {
      event.preventDefault();
      openModal(document.querySelector('[data-env-modal="tech"]'));
      return;
    }
    const submit = event.target.closest("[data-env-submit]");
    if (submit) {
      event.preventDefault();
      openModal(document.querySelector('[data-env-modal="submit"]'));
      return;
    }
    const close = event.target.closest("[data-env-close]");
    if (close) closeModal(close.closest(".env-contact-modal"));
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      document.querySelectorAll(".env-contact-modal:not([hidden])").forEach(closeModal);
    }
  });

  const filter = document.querySelector("[data-env-filter]");
  if (filter) {
    const cards = [...document.querySelectorAll("[data-env-category]")];
    filter.addEventListener("input", () => {
      const q = filter.value.trim().toLowerCase();
      cards.forEach(card => card.hidden = Boolean(q && !card.textContent.toLowerCase().includes(q)));
    });
  }

  const isHomepage = () => {
    const path = String(location.pathname || "").replace(/\\/g, "/");
    const file = path.split("/").pop().toLowerCase();
    return file === "" || file === "index.html" || document.body.classList.contains("homepage-redone");
  };

  const removeLegacyEmergingPopup = () => {
    const leaves = [...document.querySelectorAll("body *")].filter(el =>
      el.childElementCount === 0 && /EMERGING\s+CONTAMINANTS\s+PLATFORM/i.test(el.textContent || "")
    );
    leaves.forEach(leaf => {
      let node = leaf;
      for (let i = 0; node && node !== document.body && i < 10; i += 1, node = node.parentElement) {
        const style = window.getComputedStyle(node);
        if (style.position === "fixed") {
          node.remove();
          return;
        }
      }
    });
  };

  const floatingHubHtml = `
    <button class="env-floating-close" type="button" data-env-floating-close aria-label="关闭环境专题浮窗">×</button>
    <div class="env-floating-kicker"><span></span> ENVIRONMENTAL PRECISION ANALYTICS</div>
    <h2>环境精准检测专题平台</h2>
    <p class="env-floating-intro">面向环境前沿研究，整合新污染物、温室气体与微塑料专题检测入口。</p>
    <div class="env-floating-topics">
      <a class="env-floating-topic" href="emerging-contaminants.html">
        <div><strong>新污染物精准检测与风险识别</strong><small>PFAS · 农药及代谢物 · 抗生素 · 387 项</small></div>
        <span>进入 →</span>
      </a>
      <a class="env-floating-topic" href="greenhouse-gas-detection.html">
        <div><strong>温室气体精准检测与排放分析</strong><small>CH₄ · CO₂ · N₂O · GC-FID / ECD</small></div>
        <span>进入 →</span>
      </a>
      <a class="env-floating-topic" href="microplastics-detection.html">
        <div><strong>微塑料精准检测与聚合物识别</strong><small>土壤 · 水样 · FTIR · 聚合物识别</small></div>
        <span>进入 →</span>
      </a>
    </div>
    <div class="env-floating-foot"><span>红祺腾达环境精准检测专题矩阵</span><a href="#environment-topics">查看全部专题 ↓</a></div>`;

  const ensureFloatingHub = () => {
    if (!isHomepage()) return;
    removeLegacyEmergingPopup();

    let hub = document.querySelector("[data-env-floating-hub]");
    if (!hub) {
      hub = document.createElement("aside");
      hub.className = "env-floating-hub";
      hub.setAttribute("data-env-floating-hub", "");
      hub.setAttribute("aria-label", "环境精准检测专题平台");
      hub.innerHTML = floatingHubHtml;
      document.body.appendChild(hub);
    } else {
      hub.innerHTML = floatingHubHtml;
      hub.hidden = false;
    }

    let reopen = document.querySelector("[data-env-floating-reopen]");
    if (!reopen) {
      reopen = document.createElement("button");
      reopen.type = "button";
      reopen.className = "env-floating-reopen";
      reopen.setAttribute("data-env-floating-reopen", "");
      reopen.hidden = true;
      reopen.innerHTML = `<strong>环境精准检测专题</strong><small>新污染物 · 温室气体 · 微塑料</small>`;
      document.body.appendChild(reopen);
    }

    hub.querySelector("[data-env-floating-close]")?.addEventListener("click", () => {
      hub.hidden = true;
      reopen.hidden = false;
    });
    reopen.addEventListener("click", () => {
      reopen.hidden = true;
      hub.hidden = false;
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureFloatingHub, { once: true });
  } else {
    ensureFloatingHub();
  }
})();
