// js/router.js
// ── Lightweight hash-based SPA router ─────────────────────────────────────────

export class Router {
  constructor() {
    this._routes = [];
    window.addEventListener('hashchange', () => this._dispatch());
  }

  /** Register a route. Returns `this` for chaining. */
  on(pattern, handler) {
    this._routes.push({
      pattern,
      handler,
      regex:      this._toRegex(pattern),
      paramNames: this._paramNames(pattern),
    });
    return this;
  }

  /** Navigate to a path (sets hash). */
  navigate(path) {
    const hash = '#' + path;
    if (window.location.hash === hash) {
      // Same route — force re-dispatch
      this._dispatch();
    } else {
      window.location.hash = hash;
    }
  }

  /** Manually fire the current route (call after registering all routes). */
  dispatch() {
    this._dispatch();
  }

  // ── Private ────────────────────────────────────────────────────────────────

  _dispatch() {
    const path = window.location.hash.slice(1) || '/';
    for (const route of this._routes) {
      const m = path.match(route.regex);
      if (m) {
        const params = Object.fromEntries(route.paramNames.map((n, i) => [n, decodeURIComponent(m[i + 1])]));
        route.handler(params);
        return;
      }
    }
  }

  _toRegex(pattern) {
      const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const withVars = escaped.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, '([^/]+)');
    return new RegExp('^' + withVars + '$');
  }

  _paramNames(pattern) {
    return [...pattern.matchAll(/:([a-zA-Z_][a-zA-Z0-9_]*)/g)].map(m => m[1]);
  }
}
