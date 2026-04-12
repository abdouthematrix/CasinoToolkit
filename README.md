# Casino Toolkit

A mobile-first progressive web app for daily casino operations — tracking tips by denomination and net win per table, across all sections, with grand totals.

---

## Features

### Core Tracking
- **Tips** — enter chip counts per denomination; quick-add buttons (+10, +25, +50 …); USD & EGP cash separate; auto-totals per table and section
- **Wins** — net win formula: `Close − Open − Fill + Credit + Plaques + Cash`
- **Summary** — full scrollable table with section subtotals and grand totals

### Plaque Denomination Panel
The `Plaques` field (part of the win formula) has a denomination breakdown panel with configurable plaque types (default: $100, $500, $1,000, $5,000). Enter count per denomination; `table.plaques` is kept in sync automatically.

### Light / Dark Theme
Toggle via the ☀ / 🌙 button in the top nav. Preference is persisted. The theme is applied before CSS loads to avoid flash-of-unstyled-content.

### PWA — Install & Offline
Casino Toolkit is a full progressive web app:
- **Installable** on Android/iOS ("Add to Home Screen") and desktop Chrome
- **Offline-first** — all assets are precached via service worker; the app works with no internet connection
- All data is stored in `localStorage` — no server, no account required

---

## File Structure

```
casino-toolkit/
├── index.html              # App shell + PWA meta
├── manifest.json           # Web app manifest
├── sw.js                   # Service worker (cache-first)
├── favicon.svg
├── css/
│   └── styles.css          # Dark + light themes, all components
└── js/
    ├── app.js              # Bootstrap, theme init, SW registration
    ├── dataService.js      # localStorage persistence layer
    ├── models.js           # Pure data model + computed values
    ├── router.js           # Hash-based SPA router
    └── views/
        ├── baseView.js     # Base class (mount, helpers, toast)
        ├── mainView.js     # Dashboard with section/table cards
        ├── editTipsView.js # Chip count entry + quick-add
        ├── editWinsView.js # Win fields with CalcEntry + plaque panel
        ├── settingsView.js # Sections, denominations, plaque types
        └── summaryView.js  # Full breakdown table
```

---

## Data Model

```
CasinoData
└── Section[]
    └── Table {
          open, close, fill, credit, plaques, cash,   // win fields
          usdCash, egpCash,                            // tip cash
          denominationCounts[],                        // tip chips
          plaqueCounts[]                               // plaque breakdown
        }
```

**Win formula:** `close − open − fill + credit + plaques + cash`

**Tips total:** `sum(denominationCounts × value) + usdCash`

---

## Settings

All settings are persisted in `localStorage`:

| Setting | Description |
|---------|-------------|
| **Sections & Tables** | Rename, add, or remove sections and the tables within them |
| **Tip Denomination Types** | Labels and values for chip denominations (e.g. $12.5, $25 …) |
| **Plaque Types** | Labels and values for plaque denominations (e.g. $500, $1,000 …) |

**Save Settings** preserves existing table data where section/table names match. **Wipe Table Data** resets all numeric values to zero while keeping the structure.

---

## Routing

Hash-based SPA routing — no server required:

| Hash | View |
|------|------|
| `#/` | Main dashboard |
| `#/edit-tips/:tableId` | Edit tips for a table |
| `#/edit-wins/:tableId` | Edit wins for a table |
| `#/settings` | App settings |
| `#/summary` | Summary table |

---

## Tech Stack

Vanilla JS (ES modules) · No build step · No dependencies · `localStorage` only

Fonts: [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) + [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono)
