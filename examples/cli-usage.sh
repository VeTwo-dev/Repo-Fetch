#!/usr/bin/env bash

# Interactive browse mode
repo-fetch browse
repo-fetch browse https://github.com/user/repo
repo-fetch browse user/repo

# Download entire repository
repo-fetch download user/repo
repo-fetch download user/repo --output ./my-project
repo-fetch download user/repo --overwrite --yes

# Download specific path
repo-fetch download user/repo --path src/components
repo-fetch download user/repo --path README.md

# Download by glob pattern
repo-fetch download user/repo --glob "**/*.ts"
repo-fetch download user/repo --glob "**/*.eta" --glob "!**/*.test.ts"

# Download by extension
repo-fetch download user/repo --ext ts,tsx,json

# Download specific branch
repo-fetch download user/repo#develop
repo-fetch download user/repo --branch main

# View repository tree
repo-fetch tree user/repo
repo-fetch tree user/repo --depth 3

# Search files
repo-fetch search user/repo docker
repo-fetch search user/repo "test" --case-sensitive
repo-fetch search user/repo config --max 20

# System diagnostics
repo-fetch doctor

# Cache management
repo-fetch cache
repo-fetch clear-cache

# With authentication token
repo-fetch browse user/repo --token ghp_xxxx
REPO_FETCH_TOKEN=ghp_xxxx repo-fetch download user/repo

# With custom config
repo-fetch download user/repo --config repo-fetch.config.ts
