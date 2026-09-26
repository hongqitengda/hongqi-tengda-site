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

  const ensureUpdateCss = () => {
    if (!document.querySelector('link[href*="environment-topics-update.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/en/assets/css/environment-topics-update.css?v=20260918-v95';
      document.head.appendChild(link);
    }
    if (!document.querySelector('link[href*="water-soil-home.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/en/assets/css/water-soil-home.css?v=20260921-v105';
      document.head.appendChild(link);
    }
    if (!document.querySelector('link[href*="home-topic-grid-v106.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/en/assets/css/home-topic-grid-v106.css?v=20260921-v110';
      document.head.appendChild(link);
    }
  };

  const openModal = modal => {
    if (!modal) return;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    modal.querySelector('.env-contact-close')?.focus();
  };
  const closeModal = modal => {
    if (!modal) return;
    modal.hidden = true;
    if (!document.querySelector('.env-contact-modal:not([hidden])')) document.body.style.overflow = '';
  };

  const ensureRequirementTemplate = () => {
    document.querySelectorAll('[data-env-modal="submit"] .env-contact-panel').forEach(panel => {
      if (panel.querySelector('[data-env-requirement-template]')) return;
      const block = document.createElement('div');
      block.className = 'env-requirement-template';
      block.setAttribute('data-env-requirement-template','');
      block.innerHTML = `
        <div class="env-requirement-template-copy">
          <strong>Environmental testing thematic delivery and technology needs table</strong>
          <span>This applies to the development of new pollutants, greenhouse gases, microplastics, routine water quality testing, soil routine testing and detection methods.</span>
        </div>
        <a class="env-requirement-template-link" href="/en/assets/templates/environmental-precision-testing-requirement-form.docx" download="Environmental-Testing-Request-Form.docx">Downloading Needs Table (Word)</a>`;
      const qr = panel.querySelector('img');
      if (qr) panel.insertBefore(block, qr); else panel.appendChild(block);
    });
  };

  document.addEventListener('click', event => {
    const tech = event.target.closest('[data-env-tech]');
    if (tech) { event.preventDefault(); openModal(document.querySelector('[data-env-modal="tech"]')); return; }
    const submit = event.target.closest('[data-env-submit]');
    if (submit) { event.preventDefault(); openModal(document.querySelector('[data-env-modal="submit"]')); return; }
    const close = event.target.closest('[data-env-close]');
    if (close) closeModal(close.closest('.env-contact-modal'));
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') document.querySelectorAll('.env-contact-modal:not([hidden])').forEach(closeModal);
  });

  const filter = document.querySelector('[data-env-filter]');
  if (filter) {
    const cards = [...document.querySelectorAll('[data-env-category]')];
    filter.addEventListener('input', () => {
      const q = filter.value.trim().toLowerCase();
      cards.forEach(card => { card.hidden = Boolean(q && !card.textContent.toLowerCase().includes(q)); });
    });
  }

  const isHomepage = () => {
    const path = String(location.pathname || '').replace(/\\/g,'/');
    const file = path.split('/').pop().toLowerCase();
    return file === '' || file === 'index.html' || document.body.classList.contains('homepage-redone');
  };

  const environmentCardsHtml = () => `
    <div class="hqtd-six-head">
      <div><span class="section-en">REPRESENTATIVE ENVIRONMENTAL PROJECTS</span><h2>Representative project on environmental testing</h2></div>
      <p>Representative environmental testing projects covering emerging contaminants, greenhouse gases, microplastics, water, soil and custom method development. Browse the Project Catalog for more specific parameters.</p>
    </div>
    <div class="hqtd-six-grid">
      <a class="hqtd-six-card a1" href="emerging-contaminants.html"><span class="topic-en">EMERGING CONTAMINANTS</span><h3>PFAS and precision testing of new pollutants</h3><p>Covers screening, quantification and product identification for PFAS, pesticides and metabolites, antibiotics, pharmaceuticals, hormones and other targets.</p><div class="hqtd-six-tags"><span>PFAS</span><span>LC-MS/MS</span><span>Product Identification</span></div><strong class="hqtd-six-link">View items</strong></a>
      <a class="hqtd-six-card a2" href="greenhouse-gas-detection.html"><span class="topic-en">GREENHOUSE GAS</span><h3>Accurate monitoring of greenhouse gases</h3><p>In soil- and environmental-oriented samples CO₂, CH₄, N₂O and other greenhouse gas monitoring and emission analysis.</p><div class="hqtd-six-tags"><span>CO₂</span><span>CH₄</span><span>N₂O</span></div><strong class="hqtd-six-link">View items</strong></a>
      <a class="hqtd-six-card a3" href="microplastics-detection.html"><span class="topic-en">MICROPLASTIC ANALYTICS</span><h3>Analysis of microplastics and crack microplastics</h3><p>Supports particle counting, particle-size and morphology analysis, polymer identification and source analysis.</p><div class="hqtd-six-tags"><span>Raman</span><span>μ-FTIR</span><span>Polymer Identification</span></div><strong class="hqtd-six-link">View items</strong></a>
      <a class="hqtd-six-card a4" href="water-testing.html"><span class="topic-en">ROUTINE WATER TESTING</span><h3>Routine Water Testing</h3><p>Covers 30 pH, conductivity, TDS, COD, DOC/TOC, TN/TP, ion and element/heavy metals, etc..</p><div class="hqtd-six-tags"><span>30 items</span><span>Water Quality</span><span>Element/ion</span></div><strong class="hqtd-six-link">View 30 items</strong></a>
      <a class="hqtd-six-card a5" href="soil-testing.html"><span class="topic-en">ROUTINE SOIL TESTING</span><h3>Routine Soil Testing</h3><p>Covers 35 parameters including basic physicochemical properties, N/P nutrients, ions, carbon/humus, elements/heavy metals and ecological indicators.</p><div class="hqtd-six-tags"><span>35 items</span><span>Soil</span><span>Nutrient/carbon</span></div><strong class="hqtd-six-link">View 35 items</strong></a>
      <a class="hqtd-six-card a6" href="comprehensive-testing-method-development.html"><span class="topic-en">METHOD DEVELOPMENT</span><h3>Comprehensive Testing and Method Development</h3><p>Designs sample preparation, instrument workflows, quantification and quality-control plans for complex matrices, new targets and non-routine research questions.</p><div class="hqtd-six-tags"><span>Method Customisation</span><span>Forward processing</span><span>Quality control</span></div><strong class="hqtd-six-link">View items</strong></a>
    </div>
    <div class="hqtd-six-footer"><span>Representative projects are shown here. The complete environmental testing catalog remains available through Project Catalog and Request List.</span><a href="catalog.html?board=%E7%8E%AF%E5%A2%83%E6%A3%80%E6%B5%8B">Query all environmental detection items</a></div>`;

  const ensureRoutineHomepageCards = () => {
    if (!isHomepage()) return;
    const section = document.getElementById('environment-topics');
    if (!section || section.dataset.v106 === '1') return;
    section.dataset.v106 = '1';
    section.className = 'section hqtd-six-topic-section env-six';
    const container = section.querySelector('.container') || document.createElement('div');
    if (!container.parentNode) { container.className = 'container'; section.appendChild(container); }
    container.innerHTML = environmentCardsHtml();
  };

  const ensureBoardEnvironmentTopics = () => {
    const path = String(location.pathname || '').replace(/\\/g,'/').toLowerCase();
    if (!path.endsWith('/en/board/characterization-analysis.html') && !path.endsWith('/en/board/characterization-analysis.html')) return;

    const main = document.querySelector('main');
    if (!main) return;

    let envSection = [...main.querySelectorAll('section')].find(sec => {
      const kicker = (sec.querySelector('.section-en')?.textContent || '').trim().toUpperCase();
      const h2 = (sec.querySelector('h2')?.textContent || '').trim();
      return kicker.includes('ENVIRONMENTAL TESTING') ||
             h2 === "Environmental Testing" ||
             h2 === "Environmental Representation Testing Project" ||
             sec.classList.contains('hqtd-board-env-six');
    });

    const candidates = [...main.querySelectorAll('section')].filter(sec => {
      const kicker = (sec.querySelector('.section-en')?.textContent || '').trim().toUpperCase();
      const h2 = (sec.querySelector('h2')?.textContent || '').trim();
      return kicker.includes('ENVIRONMENTAL TESTING') ||
             h2 === "Environmental Testing" ||
             h2 === "Environmental Representation Testing Project" ||
             sec.classList.contains('hqtd-board-env-six');
    });
    candidates.slice(1).forEach(sec => sec.remove());
    envSection = candidates[0] || envSection;

    if (!envSection) {
      const representative = [...main.querySelectorAll('section')].find(sec => {
        const h2 = (sec.querySelector('.section-title-row h2')?.textContent || '').trim();
        return h2 === "Representation of items";
      });
      envSection = document.createElement('section');
      envSection.className = 'section hqt-section-soft hqtd-env-representative-v109';
      if (representative) representative.insertAdjacentElement('afterend', envSection);
      else main.appendChild(envSection);
    }

    envSection.className = 'section hqt-section-soft hqtd-env-representative-v109';
    envSection.id = 'environment-representative-projects';
    envSection.innerHTML = `
      <div class="container">
        <div class="section-title-row reveal">
          <div>
            <span class="section-en">ENVIRONMENTAL PROJECTS</span>
            <h2>Environmental Representation Testing Project</h2>
          </div>
          <p class="hqtd-env-rep-intro">More specific indicators can be found in the project.</p>
        </div>

        <div class="hqt-board-card-grid hqtd-env-rep-grid">
          <article class="ai-showcase-card hqt-compact-card hqt-card-board-analysis">
            <a class="ai-showcase-media" href="emerging-contaminants.html">
              <img alt="PFAS and precision testing of new pollutants" loading="lazy" decoding="async" src="/assets/images/environment-topics/emerging-contaminants.png"/>
            </a>
            <div class="ai-showcase-copy">
              <span>New contaminant detection</span>
              <h3>PFAS and product identification</h3>
              <p>Targets such as PFAS, pesticides and metabolites, antibiotics, drugs, hormones, quantitative and product identification.</p>
              <div class="ai-showcase-footer">
                <div class="ai-showcase-tags"><span>PFAS</span><span>LC-MS/MS</span><span>Product Identification</span></div>
                <a href="emerging-contaminants.html">Explore Solution →</a>
              </div>
            </div>
          </article>

          <article class="ai-showcase-card hqt-compact-card hqt-card-board-analysis">
            <a class="ai-showcase-media" href="greenhouse-gas-detection.html">
              <img alt="Accurate monitoring of greenhouse gases" loading="lazy" decoding="async" src="/assets/images/environment-topics/greenhouse-gas.png"/>
            </a>
            <div class="ai-showcase-copy">
              <span>Gas detection</span>
              <h3>CO2 / CH4 / N2O Greenhouse gas monitoring</h3>
              <p>Greenhouse gas concentration and change analysis for soil, environmental samples and emission studies.</p>
              <div class="ai-showcase-footer">
                <div class="ai-showcase-tags"><span>CO₂</span><span>CH₄</span><span>N₂O</span></div>
                <a href="greenhouse-gas-detection.html">Explore Solution →</a>
              </div>
            </div>
          </article>

          <article class="ai-showcase-card hqt-compact-card hqt-card-board-analysis">
            <a class="ai-showcase-media" href="microplastics-detection.html">
              <img alt="Microplastics and crack microplastics detection" loading="lazy" decoding="async" src="/assets/images/environment-topics/microplastics.png"/>
            </a>
            <div class="ai-showcase-copy">
              <span>Microplastic testing</span>
              <h3>Analysis of microplastics and crack microplastics</h3>
              <p>Support is provided for particle count, particle size/morphology, polymer identification and source analysis.</p>
              <div class="ai-showcase-footer">
                <div class="ai-showcase-tags"><span>Raman</span><span>μ-FTIR</span><span>Polymer Identification</span></div>
                <a href="microplastics-detection.html">Explore Solution →</a>
              </div>
            </div>
          </article>

          <article class="ai-showcase-card hqt-compact-card hqt-card-board-analysis">
            <a class="ai-showcase-media" href="water-testing.html">
              <img alt="Routine Water Testing" loading="lazy" decoding="async" src="/assets/images/homepage-color/08-solution-analysis.webp"/>
            </a>
            <div class="ai-showcase-copy">
              <span>Routine Water Testing</span>
              <h3>Basic water quality management, nutrient salt and element analysis</h3>
              <p>Covers 30 pH, conductivity, TDS, COD, DOC/TOC, TN/TP, ion and element/heavy metals, etc..</p>
              <div class="ai-showcase-footer">
                <div class="ai-showcase-tags"><span>30 items</span><span>TOC/TN/TP</span><span>ICP-MS</span></div>
                <a href="water-testing.html">View 30 items</a>
              </div>
            </div>
          </article>

          <article class="ai-showcase-card hqt-compact-card hqt-card-board-analysis">
            <a class="ai-showcase-media" href="soil-testing.html">
              <img alt="Routine Soil Testing" loading="lazy" decoding="async" src="/assets/images/environment-topics/method-development-soil-carbon.png"/>
            </a>
            <div class="ai-showcase-copy">
              <span>Routine Soil Testing</span>
              <h3>Soil management, nutrients, carbon composition and heavy metals analysis</h3>
              <p>Covers 35 parameters including basic physicochemical properties, N/P nutrients, ions, carbon/humus, elements/heavy metals and ecological indicators.</p>
              <div class="ai-showcase-footer">
                <div class="ai-showcase-tags"><span>35 items</span><span>Nutrient/carbon</span><span>Heavy metal</span></div>
                <a href="soil-testing.html">View 35 items</a>
              </div>
            </div>
          </article>

          <article class="ai-showcase-card hqt-compact-card hqt-card-board-analysis">
            <a class="ai-showcase-media" href="comprehensive-testing-method-development.html">
              <img alt="Comprehensive Testing and Method Development" loading="lazy" decoding="async" src="/assets/images/environment-topics/method-development-soil-carbon.png"/>
            </a>
            <div class="ai-showcase-copy">
              <span>Methodological development</span>
              <h3>Complex matrix and non-conventional project methodology development</h3>
              <p>Pre-design treatment, instrument conditions, quantitative and quality control routes for new targets, complex matrices and non-standard scientific needs.</p>
              <div class="ai-showcase-footer">
                <div class="ai-showcase-tags"><span>Method Customisation</span><span>Forward processing</span><span>Quality control</span></div>
                <a href="comprehensive-testing-method-development.html">Explore Solution →</a>
              </div>
            </div>
          </article>
        </div>

        <div class="hqtd-env-rep-more">
          <span>Specific indicators need to be directly identified? 30 water quality, 35 soil and other environmental testing projects have been integrated into project queries.</span>
          <a href="catalog.html?board=%E7%8E%AF%E5%A2%83%E6%A3%80%E6%B5%8B">View all environmental detection items</a>
        </div>
      </div>`;
  };

  const removeLegacyPopup = () => {
    document.getElementById('hqtd-emerging-platform-entry')?.remove();
    document.getElementById('hqtd-emerging-platform-style')?.remove();
    document.querySelectorAll('.hqtd-ec-float,.env-promo-window,.env-promo-reopen,[data-env-floating-hub],[data-env-floating-reopen]').forEach(el => el.remove());
  };

  const jumpTo = id => {
    const target = document.getElementById(id || 'environment-topics');
    if (!target) { location.href = '/en/board/characterization-analysis.html#environment-topics'; return; }
    target.scrollIntoView({behavior:'smooth',block:id === 'environment-topics' ? 'start' : 'center'});
    if (id && id !== 'environment-topics') {
      target.classList.add('env-topic-focus');
      window.setTimeout(() => target.classList.remove('env-topic-focus'),1500);
    }
  };

  const ensureFloatingHub = () => {
    if (!isHomepage()) return;
    removeLegacyPopup();
    const hub = document.createElement('aside');
    hub.className = 'env-floating-hub-v90';
    hub.setAttribute('data-env-floating-hub','');
    hub.setAttribute('aria-label',"Thematic platform for environmental precision testing");
    hub.innerHTML = `
      <button class="env-floating-close" type="button" data-env-floating-close aria-label="Close">×</button>
      <div class="env-floating-panel-head">
        <span class="env-floating-panel-kicker">ENVIRONMENTAL ANALYTICS</span>
        <h2>Environmental Testing</h2>
      </div>
      <div class="env-floating-panel-grid">
        <a class="env-floating-topic-card env-blue" href="emerging-contaminants.html">
          <span class="env-floating-topic-en">EMERGING CONTAMINANTS</span>
          <h3>Emerging Contaminant Testing &amp; Risk Assessment</h3>
          <p>Priority categories of PFAS, pesticides and metabolites, antibiotics, etc..</p>
          <div class="env-floating-chip-row"><span>Category 12</span><span>387 items</span><span>Precision testing</span></div>
          <strong>Explore Topic →</strong>
        </a>
        <a class="env-floating-topic-card env-cyan" href="greenhouse-gas-detection.html">
          <span class="env-floating-topic-en">GREENHOUSE GAS</span>
          <h3>Greenhouse Gas Testing &amp; Emission Analysis</h3>
          <p>Around CH₄, CO₂, N₂O We'll set up a dedicated testing portal.</p>
          <div class="env-floating-chip-row"><span>CH₄</span><span>CO₂</span><span>N₂O</span></div>
          <strong>Explore Topic →</strong>
        </a>
        <a class="env-floating-topic-card env-violet" href="microplastics-detection.html">
          <span class="env-floating-topic-en">MICROPLASTICS</span>
          <h3>Microplastic Testing &amp; Source Identification</h3>
          <p>Face particle size/form, polymer type and source identification.</p>
          <div class="env-floating-chip-row"><span>Raman</span><span>μ-FTIR</span><span>Source Identification</span></div>
          <strong>Explore Topic →</strong>
        </a>
        <a class="env-floating-topic-card env-amber" href="comprehensive-testing-method-development.html">
          <span class="env-floating-topic-en">CUSTOM ANALYTICS</span>
          <h3>Comprehensive Testing and Method Development</h3>
          <p>Customized analysis and methodological development of plant, soil and environmental samples.</p>
          <div class="env-floating-chip-row"><span>6PPD-Q</span><span>Screening</span><span>Methodological development</span></div>
          <strong>Explore Topic →</strong>
        </a>
        <a class="env-floating-topic-card env-water" href="water-testing.html">
          <span class="env-floating-topic-en">ROUTINE WATER</span>
          <h3>Routine Water Testing</h3>
          <p>General tests of basic physico-chemicals, nutrient salts, ions, elements and heavy metals, etc..</p>
          <div class="env-floating-chip-row"><span>30 items</span><span>Water sample</span><span>General Test</span></div>
          <strong>Explore Topic →</strong>
        </a>
        <a class="env-floating-topic-card env-soil" href="soil-testing.html">
          <span class="env-floating-topic-en">ROUTINE SOIL</span>
          <h3>Routine Soil Testing</h3>
          <p>(b) Stewardization, nutrients, carbon composition, ion, heavy metals and ecological indicators.</p>
          <div class="env-floating-chip-row"><span>35 items</span><span>Soil</span><span>General Test</span></div>
          <strong>Explore Topic →</strong>
        </a>
      </div>
      <div class="env-floating-panel-tip">Precision detection + General detection + development of methodology, one-stop entry to corresponding topic</div>`;
    document.body.appendChild(hub);

    const reopen = document.createElement('button');
    reopen.type = 'button';
    reopen.className = 'env-floating-reopen-v90';
    reopen.setAttribute('data-env-floating-reopen','');
    reopen.hidden = true;
    reopen.innerHTML = "<strong>Environmental Testing</strong><small>Click to expand the six thematic portals</small>";
    document.body.appendChild(reopen);

    hub.querySelector('[data-env-floating-close]')?.addEventListener('click', () => { hub.hidden = true; reopen.hidden = false; });
    reopen.addEventListener('click', () => { reopen.hidden = true; hub.hidden = false; });
    hub.querySelectorAll('[data-env-jump]').forEach(button => button.addEventListener('click', () => {
      jumpTo(button.dataset.envJump);
      if (window.matchMedia('(max-width:820px)').matches) { hub.hidden = true; reopen.hidden = false; }
    }));
  };

  const init = () => {
    normalizeUnifiedShellV95();
    ensureUpdateCss();
    ensureRequirementTemplate();
    ensureRoutineHomepageCards();
    ensureBoardEnvironmentTopics();
    ensureFloatingHub();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
