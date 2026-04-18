// js/views/editWinsView.js
import { BaseView } from './baseView.js';
import { getTableById } from '../dataService.js';
import { calcWin, calcPlaques, calcDenomTotal, fmt, winClass } from '../models.js';

// Fields rendered as plain inputs
const PLAIN_FIELDS = [
    { key: 'open', label: 'Open' },
    { key: 'close', label: 'Close' },
    { key: 'cash', label: 'Cash' },
];

// Fields rendered as CalcEntry (accumulator) widgets
const CALC_FIELDS = [
    { key: 'fill', label: 'Fill' },
    { key: 'credit', label: 'Credit' },
];

export class EditWinsView extends BaseView {

    constructor(app) {
        super(app);
        this._tableId = null;
        this._snapshot = null;
        // CalcEntry state: mirrors MAUI's _tempSum; entries[] is our extra UX history
        this._calcState = {};
    }

    // ── Render ────────────────────────────────────────────────────────────────

    render(params) {
        this._tableId = params.tableId;
        const table = getTableById(this.app.casinoData, this._tableId);
        if (!table) return '<div class="page-header"><div class="page-title">Table not found</div></div>';

        this._snapshot = JSON.stringify(table);

        // TempSum starts at 0, matching MAUI: private decimal _tempSum = 0
        for (const { key } of CALC_FIELDS) {
            this._calcState[key] = { tempSum: 0, entries: [] };
        }

        const win = calcWin(table);
        const wCls = winClass(win);

        const plainHtml = PLAIN_FIELDS.map(f => /* html */`
      <div class="form-group">
        <label class="form-label">${f.label}</label>
        <input class="form-input wins-field" type="number" inputmode="decimal"
               data-field="${f.key}" value="${table[f.key] || ''}"
               placeholder="0.00" autocomplete="off">
      </div>
    `).join('');

        // Full-width stack, matching MAUI ColumnSpan="2"
        const calcHtml = CALC_FIELDS.map(f =>
            this._calcEntryHtml(f.key, f.label, table[f.key] ?? 0)
        ).join('');

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
    // Columns: [Entry* | + | TempSum | ↩ | C | =]
    // *Entry pre-filled with Value — mirrors MAUI NumberEntry Text="{Binding Value, TwoWay}"

    _calcEntryHtml(field, label, currentValue) {
        return /* html */`
      <div class="calc-entry" id="calc-${field}">
        <div class="calc-entry-label-row">
          <span class="form-label" style="margin:0">${label}</span>
        </div>
        <div class="calc-entry-row">
          <input class="form-input calc-input" id="calc-${field}-input"
                 type="number" inputmode="decimal"
                 value="${currentValue || ''}" placeholder="0"
                 autocomplete="off">
          <button class="btn-calc btn-calc-add"  id="calc-${field}-add"   title="Add to total">+</button>
          <div   class="calc-sum-badge"           id="calc-${field}-sum">0.00</div>
          <button class="btn-calc btn-calc-undo"  id="calc-${field}-undo"  title="Undo last entry" disabled>↩</button>
          <button class="btn-calc btn-calc-clear" id="calc-${field}-clear" title="Clear total">C</button>
          <button class="btn-calc btn-calc-eq"    id="calc-${field}-eq"    title="Commit">=</button>
        </div>
        <div class="calc-history" id="calc-${field}-history" style="display:none"></div>
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

        this.onAll('.wins-field', 'input', e => {
            table[e.target.dataset.field] = parseFloat(e.target.value) || 0;
            this._refreshWin(table);
        });

        this.onAll('.wins-field', 'keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const inputs = this.qsa('.wins-field');
                const idx = inputs.indexOf(e.target);
                if (idx < inputs.length - 1) { inputs[idx + 1].focus(); inputs[idx + 1].select(); }
                else this._save(table);
            }
        });

        for (const { key } of CALC_FIELDS) {
            this._bindCalcEntry(key, table);
        }

        this.onAll('[data-pidx]', 'input', e => {
            const i = parseInt(e.target.dataset.pidx);
            const val = Math.max(0, parseInt(e.target.value) || 0);
            e.target.value = val;
            table.plaqueCounts[i].count = val;
            const totalEl = this.qs(`[data-ptotal="${i}"]`);
            if (totalEl) totalEl.textContent = fmt(val * table.plaqueCounts[i].denominationType.value);
            table.plaques = calcPlaques(table);
            const ptEl = this.qs('#plaques-total');
            if (ptEl) ptEl.textContent = fmt(table.plaques);
            this._refreshWin(table);
        });

        this.onAll('[data-pidx]', 'keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const inputs = this.qsa('[data-pidx]');
                const idx = inputs.indexOf(e.target);
                if (idx < inputs.length - 1) { inputs[idx + 1].focus(); inputs[idx + 1].select(); }
            }
        });

        this.on('#btn-save', 'click', () => this._save(table));
        this.on('#btn-cancel', 'click', () => this._cancel(table));
        this.on('#btn-clear', 'click', () => this._clearAll(table));
    }

    // ── CalcEntry binding — mirrors NumericCalculatorEntry.xaml.cs ────────────

    _bindCalcEntry(field, table) {
        const state = this._calcState[field];  // { tempSum: 0, entries: [] }
        const input = this.qs(`#calc-${field}-input`);
        const sumEl = this.qs(`#calc-${field}-sum`);
        const histEl = this.qs(`#calc-${field}-history`);
        const undoBtn = this.qs(`#calc-${field}-undo`);

        const getInputVal = () => parseFloat(input?.value) || 0;

        // Mirrors TempSumDisplay — live preview: TempSum + current input
        const refreshSumBadge = () => {
            const inputVal = getInputVal();
            const display = state.tempSum + inputVal;
            if (sumEl) {
                sumEl.textContent = fmt(display);
                sumEl.classList.toggle('calc-sum-active', state.tempSum !== 0);
            }
        };

        // History chips: our UX addition on top of MAUI baseline
        const renderHistory = () => {
            if (!histEl) return;
            if (state.entries.length === 0) {
                histEl.innerHTML = '';
                histEl.style.display = 'none';
                return;
            }
            histEl.style.display = 'flex';
            histEl.innerHTML = state.entries.map((v, i) => /* html */`
        <span class="calc-hist-chip">
          ${fmt(v)}
          <button class="calc-hist-remove" data-idx="${i}" title="Remove">×</button>
        </span>
      `).join('');

            histEl.querySelectorAll('.calc-hist-remove').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.dataset.idx);
                    const removed = state.entries.splice(idx, 1)[0];
                    state.tempSum -= removed;
                    renderHistory();
                    refreshSumBadge();
                    updateUndo();
                    this._refreshWin(table);
                });
            });
        };

        const updateUndo = () => {
            if (undoBtn) undoBtn.disabled = state.entries.length === 0;
        };

        // ── OnAdd: mirrors MAUI OnAdd() exactly ─────────────────────────────────
        const onAdd = () => {
            const val = getInputVal();
            if (val !== 0) {
                state.tempSum += val;
                state.entries.push(val);
                if (input) { input.value = ''; input.focus(); }
                renderHistory();
                refreshSumBadge();
                updateUndo();
                this._refreshWin(table);
            } else {
                // MAUI: NumberEntry.Placeholder = "Enter a number first"
                if (input) {
                    input.placeholder = 'Enter a number first';
                    setTimeout(() => { if (input) input.placeholder = '0'; }, 2000);
                    input.focus();
                }
            }
        };

        // ── OnClear: TempSum = 0 + clear input ──────────────────────────────────
        // MAUI OnClear() only sets TempSum = 0; the Entry auto-clears via TwoWay
        // binding to Value. We have no TwoWay binding, so we must clear the input
        // explicitly — otherwise getInputVal() still returns the pre-filled value
        // and the sum badge shows that number instead of 0.
        const onClear = () => {
            state.tempSum = 0;
            state.entries = [];
            if (input) input.value = '';
            renderHistory();
            refreshSumBadge();
            updateUndo();
        };

        // ── OnCommit: mirrors MAUI OnCommit() exactly ────────────────────────────
        // 1. if currentInput != 0 → TempSum += input
        // 2. Value = TempSum  →  table[field] = tempSum
        // 3. TempSum = 0
        // 4. CurrentInput = Value.ToString()  →  input.value = committed result
        // 5. Focus
        const onCommit = () => {
            const inputVal = getInputVal();
            if (inputVal !== 0) {
                state.tempSum += inputVal;
                state.entries.push(inputVal);
            }

            if (state.tempSum !== 0) {
                table[field] = state.tempSum;       // Value = TempSum
                state.tempSum = 0;                   // TempSum = 0
                state.entries = [];

                if (input) input.value = table[field]; // CurrentInput = Value.ToString()
                if (sumEl) { sumEl.textContent = '0.00'; sumEl.classList.remove('calc-sum-active'); }

                renderHistory();
                updateUndo();
                this._refreshWin(table);

                const el = this.qs(`#calc-${field}`);
                if (el) { el.classList.add('calc-committed'); setTimeout(() => el.classList.remove('calc-committed'), 600); }
            }

            if (input) input.focus();
        };

        this.on(`#calc-${field}-add`, 'click', onAdd);
        this.on(`#calc-${field}-clear`, 'click', onClear);
        this.on(`#calc-${field}-eq`, 'click', onCommit);

        // ↩ undo — our addition (not in MAUI)
        this.on(`#calc-${field}-undo`, 'click', () => {
            if (state.entries.length > 0) {
                const removed = state.entries.pop();
                state.tempSum -= removed;
                renderHistory();
                refreshSumBadge();
                updateUndo();
                this._refreshWin(table);
                input?.focus();
            }
        });

        // Mirrors MAUI: Entry.Completed → OnAdd | OnEntryTextChanged → refreshes TempSumDisplay
        if (input) {
            input.addEventListener('input', refreshSumBadge);
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') { e.preventDefault(); onAdd(); }
            });
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    _refreshWin(table) {
        const el = this.qs('#win-display');
        if (!el) return;
        const win = calcWin(table);
        el.textContent = fmt(win);
        el.className = 'win-result-value ' + winClass(win);
    }

    async _clearAll(table) {
        const ok = await this.confirm('Clear all win data for this table?');
        if (!ok) return;
        ['open', 'close', 'fill', 'credit', 'plaques', 'cash'].forEach(k => { table[k] = 0; });
        if (table.plaqueCounts) table.plaqueCounts.forEach(pc => { pc.count = 0; });
        this.mount(this.container, { tableId: this._tableId });
    }

    _save(table) {
        // Auto-commit any in-progress CalcEntry — mirrors implicit OnCommit before Save
        for (const { key } of CALC_FIELDS) {
            const state = this._calcState[key];
            const inputEl = this.qs(`#calc-${key}-input`);
            const inputVal = parseFloat(inputEl?.value) || 0;
            if (inputVal !== 0) state.tempSum += inputVal;
            if (state.tempSum !== 0) {
                table[key] = state.tempSum;
                state.tempSum = 0;
                state.entries = [];
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