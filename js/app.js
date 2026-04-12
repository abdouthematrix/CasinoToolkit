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
    // ── State ─────────────────────────────────────────────────────────────────
    this.settings    = loadSettings();
    this.casinoData  = loadCasinoData(this.settings);

    // ── Router ────────────────────────────────────────────────────────────────
    this.router = new Router();

    // ── Views (one instance each) ─────────────────────────────────────────────
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
      .on('/',                     ()       => this._show('main'))
      .on('/edit-tips/:tableId',   params   => this._show('editTips', params))
      .on('/edit-wins/:tableId',   params   => this._show('editWins', params))
      .on('/settings',             ()       => this._show('settings'))
      .on('/summary',              ()       => this._show('summary'));

    // Fire initial route
    this.router.dispatch();
  }

  // ── Public helpers (used by views) ────────────────────────────────────────

  /** Persist casino data to localStorage */
  save() {
    saveCasinoData(this.casinoData);
  }

  // ── Private ───────────────────────────────────────────────────────────────

  _show(name, params = {}) {
    this._views[name].mount(this._appEl, params);
  }
}

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
