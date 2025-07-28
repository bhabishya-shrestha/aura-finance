# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | :white_check_mark: |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please follow these steps:

1. **Do not create a public GitHub issue** for security vulnerabilities
2. **Email us directly** at security@aura-finance.com
3. **Include detailed information** about the vulnerability
4. **Provide steps to reproduce** the issue
5. **Include any relevant code snippets**

## Current Security Status

### Known Vulnerabilities

#### esbuild (Moderate) - GHSA-67mh-4wv8-2f99

- **Status**: Acknowledged
- **Risk Level**: Moderate
- **Impact**: Development server only
- **Mitigation**:
  - Only affects development environment
  - Production builds are not vulnerable
  - Fixed in Vite 7.0.6 (planned for v1.2.0)
- **Timeline**: Will be addressed in next major version update

### Security Measures

#### Development Environment

- All development dependencies are isolated
- Development server runs on localhost only
- No production secrets in development

#### Production Environment

- HTTPS enforced on all connections
- Security headers configured in Vercel
- Environment variables properly secured
- No sensitive data in client-side code

#### Dependencies

- Regular security audits via GitHub Actions
- Automated vulnerability scanning
- Dependency updates scheduled monthly
- Critical updates applied immediately

## Security Headers

Our application includes the following security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## Data Protection

- All user data is encrypted in transit and at rest
- Supabase provides enterprise-grade security
- No sensitive financial data stored in client-side storage
- Plaid integration follows OAuth 2.0 security standards

## Compliance

- GDPR compliant data handling
- CCPA compliance for California users
- SOC 2 Type II compliance via Supabase
- PCI DSS compliance for financial data

## Security Updates

- Critical security updates: Within 24 hours
- High severity updates: Within 72 hours
- Medium severity updates: Within 1 week
- Low severity updates: Within 1 month

## Contact

For security-related issues:

- Email: security@aura-finance.com
- Response time: Within 24 hours
- PGP Key: Available upon request

## Bug Bounty

We currently do not have a formal bug bounty program, but we appreciate security researchers who responsibly disclose vulnerabilities.

---

**Last Updated**: January 2025
**Next Review**: February 2025
