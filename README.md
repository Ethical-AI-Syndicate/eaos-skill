# EAOS — Enterprise AI Operating System

[![CI](https://github.com/Ethical-AI-Syndicate/eaos-skill/actions/workflows/ci.yml/badge.svg)](https://github.com/Ethical-AI-Syndicate/eaos-skill/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

> Multi-agent governance, auditing, compliance, and strategy orchestration for Claude Code

EAOS is a comprehensive Claude Code skill that provides enterprise-grade AI orchestration capabilities including multi-agent coordination, compliance automation, strategic planning, and executive reporting.

## Features

### Core Intelligence Layer
- **Memory Kernel** - Persistent reasoning substrate with graph-based knowledge
- **Autonomy Mode** - Self-governing operations with human approval gates
- **Multiverse Engine** - Parallel multi-scenario simulation
- **Quantum Planner** - Time-horizon based strategic planning
- **Human Decision Matrix** - 5-level governance approval system
- **Swarm Mode** - Multi-repo distributed intelligence

### Strategic Agents
| Agent | Role |
|-------|------|
| Master Orchestrator | Primary coordination and routing |
| Autonomous CTO | Technical strategy and architecture |
| CFO Agent | Financial intelligence and FinOps |
| CIO Agent | IT governance and security |
| CRO Agent | Revenue and GTM strategy |

### Compliance Engines
- **SOC-2 Type II** - 35 Trust Services Criteria controls
- **ISO 27001:2022** - 114 Annex A controls
- **NIST 800-53 Rev 5** - 20 control families (Low/Moderate/High baselines)

### Operational Modules
- PR Bot, Release Train, Audit Pipeline
- BEADS task management, Self-Healing Monthly
- Executive dashboards and board packs

## Quick Start

```bash
# Clone and install
git clone https://github.com/Ethical-AI-Syndicate/eaos-skill.git
cd eaos-skill
npm install

# Initialize EAOS
npm run init

# Verify installation
node cli/eaos.js status
```

See [examples/quickstart.md](examples/quickstart.md) for a complete getting started guide.

## CLI Commands

```bash
# System
eaos init              # Initialize EAOS
eaos status            # Show system status

# Auditing
eaos audit quick       # Quick security audit
eaos audit full        # Comprehensive audit

# Compliance
eaos compliance soc2   # SOC-2 compliance check
eaos compliance iso27001
eaos compliance nist

# Simulations
eaos simulate "scenario"           # Sandbox simulation
eaos multiverse simulate "scenario"  # Multi-future analysis
eaos quantum plan "objective"      # Time-horizon planning

# Tasks
eaos beads list        # List tasks
eaos beads create      # Create task

# Reporting
eaos dashboard         # Executive dashboard
```

Full reference: [EAOS_CLI_REFERENCE.md](EAOS_CLI_REFERENCE.md)

## Project Structure

```
eaos-skill/
├── core/           # Intelligence layer (Memory Kernel, Autonomy, etc.)
├── agents/         # Strategic agents (CTO, CFO, CIO, CRO)
├── modules/        # Operational modules (PR Bot, Release Train)
├── compliance/     # Compliance engines (SOC-2, ISO, NIST)
├── cli/            # Command-line interface
├── tests/          # Test suites (47 tests)
├── manifests/      # JSON schemas and registries
└── examples/       # Quickstart and examples
```

### Core vs Optional Components

| Type | Components | Required |
|------|------------|----------|
| **Core** | Memory Kernel, Autonomy Mode, CLI, Manifests | Yes |
| **Agents** | Master Orchestrator, CTO, CFO, CIO, CRO | Recommended |
| **Compliance** | SOC-2, ISO 27001, NIST engines | Optional |
| **Business** | Executive, Finance, Sales, Marketing | Optional |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    INTELLIGENCE LAYER                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │   Memory    │ │  Autonomy   │ │    Simulation Engines   ││
│  │   Kernel    │ │    Mode     │ │ Sandbox│Multi│Quantum   ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│                    GOVERNANCE LAYER                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Human Decision Matrix                       ││
│  │         L1-Auto → L2-Notify → L3-Approve → L5-Board     ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│                   STRATEGIC AGENTS                           │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────┐│
│  │  CTO   │ │  CFO   │ │  CIO   │ │  CRO   │ │Orchestrator││
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────────┘│
├─────────────────────────────────────────────────────────────┤
│                  OPERATIONAL MODULES                         │
│  PR Bot │ Release Train │ Audit │ BEADS │ Self-Healing     │
└─────────────────────────────────────────────────────────────┘
```

Full details: [EAOS_ARCHITECTURE_OVERVIEW.md](EAOS_ARCHITECTURE_OVERVIEW.md)

## Testing

```bash
# Run all tests (47 tests)
npm run test:all

# Unit tests only
npm test

# Integration tests only
npm run test:integration

# Validation suite
npm run test:validate
```

## Documentation

| Document | Description |
|----------|-------------|
| [EAOS_ARCHITECTURE_OVERVIEW.md](EAOS_ARCHITECTURE_OVERVIEW.md) | System architecture |
| [EAOS_CLI_REFERENCE.md](EAOS_CLI_REFERENCE.md) | CLI command reference |
| [EAOS_INSTALL_GUIDE.md](EAOS_INSTALL_GUIDE.md) | Installation guide |
| [EAOS_DEPLOYMENT_GUIDE.md](EAOS_DEPLOYMENT_GUIDE.md) | Deployment options |
| [EAOS_SAFETY_AND_GOVERNANCE.md](EAOS_SAFETY_AND_GOVERNANCE.md) | Governance framework |
| [EAOS_AGENT_CONTRACTS.md](EAOS_AGENT_CONTRACTS.md) | Agent interfaces |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines |
| [CHANGELOG.md](CHANGELOG.md) | Version history |

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run test:all`
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Status

**Current Version**: 1.0.0-beta

This is a beta release. Core functionality is implemented and tested. Some advanced features (OpenTelemetry tracing, Grafana dashboards) are planned for future releases.

See [CHANGELOG.md](CHANGELOG.md) for release notes.
