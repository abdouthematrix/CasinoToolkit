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
    <div class="denom-quick">
    ${this._renderQuickStacks(i)}
    </div>
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

    _renderQuickStacks(index) {
        const options = [5, 10, 20, 100];

        return options.map(chips => /* html */`
    <div class="quick-stack" title="Add ${chips} chips"
         data-idx="${index}" 
         data-chips="${chips}">
      ${this.renderStack(chips)}
    </div>
  `).join('');
    }

    renderStack(amount, chipsPerStack = 20) {
        const stacks = Math.ceil(amount / chipsPerStack);

        const stackWidth = 60;   // horizontal spacing
        const chipStepY = 20;
        const baseY = 380;

        let uses = '';

        for (let s = 0; s < stacks; s++) {
            const chipsInThisStack = Math.min(
                chipsPerStack,
                amount - (s * chipsPerStack)
            );

            for (let i = 0; i < chipsInThisStack; i++) {
                uses += `
        <use href="#chip_template"
             x="${s * stackWidth}"
             y="${baseY - i * chipStepY}" />
      `;
            }
        }

        const width = stacks * stackWidth;

        return `
    <svg width="30" height="30" viewBox="0 0 ${width} 512">
      <defs>${this._chipTemplate()}</defs>
      <g>${uses}</g>
    </svg>
  `;
    }

    _chipTemplate() {
        return `
  <g id="chip_template">
    <path style="fill:#ff0000;" d="M95.324,49.492c-7.26-18.227-25.032-31.13-45.85-31.13s-38.589,12.902-45.85,31.13H0v18.243l0,0c0,13.635,5.524,25.979,14.459,34.913l0,0c8.934,8.934,21.279,14.459,34.913,14.459c27.269,0,49.372-22.103,49.372-49.372V49.492H95.324L95.324,49.492z"></path>
    <path style="fill:#D7ECED;" d="M32.808,84.405H14.565v18.243l0,0l0,0c9.641,9.641,22.277,14.459,34.913,14.459V67.735L32.808,84.405z"></path>
    <path style="fill:#D7ECED;" d="M98.846,67.734V49.491h-3.523c-2.499-6.267-6.257-11.884-10.936-16.584v34.826H49.474l34.913,34.913C94.028,93.006,98.846,80.37,98.846,67.734L98.846,67.734z"></path>
    <path style="fill:#ff0000;" d="M84.387,84.405H66.144L49.473,67.734v49.372c13.635,0,25.979-5.524,34.913-14.459l0,0l0,0V84.405z"></path>
    <circle style="fill:#2D5872;" cx="49.474" cy="49.512" r="49.372"></circle>
    <path style="fill:#FFFFFF;" d="M49.474,0.119v49.372l34.913-34.913C74.746,4.942,62.11,0.119,49.474,0.119z"></path>
    <path style="fill:#FC611F;" d="M14.566,14.578l34.913,34.913V0.119C35.839,0.119,23.5,5.644,14.566,14.578z"></path>
    <path style="fill:#FFFFFF;" d="M0.102,49.492h49.372L14.561,14.579C4.925,24.219,0.102,36.855,0.102,49.492z"></path>
    <path style="fill:#FC611F;" d="M14.566,84.405l34.913-34.913H0.107C0.102,63.126,5.626,75.47,14.566,84.405z"></path>
    <path style="fill:#FFFFFF;" d="M49.474,98.864V49.492L14.561,84.405C24.202,94.046,36.838,98.864,49.474,98.864z"></path>
    <path style="fill:#FC611F;" d="M84.387,84.405L49.474,49.492v49.372C63.108,98.864,75.453,93.339,84.387,84.405z"></path>
    <path style="fill:#FFFFFF;" d="M98.846,49.492H49.474l34.913,34.913C94.028,74.764,98.846,62.128,98.846,49.492z"></path>
    <path style="fill:#FC611F;" d="M84.387,14.578L49.474,49.491h49.372C98.846,35.857,93.322,23.513,84.387,14.578z"></path>
    <circle style="fill:#FC611F;" cx="49.474" cy="49.512" r="34.913"></circle>
    <circle style="fill:#FFFFFF;" cx="49.474" cy="49.512" r="24.689"></circle>
  </g>
`;
    }

  bindEvents(params) {
    const table = getTableById(this.app.casinoData, params.tableId);
      if (!table) return;

      this.onAll('.quick-stack', 'click', e => {
          const idx = parseInt(e.currentTarget.dataset.idx);
          const chips = parseInt(e.currentTarget.dataset.chips);

          this._addChipsToDenom(table, idx, chips);
      });

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

    _addChipsToDenom(table, idx, chips) {
        const dc = table.denominationCounts[idx];
        dc.count += chips;

        const input = this.qs(`.denom-input[data-idx="${idx}"]`);
        const totalEl = this.qs(`[data-total="${idx}"]`);

        if (input) input.value = dc.count;
        if (totalEl) totalEl.textContent = fmt(calcDenomTotal(dc));

        this._refreshTotal(table);
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
