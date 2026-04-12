// js/views/summaryView.js
import { BaseView } from './baseView.js';
import {
  calcWin, calcTotalTips,
  calcSectionTotalTips, calcSectionTotalWins,
  calcCasinoTotalTips,  calcCasinoTotalWins,
  fmt, winClass,
} from '../models.js';

export class SummaryView extends BaseView {

  render() {
    const data = this.app.casinoData;

    // Collect all unique denom types, sorted descending
    const denomMap = new Map();
    for (const section of data.sections)
      for (const table of section.tables)
        for (const dc of table.denominationCounts)
          denomMap.set(dc.denominationType.value, dc.denominationType);
    const denoms = [...denomMap.values()].sort((a, b) => b.value - a.value);

    const colspan = denoms.length + 5; // name + denoms + usd + egp + tips + win

    // ── Header ────────────────────────────────────────────────────────────────
    const headerCols = denoms.map(d => `<th>${d.name}</th>`).join('');
    const headerRow  = /* html */`
      <tr>
        <th>Table</th>
        ${headerCols}
        <th>USD Cash</th>
        <th>EGP Cash</th>
        <th>Tips</th>
        <th>Win</th>
      </tr>
    `;

    // ── Body ──────────────────────────────────────────────────────────────────
    let body = '';

    for (const section of data.sections) {
      if (!section.tables.length) continue;

      // Section header row
      body += /* html */`
        <tr class="row-section-header">
          <td colspan="${colspan}">${section.name}</td>
        </tr>
      `;

      // Table rows
      for (const table of section.tables) {
        const tips    = calcTotalTips(table);
        const win     = calcWin(table);
        const dCells  = denoms.map(d => {
          const dc = table.denominationCounts.find(x => x.denominationType.value === d.value);
          return `<td>${dc?.count ?? 0}</td>`;
        }).join('');

        body += /* html */`
          <tr>
            <td>${table.name}</td>
            ${dCells}
            <td>${fmt(table.usdCash)}</td>
            <td>${fmt(table.egpCash)}</td>
            <td class="value-tips">${fmt(tips)}</td>
            <td class="${winClass(win)}">${fmt(win)}</td>
          </tr>
        `;
      }

      // Section total row
      const sTips = calcSectionTotalTips(section);
      const sWins = calcSectionTotalWins(section);
      const sdCells = denoms.map(d => {
        const total = section.tables
          .flatMap(t => t.denominationCounts)
          .filter(dc => dc.denominationType.value === d.value)
          .reduce((s, dc) => s + dc.count, 0);
        return `<td>${total}</td>`;
      }).join('');

      body += /* html */`
        <tr class="row-section-total">
          <td>${section.name} Total</td>
          ${sdCells}
          <td>${fmt(section.tables.reduce((s, t) => s + t.usdCash, 0))}</td>
          <td>${fmt(section.tables.reduce((s, t) => s + t.egpCash, 0))}</td>
          <td class="value-tips">${fmt(sTips)}</td>
          <td class="${winClass(sWins)}">${fmt(sWins)}</td>
        </tr>
      `;
    }

    // Grand total row
    const allTables = data.sections.flatMap(s => s.tables);
    const gtTips    = calcCasinoTotalTips(data);
    const gtWins    = calcCasinoTotalWins(data);
    const gtDCells  = denoms.map(d => {
      const total = allTables
        .flatMap(t => t.denominationCounts)
        .filter(dc => dc.denominationType.value === d.value)
        .reduce((s, dc) => s + dc.count, 0);
      return `<td>${total}</td>`;
    }).join('');

    body += /* html */`
      <tr class="row-grand-total">
        <td>GRAND TOTAL</td>
        ${gtDCells}
        <td>${fmt(allTables.reduce((s, t) => s + t.usdCash, 0))}</td>
        <td>${fmt(allTables.reduce((s, t) => s + t.egpCash, 0))}</td>
        <td class="value-tips">${fmt(gtTips)}</td>
        <td class="${winClass(gtWins)}">${fmt(gtWins)}</td>
      </tr>
    `;

    return /* html */`
      <div class="page-header">
        <button class="back-btn" id="btn-back">← Back</button>
        <div class="page-title">Summary</div>
      </div>

      <div class="summary-scroll">
        <table class="summary-table">
          <thead>${headerRow}</thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    `;
  }

  bindEvents() {
    this.on('#btn-back', 'click', () => this.app.router.navigate('/'));
  }
}
