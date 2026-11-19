const {
  isInOpenZone,
  isInPanelZone,
  isNearStrip,
} = require('../core/geometry');

class CursorPoller {
  constructor(options = {}) {
    this.screen = options.screen;
    this.getStripRect = options.getStripRect;
    this.getPanelRect = options.getPanelRect;
    this.getDisplay = options.getDisplay;
    this.onHoverChange = options.onHoverChange;
    this.logger = options.logger;

    this.isHovering = false;
    this.isPaused = false;
    this.timer = null;
    this.debounceCloseTimer = null;
    this.currentInterval = 120;

    this.poll = this.poll.bind(this);
  }

  start() {
    this.isPaused = false;
    this.scheduleNext(16);
  }

  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.debounceCloseTimer) {
      clearTimeout(this.debounceCloseTimer);
      this.debounceCloseTimer = null;
    }
  }

  setPaused(paused) {
    this.isPaused = Boolean(paused);
    if (this.isPaused) {
      this.stop();
      if (this.isHovering) {
        this.setHovering(false);
      }
    } else {
      this.start();
    }
  }

  scheduleNext(ms) {
    if (this.isPaused) return;
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.currentInterval = ms;
    this.timer = setTimeout(this.poll, ms);
  }

  setHovering(hover) {
    if (this.isHovering !== hover) {
      this.isHovering = hover;
      if (this.onHoverChange) {
        this.onHoverChange(hover);
      }
    }
  }

  poll() {
    if (this.isPaused || !this.screen) return;

    try {
      const cursor = this.screen.getCursorScreenPoint();
      const display = this.getDisplay ? this.getDisplay() : this.screen.getPrimaryDisplay().bounds;
      const stripRect = this.getStripRect ? this.getStripRect() : null;
      const panelRect = this.getPanelRect ? this.getPanelRect() : null;

      if (!stripRect || !panelRect || !display) {
        this.scheduleNext(120);
        return;
      }

      // Check if cursor is on the target display
      const onDisplay =
        cursor.x >= display.x &&
        cursor.x < display.x + display.width &&
        cursor.y >= display.y &&
        cursor.y < display.y + display.height;

      if (!onDisplay) {
        if (this.isHovering) {
          this.triggerDebouncedClose();
        }
        this.scheduleNext(120);
        return;
      }

      // Adaptive polling rate
      const near = isNearStrip(cursor, stripRect, display);
      const nextInterval = near || this.isHovering ? 16 : 120;

      if (!this.isHovering) {
        // Check open trigger
        if (isInOpenZone(cursor, stripRect, display)) {
          if (this.debounceCloseTimer) {
            clearTimeout(this.debounceCloseTimer);
            this.debounceCloseTimer = null;
          }
          this.setHovering(true);
        }
      } else {
        // While hovering, check panel stay-open zone
        if (isInPanelZone(cursor, panelRect, 8) || isInOpenZone(cursor, stripRect, display)) {
          if (this.debounceCloseTimer) {
            clearTimeout(this.debounceCloseTimer);
            this.debounceCloseTimer = null;
          }
        } else {
          this.triggerDebouncedClose();
        }
      }

      this.scheduleNext(nextInterval);
    } catch (err) {
      if (this.logger) this.logger.error('Error during cursor poll', err.message);
      this.scheduleNext(120);
    }
  }

  triggerDebouncedClose() {
    if (!this.debounceCloseTimer) {
      this.debounceCloseTimer = setTimeout(() => {
        this.debounceCloseTimer = null;
        this.setHovering(false);
      }, 350);
    }
  }

  destroy() {
    this.stop();
  }
}

module.exports = CursorPoller;
