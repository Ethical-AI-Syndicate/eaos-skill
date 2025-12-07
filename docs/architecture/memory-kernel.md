# Memory Kernel

The Memory Kernel provides persistent storage and reasoning capabilities.

## Overview

The Memory Kernel manages:

- **System State** - Runtime configuration and status
- **Reasoning Graph** - Knowledge nodes and relationships
- **Session Context** - Current task and variable state

## State Schema

```json
{
  "version": "1.0.0",
  "initialized_at": "2024-01-15T10:00:00Z",
  "system": {
    "boot_count": 5,
    "autonomy_enabled": false
  },
  "domains": {
    "system_state": {},
    "executive_intelligence": {},
    "compliance_security": {}
  }
}
```

## Reasoning Graph

The reasoning graph stores knowledge as nodes and edges:

### Node Types

| Type | Description |
|------|-------------|
| `fact` | Verified information |
| `decision` | A choice that was made |
| `observation` | Something noticed |
| `hypothesis` | Proposed explanation |
| `action` | Something done |
| `outcome` | Result of action |

### Edge Relations

| Relation | Description |
|----------|-------------|
| `causes` | A leads to B |
| `supports` | A provides evidence for B |
| `contradicts` | A conflicts with B |
| `requires` | A depends on B |
| `produces` | A creates B |

## API Operations

### Read Operations

```javascript
// Get current state
getState()

// Query nodes by type
queryNodes({ type: 'decision', limit: 10 })

// Get node connections
getConnections({ nodeId: 'node-abc123', direction: 'out' })
```

### Write Operations

```javascript
// Add new node (L1 approval)
addNode({ type: 'fact', content: 'API is stable' })

// Update node (L2 approval)
updateNode({ nodeId: 'node-abc123', updates: { confidence: 0.9 } })

// Delete node (L3 approval)
deleteNode({ nodeId: 'node-abc123' })
```

## Persistence

State is automatically persisted to `memory/state.json` and `memory/reasoning_graph.json`.

## CLI Commands

```bash
# View memory summary
npx eaos memory summary

# Export to file
npx eaos memory export --output backup.json

# Import from file
npx eaos memory import --input backup.json
```
