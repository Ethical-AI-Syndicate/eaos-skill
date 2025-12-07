# Security

For security information, please see:

- [Security Policy](https://github.com/Ethical-AI-Syndicate/eaos-skill/blob/main/SECURITY.md)

## Reporting Vulnerabilities

If you discover a security vulnerability, please:

1. **Do NOT** open a public issue
2. Email security@ethical-ai-syndicate.dev
3. Include detailed description and steps to reproduce
4. Allow 90 days for resolution before public disclosure

## Security Features

### Human Decision Matrix

All sensitive operations require human approval:

- Level 0-1: Auto-execute with logging
- Level 2+: Human approval required

### Prompt Safety

Built-in scanning for:

- Hardcoded secrets
- Dangerous commands
- Prompt injection patterns

### Audit Logging

All operations are logged for compliance and security review.

### Sandboxed Execution

Operations run in isolated environments with limited permissions.

## Security Best Practices

1. Never commit secrets to the repository
2. Use environment variables for sensitive data
3. Enable autonomy mode only when needed
4. Review audit logs regularly
5. Keep dependencies updated
