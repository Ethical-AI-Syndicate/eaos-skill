# Contributing to EAOS

Thank you for your interest in contributing to the Enterprise AI Operating System (EAOS)! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/eaos-skill.git
   cd eaos-skill
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/Ethical-AI-Syndicate/eaos-skill.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Initialize EAOS**:
   ```bash
   npm run init
   ```

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### Environment

No environment variables are required for basic development. For advanced features:

```bash
# Optional: Set log level
export EAOS_LOG_LEVEL=debug

# Optional: Set log format (json or human)
export EAOS_LOG_FORMAT=human
```

### Running Tests

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run all tests
npm run test:all

# Run validation suite
npm run test:validate
```

## Project Structure

```
eaos-skill/
├── agents/          # Strategic AI agents (CTO, CFO, CIO, CRO)
├── core/            # Core intelligence layer (Memory Kernel, Autonomy, etc.)
├── modules/         # Operational modules (PR Bot, Release Train, etc.)
├── compliance/      # Compliance engines (SOC-2, ISO 27001, NIST)
├── cli/             # Command-line interface
├── tests/           # Test suites
├── scripts/         # Build and utility scripts
├── manifests/       # JSON schemas and registries
├── executive/       # Executive dashboards and reporting
├── finance/         # Financial operations modules
├── sales/           # Sales enablement modules
├── marketing/       # Marketing and GTM modules
└── skills/          # Skill loader and definitions
```

### Core vs Optional Components

**Core (Required)**:
- `core/` - All intelligence layer components
- `agents/master_orchestrator.claude` - Primary routing
- `cli/` - Command-line interface
- `manifests/` - Schemas and registries

**Optional (Can be disabled)**:
- `compliance/` - Compliance engines
- `executive/` - Executive reporting
- `finance/`, `sales/`, `marketing/` - Business modules
- `modules/` - Operational automation

## Making Changes

### Branch Naming

Use descriptive branch names:

- `feat/add-new-agent` - New features
- `fix/memory-kernel-bug` - Bug fixes
- `docs/update-readme` - Documentation
- `refactor/cli-cleanup` - Code refactoring
- `test/add-integration-tests` - Test additions

### Workflow

1. **Create a branch** from `main`:
   ```bash
   git checkout main
   git pull upstream main
   git checkout -b feat/your-feature
   ```

2. **Make your changes** following our code style

3. **Run tests** to ensure nothing is broken:
   ```bash
   npm run test:all
   ```

4. **Commit your changes** using conventional commits

5. **Push to your fork**:
   ```bash
   git push origin feat/your-feature
   ```

6. **Open a Pull Request** against `main`

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting, semicolons, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks
- `perf` - Performance improvements
- `ci` - CI/CD changes

### Examples

```bash
feat(cli): add quantum planning command
fix(memory): resolve state persistence issue
docs(readme): update installation instructions
test(integration): add compliance workflow tests
```

## Pull Request Process

1. **Fill out the PR template** completely
2. **Ensure CI passes** - all tests and validations must pass
3. **Request review** from maintainers
4. **Address feedback** promptly
5. **Squash commits** if requested before merge

### PR Checklist

- [ ] Tests added/updated for changes
- [ ] Documentation updated if needed
- [ ] CHANGELOG.md updated for user-facing changes
- [ ] No new linting errors
- [ ] Pre-commit hooks pass

## Code Style

### JavaScript

We use ESLint and Prettier for code formatting:

```bash
# Check linting
npm run lint

# Format code
npm run format
```

Key rules:
- 2 spaces for indentation
- Single quotes for strings
- Semicolons required
- No trailing commas
- Max line length: 100 characters

### Claude Skill Files (.claude)

For `.claude` files, follow these conventions:

1. **Header block** with title, version, and description
2. **Clear section separators** using markdown headers
3. **Structured output formats** defined for all agents
4. **Safety constraints** explicitly stated

Example structure:
```markdown
# Agent Name

## Purpose
[Clear description of what this agent does]

## Input Schema
[Expected inputs]

## Output Schema
[Structured output format]

## Safety Constraints
[Explicit safety rules]

## Integration Points
[How it connects to other components]
```

## Testing

### Unit Tests

Located in `tests/cli.test.js`. Test individual commands and utilities.

### Integration Tests

Located in `tests/integration.test.js`. Test end-to-end workflows.

### Writing Tests

```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert';

describe('Feature Name', () => {
  test('should do something specific', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = someFunction(input);

    // Assert
    assert.strictEqual(result, expected);
  });
});
```

## Documentation

### README Updates

Update `README.md` for:
- New features
- Changed commands
- Updated installation steps

### Inline Documentation

- Add JSDoc comments for JavaScript functions
- Add clear comments in `.claude` files explaining complex logic

### Architecture Changes

For significant changes, update:
- `EAOS_ARCHITECTURE_OVERVIEW.md`
- Relevant diagrams
- `CHANGELOG.md`

## Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions or ideas

Thank you for contributing to EAOS!
