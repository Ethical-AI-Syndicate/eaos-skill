# EAOS COMMAND LINE INTERFACE (CLI) REFERENCE

Version: 1.0.0  
Audience: Engineering, Platform, DevOps, CTO Office

---

# 1. OVERVIEW

The EAOS CLI is the primary interface for:
- running audits  
- spinning simulation engines  
- generating BEADS  
- managing releases  
- triggering autonomy cycles  
- executing compliance workflows  

---

# 2. CORE COMMANDS

## Initialize EAOS
```shell
eaos init
```

## Show System Status
```shell
eaos status
```

---

# 3. INTELLIGENCE ENGINES

## Multiverse Engine
```shell
eaos multiverse simulate "<scenario>"
eaos multiverse compare
eaos multiverse best
```

## Quantum Planner
```shell
eaos quantum plan "<topic>"
eaos quantum branches
eaos quantum merge
```

## Sandbox Mode
```shell
eaos simulate "<scenario>"
```

---

# 4. GOVERNANCE

## Human Decision Matrix
```shell
eaos decisions pending
eaos approve <id>
eaos reject <id>
```

---

# 5. OPERATIONAL MODULES

## PR Bot
```shell
eaos pr generate
eaos pr validate
```

## Audit Pipeline
```shell
eaos audit full
eaos audit security
eaos audit performance
```

## Release Train
```shell
eaos release train
eaos release status
```

---

# 6. BEADS SYSTEM
```shell
eaos beads list
eaos beads create
eaos beads prioritize
```

---

# 7. AUTONOMY ENGINE
```shell
eaos autonomy on
eaos autonomy off
eaos autonomy status
```

---

# 8. SWARM MODE
```shell
eaos swarm join <repo>
eaos swarm sync
eaos swarm global dashboard
```

---

# 9. EXECUTIVE OUTPUTS
```shell
eaos board pack
eaos cxo dashboard
eaos marketing campaign
eaos sales brief
```

---

# 10. FINOPS
```shell
eaos costs analyze
eaos costs optimize
eaos costs forecast
```

---

# 11. COMPLIANCE
```shell
eaos soc2 map
eaos soc2 gaps
eaos soc2 evidence
```

---

# 12. HELP
```shell
eaos help
```
