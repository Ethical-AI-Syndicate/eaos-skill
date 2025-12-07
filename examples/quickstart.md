# EAOS Quickstart Guide

Get up and running with EAOS in under 5 minutes.

## Prerequisites

- Node.js 18+ installed
- Git

## Installation

```bash
# Clone the repository
git clone https://github.com/Ethical-AI-Syndicate/eaos-skill.git
cd eaos-skill

# Install dependencies
npm install

# Initialize EAOS
npm run init
```

## Verify Installation

```bash
# Check system status
node cli/eaos.js status
```

You should see:
```
╔═══════════════════════════════════════════════════════════╗
║  EAOS - Enterprise AI Operating System                    ║
╚═══════════════════════════════════════════════════════════╝

System Status
──────────────────────────────────────────────────
  Initialized:      ✓ Yes
  Memory Kernel:    ✓ Ready
  Reasoning Graph:  ✓ Ready
  Configuration:    ✓ Found
```

## Basic Commands

### 1. Run a Quick Audit

```bash
node cli/eaos.js audit quick
```

This runs a fast security and compliance check.

### 2. Check Compliance Status

```bash
# SOC-2 compliance
node cli/eaos.js compliance soc2

# ISO 27001 compliance
node cli/eaos.js compliance iso27001

# NIST 800-53 compliance
node cli/eaos.js compliance nist
```

### 3. Generate Executive Dashboard

```bash
node cli/eaos.js dashboard
```

Generates a CxO-level summary of system health.

### 4. Run Simulations

```bash
# Sandbox simulation
node cli/eaos.js simulate "deploy new microservice"

# Multiverse analysis (multiple scenarios)
node cli/eaos.js multiverse simulate "scaling strategy"

# Quantum planning (time-based)
node cli/eaos.js quantum plan "infrastructure upgrade"
```

### 5. Manage Tasks (BEADS)

```bash
# List all tasks
node cli/eaos.js beads list

# Create a new task
node cli/eaos.js beads create --title "Implement feature X" --category feat --priority P2
```

## Minimal Configuration

EAOS works out of the box, but you can customize via `.eaos.config.json`:

```json
{
  "autonomy": {
    "enabled": false,
    "approval_required_level": 2
  },
  "compliance": {
    "soc2": true,
    "iso27001": true,
    "nist": true
  }
}
```

## Using with Claude Code

EAOS is designed as a Claude Code skill. To use it with Claude:

1. **Add to your project**: Copy the EAOS repository into your project
2. **Load the skill**: Reference `skills/eaos_skill_loader.claude` in your Claude session
3. **Start using**: Claude will have access to all EAOS capabilities

### Example Claude Prompts

```
"Run an EAOS security audit on this codebase"
"Generate an executive dashboard for stakeholder review"
"Simulate deploying this change to production"
"Check our SOC-2 compliance status"
```

## Next Steps

- **Full CLI Reference**: See `EAOS_CLI_REFERENCE.md`
- **Architecture Overview**: See `EAOS_ARCHITECTURE_OVERVIEW.md`
- **Deployment Guide**: See `EAOS_DEPLOYMENT_GUIDE.md`
- **Contributing**: See `CONTRIBUTING.md`

## Troubleshooting

### "Memory Kernel not initialized"

Run `node cli/eaos.js init --force` to reinitialize.

### Tests Failing

Ensure you have Node.js 18+ installed:
```bash
node --version  # Should be v18.x.x or higher
```

### Permission Errors

Make scripts executable:
```bash
chmod +x cli/eaos.js scripts/*.js
```

## Getting Help

- **Documentation**: Check the `EAOS_*.md` files in the root directory
- **Issues**: Open an issue on GitHub
- **Discussions**: Start a GitHub Discussion for questions
