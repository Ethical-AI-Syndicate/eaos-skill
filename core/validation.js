/**
 * EAOS Input Validation Module
 *
 * Provides secure input validation and sanitization utilities
 * to prevent injection attacks and ensure data integrity.
 */

import path from 'path';

// =============================================================================
// Constants
// =============================================================================

const MAX_STRING_LENGTH = 10000;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_SCENARIO_LENGTH = 500;

// Dangerous patterns that could indicate injection attempts
// eslint-disable-next-line no-control-regex
const NULL_BYTE_PATTERN = /\x00/g;

const DANGEROUS_PATTERNS = [
  /[<>]/g,                    // HTML/XML injection
  /\$\{[^}]+\}/g,             // Template literal injection
  /`[^`]*`/g,                 // Backtick execution
  NULL_BYTE_PATTERN,          // Null byte injection
  /[\r\n]+/g                 // Newline injection (for headers/logs)
];

// Characters allowed in identifiers (IDs, slugs)
const IDENTIFIER_PATTERN = /^[a-zA-Z0-9_-]+$/;

// Characters allowed in paths (relative to allowed base)
const SAFE_PATH_CHARS = /^[a-zA-Z0-9_\-./]+$/;

// =============================================================================
// Sanitization Functions
// =============================================================================

/**
 * Sanitize a string for safe display/logging
 * @param {string} input - Raw user input
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized string
 */
export function sanitizeString(input, options = {}) {
  if (typeof input !== 'string') {
    return '';
  }

  const maxLength = options.maxLength || MAX_STRING_LENGTH;
  let result = input.slice(0, maxLength);

  // Remove dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    result = result.replace(pattern, '');
  }

  // Trim whitespace
  result = result.trim();

  return result;
}

/**
 * Sanitize a title string
 * @param {string} input - Raw title input
 * @returns {string} Sanitized title
 */
export function sanitizeTitle(input) {
  return sanitizeString(input, { maxLength: MAX_TITLE_LENGTH });
}

/**
 * Sanitize a description string
 * @param {string} input - Raw description input
 * @returns {string} Sanitized description
 */
export function sanitizeDescription(input) {
  return sanitizeString(input, { maxLength: MAX_DESCRIPTION_LENGTH });
}

/**
 * Sanitize a scenario name
 * @param {string} input - Raw scenario input
 * @returns {string} Sanitized scenario
 */
export function sanitizeScenario(input) {
  return sanitizeString(input, { maxLength: MAX_SCENARIO_LENGTH });
}

// =============================================================================
// Validation Functions
// =============================================================================

/**
 * Validate that a string is a safe identifier
 * @param {string} input - Input to validate
 * @returns {boolean} True if valid identifier
 */
export function isValidIdentifier(input) {
  if (typeof input !== 'string' || input.length === 0 || input.length > 100) {
    return false;
  }
  return IDENTIFIER_PATTERN.test(input);
}

/**
 * Validate a file path is within allowed directory
 * @param {string} filePath - Path to validate
 * @param {string} allowedBase - Allowed base directory
 * @returns {boolean} True if path is safe
 */
export function isPathWithinBase(filePath, allowedBase) {
  if (typeof filePath !== 'string' || typeof allowedBase !== 'string') {
    return false;
  }

  // Resolve to absolute paths
  const resolvedPath = path.resolve(filePath);
  const resolvedBase = path.resolve(allowedBase);

  // Check if resolved path starts with base
  // Add trailing separator to prevent prefix attacks (e.g., /base vs /base-evil)
  const normalizedBase = resolvedBase.endsWith(path.sep)
    ? resolvedBase
    : resolvedBase + path.sep;

  return resolvedPath === resolvedBase || resolvedPath.startsWith(normalizedBase);
}

/**
 * Validate a relative path has no traversal
 * @param {string} relativePath - Relative path to validate
 * @returns {boolean} True if path is safe
 */
export function isPathSafe(relativePath) {
  if (typeof relativePath !== 'string') {
    return false;
  }

  // Check for path traversal attempts
  if (relativePath.includes('..') || relativePath.includes('\0')) {
    return false;
  }

  // Check for absolute path attempts
  if (path.isAbsolute(relativePath)) {
    return false;
  }

  // Check for safe characters only
  return SAFE_PATH_CHARS.test(relativePath);
}

/**
 * Validate an enum value is in allowed list
 * @param {string} value - Value to validate
 * @param {string[]} allowedValues - List of allowed values
 * @returns {boolean} True if value is allowed
 */
export function isValidEnum(value, allowedValues) {
  if (!Array.isArray(allowedValues)) {
    return false;
  }
  return allowedValues.includes(value);
}

/**
 * Validate a priority value
 * @param {string} priority - Priority to validate (P0-P4)
 * @returns {boolean} True if valid priority
 */
export function isValidPriority(priority) {
  return isValidEnum(priority, ['P0', 'P1', 'P2', 'P3', 'P4']);
}

/**
 * Validate a status value
 * @param {string} status - Status to validate
 * @returns {boolean} True if valid status
 */
export function isValidStatus(status) {
  return isValidEnum(status, ['open', 'in_progress', 'blocked', 'done', 'cancelled']);
}

/**
 * Validate a category value
 * @param {string} category - Category to validate
 * @returns {boolean} True if valid category
 */
export function isValidCategory(category) {
  return isValidEnum(category, ['feat', 'fix', 'docs', 'refactor', 'test', 'chore', 'security']);
}

// =============================================================================
// Assertion Functions (throw on invalid)
// =============================================================================

/**
 * Assert that input is a non-empty string
 * @param {*} input - Value to check
 * @param {string} name - Name for error message
 * @throws {Error} If input is not a non-empty string
 */
export function assertString(input, name = 'value') {
  if (typeof input !== 'string' || input.trim().length === 0) {
    throw new Error(`${name} must be a non-empty string`);
  }
}

/**
 * Assert that input is a valid identifier
 * @param {*} input - Value to check
 * @param {string} name - Name for error message
 * @throws {Error} If input is not a valid identifier
 */
export function assertIdentifier(input, name = 'identifier') {
  if (!isValidIdentifier(input)) {
    throw new Error(`${name} must be alphanumeric with underscores/hyphens only`);
  }
}

/**
 * Assert that path is within allowed base
 * @param {string} filePath - Path to check
 * @param {string} allowedBase - Allowed base directory
 * @throws {Error} If path is outside allowed base
 */
export function assertPathWithinBase(filePath, allowedBase) {
  if (!isPathWithinBase(filePath, allowedBase)) {
    throw new Error('Path traversal attempt detected');
  }
}

// =============================================================================
// Export all validators
// =============================================================================

export default {
  // Sanitization
  sanitizeString,
  sanitizeTitle,
  sanitizeDescription,
  sanitizeScenario,
  // Validation
  isValidIdentifier,
  isPathWithinBase,
  isPathSafe,
  isValidEnum,
  isValidPriority,
  isValidStatus,
  isValidCategory,
  // Assertions
  assertString,
  assertIdentifier,
  assertPathWithinBase
};
