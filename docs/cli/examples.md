# CLI Examples

Practical examples of using the EAOS CLI.

## Getting Started

### Initialize a New Project

```bash
# Create directory and initialize
mkdir my-eaos-project
cd my-eaos-project
npm init -y
npm install @eaos/cli
npx eaos init
```

### Verify Setup

```bash
# Check everything is working
npx eaos status
npx eaos audit quick
```

## Issue Tracking Workflow

### Create and Track Issues

```bash
# Create a new feature issue
npx eaos beads create \
  --title "Implement user authentication" \
  --priority P2 \
  --category feat

# List open issues
npx eaos beads list

# Show specific issue
npx eaos beads show beads-001

# Close completed issue
npx eaos beads close beads-001
```

## Compliance Workflows

### Run Compliance Audit

```bash
# Check SOC 2 compliance
npx eaos compliance soc2

# Full compliance report
npx eaos compliance all > compliance-report.txt
```

## Memory Management

### Backup and Restore

```bash
# Export memory state
npx eaos memory export --output backup-$(date +%Y%m%d).json

# Import from backup
npx eaos memory import --input backup-20240115.json
```

## Autonomy Mode

### Enable with Safeguards

```bash
# Check current status
npx eaos autonomy status

# Enable autonomy mode
npx eaos autonomy on

# Disable when done
npx eaos autonomy off
```

## Simulation Examples

### Run Scenarios

```bash
# Test deployment scenario
npx eaos simulate "Deploy to production"

# Analyze alternatives
npx eaos multiverse simulate --scenario "Scale infrastructure"
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: EAOS Audit
on: [push]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      - run: npx eaos init --force
      - run: npx eaos audit quick
```
