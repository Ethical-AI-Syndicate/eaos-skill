/**
 * EAOS Autonomy Engine Module
 *
 * Implements the Enhanced Autonomy Mode with hybrid scheduling:
 * - Scheduled cycles (daily, weekly, monthly)
 * - Event-driven triggers
 * - On-demand execution
 */

import fs from 'fs-extra';
import path from 'path';
import { getEventBus, AutonomyEvents } from './events.js';
import { getPluginManager, HOOK_TYPES } from './plugins.js';
import { TimeoutError, withTimeout, withRetry } from './errors.js';
import { EAOSLogger } from './logger.js';

// =============================================================================
// Constants
// =============================================================================

const ENGINE_STATES = {
  STOPPED: 'stopped',
  RUNNING: 'running',
  PAUSED: 'paused',
  ERROR: 'error'
};

const CYCLE_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  MANUAL: 'manual'
};

const HDM_LEVELS = {
  INFORMATIONAL: 0,  // No approval needed
  NOTIFY: 1,         // Notify after action
  CONFIRM: 2,        // Confirm before action
  APPROVE: 3,        // Explicit approval required
  CRITICAL: 4       // Executive approval required
};

const DEFAULT_SCHEDULES = {
  daily: { hour: 2, minute: 0 },    // 2:00 AM
  weekly: { dayOfWeek: 0, hour: 3, minute: 0 },  // Sunday 3:00 AM
  monthly: { dayOfMonth: 1, hour: 4, minute: 0 } // 1st of month 4:00 AM
};

// =============================================================================
// Cycle Definitions
// =============================================================================

const DAILY_TASKS = [
  { id: 'health-scan', name: 'System Health Scan', hdmLevel: 0 },
  { id: 'drift-detection', name: 'Drift Detection', hdmLevel: 0 },
  { id: 'security-sweep', name: 'Security Sweep', hdmLevel: 1 },
  { id: 'financial-anomaly', name: 'Financial Anomaly Detection', hdmLevel: 1 },
  { id: 'compliance-check', name: 'Compliance Control Check', hdmLevel: 0 },
  { id: 'observability', name: 'Observability Validation', hdmLevel: 0 }
];

const WEEKLY_TASKS = [
  { id: 'ciw-execution', name: 'CIW Agent Execution', hdmLevel: 1 },
  { id: 'scorecard-refresh', name: 'Scorecard Refresh', hdmLevel: 0 },
  { id: 'beads-refinement', name: 'BEADS Refinement', hdmLevel: 1 },
  { id: 'release-readiness', name: 'Release Readiness Check', hdmLevel: 1 }
];

const MONTHLY_TASKS = [
  { id: 'architecture-audit', name: 'Full Architecture Audit', hdmLevel: 2 },
  { id: 'compliance-mapping', name: 'Full Compliance Mapping', hdmLevel: 2 },
  { id: 'multiverse-test', name: 'Multiverse Scenario Test', hdmLevel: 2 },
  { id: 'quantum-merge', name: 'Quantum Planner Horizon Merge', hdmLevel: 2 },
  { id: 'executive-report', name: 'Executive Readiness Report', hdmLevel: 1 }
];

// =============================================================================
// Trigger Class
// =============================================================================

/**
 * Represents an event trigger
 */
export class Trigger {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.type = config.type; // 'event', 'condition', 'schedule'
    this.pattern = config.pattern;
    this.action = config.action;
    this.hdmLevel = config.hdmLevel || 0;
    this.enabled = config.enabled !== false;
    this.lastFired = null;
    this.fireCount = 0;
  }

  /**
   * Check if trigger matches an event
   * @param {Object} event - Event data
   * @returns {boolean}
   */
  matches(event) {
    if (!this.enabled) return false;

    if (this.type === 'event') {
      if (typeof this.pattern === 'string') {
        return event.event === this.pattern || this.matchesWildcard(event.event, this.pattern);
      }
      if (this.pattern instanceof RegExp) {
        return this.pattern.test(event.event);
      }
    }

    if (this.type === 'condition' && typeof this.pattern === 'function') {
      return this.pattern(event);
    }

    return false;
  }

  matchesWildcard(event, pattern) {
    if (pattern === '*') return true;
    if (!pattern.includes('*')) return event === pattern;
    const regex = new RegExp('^' + pattern.split('*').map(s =>
      s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    ).join('.*') + '$');
    return regex.test(event);
  }

  fire() {
    this.lastFired = new Date().toISOString();
    this.fireCount++;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      hdmLevel: this.hdmLevel,
      enabled: this.enabled,
      lastFired: this.lastFired,
      fireCount: this.fireCount
    };
  }
}

// =============================================================================
// Autonomy Engine
// =============================================================================

/**
 * Main Autonomy Engine
 */
export class AutonomyEngine {
  constructor(options = {}) {
    this.state = ENGINE_STATES.STOPPED;
    this.eventBus = options.eventBus || getEventBus();
    this.pluginManager = options.pluginManager || getPluginManager();
    this.logger = options.logger || new EAOSLogger({ component: 'autonomy' });
    this.rootDir = options.rootDir || process.cwd();
    this.autonomyDir = path.join(this.rootDir, '.eaos', 'autonomy');

    this.triggers = new Map();
    this.schedules = { ...DEFAULT_SCHEDULES, ...(options.schedules || {}) };
    this.hdmLevel = options.hdmLevel || HDM_LEVELS.CONFIRM;
    this.timers = [];
    this.cycleHistory = [];
    this.maxHistory = 100;

    this.currentCycle = null;
    this.lastCycleRun = {
      daily: null,
      weekly: null,
      monthly: null
    };
  }

  /**
   * Initialize the autonomy engine
   */
  async initialize() {
    // Ensure autonomy directory exists
    await fs.ensureDir(this.autonomyDir);
    await fs.ensureDir(path.join(this.autonomyDir, 'logs'));

    // Load state if exists
    const statePath = path.join(this.autonomyDir, 'state.json');
    if (await fs.pathExists(statePath)) {
      try {
        const state = await fs.readJson(statePath);
        this.lastCycleRun = state.lastCycleRun || this.lastCycleRun;
        this.cycleHistory = state.cycleHistory || [];
      } catch {
        // Start fresh if state is corrupted
      }
    }

    // Register default triggers
    this.registerDefaultTriggers();

    // Initialize plugin manager
    await this.pluginManager.initialize(this.rootDir);

    this.logger.info('Autonomy engine initialized');
  }

  /**
   * Register default event triggers
   */
  registerDefaultTriggers() {
    // Code change triggers
    this.registerTrigger({
      id: 'pr-merge',
      name: 'PR Merge Detection',
      type: 'event',
      pattern: 'git:pr:merge',
      action: 'runSecuritySweep',
      hdmLevel: HDM_LEVELS.NOTIFY
    });

    this.registerTrigger({
      id: 'dependency-update',
      name: 'Dependency Update Detection',
      type: 'event',
      pattern: 'package:dependency:update',
      action: 'runSecurityScan',
      hdmLevel: HDM_LEVELS.CONFIRM
    });

    // Condition-based triggers
    this.registerTrigger({
      id: 'error-spike',
      name: 'Error Rate Spike',
      type: 'condition',
      pattern: (event) => event.data?.errorRate > 0.05,
      action: 'alertAndDiagnose',
      hdmLevel: HDM_LEVELS.NOTIFY
    });

    this.registerTrigger({
      id: 'burn-rate',
      name: 'Burn Rate Threshold',
      type: 'condition',
      pattern: (event) => event.data?.burnRate > 1.5,
      action: 'financialAlert',
      hdmLevel: HDM_LEVELS.CONFIRM
    });
  }

  /**
   * Register a trigger
   * @param {Object} config - Trigger configuration
   * @returns {Trigger}
   */
  registerTrigger(config) {
    const trigger = new Trigger(config);
    this.triggers.set(trigger.id, trigger);
    this.eventBus.emit(AutonomyEvents.TRIGGER_REGISTER, { trigger: trigger.toJSON() });
    return trigger;
  }

  /**
   * Unregister a trigger
   * @param {string} triggerId - Trigger ID
   */
  unregisterTrigger(triggerId) {
    if (this.triggers.has(triggerId)) {
      this.triggers.delete(triggerId);
      this.eventBus.emit(AutonomyEvents.TRIGGER_UNREGISTER, { triggerId });
    }
  }

  /**
   * Start the autonomy engine
   */
  async start() {
    if (this.state === ENGINE_STATES.RUNNING) {
      return;
    }

    this.state = ENGINE_STATES.RUNNING;
    await this.eventBus.emit(AutonomyEvents.ENGINE_START, { timestamp: new Date().toISOString() });

    // Subscribe to all events for trigger processing
    this.eventBus.on('*', this.processEvent.bind(this));

    // Schedule cycles
    this.scheduleCycles();

    this.logger.info('Autonomy engine started');
    await this.saveState();
  }

  /**
   * Stop the autonomy engine
   */
  async stop() {
    if (this.state === ENGINE_STATES.STOPPED) {
      return;
    }

    // Clear all timers
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    this.timers = [];

    this.state = ENGINE_STATES.STOPPED;
    await this.eventBus.emit(AutonomyEvents.ENGINE_STOP, { timestamp: new Date().toISOString() });

    this.logger.info('Autonomy engine stopped');
    await this.saveState();
  }

  /**
   * Pause the autonomy engine
   */
  async pause() {
    if (this.state !== ENGINE_STATES.RUNNING) {
      return;
    }

    this.state = ENGINE_STATES.PAUSED;
    await this.eventBus.emit(AutonomyEvents.ENGINE_PAUSE, { timestamp: new Date().toISOString() });
    this.logger.info('Autonomy engine paused');
  }

  /**
   * Resume the autonomy engine
   */
  async resume() {
    if (this.state !== ENGINE_STATES.PAUSED) {
      return;
    }

    this.state = ENGINE_STATES.RUNNING;
    await this.eventBus.emit(AutonomyEvents.ENGINE_RESUME, { timestamp: new Date().toISOString() });
    this.logger.info('Autonomy engine resumed');
  }

  /**
   * Process an event for trigger matching
   * @param {Object} eventData - Event data
   */
  async processEvent(eventData) {
    if (this.state !== ENGINE_STATES.RUNNING) return;

    for (const trigger of this.triggers.values()) {
      if (trigger.matches(eventData)) {
        // Check HDM level
        if (trigger.hdmLevel > this.hdmLevel) {
          await this.eventBus.emit(AutonomyEvents.APPROVAL_REQUIRED, {
            trigger: trigger.toJSON(),
            event: eventData,
            requiredLevel: trigger.hdmLevel
          });
          continue;
        }

        trigger.fire();
        await this.eventBus.emit(AutonomyEvents.TRIGGER_FIRE, {
          trigger: trigger.toJSON(),
          event: eventData
        });

        // Execute trigger action
        await this.executeTriggerAction(trigger, eventData);
      }
    }
  }

  /**
   * Execute a trigger's action
   * @param {Trigger} trigger - Trigger instance
   * @param {Object} eventData - Event data
   */
  async executeTriggerAction(trigger, eventData) {
    const actionName = trigger.action;

    // Check if action is a method on this engine
    if (typeof this[actionName] === 'function') {
      try {
        await this[actionName](eventData);
      } catch (error) {
        this.logger.error(`Trigger action failed: ${actionName}`, { error: error.message });
      }
    } else {
      this.logger.warn(`Unknown trigger action: ${actionName}`);
    }
  }

  /**
   * Schedule all cycles
   */
  scheduleCycles() {
    this.scheduleNextCycle(CYCLE_TYPES.DAILY);
    this.scheduleNextCycle(CYCLE_TYPES.WEEKLY);
    this.scheduleNextCycle(CYCLE_TYPES.MONTHLY);
  }

  /**
   * Schedule the next occurrence of a cycle type
   * @param {string} cycleType - Cycle type
   */
  scheduleNextCycle(cycleType) {
    const now = new Date();
    let nextRun;

    switch (cycleType) {
    case CYCLE_TYPES.DAILY: {
      const schedule = this.schedules.daily;
      nextRun = new Date(now);
      nextRun.setHours(schedule.hour, schedule.minute, 0, 0);
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;
    }
    case CYCLE_TYPES.WEEKLY: {
      const schedule = this.schedules.weekly;
      nextRun = new Date(now);
      const daysUntil = (schedule.dayOfWeek - now.getDay() + 7) % 7 || 7;
      nextRun.setDate(now.getDate() + daysUntil);
      nextRun.setHours(schedule.hour, schedule.minute, 0, 0);
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 7);
      }
      break;
    }
    case CYCLE_TYPES.MONTHLY: {
      const schedule = this.schedules.monthly;
      nextRun = new Date(now.getFullYear(), now.getMonth(), schedule.dayOfMonth);
      nextRun.setHours(schedule.hour, schedule.minute, 0, 0);
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
      break;
    }
    }

    const delay = nextRun.getTime() - now.getTime();
    const timer = setTimeout(() => this.runCycle(cycleType), delay);
    this.timers.push(timer);

    this.logger.debug(`Scheduled ${cycleType} cycle for ${nextRun.toISOString()}`);
  }

  /**
   * Run a cycle
   * @param {string} cycleType - Cycle type
   * @param {Object} options - Options
   */
  async runCycle(cycleType, options = {}) {
    if (this.state !== ENGINE_STATES.RUNNING && !options.force) {
      this.logger.warn(`Cannot run cycle: engine is ${this.state}`);
      return null;
    }

    const tasks = this.getTasksForCycle(cycleType);
    const cycleId = `${cycleType}-${Date.now()}`;

    const cycleReport = {
      id: cycleId,
      type: cycleType,
      startTime: new Date().toISOString(),
      endTime: null,
      tasks: [],
      status: 'running',
      errors: []
    };

    this.currentCycle = cycleReport;

    await this.eventBus.emit(AutonomyEvents.CYCLE_START, {
      cycleId,
      type: cycleType,
      taskCount: tasks.length
    });

    // Execute plugin beforeCycle hooks
    const beforeContext = await this.pluginManager.executeHooks(HOOK_TYPES.BEFORE_CYCLE, {
      cycleType,
      tasks
    });

    // Check if hooks cancelled the cycle
    if (beforeContext.cancelled) {
      cycleReport.status = 'cancelled';
      await this.eventBus.emit(AutonomyEvents.CYCLE_SKIP, { cycleId, reason: 'Cancelled by plugin' });
      return cycleReport;
    }

    // Execute tasks
    for (const task of tasks) {
      // Check HDM level
      if (task.hdmLevel > this.hdmLevel) {
        await this.eventBus.emit(AutonomyEvents.APPROVAL_REQUIRED, {
          task,
          cycleId,
          requiredLevel: task.hdmLevel
        });
        cycleReport.tasks.push({
          ...task,
          status: 'skipped',
          reason: 'Requires higher approval level'
        });
        continue;
      }

      const taskResult = await this.executeTask(task, cycleId);
      cycleReport.tasks.push(taskResult);

      if (taskResult.status === 'error') {
        cycleReport.errors.push(taskResult.error);
      }
    }

    // Execute plugin afterCycle hooks
    await this.pluginManager.executeHooks(HOOK_TYPES.AFTER_CYCLE, {
      cycleType,
      report: cycleReport
    });

    // Finalize cycle
    cycleReport.endTime = new Date().toISOString();
    cycleReport.status = cycleReport.errors.length > 0 ? 'completed_with_errors' : 'completed';

    this.lastCycleRun[cycleType] = cycleReport.endTime;
    this.cycleHistory.push(cycleReport);
    if (this.cycleHistory.length > this.maxHistory) {
      this.cycleHistory.shift();
    }

    await this.eventBus.emit(AutonomyEvents.CYCLE_END, {
      cycleId,
      type: cycleType,
      status: cycleReport.status,
      duration: new Date(cycleReport.endTime) - new Date(cycleReport.startTime)
    });

    // Save cycle report
    await this.saveCycleReport(cycleReport);
    await this.saveState();

    this.currentCycle = null;

    // Schedule next occurrence
    this.scheduleNextCycle(cycleType);

    return cycleReport;
  }

  /**
   * Get tasks for a cycle type
   * @param {string} cycleType - Cycle type
   * @returns {Array} Tasks
   */
  getTasksForCycle(cycleType) {
    switch (cycleType) {
    case CYCLE_TYPES.DAILY:
      return [...DAILY_TASKS];
    case CYCLE_TYPES.WEEKLY:
      return [...WEEKLY_TASKS];
    case CYCLE_TYPES.MONTHLY:
      return [...MONTHLY_TASKS];
    default:
      return [];
    }
  }

  /**
   * Execute a single task
   * @param {Object} task - Task definition
   * @param {string} cycleId - Parent cycle ID
   * @returns {Object} Task result
   */
  async executeTask(task, cycleId) {
    const startTime = new Date().toISOString();

    await this.eventBus.emit(AutonomyEvents.TASK_START, {
      taskId: task.id,
      taskName: task.name,
      cycleId
    });

    // Execute beforeTask hooks
    await this.pluginManager.executeHooks(HOOK_TYPES.BEFORE_TASK, { task, cycleId });

    const result = {
      id: task.id,
      name: task.name,
      startTime,
      endTime: null,
      status: 'running',
      output: null,
      error: null
    };

    try {
      // Execute task with timeout and retry
      const output = await withRetry(
        async () => withTimeout(
          () => this.runTaskHandler(task),
          60000, // 1 minute timeout per task
          `Task ${task.id} timed out`
        ),
        {
          maxAttempts: 2,
          initialDelay: 1000,
          shouldRetry: (err) => err instanceof TimeoutError
        }
      );

      result.output = output;
      result.status = 'completed';
    } catch (error) {
      result.status = 'error';
      result.error = error.message;

      await this.eventBus.emit(AutonomyEvents.TASK_ERROR, {
        taskId: task.id,
        cycleId,
        error: error.message
      });
    }

    result.endTime = new Date().toISOString();

    // Execute afterTask hooks
    await this.pluginManager.executeHooks(HOOK_TYPES.AFTER_TASK, { task, result, cycleId });

    await this.eventBus.emit(AutonomyEvents.TASK_END, {
      taskId: task.id,
      cycleId,
      status: result.status,
      duration: new Date(result.endTime) - new Date(result.startTime)
    });

    return result;
  }

  /**
   * Run a task handler (stub implementation)
   * @param {Object} task - Task definition
   * @returns {Object} Task output
   */
  async runTaskHandler(task) {
    // This is a stub - actual implementations would call appropriate modules
    this.logger.info(`Executing task: ${task.name}`);

    // Simulate task execution
    return {
      taskId: task.id,
      message: `Task ${task.name} completed successfully`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Save cycle report to disk
   * @param {Object} report - Cycle report
   */
  async saveCycleReport(report) {
    const filename = `cycle_${report.type}_${report.id}.json`;
    const filepath = path.join(this.autonomyDir, 'logs', filename);
    await fs.writeJson(filepath, report, { spaces: 2 });

    // Update last cycle report
    const lastReportPath = path.join(this.autonomyDir, 'last_cycle_report.json');
    await fs.writeJson(lastReportPath, report, { spaces: 2 });
  }

  /**
   * Save engine state
   */
  async saveState() {
    const statePath = path.join(this.autonomyDir, 'state.json');
    await fs.writeJson(statePath, {
      state: this.state,
      lastCycleRun: this.lastCycleRun,
      cycleHistory: this.cycleHistory.slice(-10), // Keep last 10 in state
      triggers: Array.from(this.triggers.values()).map(t => t.toJSON()),
      hdmLevel: this.hdmLevel,
      updatedAt: new Date().toISOString()
    }, { spaces: 2 });
  }

  /**
   * Get engine status
   * @returns {Object}
   */
  getStatus() {
    return {
      state: this.state,
      hdmLevel: this.hdmLevel,
      currentCycle: this.currentCycle,
      lastCycleRun: this.lastCycleRun,
      triggers: {
        total: this.triggers.size,
        enabled: Array.from(this.triggers.values()).filter(t => t.enabled).length
      },
      plugins: this.pluginManager.getStatus(),
      uptime: this.state === ENGINE_STATES.RUNNING ? 'running' : 'stopped'
    };
  }

  /**
   * Get trigger list
   * @returns {Array}
   */
  getTriggers() {
    return Array.from(this.triggers.values()).map(t => t.toJSON());
  }

  /**
   * Get cycle logs
   * @param {Object} options - Filter options
   * @returns {Array}
   */
  getLogs(options = {}) {
    let logs = [...this.cycleHistory];

    if (options.type) {
      logs = logs.filter(l => l.type === options.type);
    }

    if (options.status) {
      logs = logs.filter(l => l.status === options.status);
    }

    if (options.limit) {
      logs = logs.slice(-options.limit);
    }

    return logs;
  }

  // ==========================================================================
  // Built-in trigger actions
  // ==========================================================================

  async runSecuritySweep() {
    this.logger.info('Running security sweep from trigger');
    return this.runCycle(CYCLE_TYPES.DAILY, { force: true });
  }

  async runSecurityScan() {
    this.logger.info('Running security scan from trigger');
    // Would integrate with audit pipeline
    return { action: 'security_scan', status: 'completed' };
  }

  async alertAndDiagnose(eventData) {
    this.logger.warn('Error spike detected, running diagnostics', eventData.data);
    return { action: 'alert_and_diagnose', status: 'completed' };
  }

  async financialAlert(eventData) {
    this.logger.warn('Burn rate threshold exceeded', eventData.data);
    return { action: 'financial_alert', status: 'completed' };
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let globalAutonomyEngine = null;

/**
 * Get the global autonomy engine instance
 * @param {Object} options - Options
 * @returns {AutonomyEngine}
 */
export function getAutonomyEngine(options = {}) {
  if (!globalAutonomyEngine) {
    globalAutonomyEngine = new AutonomyEngine(options);
  }
  return globalAutonomyEngine;
}

/**
 * Create a new autonomy engine instance
 * @param {Object} options - Options
 * @returns {AutonomyEngine}
 */
export function createAutonomyEngine(options = {}) {
  return new AutonomyEngine(options);
}

// =============================================================================
// Export
// =============================================================================

export {
  ENGINE_STATES,
  CYCLE_TYPES,
  HDM_LEVELS,
  DAILY_TASKS,
  WEEKLY_TASKS,
  MONTHLY_TASKS
};

export default {
  AutonomyEngine,
  Trigger,
  ENGINE_STATES,
  CYCLE_TYPES,
  HDM_LEVELS,
  getAutonomyEngine,
  createAutonomyEngine
};
