// js/app.js
// ── Application bootstrap ─────────────────────────────────────────────────────

import { loadSettings, loadCasinoData, saveCasinoData } from './dataService.js';
import { Router }       from './router.js';
import { MainView }     from './views/mainView.js';
import { EditTipsView } from './views/editTipsView.js';
import { EditWinsView } from './views/editWinsView.js';
import { SettingsView } from './views/settingsView.js';
import { SummaryView }  from './views/summaryView.js';

export class App {
  constructor() {
    // ── Theme ─────────────────────────────────────────────────────────────────
    // (Also applied early via inline script in index.html to avoid FOUC)
    const savedTheme = localStorage.getItem('casinoToolkit_theme') || 'dark';
    document.documentElement.dataset.theme = savedTheme;

    // ── State ─────────────────────────────────────────────────────────────────
    this.settings   = loadSettings();
    this.casinoData = loadCasinoData(this.settings);

    // ── Router ────────────────────────────────────────────────────────────────
    this.router = new Router();

    // ── Views ─────────────────────────────────────────────────────────────────
    this._views = {
      main:     new MainView(this),
      editTips: new EditTipsView(this),
      editWins: new EditWinsView(this),
      settings: new SettingsView(this),
      summary:  new SummaryView(this),
    };

    this._appEl = document.getElementById('app');

    // ── Routes ────────────────────────────────────────────────────────────────
    this.router
      .on('/',                   ()     => this._show('main'))
      .on('/edit-tips/:tableId', p      => this._show('editTips', p))
      .on('/edit-wins/:tableId', p      => this._show('editWins', p))
      .on('/settings',           ()     => this._show('settings'))
      .on('/summary',            ()     => this._show('summary'));

    this.router.dispatch();
  }

  // ── Public ────────────────────────────────────────────────────────────────

  save() {
    saveCasinoData(this.casinoData);
  }

  toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('casinoToolkit_theme', next);
  }

  // ── Private ───────────────────────────────────────────────────────────────

  _show(name, params = {}) {
    this._views[name].mount(this._appEl, params);
  }
}

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();

  // Register service worker for PWA offline support
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
});
