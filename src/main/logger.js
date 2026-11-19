const fs = require('fs');
const path = require('path');

class Logger {
  constructor(userDataPath) {
    this.logDir = path.join(userDataPath, 'logs');
    this.logFile = path.join(this.logDir, 'voltlip.log');
    this.oldLogFile = path.join(this.logDir, 'voltlip.old.log');
    this.maxBytes = 1024 * 1024; // 1 MB
    this.ensureDir();
  }

  ensureDir() {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (_err) {
      // Ignore directory creation errors
    }
  }

  rotateIfNeeded() {
    try {
      if (fs.existsSync(this.logFile)) {
        const stats = fs.statSync(this.logFile);
        if (stats.size >= this.maxBytes) {
          if (fs.existsSync(this.oldLogFile)) {
            fs.unlinkSync(this.oldLogFile);
          }
          fs.renameSync(this.logFile, this.oldLogFile);
        }
      }
    } catch (_err) {
      // Ignore rotation errors
    }
  }

  write(level, message, meta = null) {
    const timestamp = new Date().toISOString();
    let metaStr = '';
    if (meta) {
      if (meta instanceof Error) {
        metaStr = ` ${meta.stack || meta.message}`;
      } else if (typeof meta === 'object') {
        try {
          const str = JSON.stringify(meta);
          metaStr = str === '{}' && meta.message ? ` ${meta.message}` : ` ${str}`;
        } catch (_err) {
          metaStr = ` ${String(meta)}`;
        }
      } else {
        metaStr = ` ${meta}`;
      }
    }
    const line = `[${timestamp}] [${level}] ${message}${metaStr}\n`;

    // Console output for dev/debug
    if (level === 'ERROR') {
      console.error(line.trim());
    } else {
      console.log(line.trim());
    }

    try {
      this.rotateIfNeeded();
      fs.appendFileSync(this.logFile, line, 'utf8');
    } catch (_err) {
      // Never crash on logging failure
    }
  }

  info(msg, meta) {
    this.write('INFO', msg, meta);
  }

  warn(msg, meta) {
    this.write('WARN', msg, meta);
  }

  error(msg, meta) {
    this.write('ERROR', msg, meta);
  }

  debug(msg, meta) {
    this.write('DEBUG', msg, meta);
  }
}

module.exports = Logger;
