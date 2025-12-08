/**
 * EAOS Error Handling Unit Tests
 *
 * Tests for core/errors.js covering:
 * - Custom error classes
 * - Error handling utilities
 * - Retry logic
 * - Result type
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

import {
  EAOSError,
  ConfigurationError,
  ValidationError,
  FileSystemError,
  TimeoutError,
  ComplianceError,
  ApprovalRequiredError,
  AggregateError,
  withErrorHandling,
  withRetry,
  withTimeout,
  withFallback,
  Ok,
  Err,
  ok,
  err,
  tryCatch,
  executeAll,
  executeAllParallel,
  formatError,
  isRetryable,
} from '../../core/errors.js';

// =============================================================================
// Custom Error Classes Tests
// =============================================================================

describe('EAOSError', () => {

  test('should create error with message and code', () => {
    const error = new EAOSError('Test error', 'TEST_CODE');
    assert.strictEqual(error.message, 'Test error');
    assert.strictEqual(error.code, 'TEST_CODE');
    assert.strictEqual(error.name, 'EAOSError');
  });

  test('should include timestamp', () => {
    const error = new EAOSError('Test', 'CODE');
    assert.ok(error.timestamp);
    assert.ok(Date.parse(error.timestamp));
  });

  test('should include details', () => {
    const error = new EAOSError('Test', 'CODE', { key: 'value' });
    assert.deepStrictEqual(error.details, { key: 'value' });
  });

  test('should serialize to JSON', () => {
    const error = new EAOSError('Test error', 'CODE', { detail: 1 });
    const json = error.toJSON();
    assert.strictEqual(json.name, 'EAOSError');
    assert.strictEqual(json.code, 'CODE');
    assert.strictEqual(json.message, 'Test error');
    assert.deepStrictEqual(json.details, { detail: 1 });
  });

  test('should be instanceof Error', () => {
    const error = new EAOSError('Test', 'CODE');
    assert.ok(error instanceof Error);
    assert.ok(error instanceof EAOSError);
  });

});

describe('ConfigurationError', () => {

  test('should have correct code', () => {
    const error = new ConfigurationError('Config missing');
    assert.strictEqual(error.code, 'EAOS_CONFIG_ERROR');
    assert.strictEqual(error.name, 'ConfigurationError');
  });

});

describe('ValidationError', () => {

  test('should have correct code', () => {
    const error = new ValidationError('Invalid input');
    assert.strictEqual(error.code, 'EAOS_VALIDATION_ERROR');
    assert.strictEqual(error.name, 'ValidationError');
  });

});

describe('FileSystemError', () => {

  test('should have correct code', () => {
    const error = new FileSystemError('File not found');
    assert.strictEqual(error.code, 'EAOS_FS_ERROR');
    assert.strictEqual(error.name, 'FileSystemError');
  });

});

describe('TimeoutError', () => {

  test('should have correct code', () => {
    const error = new TimeoutError('Operation timed out');
    assert.strictEqual(error.code, 'EAOS_TIMEOUT_ERROR');
    assert.strictEqual(error.name, 'TimeoutError');
  });

});

describe('ComplianceError', () => {

  test('should have correct code', () => {
    const error = new ComplianceError('Policy violation');
    assert.strictEqual(error.code, 'EAOS_COMPLIANCE_ERROR');
    assert.strictEqual(error.name, 'ComplianceError');
  });

});

describe('ApprovalRequiredError', () => {

  test('should include required level', () => {
    const error = new ApprovalRequiredError('Approval needed', 3);
    assert.strictEqual(error.code, 'EAOS_APPROVAL_REQUIRED');
    assert.strictEqual(error.requiredLevel, 3);
    assert.strictEqual(error.details.requiredLevel, 3);
  });

});

describe('AggregateError', () => {

  test('should collect multiple errors', () => {
    const errors = [
      new Error('Error 1'),
      new Error('Error 2'),
    ];
    const aggregate = new AggregateError(errors);
    assert.strictEqual(aggregate.errors.length, 2);
    assert.strictEqual(aggregate.details.count, 2);
  });

});

// =============================================================================
// Error Handling Utilities Tests
// =============================================================================

describe('withErrorHandling', () => {

  test('should return result on success', async () => {
    const fn = async () => 'success';
    const wrapped = withErrorHandling(fn);
    const result = await wrapped();
    assert.strictEqual(result, 'success');
  });

  test('should call onError callback', async () => {
    let capturedError = null;
    const fn = async () => { throw new Error('test'); };
    const wrapped = withErrorHandling(fn, {
      onError: (err) => { capturedError = err; },
      rethrow: false,
    });
    await wrapped();
    assert.ok(capturedError);
    assert.strictEqual(capturedError.message, 'test');
  });

  test('should return fallback value on error', async () => {
    const fn = async () => { throw new Error('test'); };
    const wrapped = withErrorHandling(fn, {
      fallback: 'fallback',
      rethrow: false,
    });
    const result = await wrapped();
    assert.strictEqual(result, 'fallback');
  });

  test('should call fallback function on error', async () => {
    const fn = async () => { throw new Error('test'); };
    const wrapped = withErrorHandling(fn, {
      fallback: (err) => `error: ${err.message}`,
      rethrow: false,
    });
    const result = await wrapped();
    assert.strictEqual(result, 'error: test');
  });

  test('should rethrow by default', async () => {
    const fn = async () => { throw new Error('test'); };
    const wrapped = withErrorHandling(fn);
    await assert.rejects(wrapped, /test/);
  });

});

describe('withRetry', () => {

  test('should return result on first success', async () => {
    const fn = async () => 'success';
    const result = await withRetry(fn);
    assert.strictEqual(result, 'success');
  });

  test('should retry on failure', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      if (attempts < 3) throw new Error('fail');
      return 'success';
    };
    const result = await withRetry(fn, { maxAttempts: 3, initialDelay: 10 });
    assert.strictEqual(result, 'success');
    assert.strictEqual(attempts, 3);
  });

  test('should throw after max attempts', async () => {
    const fn = async () => { throw new Error('always fails'); };
    await assert.rejects(
      withRetry(fn, { maxAttempts: 2, initialDelay: 10 }),
      /always fails/
    );
  });

  test('should call onRetry callback', async () => {
    let retryCount = 0;
    const fn = async (attempt) => {
      if (attempt < 3) throw new Error('fail');
      return 'success';
    };
    await withRetry(fn, {
      maxAttempts: 3,
      initialDelay: 10,
      onRetry: () => { retryCount++; },
    });
    assert.strictEqual(retryCount, 2);
  });

  test('should respect shouldRetry predicate', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      throw new ValidationError('no retry');
    };
    await assert.rejects(
      withRetry(fn, {
        maxAttempts: 5,
        initialDelay: 10,
        shouldRetry: (err) => !(err instanceof ValidationError),
      }),
      ValidationError
    );
    assert.strictEqual(attempts, 1);
  });

});

describe('withTimeout', () => {

  test('should return result if within timeout', async () => {
    const fn = async () => 'success';
    const result = await withTimeout(fn, 1000);
    assert.strictEqual(result, 'success');
  });

  test('should throw TimeoutError if exceeded', async () => {
    const fn = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return 'success';
    };
    await assert.rejects(
      withTimeout(fn, 10, 'Timed out'),
      TimeoutError
    );
  });

});

describe('withFallback', () => {

  test('should return primary result on success', async () => {
    const result = await withFallback(
      async () => 'primary',
      async () => 'fallback'
    );
    assert.strictEqual(result, 'primary');
  });

  test('should return fallback on primary failure', async () => {
    const result = await withFallback(
      async () => { throw new Error('fail'); },
      async () => 'fallback'
    );
    assert.strictEqual(result, 'fallback');
  });

  test('should call onFallback callback', async () => {
    let capturedError = null;
    await withFallback(
      async () => { throw new Error('fail'); },
      async () => 'fallback',
      { onFallback: (err) => { capturedError = err; } }
    );
    assert.ok(capturedError);
  });

});

// =============================================================================
// Result Type Tests
// =============================================================================

describe('Ok', () => {

  test('should wrap value', () => {
    const result = new Ok('value');
    assert.strictEqual(result.value, 'value');
    assert.ok(result.isOk);
    assert.ok(!result.isErr);
  });

  test('should map value', () => {
    const result = new Ok(5).map(x => x * 2);
    assert.strictEqual(result.value, 10);
  });

  test('should unwrap value', () => {
    assert.strictEqual(new Ok('value').unwrap(), 'value');
  });

  test('should return value from unwrapOr', () => {
    assert.strictEqual(new Ok('value').unwrapOr('default'), 'value');
  });

});

describe('Err', () => {

  test('should wrap error', () => {
    const error = new Error('test');
    const result = new Err(error);
    assert.strictEqual(result.error, error);
    assert.ok(!result.isOk);
    assert.ok(result.isErr);
  });

  test('should not map value', () => {
    const result = new Err(new Error('test')).map(x => x * 2);
    assert.ok(result.isErr);
  });

  test('should map error', () => {
    const result = new Err('original').mapErr(e => `wrapped: ${e}`);
    assert.strictEqual(result.error, 'wrapped: original');
  });

  test('should throw on unwrap', () => {
    assert.throws(() => new Err(new Error('test')).unwrap());
  });

  test('should return default from unwrapOr', () => {
    assert.strictEqual(new Err(new Error('test')).unwrapOr('default'), 'default');
  });

});

describe('ok and err helpers', () => {

  test('ok should create Ok', () => {
    const result = ok('value');
    assert.ok(result instanceof Ok);
  });

  test('err should create Err', () => {
    const result = err(new Error('test'));
    assert.ok(result instanceof Err);
  });

});

describe('tryCatch', () => {

  test('should return Ok on success', async () => {
    const result = await tryCatch(async () => 'success');
    assert.ok(result.isOk);
    assert.strictEqual(result.value, 'success');
  });

  test('should return Err on failure', async () => {
    const result = await tryCatch(async () => { throw new Error('fail'); });
    assert.ok(result.isErr);
    assert.strictEqual(result.error.message, 'fail');
  });

});

// =============================================================================
// Error Aggregation Tests
// =============================================================================

describe('executeAll', () => {

  test('should collect all results', async () => {
    const ops = [
      async () => 1,
      async () => 2,
      async () => 3,
    ];
    const { results, errors } = await executeAll(ops);
    assert.deepStrictEqual(results, [1, 2, 3]);
    assert.strictEqual(errors.length, 0);
  });

  test('should collect all errors', async () => {
    const ops = [
      async () => { throw new Error('1'); },
      async () => 2,
      async () => { throw new Error('3'); },
    ];
    const { results, errors } = await executeAll(ops);
    assert.deepStrictEqual(results, [2]);
    assert.strictEqual(errors.length, 2);
  });

});

describe('executeAllParallel', () => {

  test('should run operations in parallel', async () => {
    const ops = [
      async () => 1,
      async () => 2,
    ];
    const { results, errors } = await executeAllParallel(ops);
    assert.strictEqual(results.length, 2);
    assert.strictEqual(errors.length, 0);
  });

  test('should collect errors from parallel execution', async () => {
    const ops = [
      async () => { throw new Error('1'); },
      async () => 2,
    ];
    const { results, errors } = await executeAllParallel(ops);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(errors.length, 1);
  });

});

// =============================================================================
// Helper Functions Tests
// =============================================================================

describe('formatError', () => {

  test('should format EAOSError', () => {
    const error = new EAOSError('Test', 'CODE', { detail: 1 });
    const formatted = formatError(error);
    assert.strictEqual(formatted.name, 'EAOSError');
    assert.strictEqual(formatted.code, 'CODE');
    assert.strictEqual(formatted.message, 'Test');
  });

  test('should format regular Error', () => {
    const error = new Error('Test');
    const formatted = formatError(error);
    assert.strictEqual(formatted.name, 'Error');
    assert.strictEqual(formatted.message, 'Test');
    assert.ok(formatted.timestamp);
  });

});

describe('isRetryable', () => {

  test('should return true for TimeoutError', () => {
    assert.ok(isRetryable(new TimeoutError('timeout')));
  });

  test('should return false for ValidationError', () => {
    assert.ok(!isRetryable(new ValidationError('invalid')));
  });

  test('should return false for ConfigurationError', () => {
    assert.ok(!isRetryable(new ConfigurationError('config')));
  });

  test('should return true for network errors', () => {
    const error = new Error('network');
    error.code = 'ECONNRESET';
    assert.ok(isRetryable(error));
  });

  test('should return true for ETIMEDOUT', () => {
    const error = new Error('timeout');
    error.code = 'ETIMEDOUT';
    assert.ok(isRetryable(error));
  });

});
