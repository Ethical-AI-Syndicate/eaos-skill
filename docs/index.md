# EAOS - Enterprise AI Operating System

Welcome to the **Enterprise AI Operating System (EAOS)** - an autonomous operating system for enterprise AI that transforms Claude Code into a complete business operating platform.

## Overview

EAOS provides:

- **Multi-Agent Orchestration** - Coordinate AI agents across executive functions (CTO, CFO, CIO, CRO)
- **Autonomous Operation** - Self-healing, self-auditing capabilities with human oversight
- **Enterprise Governance** - Built-in compliance, security, and risk management
- **Memory & Reasoning** - Persistent knowledge graphs and multi-session context
- **Extensible Architecture** - Modular skills, plugins, and integrations

## Quick Start

```bash
# Install dependencies
npm install

# Initialize EAOS
npx eaos init

# Check system status
npx eaos status

# Run an audit
npx eaos audit
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MASTER ORCHESTRATOR                       │
│              (Coordinates all agents & systems)              │
├─────────────────────────────────────────────────────────────┤
│  EXECUTIVE LAYER                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │   CTO    │ │   CFO    │ │   CIO    │ │   CRO    │        │
│  │  Agent   │ │  Agent   │ │  Agent   │ │  Agent   │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
├─────────────────────────────────────────────────────────────┤
│  CORE LAYER                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │Memory Kernel │ │Human Decision│ │  Autonomy    │         │
│  │              │ │   Matrix     │ │    Mode      │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  MODULE LAYER                                                │
│  BEADS • Compliance • Audit • Release Train • PR Bot         │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

### Human Decision Matrix (HDM)

The HDM provides granular control over AI autonomy with 5 approval levels:

| Level | Name | Description |
|-------|------|-------------|
| L0 | No Approval | Read-only informational operations |
| L1 | Post-Action Review | Auto-execute with logging |
| L2 | Approval Before Execution | Human approves before action |
| L3 | Human Selection | Human chooses from options |
| L4 | Full Approval | Requires explicit authorization |

### BEADS Issue Tracking

Built-in issue tracking integrated with the reasoning graph:

```bash
# List open issues
npx eaos beads list

# Create a new issue
npx eaos beads create --title "Implement feature X" --priority P2

# Close an issue
npx eaos beads close <id>
```

### Compliance Engines

Pre-built compliance modules for enterprise standards:

- **SOC 2** - Security, availability, processing integrity
- **ISO 27001** - Information security management
- **NIST** - Cybersecurity framework

## Documentation

- [Installation Guide](getting-started/installation.md)
- [Quick Start](getting-started/quickstart.md)
- [Architecture Overview](architecture/overview.md)
- [CLI Reference](cli/commands.md)
- [API Reference](api/skill-contract.md)

## Contributing

We welcome contributions! See our [Contributing Guidelines](contributing/guidelines.md) for details.

## License

MIT License - see [LICENSE](https://github.com/Ethical-AI-Syndicate/eaos-skill/blob/main/LICENSE) for details.
