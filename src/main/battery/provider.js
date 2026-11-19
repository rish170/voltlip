const EventEmitter = require('events');

class BatteryProvider extends EventEmitter {
  constructor() {
    super();
    this.currentSnapshot = {
      level: 100,
      plugged: true,
      hasBattery: true,
      source: 'initial',
    };
  }

  getSnapshot() {
    return { ...this.currentSnapshot };
  }

  updateSnapshot(partial) {
    this.currentSnapshot = {
      ...this.currentSnapshot,
      ...partial,
    };
    this.emit('change', this.getSnapshot());
  }

  destroy() {
    this.removeAllListeners();
  }
}

module.exports = BatteryProvider;
