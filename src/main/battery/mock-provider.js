const BatteryProvider = require('./provider');

const DEMO_SCENARIOS = [
  { id: '100-discharging', name: '100% discharging (black, steady)', level: 100, plugged: false },
  { id: '50-discharging', name: '50% discharging (black)', level: 50, plugged: false },
  { id: '75-charging', name: '75% charging (green, steady)', level: 75, plugged: true },
  { id: '45-discharging', name: '45% discharging (black)', level: 45, plugged: false },
  { id: '39-discharging', name: '39% discharging (red, steady)', level: 39, plugged: false },
  { id: '35-discharging', name: '35% discharging (red, steady)', level: 35, plugged: false },
  { id: '29-discharging', name: '29% discharging (red, breathing)', level: 29, plugged: false },
  { id: '15-discharging', name: '15% discharging (red, breathing)', level: 15, plugged: false },
  { id: '20-charging', name: '20% charging (green, steady)', level: 20, plugged: true },
  { id: '79-charging', name: '79% charging (green, steady)', level: 79, plugged: true },
  { id: '81-charging', name: '81% charging (green, breathing)', level: 81, plugged: true },
  { id: '100-charged', name: '100% plugged in (green, breathing, status "Charged")', level: 100, plugged: true },
];

class MockBatteryProvider extends BatteryProvider {
  constructor(options = {}) {
    super();
    this.options = options;
    this.currentIndex = 0;
    this.timer = null;
    this.pinnedScenario = null;
    this.autoCycle = !options.pinnedScenario;

    if (options.pinnedScenario) {
      this.setPinnedScenario(options.pinnedScenario);
    } else {
      this.applyScenario(DEMO_SCENARIOS[0]);
      if (this.autoCycle) {
        this.startCycle(5000);
      }
    }
  }

  getScenarios() {
    return DEMO_SCENARIOS;
  }

  getCurrentScenario() {
    if (this.pinnedScenario) {
      return this.pinnedScenario;
    }
    return DEMO_SCENARIOS[this.currentIndex];
  }

  applyScenario(scenario) {
    this.currentSnapshot = {
      level: scenario.level,
      plugged: scenario.plugged,
      hasBattery: true,
      source: 'mock',
      scenarioName: scenario.name,
    };
    this.emit('change', this.getSnapshot());
    this.emit('scenario-changed', scenario);
  }

  setPinnedScenario(scenarioOrString) {
    let scenario;
    if (typeof scenarioOrString === 'string') {
      // Format e.g. "29:discharging" or scenario ID
      const parts = scenarioOrString.split(':');
      if (parts.length === 2) {
        const level = parseInt(parts[0], 10);
        const plugged = parts[1].toLowerCase().includes('charg') && !parts[1].toLowerCase().includes('discharg');
        scenario = {
          id: `custom-${scenarioOrString}`,
          name: `${level}% ${plugged ? 'charging' : 'discharging'} (pinned)`,
          level,
          plugged,
        };
      } else {
        scenario = DEMO_SCENARIOS.find((s) => s.id === scenarioOrString) || DEMO_SCENARIOS[0];
      }
    } else {
      scenario = scenarioOrString;
    }

    this.stopCycle();
    this.autoCycle = false;
    this.pinnedScenario = scenario;
    this.applyScenario(scenario);
  }

  enableAutoCycle(intervalMs = 5000) {
    this.pinnedScenario = null;
    this.autoCycle = true;
    this.startCycle(intervalMs);
  }

  startCycle(intervalMs = 5000) {
    this.stopCycle();
    this.timer = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % DEMO_SCENARIOS.length;
      this.applyScenario(DEMO_SCENARIOS[this.currentIndex]);
    }, intervalMs);
  }

  stopCycle() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  destroy() {
    this.stopCycle();
    super.destroy();
  }
}

module.exports = {
  MockBatteryProvider,
  DEMO_SCENARIOS,
};
