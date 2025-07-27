# 🤝 Contributing to Aura Finance

Thank you for your interest in contributing to Aura Finance! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/aura-finance.git
   cd aura-finance
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start development server:
   ```bash
   npm run dev
   ```

## 🔄 Development Workflow

### Branch Strategy

We use a **Git Flow** approach:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature branches
- `hotfix/*` - Critical bug fixes
- `release/*` - Release preparation

### Creating a Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: adding tests
chore: maintenance tasks
```

## 📝 Code Standards

### JavaScript/React

- Use functional components with hooks
- Follow ESLint configuration
- Use TypeScript for new features (when possible)
- Write self-documenting code
- Add JSDoc comments for complex functions

### CSS/Styling

- Use Tailwind CSS utility classes
- Follow the modern design system with clean, responsive layouts
- Maintain responsive design principles
- Use CSS custom properties for theming

### File Structure

```
src/
├── components/     # React components
├── utils/         # Utility functions
├── hooks/         # Custom React hooks
├── store/         # State management
└── types/         # TypeScript types
```

## 🧪 Testing

### Running Tests

```bash
npm test              # Run all tests
npm run test:ui       # Run tests with UI
npm run test:coverage # Run tests with coverage
```

### Writing Tests

- Write unit tests for utility functions
- Write component tests for React components
- Test user interactions and edge cases
- Maintain >80% code coverage

## 🔄 Pull Request Process

1. **Create Feature Branch**: From `develop`
2. **Make Changes**: Follow code standards
3. **Test**: Ensure all tests pass
4. **Lint**: Run `npm run lint`
5. **Format**: Run `npm run format`
6. **Commit**: Use conventional commits
7. **Push**: Push to your fork
8. **Create PR**: Against `develop` branch
9. **Review**: Address feedback
10. **Merge**: After approval

### PR Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Cross-browser tested

## 🐛 Issue Reporting

### Bug Reports

Use the bug report template and include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots if applicable

### Feature Requests

Use the feature request template and include:

- Clear description of the feature
- Problem it solves
- Proposed solution
- Mockups if applicable

## 🏷️ Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements to documentation
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `priority: high` - High priority issues
- `priority: low` - Low priority issues

## 📞 Getting Help

- **Discussions**: Use GitHub Discussions
- **Issues**: Create an issue for bugs/features
- **Documentation**: Check README.md and docs/

## 🎉 Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes
- GitHub contributors page

Thank you for contributing to Aura Finance! 🚀
