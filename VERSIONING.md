# Versioning Policy

EAOS follows [Semantic Versioning 2.0.0](https://semver.org/).

## Version Format

```
MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]
```

Examples:
- `1.0.0` - Stable release
- `1.0.0-beta.1` - Beta pre-release
- `1.0.0-alpha.1` - Alpha pre-release
- `1.0.0-rc.1` - Release candidate

## Version Increments

### MAJOR (X.0.0)
Breaking changes that require user action:
- Removal of CLI commands
- Changes to agent contract interfaces
- Breaking changes to memory kernel format
- Incompatible schema changes
- Removal of compliance frameworks

### MINOR (0.X.0)
Backwards-compatible additions:
- New CLI commands
- New agents or modules
- New compliance frameworks
- New configuration options
- Performance improvements
- New optional features

### PATCH (0.0.X)
Backwards-compatible fixes:
- Bug fixes
- Security patches
- Documentation updates
- Minor performance fixes
- Dependency updates (non-breaking)

## Pre-release Versions

### Alpha (`-alpha.N`)
- Early development
- APIs may change significantly
- Not recommended for production
- Limited testing

### Beta (`-beta.N`)
- Feature complete for release
- APIs mostly stable
- Suitable for testing
- May have known issues

### Release Candidate (`-rc.N`)
- Production-ready candidate
- APIs frozen
- Final testing phase
- No known critical issues

## Release Cycle

```
Development → Alpha → Beta → RC → Stable
     ↑                              ↓
     └──────── Feedback ────────────┘
```

### Typical Timeline
- Alpha: 2-4 weeks
- Beta: 2-4 weeks
- RC: 1-2 weeks
- Stable: Long-term support

## Branch Strategy

| Branch | Purpose | Version |
|--------|---------|---------|
| `main` | Stable releases | Latest stable |
| `develop` | Development | Next minor/major |
| `release/X.Y` | Release preparation | Specific version |
| `hotfix/X.Y.Z` | Critical fixes | Patch version |

## Deprecation Policy

1. **Announce**: Document deprecation in CHANGELOG
2. **Warning**: Show runtime deprecation warnings
3. **Grace Period**: Minimum 2 minor versions
4. **Removal**: Remove in next major version

Example timeline:
- v1.2.0: Feature X deprecated (warning added)
- v1.3.0: Feature X still works (continued warning)
- v2.0.0: Feature X removed

## Compatibility Matrix

| EAOS Version | Node.js | Claude Code |
|--------------|---------|-------------|
| 1.0.x | ≥18.0.0 | Latest |
| 2.0.x (planned) | ≥20.0.0 | Latest |

## Version Checking

```bash
# Check installed version
node cli/eaos.js --version

# Check in code
import pkg from './package.json' assert { type: 'json' };
console.log(pkg.version);
```

## Changelog

All version changes are documented in [CHANGELOG.md](CHANGELOG.md).

Format follows [Keep a Changelog](https://keepachangelog.com/):
- Added
- Changed
- Deprecated
- Removed
- Fixed
- Security

## Questions

For versioning questions, open a GitHub Discussion.
