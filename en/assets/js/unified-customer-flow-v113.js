(() => {
  'use strict';

  const FLOW = [
    ['1', "Select a Project"],
    ['2', "Request Details"],
    ['3', "Review Details"],
    ['4', "Submit Order"],
    ['5', "Customer Center"]
  ];

  function createFlowBar() {
    if (document.querySelector('.hqtd-flow-v113')) return;
    const wrap = document.createElement('section');
    wrap.className = 'hqtd-flow-v113';
    wrap.setAttribute('aria-label', "How to Place an Order");
    wrap.innerHTML = `
      <div class="hqtd-flow-v113-inner">
        <strong>How to Place an Order</strong>
        <div class="hqtd-flow-v113-steps">
          ${FLOW.map(([index, label]) => `<span><b>${index}</b>${label}</span>`).join('')}
        </div>
      </div>`;
    const main = document.querySelector('main, #main');
    if (main) main.insertAdjacentElement('afterbegin', wrap);
  }

  function createQuickDock() {
    if (document.querySelector('.hqtd-quick-dock-v113')) return;
    const dock = document.createElement('nav');
    dock.className = 'hqtd-quick-dock-v113';
    dock.setAttribute('aria-label', "Quick List");
    const root = location.pathname.includes('/en/project/') || location.pathname.includes('/en/board/') || location.pathname.includes('/en/category/')
      ? '../' : '';
    dock.innerHTML = `
      <a href="${root}board/ai-projects.html"><b>AI</b><span>AI Projects</span></a>
      <a href="${root}board/computational-simulation.html"><b>JS</b><span>Computational Simulation</span></a>
      <a href="${root}board/characterization-analysis.html"><b>FX</b><span>Material Characterization</span></a>
      <a href="${root}board/research-supplies.html"><b>HC</b><span>Supplies &amp; Instruments</span></a>
      <a href="${root}demand-list.html" data-open-demand-list-v113><b>List</b><span>Request List</span></a>`;
    document.body.appendChild(dock);
  }

  function alignActionLabels() {
    const selectors = [
      '[data-order-now]', '.order-now', '.btn-order', 'a[href*="order"]',
      'button[data-add-demand]', '.add-demand'
    ];
    document.querySelectorAll(selectors.join(',')).forEach(element => {
      const text = (element.textContent || '').trim();
      if (/Consultants|Contact/.test(text)) return;
      if (/Add/.test(text)) element.textContent = "Add to Request List";
      else if (/Here you go\.|Submit a Request|Here we go\./.test(text)) element.textContent = "Order Now";
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    createFlowBar();
    createQuickDock();
    alignActionLabels();
  });
})();