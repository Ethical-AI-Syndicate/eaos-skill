# Memory Kernel API

Schema for EAOS memory operations and reasoning graph.

## State Schema

```json
{
  "version": "1.0.0",
  "initialized_at": "2024-01-15T10:00:00Z",
  "last_updated": "2024-01-15T12:30:00Z",
  "boot_count": 5,
  "autonomy_enabled": false,
  "active_agents": ["master_orchestrator"],
  "session_context": {
    "current_task": "code_review",
    "task_stack": ["audit", "code_review"],
    "variables": {}
  }
}
```

## Reasoning Graph

### Node Schema

```json
{
  "id": "node-abc12345",
  "type": "decision",
  "content": "Use microservices architecture",
  "confidence": 0.85,
  "source": "autonomous_cto",
  "timestamp": "2024-01-15T10:30:00Z",
  "metadata": {
    "context": "architecture_review",
    "rationale": "Scalability requirements"
  }
}
```

### Node Types

| Type | Description |
|------|-------------|
| `fact` | Verified information |
| `decision` | A choice that was made |
| `observation` | Something noticed |
| `hypothesis` | Proposed explanation |
| `action` | Something done |
| `outcome` | Result of action |

### Edge Schema

```json
{
  "id": "edge-xyz67890",
  "source": "node-abc12345",
  "target": "node-def67890",
  "relation": "causes",
  "weight": 0.9,
  "metadata": {}
}
```

### Edge Relations

| Relation | Description |
|----------|-------------|
| `causes` | Source leads to target |
| `supports` | Source provides evidence for target |
| `contradicts` | Source conflicts with target |
| `precedes` | Source happens before target |
| `follows` | Source happens after target |
| `requires` | Source depends on target |
| `produces` | Source creates target |

## Operations

### Read Operations

| Operation | Approval | Description |
|-----------|----------|-------------|
| `getState` | L0 | Get current memory state |
| `getNode` | L0 | Get specific node |
| `queryNodes` | L0 | Query nodes by criteria |
| `getConnections` | L0 | Get edges for a node |

### Write Operations

| Operation | Approval | Description |
|-----------|----------|-------------|
| `addNode` | L1 | Add new node |
| `addEdge` | L1 | Add new edge |
| `updateNode` | L2 | Update existing node |
| `deleteNode` | L3 | Delete node and edges |
| `setAutonomy` | L4 | Enable/disable autonomy |
| `clearGraph` | L5 | Clear entire graph |

## Examples

### Query Nodes

```javascript
// Find all decisions with high confidence
{
  "operation": "queryNodes",
  "input": {
    "type": "decision",
    "contentPattern": "architect",
    "limit": 10
  }
}
```

### Add Node

```javascript
// Add a new fact
{
  "operation": "addNode",
  "input": {
    "id": "node-new12345",
    "type": "fact",
    "content": "API response time < 100ms",
    "confidence": 0.95,
    "source": "monitoring"
  }
}
```
