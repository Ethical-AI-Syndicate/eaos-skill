# Changelog

All notable changes to EAOS (Enterprise AI Operating System) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-beta.2] - 2025-12-08

### Added

#### Governance & Security
- **CODEOWNERS** - Code review requirements by directory
- **SECURITY.md** - Vulnerability reporting policy
- **VERSIONING.md** - Semantic versioning and compatibility policy
- **CodeQL Scanning** - Automated security analysis

#### API Schemas
- **SKILL_CONTRACT_SCHEMA.json** - Skill definition contract
- **MEMORY_KERNEL_API_SCHEMA.json** - Memory operations API
- **AGENT_BOUNDARY_API_SCHEMA.json** - Inter-agent communication schema

#### Test Suite (74 tests)
- Contract tests (25) - Schema validation
- Prompt safety tests (10) - Security pattern detection
- Behavioral tests (27) - Agent orchestration verification

#### Documentation Site
- Full mkdocs-material documentation
- Auto-deployed to GitHub Pages
- Architecture, CLI, API, Compliance, Contributing guides

### Fixed
- Shell command injection vulnerability (CodeQL alert #13)
- GitHub Pages auto-enablement in docs workflow

---

## [1.0.0-beta] - 2025-12-07

### Added

#### Core Intelligence Layer
- **Memory Kernel** (`core/memory_kernel.claude`) - Persistent reasoning substrate with graph-based knowledge storage
- **Autonomy Mode** (`core/autonomy_mode.claude`) - Self-governing operational engine with approval gates
- **Sandbox Mode** (`core/sandbox_mode.claude`) - Single-scenario simulation for safe testing
- **Multiverse Engine** (`core/multiverse_engine.claude`) - Multi-future parallel simulation
- **Quantum Planner** (`core/quantum_planner.claude`) - Multi-path strategic reasoning across time horizons
- **Human Decision Matrix** (`core/human_decision_matrix.claude`) - 5-level governance approval system
- **Swarm Mode** (`core/swarm_mode.claude`) - Multi-repo distributed intelligence coordination

#### Strategic Agents
- **Master Orchestrator** (`agents/master_orchestrator.claude`) - Primary coordination and routing
- **Autonomous CTO** (`agents/autonomous_cto.claude`) - Technical strategy and architecture
- **CFO Agent** (`agents/cfo_agent.claude`) - Financial intelligence and FinOps
- **CIO Agent** (`agents/cio_agent.claude`) - IT governance and security
- **CRO Agent** (`agents/cro_agent.claude`) - Revenue and GTM strategy
- **Engineering Personas** (`agents/personas.claude`) - 7 specialized engineering roles

#### Operational Modules
- **PR Bot** (`modules/pr_bot.claude`) - Automated PR review and analysis
- **Release Train** (`modules/release_train.claude`) - Deployment orchestration
- **Audit Pipeline** (`modules/audit_pipeline.claude`) - Multi-spectrum security/compliance auditing
- **BEADS Manager** (`modules/beads_manager.claude`) - Structured task management
- **Self-Healing Monthly** (`modules/self_healing_monthly.claude`) - Autonomous maintenance cycles
- **CIW Agent** (`modules/ciw_agent.claude`) - Continuous Improvement Weekly

#### Compliance Engines
- **SOC-2 Engine** (`compliance/soc2_engine.claude`) - SOC-2 Type II compliance (35 controls)
- **ISO 27001 Engine** (`compliance/iso27001_engine.claude`) - ISO 27001:2022 (114 Annex A controls)
- **NIST Engine** (`compliance/nist_engine.claude`) - NIST 800-53 Rev 5 (20 control families)

#### CLI Implementation
- Full CLI with 25+ commands (`cli/eaos.js`)
- Commands: init, status, audit, simulate, multiverse, quantum, beads, compliance, autonomy, dashboard, memory
- Pre-commit validation hooks

#### Observability
- **Structured Logger** (`core/logger.js`) - JSON/human formats, log levels, file rotation
- **Metrics Collector** (`core/metrics.js`) - Prometheus-compatible Counter/Gauge/Histogram

#### Testing
- 12 CLI unit tests (`tests/cli.test.js`)
- 35 integration tests (`tests/integration.test.js`)
- Declarative test specifications (`tests/eaos_skill_test.claude`)

#### CI/CD
- GitHub Actions CI pipeline (`.github/workflows/ci.yml`)
- Weekly audit workflow (`.github/workflows/audit.yml`)
- Husky pre-commit hooks

#### Documentation
- Architecture overview and diagrams
- Agent contracts and personality profiles
- Boot sequence specification
- CLI reference guide
- Deployment and installation guides
- Safety and governance policies
- 7 enterprise policies (Policy Pack)
- 5 operational playbooks
- Service blueprints and templates

### Security
- No hardcoded secrets or credentials
- Environment-based configuration
- Comprehensive .gitignore for sensitive files
- Security policy documentation

---

## [Unreleased]

### Planned
- OpenTelemetry tracing integration
- Grafana dashboard templates
- Test coverage reporting (c8/nyc)
- npm package publication
- Docker containerization
