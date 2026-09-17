(() => {
  "use strict";

  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", event => {
      if (event.target.closest("a,button")) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  document.querySelectorAll("[data-year]").forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add("visible"));
  }

  const closeModal = target => {
    if (!target) return;
    target.hidden = true;
    const visibleModal = document.querySelector(".modal:not([hidden])");
    if (!visibleModal) document.body.classList.remove("modal-open");
  };

  const openModal = target => {
    if (!target) return;
    target.hidden = false;
    document.body.classList.add("modal-open");
    target.querySelector(".modal-close")?.focus();
  };

  const techQrModal = document.getElementById("tech-qr-modal");
  const adminQrModal = document.getElementById("admin-qr-modal");

  document.addEventListener("click", event => {
    const techTrigger = event.target.closest("[data-open-tech]");
    if (techTrigger) {
      event.preventDefault();
      openModal(techQrModal);
      return;
    }

    const adminTrigger = event.target.closest("[data-open-admin], [data-open-qr]");
    if (adminTrigger) {
      event.preventDefault();
      openModal(adminQrModal);
      return;
    }

    const closeButton = event.target.closest("[data-close-modal]");
    if (closeButton) {
      closeModal(closeButton.closest(".modal"));
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      document.querySelectorAll(".modal:not([hidden])").forEach(closeModal);
    }
  });


  const messageForm = document.getElementById("wechat-message-form");
  const messageStatus = document.getElementById("message-form-status");

  const copyText = async text => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  };

  if (messageForm) {
    messageForm.addEventListener("reset", () => {
      window.setTimeout(() => {
        if (messageStatus) {
          messageStatus.textContent = "";
          messageStatus.classList.remove("is-error");
        }
      }, 0);
    });

    messageForm.addEventListener("submit", async event => {
      event.preventDefault();

      if (!messageForm.reportValidity()) return;

      const data = new FormData(messageForm);
      const value = key => String(data.get(key) || "").trim();

      const content = [
        "红祺腾达科研服务需求",
        "",
        `姓名：${value("name")}`,
        `单位/课题组：${value("organization") || "未填写"}`,
        `微信号/手机号：${value("contact")}`,
        `邮箱：${value("email") || "未填写"}`,
        `需求类型：${value("category")}`,
        `项目名称或关键词：${value("project") || "未填写"}`,
        `期望完成时间：${value("deadline") || "待沟通"}`,
        "",
        "具体需求：",
        value("message")
      ].join("\n");

      const submitButton = messageForm.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      messageStatus.classList.remove("is-error");

      const adminCategories = new Set([
        "材料表征与检测",
        "实验耗材与仪器",
        "高端测试·生物·环境"
      ]);
      const useAdmin = adminCategories.has(value("category"));
      const targetModal = useAdmin ? adminQrModal : techQrModal;
      const targetName = useAdmin ? "表征/耗材顾问" : "AI/模拟工程师";

      try {
        await copyText(content);
        messageStatus.textContent = `需求内容已复制，已为您匹配${targetName}，请扫码后直接粘贴发送。`;
        openModal(targetModal);
      } catch {
        messageStatus.textContent = `自动复制失败，请手动复制需求内容后联系${targetName}。`;
        messageStatus.classList.add("is-error");
        openModal(targetModal);
      } finally {
        submitButton.disabled = false;
      }
    });
  }

  const metricTotal = document.getElementById("metric-total");
  const metricCategories = document.getElementById("metric-categories");
  if (metricTotal || metricCategories) {
    fetch("assets/data/summary.json?v=20260715-v57")
      .then(response => response.ok ? response.json() : Promise.reject(new Error("load failed")))
      .then(data => {
        if (metricTotal) metricTotal.textContent = `${data.total}+`;
        if (metricCategories) metricCategories.textContent = data.categories;
      })
      .catch(() => {});
  }


  // V18: dual-contact self-hosted FAQ customer service
  const hqChatPanel = document.getElementById("hq-chat-panel");
  const hqChatLauncher = document.querySelector(".hq-chat-launcher");
  const hqChatClose = document.querySelector(".hq-chat-close");
  const hqChatBody = document.getElementById("hq-chat-body");
  const hqChatForm = document.getElementById("hq-chat-form");
  const hqChatText = document.getElementById("hq-chat-text");
  const hqChatWecom = document.getElementById("hq-chat-wecom");
  const hqTechContact = hqChatWecom?.querySelector('[data-chat-contact="tech"]');
  const hqAdminContact = hqChatWecom?.querySelector('[data-chat-contact="admin"]');

  const hqFaqAnswers = {
    services: `目前主要提供：
1. DFT、MD、AIMD及多尺度计算模拟；
2. SEM、TEM、XPS等材料表征与检测；
3. 数据分析、机器学习及科研绘图；
4. 实验耗材、试剂和仪器配件；
5. 科研软件、Web平台及AI工具开发；
6. 生物、环境及高端测试服务。`,
    price: `官网项目页面展示的是参考价格。最终费用需根据样品数量、模型规模、技术要求、计算量、交付内容和完成周期综合确认。`,
    simulation: `AI与计算模拟项目请联系对应工程师。建议准备研究体系、结构文件、计算指标、模型或路径数量、参考文献、期望完成时间和交付要求。`,
    testing: `分析表征与耗材仪器请联系表征/耗材顾问。请先说明测试项目、样品类型、样品数量、尺寸或质量及特殊测试条件。`,
    cycle: `项目周期取决于服务类型、样品数量、模型规模和仪器排期。确认需求后会提供预计完成时间。`,
    invoice: `采购询价、合同资料、付款信息、发票申请、物流及售后协调等事务，请联系企业微信表征/耗材顾问。`,
    progress: `AI与计算模拟项目请联系对应工程师；分析表征和耗材仪器项目请联系表征/耗材顾问。请同时提供项目编号、项目名称、联系人及联系方式。`,
    careers: `我们长期关注计算模拟、材料表征、数据分析、软件与AI开发、市场商务及行政运营方向人才。简历及合作介绍可发送至官方邮箱：drwang@hongqitengda.cn。`,
    techwechat: `请扫描下方二维码添加AI/模拟工程师企业微信，适用于 DFT、MD、AIMD、数据分析、科研绘图及软件技术需求。`,
    adminwechat: `请扫描下方二维码添加表征/耗材企业微信，适用于分析表征、耗材仪器、合同、付款、发票及物流事务。`,
    fallback: `请根据业务类型选择对应企业微信：计算模拟、数据与软件联系AI/模拟工程师；分析表征、耗材仪器及合同发票联系表征/耗材顾问。`
  };

  const hqFaqLabels = {
    services: "有哪些科研服务？",
    price: "如何查询参考价格？",
    simulation: "计算模拟如何报价？",
    testing: "材料表征如何送样？",
    cycle: "项目周期一般多久？",
    invoice: "采购、合同与发票",
    progress: "如何咨询项目进度？",
    careers: "加入我们 / 招聘",
    techwechat: "添加AI/模拟企业微信",
    adminwechat: "添加表征/耗材企业微信"
  };

  const setChatContacts = mode => {
    if (!hqChatWecom) return;
    hqChatWecom.hidden = false;
    if (hqTechContact) hqTechContact.hidden = mode === "admin";
    if (hqAdminContact) hqAdminContact.hidden = mode === "tech";
    window.setTimeout(() => {
      hqChatWecom.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 50);
  };

  const openHqChat = contactMode => {
    if (!hqChatPanel || !hqChatLauncher) return;
    hqChatPanel.hidden = false;
    hqChatLauncher.setAttribute("aria-expanded", "true");
    if (contactMode) setChatContacts(contactMode);
  };

  const closeHqChat = () => {
    if (!hqChatPanel || !hqChatLauncher) return;
    hqChatPanel.hidden = true;
    hqChatLauncher.setAttribute("aria-expanded", "false");
  };

  const appendHqMessage = (text, type = "bot") => {
    if (!hqChatBody) return;
    const wrapper = document.createElement("div");
    wrapper.className = `hq-chat-message ${type}`;

    if (type === "bot") {
      const avatar = document.createElement("div");
      avatar.className = "hq-chat-avatar";
      avatar.setAttribute("aria-hidden", "true");
      wrapper.appendChild(avatar);
    }

    const bubble = document.createElement("div");
    bubble.className = "hq-chat-bubble";
    bubble.textContent = text;
    wrapper.appendChild(bubble);
    hqChatBody.insertBefore(wrapper, hqChatWecom || null);
    hqChatBody.scrollTop = hqChatBody.scrollHeight;
  };

  const contactModeForKey = key => {
    if (["simulation", "techwechat"].includes(key)) return "tech";
    if (["testing", "invoice", "adminwechat"].includes(key)) return "admin";
    if (["progress", "fallback"].includes(key)) return "both";
    return null;
  };

  const showHqFaq = key => {
    appendHqMessage(hqFaqLabels[key] || "其他问题", "user");
    window.setTimeout(() => {
      appendHqMessage(hqFaqAnswers[key] || hqFaqAnswers.fallback, "bot");
      const mode = contactModeForKey(key);
      if (mode) setChatContacts(mode);
      hqChatBody.scrollTop = hqChatBody.scrollHeight;
    }, 150);
  };

  const matchHqFaq = text => {
    const value = String(text || "").trim().toLowerCase();
    if (/服务|项目|业务|范围/.test(value)) return "services";
    if (/价格|报价|费用|多少钱/.test(value)) return "price";
    if (/dft|md|aimd|模拟|计算|量化|软件|数据分析/.test(value)) return "simulation";
    if (/送样|表征|测试|检测|xps|sem|tem/.test(value)) return "testing";
    if (/周期|多久|时间|交付/.test(value)) return "cycle";
    if (/发票|开票|采购|合同|付款|公对公|物流|发货/.test(value)) return "invoice";
    if (/进度|订单|项目编号/.test(value)) return "progress";
    if (/招聘|加入|简历|岗位|求职|实习/.test(value)) return "careers";
    if (/计算.*微信|技术.*微信/.test(value)) return "techwechat";
    if (/行政|采购.*微信|测试.*微信/.test(value)) return "adminwechat";
    return "fallback";
  };

  hqChatLauncher?.addEventListener("click", () => {
    if (hqChatPanel?.hidden) openHqChat();
    else closeHqChat();
  });

  hqChatClose?.addEventListener("click", closeHqChat);

  document.querySelectorAll("[data-faq-key]").forEach(button => {
    button.addEventListener("click", () => showHqFaq(button.dataset.faqKey));
  });

  hqChatForm?.addEventListener("submit", event => {
    event.preventDefault();
    const text = hqChatText?.value.trim();
    if (!text) return;
    appendHqMessage(text, "user");
    if (hqChatText) hqChatText.value = "";
    const key = matchHqFaq(text);
    window.setTimeout(() => {
      appendHqMessage(hqFaqAnswers[key], "bot");
      const mode = contactModeForKey(key);
      if (mode) setChatContacts(mode);
      hqChatBody.scrollTop = hqChatBody.scrollHeight;
    }, 180);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && hqChatPanel && !hqChatPanel.hidden) {
      closeHqChat();
    }
  });

  // V19.2: mobile conversion bar; still fully static and uses existing modals.
  if (!document.querySelector(".mobile-contact-bar")) {
    const base = document.body?.dataset.base || "";
    const bar = document.createElement("nav");
    bar.className = "mobile-contact-bar";
    bar.setAttribute("aria-label", "移动端快捷咨询");
    bar.innerHTML = `<a href="${base}catalog.html"><span>⌕</span><strong>项目查询</strong></a><button type="button" data-open-tech><span>Σ</span><strong>AI/模拟</strong></button><button type="button" data-open-admin><span>▣</span><strong>表征/耗材</strong></button>`;
    document.body.appendChild(bar);
  }

  // project-visuals:v1 - enrich existing static category/project pages in place.
  const projectVisualEscape = value => String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
  const PROJECT_ASSET_VERSION = "20260715-v57";
  const withProjectAssetVersion = src => {
    const value = String(src || "");
    if (!value || value.includes("?") || !value.includes("project-gallery-v4/")) return value;
    return `${value}?v=${PROJECT_ASSET_VERSION}`;
  };
  const normalizeProjectVisuals = data => {
    if (!data || typeof data !== "object") return {};
    if (Array.isArray(data)) return data.reduce((acc, entry) => { if (entry?.id) acc[entry.id] = entry; return acc; }, {});
    return data;
  };
  const visualImageUrl = (visual, base) => withProjectAssetVersion(`${base}${visual.image || "assets/images/og-cover.png"}`);
  const isEquipmentVisual = visual => Boolean(visual.instrumentModel) || String(visual.platformKind || visual.imageSourceType || "").includes("仪器");
  const projectFigureHtml = (visual, base) => `<figure class="project-visual-panel"><img src="${projectVisualEscape(visualImageUrl(visual, base))}" alt="${projectVisualEscape(visual.imageAlt || `${visual.title || "项目"} 参考图`)}" loading="lazy"><figcaption><strong>项目参考图</strong><span>${projectVisualEscape(visual.imageSourceNote || "红祺腾达原创项目示意图")}</span></figcaption></figure>`;
  const instrumentPanelHtml = visual => {
    if (!isEquipmentVisual(visual) || !visual.instrumentModel) return "";
    const rows = [["建议仪器型号/常用平台", visual.instrumentModel], ["关键配置", visual.instrumentConfig], ["适用范围", visual.instrumentScope], ["图片来源说明", visual.instrumentSourceNote || visual.imageSourceNote]].filter(([, value]) => value);
    return `<section class="project-instrument-panel"><h3>仪器平台参考</h3><div class="instrument-detail-grid">${rows.map(([label, value]) => `<div><span>${projectVisualEscape(label)}</span><strong>${projectVisualEscape(value)}</strong></div>`).join("")}</div></section>`;
  };
  const enhanceProjectPage = (visualMap, base) => {
    if (!document.body.classList.contains("project-detail-page")) return;
    const id = (location.pathname.match(/\/project\/([^/]+)\.html$/i)?.[1] || document.querySelector(".project-board-label")?.textContent.match(/[A-Z]{3}-\d{4}/)?.[0] || "").toUpperCase();
    const visual = visualMap[id];
    const main = document.querySelector(".project-main-card");
    if (!visual || !main || main.querySelector(".project-visual-panel")) return;
    const title = main.querySelector(".project-section-title");
    const table = main.querySelector(".project-info-table");
    title?.insertAdjacentHTML("afterend", projectFigureHtml(visual, base));
    if (isEquipmentVisual(visual) && visual.instrumentModel) table?.insertAdjacentHTML("afterend", instrumentPanelHtml(visual));
  };
  const enhanceStaticCards = (visualMap, base) => {
    document.querySelectorAll(".static-item-card").forEach(card => {
      if (card.querySelector(".static-item-media")) return;
      const id = card.querySelector(".static-item-top span")?.textContent.trim().toUpperCase();
      const visual = visualMap[id];
      const link = card.querySelector("h2 a[href]")?.getAttribute("href") || "#";
      const top = card.querySelector(".static-item-top");
      if (!visual || !top) return;
      top.insertAdjacentHTML("afterend", `<a class="static-item-media" href="${projectVisualEscape(link)}"><img src="${projectVisualEscape(visualImageUrl(visual, base))}" alt="${projectVisualEscape(visual.imageAlt || `${visual.title || "项目"} 参考图`)}" loading="lazy"></a>`);
      if (isEquipmentVisual(visual) && visual.instrumentModel) {
        const detail = card.querySelector(".static-item-meta");
        detail?.insertAdjacentHTML("beforebegin", `<p class="static-item-instrument"><span>参考仪器</span><strong>${projectVisualEscape(visual.instrumentShort || visual.instrumentModel)}</strong></p>`);
      }
    });
  };
  const enhanceProjectVisuals = () => {
    if (!document.body.classList.contains("project-detail-page") && !document.querySelector(".static-item-card")) return;
    const base = document.body?.dataset.base || "";
    fetch(`${base}assets/data/project-visuals.json?v=20260715-v57`)
      .then(response => response.ok ? response.json() : {})
      .then(data => {
        const visualMap = normalizeProjectVisuals(data);
        enhanceProjectPage(visualMap, base);
        enhanceStaticCards(visualMap, base);
      })
      .catch(() => {});
  };
  enhanceProjectVisuals();

})();

/* HQTD Emerging Contaminants Platform · homepage integration · 2026-09-17 */
(() => {
  "use strict";

  const pageName = (location.pathname.split("/").pop() || "").toLowerCase();
  if (pageName && pageName !== "index.html") return;

  const platformHref = "emerging-contaminants.html";

  // Upgrade the original "溶液检测" card in place without changing the homepage layout.
  const analysisCards = [...document.querySelectorAll(".hqt-capability-analysis .hqt-feature-card")];
  const solutionCard = analysisCards.find(card =>
    /溶液检测|HPLC\s*有机污染物定量检测/.test(card.textContent || "")
  );

  if (solutionCard) {
    solutionCard.querySelectorAll('a[href="project/fx-85.html"]').forEach(link => {
      link.href = platformHref;
    });

    const label = solutionCard.querySelector(".ai-showcase-copy > span");
    if (label) label.textContent = "新污染物检测";

    const title = solutionCard.querySelector(".ai-showcase-copy h3 a, .ai-showcase-copy h3");
    if (title) title.textContent = "新污染物精准检测与风险识别";

    const desc = solutionCard.querySelector(".ai-showcase-copy > p");
    if (desc) {
      desc.textContent = "覆盖 PFAS、抗生素、农药及代谢物、药物、内分泌干扰物等重点新污染物，支持靶向定量、筛查、产物鉴定与风险识别。";
    }

    const tags = solutionCard.querySelector(".ai-showcase-tags");
    if (tags) tags.innerHTML = "<span>PFAS</span><span>LC–MS/MS</span><span>风险识别</span>";

    const detail = solutionCard.querySelector(".ai-showcase-footer > a");
    if (detail) {
      detail.href = platformHref;
      detail.textContent = "进入专题平台 →";
    }

    const media = solutionCard.querySelector(".ai-showcase-media");
    if (media) media.href = platformHref;
  }

  if (document.getElementById("hqtd-emerging-platform-entry")) return;

  const style = document.createElement("style");
  style.id = "hqtd-emerging-platform-style";
  style.textContent = `
    .hqtd-ec-float {
      position: fixed;
      right: 30px;
      top: 150px;
      z-index: 2140;
      width: min(390px, calc(100vw - 40px));
      overflow: hidden;
      border: 1px solid rgba(255,255,255,.28);
      border-radius: 14px;
      background: linear-gradient(138deg,#062f59 0%,#075fa7 58%,#0b91a7 100%);
      color: #fff;
      box-shadow: 0 22px 54px rgba(7,56,101,.28);
    }
    .hqtd-ec-float::before {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: radial-gradient(circle at 88% 12%,rgba(255,255,255,.22),transparent 28%);
    }
    .hqtd-ec-float-close {
      position: absolute;
      top: 11px;
      right: 11px;
      z-index: 3;
      display: grid;
      place-items: center;
      width: 30px;
      height: 30px;
      padding: 0;
      border: 1px solid rgba(255,255,255,.26);
      border-radius: 50%;
      background: rgba(0,0,0,.12);
      color: #fff;
      font-size: 19px;
      line-height: 1;
      cursor: pointer;
    }
    .hqtd-ec-float-link {
      position: relative;
      z-index: 2;
      display: block;
      padding: 25px 27px 24px;
      color: #fff;
      text-decoration: none;
    }
    .hqtd-ec-float-kicker {
      display: flex;
      align-items: center;
      gap: 9px;
      margin-bottom: 14px;
      color: #bdebf0;
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 1.7px;
    }
    .hqtd-ec-float-kicker::before {
      content: "";
      width: 30px;
      height: 3px;
      border-radius: 3px;
      background: #ff9a3d;
    }
    .hqtd-ec-float h2 {
      margin: 0;
      color: #fff;
      font-size: 25px;
      line-height: 1.32;
      letter-spacing: -.4px;
    }
    .hqtd-ec-float p {
      margin: 12px 0 16px;
      color: #dceef8;
      font-size: 13px;
      line-height: 1.75;
    }
    .hqtd-ec-float-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
      margin-bottom: 18px;
    }
    .hqtd-ec-float-tags span {
      padding: 5px 8px;
      border: 1px solid rgba(255,255,255,.2);
      border-radius: 3px;
      background: rgba(255,255,255,.08);
      color: #f2fbff;
      font-size: 10px;
      font-weight: 800;
    }
    .hqtd-ec-float-action {
      display: inline-flex;
      align-items: center;
      min-height: 38px;
      padding: 0 14px;
      border-radius: 4px;
      background: #fff;
      color: #0756a3;
      font-size: 12px;
      font-weight: 900;
    }
    @media (max-width: 900px) {
      .hqtd-ec-float {
        top: auto;
        right: 14px;
        bottom: 84px;
        width: min(360px, calc(100vw - 28px));
      }
      .hqtd-ec-float-link { padding: 20px 22px 19px; }
      .hqtd-ec-float h2 { font-size: 21px; }
      .hqtd-ec-float p { display: none; }
    }
  `;
  document.head.appendChild(style);

  const entry = document.createElement("aside");
  entry.id = "hqtd-emerging-platform-entry";
  entry.className = "hqtd-ec-float";
  entry.setAttribute("aria-label", "新污染物精准检测与风险识别平台专题入口");
  entry.innerHTML = `
    <button class="hqtd-ec-float-close" type="button" aria-label="关闭专题入口">×</button>
    <a class="hqtd-ec-float-link" href="${platformHref}">
      <span class="hqtd-ec-float-kicker">EMERGING CONTAMINANTS PLATFORM</span>
      <h2>新污染物精准检测<br>与风险识别平台</h2>
      <p>面向科研场景的目标物筛选、精准检测、数据质控与风险识别专题平台。</p>
      <div class="hqtd-ec-float-tags"><span>PFAS</span><span>农药及代谢物</span><span>抗生素</span><span>产物鉴定</span></div>
      <span class="hqtd-ec-float-action">进入专题平台 →</span>
    </a>`;
  document.body.appendChild(entry);

  entry.querySelector(".hqtd-ec-float-close")?.addEventListener("click", () => entry.remove());
})();
