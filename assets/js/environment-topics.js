(() => {
  "use strict";

  const ensureUpdateCss = () => {
    if (document.querySelector('link[href*="environment-topics-update.css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'assets/css/environment-topics-update.css?v=20260918-v92';
    document.head.appendChild(link);
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
          <strong>环境精准检测专题送样与技术需求表</strong>
          <span>适用于新污染物、温室气体、微塑料及检测方法开发。下载 Word 后填写，再通过企业微信提交。</span>
        </div>
        <a class="env-requirement-template-link" href="assets/templates/environmental-precision-testing-requirement-form.docx" download="环境精准检测专题_送样与技术需求表.docx">下载需求表（Word） ↓</a>`;
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
        <span class="env-floating-panel-kicker">ENVIRONMENTAL PRECISION ANALYTICS</span>
        <h2>环境精准检测专题平台</h2>
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
      </div>
      <div class="env-floating-panel-tip">点击卡片可直接进入对应专题页</div>`;
    document.body.appendChild(hub);

    const reopen = document.createElement('button');
    reopen.type = 'button';
    reopen.className = 'env-floating-reopen-v90';
    reopen.setAttribute('data-env-floating-reopen','');
    reopen.hidden = true;
    reopen.innerHTML = '<strong>环境检测专题</strong><small>点击展开四专题入口</small>';
    document.body.appendChild(reopen);

    hub.querySelector('[data-env-floating-close]')?.addEventListener('click', () => { hub.hidden = true; reopen.hidden = false; });
    reopen.addEventListener('click', () => { reopen.hidden = true; hub.hidden = false; });
    hub.querySelectorAll('[data-env-jump]').forEach(button => button.addEventListener('click', () => {
      jumpTo(button.dataset.envJump);
      if (window.matchMedia('(max-width:820px)').matches) { hub.hidden = true; reopen.hidden = false; }
    }));
  };

  const init = () => { ensureUpdateCss(); ensureRequirementTemplate(); ensureFloatingHub(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
