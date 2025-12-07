#!/usr/bin/env node

/**
 * EAOS Memory Kernel Initialization Script
 *
 * Creates and initializes the memory kernel with:
 * - State file
 * - Reasoning graph
 * - Domain structures
 * - Initial configuration
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

const MEMORY_DIR = path.join(ROOT_DIR, 'memory');
const STATE_FILE = path.join(MEMORY_DIR, 'state.json');
const GRAPH_FILE = path.join(MEMORY_DIR, 'reasoning_graph.json');
const SUMMARY_FILE = path.join(MEMORY_DIR, 'long_term_summary.md');
const CHANGELOG_FILE = path.join(MEMORY_DIR, 'changelog.md');

// Initial state structure
const initialState = {
  "$schema": "../EAOS_REASONING_GRAPH_SCHEMA.json",
  "version": "1.0.0",
  "initialized_at": new Date().toISOString(),
  "last_updated": new Date().toISOString(),
  "system": {
    "boot_count": 0,
    "last_boot": null,
    "autonomy_enabled": false,
    "autonomy_last_cycle": null,
    "swarm_enabled": false,
    "swarm_node_id": null
  },
  "domains": {
    "system_state": {
      "description": "BEADS history, code quality trends, audit outputs, release history",
      "entries": []
    },
    "executive_intelligence": {
      "description": "CTO/CFO/CIO/CRO directives and updates",
      "entries": []
    },
    "compliance_security": {
      "description": "SOC-2/ISO/NIST mappings, evidentiary artifacts, control changes",
      "entries": []
    },
    "product_engineering": {
      "description": "Feature evolution, technical risk register, observability coverage",
      "entries": []
    },
    "strategic_reasoning": {
      "description": "Past scenarios, winning strategies, known risk triggers",
      "entries": []
    },
    "market_intelligence": {
      "description": "Competitor models, positioning evolution, feature gaps",
      "entries": []
    },
    "financial_reality": {
      "description": "Spend trends, pricing experiments, runway evolution, KPIs",
      "entries": []
    }
  },
  "metadata": {
    "schema_version": "1.0.0",
    "migrations_applied": []
  }
};

// Initial reasoning graph
const initialGraph = {
  "$schema": "../EAOS_REASONING_GRAPH_SCHEMA.json",
  "version": "1.0.0",
  "created_at": new Date().toISOString(),
  "last_updated": new Date().toISOString(),
  "nodes": [
    {
      "id": "system-root",
      "type": "agent",
      "metadata": {
        "name": "EAOS",
        "description": "Enterprise AI Operating System root node",
        "created_at": new Date().toISOString()
      }
    }
  ],
  "edges": []
};

// Initial summary
const initialSummary = `# EAOS Long-Term Memory Summary

*Last Updated: ${new Date().toISOString()}*

## System State
- EAOS initialized
- No historical data yet

## Key Decisions
*None recorded*

## Strategic Context
*Awaiting first operational cycle*

## Risk Register
*Empty - system newly initialized*

## Financial State
*No financial data recorded*

## Compliance State
*Awaiting first compliance audit*
`;

// Initial changelog
const initialChangelog = `# EAOS Memory Changelog

## [${new Date().toISOString()}] - Initialization
- Created initial memory kernel state
- Initialized reasoning graph
- Set up domain structures
`;

async function initializeMemory() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║           EAOS Memory Kernel Initialization               ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    // Create memory directory
    fs.ensureDirSync(MEMORY_DIR);
    console.log('✓ Memory directory ready');

    // Check for existing state
    if (fs.existsSync(STATE_FILE)) {
      const existing = fs.readJsonSync(STATE_FILE);
      console.log(`\n⚠ Existing state found (initialized: ${existing.initialized_at})`);
      console.log('  Use --force to overwrite');

      if (!process.argv.includes('--force')) {
        console.log('\n  Skipping initialization to preserve existing state.');
        return;
      }
      console.log('\n  --force specified, overwriting...');
    }

    // Write state file
    fs.writeJsonSync(STATE_FILE, initialState, { spaces: 2 });
    console.log('✓ State file created');

    // Write reasoning graph
    fs.writeJsonSync(GRAPH_FILE, initialGraph, { spaces: 2 });
    console.log('✓ Reasoning graph created');

    // Write summary
    fs.writeFileSync(SUMMARY_FILE, initialSummary);
    console.log('✓ Long-term summary created');

    // Write changelog
    fs.writeFileSync(CHANGELOG_FILE, initialChangelog);
    console.log('✓ Changelog created');

    console.log('\n✓ Memory kernel initialization complete!\n');
    console.log('Files created:');
    console.log(`  - ${STATE_FILE}`);
    console.log(`  - ${GRAPH_FILE}`);
    console.log(`  - ${SUMMARY_FILE}`);
    console.log(`  - ${CHANGELOG_FILE}`);

  } catch (error) {
    console.error('\n✗ Initialization failed:', error.message);
    process.exit(1);
  }
}

initializeMemory();
