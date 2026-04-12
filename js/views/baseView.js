// js/views/baseView.js
// ── Base class for all views ──────────────────────────────────────────────────

export class BaseView {
  /**
   * @param {import('../app.js').App} app
   */
  constructor(app) {
    this.app = app;
    this.container = null;
  }

  /**
   * Mount this view into `container`.
   * @param {HTMLElement} container
   * @param {Object} params - route params
   */
  mount(container, params = {}) {
    this.container = container;
    container.innerHTML = this.render(params);
    container.classList.remove('view-enter');
    // Force reflow for animation restart
    void container.offsetWidth;
    container.classList.add('view-enter');
    this.afterRender(params);
    this.bindEvents(params);
    // Scroll to top on each navigation
    window.scrollTo(0, 0);
  }

  /** Override — return HTML string */
  render(params) { return ''; }

  /** Override — called after innerHTML is set, before bindEvents */
  afterRender(params) {}

  /** Override — attach DOM event listeners */
  bindEvents(params) {}

  // ── DOM helpers ────────────────────────────────────────────────────────────

  qs(selector)  { return this.container.querySelector(selector); }
  qsa(selector) { return [...this.container.querySelectorAll(selector)]; }

  on(selector, event, handler) {
    const el = this.qs(selector);
    if (el) el.addEventListener(event, handler);
  }

  onAll(selector, event, handler) {
    this.qsa(selector).forEach(el => el.addEventListener(event, handler));
  }

  // ── UI helpers ─────────────────────────────────────────────────────────────

  /**
   * Native confirm dialog (can swap for custom modal later).
   */
  confirm(message) {
    return Promise.resolve(window.confirm(message));
  }

  /**
   * Lightweight toast notification.
   * @param {string} message
   * @param {'ok'|'error'} type
   */
  toast(message, type = 'ok') {
    const prev = document.getElementById('_toast');
    if (prev) prev.remove();

    const el = document.createElement('div');
    el.id = '_toast';
    Object.assign(el.style, {
      position:   'fixed',
      bottom:     '90px',
      left:       '50%',
      transform:  'translateX(-50%)',
      background: type === 'error' ? '#4a1515' : '#1a3a26',
      color:      '#e4ddd0',
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize:   '12px',
      padding:    '10px 22px',
      borderRadius:'7px',
      zIndex:     '9999',
      border:     `1px solid ${type === 'error' ? '#c94c4c' : '#2a4e34'}`,
      boxShadow:  '0 4px 20px rgba(0,0,0,.5)',
      transition: 'opacity .3s',
      whiteSpace: 'nowrap',
    });
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 320);
    }, 1800);
  }
}
