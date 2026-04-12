// js/views/editWinsView.js
import { BaseView } from './baseView.js';
import { getTableById } from '../dataService.js';
import { calcWin, calcPlaques, calcDenomTotal, fmt, winClass } from '../models.js';

// Fields rendered as plain inputs
const PLAIN_FIELDS = [
  { key: 'open',  label: 'Open'  },
  { key: 'close', label: 'Close' },
  { key: 'cash',  label: 'Cash'  },
];

// Fields rendered as CalcEntry (accumulator) widgets
const CALC_FIELDS = [
  { key: 'fill',   label: 'Fill'   },
  { key: 'credit', label: 'Credit' },
];

export class EditWinsView extends BaseView {

  constructor(app) {
    super(app);
    this._tableId  = null;
    this._snapshot = null;
    // CalcEntry state: original value + accumulated entries for this session
    this._calcState = {};
  }

  // ── Render ────────────────────────────────────────────────────────────────

  render(params) {
    this._tableId  = params.tableId;
    const table    = getTableById(this.app.casinoData, this._tableId);
    if (!table) return '<div class="page-header"><div class="page-title">Table not found</div></div>';

    this._snapshot = JSON.stringify(table);

    // Init CalcEntry state per calc field
    for (const { key } of CALC_FIELDS) {
      this._calcState[key] = {
        savedValue: table[key] ?? 0,
        entries:    [],
      };
    }

    const win  = calcWin(table);
    const wCls = winClass(win);

    // Plain inputs (open, close, cash)
    const plainHtml = PLAIN_FIELDS.map(f => /* html */`
      <div class="form-group">
        <label class="form-label">${f.label}</label>
        <input class="form-input wins-field" type="number" inputmode="decimal"
               data-field="${f.key}" value="${table[f.key] || ''}"
               placeholder="0.00" autocomplete="off">
      </div>
    `).join('');

    // CalcEntry widgets (fill, credit)
    const calcHtml = CALC_FIELDS.map(f => this._calcEntryHtml(f.key, f.label, table[f.key] ?? 0)).join('');

    // Plaque denomination panel
    const plaqueHtml = this._plaquePanelHtml(table);

    return /* html */`
      <div class="page-header">
        <button class="back-btn" id="btn-cancel">← Back</button>
        <div>
          <div class="page-title">${table.name}</div>
          <div class="page-subtitle">Edit Wins</div>
        </div>
      </div>

      <div class="win-result-card">
        <div>
          <div class="win-result-label">Net Win</div>
          <div class="win-formula">Close − Open − Fill + Credit + Plaques + Cash</div>
        </div>
        <div class="win-result-value ${wCls}" id="win-display">${fmt(win)}</div>
      </div>

      <div class="wins-grid">
        ${plainHtml}
      </div>

      <div class="wins-calc-section">
        ${calcHtml}
      </div>

      ${plaqueHtml}

      <div class="action-bar">
        <button class="btn btn-primary flex-1" id="btn-save">Save</button>
        <button class="btn btn-danger" id="btn-clear">Clear All</button>
      </div>
    `;
  }

  // ── CalcEntry HTML ────────────────────────────────────────────────────────

  _calcEntryHtml(field, label, currentValue) {
    return /* html */`
      <div class="calc-entry" id="calc-${field}">
        <div class="calc-entry-label-row">
          <span class="form-label" style="margin:0">${label}</span>
          <span class="calc-saved-badge" id="calc-${field}-saved">
            saved&nbsp;<span>${fmt(currentValue)}</span>
          </span>
        </div>
        <div class="calc-entry-row">
          <input class="form-input calc-input" id="calc-${field}-input"
                 type="number" inputmode="decimal" placeholder="0"
                 autocomplete="off">
          <button class="btn-calc btn-calc-add" id="calc-${field}-add"
                  title="Add to running total">+</button>
          <div class="calc-sum-badge" id="calc-${field}-sum">${fmt(currentValue)}</div>
          <button class="btn-calc btn-calc-clear" id="calc-${field}-clear"
                  title="Clear running total">C</button>
          <button class="btn-calc btn-calc-eq" id="calc-${field}-eq"
                  title="Commit value">=</button>
        </div>
      </div>
    `;
  }

  // ── Plaque Panel HTML ─────────────────────────────────────────────────────

  _plaquePanelHtml(table) {
    if (!table.plaqueCounts?.length) return '';

    const rows = table.plaqueCounts.map((pc, i) => /* html */`
      <div class="denom-row plaque-row">
        <span class="denom-label plaque-label">${pc.denominationType.name}</span>
        <input class="denom-input" type="number" inputmode="numeric"
               min="0" step="1" value="${pc.count}"
               data-pidx="${i}" autocomplete="off">
        <span class="denom-total" data-ptotal="${i}">${fmt(pc.count * pc.denominationType.value)}</span>
      </div>
    `).join('');

    const total = calcPlaques(table);

    return /* html */`
      <div class="plaques-panel">
        <div class="plaques-panel-header">
          <span class="form-label" style="margin:0">Plaques Breakdown</span>
          <div class="plaques-panel-total-row">
            <span class="plaques-panel-label">Total Plaques</span>
            <span class="plaques-panel-total" id="plaques-total">${fmt(total)}</span>
          </div>
        </div>
        <div class="denom-grid" style="margin:0;padding:10px 12px;">
          ${rows}
        </div>
      </div>
    `;
  }

  // ── Events ────────────────────────────────────────────────────────────────

  bindEvents(params) {
    const table = getTableById(this.app.casinoData, params.tableId);
    if (!table) return;

    // Plain inputs
    this.onAll('.wins-field', 'input', e => {
      table[e.target.dataset.field] = parseFloat(e.target.value) || 0;
      this._refreshWin(table);
    });

    this.onAll('.wins-field', 'keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const inputs = this.qsa('.wins-field');
        const idx    = inputs.indexOf(e.target);
        if (idx < inputs.length - 1) { inputs[idx + 1].focus(); inputs[idx + 1].select(); }
        else this._save();
      }
    });

    // CalcEntry widgets
    for (const { key } of CALC_FIELDS) {
      this._bindCalcEntry(key, table);
    }

    // Plaque inputs
    this.onAll('[data-pidx]', 'input', e => {
      const i   = parseInt(e.target.dataset.pidx);
      const val = Math.max(0, parseInt(e.target.value) || 0);
      e.target.value = val;
      table.plaqueCounts[i].count = val;
      const totalEl = this.qs(`[data-ptotal="${i}"]`);
      if (totalEl) totalEl.textContent = fmt(val * table.plaqueCounts[i].denominationType.value);
      // Sync table.plaques to sum of plaqueCounts
      table.plaques = calcPlaques(table);
      const ptEl = this.qs('#plaques-total');
      if (ptEl) ptEl.textContent = fmt(table.plaques);
      this._refreshWin(table);
    });

    this.onAll('[data-pidx]', 'keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const inputs = this.qsa('[data-pidx]');
        const idx    = inputs.indexOf(e.target);
        if (idx < inputs.length - 1) { inputs[idx + 1].focus(); inputs[idx + 1].select(); }
      }
    });

    // Action buttons
    this.on('#btn-save',   'click', () => this._save(table));
    this.on('#btn-cancel', 'click', () => this._cancel(table));
    this.on('#btn-clear',  'click', () => this._clearAll(table));
  }

  // ── CalcEntry binding ─────────────────────────────────────────────────────

  _bindCalcEntry(field, table) {
    const state   = this._calcState[field];
    const input   = this.qs(`#calc-${field}-input`);
    const sumEl   = this.qs(`#calc-${field}-sum`);
    const savedEl = this.qs(`#calc-${field}-saved span`);

    const getInputVal = () => parseFloat(input?.value) || 0;

    const runningTotal = () => state.entries.reduce((s, v) => s + v, 0);

    const refreshDisplay = () => {
      // Show running total + current input as live preview
      const preview = runningTotal() + getInputVal();
      if (sumEl) {
        sumEl.textContent = fmt(
          state.entries.length > 0 || getInputVal() !== 0
            ? preview
            : state.savedValue
        );
        sumEl.classList.toggle('calc-sum-active', state.entries.length > 0);
      }
    };

    const commitEntries = () => {
      // Finalise the sum: entries + current uncommitted input
      const inputVal = getInputVal();
      if (inputVal !== 0) state.entries.push(inputVal);
      const total = runningTotal();
      if (state.entries.length > 0) {
        table[field] = total;
        if (savedEl) { savedEl.textContent = fmt(table[field]); }
        if (sumEl)   { sumEl.textContent = fmt(total); sumEl.classList.add('calc-sum-active'); }
      }
      state.entries = [];
      if (input) input.value = '';
      this._refreshWin(table);
    };

    // + button
    this.on(`#calc-${field}-add`, 'click', () => {
      const val = getInputVal();
      if (val !== 0) {
        state.entries.push(val);
        table[field] = state.savedValue + runningTotal();
        if (input) { input.value = ''; input.focus(); }
        refreshDisplay();
        this._refreshWin(table);
      } else {
        input?.focus();
      }
    });

    // = button (commit)
    this.on(`#calc-${field}-eq`, 'click', () => {
      commitEntries();
      const el = this.qs(`#calc-${field}`);
      if (el) { el.classList.add('calc-committed'); setTimeout(() => el.classList.remove('calc-committed'), 600); }
    });

    // C button (clear back to saved value)
    this.on(`#calc-${field}-clear`, 'click', () => {
      state.entries = [];
      table[field]  = state.savedValue;
      if (input) input.value = '';
      if (sumEl) { sumEl.textContent = fmt(state.savedValue); sumEl.classList.remove('calc-sum-active'); }
      this._refreshWin(table);
    });

    // Live preview as user types
    if (input) {
      input.addEventListener('input', refreshDisplay);
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); this.qs(`#calc-${field}-add`)?.click(); }
      });
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  _refreshWin(table) {
    const el = this.qs('#win-display');
    if (!el) return;
    const win = calcWin(table);
    el.textContent = fmt(win);
    el.className   = 'win-result-value ' + winClass(win);
  }

  async _clearAll(table) {
    const ok = await this.confirm('Clear all win data for this table?');
    if (!ok) return;
    ['open','close','fill','credit','plaques','cash'].forEach(k => { table[k] = 0; });
    if (table.plaqueCounts) table.plaqueCounts.forEach(pc => { pc.count = 0; });
    this.mount(this.container, { tableId: this._tableId });
  }

  _save(table) {
    // Auto-commit any uncommitted CalcEntry inputs before saving
    for (const { key } of CALC_FIELDS) {
      const state    = this._calcState[key];
      const inputEl  = this.qs(`#calc-${key}-input`);
      const inputVal = parseFloat(inputEl?.value) || 0;
      if (state.entries.length > 0 || inputVal !== 0) {
        if (inputVal !== 0) state.entries.push(inputVal);
        if (state.entries.length > 0) {
          table[key] = state.entries.reduce((s, v) => s + v, 0);
        }
      }
    }
    this.app.save();
    this.toast('Wins saved ✓');
    this.app.router.navigate('/');
  }

  _cancel(table) {
    if (this._snapshot) Object.assign(table, JSON.parse(this._snapshot));
    this.app.router.navigate('/');
  }
}
