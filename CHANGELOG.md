# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2025-01-27

### Added

- **Transactions Page**: Complete transaction management with filtering, sorting, and search functionality
- **Reports Page**: Financial analytics with category breakdown, monthly trends, and budget tracking
- **Mobile Sign-out**: User menu with sign-out functionality in mobile navigation
- **Enhanced Responsive Design**: Improved layout optimization for web browsers and mobile devices

### Fixed

- **OAuth Authentication**: Resolved hash-based token handling in callback page
- **Test Suite**: Updated OAuth tests to match current implementation
- **Mobile Layout**: Fixed responsive classes for better cross-device compatibility
- **Navigation**: Improved mobile navigation visibility and functionality

### Changed

- **App Layout**: Updated responsive breakpoints from `iphone15pro:` to standard `lg:` classes
- **Mobile Navigation**: Enhanced with user avatar and dropdown menu
- **Page Routing**: Added proper routes for Transactions and Reports pages

## [1.0.1] - 2025-01-27

### Added

- **Mobile Navigation**: iPhone 15 Pro optimized navigation component
- **Enhanced UI Components**: Improved sidebar, header, and mobile navigation
- **Responsive Design**: Better mobile and tablet layout support

### Fixed

- **Web Layout**: Restored proper web layout functionality
- **Mobile Overrides**: Removed conflicting mobile-specific CSS overrides
- **Navigation**: Fixed mobile navigation visibility and interaction

## [1.0.0] - 2025-01-27

### Added

- **Initial Release**: Complete financial management application
- **OAuth Authentication**: Google and GitHub login integration
- **Dashboard**: Financial overview with net worth tracking
- **Accounts Management**: Bank account and credit card management
- **Analytics**: Financial insights and reporting
- **Settings**: User preferences and account management
- **Responsive Design**: Mobile-first design approach
- **Dark Mode**: Theme switching functionality
- **Database Integration**: Supabase backend with real-time updates
- **Transaction Management**: Add, edit, and categorize transactions
- **Statement Import**: CSV file import functionality
- **Search and Filter**: Advanced transaction filtering and search
- **Security**: Secure authentication and data protection
- **Testing**: Comprehensive test suite with Vitest
- **Documentation**: Complete setup and deployment guides

### Technical Features

- **Frontend**: React 18 with Vite build system
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand for client-side state
- **Authentication**: Supabase Auth with OAuth providers
- **Database**: Supabase PostgreSQL with real-time subscriptions
- **Deployment**: Vercel with automatic CI/CD
- **Testing**: Vitest with React Testing Library
- **Code Quality**: ESLint and Prettier configuration
- **Version Control**: Git with conventional commits
- **Documentation**: Comprehensive README and setup guides

## [Unreleased]

### Planned Features

- **Advanced Analytics**: Enhanced financial reporting and insights
- **Budget Management**: Budget creation and tracking
- **Investment Tracking**: Portfolio management and performance
- **Multi-Currency Support**: International currency handling
- **Data Export**: Export functionality for tax and accounting
- **Mobile App**: Native mobile application
- **API Integration**: Third-party financial service integrations
- **Advanced Security**: Two-factor authentication and enhanced security
- **Performance Optimization**: Improved loading times and efficiency
- **Accessibility**: Enhanced accessibility features
