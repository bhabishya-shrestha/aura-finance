# Branch Protection Rules

# This file documents the branch protection rules for the repository

## Main Branch Protection

- **Require pull request reviews before merging**: ✅ Enabled
- **Required approving reviews**: 1
- **Dismiss stale PR approvals when new commits are pushed**: ✅ Enabled
- **Require review from code owners**: ✅ Enabled
- **Require status checks to pass before merging**: ✅ Enabled
  - Required status checks:
    - Security & Code Quality
    - Dependency Management
    - Build & Test
    - Documentation Check
- **Require branches to be up to date before merging**: ✅ Enabled
- **Require signed commits**: ❌ Disabled (optional for now)
- **Require linear history**: ❌ Disabled (allow merge commits)
- **Include administrators**: ✅ Enabled
- **Restrict pushes that create files**: ❌ Disabled
- **Allow force pushes**: ❌ Disabled
- **Allow deletions**: ❌ Disabled

## Develop Branch Protection

- **Require pull request reviews before merging**: ✅ Enabled
- **Required approving reviews**: 1
- **Dismiss stale PR approvals when new commits are pushed**: ✅ Enabled
- **Require status checks to pass before merging**: ✅ Enabled
  - Required status checks:
    - Security & Code Quality
    - Build & Test
- **Require branches to be up to date before merging**: ✅ Enabled
- **Include administrators**: ✅ Enabled
- **Allow force pushes**: ❌ Disabled
- **Allow deletions**: ❌ Disabled

## Feature Branch Guidelines

- Branch naming: `feature/description-of-feature`
- Must be created from `develop` branch
- Must pass all CI checks before merging
- Must be reviewed by at least one team member
- Must be up to date with base branch before merging

## Hotfix Branch Guidelines

- Branch naming: `hotfix/description-of-fix`
- Must be created from `main` branch
- Must pass all CI checks before merging
- Must be reviewed by at least one team member
- Must be up to date with base branch before merging
- Must be merged back to both `main` and `develop`

## Release Branch Guidelines

- Branch naming: `release/version-number`
- Must be created from `develop` branch
- Must pass all CI checks before merging
- Must be reviewed by at least one team member
- Must be up to date with base branch before merging
- Must be merged to both `main` and `develop`
