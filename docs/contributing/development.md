# Development Guide

Guide for developing and extending EAOS.

## Project Structure

```
eaos-skill/
├── agents/          # AI agent definitions
├── core/            # Core system modules
├── modules/         # Feature modules
├── compliance/      # Compliance engines
├── manifests/       # JSON schemas
├── cli/             # CLI implementation
├── scripts/         # Build scripts
├── tests/           # Test suites
└── docs/            # Documentation
```

## Adding a New Agent

1. Create agent file in `agents/`:

```markdown
# My Agent

## Purpose
Brief description of the agent's role.

## Responsibilities
- Responsibility 1
- Responsibility 2

## Capabilities
...

## Safety Constraints
- NEVER do X
- MUST do Y
```

2. Register in manifest

## Adding a New Command

1. Add command handler in `cli/eaos.js`
2. Register in `manifests/COMMAND_REGISTRY.json`
3. Add tests
4. Update documentation

## Testing

### Unit Tests

```bash
npm test
```

### Contract Tests

```bash
node --test tests/contract.test.js
```

### Safety Tests

```bash
node --test tests/prompt-safety.test.js
```

### Behavioral Tests

```bash
node --test tests/behavioral.test.js
```

## Validation

```bash
# Run all validations
npm run test:validate

# Lint prompts
npm run lint:prompts
```

## Building Documentation

```bash
# Install mkdocs
pip install mkdocs-material

# Serve locally
mkdocs serve

# Build static site
mkdocs build
```

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create git tag
4. Push to GitHub
5. Create GitHub Release
