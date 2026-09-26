(() => {
  "use strict";

  const normalizeUnifiedShellV95 = () => {
    const header = document.querySelector('.site-header-unified');
    if (!header) return;
    const nav = header.querySelector('.unified-site-nav');
    if (nav) {
      const labels = new Map([
        ['index.html',"Home"],
        ['/en/board/ai-projects.html',"AI Projects"],
        ['/en/board/computational-simulation.html',"Computational Simulation"],
        ['/en/board/characterization-analysis.html',"Characterization & Testing"],
        ['/en/board/research-supplies.html',"Supplies & Instruments"],
        ['catalog.html',"Project Catalog"]
      ]);
      nav.querySelectorAll('a[href]').forEach(a => {
        const href = (a.getAttribute('href') || '').replace(/^\.\//,'');
        for (const [key,label] of labels) {
          if (href.endsWith(key) || href === key) { a.textContent = label; break; }
        }
      });
    }
    const actions = header.querySelector('.unified-actions');
    if (actions) {
      actions.innerHTML = "<button class=\"unified-consult unified-consult-tech\" data-open-tech data-env-tech type=\"button\"><span>Σ</span><b>AI / Simulation</b></button><button class=\"unified-consult unified-consult-admin\" data-open-admin data-env-submit type=\"button\"><span>▣</span><b>Testing / Supplies</b></button>";
    }
  };

  normalizeUnifiedShellV95();

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



  const normalizeCustomerServiceCopyV95 = () => {
    document.querySelectorAll('[data-chat-contact="admin"] strong').forEach(el => el.textContent = "Characterization & Testing");
    document.querySelectorAll('[data-chat-contact="admin"] p').forEach(el => el.textContent = "Characterization, environmental testing, supplies & instruments, contracts, invoices, logistics and after-sales");
    document.querySelectorAll('[data-faq-key="testing"]').forEach(el => el.textContent = "Testing Consultation");
    const adminModal = document.getElementById('admin-qr-modal');
    if (adminModal) {
      const h2 = adminModal.querySelector('h2'); if (h2) h2.textContent = "Testing Consultation";
      const p = adminModal.querySelector('p'); if (p) p.textContent = "For characterization, environmental testing, supplies & instruments, contracts, payments, invoices, logistics and after-sales.";
      const primary = adminModal.querySelector('.modal-link-row a.primary'); if (primary) primary.textContent = "View material signs / environmental tests";
    }
  };
  normalizeCustomerServiceCopyV95();

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
        "The need for scientific services is high.",
        "",
        `Name:${value("name")}`,
        `Unit/issue group:${value("organization") || "Unfilled"}`,
        `Micro signal/cell number:${value("contact")}`,
        `Mailbox:${value("email") || "Unfilled"}`,
        `Type of demand:${value("category")}`,
        `Project name or keyword:${value("project") || "Unfilled"}`,
        `Expected completion time:${value("deadline") || "Pending communication"}`,
        "",
        "Specific needs:",
        value("message")
      ].join("\n");

      const submitButton = messageForm.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      messageStatus.classList.remove("is-error");

      const adminCategories = new Set([
        "Material Characterization and Testing",
        "Experimental consumables and instruments",
        "High-end tests Biological environment"
      ]);
      const useAdmin = adminCategories.has(value("category"));
      const targetModal = useAdmin ? adminQrModal : techQrModal;
      const targetName = useAdmin ? "Testing Consultant" : "AI/Simulation Engineer";

      try {
        await copyText(content);
        messageStatus.textContent = `Demand has been copied and matched to you${targetName}, please paste it and send it..`;
        openModal(targetModal);
      } catch {
        messageStatus.textContent = `Auto copying failed, please contact after manually copying the requested content${targetName}。`;
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
    fetch("/en/assets/data/summary.json?v=20260715-v57")
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
    services: `For the time being, the main providers are:
1. DFT, MD, AIMD and multiscale computing simulations; 
2. Identification and testing of materials such as SEM, TEM, XPS, etc.; 
3. Data analysis, machine learning and scientific mapping; 
4. Experimental consumables, reagents and instrumentation accessories; 
5. Scientific software, Web platform and AI tool development; 
6. Biological, environmental and high-end testing services.`,
    price: `The reference price is shown on the website project page.. The final cost will need to be determined on the basis of sample size, model size, technical requirements, calculation, delivery content and completion cycle.`,
    simulation: `Al and Calculator Simulation Project, please contact the corresponding engineer.. Suggested research systems, structural documents, calculation indicators, number of models or paths, references, expected completion time and delivery requirements.`,
    testing: `Please contact the instrument & tool & tool & test consultant. Please specify the test project, the type of sample, the quantity, size or quality of the sample and the special test conditions.`,
    cycle: `Project cycle depends on type of service, number of samples, size of model and instrument scheduling. Anticipated completion time will be provided upon confirmation of needs.`,
    invoice: `Inquiries for procurement, contract information, payment information, invoice requests, logistics and after-sale coordination, please contact the Micro-Intelligence & Testing Consultant.`,
    progress: `Al and Calculator Simulation Project, please contact the corresponding engineer.; Please contact the & & & & & & & & & & & & & & & & & & & & & & & & & & Q. Please also provide the project number, project name, contact person and contact details..`,
    careers: `We have a long-term focus on computational simulations, material representation, data analysis, software and AI development, market commerce and administrative operations.. Curricula vitae and cooperative presentations can be sent to the official mailbox: drwang@hongqitengda.cn.`,
    techwechat: `Please scan the two-dimensional code below and add AI/Simulation Engineer Micro-Credit to the DFT, MD, AIMD, data analysis, scientific mapping and software technology needs..`,
    adminwechat: `Please scan the two-dimensional code below and add a sign & Testing Enterprise Wisdom, Applicable to material representation, Environmental Testing, Supplies & Instruments, Contracts, Payments, Invoices and logistics services.`,
    fallback: `Select the corresponding enterprise micro-mails according to the type of business: calculation simulation, data-to-software connection AI/simulation engineer; Tables & Tests, Depletion Equipment and Contract Invoice Link & Testing Consultant.`
  };

  const hqFaqLabels = {
    services: "What research services are available?",
    price: "How to find reference prices?",
    simulation: "Calculating how the simulation quotes?",
    testing: "How do you get the material??",
    cycle: "How long does the project cycle normally last??",
    invoice: "Procurement, contracts and invoices",
    progress: "How to consult on project progress?",
    careers: "Join us/ Recruit",
    techwechat: "Add AI/ Simulation Enterprise Wire",
    adminwechat: "Contact the Testing Team on WeCom"
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
    appendHqMessage(hqFaqLabels[key] || "Other issues", "user");
    window.setTimeout(() => {
      appendHqMessage(hqFaqAnswers[key] || hqFaqAnswers.fallback, "bot");
      const mode = contactModeForKey(key);
      if (mode) setChatContacts(mode);
      hqChatBody.scrollTop = hqChatBody.scrollHeight;
    }, 150);
  };

  const matchHqFaq = text => {
    const value = String(text || "").trim().toLowerCase();
    if (/Services|Project|Operations|Scope/.test(value)) return "services";
    if (/Price|Quotes|Price|How much\?/.test(value)) return "price";
    if (/dft|md|aimd|Simulation|Simulation|Quantitative|Software|Data Analysis/.test(value)) return "simulation";
    if (/Portrait|Characterization|Test|Test|xps|sem|tem/.test(value)) return "testing";
    if (/Lead Time|How long\?|Time|Delivery/.test(value)) return "cycle";
    if (/Invoice|Tickets\.|Purchasing|Contracts|Payments|\- Yes, sir\.|Logistics|Delivery/.test(value)) return "invoice";
    if (/Progress|Orders|Project ID/.test(value)) return "progress";
    if (/Recruitment|Add|Curricula vitae|Positions|Looking for work|Internship/.test(value)) return "careers";
    if (/Simulation.*Weiss\.|Technology.*Weiss\./.test(value)) return "techwechat";
    if (/Administration|Purchasing.*Weiss\.|Test.*Weiss\./.test(value)) return "adminwechat";
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
    bar.setAttribute("aria-label", "Mobile-end shortcut consultation");
    bar.innerHTML = `<a href="${base}catalog.html"><span>⌕</span><strong>Project Catalog</strong></a><button type="button" data-open-tech><span>Σ</span><strong>AI / Simulation</strong></button><button type="button" data-open-admin><span>▣</span><strong>Characterization &amp; Testing</strong></button>`;
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
  const visualImageUrl = (visual, base) => withProjectAssetVersion(`${base}${visual.image || "/assets/images/og-cover.png"}`);
  const isEquipmentVisual = visual => Boolean(visual.instrumentModel) || String(visual.platformKind || visual.imageSourceType || "").includes("Instrument");
  const projectFigureHtml = (visual, base) => `<figure class="project-visual-panel"><img src="${projectVisualEscape(visualImageUrl(visual, base))}" alt="${projectVisualEscape(visual.imageAlt || `${visual.title || "Project"} Reference Charts`)}" loading="lazy"><figcaption><strong>Project reference diagram</strong><span>${projectVisualEscape(visual.imageSourceNote || "Map of the original project of the Red Zhenda")}</span></figcaption></figure>`;
  const instrumentPanelHtml = visual => {
    if (!isEquipmentVisual(visual) || !visual.instrumentModel) return "";
    const rows = [["Suggested instrument type/used platform", visual.instrumentModel], ["Key Configuration", visual.instrumentConfig], ["Scope of application", visual.instrumentScope], ["Image Source Description", visual.instrumentSourceNote || visual.imageSourceNote]].filter(([, value]) => value);
    return `<section class="project-instrument-panel"><h3>Instrument platform reference</h3><div class="instrument-detail-grid">${rows.map(([label, value]) => `<div><span>${projectVisualEscape(label)}</span><strong>${projectVisualEscape(value)}</strong></div>`).join("")}</div></section>`;
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
      top.insertAdjacentHTML("afterend", `<a class="static-item-media" href="${projectVisualEscape(link)}"><img src="${projectVisualEscape(visualImageUrl(visual, base))}" alt="${projectVisualEscape(visual.imageAlt || `${visual.title || "Project"} Reference Charts`)}" loading="lazy"></a>`);
      if (isEquipmentVisual(visual) && visual.instrumentModel) {
        const detail = card.querySelector(".static-item-meta");
        detail?.insertAdjacentHTML("beforebegin", `<p class="static-item-instrument"><span>Reference instruments</span><strong>${projectVisualEscape(visual.instrumentShort || visual.instrumentModel)}</strong></p>`);
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


  // V10.3: site-wide high-end simulation integration
  const enhanceHighEndSimulationV103 = () => {
    const base = document.body?.dataset.base || '';
    const abs = path => path.startsWith('/') ? path : `${base}${path}`;

    if (!document.querySelector('link[data-hqtd-v103]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = abs('/en/assets/css/global-v103.css?v=20260919-v103');
      link.dataset.hqtdV103 = '1';
      document.head.appendChild(link);
    }

    // Keep the high-end simulation topic discoverable from every footer without crowding the top nav.
    document.querySelectorAll('.footer-column').forEach(col => {
      const strong = col.querySelector(':scope > strong');
      if (!strong || strong.textContent.trim() !== "Services") return;
      if (col.querySelector('a[data-highsim-global]')) return;
      const sim = [...col.querySelectorAll('a')].find(a => /Computational Simulation/.test(a.textContent));
      const a = document.createElement('a');
      a.href = abs('high-end-simulation.html');
      a.textContent = "Advanced Computational Simulation";
      a.dataset.highsimGlobal = '1';
      if (sim) sim.insertAdjacentElement('afterend', a); else col.appendChild(a);
    });

    // Unify AI / simulation contact copy site-wide.
    document.querySelectorAll('[data-chat-contact="tech"] strong').forEach(el => el.textContent = "AI / High-end calculation");
    document.querySelectorAll('[data-chat-contact="tech"] p').forEach(el => el.textContent = "AI project, DFT, MD, AIMD, response path, interface mechanism and high-end computing scheme customisation");
    const techModal = document.getElementById('tech-qr-modal');
    if (techModal) {
      const title = techModal.querySelector('h2');
      if (title) title.textContent = "AI / high-end computing simulation consultancy";
      const p = techModal.querySelector('p');
      if (p) p.textContent = "Applies to AI projects, DFTs, MDs, AIMDs, response paths, interfaces and high-end computing schemes custom. For addition, please comment on \"OfficeNet Consulting + Unit + Research Directions\".";
      const row = techModal.querySelector('.modal-link-row');
      if (row && !row.querySelector('[data-highsim-modal-link]')) {
        const a = document.createElement('a');
        a.href = abs('high-end-simulation.html');
        a.textContent = "Advanced Simulation";
        a.dataset.highsimModalLink = '1';
        row.insertBefore(a, row.firstChild);
      }
    }

    // Add one high-value quick question to the existing customer-service box.
    const quick = document.querySelector('.hq-chat-quick');
    if (quick && !quick.querySelector('[data-highsim-chat]')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.highsimChat = '1';
      btn.textContent = "Advanced Simulation Solutions";
      btn.addEventListener('click', () => {
        const panel = document.getElementById('hq-chat-panel');
        if (panel) panel.hidden = false;
        const launcher = document.querySelector('.hq-chat-launcher');
        launcher?.setAttribute('aria-expanded','true');
        const body = document.getElementById('hq-chat-body');
        if (body) {
          const msg = document.createElement('div');
          msg.className = 'hq-chat-message bot';
          msg.innerHTML = "<div class=\"hq-chat-avatar\" aria-hidden=\"true\"></div><div class=\"hq-chat-bubble\">High-end computing simulation for catalytic defects, membrane separation and molecular interfaces, complex contaminant interfaces, energy electrochemicals and polymer composite interfaces. A combination of scientific issues, including DFT, MD, AIM, CI-NEB, liberal energy, etc., can be used, and customisation of the calculation route is supported.</div>";
          const contacts = document.getElementById('hq-chat-wecom');
          body.insertBefore(msg, contacts || null);
          if (contacts) {
            contacts.hidden = false;
            contacts.querySelector('[data-chat-contact="tech"]')?.removeAttribute('hidden');
            contacts.querySelector('[data-chat-contact="admin"]')?.setAttribute('hidden','');
          }
          body.scrollTop = body.scrollHeight;
        }
      });
      quick.insertBefore(btn, quick.children[2] || null);
    }

    // Every existing computational-simulation project detail page gets a concise high-end upgrade path + WeCom contact.
    const pathname = String(location.pathname || '').toLowerCase();
    if (/\/project\/js-\d+\.html$/.test(pathname) && !document.querySelector('[data-global-highsim-cta]')) {
      const main = document.querySelector('main');
      if (main) {
        const section = document.createElement('section');
        section.className = 'hqtd-global-highsim-cta';
        section.dataset.globalHighsimCta = '1';
        section.innerHTML = `<div><span>ADVANCED COMPUTATIONAL SCIENCE</span><h2>Need for more in-depth machine calculations?</h2><p>Subjects that could be upgraded to the higher end of the calculation: defective engineering, interface electronic transfer, membrane molecular transport, complex pollutant response, electrochemical interface and multiscale customization.</p></div><div class="hqtd-global-highsim-cta-actions"><a href="${abs('high-end-simulation.html')}"'See the high-end computation theme</a><button type="button" data-open-tech>Contact Us on WeCom</button></div>`;
        main.appendChild(section);
      }
    }

    // Project-query pages: update helper copy to explicitly include the high-end route.
    document.querySelectorAll('.sidebar-help').forEach(box => {
      const strong = box.querySelector('strong');
      const p = box.querySelector('p');
      if (strong) strong.textContent = "Need a high-end or customized scheme?";
      if (p) p.textContent = "High-end computing, AI, DFT/MD/AIMD and data software linked computing simulation engineers; Resource person for material representation, environmental testing and procurement contacts & testing.";
    });
  };
  enhanceHighEndSimulationV103();

})();
