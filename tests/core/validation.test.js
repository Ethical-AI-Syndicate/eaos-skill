/**
 * EAOS Validation Unit Tests
 *
 * Tests for core/validation.js covering:
 * - String sanitization
 * - Path validation
 * - Enum validation
 * - Assertion functions
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '../..');

import {
  sanitizeString,
  sanitizeTitle,
  sanitizeDescription,
  sanitizeScenario,
  isValidIdentifier,
  isPathWithinBase,
  isPathSafe,
  isValidEnum,
  isValidPriority,
  isValidStatus,
  isValidCategory,
  assertString,
  assertIdentifier,
  assertPathWithinBase,
} from '../../core/validation.js';

// =============================================================================
// String Sanitization Tests
// =============================================================================

describe('sanitizeString', () => {

  test('should return empty string for non-string input', () => {
    assert.strictEqual(sanitizeString(null), '');
    assert.strictEqual(sanitizeString(undefined), '');
    assert.strictEqual(sanitizeString(123), '');
    assert.strictEqual(sanitizeString({}), '');
  });

  test('should trim whitespace', () => {
    assert.strictEqual(sanitizeString('  hello  '), 'hello');
    assert.strictEqual(sanitizeString('\thello\n'), 'hello');
  });

  test('should remove HTML/XML angle brackets', () => {
    // Removes < and > characters to prevent HTML injection
    const result = sanitizeString('hello<script>alert(1)</script>world');
    assert.ok(!result.includes('<'));
    assert.ok(!result.includes('>'));
  });

  test('should remove template literal injection', () => {
    // Removes ${...} patterns to prevent template injection
    const result = sanitizeString('hello ${process.env.SECRET} world');
    assert.ok(!result.includes('${'));
    assert.ok(!result.includes('}'));
  });

  test('should remove null bytes', () => {
    assert.strictEqual(sanitizeString('hello\x00world'), 'helloworld');
  });

  test('should remove newlines', () => {
    const input = 'line1\nline2\rline3';
    const result = sanitizeString(input);
    assert.ok(!result.includes('\n'));
    assert.ok(!result.includes('\r'));
  });

  test('should truncate to max length', () => {
    const longString = 'a'.repeat(20000);
    const result = sanitizeString(longString);
    assert.strictEqual(result.length, 10000);
  });

  test('should respect custom max length', () => {
    const result = sanitizeString('hello world', { maxLength: 5 });
    assert.strictEqual(result, 'hello');
  });

  test('should preserve safe content', () => {
    assert.strictEqual(sanitizeString('Hello World 123!'), 'Hello World 123!');
    assert.strictEqual(sanitizeString('user@example.com'), 'user@example.com');
  });

});

describe('sanitizeTitle', () => {

  test('should limit to 200 characters', () => {
    const longTitle = 'a'.repeat(300);
    const result = sanitizeTitle(longTitle);
    assert.ok(result.length <= 200);
  });

  test('should sanitize dangerous content', () => {
    const result = sanitizeTitle('<script>bad</script>');
    assert.ok(!result.includes('<'));
    assert.ok(!result.includes('>'));
  });

});

describe('sanitizeDescription', () => {

  test('should limit to 2000 characters', () => {
    const longDesc = 'a'.repeat(3000);
    const result = sanitizeDescription(longDesc);
    assert.ok(result.length <= 2000);
  });

});

describe('sanitizeScenario', () => {

  test('should limit to 500 characters', () => {
    const longScenario = 'a'.repeat(700);
    const result = sanitizeScenario(longScenario);
    assert.ok(result.length <= 500);
  });

});

// =============================================================================
// Identifier Validation Tests
// =============================================================================

describe('isValidIdentifier', () => {

  test('should accept valid identifiers', () => {
    assert.ok(isValidIdentifier('valid'));
    assert.ok(isValidIdentifier('valid_id'));
    assert.ok(isValidIdentifier('valid-id'));
    assert.ok(isValidIdentifier('valid123'));
    assert.ok(isValidIdentifier('VALID_ID'));
  });

  test('should reject empty strings', () => {
    assert.ok(!isValidIdentifier(''));
  });

  test('should reject non-strings', () => {
    assert.ok(!isValidIdentifier(null));
    assert.ok(!isValidIdentifier(undefined));
    assert.ok(!isValidIdentifier(123));
  });

  test('should reject strings with spaces', () => {
    assert.ok(!isValidIdentifier('invalid id'));
  });

  test('should reject strings with special characters', () => {
    assert.ok(!isValidIdentifier('invalid@id'));
    assert.ok(!isValidIdentifier('invalid.id'));
    assert.ok(!isValidIdentifier('invalid/id'));
    assert.ok(!isValidIdentifier('../traversal'));
  });

  test('should reject very long identifiers', () => {
    assert.ok(!isValidIdentifier('a'.repeat(150)));
  });

});

// =============================================================================
// Path Validation Tests
// =============================================================================

describe('isPathWithinBase', () => {

  test('should allow paths within base directory', () => {
    const base = '/home/user/project';
    assert.ok(isPathWithinBase('/home/user/project/file.txt', base));
    assert.ok(isPathWithinBase('/home/user/project/sub/file.txt', base));
    assert.ok(isPathWithinBase('/home/user/project', base));
  });

  test('should reject path traversal attempts', () => {
    const base = '/home/user/project';
    assert.ok(!isPathWithinBase('/home/user/project/../other', base));
    assert.ok(!isPathWithinBase('/home/user/other', base));
    assert.ok(!isPathWithinBase('/etc/passwd', base));
  });

  test('should reject prefix attacks', () => {
    const base = '/home/user/project';
    assert.ok(!isPathWithinBase('/home/user/project-evil/file.txt', base));
  });

  test('should handle non-string inputs', () => {
    assert.ok(!isPathWithinBase(null, '/base'));
    assert.ok(!isPathWithinBase('/path', null));
    assert.ok(!isPathWithinBase(123, '/base'));
  });

});

describe('isPathSafe', () => {

  test('should accept safe relative paths', () => {
    assert.ok(isPathSafe('file.txt'));
    assert.ok(isPathSafe('subdir/file.txt'));
    assert.ok(isPathSafe('a/b/c/file.txt'));
    assert.ok(isPathSafe('file-name_123.json'));
  });

  test('should reject path traversal', () => {
    assert.ok(!isPathSafe('../file.txt'));
    assert.ok(!isPathSafe('subdir/../file.txt'));
    assert.ok(!isPathSafe('..'));
  });

  test('should reject absolute paths', () => {
    assert.ok(!isPathSafe('/etc/passwd'));
    assert.ok(!isPathSafe('/home/user/file.txt'));
  });

  test('should reject null byte injection', () => {
    assert.ok(!isPathSafe('file.txt\x00.jpg'));
  });

  test('should reject unsafe characters', () => {
    assert.ok(!isPathSafe('file;rm -rf.txt'));
    assert.ok(!isPathSafe('file|cat.txt'));
    assert.ok(!isPathSafe('file$var.txt'));
  });

  test('should handle non-string inputs', () => {
    assert.ok(!isPathSafe(null));
    assert.ok(!isPathSafe(undefined));
    assert.ok(!isPathSafe(123));
  });

});

// =============================================================================
// Enum Validation Tests
// =============================================================================

describe('isValidEnum', () => {

  test('should accept values in allowed list', () => {
    assert.ok(isValidEnum('a', ['a', 'b', 'c']));
    assert.ok(isValidEnum('high', ['low', 'medium', 'high']));
  });

  test('should reject values not in list', () => {
    assert.ok(!isValidEnum('d', ['a', 'b', 'c']));
    assert.ok(!isValidEnum('invalid', ['low', 'medium', 'high']));
  });

  test('should handle invalid allowed list', () => {
    assert.ok(!isValidEnum('value', null));
    assert.ok(!isValidEnum('value', 'not-array'));
  });

});

describe('isValidPriority', () => {

  test('should accept valid priorities', () => {
    assert.ok(isValidPriority('P0'));
    assert.ok(isValidPriority('P1'));
    assert.ok(isValidPriority('P2'));
    assert.ok(isValidPriority('P3'));
    assert.ok(isValidPriority('P4'));
  });

  test('should reject invalid priorities', () => {
    assert.ok(!isValidPriority('P5'));
    assert.ok(!isValidPriority('high'));
    assert.ok(!isValidPriority(''));
    assert.ok(!isValidPriority(1));
  });

});

describe('isValidStatus', () => {

  test('should accept valid statuses', () => {
    assert.ok(isValidStatus('open'));
    assert.ok(isValidStatus('in_progress'));
    assert.ok(isValidStatus('blocked'));
    assert.ok(isValidStatus('done'));
    assert.ok(isValidStatus('cancelled'));
  });

  test('should reject invalid statuses', () => {
    assert.ok(!isValidStatus('invalid'));
    assert.ok(!isValidStatus('OPEN'));
    assert.ok(!isValidStatus(''));
  });

});

describe('isValidCategory', () => {

  test('should accept valid categories', () => {
    assert.ok(isValidCategory('feat'));
    assert.ok(isValidCategory('fix'));
    assert.ok(isValidCategory('docs'));
    assert.ok(isValidCategory('refactor'));
    assert.ok(isValidCategory('test'));
    assert.ok(isValidCategory('chore'));
    assert.ok(isValidCategory('security'));
  });

  test('should reject invalid categories', () => {
    assert.ok(!isValidCategory('feature'));
    assert.ok(!isValidCategory('bug'));
    assert.ok(!isValidCategory(''));
  });

});

// =============================================================================
// Assertion Tests
// =============================================================================

describe('assertString', () => {

  test('should not throw for valid strings', () => {
    assert.doesNotThrow(() => assertString('valid'));
    assert.doesNotThrow(() => assertString('hello world'));
  });

  test('should throw for non-strings', () => {
    assert.throws(() => assertString(null), /must be a non-empty string/);
    assert.throws(() => assertString(undefined), /must be a non-empty string/);
    assert.throws(() => assertString(123), /must be a non-empty string/);
  });

  test('should throw for empty strings', () => {
    assert.throws(() => assertString(''), /must be a non-empty string/);
    assert.throws(() => assertString('   '), /must be a non-empty string/);
  });

  test('should include name in error message', () => {
    assert.throws(() => assertString(null, 'title'), /title must be a non-empty string/);
  });

});

describe('assertIdentifier', () => {

  test('should not throw for valid identifiers', () => {
    assert.doesNotThrow(() => assertIdentifier('valid_id'));
    assert.doesNotThrow(() => assertIdentifier('valid-id'));
  });

  test('should throw for invalid identifiers', () => {
    assert.throws(() => assertIdentifier('invalid id'), /alphanumeric/);
    assert.throws(() => assertIdentifier('../path'), /alphanumeric/);
  });

});

describe('assertPathWithinBase', () => {

  test('should not throw for paths within base', () => {
    assert.doesNotThrow(() => {
      assertPathWithinBase(path.join(ROOT_DIR, 'file.txt'), ROOT_DIR);
    });
  });

  test('should throw for paths outside base', () => {
    assert.throws(() => {
      assertPathWithinBase('/etc/passwd', ROOT_DIR);
    }, /Path traversal/);
  });

});

// =============================================================================
// Security Edge Cases
// =============================================================================

describe('Security Edge Cases', () => {

  test('should handle Unicode normalization attacks', () => {
    // These should not cause crashes or unexpected behavior
    const unicodeInput = 'hello\u202Eworld'; // Right-to-left override
    const result = sanitizeString(unicodeInput);
    assert.ok(typeof result === 'string');
  });

  test('should handle very long inputs gracefully', () => {
    const hugeInput = 'x'.repeat(100000);
    const result = sanitizeString(hugeInput);
    assert.ok(result.length <= 10000);
  });

  test('should handle mixed injection attempts', () => {
    const mixedAttack = '<script>${process.exit()}\x00evil</script>';
    const result = sanitizeString(mixedAttack);
    assert.ok(!result.includes('<'));
    assert.ok(!result.includes('${'));
    assert.ok(!result.includes('\x00'));
  });

});
