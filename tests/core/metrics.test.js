/**
 * EAOS Metrics Unit Tests
 *
 * Tests for core/metrics.js covering:
 * - Counter operations (inc, get, reset)
 * - Gauge operations (set, inc, dec, get)
 * - Histogram operations (observe, buckets)
 * - MetricsRegistry (registration, export)
 * - Prometheus format export
 * - JSON format export
 * - Label handling
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '../..');

// Import the metrics module
import {
  MetricsRegistry,
  Counter,
  Gauge,
  Histogram
} from '../../core/metrics.js';

// Test directory for file output tests
const TEST_METRICS_DIR = path.join(ROOT_DIR, 'tests', '.test-metrics');

// =============================================================================
// Helper Functions
// =============================================================================

function cleanTestMetricsDir() {
  if (fs.existsSync(TEST_METRICS_DIR)) {
    fs.rmSync(TEST_METRICS_DIR, { recursive: true, force: true });
  }
}

// =============================================================================
// Counter Tests
// =============================================================================

describe('Counter', () => {

  test('should initialize with name and help', () => {
    const counter = new Counter('test_counter', 'Test counter help');
    assert.strictEqual(counter.name, 'test_counter');
    assert.strictEqual(counter.help, 'Test counter help');
  });

  test('should start at zero', () => {
    const counter = new Counter('test_counter', 'Test');
    assert.strictEqual(counter.get({}), 0);
  });

  test('should increment by 1 by default', () => {
    const counter = new Counter('test_counter', 'Test');
    counter.inc({});
    assert.strictEqual(counter.get({}), 1);
  });

  test('should increment by specified value', () => {
    const counter = new Counter('test_counter', 'Test');
    counter.inc({}, 5);
    assert.strictEqual(counter.get({}), 5);
  });

  test('should accumulate increments', () => {
    const counter = new Counter('test_counter', 'Test');
    counter.inc({}, 1);
    counter.inc({}, 2);
    counter.inc({}, 3);
    assert.strictEqual(counter.get({}), 6);
  });

  test('should support labels', () => {
    const counter = new Counter('test_counter', 'Test', ['status']);
    counter.inc({ status: 'success' }, 5);
    counter.inc({ status: 'error' }, 2);

    assert.strictEqual(counter.get({ status: 'success' }), 5);
    assert.strictEqual(counter.get({ status: 'error' }), 2);
  });

  test('should track different label combinations separately', () => {
    const counter = new Counter('requests', 'Test', ['method', 'status']);
    counter.inc({ method: 'GET', status: '200' });
    counter.inc({ method: 'GET', status: '404' });
    counter.inc({ method: 'POST', status: '200' });

    assert.strictEqual(counter.get({ method: 'GET', status: '200' }), 1);
    assert.strictEqual(counter.get({ method: 'GET', status: '404' }), 1);
    assert.strictEqual(counter.get({ method: 'POST', status: '200' }), 1);
    assert.strictEqual(counter.get({ method: 'POST', status: '404' }), 0);
  });

  test('should reset all values', () => {
    const counter = new Counter('test_counter', 'Test');
    counter.inc({ label: 'a' }, 10);
    counter.inc({ label: 'b' }, 20);
    counter.reset();

    assert.strictEqual(counter.get({ label: 'a' }), 0);
    assert.strictEqual(counter.get({ label: 'b' }), 0);
  });

  test('should export to Prometheus format', () => {
    const counter = new Counter('http_requests_total', 'Total HTTP requests');
    counter.inc({ method: 'GET' }, 100);
    counter.inc({ method: 'POST' }, 50);

    const prom = counter.toPrometheus();
    assert.ok(prom.includes('# HELP http_requests_total Total HTTP requests'));
    assert.ok(prom.includes('# TYPE http_requests_total counter'));
    assert.ok(prom.includes('http_requests_total{method="GET"} 100'));
    assert.ok(prom.includes('http_requests_total{method="POST"} 50'));
  });

  test('should format empty labels correctly', () => {
    const counter = new Counter('simple_counter', 'Test');
    counter.inc({}, 42);

    const prom = counter.toPrometheus();
    assert.ok(prom.includes('simple_counter 42'));
  });

});

// =============================================================================
// Gauge Tests
// =============================================================================

describe('Gauge', () => {

  test('should initialize with name and help', () => {
    const gauge = new Gauge('test_gauge', 'Test gauge help');
    assert.strictEqual(gauge.name, 'test_gauge');
    assert.strictEqual(gauge.help, 'Test gauge help');
  });

  test('should start at zero', () => {
    const gauge = new Gauge('test_gauge', 'Test');
    assert.strictEqual(gauge.get({}), 0);
  });

  test('should set value directly', () => {
    const gauge = new Gauge('test_gauge', 'Test');
    gauge.set({}, 42);
    assert.strictEqual(gauge.get({}), 42);
  });

  test('should overwrite previous value on set', () => {
    const gauge = new Gauge('test_gauge', 'Test');
    gauge.set({}, 100);
    gauge.set({}, 50);
    assert.strictEqual(gauge.get({}), 50);
  });

  test('should increment value', () => {
    const gauge = new Gauge('test_gauge', 'Test');
    gauge.set({}, 10);
    gauge.inc({}, 5);
    assert.strictEqual(gauge.get({}), 15);
  });

  test('should decrement value', () => {
    const gauge = new Gauge('test_gauge', 'Test');
    gauge.set({}, 10);
    gauge.dec({}, 3);
    assert.strictEqual(gauge.get({}), 7);
  });

  test('should allow negative values', () => {
    const gauge = new Gauge('test_gauge', 'Test');
    gauge.dec({}, 5);
    assert.strictEqual(gauge.get({}), -5);
  });

  test('should support labels', () => {
    const gauge = new Gauge('temperature', 'Test', ['location']);
    gauge.set({ location: 'cpu' }, 65);
    gauge.set({ location: 'gpu' }, 80);

    assert.strictEqual(gauge.get({ location: 'cpu' }), 65);
    assert.strictEqual(gauge.get({ location: 'gpu' }), 80);
  });

  test('should export to Prometheus format', () => {
    const gauge = new Gauge('memory_bytes', 'Memory usage');
    gauge.set({ type: 'heap' }, 1024000);
    gauge.set({ type: 'rss' }, 2048000);

    const prom = gauge.toPrometheus();
    assert.ok(prom.includes('# HELP memory_bytes Memory usage'));
    assert.ok(prom.includes('# TYPE memory_bytes gauge'));
    assert.ok(prom.includes('memory_bytes{type="heap"} 1024000'));
    assert.ok(prom.includes('memory_bytes{type="rss"} 2048000'));
  });

  test('increment should default to 1', () => {
    const gauge = new Gauge('test_gauge', 'Test');
    gauge.inc({});
    assert.strictEqual(gauge.get({}), 1);
  });

  test('decrement should default to 1', () => {
    const gauge = new Gauge('test_gauge', 'Test');
    gauge.set({}, 10);
    gauge.dec({});
    assert.strictEqual(gauge.get({}), 9);
  });

});

// =============================================================================
// Histogram Tests
// =============================================================================

describe('Histogram', () => {

  test('should initialize with name and help', () => {
    const histogram = new Histogram('test_histogram', 'Test histogram help');
    assert.strictEqual(histogram.name, 'test_histogram');
    assert.strictEqual(histogram.help, 'Test histogram help');
  });

  test('should use default buckets', () => {
    const histogram = new Histogram('test_histogram', 'Test');
    assert.ok(histogram.buckets.length > 0);
    assert.ok(histogram.buckets.includes(0.1));
    assert.ok(histogram.buckets.includes(1));
    assert.ok(histogram.buckets.includes(10));
  });

  test('should accept custom buckets', () => {
    const histogram = new Histogram('test_histogram', 'Test', [0.1, 0.5, 1, 5]);
    assert.deepStrictEqual(histogram.buckets, [0.1, 0.5, 1, 5]);
  });

  test('should sort buckets', () => {
    const histogram = new Histogram('test_histogram', 'Test', [5, 0.1, 1, 0.5]);
    assert.deepStrictEqual(histogram.buckets, [0.1, 0.5, 1, 5]);
  });

  test('should track observations', () => {
    const histogram = new Histogram('test_histogram', 'Test', [1, 5, 10]);
    histogram.observe({}, 0.5);
    histogram.observe({}, 2);
    histogram.observe({}, 7);

    const prom = histogram.toPrometheus();
    assert.ok(prom.includes('test_histogram_sum 9.5'));
    assert.ok(prom.includes('test_histogram_count 3'));
  });

  test('should populate buckets correctly', () => {
    const histogram = new Histogram('test_histogram', 'Test', [1, 5, 10]);
    histogram.observe({}, 0.5);  // <= 1
    histogram.observe({}, 2);    // <= 5
    histogram.observe({}, 7);    // <= 10
    histogram.observe({}, 15);   // > all buckets

    const prom = histogram.toPrometheus();
    // Bucket counts are cumulative
    assert.ok(prom.includes('test_histogram_bucket{le="1"} 1'));
    assert.ok(prom.includes('test_histogram_bucket{le="5"} 2'));
    assert.ok(prom.includes('test_histogram_bucket{le="10"} 3'));
    assert.ok(prom.includes('test_histogram_bucket{le="+Inf"} 4'));
  });

  test('should support labels', () => {
    const histogram = new Histogram('request_duration', 'Test', [0.1, 0.5, 1]);
    histogram.observe({ method: 'GET' }, 0.05);
    histogram.observe({ method: 'GET' }, 0.2);
    histogram.observe({ method: 'POST' }, 0.8);

    const prom = histogram.toPrometheus();
    assert.ok(prom.includes('method="GET"'));
    assert.ok(prom.includes('method="POST"'));
  });

  test('should export valid Prometheus format', () => {
    const histogram = new Histogram('http_duration_seconds', 'Duration', [0.1, 0.5, 1]);
    histogram.observe({}, 0.25);

    const prom = histogram.toPrometheus();
    assert.ok(prom.includes('# HELP http_duration_seconds Duration'));
    assert.ok(prom.includes('# TYPE http_duration_seconds histogram'));
    assert.ok(prom.includes('http_duration_seconds_bucket'));
    assert.ok(prom.includes('http_duration_seconds_sum'));
    assert.ok(prom.includes('http_duration_seconds_count'));
  });

});

// =============================================================================
// MetricsRegistry Tests
// =============================================================================

describe('MetricsRegistry', () => {

  test('should create new registry', () => {
    const registry = new MetricsRegistry();
    assert.ok(registry.metrics instanceof Map);
    assert.strictEqual(registry.metrics.size, 0);
  });

  test('should register counter', () => {
    const registry = new MetricsRegistry();
    const counter = registry.counter('test_counter', 'Test');

    assert.ok(counter instanceof Counter);
    assert.strictEqual(registry.metrics.size, 1);
  });

  test('should return existing counter if already registered', () => {
    const registry = new MetricsRegistry();
    const counter1 = registry.counter('test_counter', 'Test');
    const counter2 = registry.counter('test_counter', 'Test');

    assert.strictEqual(counter1, counter2);
    assert.strictEqual(registry.metrics.size, 1);
  });

  test('should register gauge', () => {
    const registry = new MetricsRegistry();
    const gauge = registry.gauge('test_gauge', 'Test');

    assert.ok(gauge instanceof Gauge);
    assert.strictEqual(registry.metrics.size, 1);
  });

  test('should return existing gauge if already registered', () => {
    const registry = new MetricsRegistry();
    const gauge1 = registry.gauge('test_gauge', 'Test');
    const gauge2 = registry.gauge('test_gauge', 'Test');

    assert.strictEqual(gauge1, gauge2);
  });

  test('should register histogram', () => {
    const registry = new MetricsRegistry();
    const histogram = registry.histogram('test_histogram', 'Test');

    assert.ok(histogram instanceof Histogram);
    assert.strictEqual(registry.metrics.size, 1);
  });

  test('should register multiple metric types', () => {
    const registry = new MetricsRegistry();
    registry.counter('counter1', 'Counter');
    registry.gauge('gauge1', 'Gauge');
    registry.histogram('histogram1', 'Histogram');

    assert.strictEqual(registry.metrics.size, 3);
  });

  test('should export all metrics to Prometheus format', () => {
    const registry = new MetricsRegistry();
    registry.counter('requests', 'Requests').inc({}, 100);
    registry.gauge('temperature', 'Temp').set({}, 72);

    const prom = registry.toPrometheus();
    assert.ok(prom.includes('# HELP requests'));
    assert.ok(prom.includes('# HELP temperature'));
    assert.ok(prom.includes('requests 100'));
    assert.ok(prom.includes('temperature 72'));
  });

  test('should export to JSON format', () => {
    const registry = new MetricsRegistry();
    registry.counter('requests', 'Requests').inc({ status: 'ok' }, 50);
    registry.gauge('memory', 'Memory').set({}, 1024);

    const json = registry.toJSON();
    assert.ok(json.requests);
    assert.strictEqual(json.requests.type, 'counter');
    assert.ok(json.memory);
    assert.strictEqual(json.memory.type, 'gauge');
  });

  test('should reset all metrics', () => {
    const registry = new MetricsRegistry();
    const counter = registry.counter('test', 'Test');
    const gauge = registry.gauge('gauge', 'Test');

    counter.inc({}, 100);
    gauge.set({}, 50);

    registry.reset();

    assert.strictEqual(counter.get({}), 0);
    assert.strictEqual(gauge.get({}), 0);
  });

});

// =============================================================================
// File Persistence Tests
// =============================================================================

describe('File Persistence', () => {

  beforeEach(() => {
    cleanTestMetricsDir();
  });

  afterEach(() => {
    cleanTestMetricsDir();
  });

  test('should save metrics to file', () => {
    const registry = new MetricsRegistry();
    registry.metricsDir = TEST_METRICS_DIR;
    registry.counter('test', 'Test').inc({}, 42);

    const filename = registry.save();

    assert.ok(fs.existsSync(filename));
    assert.ok(filename.includes('metrics-'));
    assert.ok(filename.endsWith('.json'));
  });

  test('should create metrics directory if not exists', () => {
    const registry = new MetricsRegistry();
    registry.metricsDir = TEST_METRICS_DIR;
    registry.counter('test', 'Test').inc({});

    registry.save();

    assert.ok(fs.existsSync(TEST_METRICS_DIR));
  });

  test('saved file should contain valid JSON', () => {
    const registry = new MetricsRegistry();
    registry.metricsDir = TEST_METRICS_DIR;
    registry.counter('requests', 'Test').inc({ status: 'ok' }, 100);

    const filename = registry.save();
    const content = fs.readFileSync(filename, 'utf-8');
    const parsed = JSON.parse(content);

    assert.ok(parsed.requests);
    assert.strictEqual(parsed.requests.type, 'counter');
  });

});

// =============================================================================
// Label Formatting Tests
// =============================================================================

describe('Label Formatting', () => {

  test('should handle multiple labels', () => {
    const counter = new Counter('test', 'Test');
    counter.inc({ method: 'GET', status: '200', region: 'us-east' });

    const prom = counter.toPrometheus();
    assert.ok(prom.includes('method="GET"'));
    assert.ok(prom.includes('status="200"'));
    assert.ok(prom.includes('region="us-east"'));
  });

  test('should handle special characters in label values', () => {
    const counter = new Counter('test', 'Test');
    counter.inc({ path: '/api/v1/users' });

    const prom = counter.toPrometheus();
    assert.ok(prom.includes('path="/api/v1/users"'));
  });

  test('should handle numeric label values', () => {
    const counter = new Counter('test', 'Test');
    counter.inc({ code: 404 });

    const prom = counter.toPrometheus();
    assert.ok(prom.includes('code="404"'));
  });

  test('should handle empty label object', () => {
    const counter = new Counter('test', 'Test');
    counter.inc({});

    const prom = counter.toPrometheus();
    // Should not have curly braces for empty labels
    assert.ok(prom.includes('test 1'));
    assert.ok(!prom.includes('test{}'));
  });

});

// =============================================================================
// Edge Cases Tests
// =============================================================================

describe('Edge Cases', () => {

  test('counter should handle zero increment', () => {
    const counter = new Counter('test', 'Test');
    counter.inc({}, 0);
    assert.strictEqual(counter.get({}), 0);
  });

  test('counter should handle negative increment', () => {
    // Note: This is technically invalid for counters but testing behavior
    const counter = new Counter('test', 'Test');
    counter.inc({}, -5);
    assert.strictEqual(counter.get({}), -5);
  });

  test('gauge should handle float values', () => {
    const gauge = new Gauge('test', 'Test');
    gauge.set({}, 3.14159);
    assert.strictEqual(gauge.get({}), 3.14159);
  });

  test('histogram should handle very small values', () => {
    const histogram = new Histogram('test', 'Test', [0.001, 0.01, 0.1]);
    histogram.observe({}, 0.0001);

    const prom = histogram.toPrometheus();
    assert.ok(prom.includes('test_sum 0.0001'));
  });

  test('histogram should handle very large values', () => {
    const histogram = new Histogram('test', 'Test', [1, 10, 100]);
    histogram.observe({}, 1000000);

    const prom = histogram.toPrometheus();
    assert.ok(prom.includes('test_sum 1000000'));
  });

  test('registry should handle metric name reuse with different types', () => {
    const registry = new MetricsRegistry();
    const counter = registry.counter('metric_name', 'Counter');
    // Getting same name returns existing metric regardless of requested type
    const sameMetric = registry.gauge('metric_name', 'Gauge');

    // It returns the original counter, not a new gauge
    assert.strictEqual(counter, sameMetric);
  });

});

// =============================================================================
// Integration Test
// =============================================================================

describe('Metrics Integration', () => {

  beforeEach(() => {
    cleanTestMetricsDir();
  });

  afterEach(() => {
    cleanTestMetricsDir();
  });

  test('full workflow: register, update, export, save', () => {
    const registry = new MetricsRegistry();
    registry.metricsDir = TEST_METRICS_DIR;

    // Register metrics
    const requests = registry.counter('http_requests', 'HTTP requests');
    const latency = registry.histogram('http_latency', 'Latency', [0.1, 0.5, 1]);
    const activeConns = registry.gauge('active_connections', 'Active connections');

    // Update metrics
    requests.inc({ method: 'GET', status: '200' }, 100);
    requests.inc({ method: 'POST', status: '201' }, 25);
    requests.inc({ method: 'GET', status: '500' }, 5);

    latency.observe({ endpoint: '/api' }, 0.05);
    latency.observe({ endpoint: '/api' }, 0.2);
    latency.observe({ endpoint: '/api' }, 0.8);

    activeConns.set({}, 42);

    // Export Prometheus
    const prom = registry.toPrometheus();
    assert.ok(prom.includes('http_requests'));
    assert.ok(prom.includes('http_latency'));
    assert.ok(prom.includes('active_connections'));

    // Export JSON
    const json = registry.toJSON();
    assert.ok(json.http_requests);
    assert.ok(json.http_latency);
    assert.ok(json.active_connections);

    // Save to file
    const filename = registry.save();
    assert.ok(fs.existsSync(filename));

    // Reset and verify
    registry.reset();
    assert.strictEqual(requests.get({ method: 'GET', status: '200' }), 0);
    assert.strictEqual(activeConns.get({}), 0);
  });

});
