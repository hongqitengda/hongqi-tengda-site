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
    if (!document.querySelector(".env-contact-modal:not([hidden])")) {
      document.body.style.overflow = "";
    }
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
      cards.forEach(card => {
        card.hidden = Boolean(q && !card.textContent.toLowerCase().includes(q));
      });
    });
  }

  const isHomepage = () => {
    const path = String(location.pathname || "").replace(/\\/g, "/");
    const file = path.split("/").pop().toLowerCase();
    return file === "" || file === "index.html" || document.body.classList.contains("homepage-redone");
  };

  const removeLegacyPopup = root => {
    const scope = root?.querySelectorAll ? root : document;
    [...scope.querySelectorAll("*")].forEach(el => {
      if (el.matches?.("[data-env-floating-hub],[data-env-floating-reopen]")) return;
      const txt = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (!txt) return;
      const legacy = /EMERGING\s+CONTAMINANTS\s+PLATFORM/i.test(txt) ||
        (/新污染物精准检测/.test(txt) && /风险识别平台/.test(txt) && !/环境精准检测专题平台/.test(txt));
      if (!legacy) return;
      let node = el;
      for (let i = 0; node && node !== document.body && i < 10; i += 1, node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.position === "fixed" && !node.matches("[data-env-floating-hub],[data-env-floating-reopen]")) {
          node.remove();
          return;
        }
      }
    });
  };

  const scrollToTopic = id => {
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: id === "environment-topics" ? "start" : "center" });
    if (id !== "environment-topics") {
      target.classList.remove("env-topic-focus");
      void target.offsetWidth;
      target.classList.add("env-topic-focus");
      window.setTimeout(() => target.classList.remove("env-topic-focus"), 1700);
    }
  };

  const floatingHubHtml = `
    <button class="env-floating-close" type="button" data-env-floating-close aria-label="关闭环境检测专题导航">×</button>
    <div class="env-floating-kicker"><span></span> ENVIRONMENTAL PRECISION ANALYTICS</div>
    <h2>环境精准检测专题平台</h2>
    <p class="env-floating-intro">一站式科研检测专题入口</p>
    <div class="env-floating-shortcuts" aria-label="环境检测专题快捷导航">
      <button type="button" data-env-jump="env-topic-emerging">新污染物</button>
      <button type="button" data-env-jump="env-topic-greenhouse">温室气体</button>
      <button type="button" data-env-jump="env-topic-microplastics">微塑料</button>
      <button type="button" data-env-jump="env-topic-custom">综合检测</button>
    </div>
    <button class="env-floating-all" type="button" data-env-jump="environment-topics">查看专题平台 →</button>`;

  const ensureFloatingHub = () => {
    if (!isHomepage()) return;

    // Hard-remove the historical single-topic popup and its injected style.
    document.getElementById("hqtd-emerging-platform-entry")?.remove();
    document.getElementById("hqtd-emerging-platform-style")?.remove();
    removeLegacyPopup(document);
    document.querySelectorAll("[data-env-floating-hub],[data-env-floating-reopen]").forEach(el => el.remove());

    const hub = document.createElement("aside");
    hub.className = "env-floating-hub env-floating-hub-v6";
    hub.setAttribute("data-env-floating-hub", "");
    hub.setAttribute("aria-label", "环境精准检测专题平台");
    hub.innerHTML = floatingHubHtml;
    document.body.appendChild(hub);

    const reopen = document.createElement("button");
    reopen.type = "button";
    reopen.className = "env-floating-reopen env-floating-reopen-v6";
    reopen.setAttribute("data-env-floating-reopen", "");
    reopen.innerHTML = `<strong>环境检测专题</strong><small>4 个专题入口</small>`;
    document.body.appendChild(reopen);

    const mobile = window.matchMedia("(max-width: 820px)").matches;
    hub.hidden = mobile;
    reopen.hidden = !mobile;

    hub.querySelector("[data-env-floating-close]")?.addEventListener("click", () => {
      hub.hidden = true;
      reopen.hidden = false;
    });
    reopen.addEventListener("click", () => {
      reopen.hidden = true;
      hub.hidden = false;
    });

    hub.querySelectorAll("[data-env-jump]").forEach(button => {
      button.addEventListener("click", () => {
        scrollToTopic(button.dataset.envJump);
        if (window.matchMedia("(max-width: 820px)").matches) {
          hub.hidden = true;
          reopen.hidden = false;
        }
      });
    });

    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType === 1 && !node.matches?.("[data-env-floating-hub],[data-env-floating-reopen]")) {
            if (node.id === "hqtd-emerging-platform-entry" || node.id === "hqtd-emerging-platform-style") {
              node.remove();
              continue;
            }
            removeLegacyPopup(node);
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureFloatingHub, { once: true });
  } else {
    ensureFloatingHub();
  }
})();
