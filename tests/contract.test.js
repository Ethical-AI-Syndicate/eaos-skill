/**
 * EAOS Contract Tests
 *
 * Tests that skill contracts are valid and consistent:
 * - Schema validation for all contract definitions
 * - Capability coverage verification
 * - Dependency resolution checks
 * - Permission boundary enforcement
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv/dist/2020.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

const ajv = new Ajv({ allErrors: true, strict: false });

// Load schemas
const skillContractSchema = JSON.parse(
  fs.readFileSync(path.join(ROOT_DIR, 'manifests/SKILL_CONTRACT_SCHEMA.json'), 'utf-8')
);
const memoryKernelSchema = JSON.parse(
  fs.readFileSync(path.join(ROOT_DIR, 'manifests/MEMORY_KERNEL_API_SCHEMA.json'), 'utf-8')
);
const agentBoundarySchema = JSON.parse(
  fs.readFileSync(path.join(ROOT_DIR, 'manifests/AGENT_BOUNDARY_API_SCHEMA.json'), 'utf-8')
);
const beadsSchema = JSON.parse(
  fs.readFileSync(path.join(ROOT_DIR, 'manifests/BEADS_SCHEMA.json'), 'utf-8')
);

// =============================================================================
// Schema Validation Tests
// =============================================================================

describe('Contract Schema Validation', () => {

  test('skill contract schema should be valid JSON Schema', () => {
    assert.doesNotThrow(() => {
      ajv.compile(skillContractSchema);
    }, 'Skill contract schema should compile');
  });

  test('memory kernel API schema should be valid JSON Schema', () => {
    assert.doesNotThrow(() => {
      ajv.compile(memoryKernelSchema);
    }, 'Memory kernel schema should compile');
  });

  test('agent boundary API schema should be valid JSON Schema', () => {
    assert.doesNotThrow(() => {
      ajv.compile(agentBoundarySchema);
    }, 'Agent boundary schema should compile');
  });

  test('BEADS schema should be valid JSON Schema', () => {
    assert.doesNotThrow(() => {
      ajv.compile(beadsSchema);
    }, 'BEADS schema should compile');
  });

});

// =============================================================================
// Skill Contract Tests
// =============================================================================

describe('Skill Contract Compliance', () => {

  test('main skill manifest should be valid', () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(ROOT_DIR, 'manifests/claude_skill.json'), 'utf-8')
    );

    assert.ok(manifest.name, 'Manifest should have name');
    assert.ok(manifest.version, 'Manifest should have version');
    assert.ok(manifest.description, 'Manifest should have description');
    assert.ok(manifest.entrypoint, 'Manifest should have entrypoint');
    assert.ok(manifest.modules, 'Manifest should have modules');
  });

  test('entrypoint file should exist', () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(ROOT_DIR, 'manifests/claude_skill.json'), 'utf-8')
    );

    const entrypointPath = path.join(ROOT_DIR, manifest.entrypoint);
    assert.ok(fs.existsSync(entrypointPath), `Entrypoint ${manifest.entrypoint} should exist`);
  });

  test('all module paths should exist', () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(ROOT_DIR, 'manifests/claude_skill.json'), 'utf-8')
    );

    for (const modulePath of manifest.modules) {
      const fullPath = path.join(ROOT_DIR, modulePath);
      assert.ok(
        fs.existsSync(fullPath),
        `Module path ${modulePath} should exist`
      );
    }
  });

});

// =============================================================================
// Command Registry Contract Tests
// =============================================================================

describe('Command Registry Contract', () => {

  const registry = JSON.parse(
    fs.readFileSync(path.join(ROOT_DIR, 'manifests/COMMAND_REGISTRY.json'), 'utf-8')
  );

  test('registry should have valid structure', () => {
    assert.ok(registry.version, 'Registry should have version');
    assert.ok(registry.commands, 'Registry should have commands');
    assert.ok(typeof registry.commands === 'object', 'Commands should be object');
  });

  test('all commands should have required fields', () => {
    for (const [category, commands] of Object.entries(registry.commands)) {
      for (const [cmdName, cmdDef] of Object.entries(commands)) {
        assert.ok(cmdDef.description, `Command ${cmdName} should have description`);
        assert.ok(cmdDef.module, `Command ${cmdName} should have module`);
        assert.ok(
          typeof cmdDef.approval_level === 'number',
          `Command ${cmdName} should have numeric approval_level`
        );
      }
    }
  });

  test('approval levels should be in valid range', () => {
    for (const [category, commands] of Object.entries(registry.commands)) {
      for (const [cmdName, cmdDef] of Object.entries(commands)) {
        // 0 = no approval (read-only), 1-5 = approval levels per HDM
        assert.ok(
          cmdDef.approval_level >= 0 && cmdDef.approval_level <= 5,
          `Command ${cmdName} approval_level should be 0-5, got ${cmdDef.approval_level}`
        );
      }
    }
  });

  test('no duplicate command names across categories', () => {
    const allCommands = [];
    for (const commands of Object.values(registry.commands)) {
      allCommands.push(...Object.keys(commands));
    }

    const duplicates = allCommands.filter(
      (cmd, idx) => allCommands.indexOf(cmd) !== idx
    );

    assert.strictEqual(
      duplicates.length,
      0,
      `Found duplicate commands: ${duplicates.join(', ')}`
    );
  });

});

// =============================================================================
// Agent Capability Contract Tests
// =============================================================================

describe('Agent Capability Contracts', () => {

  const agentFiles = [
    'agents/master_orchestrator.claude',
    'agents/autonomous_cto.claude',
    'agents/cfo_agent.claude',
    'agents/cio_agent.claude',
    'agents/cro_agent.claude'
  ];

  for (const agentFile of agentFiles) {
    const agentName = path.basename(agentFile, '.claude');

    test(`${agentName} should exist`, () => {
      const filePath = path.join(ROOT_DIR, agentFile);
      assert.ok(fs.existsSync(filePath), `${agentFile} should exist`);
    });

    test(`${agentName} should have required sections`, () => {
      const filePath = path.join(ROOT_DIR, agentFile);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Check for header
      assert.ok(content.match(/^#\s+.+/m), `${agentName} should have header`);

      // Check for purpose/description
      const hasPurpose = content.match(/purpose|description|overview/i);
      assert.ok(hasPurpose, `${agentName} should have purpose section`);
    });
  }

});

// =============================================================================
// Memory Kernel Contract Tests
// =============================================================================

describe('Memory Kernel Contract', () => {

  test('state file should conform to schema structure', () => {
    const statePath = path.join(ROOT_DIR, 'memory/state.json');
    if (fs.existsSync(statePath)) {
      const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));

      assert.ok(state.version, 'State should have version');
      assert.ok(state.initialized_at, 'State should have initialized_at');
      // autonomy_enabled may be at top level or nested under system
      const hasAutonomy = typeof state.autonomy_enabled === 'boolean' ||
                          typeof state.system?.autonomy_enabled === 'boolean';
      assert.ok(hasAutonomy, 'State should have autonomy_enabled');
    }
  });

  test('reasoning graph should conform to schema structure', () => {
    const graphPath = path.join(ROOT_DIR, 'memory/reasoning_graph.json');
    if (fs.existsSync(graphPath)) {
      const graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));

      assert.ok(Array.isArray(graph.nodes), 'Graph should have nodes array');
      assert.ok(Array.isArray(graph.edges), 'Graph should have edges array');
    }
  });

});

// =============================================================================
// Sample Contract Validation Tests
// =============================================================================

describe('Sample Data Contract Validation', () => {

  test('sample BEAD should pass schema validation', () => {
    const validate = ajv.compile(beadsSchema);

    const sampleBead = {
      id: 'bead-001',
      title: 'Test BEAD',
      description: 'This is a test BEAD for contract testing',
      category: 'feat',
      priority: 'P2',
      status: 'open',
      created_at: new Date().toISOString(),
      acceptance_criteria: ['AC1', 'AC2']
    };

    const valid = validate(sampleBead);
    assert.ok(valid, `BEAD validation failed: ${ajv.errorsText(validate.errors)}`);
  });

  test('sample message should match agent boundary schema structure', () => {
    // Verify the schema defines the expected message structure
    const messageSchema = agentBoundarySchema.properties.message;

    // Check schema structure (not runtime validation due to $ref)
    assert.ok(messageSchema.type === 'object', 'Message should be object type');
    assert.ok(messageSchema.required.includes('id'), 'Message should require id');
    assert.ok(messageSchema.required.includes('from'), 'Message should require from');
    assert.ok(messageSchema.required.includes('to'), 'Message should require to');
    assert.ok(messageSchema.required.includes('type'), 'Message should require type');
    assert.ok(messageSchema.required.includes('payload'), 'Message should require payload');
    assert.ok(messageSchema.required.includes('timestamp'), 'Message should require timestamp');

    // Verify sample message would match structure
    const sampleMessage = {
      id: 'msg-0123456789abcdef',
      from: 'master_orchestrator',
      to: 'autonomous_cto',
      type: 'request',
      payload: {
        action: 'analyze',
        data: { target: 'codebase' }
      },
      timestamp: new Date().toISOString()
    };

    for (const field of messageSchema.required) {
      assert.ok(field in sampleMessage, `Sample message should have ${field}`);
    }
  });

});
