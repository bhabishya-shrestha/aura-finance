# Changelog

All notable changes to Aura Finance will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-01-01

### Added

- **Enhanced Mobile Experience**: Optimized mobile navigation and responsive design
- **Improved PDF Import**: Enhanced PDF parsing with better error handling and validation
- **Professional Versioning**: Implemented proper semantic versioning and release procedures
- **Mobile UI Fixes**: Fixed squished bottom navigation and touch interaction issues

### Fixed

- **Mobile Navigation**: Resolved bottom navigation bar spacing and touch target issues
- **PDF Import Validation**: Improved PDF file validation and error messaging
- **Responsive Design**: Enhanced mobile layout for better usability on small screens
- **Touch Interactions**: Optimized touch targets and gesture handling for mobile devices

### Technical Improvements

- **Error Handling**: Better error messages for PDF import failures
- **Mobile Optimization**: Improved responsive breakpoints and mobile-first design
- **Code Quality**: Enhanced component safety and mobile accessibility
- **Performance**: Optimized mobile rendering and touch response

## [Unreleased]

### Planned

- Advanced analytics and charts
- Export functionality (CSV/PDF)
- Budget tracking features
- Goal setting and monitoring
- Performance optimizations

## [1.0.1] - 2025-01-01

### Added

- **OAuth Authentication**: Complete GitHub and Google OAuth integration
- **OAuth Setup Scripts**: Automated OAuth configuration scripts
- **Mobile Optimization**: iPhone 15 Pro and responsive mobile layouts
- **User Interface Fixes**: Proper Supabase user object handling

### Fixed

- **Authentication Flow**: Fixed user.name references in Header and Sidebar components
- **OAuth Callback**: Improved error handling in AuthCallbackPage
- **Mobile Responsiveness**: Enhanced mobile layout and touch interactions
- **User Display**: Safe fallbacks for user display names from OAuth providers

### Technical Improvements

- **OAuth Scripts**: Added configure-oauth.js, setup-oauth.js, verify-oauth.js
- **Error Handling**: Better error messages and fallback states
- **Mobile UX**: Optimized for iPhone 15 Pro and modern mobile devices
- **Code Quality**: Improved component safety and error boundaries

## [1.0.0] - 2025-07-27

### Added

- **Initial Release**: Complete personal finance dashboard
- **Authentication**: Supabase Auth with email/password and OAuth 2.0
- **OAuth Providers**: GitHub and Google OAuth integration
- **Session Persistence**: Automatic session management and persistence
- **Database**: PostgreSQL with Row Level Security (RLS)
- **User Management**: Secure user isolation and data protection
- **Account Management**: Multiple account types (checking, savings, credit, investment)
- **Transaction Tracking**: Full CRUD operations for transactions
- **Category Management**: Custom categories with colors and icons
- **Net Worth Calculation**: Real-time net worth tracking
- **Data Import**: CSV and PDF statement import with OCR
- **Responsive Design**: Mobile-first design with dark mode
- **Real-time Sync**: Automatic data synchronization across devices
- **Security**: Comprehensive RLS policies and secure authentication
- **Routing**: React Router with protected routes and OAuth callbacks

### Technical Features

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand for lightweight state
- **Database**: Supabase PostgreSQL with real-time subscriptions
- **Deployment**: Vercel hosting with custom domain
- **Testing**: Vitest and React Testing Library setup
- **Code Quality**: ESLint, Prettier, and comprehensive linting rules

### Infrastructure

- **Hosting**: Vercel (free tier)
- **Database**: Supabase (free tier)
- **Domain**: aura-finance-tool.vercel.app
- **Cost**: $0/month (free tiers)

## [0.2.0] - 2025-07-27

### Added

- **Supabase Integration**: Migrated from local-first to cloud architecture
- **Database Schema**: Complete PostgreSQL schema with RLS policies
- **Authentication System**: Supabase Auth integration
- **Real-time Features**: Live data synchronization
- **Deployment**: Production deployment on Vercel
- **Security**: Comprehensive security documentation and practices

### Changed

- **Architecture**: From local-first to cloud-first approach
- **Database**: From IndexedDB to PostgreSQL
- **Authentication**: From local auth to Supabase Auth
- **Deployment**: From local-only to production deployment

### Removed

- **Local Database**: Removed Dexie.js IndexedDB setup
- **Backend Server**: Removed Express.js backend
- **Docker Setup**: Removed Docker configuration
- **Local Development Scripts**: Simplified development workflow

## [0.1.0] - 2025-07-27

### Added

- **Initial Setup**: React + Vite project structure
- **UI Components**: Modern design system with Tailwind CSS
- **Local Database**: IndexedDB setup with Dexie.js
- **Basic Features**: Account and transaction management
- **Import System**: CSV and PDF statement parsing
- **Testing Setup**: Vitest and React Testing Library
- **Code Quality**: ESLint and Prettier configuration

---

## Version History

- **1.0.0**: Production-ready personal finance dashboard
- **0.2.0**: Cloud migration and deployment
- **0.1.0**: Initial local-first prototype

## Release Process

1. **Development**: Features developed in `main` branch
2. **Testing**: Local and staging testing
3. **Version Bump**: Update version in `package.json`
4. **Changelog**: Document changes in `CHANGELOG.md`
5. **Git Tag**: Create version tag
6. **Deploy**: Deploy to production
7. **Release**: Create GitHub release

## Semantic Versioning

- **MAJOR**: Breaking changes (1.0.0 → 2.0.0)
- **MINOR**: New features, backward compatible (1.0.0 → 1.1.0)
- **PATCH**: Bug fixes, backward compatible (1.0.0 → 1.0.1)
