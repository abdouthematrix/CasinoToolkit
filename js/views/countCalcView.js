// js/views/countCalcView.js
// ── Standalone chip-count calculator ─────────────────────────────────────────

import { BaseView } from './baseView.js';
import { fmt } from '../models.js';

const DENOMS = [
    { name: '$50,000', value: 50000 },
    { name: '$10,000', value: 10000 },
    { name: '$5,000', value: 5000 },
    { name: '$1,000', value: 1000 },
    { name: '$500', value: 500 },
    { name: '$100', value: 100 },
    { name: '$50', value: 50 },
    { name: '$25', value: 25 },
    { name: '$12.5', value: 12.5 },
    { name: '$10', value: 10 },
    { name: '$5', value: 5 },
    { name: '$1', value: 1 },
];

// Quick-add presets shown as chip-stack SVG buttons per row
const QUICK_PRESETS = [
    { label: '10', chips: 10 },
    { label: 'Stack', chips: 20 },
    { label: 'Rack', chips: 100 },
];

export class CountCalcView extends BaseView {

    constructor(app) {
        super(app);
        this._counts = DENOMS.map(d => ({ ...d, count: 0 }));
    }

    // ── Render ──────────────────────────────────────────────────────────────────

    render() {
        const rows = DENOMS.map((d, i) => /* html */`
      <div class="cnt-row">
        <div class="cnt-row-top">
          <span class="cnt-label">${d.name}</span>
          <div class="cnt-stepper">
            <button class="cnt-btn cnt-dec" data-idx="${i}">−</button>
            <input  class="cnt-input" type="number" inputmode="numeric"
                    min="0" step="1" value="${this._counts[i].count}"
                    data-idx="${i}" autocomplete="off">
            <button class="cnt-btn cnt-inc" data-idx="${i}">+</button>
          </div>
          <span class="cnt-subtotal ${this._counts[i].count > 0 ? 'cnt-subtotal-active' : ''}"
                data-sub="${i}">
            ${this._counts[i].count > 0 ? fmt(this._counts[i].count * d.value) : '—'}
          </span>
        </div>
        <div class="cnt-quick-row">
          ${QUICK_PRESETS.map(p => /* html */`
            <button class="cnt-quick-preset" data-idx="${i}" data-chips="${p.chips}"
                    title="+${p.chips} (${fmt(p.chips * d.value)})">
              ${this._renderStack(p.chips)}
              <span class="cnt-quick-label">${p.label}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `).join('');

        const total = this._computeTotal();

        return /* html */`
      <div class="page-header">
        <button class="back-btn" id="btn-back">← Back</button>
        <div class="page-title">Chip Count</div>
      </div>

      <div class="cnt-total-card">
        <div class="cnt-total-left">
          <div class="cnt-total-label">Total</div>
          <div class="cnt-total-value ${total > 0 ? 'cnt-total-nonzero' : ''}"
               id="cnt-total">${fmt(total)}</div>
        </div>
        <button class="cnt-clear-btn" id="btn-reset">✕ Reset</button>
      </div>

      <div class="cnt-grid">${rows}</div>
    `;
    }

    // ── Events ──────────────────────────────────────────────────────────────────

    bindEvents() {
        this.on('#btn-back', 'click', () => this.app.router.navigate('/'));
        this.on('#btn-reset', 'click', () => {
            this._counts.forEach(c => { c.count = 0; });
            this.qsa('.cnt-input').forEach(el => { el.value = 0; });
            DENOMS.forEach((_, i) => this._refreshRow(i));
            this._refreshTotal();
        });

        this.onAll('.cnt-inc', 'click', e => this._step(parseInt(e.currentTarget.dataset.idx), +1));
        this.onAll('.cnt-dec', 'click', e => this._step(parseInt(e.currentTarget.dataset.idx), -1));

        this.onAll('.cnt-quick-preset', 'click', e => {
            const idx = parseInt(e.currentTarget.dataset.idx);
            const chips = parseInt(e.currentTarget.dataset.chips);
            this._counts[idx].count += chips;
            const input = this.qs(`.cnt-input[data-idx="${idx}"]`);
            if (input) input.value = this._counts[idx].count;
            this._refreshRow(idx);
            this._refreshTotal();
        });

        this.onAll('.cnt-input', 'input', e => {
            const i = parseInt(e.target.dataset.idx);
            const v = Math.max(0, parseInt(e.target.value) || 0);
            e.target.value = v;
            this._counts[i].count = v;
            this._refreshRow(i);
            this._refreshTotal();
        });

        this.onAll('.cnt-input', 'keydown', e => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            const inputs = this.qsa('.cnt-input');
            const next = inputs[inputs.indexOf(e.target) + 1];
            if (next) { next.focus(); next.select(); }
        });
    }

    // ── Internal helpers ──────────────────────────────────────────────────────────

    _step(idx, delta) {
        this._counts[idx].count = Math.max(0, this._counts[idx].count + delta);
        const input = this.qs(`.cnt-input[data-idx="${idx}"]`);
        if (input) input.value = this._counts[idx].count;
        this._refreshRow(idx);
        this._refreshTotal();
    }

    _refreshRow(idx) {
        const el = this.qs(`[data-sub="${idx}"]`);
        if (!el) return;
        const val = this._counts[idx].count * this._counts[idx].value;
        el.textContent = val > 0 ? fmt(val) : '—';
        el.classList.toggle('cnt-subtotal-active', val > 0);
    }

    _computeTotal() {
        return this._counts.reduce((s, c) => s + c.count * c.value, 0);
    }

    _refreshTotal() {
        const total = this._computeTotal();
        const el = this.qs('#cnt-total');
        if (el) {
            el.textContent = fmt(total);
            el.classList.toggle('cnt-total-nonzero', total > 0);
        }
    }

    // ── Chip SVG rendering (mirrors editTipsView) ─────────────────────────────────

    _renderStack(chips, chipsPerStack = 20) {
        const stacks = Math.ceil(chips / chipsPerStack);
        const stackW = 60;
        const stepY = 18;
        const baseY = 360;
        let uses = '';

        for (let s = 0; s < stacks; s++) {
            const inStack = Math.min(chipsPerStack, chips - s * chipsPerStack);
            for (let i = 0; i < inStack; i++) {
                uses += `<use href="#chip_tpl" x="${s * stackW}" y="${baseY - i * stepY}"/>`;
            }
        }

        const vw = stacks * stackW;
        const vh = baseY + 100;

        return /* html */`
      <svg width="30" height="30"class="cnt-chip-svg" viewBox="0 0 ${vw} ${vh}">
        <defs>${this._chipTemplate()}</defs>
        <g>${uses}</g>
      </svg>`;
    }

    _chipTemplate() {
        return `
      <g id="chip_tpl">
        <path style="fill:#ff0000" d="M95.324,49.492c-7.26-18.227-25.032-31.13-45.85-31.13s-38.589,12.902-45.85,31.13H0v18.243c0,13.635,5.524,25.979,14.459,34.913c8.934,8.934,21.279,14.459,34.913,14.459c27.269,0,49.372-22.103,49.372-49.372V49.492H95.324z"/>
        <path style="fill:#D7ECED" d="M32.808,84.405H14.565v18.243c9.641,9.641,22.277,14.459,34.913,14.459V67.735L32.808,84.405z"/>
        <path style="fill:#D7ECED" d="M98.846,67.734V49.491h-3.523c-2.499-6.267-6.257-11.884-10.936-16.584v34.826H49.474l34.913,34.913C94.028,93.006,98.846,80.37,98.846,67.734z"/>
        <path style="fill:#ff0000"  d="M84.387,84.405H66.144L49.473,67.734v49.372c13.635,0,25.979-5.524,34.913-14.459V84.405z"/>
        <circle style="fill:#2D5872" cx="49.474" cy="49.512" r="49.372"/>
        <path style="fill:#FFFFFF"  d="M49.474,0.119v49.372l34.913-34.913C74.746,4.942,62.11,0.119,49.474,0.119z"/>
        <path style="fill:#FC611F"  d="M14.566,14.578l34.913,34.913V0.119C35.839,0.119,23.5,5.644,14.566,14.578z"/>
        <path style="fill:#FFFFFF"  d="M0.102,49.492h49.372L14.561,14.579C4.925,24.219,0.102,36.855,0.102,49.492z"/>
        <path style="fill:#FC611F"  d="M14.566,84.405l34.913-34.913H0.107C0.102,63.126,5.626,75.47,14.566,84.405z"/>
        <path style="fill:#FFFFFF"  d="M49.474,98.864V49.492L14.561,84.405C24.202,94.046,36.838,98.864,49.474,98.864z"/>
        <path style="fill:#FC611F"  d="M84.387,84.405L49.474,49.492v49.372C63.108,98.864,75.453,93.339,84.387,84.405z"/>
        <path style="fill:#FFFFFF"  d="M98.846,49.492H49.474l34.913,34.913C94.028,74.764,98.846,62.128,98.846,49.492z"/>
        <path style="fill:#FC611F"  d="M84.387,14.578L49.474,49.491h49.372C98.846,35.857,93.322,23.513,84.387,14.578z"/>
        <circle style="fill:#FC611F" cx="49.474" cy="49.512" r="34.913"/>
        <circle style="fill:#FFFFFF" cx="49.474" cy="49.512" r="24.689"/>
      </g>`;
    }
}