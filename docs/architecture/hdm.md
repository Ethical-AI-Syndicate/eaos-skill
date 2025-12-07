# Human Decision Matrix (HDM)

The Human Decision Matrix controls AI autonomy and requires human approval for sensitive operations.

## Approval Levels

| Level | Name | Description | Human Required |
|-------|------|-------------|----------------|
| L0 | No Approval | Read-only, informational | No |
| L1 | Post-Action Review | Auto-execute with logging | No |
| L2 | Approval Before Execution | Request approval first | Yes |
| L3 | Human Selection | Human chooses from options | Yes |
| L4 | Full Approval | Explicit authorization required | Yes |

## Level Details

### Level 0 - No Approval
- Read operations
- Status queries
- Informational commands

### Level 1 - Post-Action Review
- Low-risk write operations
- Routine automation
- Actions logged for review

### Level 2 - Approval Before Execution
- Moderate-risk operations
- Configuration changes
- Human approves before execution

### Level 3 - Human Selection
- Strategic decisions
- Multiple valid options exist
- Human selects preferred approach

### Level 4 - Full Approval
- High-risk operations
- Irreversible actions
- Explicit written authorization

## Configuration

Set maximum approval level in config:

```json
{
  "autonomy": {
    "max_level": 2
  }
}
```

## Command Approval Levels

Examples from the command registry:

| Command | Level | Reason |
|---------|-------|--------|
| `status` | L0 | Read-only |
| `audit` | L0 | Analysis only |
| `beads create` | L1 | Creates issue |
| `autonomy on` | L3 | Enables self-operation |
| `config set` | L2 | Changes settings |

## Enforcement

The Master Orchestrator enforces HDM:

1. Check command approval level
2. Compare to user's authorization
3. If level > max_level, request approval
4. Log all approval decisions
