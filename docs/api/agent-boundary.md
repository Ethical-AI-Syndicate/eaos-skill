# Agent Boundary API

Schema for inter-agent communication in EAOS.

## Overview

The Agent Boundary API defines how agents communicate with each other through structured messages.

## Message Format

```json
{
  "id": "msg-0123456789abcdef",
  "correlationId": "corr-fedcba9876543210",
  "from": "master_orchestrator",
  "to": "autonomous_cto",
  "type": "request",
  "payload": {
    "action": "analyze",
    "data": { "target": "codebase" },
    "context": { "session": "abc123" }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "priority": "normal",
  "ttl": 60,
  "metadata": {
    "traceId": "trace-123",
    "version": "1.0.0"
  }
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
| `notification` | Informational message |

## Priority Levels

| Priority | Description |
|----------|-------------|
| `low` | Non-urgent background task |
| `normal` | Standard priority |
| `high` | Urgent, process soon |
| `critical` | Emergency, process immediately |

## Request Schema

```json
{
  "action": "code_review",
  "parameters": {
    "files": ["src/index.js"]
  },
  "requiredApproval": 2,
  "timeout": 30000,
  "retryPolicy": {
    "maxRetries": 3,
    "backoffMs": 1000
  }
}
```

## Response Schema

```json
{
  "status": "success",
  "data": {
    "issues": [],
    "recommendations": []
  },
  "approvalStatus": {
    "level": 2,
    "approved": true,
    "approver": "user@example.com",
    "timestamp": "2024-01-15T10:31:00Z"
  },
  "executionTime": 1500
}
```

## Response Status Values

| Status | Description |
|--------|-------------|
| `success` | Operation completed successfully |
| `error` | Operation failed |
| `pending` | Awaiting approval or processing |
| `rejected` | Approval denied |
| `timeout` | Operation timed out |

## Agent Capabilities

Agents declare their capabilities:

```json
{
  "agentId": "autonomous_cto",
  "name": "Autonomous CTO",
  "capabilities": [
    {
      "name": "code_review",
      "inputSchema": { ... },
      "outputSchema": { ... },
      "requiredApproval": 1,
      "sideEffects": ["none"]
    }
  ],
  "boundaries": {
    "maxConcurrentRequests": 5,
    "rateLimit": {
      "requests": 100,
      "windowMs": 60000
    }
  }
}
```
