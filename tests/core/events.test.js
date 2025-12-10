/**
 * EAOS Events Module Unit Tests
 *
 * Tests for core/events.js covering:
 * - EventBus pub/sub functionality
 * - Wildcard pattern matching
 * - Event history
 * - Lifecycle events
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

import {
  EventBus,
  AutonomyEvents,
  PluginEvents,
  createEventBus,
  getEventBus,
} from '../../core/events.js';

// =============================================================================
// EventBus Tests
// =============================================================================

describe('EventBus', () => {

  test('should create new instance', () => {
    const bus = new EventBus();
    assert.ok(bus);
    assert.ok(bus.listeners instanceof Map);
  });

  test('should subscribe to events', () => {
    const bus = new EventBus();
    const callback = () => {};
    const unsubscribe = bus.on('test', callback);
    assert.strictEqual(bus.listenerCount('test'), 1);
    assert.strictEqual(typeof unsubscribe, 'function');
  });

  test('should unsubscribe from events', () => {
    const bus = new EventBus();
    const callback = () => {};
    const unsubscribe = bus.on('test', callback);
    unsubscribe();
    assert.strictEqual(bus.listenerCount('test'), 0);
  });

  test('should emit events to listeners', async () => {
    const bus = new EventBus();
    let received = null;

    bus.on('test', (event) => {
      received = event;
    });

    await bus.emit('test', { value: 42 });

    assert.ok(received);
    assert.strictEqual(received.event, 'test');
    assert.strictEqual(received.data.value, 42);
  });

  test('should call multiple listeners', async () => {
    const bus = new EventBus();
    let count = 0;

    bus.on('test', () => { count++; });
    bus.on('test', () => { count++; });

    await bus.emit('test', {});

    assert.strictEqual(count, 2);
  });

  test('should handle once listeners', async () => {
    const bus = new EventBus();
    let count = 0;

    bus.once('test', () => { count++; });

    await bus.emit('test', {});
    await bus.emit('test', {});

    assert.strictEqual(count, 1);
  });

  test('should match wildcard patterns', () => {
    const bus = new EventBus();

    assert.ok(bus.matchesPattern('test:event', '*'));
    assert.ok(bus.matchesPattern('test:event', 'test:*'));
    assert.ok(bus.matchesPattern('test:event:nested', 'test:*:nested'));
    assert.ok(!bus.matchesPattern('other:event', 'test:*'));
  });

  test('should emit to wildcard subscribers', async () => {
    const bus = new EventBus();
    let received = null;

    bus.on('autonomy:*', (event) => {
      received = event;
    });

    await bus.emit('autonomy:cycle:start', { cycleId: '123' });

    assert.ok(received);
    assert.strictEqual(received.event, 'autonomy:cycle:start');
  });

  test('should throw on invalid callback', () => {
    const bus = new EventBus();
    assert.throws(() => bus.on('test', 'not a function'));
  });

  test('should store event history', async () => {
    const bus = new EventBus();

    await bus.emit('event1', { a: 1 });
    await bus.emit('event2', { b: 2 });

    const history = bus.getHistory();
    assert.strictEqual(history.length, 2);
    assert.strictEqual(history[0].event, 'event1');
    assert.strictEqual(history[1].event, 'event2');
  });

  test('should filter event history', async () => {
    const bus = new EventBus();

    await bus.emit('test:a', {});
    await bus.emit('other:b', {});
    await bus.emit('test:c', {});

    const filtered = bus.getHistory('test:*');
    assert.strictEqual(filtered.length, 2);
  });

  test('should limit history size', async () => {
    const bus = new EventBus();
    bus.maxHistory = 5;

    for (let i = 0; i < 10; i++) {
      await bus.emit(`event${i}`, {});
    }

    assert.strictEqual(bus.getHistory().length, 5);
  });

  test('should clear all listeners', () => {
    const bus = new EventBus();
    bus.on('a', () => {});
    bus.on('b', () => {});
    bus.once('c', () => {});

    bus.clear();

    assert.strictEqual(bus.listenerCount('a'), 0);
    assert.strictEqual(bus.listenerCount('b'), 0);
    assert.strictEqual(bus.listenerCount('c'), 0);
  });

  test('should handle errors in listeners gracefully', async () => {
    const bus = new EventBus();
    let secondCalled = false;

    bus.on('test', () => { throw new Error('fail'); });
    bus.on('test', () => { secondCalled = true; });

    await bus.emit('test', {});

    assert.ok(secondCalled, 'Second listener should still be called');
  });

  test('waitFor should resolve on event', async () => {
    const bus = new EventBus();

    const promise = bus.waitFor('test', 1000);
    setTimeout(() => bus.emit('test', { value: 'done' }), 10);

    const result = await promise;
    assert.strictEqual(result.data.value, 'done');
  });

  test('waitFor should timeout', async () => {
    const bus = new EventBus();

    await assert.rejects(
      bus.waitFor('never', 10),
      /Timeout waiting for event/
    );
  });

});

// =============================================================================
// Factory Functions Tests
// =============================================================================

describe('Factory Functions', () => {

  test('createEventBus should create new instance', () => {
    const bus1 = createEventBus();
    const bus2 = createEventBus();
    assert.notStrictEqual(bus1, bus2);
  });

  test('getEventBus should return singleton', () => {
    const bus1 = getEventBus();
    const bus2 = getEventBus();
    assert.strictEqual(bus1, bus2);
  });

});

// =============================================================================
// Event Constants Tests
// =============================================================================

describe('AutonomyEvents', () => {

  test('should have lifecycle events', () => {
    assert.ok(AutonomyEvents.ENGINE_START);
    assert.ok(AutonomyEvents.ENGINE_STOP);
    assert.ok(AutonomyEvents.ENGINE_PAUSE);
    assert.ok(AutonomyEvents.ENGINE_RESUME);
  });

  test('should have cycle events', () => {
    assert.ok(AutonomyEvents.CYCLE_START);
    assert.ok(AutonomyEvents.CYCLE_END);
    assert.ok(AutonomyEvents.CYCLE_ERROR);
  });

  test('should have trigger events', () => {
    assert.ok(AutonomyEvents.TRIGGER_FIRE);
    assert.ok(AutonomyEvents.TRIGGER_REGISTER);
  });

  test('should have approval events', () => {
    assert.ok(AutonomyEvents.APPROVAL_REQUIRED);
    assert.ok(AutonomyEvents.APPROVAL_GRANTED);
    assert.ok(AutonomyEvents.APPROVAL_DENIED);
  });

});

describe('PluginEvents', () => {

  test('should have lifecycle events', () => {
    assert.ok(PluginEvents.PLUGIN_LOAD);
    assert.ok(PluginEvents.PLUGIN_UNLOAD);
    assert.ok(PluginEvents.PLUGIN_ERROR);
    assert.ok(PluginEvents.PLUGIN_ENABLE);
    assert.ok(PluginEvents.PLUGIN_DISABLE);
  });

  test('should have hook events', () => {
    assert.ok(PluginEvents.BEFORE_CYCLE);
    assert.ok(PluginEvents.AFTER_CYCLE);
  });

});

// =============================================================================
// Integration Tests
// =============================================================================

describe('Event Integration', () => {

  test('should work with async event handlers', async () => {
    const bus = new EventBus();
    const results = [];

    bus.on('async', async (event) => {
      await new Promise(resolve => setTimeout(resolve, 5));
      results.push(event.data.value);
    });

    await bus.emit('async', { value: 'first' });
    await bus.emit('async', { value: 'second' });

    assert.deepStrictEqual(results, ['first', 'second']);
  });

  test('should include timestamp in events', async () => {
    const bus = new EventBus();
    let eventTimestamp = null;

    bus.on('test', (event) => {
      eventTimestamp = event.timestamp;
    });

    await bus.emit('test', {});

    assert.ok(eventTimestamp);
    assert.ok(Date.parse(eventTimestamp));
  });

});
