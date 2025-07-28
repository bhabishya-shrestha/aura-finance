# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | :white_check_mark: |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Known Security Issues

### Development Dependencies (Non-Critical)

**Issue**: esbuild <=0.24.2 vulnerability in development server

- **Severity**: Moderate
- **Impact**: Development environment only (not production)
- **Description**: esbuild enables any website to send requests to the development server and read the response
- **Status**: Acknowledged, planned for next major version
- **Resolution Plan**: Update to Vite 7.x in next major release (v1.2.0)

**Affected Dependencies**:

- vite (4.4.5) - needs update to 7.x
- vitest (0.34.4) - will be updated with vite
- esbuild - will be updated with vite

### Security Measures in Place

1. **Production Security**:
   - All production builds are secure and not affected by development vulnerabilities
   - Environment variables are properly secured
   - API keys are stored securely in environment variables

2. **Dependency Management**:
   - Regular security audits with `npm audit`
   - Automated security checks in CI/CD pipeline
   - Dependencies are pinned to specific versions

3. **Code Security**:
   - ESLint security rules enabled
   - No hardcoded secrets in codebase
   - Proper input validation and sanitization

## Reporting a Vulnerability

If you discover a security vulnerability, please:

1. **Do NOT create a public GitHub issue**
2. **Email**: [Your security email]
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Response Timeline

- **Initial Response**: Within 24 hours
- **Assessment**: Within 3 days
- **Fix Timeline**: Depends on severity
  - Critical: Immediate (1-7 days)
  - High: 1-2 weeks
  - Medium: 1-4 weeks
  - Low: Next release cycle

## Security Updates

Security updates will be released as:

- **Patch releases** (1.1.x) for critical/high severity issues
- **Minor releases** (1.x.0) for medium severity issues
- **Major releases** (x.0.0) for breaking changes or major updates

## Best Practices

1. **Keep dependencies updated**
2. **Run security audits regularly**
3. **Use environment variables for secrets**
4. **Validate all user inputs**
5. **Follow OWASP guidelines**
