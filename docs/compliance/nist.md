# NIST Cybersecurity Framework

EAOS NIST compliance engine for cybersecurity framework implementation.

## Framework Functions

| Function | Description |
|----------|-------------|
| Identify | Understand assets and risks |
| Protect | Implement safeguards |
| Detect | Identify cybersecurity events |
| Respond | Take action on incidents |
| Recover | Restore capabilities |

## Running NIST Checks

```bash
npx eaos compliance nist
```

## Categories

### Identify (ID)

- ID.AM - Asset Management
- ID.BE - Business Environment
- ID.GV - Governance
- ID.RA - Risk Assessment
- ID.RM - Risk Management Strategy

### Protect (PR)

- PR.AC - Access Control
- PR.AT - Awareness and Training
- PR.DS - Data Security
- PR.IP - Information Protection
- PR.MA - Maintenance
- PR.PT - Protective Technology

### Detect (DE)

- DE.AE - Anomalies and Events
- DE.CM - Security Continuous Monitoring
- DE.DP - Detection Processes

### Respond (RS)

- RS.RP - Response Planning
- RS.CO - Communications
- RS.AN - Analysis
- RS.MI - Mitigation
- RS.IM - Improvements

### Recover (RC)

- RC.RP - Recovery Planning
- RC.IM - Improvements
- RC.CO - Communications

## Evidence Collection

EAOS maps system capabilities to NIST controls and collects evidence automatically.
