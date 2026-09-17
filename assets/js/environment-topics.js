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
    if (!document.querySelector(".env-contact-modal:not([hidden])")) document.body.style.overflow = "";
  };
  document.addEventListener("click", event => {
    const tech = event.target.closest("[data-env-tech]");
    if (tech) { event.preventDefault(); openModal(document.querySelector('[data-env-modal="tech"]')); return; }
    const submit = event.target.closest("[data-env-submit]");
    if (submit) { event.preventDefault(); openModal(document.querySelector('[data-env-modal="submit"]')); return; }
    const close = event.target.closest("[data-env-close]");
    if (close) closeModal(close.closest(".env-contact-modal"));
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") document.querySelectorAll(".env-contact-modal:not([hidden])").forEach(closeModal);
  });
  const filter = document.querySelector("[data-env-filter]");
  if (filter) {
    const cards = [...document.querySelectorAll("[data-env-category]")];
    filter.addEventListener("input", () => {
      const q = filter.value.trim().toLowerCase();
      cards.forEach(card => card.hidden = q && !card.textContent.toLowerCase().includes(q));
    });
  }
})();
