# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within `@vetwo/repo-fetch`, please send an email to [security@vetwo.dev](mailto:security@vetwo.dev). All security vulnerabilities will be promptly addressed.

**Please do NOT report security vulnerabilities through public GitHub issues.**

### What to Include

When reporting a vulnerability, please include:

- **Description** of the vulnerability
- **Steps to reproduce** the issue
- **Potential impact**
- **Suggested fix** (if available)

### Response Timeline

- **Acknowledgment**: Within 24 hours
- **Initial assessment**: Within 48 hours
- **Fix timeline**: Depends on severity

### Disclosure Policy

- We will coordinate with you on the disclosure timeline
- We will credit reporters in the security advisory
- We follow responsible disclosure practices

## Security Best Practices

### Token Security

- **Never commit tokens** to version control
- Use environment variables for tokens
- Use `.env` files (and add to `.gitignore`)
- Rotate tokens regularly
- Use minimal scopes

### Recommended Token Scopes

**GitHub:**
- `repo` - Full control of private repositories
- `public_repo` - Access public repositories only (if needed)

**GitLab:**
- `read_repository` - Read repository files

### Environment Setup

```bash
# Set token via environment variable
export REPO_FETCH_TOKEN=your_token_here

# Or use .gitignore'd .env file
echo "REPO_FETCH_TOKEN=your_token_here" >> .env
echo ".env" >> .gitignore
```

## Security Features

- **Token masking** in logs and error messages
- **Rate limiting awareness** with automatic retry
- **Timeout protection** for hanging requests
- **Input validation** via Zod schemas
- **No filesystem writes** outside designated directories

## Updates

Security updates are released as patch versions and announced via:

- GitHub Security Advisories
- npm advisory emails
- Project changelog

## Contact

For security concerns, contact: [security@vetwo.dev](mailto:security@vetwo.dev)
