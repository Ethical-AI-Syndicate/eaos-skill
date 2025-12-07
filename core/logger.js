#!/usr/bin/env node

/**
 * EAOS Structured Logger
 *
 * Provides consistent, structured logging across all EAOS components.
 * Features:
 * - JSON and human-readable output modes
 * - Log levels (debug, info, warn, error, fatal)
 * - Context propagation (correlation IDs, agent names)
 * - File and console output
 * - Automatic rotation support
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

// =============================================================================
// Configuration
// =============================================================================

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4
};

const LEVEL_COLORS = {
  debug: '\x1b[90m',  // Gray
  info: '\x1b[36m',   // Cyan
  warn: '\x1b[33m',   // Yellow
  error: '\x1b[31m',  // Red
  fatal: '\x1b[35m'   // Magenta
};

const RESET = '\x1b[0m';

// =============================================================================
// Logger Class
// =============================================================================

class EAOSLogger {
  constructor(options = {}) {
    this.level = options.level || 'info';
    this.format = options.format || 'human'; // 'json' or 'human'
    this.output = options.output || 'console'; // 'console', 'file', 'both'
    this.logDir = options.logDir || path.join(ROOT_DIR, 'logs');
    this.context = options.context || {};
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 5;

    // Ensure log directory exists
    if (this.output !== 'console') {
      this._ensureLogDir();
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  debug(message, meta = {}) {
    this._log('debug', message, meta);
  }

  info(message, meta = {}) {
    this._log('info', message, meta);
  }

  warn(message, meta = {}) {
    this._log('warn', message, meta);
  }

  error(message, meta = {}) {
    this._log('error', message, meta);
  }

  fatal(message, meta = {}) {
    this._log('fatal', message, meta);
  }

  // Create a child logger with additional context
  child(context) {
    return new EAOSLogger({
      level: this.level,
      format: this.format,
      output: this.output,
      logDir: this.logDir,
      context: { ...this.context, ...context },
      maxFileSize: this.maxFileSize,
      maxFiles: this.maxFiles
    });
  }

  // Set the minimum log level
  setLevel(level) {
    if (LOG_LEVELS[level] !== undefined) {
      this.level = level;
    }
  }

  // ---------------------------------------------------------------------------
  // Internal Methods
  // ---------------------------------------------------------------------------

  _log(level, message, meta) {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.level]) {
      return;
    }

    const entry = this._createEntry(level, message, meta);

    if (this.output === 'console' || this.output === 'both') {
      this._writeConsole(entry);
    }

    if (this.output === 'file' || this.output === 'both') {
      this._writeFile(entry);
    }
  }

  _createEntry(level, message, meta) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...meta,
      pid: process.pid,
      hostname: process.env.HOSTNAME || 'localhost'
    };
  }

  _writeConsole(entry) {
    if (this.format === 'json') {
      console.log(JSON.stringify(entry));
    } else {
      const color = LEVEL_COLORS[entry.level] || '';
      const levelStr = entry.level.toUpperCase().padEnd(5);
      const contextStr = this._formatContext(entry);
      console.log(
        `${entry.timestamp} ${color}${levelStr}${RESET} ${entry.message}${contextStr}`
      );
    }
  }

  _writeFile(entry) {
    const logFile = this._getLogFile();
    const line = JSON.stringify(entry) + '\n';

    try {
      fs.appendFileSync(logFile, line);
      this._rotateIfNeeded(logFile);
    } catch (err) {
      console.error(`Failed to write log: ${err.message}`);
    }
  }

  _formatContext(entry) {
    const context = { ...entry };
    delete context.timestamp;
    delete context.level;
    delete context.message;
    delete context.pid;
    delete context.hostname;

    const keys = Object.keys(context);
    if (keys.length === 0) return '';

    const pairs = keys.map(k => `${k}=${JSON.stringify(context[k])}`);
    return ` [${pairs.join(' ')}]`;
  }

  _ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  _getLogFile() {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `eaos-${date}.log`);
  }

  _rotateIfNeeded(logFile) {
    try {
      const stats = fs.statSync(logFile);
      if (stats.size > this.maxFileSize) {
        const rotated = `${logFile}.${Date.now()}`;
        fs.renameSync(logFile, rotated);
        this._cleanOldLogs();
      }
    } catch (err) {
      // File might not exist yet
    }
  }

  _cleanOldLogs() {
    try {
      const files = fs.readdirSync(this.logDir)
        .filter(f => f.startsWith('eaos-') && f.endsWith('.log'))
        .map(f => ({
          name: f,
          path: path.join(this.logDir, f),
          mtime: fs.statSync(path.join(this.logDir, f)).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime);

      // Keep only maxFiles
      files.slice(this.maxFiles).forEach(f => {
        fs.unlinkSync(f.path);
      });
    } catch (err) {
      // Ignore cleanup errors
    }
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

const defaultLogger = new EAOSLogger({
  level: process.env.EAOS_LOG_LEVEL || 'info',
  format: process.env.EAOS_LOG_FORMAT || 'human',
  output: process.env.EAOS_LOG_OUTPUT || 'console'
});

// =============================================================================
// Exports
// =============================================================================

export { EAOSLogger };
export default defaultLogger;

// =============================================================================
// CLI Usage
// =============================================================================

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // Demo when run directly
  console.log('EAOS Logger Demo\n');

  const logger = new EAOSLogger({ level: 'debug' });

  logger.debug('This is a debug message');
  logger.info('This is an info message');
  logger.warn('This is a warning message');
  logger.error('This is an error message');
  logger.fatal('This is a fatal message');

  console.log('\nWith context:');
  const agentLogger = logger.child({ agent: 'autonomous_cto', correlationId: 'abc-123' });
  agentLogger.info('Agent initialized', { module: 'memory_kernel' });

  console.log('\nJSON format:');
  const jsonLogger = new EAOSLogger({ level: 'info', format: 'json' });
  jsonLogger.info('JSON log entry', { action: 'test', result: 'success' });
}
