// js/models.js
// ── Pure model helpers — no side effects ──────────────────────────────────────

export const DEFAULT_DENOMINATION_TYPES = [
  { name: '$100',  value: 100   },
  { name: '$50',   value: 50    },
  { name: '$25',   value: 25    },
  { name: '$12.5', value: 12.5  },
  { name: '$10',   value: 10    },
  { name: '$5',    value: 5     },
  { name: '$1',    value: 1     },
];

export const DEFAULT_SECTIONS_DATA = [
  { name: 'Outlet', tablesNames: ['Bar', 'Cage'] },
  { name: 'BJ',     tablesNames: ['BJ-1', 'BJ-2', 'BJ-3'] },
  { name: 'AR',     tablesNames: ['AR-1', 'AR-2', 'AR-3', 'AR-4', 'AR-5'] },
  { name: 'PK',     tablesNames: ['PK-1', 'PK-2', 'PK-3', 'PK-4', 'PK-5', 'PK-6', 'PK-7'] },
];

// ── Factories ─────────────────────────────────────────────────────────────────

export function createTable(name) {
    return {
        /* id: crypto.randomUUID(),*/
        id: name,
        name,
        open: 0, close: 0, fill: 0, credit: 0, plaques: 0, cash: 0,
        usdCash: 0, egpCash: 0,
        denominationCounts: [],
    };
}

export function createSection(name) {
  return { name, tables: [] };
}

export function createCasinoData() {
  return { sections: [] };
}

// ── Computed values ───────────────────────────────────────────────────────────

/** Win = Close − Open − Fill + Credit + Plaques + Cash */
export function calcWin(table) {
  return (table.close - table.open - table.fill + table.credit + table.plaques + table.cash);
}

/** Single denomination row total */
export function calcDenomTotal(denomCount) {
  return denomCount.count * denomCount.denominationType.value;
}

/** Table total tips (USD chips + USD cash) */
export function calcTotalTips(table) {
  const chips = table.denominationCounts.reduce((s, dc) => s + calcDenomTotal(dc), 0);
  return table.usdCash + chips;
}

export function calcSectionTotalTips(section) {
  return section.tables.reduce((s, t) => s + calcTotalTips(t), 0);
}

export function calcSectionTotalWins(section) {
  return section.tables.reduce((s, t) => s + calcWin(t), 0);
}

export function calcCasinoTotalTips(casinoData) {
  return casinoData.sections.reduce((s, sec) => s + calcSectionTotalTips(sec), 0);
}

export function calcCasinoTotalWins(casinoData) {
  return casinoData.sections.reduce((s, sec) => s + calcSectionTotalWins(sec), 0);
}

// ── Formatting ────────────────────────────────────────────────────────────────

/** Format a decimal as comma-separated with 2 decimal places */
export function fmt(value) {
  const abs = Math.abs(value);
  const formatted = abs.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return value < 0 ? '-' + formatted : formatted;
}

/** CSS class for win/loss colouring */
export function winClass(value) {
  if (value > 0) return 'value-pos';
  if (value < 0) return 'value-neg';
  return 'value-zero';
}
