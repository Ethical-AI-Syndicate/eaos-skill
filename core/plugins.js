/**
 * EAOS Plugin System Module
 *
 * Provides a plugin architecture for extending EAOS functionality
 * with lifecycle hooks, dependency management, and sandboxed execution.
 */

import fs from 'fs-extra';
import path from 'path';
import { getEventBus, PluginEvents } from './events.js';
import { ValidationError, ConfigurationError } from './errors.js';
import { isValidIdentifier, isPathSafe } from './validation.js';

// =============================================================================
// Constants
// =============================================================================

const PLUGIN_MANIFEST = 'plugin.json';
const DEFAULT_PLUGINS_DIR = 'plugins';

const PLUGIN_STATES = {
  UNLOADED: 'unloaded',
  LOADED: 'loaded',
  ENABLED: 'enabled',
  DISABLED: 'disabled',
  ERROR: 'error'
};

const HOOK_TYPES = {
  BEFORE_CYCLE: 'beforeCycle',
  AFTER_CYCLE: 'afterCycle',
  BEFORE_TASK: 'beforeTask',
  AFTER_TASK: 'afterTask',
  ON_TRIGGER: 'onTrigger',
  ON_ERROR: 'onError'
};

// =============================================================================
// Plugin Class
// =============================================================================

/**
 * Represents a loaded plugin
 */
export class Plugin {
  constructor(manifest, basePath) {
    this.id = manifest.id;
    this.name = manifest.name;
    this.version = manifest.version;
    this.description = manifest.description || '';
    this.author = manifest.author || 'Unknown';
    this.dependencies = manifest.dependencies || [];
    this.hooks = manifest.hooks || {};
    this.config = manifest.config || {};
    this.basePath = basePath;
    this.state = PLUGIN_STATES.UNLOADED;
    this.instance = null;
    this.loadedAt = null;
    this.error = null;
  }

  /**
   * Check if plugin is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.state === PLUGIN_STATES.ENABLED;
  }

  /**
   * Check if plugin is loaded
   * @returns {boolean}
   */
  isLoaded() {
    return this.state !== PLUGIN_STATES.UNLOADED;
  }

  /**
   * Get plugin info
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      description: this.description,
      author: this.author,
      state: this.state,
      dependencies: this.dependencies,
      hooks: Object.keys(this.hooks),
      loadedAt: this.loadedAt,
      error: this.error?.message || null
    };
  }
}

// =============================================================================
// Plugin Manager
// =============================================================================

/**
 * Manages plugin lifecycle and execution
 */
export class PluginManager {
  constructor(options = {}) {
    this.plugins = new Map();
    this.hooks = new Map();
    this.pluginsDir = options.pluginsDir || DEFAULT_PLUGINS_DIR;
    this.eventBus = options.eventBus || getEventBus();
    this.config = options.config || {};
    this.initialized = false;

    // Initialize hook containers
    for (const hookType of Object.values(HOOK_TYPES)) {
      this.hooks.set(hookType, []);
    }
  }

  /**
   * Initialize the plugin manager
   * @param {string} rootDir - Root directory for plugins
   */
  async initialize(rootDir) {
    if (this.initialized) return;

    const pluginsPath = path.join(rootDir, this.pluginsDir);

    // Create plugins directory if it doesn't exist
    await fs.ensureDir(pluginsPath);

    this.rootDir = rootDir;
    this.pluginsPath = pluginsPath;
    this.initialized = true;
  }

  /**
   * Discover plugins in the plugins directory
   * @returns {Promise<string[]>} List of discovered plugin IDs
   */
  async discover() {
    if (!this.initialized) {
      throw new ConfigurationError('PluginManager not initialized');
    }

    const discovered = [];

    try {
      const entries = await fs.readdir(this.pluginsPath, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const pluginPath = path.join(this.pluginsPath, entry.name);
        const manifestPath = path.join(pluginPath, PLUGIN_MANIFEST);

        if (await fs.pathExists(manifestPath)) {
          try {
            const manifest = await fs.readJson(manifestPath);
            if (this.validateManifest(manifest)) {
              discovered.push(manifest.id);
            }
          } catch {
            // Skip invalid manifests
          }
        }
      }
    } catch {
      // Directory doesn't exist or isn't readable
    }

    return discovered;
  }

  /**
   * Validate a plugin manifest
   * @param {Object} manifest - Plugin manifest
   * @returns {boolean}
   */
  validateManifest(manifest) {
    if (!manifest.id || !isValidIdentifier(manifest.id)) {
      return false;
    }
    if (!manifest.name || typeof manifest.name !== 'string') {
      return false;
    }
    if (!manifest.version || typeof manifest.version !== 'string') {
      return false;
    }
    return true;
  }

  /**
   * Load a plugin by ID
   * @param {string} pluginId - Plugin ID
   * @returns {Promise<Plugin>}
   */
  async load(pluginId) {
    if (!this.initialized) {
      throw new ConfigurationError('PluginManager not initialized');
    }

    if (!isValidIdentifier(pluginId)) {
      throw new ValidationError(`Invalid plugin ID: ${pluginId}`);
    }

    // Check if already loaded
    if (this.plugins.has(pluginId)) {
      return this.plugins.get(pluginId);
    }

    const pluginPath = path.join(this.pluginsPath, pluginId);
    const manifestPath = path.join(pluginPath, PLUGIN_MANIFEST);

    // Check plugin exists
    if (!await fs.pathExists(manifestPath)) {
      throw new ValidationError(`Plugin not found: ${pluginId}`);
    }

    // Load manifest
    const manifest = await fs.readJson(manifestPath);
    if (!this.validateManifest(manifest)) {
      throw new ValidationError(`Invalid plugin manifest: ${pluginId}`);
    }

    // Create plugin instance
    const plugin = new Plugin(manifest, pluginPath);

    // Check dependencies
    for (const dep of plugin.dependencies) {
      if (!this.plugins.has(dep)) {
        throw new ValidationError(`Missing dependency: ${dep} for plugin ${pluginId}`);
      }
    }

    // Load plugin module if it has an entry point
    if (manifest.main) {
      const mainPath = path.join(pluginPath, manifest.main);
      if (!isPathSafe(manifest.main)) {
        throw new ValidationError(`Invalid plugin entry point: ${manifest.main}`);
      }

      try {
        const module = await import(mainPath);
        plugin.instance = module.default || module;
      } catch (error) {
        plugin.state = PLUGIN_STATES.ERROR;
        plugin.error = error;
        throw error;
      }
    }

    // Register hooks
    this.registerPluginHooks(plugin);

    plugin.state = PLUGIN_STATES.LOADED;
    plugin.loadedAt = new Date().toISOString();
    this.plugins.set(pluginId, plugin);

    await this.eventBus.emit(PluginEvents.PLUGIN_LOAD, { plugin: plugin.toJSON() });

    return plugin;
  }

  /**
   * Unload a plugin
   * @param {string} pluginId - Plugin ID
   */
  async unload(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;

    // Check if other plugins depend on this one
    for (const [id, p] of this.plugins) {
      if (p.dependencies.includes(pluginId)) {
        throw new ValidationError(`Cannot unload ${pluginId}: ${id} depends on it`);
      }
    }

    // Call plugin cleanup if available
    if (plugin.instance?.onUnload) {
      try {
        await plugin.instance.onUnload();
      } catch {
        // Ignore cleanup errors
      }
    }

    // Unregister hooks
    this.unregisterPluginHooks(plugin);

    plugin.state = PLUGIN_STATES.UNLOADED;
    this.plugins.delete(pluginId);

    await this.eventBus.emit(PluginEvents.PLUGIN_UNLOAD, { pluginId });
  }

  /**
   * Enable a plugin
   * @param {string} pluginId - Plugin ID
   */
  async enable(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new ValidationError(`Plugin not loaded: ${pluginId}`);
    }

    if (plugin.state === PLUGIN_STATES.ENABLED) return;

    // Enable dependencies first
    for (const dep of plugin.dependencies) {
      await this.enable(dep);
    }

    // Call plugin enable hook if available
    if (plugin.instance?.onEnable) {
      await plugin.instance.onEnable(this.config[pluginId] || {});
    }

    plugin.state = PLUGIN_STATES.ENABLED;
    await this.eventBus.emit(PluginEvents.PLUGIN_ENABLE, { pluginId });
  }

  /**
   * Disable a plugin
   * @param {string} pluginId - Plugin ID
   */
  async disable(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;

    if (plugin.state !== PLUGIN_STATES.ENABLED) return;

    // Call plugin disable hook if available
    if (plugin.instance?.onDisable) {
      try {
        await plugin.instance.onDisable();
      } catch {
        // Ignore disable errors
      }
    }

    plugin.state = PLUGIN_STATES.DISABLED;
    await this.eventBus.emit(PluginEvents.PLUGIN_DISABLE, { pluginId });
  }

  /**
   * Register hooks from a plugin
   * @param {Plugin} plugin - Plugin instance
   */
  registerPluginHooks(plugin) {
    for (const [hookType, handler] of Object.entries(plugin.hooks)) {
      if (!HOOK_TYPES[hookType.toUpperCase()]) continue;

      const normalizedType = HOOK_TYPES[hookType.toUpperCase()] || hookType;
      const hooks = this.hooks.get(normalizedType);
      if (hooks) {
        hooks.push({
          pluginId: plugin.id,
          handler: typeof handler === 'string'
            ? plugin.instance?.[handler]?.bind(plugin.instance)
            : handler,
          priority: plugin.hooks[`${hookType}Priority`] || 0
        });
        // Sort by priority (higher first)
        hooks.sort((a, b) => b.priority - a.priority);
      }
    }
  }

  /**
   * Unregister hooks from a plugin
   * @param {Plugin} plugin - Plugin instance
   */
  unregisterPluginHooks(plugin) {
    for (const [hookType, hooks] of this.hooks) {
      const filtered = hooks.filter(h => h.pluginId !== plugin.id);
      this.hooks.set(hookType, filtered);
    }
  }

  /**
   * Execute hooks of a given type
   * @param {string} hookType - Hook type
   * @param {Object} context - Context to pass to hooks
   * @returns {Promise<Object>} Modified context
   */
  async executeHooks(hookType, context = {}) {
    const hooks = this.hooks.get(hookType) || [];
    let result = { ...context };

    for (const hook of hooks) {
      const plugin = this.plugins.get(hook.pluginId);
      if (!plugin?.isEnabled()) continue;

      try {
        if (typeof hook.handler === 'function') {
          const hookResult = await hook.handler(result);
          if (hookResult !== undefined) {
            result = { ...result, ...hookResult };
          }
        }
      } catch (error) {
        await this.eventBus.emit(PluginEvents.PLUGIN_ERROR, {
          pluginId: hook.pluginId,
          hookType,
          error: error.message
        });

        // Continue with other hooks unless context says to stop
        if (result.stopOnError) {
          throw error;
        }
      }
    }

    return result;
  }

  /**
   * Get all loaded plugins
   * @returns {Plugin[]}
   */
  getAll() {
    return Array.from(this.plugins.values());
  }

  /**
   * Get a plugin by ID
   * @param {string} pluginId - Plugin ID
   * @returns {Plugin|undefined}
   */
  get(pluginId) {
    return this.plugins.get(pluginId);
  }

  /**
   * Check if a plugin is loaded
   * @param {string} pluginId - Plugin ID
   * @returns {boolean}
   */
  has(pluginId) {
    return this.plugins.has(pluginId);
  }

  /**
   * Get enabled plugin count
   * @returns {number}
   */
  enabledCount() {
    return this.getAll().filter(p => p.isEnabled()).length;
  }

  /**
   * Load all discovered plugins
   * @returns {Promise<Plugin[]>}
   */
  async loadAll() {
    const discovered = await this.discover();
    const loaded = [];

    for (const pluginId of discovered) {
      try {
        const plugin = await this.load(pluginId);
        loaded.push(plugin);
      } catch {
        // Skip plugins that fail to load
      }
    }

    return loaded;
  }

  /**
   * Get plugin manager status
   * @returns {Object}
   */
  getStatus() {
    const plugins = this.getAll();
    return {
      initialized: this.initialized,
      pluginsDir: this.pluginsPath,
      total: plugins.length,
      enabled: plugins.filter(p => p.isEnabled()).length,
      disabled: plugins.filter(p => p.state === PLUGIN_STATES.DISABLED).length,
      error: plugins.filter(p => p.state === PLUGIN_STATES.ERROR).length,
      plugins: plugins.map(p => p.toJSON())
    };
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let globalPluginManager = null;

/**
 * Get the global plugin manager instance
 * @param {Object} options - Options
 * @returns {PluginManager}
 */
export function getPluginManager(options = {}) {
  if (!globalPluginManager) {
    globalPluginManager = new PluginManager(options);
  }
  return globalPluginManager;
}

/**
 * Create a new plugin manager instance
 * @param {Object} options - Options
 * @returns {PluginManager}
 */
export function createPluginManager(options = {}) {
  return new PluginManager(options);
}

// =============================================================================
// Export
// =============================================================================

export { PLUGIN_STATES, HOOK_TYPES };

export default {
  Plugin,
  PluginManager,
  PLUGIN_STATES,
  HOOK_TYPES,
  getPluginManager,
  createPluginManager
};
