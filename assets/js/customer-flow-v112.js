(() => {
  'use strict';
  const KEY = 'hqtd_web_submit_guard_v112';
  const DRAFT_KEY = 'hqtd_web_form_draft_v112';

  function relevantForm(form) {
    return form && (form.matches('[data-order-form], .dynamic-order-form, form[id*="order"], form[id*="requirement"]'));
  }

  function serialize(form) {
    const result = {};
    new FormData(form).forEach((value, key) => {
      if (value instanceof File) return;
      if (result[key] !== undefined) {
        result[key] = Array.isArray(result[key]) ? result[key].concat(value) : [result[key], value];
      } else result[key] = value;
    });
    return result;
  }

  function saveDraft(form) {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        path: location.pathname,
        data: serialize(form),
        savedAt: Date.now()
      }));
      const status = form.querySelector('[data-draft-status]');
      if (status) status.textContent = '草稿已保存';
    } catch (_) {}
  }

  function restoreDraft(form) {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (!draft || draft.path !== location.pathname || Date.now() - draft.savedAt > 86400000) return;
      Object.entries(draft.data || {}).forEach(([name, value]) => {
        const fields = form.querySelectorAll(`[name="${CSS.escape(name)}"]`);
        fields.forEach(field => {
          if (field.type === 'checkbox' || field.type === 'radio') {
            const values = Array.isArray(value) ? value : [value];
            field.checked = values.includes(field.value);
          } else if (!field.value) field.value = Array.isArray(value) ? value[0] : value;
        });
      });
    } catch (_) {}
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('form').forEach(form => {
      if (!relevantForm(form)) return;
      restoreDraft(form);

      let timer;
      form.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => saveDraft(form), 300);
      });

      form.addEventListener('submit', event => {
        const now = Date.now();
        const previous = JSON.parse(sessionStorage.getItem(KEY) || 'null');
        const fingerprint = JSON.stringify(serialize(form));
        if (previous && previous.fingerprint === fingerprint && now - previous.time < 15000) {
          event.preventDefault();
          alert('正在提交，请勿重复操作。');
          return;
        }
        sessionStorage.setItem(KEY, JSON.stringify({ fingerprint, time: now }));
        const submit = form.querySelector('[type="submit"]');
        if (submit) {
          submit.disabled = true;
          submit.dataset.originalText = submit.textContent;
          submit.textContent = '正在提交…';
          setTimeout(() => {
            submit.disabled = false;
            submit.textContent = submit.dataset.originalText || '提交';
          }, 15000);
        }
      });
    });
  });

  window.HQTD_V112_clearSubmittedDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    sessionStorage.removeItem(KEY);
  };
})();