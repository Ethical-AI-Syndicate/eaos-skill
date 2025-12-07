# Agent Architecture

EAOS uses specialized AI agents for different business domains.

## Agent Types

### Master Orchestrator

The central coordination agent that:

- Routes tasks to appropriate executive agents
- Coordinates multi-agent workflows
- Manages system state and memory
- Enforces approval levels

### Executive Agents

| Agent | File | Domain |
|-------|------|--------|
| CTO | `agents/autonomous_cto.claude` | Technical leadership |
| CFO | `agents/cfo_agent.claude` | Financial operations |
| CIO | `agents/cio_agent.claude` | Information & security |
| CRO | `agents/cro_agent.claude` | Revenue & growth |
| CIW | `agents/ciw_agent.claude` | Compliance & integrity |

## Agent Communication

Agents communicate through the Agent Boundary API:

```json
{
  "id": "msg-0123456789abcdef",
  "from": "master_orchestrator",
  "to": "autonomous_cto",
  "type": "request",
  "payload": {
    "action": "analyze",
    "data": { "target": "codebase" }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Message Types

| Type | Description |
|------|-------------|
| `request` | Request action from another agent |
| `response` | Response to a request |
| `event` | Notification of state change |
| `command` | Direct instruction |
| `query` | Information request |

## Agent Capabilities

Each agent declares its capabilities:

```json
{
  "agentId": "autonomous_cto",
  "name": "Autonomous CTO",
  "capabilities": [
    {
      "name": "code_review",
      "requiredApproval": 1,
      "sideEffects": ["none"]
    },
    {
      "name": "architecture_decision",
      "requiredApproval": 3,
      "sideEffects": ["state_change"]
    }
  ]
}
```

## Creating Custom Agents

1. Create `.claude` file in `agents/` directory
2. Define agent header and purpose
3. Specify capabilities and constraints
4. Register in manifest
