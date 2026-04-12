// js/views/mainView.js
import { BaseView } from './baseView.js';
import {
  calcWin, calcTotalTips,
  calcSectionTotalTips, calcSectionTotalWins,
  calcCasinoTotalTips,  calcCasinoTotalWins,
  fmt, winClass,
} from '../models.js';

export class MainView extends BaseView {

  render() {
    const data      = this.app.casinoData;
    const totalTips = calcCasinoTotalTips(data);
    const totalWins = calcCasinoTotalWins(data);
    const isDark    = document.documentElement.dataset.theme !== 'light';

    const sections = data.sections.map(s => this._section(s)).join('');

    return /* html */`
      <div class="main-nav">
        <div class="logo">Casino Toolkit<span>Daily Tracker</span></div>
        <div class="nav-actions">
          <button class="btn btn-secondary" id="btn-summary">Summary</button>
          <button class="btn-icon" id="btn-theme" title="Toggle theme"
                  aria-label="Toggle light/dark mode">
            ${isDark ? '☀' : '🌙'}
          </button>
          <button class="btn-icon" id="btn-settings" title="Settings">⚙</button>
        </div>
      </div>

      <div class="divider mt-2"></div>

      <div id="sections-list">${sections}</div>

      <div class="total-bar">
        <div class="total-bar-inner">
          <div class="total-bar-item">
            <div class="total-bar-label">Grand Tips</div>
            <div class="total-bar-value value-tips">${fmt(totalTips)}</div>
          </div>
          <div style="width:1px;height:36px;background:var(--border)"></div>
          <div class="total-bar-item">
            <div class="total-bar-label">Grand Win</div>
            <div class="total-bar-value ${winClass(totalWins)}">${fmt(totalWins)}</div>
          </div>
        </div>
      </div>
    `;
  }

  _section(section) {
    const sTips = calcSectionTotalTips(section);
    const sWins = calcSectionTotalWins(section);

    const tables = section.tables.map(table => {
      const tips = calcTotalTips(table);
      const win  = calcWin(table);
      return /* html */`
        <div class="table-card">
          <div class="table-card-name">${table.name}</div>
          <div class="table-card-stats">
            <div class="table-stat">
              <span class="table-stat-label">Tips</span>
              <span class="table-stat-value ${tips > 0 ? 'value-tips' : 'value-zero'}">${fmt(tips)}</span>
            </div>
            <div class="table-stat">
              <span class="table-stat-label">Win</span>
              <span class="table-stat-value ${winClass(win)}">${fmt(win)}</span>
            </div>
          </div>
          <div class="table-card-actions">
            <button class="tbl-btn tbl-btn-tips" data-action="tips" data-id="${table.id}">Tips</button>
            <button class="tbl-btn tbl-btn-wins" data-action="wins" data-id="${table.id}">Wins</button>
          </div>
        </div>
      `;
    }).join('');

    return /* html */`
      <div class="card section-card">
        <div class="section-header">
          <div class="section-name">${section.name}</div>
          <div class="section-totals">
            <div class="section-total-item">
              <div class="section-total-label">Tips</div>
              <div class="section-total-value ${sTips > 0 ? 'value-tips' : 'value-zero'}">${fmt(sTips)}</div>
            </div>
            <div class="section-total-item">
              <div class="section-total-label">Win</div>
              <div class="section-total-value ${winClass(sWins)}">${fmt(sWins)}</div>
            </div>
          </div>
        </div>
        <div class="tables-grid">${tables}</div>
      </div>
    `;
  }

  bindEvents() {
    this.on('#btn-summary',  'click', () => this.app.router.navigate('/summary'));
    this.on('#btn-settings', 'click', () => this.app.router.navigate('/settings'));
    this.on('#btn-theme',    'click', () => {
      this.app.toggleTheme();
      // Re-render to update the icon
      this.mount(this.container, {});
    });

    this.onAll('[data-action]', 'click', e => {
      const { action, id } = e.currentTarget.dataset;
      if (action === 'tips') this.app.router.navigate(`/edit-tips/${id}`);
      if (action === 'wins') this.app.router.navigate(`/edit-wins/${id}`);
    });
  }
}
