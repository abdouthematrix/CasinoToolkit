// js/views/editTipsView.js
import { BaseView } from './baseView.js';
import { getTableById } from '../dataService.js';
import { calcTotalTips, calcDenomTotal, fmt } from '../models.js';

const QUICK_AMOUNTS = [500, 200, 100, 50, 25, 10];

export class EditTipsView extends BaseView {

  constructor(app) {
    super(app);
    this._tableId = null;
    this._snapshot = null;
  }

  render(params) {
    this._tableId = params.tableId;
    const table = getTableById(this.app.casinoData, this._tableId);
    if (!table) return '<div class="page-header"><div class="page-title">Table not found</div></div>';

    // Snapshot for cancel / restore
    this._snapshot = JSON.stringify(table);

    const tips = calcTotalTips(table);

    const denomRows = table.denominationCounts.map((dc, i) => /* html */`
      <div class="denom-row">
        <span class="denom-label">${dc.denominationType.name}</span>
        <input class="denom-input" type="number" inputmode="numeric"
               min="0" step="1" value="${dc.count}"
               data-idx="${i}" autocomplete="off">
        <span class="denom-total" data-total="${i}">${fmt(calcDenomTotal(dc))}</span>
      </div>
    `).join('');

    const quickBtns = QUICK_AMOUNTS.map(a => /* html */`
      <button class="quick-add-btn" data-qa="${a}">+${a}</button>
    `).join('');

    return /* html */`
      <div class="page-header">
        <button class="back-btn" id="btn-cancel">← Back</button>
        <div>
          <div class="page-title">${table.name}</div>
          <div class="page-subtitle">Edit Tips</div>
        </div>
      </div>

      <div class="tips-total-card">
        <span class="tips-total-label">Total Tips</span>
        <span class="tips-total-value" id="tips-total">${fmt(tips)}</span>
      </div>

      <div class="quick-add-strip">${quickBtns}</div>

      <div class="denom-grid">${denomRows}</div>

      <div class="divider"></div>

      <div class="wins-grid" style="margin-bottom:0">
        <div class="form-group">
          <label class="form-label">USD Cash</label>
          <input class="form-input" id="usd-cash" type="number" inputmode="decimal"
                 value="${table.usdCash || ''}" placeholder="0.00" autocomplete="off">
        </div>
        <div class="form-group">
          <label class="form-label">EGP Cash</label>
          <input class="form-input" id="egp-cash" type="number" inputmode="decimal"
                 value="${table.egpCash || ''}" placeholder="0.00" autocomplete="off">
        </div>
      </div>

      <div class="action-bar">
        <button class="btn btn-primary flex-1" id="btn-save">Save</button>
        <button class="btn btn-danger" id="btn-clear">Clear All</button>
      </div>
    `;
  }

  bindEvents(params) {
    const table = getTableById(this.app.casinoData, params.tableId);
    if (!table) return;

    // ── Denomination inputs ───────────────────────────────────────────────────
    this.onAll('.denom-input', 'input', e => {
      const i   = parseInt(e.target.dataset.idx);
      const val = Math.max(0, parseInt(e.target.value) || 0);
      e.target.value = val;
      table.denominationCounts[i].count = val;
      const totalEl = this.qs(`[data-total="${i}"]`);
      if (totalEl) totalEl.textContent = fmt(calcDenomTotal(table.denominationCounts[i]));
      this._refreshTotal(table);
    });

    // Tab through denominations with Enter
    this.onAll('.denom-input', 'keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const inputs = this.qsa('.denom-input');
        const idx    = inputs.indexOf(e.target);
        if (idx < inputs.length - 1) {
          inputs[idx + 1].focus();
          inputs[idx + 1].select();
        } else {
          this.qs('#usd-cash')?.focus();
        }
      }
    });

    // ── Cash inputs ───────────────────────────────────────────────────────────
    this.on('#usd-cash', 'input', e => {
      table.usdCash = parseFloat(e.target.value) || 0;
      this._refreshTotal(table);
    });
    this.on('#egp-cash', 'input', e => {
      table.egpCash = parseFloat(e.target.value) || 0;
    });

    // ── Quick-add ─────────────────────────────────────────────────────────────
    this.onAll('[data-qa]', 'click', e => {
      this._quickAdd(table, parseFloat(e.currentTarget.dataset.qa));
    });

    // ── Actions ───────────────────────────────────────────────────────────────
    this.on('#btn-save',   'click', () => this._save());
    this.on('#btn-cancel', 'click', () => this._cancel(table));
    this.on('#btn-clear',  'click', () => this._clearAll(table));
  }

  _refreshTotal(table) {
    const el = this.qs('#tips-total');
    if (el) el.textContent = fmt(calcTotalTips(table));
  }

  _quickAdd(table, amount) {
    const sorted = [...table.denominationCounts]
      .sort((a, b) => b.denominationType.value - a.denominationType.value);

    let remaining = amount;
    for (const dc of sorted) {
      if (remaining <= 0) break;
      if (remaining >= dc.denominationType.value) {
        const toAdd = Math.floor(remaining / dc.denominationType.value);
        dc.count    += toAdd;
        remaining   -= toAdd * dc.denominationType.value;

        const i      = table.denominationCounts.indexOf(dc);
        const input  = this.qs(`.denom-input[data-idx="${i}"]`);
        const totalEl = this.qs(`[data-total="${i}"]`);
        if (input)   input.value        = dc.count;
        if (totalEl) totalEl.textContent = fmt(calcDenomTotal(dc));
      }
    }
    this._refreshTotal(table);
  }

  async _clearAll(table) {
    const ok = await this.confirm('Clear all tips for this table?');
    if (!ok) return;
    table.denominationCounts.forEach(dc => dc.count = 0);
    table.usdCash = 0;
    table.egpCash = 0;
    this.mount(this.container, { tableId: this._tableId });
  }

  _save() {
    this.app.save();
    this.toast('Tips saved ✓');
    this.app.router.navigate('/');
  }

  _cancel(table) {
    // Restore snapshot
    if (this._snapshot) {
      const original = JSON.parse(this._snapshot);
      Object.assign(table, original);
    }
    this.app.router.navigate('/');
  }
}
