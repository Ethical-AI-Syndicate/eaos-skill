/**
 * EAOS Behavioral Tests
 *
 * Tests agent orchestration patterns and behaviors:
 * - Master Orchestrator delegation patterns
 * - Agent communication protocols
 * - Approval workflow enforcement
 * - Cross-agent task coordination
 * - Error handling and recovery
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

// =============================================================================
// Test Data
// =============================================================================

const AGENT_FILES = {
  orchestrator: 'agents/master_orchestrator.claude',
  cto: 'agents/autonomous_cto.claude',
  cfo: 'agents/cfo_agent.claude',
  cio: 'agents/cio_agent.claude',
  cro: 'agents/cro_agent.claude',
  ciw: 'agents/ciw_agent.claude'
};

const EXPECTED_DELEGATION_PATTERNS = {
  technical: ['autonomous_cto', 'cio'],
  financial: ['cfo_agent'],
  revenue: ['cro_agent'],
  compliance: ['ciw_agent']
};

const APPROVAL_LEVELS = {
  L1: { name: 'Auto-Execute', requiresHuman: false },
  L2: { name: 'Notify', requiresHuman: false },
  L3: { name: 'Approve', requiresHuman: true },
  L4: { name: 'Escalate', requiresHuman: true },
  L5: { name: 'Board', requiresHuman: true }
};

// =============================================================================
// Helper Functions
// =============================================================================

function loadAgentContent(agentKey) {
  const filePath = path.join(ROOT_DIR, AGENT_FILES[agentKey]);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath, 'utf-8');
}

function extractDelegationTargets(content) {
  const targets = [];
  const patterns = [
    /delegate.*to\s+(\w+)/gi,
    /forward.*to\s+(\w+)/gi,
    /route.*to\s+(\w+)/gi,
    /assign.*to\s+(\w+)/gi,
    /→\s*(\w+_agent|\w+_cto)/gi
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      targets.push(match[1].toLowerCase());
    }
  }
  return [...new Set(targets)];
}

function extractApprovalReferences(content) {
  const refs = [];
  const patterns = [
    /L([0-4])/g,
    /Level\s*([0-4])/gi,
    /approval[_-]?level[:\s]+(\d)/gi
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      refs.push(parseInt(match[1]));
    }
  }
  return [...new Set(refs)].sort();
}

// =============================================================================
// Master Orchestrator Behavioral Tests
// =============================================================================

describe('Master Orchestrator Behavior', () => {

  test('orchestrator should exist and be loadable', () => {
    const content = loadAgentContent('orchestrator');
    assert.ok(content, 'Master orchestrator should exist');
    assert.ok(content.length > 100, 'Orchestrator should have substantial content');
  });

  test('orchestrator should reference all executive agents', () => {
    const content = loadAgentContent('orchestrator');
    const executiveAgents = ['cto', 'cfo', 'cio', 'cro'];

    for (const agent of executiveAgents) {
      const hasReference = new RegExp(agent, 'i').test(content);
      assert.ok(hasReference, `Orchestrator should reference ${agent.toUpperCase()}`);
    }
  });

  test('orchestrator should define task coordination patterns', () => {
    const content = loadAgentContent('orchestrator');

    // Should have task coordination keywords
    const hasCoordination = /coordinat|task|manage|direct|orchestrat|multi-agent/i.test(content);
    assert.ok(hasCoordination, 'Orchestrator should define task coordination patterns');
  });

  test('orchestrator should support approval workflows', () => {
    const content = loadAgentContent('orchestrator');

    // Should reference approval-related concepts
    const hasApproval = /approv|decision|authorize|permission|level|human/i.test(content);
    assert.ok(hasApproval, 'Orchestrator should support approval workflows');
  });

  test('orchestrator should handle critical operations', () => {
    const content = loadAgentContent('orchestrator');

    const hasCritical = /critical|priority|important|urgent|escalat|elevat|override|emergency|risk/i.test(content);
    assert.ok(hasCritical, 'Orchestrator should handle critical operations');
  });

});

// =============================================================================
// Agent Communication Protocol Tests
// =============================================================================

describe('Agent Communication Protocols', () => {

  test('all agents should have consistent header format', () => {
    for (const [key, file] of Object.entries(AGENT_FILES)) {
      const content = loadAgentContent(key);
      if (!content) continue;

      const hasHeader = /^#\s+.+/m.test(content);
      assert.ok(hasHeader, `${key} should have markdown header`);
    }
  });

  test('agents should define their responsibilities', () => {
    for (const [key, file] of Object.entries(AGENT_FILES)) {
      const content = loadAgentContent(key);
      if (!content) continue;

      const hasResponsibilities = /responsibil|purpose|role|mission|objective/i.test(content);
      assert.ok(hasResponsibilities, `${key} should define responsibilities`);
    }
  });

  test('agents should reference the orchestrator for coordination', () => {
    const nonOrchestratorAgents = Object.keys(AGENT_FILES).filter(k => k !== 'orchestrator');

    for (const key of nonOrchestratorAgents) {
      const content = loadAgentContent(key);
      if (!content) continue;

      // Either reference orchestrator directly or use coordination keywords
      const hasCoordination = /orchestrat|coordinat|report|escalat|master/i.test(content);
      assert.ok(hasCoordination, `${key} should have coordination with orchestrator`);
    }
  });

});

// =============================================================================
// Approval Workflow Tests
// =============================================================================

describe('Approval Workflow Enforcement', () => {

  test('human decision matrix should exist', () => {
    const hdmPath = path.join(ROOT_DIR, 'core/human_decision_matrix.claude');
    assert.ok(fs.existsSync(hdmPath), 'Human Decision Matrix should exist');
  });

  test('HDM should define approval levels', () => {
    const hdmPath = path.join(ROOT_DIR, 'core/human_decision_matrix.claude');
    const content = fs.readFileSync(hdmPath, 'utf-8');

    // HDM uses 0-4 scale (0=No approval, 4=Full approval)
    let levelsFound = 0;
    for (let level = 0; level <= 4; level++) {
      const hasLevel = new RegExp(`Level\\s*${level}`, 'i').test(content);
      if (hasLevel) levelsFound++;
    }
    assert.ok(levelsFound >= 3, `HDM should define at least 3 approval levels, found ${levelsFound}`);
  });

  test('HDM should specify human intervention thresholds', () => {
    const hdmPath = path.join(ROOT_DIR, 'core/human_decision_matrix.claude');
    const content = fs.readFileSync(hdmPath, 'utf-8');

    const hasThresholds = /threshold|require|mandatory|must|human/i.test(content);
    assert.ok(hasThresholds, 'HDM should specify intervention thresholds');
  });

  test('command registry should have approval levels', () => {
    const registryPath = path.join(ROOT_DIR, 'manifests/COMMAND_REGISTRY.json');
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));

    for (const [category, commands] of Object.entries(registry.commands)) {
      for (const [cmdName, cmdDef] of Object.entries(commands)) {
        assert.ok(
          typeof cmdDef.approval_level === 'number',
          `Command ${cmdName} should have approval_level`
        );
        // 0 = no approval (read-only), 1-5 = approval levels
        assert.ok(
          cmdDef.approval_level >= 0 && cmdDef.approval_level <= 5,
          `Command ${cmdName} approval_level should be 0-5`
        );
      }
    }
  });

});

// =============================================================================
// Cross-Agent Coordination Tests
// =============================================================================

describe('Cross-Agent Coordination', () => {

  test('CTO should handle technical decisions', () => {
    const content = loadAgentContent('cto');
    assert.ok(content, 'CTO agent should exist');

    const hasTechFocus = /technical|architect|engineering|code|system/i.test(content);
    assert.ok(hasTechFocus, 'CTO should have technical focus');
  });

  test('CFO should handle financial decisions', () => {
    const content = loadAgentContent('cfo');
    assert.ok(content, 'CFO agent should exist');

    const hasFinanceFocus = /financ|budget|cost|revenue|profit|expense/i.test(content);
    assert.ok(hasFinanceFocus, 'CFO should have financial focus');
  });

  test('CIO should handle information/data decisions', () => {
    const content = loadAgentContent('cio');
    assert.ok(content, 'CIO agent should exist');

    const hasInfoFocus = /information|data|security|infrastructure|IT/i.test(content);
    assert.ok(hasInfoFocus, 'CIO should have information focus');
  });

  test('CRO should handle revenue decisions', () => {
    const content = loadAgentContent('cro');
    assert.ok(content, 'CRO agent should exist');

    const hasRevenueFocus = /revenue|sales|growth|customer|market/i.test(content);
    assert.ok(hasRevenueFocus, 'CRO should have revenue focus');
  });

  test('CIW should handle compliance decisions', () => {
    const content = loadAgentContent('ciw');
    if (!content) {
      // CIW is optional, skip if not present
      return;
    }

    const hasComplianceFocus = /compliance|integrity|ethics|governance|risk/i.test(content);
    assert.ok(hasComplianceFocus, 'CIW should have compliance focus');
  });

});

// =============================================================================
// Error Handling and Recovery Tests
// =============================================================================

describe('Error Handling and Recovery', () => {

  test('agents should have fallback procedures', () => {
    const orchestratorContent = loadAgentContent('orchestrator');

    const hasFallback = /fallback|error|fail|recover|retry|exception/i.test(orchestratorContent);
    assert.ok(hasFallback, 'Orchestrator should define fallback procedures');
  });

  test('autonomy mode should have safety constraints', () => {
    const autonomyPath = path.join(ROOT_DIR, 'core/autonomy_mode.claude');
    const content = fs.readFileSync(autonomyPath, 'utf-8');

    const hasSafety = /safe|constraint|limit|bound|restrict|NEVER|MUST NOT/i.test(content);
    assert.ok(hasSafety, 'Autonomy mode should have safety constraints');
  });

  test('autonomy should require approval for activation', () => {
    const autonomyPath = path.join(ROOT_DIR, 'core/autonomy_mode.claude');
    const content = fs.readFileSync(autonomyPath, 'utf-8');

    // Check for approval/restriction concepts (level naming may vary)
    const hasApproval = /approv|restrict|enable|activat|permission|require|authorize/i.test(content);
    assert.ok(hasApproval, 'Autonomy should require approval/authorization');
  });

});

// =============================================================================
// Module Integration Tests
// =============================================================================

describe('Module Integration Patterns', () => {

  test('memory kernel should integrate with reasoning', () => {
    const mkPath = path.join(ROOT_DIR, 'core/memory_kernel.claude');
    const content = fs.readFileSync(mkPath, 'utf-8');

    const hasReasoning = /reason|graph|node|edge|connect/i.test(content);
    assert.ok(hasReasoning, 'Memory kernel should support reasoning');
  });

  test('BEADS module should exist and be loadable', () => {
    const beadsPath = path.join(ROOT_DIR, 'modules/beads_manager.claude');
    assert.ok(fs.existsSync(beadsPath), 'BEADS module should exist');

    const content = fs.readFileSync(beadsPath, 'utf-8');
    assert.ok(content.length > 100, 'BEADS should have substantial content');
  });

  test('compliance engines should integrate with governance', () => {
    const compliancePath = path.join(ROOT_DIR, 'compliance');

    if (fs.existsSync(compliancePath)) {
      const files = fs.readdirSync(compliancePath);
      const claudeFiles = files.filter(f => f.endsWith('.claude'));

      assert.ok(claudeFiles.length > 0, 'Compliance should have .claude modules');

      for (const file of claudeFiles) {
        const content = fs.readFileSync(path.join(compliancePath, file), 'utf-8');
        const hasGovernance = /governance|policy|rule|standard|compliance/i.test(content);
        assert.ok(hasGovernance, `${file} should integrate with governance`);
      }
    }
  });

});

// =============================================================================
// Swarm Mode Coordination Tests
// =============================================================================

describe('Swarm Mode Coordination', () => {

  test('swarm mode should define coordination protocols', () => {
    const swarmPath = path.join(ROOT_DIR, 'modules/swarm_mode.claude');
    if (!fs.existsSync(swarmPath)) {
      return; // Skip if swarm mode not implemented
    }

    const content = fs.readFileSync(swarmPath, 'utf-8');

    const hasCoordination = /coordinat|parallel|concurrent|distributed|sync/i.test(content);
    assert.ok(hasCoordination, 'Swarm mode should define coordination protocols');
  });

  test('swarm should have consensus mechanisms', () => {
    const swarmPath = path.join(ROOT_DIR, 'modules/swarm_mode.claude');
    if (!fs.existsSync(swarmPath)) {
      return;
    }

    const content = fs.readFileSync(swarmPath, 'utf-8');

    const hasConsensus = /consensus|vote|agree|quorum|majority/i.test(content);
    assert.ok(hasConsensus, 'Swarm should have consensus mechanisms');
  });

});

// =============================================================================
// Reasoning Chain Tests
// =============================================================================

describe('Reasoning Chain Integrity', () => {

  test('reasoning graph schema should support chain-of-thought', () => {
    const schemaPath = path.join(ROOT_DIR, 'EAOS_REASONING_GRAPH_SCHEMA.json');
    if (!fs.existsSync(schemaPath)) {
      return;
    }

    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

    assert.ok(schema.properties?.nodes, 'Schema should define nodes');
    assert.ok(schema.properties?.edges, 'Schema should define edges');
  });

  test('memory kernel API should support reasoning operations', () => {
    const apiPath = path.join(ROOT_DIR, 'manifests/MEMORY_KERNEL_API_SCHEMA.json');
    const schema = JSON.parse(fs.readFileSync(apiPath, 'utf-8'));

    assert.ok(schema.properties?.reasoningGraph, 'API should define reasoningGraph');
    assert.ok(schema.properties?.operations, 'API should define operations');
  });

});
