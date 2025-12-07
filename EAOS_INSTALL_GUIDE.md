# EAOS INSTALL & SETUP GUIDE
Enterprise AI Operating System — Installation, Bootstrapping & Runtime Configuration

Version: 1.0.0
Audience: Engineering, DevOps, Platform, CTO Office
Status: Production-Ready

---

# 1. INTRODUCTION

EAOS (Enterprise AI Operating System) is a multi-agent orchestration layer designed to:
- continuously analyze, repair, and optimize codebases
- govern enterprise workflows (compliance, security, GTM, financial, operational)
- operate autonomously via cycles, triggers, and governance rules
- integrate into multi-repo architectures with Swarm Mode
- provide deterministic reasoning and executive-level outputs

This guide describes how to install, configure, and operate EAOS locally or in a CI/CD environment.

---

# 2. SYSTEM REQUIREMENTS

## Minimum
- Node.js ≥ 18 LTS
- Python ≥ 3.10
- Git ≥ 2.35
- Claude Code enabled with Skill Runtime
- Docker ≥ 24.x
- 4 GB RAM

## Recommended (Production)
- Node.js ≥ 20
- Python 3.11+
- GitHub Actions or GitLab CI
- Claude Code API Runtime Agents
- Dedicated EAOS runner (container or VM)
- 16 GB RAM + SSD

---

# 3. REPOSITORY STRUCTURE

EAOS expects the following directory layout:

```
/agents/ # all high-level strategic agents
/core/ # memory, simulation, autonomy engines
/modules/ # operational systems (PR bot, audits, release train)
/executive/ # board pack, dashboards
/finance/ # FinOps, CFO models
/sales/ # sales engineer artifacts
/marketing/ # GTM & branding systems
/compliance/ # SOC-2, ISO, NIST engines
/cli/ # EAOS CLI tool
/docs/ # documentation
/beads/ # structured task objects
/release/ # release train artifacts
/audit/ # audit outputs
/memory/ # memory kernel snapshots
/monthly/ # autonomous monthly cycles
```

---

# 4. INSTALLATION

## Step 1 — Clone Repository
```shell
git clone <repo_url>
cd eaos
```

## Step 2 — Install Dependencies
```shell
npm install
pip install -r requirements.txt
```

## Step 3 — Create `.eaos.config.json`
Create a root configuration file:

```json
{
"memory_kernel": "./memory/state.json",
"agents_path": "./agents",
"modules_path": "./modules",
"compliance": {
"soc2": true,
"iso": true,
"nist": true
},
"swarm": {
"enabled": false,
"peers": []
}
}
```

---

# 5. BOOTSTRAPPING EAOS

Initialize system state:

```shell
eaos init
```

This command:
- creates memory kernel baseline  
- loads agents  
- verifies directory structure  
- registers version metadata  
- runs initial “health audit”  

---

# 6. RUNNING EAOS LOCALLY

## Run Executive Dashboard
```
eaos dashboard
```

## Run Full Audit
```
eaos audit full
```

## Run Monthly Cycle (manual trigger)
```
eaos monthly run
```

## Run Multiverse Forecast
```
eaos multiverse simulate "Q2 Strategy"
```

## Generate BEADS
```
eaos beads create
```

---

# 7. CI/CD INTEGRATION

Add to GitHub Actions:

```yaml
name: Run EAOS Audit
run: eaos audit full

name: Run Release Train
if: github.ref == 'refs/heads/main'
run: eaos release train
```

---

# 8. SWARM MODE (Optional Multi-Repo)

Enable:

```shell
eaos swarm join <repo_name>
eaos swarm sync
eaos swarm global dashboard
```

---

# 9. UNINSTALL

Remove all generated artifacts:

```
eaos reset --hard
```

---

# 10. SUPPORT

Refer to:
- EAOS Architecture Overview
- EAOS CLI Reference
- EAOS Governance Guide
