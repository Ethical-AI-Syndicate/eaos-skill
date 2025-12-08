#!/usr/bin/env node

/**
 * EAOS Metrics Collector
 *
 * Provides runtime metrics collection for monitoring and observability.
 * Features:
 * - Counter, gauge, histogram metric types
 * - Label support for dimensional metrics
 * - File and memory storage
 * - Prometheus-compatible export format
 * - Aggregation and summarization
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

// =============================================================================
// Metric Types
// =============================================================================

class Counter {
  constructor(name, help, labels = []) {
    this.name = name;
    this.help = help;
    this.labels = labels;
    this.values = new Map();
  }

  inc(labelsObj = {}, value = 1) {
    const key = this._labelKey(labelsObj);
    const current = this.values.get(key) || 0;
    this.values.set(key, current + value);
  }

  get(labelsObj = {}) {
    const key = this._labelKey(labelsObj);
    return this.values.get(key) || 0;
  }

  reset() {
    this.values.clear();
  }

  _labelKey(labelsObj) {
    return JSON.stringify(labelsObj);
  }

  toPrometheus() {
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} counter`];
    for (const [key, value] of this.values) {
      const labels = JSON.parse(key);
      const labelStr = this._formatLabels(labels);
      lines.push(`${this.name}${labelStr} ${value}`);
    }
    return lines.join('\n');
  }

  _formatLabels(labels) {
    const entries = Object.entries(labels);
    if (entries.length === 0) return '';
    const pairs = entries.map(([k, v]) => `${k}="${v}"`);
    return `{${pairs.join(',')}}`;
  }
}

class Gauge {
  constructor(name, help, labels = []) {
    this.name = name;
    this.help = help;
    this.labels = labels;
    this.values = new Map();
  }

  set(labelsObj = {}, value) {
    const key = this._labelKey(labelsObj);
    this.values.set(key, value);
  }

  inc(labelsObj = {}, value = 1) {
    const key = this._labelKey(labelsObj);
    const current = this.values.get(key) || 0;
    this.values.set(key, current + value);
  }

  dec(labelsObj = {}, value = 1) {
    const key = this._labelKey(labelsObj);
    const current = this.values.get(key) || 0;
    this.values.set(key, current - value);
  }

  get(labelsObj = {}) {
    const key = this._labelKey(labelsObj);
    return this.values.get(key) || 0;
  }

  _labelKey(labelsObj) {
    return JSON.stringify(labelsObj);
  }

  toPrometheus() {
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} gauge`];
    for (const [key, value] of this.values) {
      const labels = JSON.parse(key);
      const labelStr = this._formatLabels(labels);
      lines.push(`${this.name}${labelStr} ${value}`);
    }
    return lines.join('\n');
  }

  _formatLabels(labels) {
    const entries = Object.entries(labels);
    if (entries.length === 0) return '';
    const pairs = entries.map(([k, v]) => `${k}="${v}"`);
    return `{${pairs.join(',')}}`;
  }
}

class Histogram {
  constructor(name, help, buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]) {
    this.name = name;
    this.help = help;
    this.buckets = buckets.sort((a, b) => a - b);
    this.observations = new Map();
  }

  observe(labelsObj = {}, value) {
    const key = this._labelKey(labelsObj);
    if (!this.observations.has(key)) {
      this.observations.set(key, {
        sum: 0,
        count: 0,
        buckets: new Map(this.buckets.map(b => [b, 0]))
      });
    }

    const obs = this.observations.get(key);
    obs.sum += value;
    obs.count += 1;

    // Only increment the first matching bucket (non-cumulative storage)
    // toPrometheus() will compute cumulative values on export
    for (const bucket of this.buckets) {
      if (value <= bucket) {
        obs.buckets.set(bucket, obs.buckets.get(bucket) + 1);
        break;
      }
    }
  }

  _labelKey(labelsObj) {
    return JSON.stringify(labelsObj);
  }

  toPrometheus() {
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} histogram`];

    for (const [key, obs] of this.observations) {
      const labels = JSON.parse(key);
      const labelStr = this._formatLabels(labels);

      let cumulative = 0;
      for (const bucket of this.buckets) {
        cumulative += obs.buckets.get(bucket);
        const bucketLabels = { ...labels, le: bucket.toString() };
        lines.push(`${this.name}_bucket${this._formatLabels(bucketLabels)} ${cumulative}`);
      }

      const infLabels = { ...labels, le: '+Inf' };
      lines.push(`${this.name}_bucket${this._formatLabels(infLabels)} ${obs.count}`);
      lines.push(`${this.name}_sum${labelStr} ${obs.sum}`);
      lines.push(`${this.name}_count${labelStr} ${obs.count}`);
    }

    return lines.join('\n');
  }

  _formatLabels(labels) {
    const entries = Object.entries(labels);
    if (entries.length === 0) return '';
    const pairs = entries.map(([k, v]) => `${k}="${v}"`);
    return `{${pairs.join(',')}}`;
  }
}

// =============================================================================
// Metrics Registry
// =============================================================================

class MetricsRegistry {
  constructor() {
    this.metrics = new Map();
    this.metricsDir = path.join(ROOT_DIR, 'metrics');
  }

  // Create or get a counter
  counter(name, help, labels = []) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, new Counter(name, help, labels));
    }
    return this.metrics.get(name);
  }

  // Create or get a gauge
  gauge(name, help, labels = []) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, new Gauge(name, help, labels));
    }
    return this.metrics.get(name);
  }

  // Create or get a histogram
  histogram(name, help, buckets) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, new Histogram(name, help, buckets));
    }
    return this.metrics.get(name);
  }

  // Export all metrics in Prometheus format
  toPrometheus() {
    const lines = [];
    for (const metric of this.metrics.values()) {
      lines.push(metric.toPrometheus());
      lines.push('');
    }
    return lines.join('\n');
  }

  // Export to JSON
  toJSON() {
    const result = {};
    for (const [name, metric] of this.metrics) {
      result[name] = {
        type: metric.constructor.name.toLowerCase(),
        help: metric.help,
        values: metric.values ? Object.fromEntries(metric.values) : metric.observations
          ? Object.fromEntries(
            Array.from(metric.observations.entries()).map(([k, v]) => [k, {
              sum: v.sum,
              count: v.count,
              buckets: Object.fromEntries(v.buckets)
            }])
          )
          : {}
      };
    }
    return result;
  }

  // Save metrics to file
  save() {
    if (!fs.existsSync(this.metricsDir)) {
      fs.mkdirSync(this.metricsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.join(this.metricsDir, `metrics-${timestamp}.json`);

    fs.writeFileSync(filename, JSON.stringify(this.toJSON(), null, 2));
    return filename;
  }

  // Reset all metrics
  reset() {
    for (const metric of this.metrics.values()) {
      if (metric.reset) {
        metric.reset();
      } else if (metric.values) {
        metric.values.clear();
      } else if (metric.observations) {
        metric.observations.clear();
      }
    }
  }
}

// =============================================================================
// Default EAOS Metrics
// =============================================================================

const registry = new MetricsRegistry();

// Command execution metrics
const commandsTotal = registry.counter(
  'eaos_commands_total',
  'Total number of CLI commands executed',
  ['command', 'status']
);

const commandDuration = registry.histogram(
  'eaos_command_duration_seconds',
  'Duration of CLI command execution',
  [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 30]
);

// Agent metrics
const agentInvocations = registry.counter(
  'eaos_agent_invocations_total',
  'Total number of agent invocations',
  ['agent', 'result']
);

const agentDuration = registry.histogram(
  'eaos_agent_duration_seconds',
  'Duration of agent execution',
  [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120]
);

// Memory metrics
const memoryOperations = registry.counter(
  'eaos_memory_operations_total',
  'Total memory kernel operations',
  ['operation', 'status']
);

const reasoningGraphSize = registry.gauge(
  'eaos_reasoning_graph_nodes',
  'Number of nodes in reasoning graph',
  []
);

// Compliance metrics
const complianceChecks = registry.counter(
  'eaos_compliance_checks_total',
  'Total compliance checks run',
  ['framework', 'result']
);

const complianceScore = registry.gauge(
  'eaos_compliance_score',
  'Current compliance score (0-100)',
  ['framework']
);

// BEADS metrics
const beadsCreated = registry.counter(
  'eaos_beads_created_total',
  'Total BEADS created',
  ['category', 'priority']
);

const beadsCompleted = registry.counter(
  'eaos_beads_completed_total',
  'Total BEADS completed',
  ['category']
);

const beadsOpen = registry.gauge(
  'eaos_beads_open',
  'Currently open BEADS',
  ['priority']
);

// Audit metrics
const auditsRun = registry.counter(
  'eaos_audits_total',
  'Total audits executed',
  ['type', 'result']
);

const auditFindings = registry.gauge(
  'eaos_audit_findings',
  'Current audit findings count',
  ['severity']
);

// =============================================================================
// Exports
// =============================================================================

export {
  MetricsRegistry,
  Counter,
  Gauge,
  Histogram,
  registry,
  commandsTotal,
  commandDuration,
  agentInvocations,
  agentDuration,
  memoryOperations,
  reasoningGraphSize,
  complianceChecks,
  complianceScore,
  beadsCreated,
  beadsCompleted,
  beadsOpen,
  auditsRun,
  auditFindings
};

export default registry;

// =============================================================================
// CLI Usage
// =============================================================================

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('EAOS Metrics Demo\n');

  // Simulate some metrics
  commandsTotal.inc({ command: 'init', status: 'success' });
  commandsTotal.inc({ command: 'status', status: 'success' });
  commandsTotal.inc({ command: 'audit', status: 'success' });
  commandsTotal.inc({ command: 'audit', status: 'error' });

  commandDuration.observe({ command: 'init' }, 0.5);
  commandDuration.observe({ command: 'status' }, 0.1);
  commandDuration.observe({ command: 'audit' }, 2.5);

  agentInvocations.inc({ agent: 'autonomous_cto', result: 'success' }, 5);
  agentInvocations.inc({ agent: 'cfo_agent', result: 'success' }, 3);

  complianceScore.set({ framework: 'soc2' }, 94);
  complianceScore.set({ framework: 'iso27001' }, 88);
  complianceScore.set({ framework: 'nist' }, 82);

  beadsOpen.set({ priority: 'P0' }, 0);
  beadsOpen.set({ priority: 'P1' }, 3);
  beadsOpen.set({ priority: 'P2' }, 12);
  beadsOpen.set({ priority: 'P3' }, 25);

  reasoningGraphSize.set({}, 150);

  console.log('Prometheus Format:');
  console.log('─'.repeat(50));
  console.log(registry.toPrometheus());

  console.log('\nJSON Format:');
  console.log('─'.repeat(50));
  console.log(JSON.stringify(registry.toJSON(), null, 2));
}
