# Configuration

EAOS is configured through `.eaos.config.json` in your project root.

## Configuration File

```json
{
  "version": "1.0.0",
  "memory_kernel": {
    "path": "memory/",
    "auto_persist": true
  },
  "autonomy": {
    "enabled": false,
    "max_level": 2
  },
  "compliance": {
    "frameworks": ["soc2", "iso27001"],
    "auto_scan": false
  }
}
```

## Options Reference

### memory_kernel

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `path` | string | `memory/` | Directory for memory storage |
| `auto_persist` | boolean | `true` | Auto-save state changes |

### autonomy

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `false` | Enable autonomous operation |
| `max_level` | number | `2` | Maximum approval level (0-4) |

### compliance

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `frameworks` | array | `[]` | Active compliance frameworks |
| `auto_scan` | boolean | `false` | Run compliance on commit |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EAOS_DEBUG` | Enable debug logging |
| `EAOS_CONFIG_PATH` | Custom config file path |
| `EAOS_MEMORY_PATH` | Override memory directory |

## Example: Enable Autonomy

```json
{
  "autonomy": {
    "enabled": true,
    "max_level": 1
  }
}
```

Then enable in CLI:
```bash
npx eaos autonomy on
```
