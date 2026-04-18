// js/app.js
import { loadSettings, loadCasinoData, saveCasinoData } from './dataService.js';
import { Router } from './router.js';
import { MainView } from './views/mainView.js';
import { EditTipsView } from './views/editTipsView.js';
import { EditWinsView } from './views/editWinsView.js';
import { CountCalcView } from './views/countCalcView.js';
import { SettingsView } from './views/settingsView.js';
import { SummaryView } from './views/summaryView.js';

export class App {
    constructor() {
        const savedTheme = localStorage.getItem('casinoToolkit_theme') || 'dark';
        document.documentElement.dataset.theme = savedTheme;

        this.settings = loadSettings();
        this.casinoData = loadCasinoData(this.settings);

        this.router = new Router();

        this._views = {
            main: new MainView(this),
            editTips: new EditTipsView(this),
            editWins: new EditWinsView(this),
            countCalc: new CountCalcView(this),
            settings: new SettingsView(this),
            summary: new SummaryView(this),
        };

        this._appEl = document.getElementById('app');

        this.router
            .on('/', () => this._show('main'))
            .on('/edit-tips/:tableId', p => this._show('editTips', p))
            .on('/edit-wins/:tableId', p => this._show('editWins', p))
            .on('/count-calc', () => this._show('countCalc'))
            .on('/settings', () => this._show('settings'))
            .on('/summary', () => this._show('summary'));

        this.router.dispatch();
    }

    save() { saveCasinoData(this.casinoData); }

    toggleTheme() {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        localStorage.setItem('casinoToolkit_theme', next);
    }

    _show(name, params = {}) {
        this._views[name].mount(this._appEl, params);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(() => { });
    }
});