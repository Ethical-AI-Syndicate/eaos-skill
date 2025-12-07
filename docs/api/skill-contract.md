# Skill Contract API

JSON Schema definition for EAOS skills.

## Schema Overview

Skills must conform to `manifests/SKILL_CONTRACT_SCHEMA.json`.

## Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Unique skill identifier |
| `version` | string | Semantic version |
| `description` | string | Human-readable description |
| `entrypoint` | string | Path to main .claude file |
| `capabilities` | array | List of capabilities |

## Example Skill Contract

```json
{
  "name": "my_skill",
  "version": "1.0.0",
  "description": "A custom EAOS skill for data processing",
  "entrypoint": "skills/my_skill/main.claude",
  "capabilities": [
    {
      "name": "process_data",
      "description": "Process incoming data",
      "inputSchema": {
        "type": "object",
        "properties": {
          "data": { "type": "string" }
        }
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "result": { "type": "string" }
        }
      },
      "approvalLevel": 1,
      "sideEffects": ["state_change"]
    }
  ],
  "dependencies": [
    {
      "skill": "memory_kernel",
      "version": ">=1.0.0"
    }
  ],
  "permissions": {
    "fileSystem": {
      "read": ["data/"],
      "write": ["output/"]
    },
    "network": false,
    "autonomy": false
  },
  "safetyConstraints": [
    "NEVER modify system files",
    "MUST validate all input"
  ]
}
```

## Capability Schema

Each capability defines:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Capability name |
| `description` | string | Yes | What it does |
| `inputSchema` | object | Yes | JSON Schema for input |
| `outputSchema` | object | Yes | JSON Schema for output |
| `approvalLevel` | integer | No | Required approval (1-5) |
| `sideEffects` | array | No | Possible side effects |

## Side Effects

| Value | Description |
|-------|-------------|
| `none` | No side effects |
| `file_write` | Writes files |
| `file_delete` | Deletes files |
| `network` | Makes network calls |
| `state_change` | Modifies system state |
| `external_api` | Calls external APIs |

## Permissions

Define what the skill can access:

```json
{
  "permissions": {
    "fileSystem": {
      "read": ["path/to/read/"],
      "write": ["path/to/write/"]
    },
    "network": true,
    "autonomy": false
  }
}
```
