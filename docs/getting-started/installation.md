# Installation

This guide covers installing EAOS and its dependencies.

## Prerequisites

- **Node.js** 18.x or later
- **npm** 9.x or later
- **Claude Code** CLI installed and configured

## Install from npm

```bash
npm install @eaos/cli
```

## Install from Source

```bash
# Clone the repository
git clone https://github.com/Ethical-AI-Syndicate/eaos-skill.git
cd eaos-skill

# Install dependencies
npm install

# Link for global access (optional)
npm link
```

## Verify Installation

```bash
# Check version
npx eaos --version

# Show help
npx eaos --help
```

## Directory Structure

After installation, you'll have:

```
eaos-skill/
├── agents/           # AI agent definitions
├── core/             # Core system modules
├── modules/          # Feature modules
├── compliance/       # Compliance engines
├── manifests/        # JSON schemas and configs
├── memory/           # Runtime state (created on init)
├── cli/              # CLI implementation
└── tests/            # Test suites
```

## Next Steps

- [Quick Start Guide](quickstart.md) - Get up and running
- [Configuration](configuration.md) - Customize your installation
