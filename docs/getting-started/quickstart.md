# Quick Start

Get EAOS running in under 5 minutes.

## 1. Initialize EAOS

```bash
npx eaos init
```

This creates:
- `memory/state.json` - System state
- `memory/reasoning_graph.json` - Knowledge graph
- `.eaos.config.json` - Configuration file

## 2. Check System Status

```bash
npx eaos status
```

Expected output:
```
EAOS Status
───────────────────────────────
Version: 1.0.0-beta.1
Initialized: true
Boot Count: 1
Autonomy: disabled
Active Agents: master_orchestrator
───────────────────────────────
```

## 3. Run a Quick Audit

```bash
npx eaos audit quick
```

This performs:
- File structure validation
- Manifest integrity check
- Schema validation
- Security scan

## 4. Explore Available Commands

```bash
# List all commands
npx eaos --help

# Get help for a specific command
npx eaos beads --help
```

## Common Tasks

### Issue Tracking with BEADS

```bash
# List open issues
npx eaos beads list

# Create an issue
npx eaos beads create --title "Fix bug in auth" --priority P1

# Close an issue
npx eaos beads close <id>
```

### Memory Operations

```bash
# View memory summary
npx eaos memory summary

# Export memory state
npx eaos memory export --output backup.json
```

### Compliance Checks

```bash
# Run SOC 2 compliance check
npx eaos compliance soc2

# Run full compliance audit
npx eaos compliance all
```

## Next Steps

- [Configuration Guide](configuration.md)
- [Architecture Overview](../architecture/overview.md)
- [CLI Reference](../cli/commands.md)
