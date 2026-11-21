const si = require('systeminformation');
const BatteryProvider = require('./provider');
const { reconcileBatteryData } = require('../../core/reconcile');

class SystemBatteryProvider extends BatteryProvider {
  constructor(options = {}) {
    super();
    this.powerMonitor = options.powerMonitor;
    this.logger = options.logger;

    this.siData = null;
    this.rendererData = null;
    this.reconciledState = null;
    this.syncTimer = null;
    this.lastPowerEvent = null;

    this.bindPowerMonitor();

    // Fast synchronous power check on startup
    try {
      if (this.powerMonitor && typeof this.powerMonitor.isOnBatteryPower === 'function') {
        const onBat = this.powerMonitor.isOnBatteryPower();
        this.currentSnapshot.plugged = !onBat;
      }
    } catch (_err) {
      // Fallback
    }

    this.initialSync().catch((err) => {
      if (this.logger) this.logger.error('Initial battery sync error:', err.message);
    });
    this.startPeriodicSync(10000); // 10s sync
  }

  bindPowerMonitor() {
    if (!this.powerMonitor) return;

    try {
      this.powerMonitor.on('on-ac', () => {
        if (this.logger) this.logger.info('powerMonitor event: on-ac');
        this.lastPowerEvent = 'ac';
        if (this.siData) {
          this.siData.acConnected = true;
          this.siData.isCharging = true;
        }
        this.reconcile();
        this.syncWithSystemInformation();
      });

      this.powerMonitor.on('on-battery', () => {
        if (this.logger) this.logger.info('powerMonitor event: on-battery');
        this.lastPowerEvent = 'battery';
        if (this.siData) {
          this.siData.acConnected = false;
          this.siData.isCharging = false;
        }
        this.reconcile();
        this.syncWithSystemInformation();
      });

      this.powerMonitor.on('resume', () => {
        if (this.logger) this.logger.info('powerMonitor event: resume');
        this.lastPowerEvent = null;
        this.syncWithSystemInformation();
      });

      this.powerMonitor.on('unlock-screen', () => {
        if (this.logger) this.logger.info('powerMonitor event: unlock-screen');
        this.syncWithSystemInformation();
      });
    } catch (err) {
      if (this.logger) this.logger.error('Failed to bind powerMonitor listeners', err.message);
    }
  }

  getPowerMonitorState() {
    if (!this.powerMonitor) return null;
    if (this.lastPowerEvent === 'ac') {
      return { isOnBattery: false };
    }
    if (this.lastPowerEvent === 'battery') {
      return { isOnBattery: true };
    }
    try {
      if (typeof this.powerMonitor.isOnBatteryPower === 'function') {
        return { isOnBattery: this.powerMonitor.isOnBatteryPower() };
      }
    } catch (_err) {
      // Fall through
    }
    return null;
  }

  async initialSync() {
    await this.syncWithSystemInformation();
  }

  async syncWithSystemInformation() {
    try {
      const data = await si.battery();
      this.siData = data;
      if (typeof data.acConnected === 'boolean') {
        this.lastPowerEvent = data.acConnected ? 'ac' : 'battery';
      }
      this.reconcile();
    } catch (err) {
      if (this.logger) this.logger.error('systeminformation battery() error', err.message);
      this.reconcile();
    }
  }

  handleRendererBatteryEvent(rendererData) {
    this.rendererData = rendererData;
    if (rendererData && typeof rendererData.charging === 'boolean') {
      if (this.siData && this.siData.acConnected !== rendererData.charging) {
        this.siData.acConnected = rendererData.charging;
        this.siData.isCharging = rendererData.charging;
        this.syncWithSystemInformation();
      }
    }
    this.reconcile();
  }

  reconcile() {
    const powerMonitorData = this.getPowerMonitorState();
    const result = reconcileBatteryData({
      siData: this.siData,
      rendererData: this.rendererData,
      powerMonitorData,
      previousState: this.reconciledState,
    });

    if (result.disagreement && this.logger) {
      this.logger.warn('Battery sources disagreement', result.disagreementDetails);
    }

    this.reconciledState = result;
    this.updateSnapshot({
      level: result.level,
      plugged: result.plugged,
      hasBattery: result.hasBattery,
      source: result.source,
    });
  }

  startPeriodicSync(intervalMs = 60000) {
    this.stopPeriodicSync();
    this.syncTimer = setInterval(() => {
      this.syncWithSystemInformation();
    }, intervalMs);
  }

  stopPeriodicSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  destroy() {
    this.stopPeriodicSync();
    super.destroy();
  }
}

module.exports = SystemBatteryProvider;
module.exports.SystemBatteryProvider = SystemBatteryProvider;
