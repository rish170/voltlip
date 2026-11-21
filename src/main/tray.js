const path = require('path');
const { Tray, Menu, shell, app } = require('electron');

class AppTray {
  constructor(options = {}) {
    this.options = options;
    this.tray = null;
    this.currentStatusText = 'Initializing...';
    this.isPaused = Boolean(options.settings && options.settings.paused);
    this.isDemo = Boolean(options.isDemo);
    this.isDebug = Boolean(options.isDebug);
    this.mockProvider = options.mockProvider;
    this.settingsPath = options.settingsPath;

    this.onTogglePause = options.onTogglePause;
    this.onToggleTheme = options.onToggleTheme;
    this.onReloadSettings = options.onReloadSettings;
    this.onToggleAutoStart = options.onToggleAutoStart;
    this.onScenarioSelect = options.onScenarioSelect;

    this.createTray();
  }

  createTray() {
    const iconPath = path.join(__dirname, '../../assets/tray-icon-32.png');
    this.tray = new Tray(iconPath);
    this.tray.setToolTip('Voltlip');
    this.renderMenu();
  }

  updateStatus(statusText, tooltipText = null) {
    this.currentStatusText = statusText;
    if (this.tray) {
      if (tooltipText) {
        this.tray.setToolTip(tooltipText);
      } else {
        this.tray.setToolTip(`Voltlip: ${statusText}`);
      }
      this.renderMenu();
    }
  }

  setPaused(paused) {
    this.isPaused = paused;
    this.renderMenu();
  }

  renderMenu() {
    if (!this.tray) return;

    let isAutoStart;
    try {
      const isPackaged = app.isPackaged;
      const args = isPackaged ? [] : [app.getAppPath()];
      const loginSettings = app.getLoginItemSettings({
        path: process.execPath,
        args,
      });
      isAutoStart = loginSettings.openAtLogin;
    } catch (_err) {
      isAutoStart = Boolean(this.options.settings && this.options.settings.startWithSystem);
    }

    const template = [
      {
        label: 'Voltlip',
        enabled: false,
      },
      {
        label: this.currentStatusText,
        enabled: false,
      },
      { type: 'separator' },
      {
        label: this.isPaused ? 'Resume' : 'Pause',
        click: () => {
          if (this.onTogglePause) this.onTogglePause(!this.isPaused);
        },
      },
      {
        label: 'Start with system',
        type: 'checkbox',
        checked: isAutoStart,
        click: (menuItem) => {
          if (this.onToggleAutoStart) this.onToggleAutoStart(menuItem.checked);
        },
      },
      { type: 'separator' },
      {
        label: 'Open settings file',
        click: () => {
          if (this.settingsPath) {
            shell.openPath(this.settingsPath);
          }
        },
      },
      {
        label: 'Reload settings',
        click: () => {
          if (this.onReloadSettings) this.onReloadSettings();
        },
      },
      {
        label: `Theme: ${this.options.settings && this.options.settings.theme === 'light' ? 'Light' : 'Dark'}`,
        click: () => {
          if (this.onToggleTheme) {
            const currentTheme = this.options.settings ? this.options.settings.theme : 'dark';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            this.onToggleTheme(newTheme);
          }
        },
      },
    ];

    // Simulate submenu for demo or debug modes
    if ((this.isDemo || this.isDebug) && this.mockProvider) {
      const scenarios = this.mockProvider.getScenarios();
      const current = this.mockProvider.getCurrentScenario();
      const isAutoCycle = this.mockProvider.autoCycle;

      const simulateSubmenu = [
        {
          label: 'Auto-cycle (5s)',
          type: 'checkbox',
          checked: isAutoCycle,
          click: () => {
            this.mockProvider.enableAutoCycle(5000);
            this.renderMenu();
          },
        },
        { type: 'separator' },
        ...scenarios.map((sc) => ({
          label: sc.name,
          type: 'radio',
          checked: !isAutoCycle && current && current.id === sc.id,
          click: () => {
            if (this.onScenarioSelect) {
              this.onScenarioSelect(sc);
            } else {
              this.mockProvider.setPinnedScenario(sc);
            }
            this.renderMenu();
          },
        })),
      ];

      template.push({ type: 'separator' });
      template.push({
        label: 'Simulate',
        submenu: simulateSubmenu,
      });
    }

    template.push({ type: 'separator' });
    template.push({
      label: 'Quit',
      click: () => {
        app.quit();
      },
    });

    const contextMenu = Menu.buildFromTemplate(template);
    this.tray.setContextMenu(contextMenu);
  }

  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

module.exports = AppTray;
