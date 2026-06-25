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
      if (event.target.closest("a")) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }
  document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());
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
  } else revealItems.forEach(item => item.classList.add("visible"));

  const modal = document.getElementById("qr-modal");
  const closeModal = target => {
    if (!target) return;
    target.hidden = true;
    document.body.classList.remove("modal-open");
  };
  document.querySelectorAll("[data-open-qr]").forEach(button => button.addEventListener("click", () => {
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    modal.querySelector(".modal-close")?.focus();
  }));
  document.querySelectorAll("[data-close-modal]").forEach(button => button.addEventListener("click", () => closeModal(button.closest(".modal"))));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") document.querySelectorAll(".modal:not([hidden])").forEach(closeModal);
  });

  const metricTotal = document.getElementById("metric-total");
  const metricCategories = document.getElementById("metric-categories");
  if (metricTotal || metricCategories) {
    fetch("assets/data/summary.json").then(r => r.ok ? r.json() : Promise.reject()).then(data => {
      if (metricTotal) metricTotal.textContent = `${data.total}+`;
      if (metricCategories) metricCategories.textContent = data.categories;
    }).catch(() => {});
  }
})();
