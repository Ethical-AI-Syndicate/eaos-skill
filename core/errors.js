/**
 * EAOS Error Handling Module
 *
 * Provides consistent error handling, retry logic, and graceful degradation
 * for resilient operation across the EAOS system.
 */

// =============================================================================
// Custom Error Classes
// =============================================================================

/**
 * Base error class for EAOS-specific errors
 */
export class EAOSError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'EAOSError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

/**
 * Configuration error (invalid settings, missing config)
 */
export class ConfigurationError extends EAOSError {
  constructor(message, details = {}) {
    super(message, 'EAOS_CONFIG_ERROR', details);
    this.name = 'ConfigurationError';
  }
}

/**
 * Validation error (invalid input, schema violation)
 */
export class ValidationError extends EAOSError {
  constructor(message, details = {}) {
    super(message, 'EAOS_VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * File system error (read/write failures)
 */
export class FileSystemError extends EAOSError {
  constructor(message, details = {}) {
    super(message, 'EAOS_FS_ERROR', details);
    this.name = 'FileSystemError';
  }
}

/**
 * Operation timeout error
 */
export class TimeoutError extends EAOSError {
  constructor(message, details = {}) {
    super(message, 'EAOS_TIMEOUT_ERROR', details);
    this.name = 'TimeoutError';
  }
}

/**
 * Compliance error (policy violation, audit failure)
 */
export class ComplianceError extends EAOSError {
  constructor(message, details = {}) {
    super(message, 'EAOS_COMPLIANCE_ERROR', details);
    this.name = 'ComplianceError';
  }
}

/**
 * Approval required error (HDM level not met)
 */
export class ApprovalRequiredError extends EAOSError {
  constructor(message, requiredLevel, details = {}) {
    super(message, 'EAOS_APPROVAL_REQUIRED', { ...details, requiredLevel });
    this.name = 'ApprovalRequiredError';
    this.requiredLevel = requiredLevel;
  }
}

// =============================================================================
// Error Handling Utilities
// =============================================================================

/**
 * Wrap async function with error handling
 * @param {Function} fn - Async function to wrap
 * @param {Object} options - Error handling options
 * @returns {Function} Wrapped function
 */
export function withErrorHandling(fn, options = {}) {
  const {
    onError = null,
    fallback = null,
    rethrow = true
  } = options;

  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (onError) {
        await onError(error, args);
      }

      if (fallback !== null) {
        return typeof fallback === 'function' ? fallback(error) : fallback;
      }

      if (rethrow) {
        throw error;
      }

      return null;
    }
  };
}

/**
 * Retry an async operation with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} Result of the function
 */
export async function withRetry(fn, options = {}) {
  const {
    maxAttempts = 3,
    initialDelay = 100,
    maxDelay = 5000,
    factor = 2,
    shouldRetry = () => true,
    onRetry = null
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;

      if (attempt >= maxAttempts || !shouldRetry(error, attempt)) {
        throw error;
      }

      if (onRetry) {
        await onRetry(error, attempt, delay);
      }

      await sleep(delay);
      delay = Math.min(delay * factor, maxDelay);
    }
  }

  throw lastError;
}

/**
 * Execute with timeout
 * @param {Function} fn - Async function to execute
 * @param {number} timeout - Timeout in milliseconds
 * @param {string} message - Timeout error message
 * @returns {Promise} Result of the function
 */
export async function withTimeout(fn, timeout, message = 'Operation timed out') {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new TimeoutError(message, { timeout })), timeout);
  });

  return Promise.race([fn(), timeoutPromise]);
}

/**
 * Execute with graceful degradation
 * @param {Function} primary - Primary function to try
 * @param {Function} fallback - Fallback function if primary fails
 * @param {Object} options - Options
 * @returns {Promise} Result from primary or fallback
 */
export async function withFallback(primary, fallback, options = {}) {
  const { onFallback = null } = options;

  try {
    return await primary();
  } catch (error) {
    if (onFallback) {
      await onFallback(error);
    }
    return fallback();
  }
}

// =============================================================================
// Result Type (for functional error handling)
// =============================================================================

/**
 * Success result wrapper
 */
export class Ok {
  constructor(value) {
    this.value = value;
    this.isOk = true;
    this.isErr = false;
  }

  map(fn) {
    return new Ok(fn(this.value));
  }

  mapErr() {
    return this;
  }

  unwrap() {
    return this.value;
  }

  unwrapOr() {
    return this.value;
  }
}

/**
 * Error result wrapper
 */
export class Err {
  constructor(error) {
    this.error = error;
    this.isOk = false;
    this.isErr = true;
  }

  map() {
    return this;
  }

  mapErr(fn) {
    return new Err(fn(this.error));
  }

  unwrap() {
    throw this.error;
  }

  unwrapOr(defaultValue) {
    return defaultValue;
  }
}

/**
 * Create Ok result
 */
export function ok(value) {
  return new Ok(value);
}

/**
 * Create Err result
 */
export function err(error) {
  return new Err(error);
}

/**
 * Try executing a function and return Result
 * @param {Function} fn - Function to execute
 * @returns {Ok|Err} Result wrapper
 */
export async function tryCatch(fn) {
  try {
    const result = await fn();
    return ok(result);
  } catch (error) {
    return err(error);
  }
}

// =============================================================================
// Error Aggregation
// =============================================================================

/**
 * Collect multiple errors into one
 */
export class AggregateError extends EAOSError {
  constructor(errors, message = 'Multiple errors occurred') {
    super(message, 'EAOS_AGGREGATE_ERROR', { count: errors.length });
    this.name = 'AggregateError';
    this.errors = errors;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      errors: this.errors.map(e => e.toJSON?.() || { message: e.message })
    };
  }
}

/**
 * Execute multiple operations and collect all errors
 * @param {Function[]} operations - Array of async functions
 * @returns {Promise<{results: any[], errors: Error[]}>}
 */
export async function executeAll(operations) {
  const results = [];
  const errors = [];

  for (const op of operations) {
    try {
      results.push(await op());
    } catch (error) {
      errors.push(error);
    }
  }

  return { results, errors };
}

/**
 * Execute operations in parallel and collect all errors
 * @param {Function[]} operations - Array of async functions
 * @returns {Promise<{results: any[], errors: Error[]}>}
 */
export async function executeAllParallel(operations) {
  const settled = await Promise.allSettled(operations.map(op => op()));

  const results = [];
  const errors = [];

  for (const result of settled) {
    if (result.status === 'fulfilled') {
      results.push(result.value);
    } else {
      errors.push(result.reason);
    }
  }

  return { results, errors };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format error for logging
 * @param {Error} error - Error to format
 * @returns {Object} Formatted error object
 */
export function formatError(error) {
  if (error instanceof EAOSError) {
    return error.toJSON();
  }

  return {
    name: error.name || 'Error',
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  };
}

/**
 * Check if error is retryable
 * @param {Error} error - Error to check
 * @returns {boolean} True if error is retryable
 */
export function isRetryable(error) {
  // Timeout errors are retryable
  if (error instanceof TimeoutError) {
    return true;
  }

  // Network errors are retryable
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // File system busy errors are retryable
  if (error.code === 'EBUSY' || error.code === 'EAGAIN') {
    return true;
  }

  // Validation and configuration errors are not retryable
  if (error instanceof ValidationError || error instanceof ConfigurationError) {
    return false;
  }

  return false;
}

// =============================================================================
// Export all
// =============================================================================

export default {
  // Error classes
  EAOSError,
  ConfigurationError,
  ValidationError,
  FileSystemError,
  TimeoutError,
  ComplianceError,
  ApprovalRequiredError,
  AggregateError,
  // Utilities
  withErrorHandling,
  withRetry,
  withTimeout,
  withFallback,
  // Result type
  Ok,
  Err,
  ok,
  err,
  tryCatch,
  // Aggregation
  executeAll,
  executeAllParallel,
  // Helpers
  formatError,
  isRetryable
};
