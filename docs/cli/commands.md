# CLI Reference

Complete reference for EAOS CLI commands.

## Global Options

```bash
eaos [command] [options]

Options:
  --help, -h      Show help
  --version, -v   Show version
```

## Core Commands

### init

Initialize EAOS in the current directory.

```bash
eaos init [--force]
```

| Option | Description |
|--------|-------------|
| `--force` | Overwrite existing initialization |

### status

Show current system status.

```bash
eaos status
```

### config

Manage configuration.

```bash
eaos config show
eaos config set <key> <value>
```

## Agent Commands

### agent

Manage AI agents.

```bash
eaos agent list              # List available agents
eaos agent invoke <name>     # Invoke specific agent
```

## Memory Commands

### memory

Interact with the Memory Kernel.

```bash
eaos memory summary          # Show memory summary
eaos memory export --output <file>
eaos memory import --input <file>
```

## BEADS Commands

### beads

Issue tracking and workflow.

```bash
eaos beads list              # List all issues
eaos beads create --title "..." --priority P1
eaos beads show <id>         # Show issue details
eaos beads close <id>        # Close issue
```

## Audit Commands

### audit

System auditing.

```bash
eaos audit quick             # Quick validation
eaos audit full              # Comprehensive audit
```

## Compliance Commands

### compliance

Run compliance checks.

```bash
eaos compliance soc2         # SOC 2 compliance
eaos compliance iso27001     # ISO 27001 compliance
eaos compliance nist         # NIST framework
eaos compliance all          # All frameworks
```

## Autonomy Commands

### autonomy

Control autonomous operation.

```bash
eaos autonomy status         # Show autonomy status
eaos autonomy on             # Enable autonomy
eaos autonomy off            # Disable autonomy
```

## Simulation Commands

### simulate

Run simulations.

```bash
eaos simulate <scenario>     # Run scenario
```

### multiverse

Analyze alternate scenarios.

```bash
eaos multiverse simulate --scenario "..."
```
