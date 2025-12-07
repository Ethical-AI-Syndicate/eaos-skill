# Contributing Guidelines

Thank you for your interest in contributing to EAOS!

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a feature branch
4. Make your changes
5. Submit a pull request

## Development Setup

```bash
git clone https://github.com/YOUR-USERNAME/eaos-skill.git
cd eaos-skill
npm install
npm test
```

## Code Standards

### JavaScript

- Use ES modules (`import`/`export`)
- Follow existing code style
- Add JSDoc comments for public APIs

### .claude Files

- Follow prompt template structure
- Include safety constraints
- Document approval levels

### Tests

- Add tests for new features
- Maintain test coverage
- Run all tests before submitting

```bash
npm test
node --test tests/contract.test.js
node --test tests/prompt-safety.test.js
node --test tests/behavioral.test.js
```

## Pull Request Process

1. Update documentation
2. Add tests for new functionality
3. Ensure all tests pass
4. Update CHANGELOG.md
5. Request review from maintainers

## Commit Messages

Follow conventional commits:

```
feat: add new compliance engine
fix: resolve memory leak in kernel
docs: update API reference
test: add integration tests
```

## Reporting Issues

Use GitHub Issues with:

- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details

## Code of Conduct

- Be respectful
- Welcome newcomers
- Focus on constructive feedback
- Follow project guidelines
