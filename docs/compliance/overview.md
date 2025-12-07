# Compliance Overview

EAOS includes built-in compliance engines for enterprise standards.

## Supported Frameworks

| Framework | Module | Description |
|-----------|--------|-------------|
| SOC 2 | `compliance/soc2_engine.claude` | Security, availability, processing integrity |
| ISO 27001 | `compliance/iso27001_engine.claude` | Information security management |
| NIST | `compliance/nist_engine.claude` | Cybersecurity framework |

## Running Compliance Checks

```bash
# Run specific framework
npx eaos compliance soc2
npx eaos compliance iso27001
npx eaos compliance nist

# Run all frameworks
npx eaos compliance all
```

## Compliance Reports

Reports include:

- **Control Status** - Pass/Fail for each control
- **Evidence Collection** - Automated evidence gathering
- **Gap Analysis** - Missing or incomplete controls
- **Recommendations** - Suggested remediation

## Automated Scanning

Enable automatic compliance scanning:

```json
{
  "compliance": {
    "frameworks": ["soc2", "iso27001"],
    "auto_scan": true
  }
}
```

## Integration with CI/CD

Add compliance checks to your pipeline:

```yaml
# .github/workflows/compliance.yml
name: Compliance Check
on: [push]
jobs:
  compliance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: npx eaos compliance all
```

## Custom Controls

Add custom compliance controls:

1. Create control definition in `compliance/`
2. Define control ID, objective, and tests
3. Register in compliance manifest

## Evidence Collection

EAOS automatically collects evidence:

- Audit logs
- Configuration snapshots
- Access control records
- Security scan results

## Continuous Compliance

EAOS supports continuous compliance through:

- Real-time monitoring
- Automated evidence collection
- Drift detection
- Alerting on violations
