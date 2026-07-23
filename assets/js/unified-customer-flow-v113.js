(() => {
  'use strict';

  const FLOW = [
    ['1', '选择项目'],
    ['2', '填写需求'],
    ['3', '确认内容'],
    ['4', '提交订单'],
    ['5', '客户中心']
  ];

  function createFlowBar() {
    if (document.querySelector('.hqtd-flow-v113')) return;
    const wrap = document.createElement('section');
    wrap.className = 'hqtd-flow-v113';
    wrap.setAttribute('aria-label', '统一下单流程');
    wrap.innerHTML = `
      <div class="hqtd-flow-v113-inner">
        <strong>统一下单流程</strong>
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
    dock.setAttribute('aria-label', '快捷下单');
    dock.innerHTML = `
      <a href="board/ai-projects.html"><b>AI</b><span>AI项目</span></a>
      <a href="board/computational-simulation.html"><b>JS</b><span>计算模拟</span></a>
      <a href="board/characterization-analysis.html"><b>FX</b><span>分析表征</span></a>
      <a href="board/research-supplies.html"><b>HC</b><span>耗材仪器</span></a>
      <button type="button" data-open-demand-list-v113><b>清单</b><span>需求清单</span></button>`;
    document.body.appendChild(dock);

    dock.querySelector('[data-open-demand-list-v113]').addEventListener('click', () => {
      const existing = document.querySelector('[data-open-demand-list], #demand-list-button, .demand-list-button');
      if (existing) existing.click();
      else window.location.href = 'customer-center.html';
    });
  }

  function alignActionLabels() {
    const selectors = [
      '[data-order-now]', '.order-now', '.btn-order', 'a[href*="order"]',
      'button[data-add-demand]', '.add-demand'
    ];
    document.querySelectorAll(selectors.join(',')).forEach(element => {
      const text = (element.textContent || '').trim();
      if (/咨询|联系/.test(text)) return;
      if (/加入/.test(text)) element.textContent = '加入需求清单';
      else if (/下单|提交需求|开始/.test(text)) element.textContent = '立即下单';
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    createFlowBar();
    createQuickDock();
    alignActionLabels();
  });
})();