# Support

## Getting Help

### Documentation

- **README** - Quick start and overview
- **API Reference** - Complete API documentation
- **CLI Reference** - Command-line interface guide
- **Architecture** - System design and internals

### Community

- **GitHub Discussions** - Ask questions, share ideas
- **GitHub Issues** - Bug reports and feature requests
- **Twitter** - Follow for updates [@vetwo](https://twitter.com/vetwo)

### Resources

- **Examples** - Code examples in `examples/` directory
- **Contributing Guide** - How to contribute

## Troubleshooting

### Common Issues

#### Rate Limiting

**Problem:** `403 Forbidden` or "Rate limit exceeded"

**Solution:**
```bash
# Set a GitHub token
export GITHUB_TOKEN=your_token_here

# Or use the --token flag
repo-fetch browse user/repo --token ghp_xxxx
```

#### Authentication Required

**Problem:** `401 Unauthorized` or "Permission denied"

**Solution:**
1. Create a Personal Access Token:
   - GitHub: Settings → Developer settings → Personal access tokens
   - GitLab: Settings → Access Tokens
   - Bitbucket: Settings → App passwords
2. Set the token:
   ```bash
   export REPO_FETCH_TOKEN=your_token_here
   ```

#### File Not Found

**Problem:** `404 Not Found` or "Path not found"

**Solution:**
```bash
# Check repository structure first
repo-fetch tree user/repo

# Verify the path exists
repo-fetch search user/repo filename
```

#### Network Errors

**Problem:** `NetworkError` or timeout

**Solution:**
1. Check internet connection
2. Try with increased timeout:
   ```bash
   repo-fetch download user/repo --timeout 60000
   ```
3. Try with retries:
   ```bash
   repo-fetch download user/repo --retries 5
   ```

#### Permission Denied

**Problem:** Cannot write to output directory

**Solution:**
```bash
# Check permissions
repo-fetch doctor

# Try a different output directory
repo-fetch download user/repo --output ~/downloads
```

### Debug Mode

Run diagnostics to check your setup:

```bash
repo-fetch doctor
```

This checks:
- Internet connectivity
- GitHub API access
- Node.js version
- File system permissions
- Output directory
- Cache health

## Feature Requests

Have an idea? [Open a feature request](https://github.com/vetwo/repo-fetch/issues/new?template=feature_request.yml) or start a [Discussion](https://github.com/vetwo/repo-fetch/discussions).

## Bug Reports

Found a bug? [Open a bug report](https://github.com/vetwo/repo-fetch/issues/new?template=bug_report.yml) with:
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, package version)

## Security Issues

See [SECURITY.md](SECURITY.md) for reporting security vulnerabilities.

## Commercial Support

For commercial support inquiries, contact: [support@vetwo.dev](mailto:support@vetwo.dev)
