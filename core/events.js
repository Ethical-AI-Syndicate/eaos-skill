/**
 * EAOS Event Bus Module
 *
 * Provides a pub/sub event system for inter-component communication
 * in the autonomy engine and plugin system.
 */

// =============================================================================
// Event Bus Implementation
// =============================================================================

/**
 * Event Bus for pub/sub communication
 */
export class EventBus {
  constructor() {
    this.listeners = new Map();
    this.onceListeners = new Map();
    this.history = [];
    this.maxHistory = 100;
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name (supports wildcards with *)
   * @param {Function} callback - Handler function
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Subscribe to an event once
   * @param {string} event - Event name
   * @param {Function} callback - Handler function
   * @returns {Function} Unsubscribe function
   */
  once(event, callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, new Set());
    }
    this.onceListeners.get(event).add(callback);

    return () => {
      const listeners = this.onceListeners.get(event);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} callback - Handler function
   */
  off(event, callback) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.listeners.delete(event);
      }
    }

    const onceListeners = this.onceListeners.get(event);
    if (onceListeners) {
      onceListeners.delete(callback);
      if (onceListeners.size === 0) {
        this.onceListeners.delete(event);
      }
    }
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {Object} data - Event data
   * @returns {Promise<void>}
   */
  async emit(event, data = {}) {
    const eventData = {
      event,
      data,
      timestamp: new Date().toISOString()
    };

    // Store in history
    this.history.push(eventData);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    const promises = [];

    // Call exact match listeners
    const exactListeners = this.listeners.get(event);
    if (exactListeners) {
      for (const callback of exactListeners) {
        promises.push(this.safeCall(callback, eventData));
      }
    }

    // Call wildcard listeners
    for (const [pattern, callbacks] of this.listeners) {
      if (pattern !== event && this.matchesPattern(event, pattern)) {
        for (const callback of callbacks) {
          promises.push(this.safeCall(callback, eventData));
        }
      }
    }

    // Call once listeners
    const onceListeners = this.onceListeners.get(event);
    if (onceListeners) {
      for (const callback of onceListeners) {
        promises.push(this.safeCall(callback, eventData));
      }
      this.onceListeners.delete(event);
    }

    await Promise.all(promises);
  }

  /**
   * Check if event matches a pattern
   * @param {string} event - Event name
   * @param {string} pattern - Pattern with optional wildcards
   * @returns {boolean}
   */
  matchesPattern(event, pattern) {
    if (pattern === '*') return true;
    if (!pattern.includes('*')) return event === pattern;

    // Convert pattern to regex
    const regexPattern = pattern
      .split('*')
      .map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*');
    return new RegExp(`^${regexPattern}$`).test(event);
  }

  /**
   * Safely call a callback with error handling
   * @param {Function} callback - Handler function
   * @param {Object} eventData - Event data
   * @returns {Promise<void>}
   */
  async safeCall(callback, eventData) {
    try {
      await callback(eventData);
    } catch (error) {
      // Emit error event (but don't recurse)
      if (eventData.event !== 'error') {
        console.error(`Event handler error for ${eventData.event}:`, error.message);
      }
    }
  }

  /**
   * Get event history
   * @param {string} filter - Optional event name filter
   * @returns {Array} Event history
   */
  getHistory(filter = null) {
    if (!filter) return [...this.history];
    return this.history.filter(e => this.matchesPattern(e.event, filter));
  }

  /**
   * Clear all listeners
   */
  clear() {
    this.listeners.clear();
    this.onceListeners.clear();
  }

  /**
   * Get listener count for an event
   * @param {string} event - Event name
   * @returns {number} Listener count
   */
  listenerCount(event) {
    const exact = this.listeners.get(event)?.size || 0;
    const once = this.onceListeners.get(event)?.size || 0;
    return exact + once;
  }

  /**
   * Wait for an event to be emitted
   * @param {string} event - Event name
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Object>} Event data
   */
  waitFor(event, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(event, handler);
        reject(new Error(`Timeout waiting for event: ${event}`));
      }, timeout);

      const handler = (eventData) => {
        clearTimeout(timer);
        resolve(eventData);
      };

      this.once(event, handler);
    });
  }
}

// =============================================================================
// Built-in Event Types
// =============================================================================

export const AutonomyEvents = {
  // Lifecycle events
  ENGINE_START: 'autonomy:engine:start',
  ENGINE_STOP: 'autonomy:engine:stop',
  ENGINE_PAUSE: 'autonomy:engine:pause',
  ENGINE_RESUME: 'autonomy:engine:resume',

  // Cycle events
  CYCLE_START: 'autonomy:cycle:start',
  CYCLE_END: 'autonomy:cycle:end',
  CYCLE_ERROR: 'autonomy:cycle:error',
  CYCLE_SKIP: 'autonomy:cycle:skip',

  // Task events
  TASK_START: 'autonomy:task:start',
  TASK_END: 'autonomy:task:end',
  TASK_ERROR: 'autonomy:task:error',

  // Trigger events
  TRIGGER_FIRE: 'autonomy:trigger:fire',
  TRIGGER_REGISTER: 'autonomy:trigger:register',
  TRIGGER_UNREGISTER: 'autonomy:trigger:unregister',

  // Approval events
  APPROVAL_REQUIRED: 'autonomy:approval:required',
  APPROVAL_GRANTED: 'autonomy:approval:granted',
  APPROVAL_DENIED: 'autonomy:approval:denied',

  // Health events
  HEALTH_CHECK: 'autonomy:health:check',
  HEALTH_DEGRADED: 'autonomy:health:degraded',
  HEALTH_RECOVERED: 'autonomy:health:recovered'
};

export const PluginEvents = {
  // Lifecycle events
  PLUGIN_LOAD: 'plugin:load',
  PLUGIN_UNLOAD: 'plugin:unload',
  PLUGIN_ERROR: 'plugin:error',
  PLUGIN_ENABLE: 'plugin:enable',
  PLUGIN_DISABLE: 'plugin:disable',

  // Hook events
  BEFORE_CYCLE: 'plugin:hook:before:cycle',
  AFTER_CYCLE: 'plugin:hook:after:cycle',
  BEFORE_TASK: 'plugin:hook:before:task',
  AFTER_TASK: 'plugin:hook:after:task'
};

// =============================================================================
// Singleton Instance
// =============================================================================

let globalEventBus = null;

/**
 * Get the global event bus instance
 * @returns {EventBus}
 */
export function getEventBus() {
  if (!globalEventBus) {
    globalEventBus = new EventBus();
  }
  return globalEventBus;
}

/**
 * Create a new event bus instance
 * @returns {EventBus}
 */
export function createEventBus() {
  return new EventBus();
}

// =============================================================================
// Export
// =============================================================================

export default {
  EventBus,
  AutonomyEvents,
  PluginEvents,
  getEventBus,
  createEventBus
};
