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
      const targetName = useAdmin ? "行政专员" : "计算模拟工程师";

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
    fetch("assets/data/summary.json?v=1612")
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
    simulation: `计算模拟项目请联系计算模拟工程师。建议准备研究体系、结构文件、计算指标、模型或路径数量、参考文献、期望完成时间和交付要求。`,
    testing: `材料表征与分析测试请联系行政专员。请先说明测试项目、样品类型、样品数量、尺寸或质量及特殊测试条件。`,
    cycle: `项目周期取决于服务类型、样品数量、模型规模和仪器排期。确认需求后会提供预计完成时间。`,
    invoice: `采购询价、合同资料、付款信息、发票申请、物流及售后协调等事务，请联系企业微信行政专员。`,
    progress: `计算模拟项目请联系计算模拟工程师；采购和分析测试项目请联系行政专员。请同时提供项目编号、项目名称、联系人及联系方式。`,
    careers: `我们长期关注计算模拟、材料表征、数据分析、软件与AI开发、市场商务及行政运营方向人才。简历及合作介绍可发送至官方邮箱：drwang@hongqitengda.cn。`,
    techwechat: `请扫描下方二维码添加计算模拟工程师企业微信，适用于 DFT、MD、AIMD、数据分析、科研绘图及软件技术需求。`,
    adminwechat: `请扫描下方二维码添加行政专员企业微信，适用于采购、材料表征、分析测试、合同、付款、发票及物流事务。`,
    fallback: `请根据业务类型选择对应企业微信：计算模拟、数据与软件联系计算模拟工程师；采购、表征测试及合同发票联系行政专员。`
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
    techwechat: "添加计算模拟企业微信",
    adminwechat: "添加行政专员企业微信"
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
      avatar.textContent = "红";
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


  // V21.1: add one common reference photo inside each existing static item card; outer layout remains unchanged.
  const addStaticProjectPhotos = () => {
    const cards = document.querySelectorAll(".static-item-card");
    if (!cards.length) return;
    const base = document.body?.dataset.base || "";
    fetch(`${base}assets/data/project-visuals.json?v=20260711-original-layout`)
      .then(response => response.ok ? response.json() : {})
      .then(visuals => {
        cards.forEach(card => {
          const id = card.querySelector(".static-item-top span")?.textContent.trim().toUpperCase();
          const visual = visuals?.[id];
          const description = [...card.querySelectorAll(":scope > p")].find(el => !el.classList.contains("static-item-category"));
          if (!visual?.image || !description || description.querySelector(".static-inline-thumb")) return;
          description.classList.add("has-project-photo");
          const image = document.createElement("img");
          image.className = "static-inline-thumb";
          image.src = `${base}${visual.image}`;
          image.alt = visual.imageAlt || `${card.querySelector("h2")?.textContent.trim() || id} 通用实物参考图`;
          image.loading = "lazy";
          image.decoding = "async";
          image.title = visual.instrumentShort || visual.photoThemeLabel || "通用实物参考";
          description.prepend(image);
        });
      })
      .catch(() => {});
  };
  addStaticProjectPhotos();

  // V19.2: mobile conversion bar; still fully static and uses existing modals.
  if (!document.querySelector(".mobile-contact-bar")) {
    const base = document.body?.dataset.base || "";
    const bar = document.createElement("nav");
    bar.className = "mobile-contact-bar";
    bar.setAttribute("aria-label", "移动端快捷咨询");
    bar.innerHTML = `<a href="${base}catalog.html"><span>⌕</span><strong>项目查询</strong></a><button type="button" data-open-tech><span>Σ</span><strong>计算模拟</strong></button><button type="button" data-open-admin><span>▣</span><strong>采购·测试</strong></button>`;
    document.body.appendChild(bar);
  }

})();
