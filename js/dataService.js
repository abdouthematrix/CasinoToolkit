// js/dataService.js
// ── Persistence layer (localStorage) ─────────────────────────────────────────

import {
  createTable, createSection, createCasinoData,
  DEFAULT_DENOMINATION_TYPES, DEFAULT_PLAQUE_TYPES, DEFAULT_SECTIONS_DATA,
} from './models.js';

const CASINO_KEY   = 'casinoToolkit_v1_casinoData';
const SETTINGS_KEY = 'casinoToolkit_v1_settings';

// ── Settings ──────────────────────────────────────────────────────────────────

export function getDefaultSettings() {
  return {
    sectionsData:      DEFAULT_SECTIONS_DATA.map(s => ({ ...s, tablesNames: [...s.tablesNames] })),
    denominationTypes: DEFAULT_DENOMINATION_TYPES.map(d => ({ ...d })),
    plaqueTypes:       DEFAULT_PLAQUE_TYPES.map(d => ({ ...d })),
  };
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return getDefaultSettings();
    const saved    = JSON.parse(raw);
    const defaults = getDefaultSettings();
    // Merge: handle new fields added in later versions
    return {
      sectionsData:      saved.sectionsData      ?? defaults.sectionsData,
      denominationTypes: saved.denominationTypes ?? defaults.denominationTypes,
      plaqueTypes:       saved.plaqueTypes       ?? defaults.plaqueTypes,
    };
  } catch {
    return getDefaultSettings();
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ── Casino data ───────────────────────────────────────────────────────────────

export function createDefaultCasinoData(settings) {
  const casino      = createCasinoData();
  const sortedDenom = sortedDenominations(settings);
  const sortedPlaq  = sortedPlaques(settings);

  for (const si of settings.sectionsData) {
    const section = createSection(si.name);
    for (const tableName of si.tablesNames) {
      section.tables.push(buildTable(tableName, sortedDenom, sortedPlaq));
    }
    casino.sections.push(section);
  }
  return casino;
}

export function loadCasinoData(settings) {
  try {
    const raw = localStorage.getItem(CASINO_KEY);
    return raw ? JSON.parse(raw) : createDefaultCasinoData(settings);
  } catch {
    return createDefaultCasinoData(settings);
  }
}

export function saveCasinoData(casinoData) {
  localStorage.setItem(CASINO_KEY, JSON.stringify(casinoData));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getTableById(casinoData, tableId) {
  for (const section of casinoData.sections) {
    const t = section.tables.find(t => t.id === tableId);
    if (t) return t;
  }
  return null;
}

export function applySettingsToCasinoData(settings, casinoData) {
  const sortedDenom = sortedDenominations(settings);
  const sortedPlaq  = sortedPlaques(settings);
  const newCasino   = createCasinoData();

  for (const si of settings.sectionsData) {
    const section         = createSection(si.name);
    const existingSection = casinoData.sections.find(s => s.name === si.name);

    for (const tableName of si.tablesNames) {
      const existingTable = existingSection?.tables.find(t => t.name === tableName);
      const table         = buildTable(tableName, sortedDenom, sortedPlaq, existingTable);
      section.tables.push(table);
    }
    newCasino.sections.push(section);
  }
  return newCasino;
}

// ── Private helpers ───────────────────────────────────────────────────────────

function sortedDenominations(settings) {
  return [...settings.denominationTypes].sort((a, b) => b.value - a.value);
}

function sortedPlaques(settings) {
  return [...(settings.plaqueTypes ?? DEFAULT_PLAQUE_TYPES)].sort((a, b) => b.value - a.value);
}

function buildTable(name, sortedDenom, sortedPlaq, existingTable = null) {
  const table = createTable(name);

  if (existingTable) {
    table.id      = existingTable.id;
    table.open    = existingTable.open    ?? 0;
    table.close   = existingTable.close   ?? 0;
    table.fill    = existingTable.fill    ?? 0;
    table.credit  = existingTable.credit  ?? 0;
    table.plaques = existingTable.plaques ?? 0;
    table.cash    = existingTable.cash    ?? 0;
    table.usdCash = existingTable.usdCash ?? 0;
    table.egpCash = existingTable.egpCash ?? 0;
  }

  // Tip denominations
  for (const dt of sortedDenom) {
    const existing = existingTable?.denominationCounts?.find(
      dc => dc.denominationType.name === dt.name
    );
    table.denominationCounts.push({
      denominationType: { ...dt },
      count: existing?.count ?? 0,
    });
  }

  // Plaque denominations
  for (const pt of sortedPlaq) {
    const existing = existingTable?.plaqueCounts?.find(
      pc => pc.denominationType.name === pt.name
    );
    table.plaqueCounts.push({
      denominationType: { ...pt },
      count: existing?.count ?? 0,
    });
  }

  return table;
}
