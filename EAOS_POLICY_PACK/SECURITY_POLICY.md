# SECURITY POLICY (SOC-2, ISO 27001 A.5–A.18, ISO 42001)
Purpose: Establish security controls, governance, and enforcement boundaries.

1. Governance
- Security Officer appointed
- Quarterly review cycle
- Incident reporting channels defined

2. Access Control
- RBAC enforced
- MFA required
- No shared accounts
- Least privilege required

3. Data Protection
- Encryption-at-rest (AES-256)
- Encryption-in-transit (TLS 1.2+)
- Secrets stored in vault
- Key rotation every 180 days

4. Secure Development
- Mandatory code reviews
- SAST/DAST required
- Dependency scanning mandatory

5. Monitoring & Logging
- Logs immutable
- SIEM integrated
- Alerting with severity thresholds

6. Incident Response
- RACI model defined
- 4-stage escalation plan
- 24h acknowledgment SLA

7. Change Management
- All changes require:
  - ticket  
  - PR review  
  - approval  
  - audit logging  

8. Business Continuity
- DR plan  
- RTO, RPO defined  
- Annual failover test  

