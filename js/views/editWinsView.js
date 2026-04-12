// js/views/editWinsView.js
import { BaseView } from './baseView.js';
import { getTableById } from '../dataService.js';
import { calcWin, fmt, winClass } from '../models.js';

const WIN_FIELDS = [
  { key: 'open',    label: 'Open'    },
  { key: 'close',   label: 'Close'   },
  { key: 'fill',    label: 'Fill'    },
  { key: 'credit',  label: 'Credit'  },
  { key: 'plaques', label: 'Plaques' },
  { key: 'cash',    label: 'Cash'    },
];

export class EditWinsView extends BaseView {

  constructor(app) {
    super(app);
    this._tableId = null;
    this._snapshot = null;
  }

  render(params) {
    this._tableId = params.tableId;
    const table = getTableById(this.app.casinoData, this._tableId);
    if (!table) return '<div class="page-header"><div class="page-title">Table not found</div></div>';

    this._snapshot = JSON.stringify(table);

    const win  = calcWin(table);
    const wCls = winClass(win);

    const fieldsHtml = WIN_FIELDS.map(f => /* html */`
      <div class="form-group">
        <label class="form-label">${f.label}</label>
        <input class="form-input wins-field" type="number" inputmode="decimal"
               data-field="${f.key}" value="${table[f.key] || ''}"
               placeholder="0.00" autocomplete="off">
      </div>
    `).join('');

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
        ${fieldsHtml}
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

    this.onAll('.wins-field', 'input', e => {
      table[e.target.dataset.field] = parseFloat(e.target.value) || 0;
      this._refreshWin(table);
    });

    // Enter to advance to next input
    this.onAll('.wins-field', 'keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const inputs = this.qsa('.wins-field');
        const idx    = inputs.indexOf(e.target);
        if (idx < inputs.length - 1) {
          inputs[idx + 1].focus();
          inputs[idx + 1].select();
        } else {
          this._save();
        }
      }
    });

    this.on('#btn-save',   'click', () => this._save());
    this.on('#btn-cancel', 'click', () => this._cancel(table));
    this.on('#btn-clear',  'click', () => this._clearAll(table));
  }

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
    WIN_FIELDS.forEach(f => { table[f.key] = 0; });
    this.mount(this.container, { tableId: this._tableId });
  }

  _save() {
    this.app.save();
    this.toast('Wins saved ✓');
    this.app.router.navigate('/');
  }

  _cancel(table) {
    if (this._snapshot) Object.assign(table, JSON.parse(this._snapshot));
    this.app.router.navigate('/');
  }
}
