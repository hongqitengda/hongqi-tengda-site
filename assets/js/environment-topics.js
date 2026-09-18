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

  const ensureRequirementTemplate = () => {
    document.querySelectorAll('[data-env-modal="submit"] .env-contact-panel').forEach(panel => {
      if (panel.querySelector('[data-env-requirement-template]')) return;
      const block = document.createElement('div');
      block.className = 'env-requirement-template';
      block.setAttribute('data-env-requirement-template', '');
      block.innerHTML = `
        <div class="env-requirement-template-copy">
          <strong>环境精准检测专题送样与技术需求表</strong>
          <span>适用于新污染物、温室气体、微塑料及检测方法开发。下载 Word 后填写，再通过企业微信提交。</span>
        </div>
        <a class="env-requirement-template-link" href="assets/templates/environmental-precision-testing-requirement-form.docx" download="环境精准检测专题_送样与技术需求表.docx">下载需求表（Word） ↓</a>`;
      const qr = panel.querySelector('img');
      if (qr) panel.insertBefore(block, qr); else panel.appendChild(block);
    });
  };

  document.addEventListener("click", event => {
    const tech = event.target.closest("[data-env-tech]");
    if (tech) { event.preventDefault(); openModal(document.querySelector('[data-env-modal="tech"]')); return; }
    const submit = event.target.closest("[data-env-submit]");
    if (submit) { event.preventDefault(); openModal(document.querySelector('[data-env-modal="submit"]')); return; }
    const close = event.target.closest("[data-env-close]");
    if (close) closeModal(close.closest(".env-contact-modal"));
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") document.querySelectorAll(".env-contact-modal:not([hidden])").forEach(closeModal);
  });



  const isHomepage = () => {
    const path = String(location.pathname || "").replace(/\\/g, "/");
    const file = path.split("/").pop().toLowerCase();
    return file === "" || file === "index.html" || document.body.classList.contains("homepage-redone");
  };

  const scrollToEnvironment = id => {
    const target = document.getElementById(id || "environment-topics");
    if (!target) {
      location.href = "board/characterization-analysis.html#environment-topics";
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: id === "environment-topics" ? "start" : "center" });
    if (id && id !== "environment-topics") {
      target.classList.remove("env-topic-focus");
      void target.offsetWidth;
      target.classList.add("env-topic-focus");
      window.setTimeout(() => target.classList.remove("env-topic-focus"), 1700);
    }
  };

  const ensurePromoWindow = () => {
    if (!isHomepage() || document.querySelector('[data-env-promo-window]')) return;

    const promo = document.createElement('aside');
    promo.className = 'env-promo-window';
    promo.setAttribute('data-env-promo-window', '');
    promo.setAttribute('aria-label', '环境精准检测专题宣传入口');
    promo.innerHTML = `
      <button class="env-promo-close" type="button" aria-label="关闭环境检测专题宣传">×</button>
      <div class="env-promo-kicker"><span></span> ENVIRONMENTAL PRECISION ANALYTICS</div>
      <h2>环境精准检测专题平台</h2>
      <p>新污染物 · 温室气体 · 微塑料 · 检测方法开发</p>
      <div class="env-promo-topics">
        <button class="blue" type="button" data-env-promo-jump="env-topic-emerging">新污染物</button>
        <button class="green" type="button" data-env-promo-jump="env-topic-greenhouse">温室气体</button>
        <button class="violet" type="button" data-env-promo-jump="env-topic-microplastics">微塑料</button>
        <button class="orange" type="button" data-env-promo-jump="env-topic-custom">方法开发</button>
      </div>
      <button class="env-promo-primary" type="button" data-env-promo-jump="environment-topics">进入专题平台 →</button>`;
    document.body.appendChild(promo);

    const reopen = document.createElement('button');
    reopen.type = 'button';
    reopen.className = 'env-promo-reopen';
    reopen.setAttribute('data-env-promo-reopen', '');
    reopen.hidden = true;
    reopen.innerHTML = '<strong>环境检测专题</strong><small>新污染物 · 温室气体 · 微塑料</small>';
    document.body.appendChild(reopen);

    promo.querySelector('.env-promo-close')?.addEventListener('click', () => {
      promo.hidden = true;
      reopen.hidden = false;
    });
    reopen.addEventListener('click', () => {
      reopen.hidden = true;
      promo.hidden = false;
    });
    promo.querySelectorAll('[data-env-promo-jump]').forEach(button => {
      button.addEventListener('click', () => {
        scrollToEnvironment(button.dataset.envPromoJump);
        if (window.matchMedia('(max-width: 820px)').matches) {
          promo.hidden = true;
          reopen.hidden = false;
        }
      });
    });
  };

  const init = () => { ensureRequirementTemplate(); ensurePromoWindow(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
