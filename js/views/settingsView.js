// js/views/settingsView.js
import { BaseView } from './baseView.js';
import {
  saveSettings, getDefaultSettings,
  createDefaultCasinoData, saveCasinoData,
  applySettingsToCasinoData,
} from '../dataService.js';

export class SettingsView extends BaseView {

  render() {
    const { sectionsData, denominationTypes } = this.app.settings;

    const sectionsHtml = sectionsData.map((si, i) => /* html */`
      <div class="section-info-row">
        <input class="form-input si-name" type="text"
               placeholder="Section name" value="${this._esc(si.name)}"
               data-idx="${i}" style="min-width:80px">
        <input class="form-input si-tables" type="text"
               placeholder="Tables (comma-separated)"
               value="${si.tablesNames.map(n => this._esc(n)).join(', ')}"
               data-idx="${i}" style="min-width:80px">
        <button class="btn btn-danger rm-section" data-idx="${i}"
                style="padding:8px 10px;flex-shrink:0">✕</button>
      </div>
    `).join('');

    const denomsHtml = denominationTypes.map((dt, i) => /* html */`
      <div class="denom-type-row">
        <input class="form-input dt-name" type="text"
               placeholder="Label" value="${this._esc(dt.name)}" data-idx="${i}">
        <input class="form-input dt-value" type="number" inputmode="decimal"
               placeholder="Value" value="${dt.value}" data-idx="${i}">
        <button class="btn btn-danger rm-denom" data-idx="${i}"
                style="padding:8px 10px;flex-shrink:0">✕</button>
      </div>
    `).join('');

    return /* html */`
      <div class="page-header">
        <button class="back-btn" id="btn-back">← Back</button>
        <div class="page-title">Settings</div>
      </div>

      <!-- Sections -->
      <div class="settings-section">
        <div class="settings-section-title">Sections &amp; Tables</div>
        <div id="sections-list">${sectionsHtml}</div>
        <button class="btn btn-secondary mt-1" id="btn-add-section">+ Add Section</button>
      </div>

      <!-- Denominations -->
      <div class="settings-section">
        <div class="settings-section-title">Denomination Types</div>
        <div id="denoms-list">${denomsHtml}</div>
        <button class="btn btn-secondary mt-1" id="btn-add-denom">+ Add Denomination</button>
      </div>

      <!-- Danger zone -->
      <div class="settings-section">
        <div class="settings-section-title" style="color:var(--red)">Danger Zone</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-secondary" id="btn-reset-settings">Reset to Defaults</button>
          <button class="btn btn-danger"    id="btn-reset-data">Wipe Table Data</button>
        </div>
      </div>

      <div class="action-bar">
        <button class="btn btn-primary flex-1" id="btn-save">Save Settings</button>
      </div>
    `;
  }

  bindEvents() {
    this.on('#btn-back', 'click', () => this.app.router.navigate('/'));

    // ── Add rows ──────────────────────────────────────────────────────────────
    this.on('#btn-add-section', 'click', () => {
      const n = this.app.settings.sectionsData.length + 1;
      this.app.settings.sectionsData.push({ name: `Section ${n}`, tablesNames: [`Table 1`] });
      this.mount(this.container, {});
    });

    this.on('#btn-add-denom', 'click', () => {
      this.app.settings.denominationTypes.push({ name: '$', value: 0 });
      this.mount(this.container, {});
    });

    // ── Remove rows ───────────────────────────────────────────────────────────
    this.onAll('.rm-section', 'click', e => {
      const i = parseInt(e.currentTarget.dataset.idx);
      if (this.app.settings.sectionsData.length > 1) {
        this.app.settings.sectionsData.splice(i, 1);
        this.mount(this.container, {});
      } else {
        this.toast('At least one section required.', 'error');
      }
    });

    this.onAll('.rm-denom', 'click', e => {
      const i = parseInt(e.currentTarget.dataset.idx);
      this.app.settings.denominationTypes.splice(i, 1);
      this.mount(this.container, {});
    });

    // ── Live edits ────────────────────────────────────────────────────────────
    this.onAll('.si-name', 'input', e => {
      const i = parseInt(e.target.dataset.idx);
      this.app.settings.sectionsData[i].name = e.target.value;
    });

    this.onAll('.si-tables', 'input', e => {
      const i = parseInt(e.target.dataset.idx);
      this.app.settings.sectionsData[i].tablesNames =
        e.target.value.split(',').map(s => s.trim()).filter(Boolean);
    });

    this.onAll('.dt-name', 'input', e => {
      const i = parseInt(e.target.dataset.idx);
      this.app.settings.denominationTypes[i].name = e.target.value;
    });

    this.onAll('.dt-value', 'input', e => {
      const i = parseInt(e.target.dataset.idx);
      this.app.settings.denominationTypes[i].value = parseFloat(e.target.value) || 0;
    });

    // ── Save ──────────────────────────────────────────────────────────────────
    this.on('#btn-save', 'click', async () => {
      saveSettings(this.app.settings);
      this.app.casinoData = applySettingsToCasinoData(this.app.settings, this.app.casinoData);
      saveCasinoData(this.app.casinoData);
      this.toast('Settings saved ✓');
      this.app.router.navigate('/');
    });

    // ── Reset settings ────────────────────────────────────────────────────────
    this.on('#btn-reset-settings', 'click', async () => {
      const ok = await this.confirm('Reset all settings to factory defaults?');
      if (!ok) return;
      this.app.settings = getDefaultSettings();
      saveSettings(this.app.settings);
      this.mount(this.container, {});
      this.toast('Settings reset ✓');
    });

    // ── Wipe data ─────────────────────────────────────────────────────────────
    this.on('#btn-reset-data', 'click', async () => {
      const ok = await this.confirm('Delete ALL table data? This cannot be undone!');
      if (!ok) return;
      this.app.casinoData = createDefaultCasinoData(this.app.settings);
      saveCasinoData(this.app.casinoData);
      this.toast('Table data wiped ✓');
      this.app.router.navigate('/');
    });
  }

  /** Escape HTML special chars for attribute/text safety */
  _esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
}
