(() => {
  "use strict";

  const normalizeUnifiedShellV95 = () => {
    const header = document.querySelector('.site-header-unified');
    if (!header) return;
    const nav = header.querySelector('.unified-site-nav');
    if (nav) {
      const labels = new Map([
        ['index.html','首页'],
        ['board/ai-projects.html','AI项目'],
        ['board/computational-simulation.html','计算模拟'],
        ['board/characterization-analysis.html','材料表征 / 环境检测'],
        ['board/research-supplies.html','耗材仪器'],
        ['catalog.html','项目查询']
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
      actions.innerHTML = '<button class="unified-consult unified-consult-tech" data-open-tech data-env-tech type="button"><span>Σ</span><b>AI/模拟</b></button><button class="unified-consult unified-consult-admin" data-open-admin data-env-submit type="button"><span>▣</span><b>表征/环境/耗材</b></button>';
    }
  };

  normalizeUnifiedShellV95();

  const ensureUpdateCss = () => {
    if (!document.querySelector('link[href*="environment-topics-update.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'assets/css/environment-topics-update.css?v=20260918-v95';
      document.head.appendChild(link);
    }
    if (!document.querySelector('link[href*="water-soil-home.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'assets/css/water-soil-home.css?v=20260921-v105';
      document.head.appendChild(link);
    }
    if (!document.querySelector('link[href*="home-topic-grid-v106.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'assets/css/home-topic-grid-v106.css?v=20260921-v110';
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
          <strong>环境检测专题送样与技术需求表</strong>
          <span>适用于新污染物、温室气体、微塑料、水质常规检测、土壤常规检测及检测方法开发。下载 Word 后填写，再通过企业微信提交。</span>
        </div>
        <a class="env-requirement-template-link" href="assets/templates/environmental-precision-testing-requirement-form.docx" download="环境检测专题_送样与技术需求表.docx">下载需求表（Word） ↓</a>`;
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
      <div><span class="section-en">REPRESENTATIVE ENVIRONMENTAL PROJECTS</span><h2>环境检测代表性项目</h2></div>
      <p>精选环境检测中的代表性项目，覆盖新污染物、温室气体、微塑料、水质、土壤及非常规方法开发；更多具体指标可进入项目查询。</p>
    </div>
    <div class="hqtd-six-grid">
      <a class="hqtd-six-card a1" href="emerging-contaminants.html"><span class="topic-en">EMERGING CONTAMINANTS</span><h3>PFAS及新污染物精准检测</h3><p>覆盖 PFAS、农药及代谢物、抗生素、药物、激素等目标物筛选、定量与产物鉴定。</p><div class="hqtd-six-tags"><span>PFAS</span><span>LC-MS/MS</span><span>产物鉴定</span></div><strong class="hqtd-six-link">查看项目 →</strong></a>
      <a class="hqtd-six-card a2" href="greenhouse-gas-detection.html"><span class="topic-en">GREENHOUSE GAS</span><h3>温室气体精准检测</h3><p>面向土壤与环境样品中的 CO₂、CH₄、N₂O 等温室气体监测与排放分析。</p><div class="hqtd-six-tags"><span>CO₂</span><span>CH₄</span><span>N₂O</span></div><strong class="hqtd-six-link">查看项目 →</strong></a>
      <a class="hqtd-six-card a3" href="microplastics-detection.html"><span class="topic-en">MICROPLASTIC ANALYTICS</span><h3>微塑料及裂解微塑料分析</h3><p>支持颗粒计数、粒径与形貌分析、聚合物识别及来源分析。</p><div class="hqtd-six-tags"><span>Raman</span><span>μ-FTIR</span><span>聚合物识别</span></div><strong class="hqtd-six-link">查看项目 →</strong></a>
      <a class="hqtd-six-card a4" href="water-testing.html"><span class="topic-en">ROUTINE WATER TESTING</span><h3>水质常规检测</h3><p>覆盖 pH、电导率、TDS、COD、DOC/TOC、TN/TP、离子及元素/重金属等 30 项。</p><div class="hqtd-six-tags"><span>30 项</span><span>水质</span><span>元素/离子</span></div><strong class="hqtd-six-link">查看30项 →</strong></a>
      <a class="hqtd-six-card a5" href="soil-testing.html"><span class="topic-en">ROUTINE SOIL TESTING</span><h3>土壤常规检测</h3><p>覆盖基础理化、氮磷养分、离子、碳/腐殖质、元素/重金属及生态指标等 35 项。</p><div class="hqtd-six-tags"><span>35 项</span><span>土壤</span><span>养分/碳</span></div><strong class="hqtd-six-link">查看35项 →</strong></a>
      <a class="hqtd-six-card a6" href="comprehensive-testing-method-development.html"><span class="topic-en">METHOD DEVELOPMENT</span><h3>综合检测与方法开发</h3><p>针对复杂基质、新目标物及非常规科研问题设计前处理、仪器路线、定量与质量控制方案。</p><div class="hqtd-six-tags"><span>方法定制</span><span>前处理</span><span>质量控制</span></div><strong class="hqtd-six-link">查看项目 →</strong></a>
    </div>
    <div class="hqtd-six-footer"><span>这里展示代表性项目；完整环境检测项目仍统一进入项目查询和需求清单。</span><a href="catalog.html?board=%E7%8E%AF%E5%A2%83%E6%A3%80%E6%B5%8B">查询全部环境检测项目 →</a></div>`;

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
    if (!path.endsWith('/board/characterization-analysis.html') && !path.endsWith('board/characterization-analysis.html')) return;

    const main = document.querySelector('main');
    if (!main) return;

    let envSection = [...main.querySelectorAll('section')].find(sec => {
      const kicker = (sec.querySelector('.section-en')?.textContent || '').trim().toUpperCase();
      const h2 = (sec.querySelector('h2')?.textContent || '').trim();
      return kicker.includes('ENVIRONMENTAL TESTING') ||
             h2 === '环境检测专题' ||
             h2 === '环境代表性检测项目' ||
             sec.classList.contains('hqtd-board-env-six');
    });

    const candidates = [...main.querySelectorAll('section')].filter(sec => {
      const kicker = (sec.querySelector('.section-en')?.textContent || '').trim().toUpperCase();
      const h2 = (sec.querySelector('h2')?.textContent || '').trim();
      return kicker.includes('ENVIRONMENTAL TESTING') ||
             h2 === '环境检测专题' ||
             h2 === '环境代表性检测项目' ||
             sec.classList.contains('hqtd-board-env-six');
    });
    candidates.slice(1).forEach(sec => sec.remove());
    envSection = candidates[0] || envSection;

    if (!envSection) {
      const representative = [...main.querySelectorAll('section')].find(sec => {
        const h2 = (sec.querySelector('.section-title-row h2')?.textContent || '').trim();
        return h2 === '代表项目';
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
            <h2>环境代表性检测项目</h2>
          </div>
          <p class="hqtd-env-rep-intro">覆盖新污染物、温室气体、微塑料，以及新增的水质和土壤常规检测。更多具体指标可进入项目查询。</p>
        </div>

        <div class="hqt-board-card-grid hqtd-env-rep-grid">
          <article class="ai-showcase-card hqt-compact-card hqt-card-board-analysis">
            <a class="ai-showcase-media" href="emerging-contaminants.html">
              <img alt="PFAS及新污染物精准检测" loading="lazy" decoding="async" src="assets/images/environment-topics/emerging-contaminants.png"/>
            </a>
            <div class="ai-showcase-copy">
              <span>新污染物检测</span>
              <h3>PFAS及产物鉴定</h3>
              <p>PFAS、农药及代谢物、抗生素、药物、激素等目标物筛选、定量与产物鉴定。</p>
              <div class="ai-showcase-footer">
                <div class="ai-showcase-tags"><span>PFAS</span><span>LC-MS/MS</span><span>产物鉴定</span></div>
                <a href="emerging-contaminants.html">了解方案 →</a>
              </div>
            </div>
          </article>

          <article class="ai-showcase-card hqt-compact-card hqt-card-board-analysis">
            <a class="ai-showcase-media" href="greenhouse-gas-detection.html">
              <img alt="温室气体精准检测" loading="lazy" decoding="async" src="assets/images/environment-topics/greenhouse-gas.png"/>
            </a>
            <div class="ai-showcase-copy">
              <span>气体检测</span>
              <h3>CO₂ / CH₄ / N₂O 温室气体检测</h3>
              <p>面向土壤、环境样品与排放研究开展温室气体浓度与变化分析。</p>
              <div class="ai-showcase-footer">
                <div class="ai-showcase-tags"><span>CO₂</span><span>CH₄</span><span>N₂O</span></div>
                <a href="greenhouse-gas-detection.html">了解方案 →</a>
              </div>
            </div>
          </article>

          <article class="ai-showcase-card hqt-compact-card hqt-card-board-analysis">
            <a class="ai-showcase-media" href="microplastics-detection.html">
              <img alt="微塑料及裂解微塑料检测" loading="lazy" decoding="async" src="assets/images/environment-topics/microplastics.png"/>
            </a>
            <div class="ai-showcase-copy">
              <span>微塑料检测</span>
              <h3>微塑料及裂解微塑料分析</h3>
              <p>支持颗粒计数、粒径/形貌、聚合物识别及来源分析。</p>
              <div class="ai-showcase-footer">
                <div class="ai-showcase-tags"><span>Raman</span><span>μ-FTIR</span><span>聚合物识别</span></div>
                <a href="microplastics-detection.html">了解方案 →</a>
              </div>
            </div>
          </article>

          <article class="ai-showcase-card hqt-compact-card hqt-card-board-analysis">
            <a class="ai-showcase-media" href="water-testing.html">
              <img alt="水质常规检测" loading="lazy" decoding="async" src="assets/images/homepage-color/08-solution-analysis.webp"/>
            </a>
            <div class="ai-showcase-copy">
              <span>水质常规检测</span>
              <h3>水质基础理化、营养盐与元素分析</h3>
              <p>覆盖 pH、电导率、TDS、COD、DOC/TOC、TN/TP、离子及元素/重金属等 30 项。</p>
              <div class="ai-showcase-footer">
                <div class="ai-showcase-tags"><span>30项</span><span>TOC/TN/TP</span><span>ICP-MS</span></div>
                <a href="water-testing.html">查看30项 →</a>
              </div>
            </div>
          </article>

          <article class="ai-showcase-card hqt-compact-card hqt-card-board-analysis">
            <a class="ai-showcase-media" href="soil-testing.html">
              <img alt="土壤常规检测" loading="lazy" decoding="async" src="assets/images/environment-topics/method-development-soil-carbon.png"/>
            </a>
            <div class="ai-showcase-copy">
              <span>土壤常规检测</span>
              <h3>土壤理化、养分、碳组分与重金属分析</h3>
              <p>覆盖基础理化、氮磷养分、离子、碳/腐殖质、元素/重金属及生态指标等 35 项。</p>
              <div class="ai-showcase-footer">
                <div class="ai-showcase-tags"><span>35项</span><span>养分/碳</span><span>重金属</span></div>
                <a href="soil-testing.html">查看35项 →</a>
              </div>
            </div>
          </article>

          <article class="ai-showcase-card hqt-compact-card hqt-card-board-analysis">
            <a class="ai-showcase-media" href="comprehensive-testing-method-development.html">
              <img alt="综合检测与方法开发" loading="lazy" decoding="async" src="assets/images/environment-topics/method-development-soil-carbon.png"/>
            </a>
            <div class="ai-showcase-copy">
              <span>方法开发</span>
              <h3>复杂基质与非常规项目方法开发</h3>
              <p>面向新目标物、复杂基质和非标准科研需求，设计前处理、仪器条件、定量与质量控制路线。</p>
              <div class="ai-showcase-footer">
                <div class="ai-showcase-tags"><span>方法定制</span><span>前处理</span><span>质量控制</span></div>
                <a href="comprehensive-testing-method-development.html">了解方案 →</a>
              </div>
            </div>
          </article>
        </div>

        <div class="hqtd-env-rep-more">
          <span>需要直接查具体指标？水质 30 项、土壤 35 项及其他环境检测项目均已并入项目查询。</span>
          <a href="catalog.html?board=%E7%8E%AF%E5%A2%83%E6%A3%80%E6%B5%8B">查看全部环境检测项目 →</a>
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
    if (!target) { location.href = 'board/characterization-analysis.html#environment-topics'; return; }
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
    hub.setAttribute('aria-label','环境精准检测专题平台');
    hub.innerHTML = `
      <button class="env-floating-close" type="button" data-env-floating-close aria-label="关闭">×</button>
      <div class="env-floating-panel-head">
        <span class="env-floating-panel-kicker">ENVIRONMENTAL ANALYTICS</span>
        <h2>环境检测专题平台</h2>
      </div>
      <div class="env-floating-panel-grid">
        <a class="env-floating-topic-card env-blue" href="emerging-contaminants.html">
          <span class="env-floating-topic-en">EMERGING CONTAMINANTS</span>
          <h3>新污染物精准检测与风险识别平台</h3>
          <p>PFAS、农药及代谢物、抗生素等重点类别。</p>
          <div class="env-floating-chip-row"><span>12 类</span><span>387 项</span><span>精准检测</span></div>
          <strong>点击进入 →</strong>
        </a>
        <a class="env-floating-topic-card env-cyan" href="greenhouse-gas-detection.html">
          <span class="env-floating-topic-en">GREENHOUSE GAS</span>
          <h3>温室气体精准检测与排放分析平台</h3>
          <p>围绕 CH₄、CO₂、N₂O 等建立专用检测入口。</p>
          <div class="env-floating-chip-row"><span>CH₄</span><span>CO₂</span><span>N₂O</span></div>
          <strong>点击进入 →</strong>
        </a>
        <a class="env-floating-topic-card env-violet" href="microplastics-detection.html">
          <span class="env-floating-topic-en">MICROPLASTICS</span>
          <h3>微塑料精准检测与来源识别平台</h3>
          <p>面向粒径/形貌、聚合物类型与来源识别。</p>
          <div class="env-floating-chip-row"><span>Raman</span><span>μ-FTIR</span><span>来源识别</span></div>
          <strong>点击进入 →</strong>
        </a>
        <a class="env-floating-topic-card env-amber" href="comprehensive-testing-method-development.html">
          <span class="env-floating-topic-en">CUSTOM ANALYTICS</span>
          <h3>综合检测与方法开发</h3>
          <p>植物、土壤及环境样品定制分析与方法开发。</p>
          <div class="env-floating-chip-row"><span>6PPD-Q</span><span>筛查</span><span>方法开发</span></div>
          <strong>点击进入 →</strong>
        </a>
        <a class="env-floating-topic-card env-water" href="water-testing.html">
          <span class="env-floating-topic-en">ROUTINE WATER</span>
          <h3>水质常规检测</h3>
          <p>基础理化、营养盐、离子、元素与重金属等常规检测。</p>
          <div class="env-floating-chip-row"><span>30 项</span><span>水样</span><span>常规检测</span></div>
          <strong>点击进入 →</strong>
        </a>
        <a class="env-floating-topic-card env-soil" href="soil-testing.html">
          <span class="env-floating-topic-en">ROUTINE SOIL</span>
          <h3>土壤常规检测</h3>
          <p>理化、养分、碳组分、离子、重金属及生态指标。</p>
          <div class="env-floating-chip-row"><span>35 项</span><span>土壤</span><span>常规检测</span></div>
          <strong>点击进入 →</strong>
        </a>
      </div>
      <div class="env-floating-panel-tip">精准检测 + 常规检测 + 方法开发，一站式进入对应专题</div>`;
    document.body.appendChild(hub);

    const reopen = document.createElement('button');
    reopen.type = 'button';
    reopen.className = 'env-floating-reopen-v90';
    reopen.setAttribute('data-env-floating-reopen','');
    reopen.hidden = true;
    reopen.innerHTML = '<strong>环境检测专题</strong><small>点击展开六专题入口</small>';
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
