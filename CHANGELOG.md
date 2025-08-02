# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Enhanced Analytics Dashboard with professional charts and visualizations
- AI-powered account assignment suggestions during transaction import
- Improved loading bar animations with better visual feedback
- Enhanced transaction grouping and categorization in import flow
- Real-time analytics refresh when transactions are imported
- Professional chart components with custom tooltips and gradients
- Detailed analytics view with transaction distribution analysis
- Quick actions panel for analytics export and insights

### Changed

- Completely redesigned Analytics page with modern UI/UX
- Enhanced account assignment modal with better transaction organization
- Improved import flow to ensure all transactions are properly assigned to accounts
- Updated loading animations to work consistently across web and mobile layouts
- Enhanced transaction categorization with visual icons and better grouping
- Improved analytics data refresh mechanism to ensure real-time updates

### Fixed

- Analytics not updating when transactions are imported from empty accounts
- Loading bar animation issues on web layouts
- Transactions being assigned to "uncategorized" account by default
- Analytics cache not being cleared when new transactions are added
- Import flow not properly handling account assignment for all transactions

### Technical

- Added analytics cache clearing mechanism in store
- Enhanced account suggestion algorithm with pattern matching
- Improved transaction grouping with AI-powered suggestions
- Added comprehensive error handling for import flow
- Enhanced UI components with better accessibility and responsiveness

## [1.1.0] - 2025-01-28

### Added

- Google Gemini AI integration for intelligent document analysis
- Support for image file uploads (JPG, PNG, GIF, WebP) in addition to CSV and PDF
- AI-powered OCR and smart document detection
- Intelligent parsing with confidence scoring
- Enhanced duplicate detection with configurable thresholds
- Comprehensive transaction categorization
- Professional-grade document processing pipeline

### Changed

- Enhanced StatementImporter with AI-powered capabilities
- Improved file validation and error handling
- Updated UI to reflect new AI-powered features
- Enhanced processing feedback with detailed progress tracking

### Technical

- Added Gemini AI service with rate limiting and validation
- Implemented comprehensive error handling and fallback mechanisms
- Enhanced file processing pipeline with multiple format support
- Added extensive unit tests for AI service functionality

## [1.0.0] - 2025-01-26

### Added

- Initial release of Aura Finance
- User authentication system with JWT tokens
- Transaction management with CRUD operations
- Account management with balance tracking
- Statement import functionality for CSV and PDF files
- Basic analytics and reporting features
- Responsive design with mobile support
- Dark mode support
- Professional Apple-inspired UI design

### Features

- Dashboard with net worth tracking
- Transaction history and categorization
- Account balance management
- Statement import from various file formats
- Basic financial analytics and charts
- User authentication and data persistence
- Responsive mobile-first design

### Technical

- React 18 with Vite build system
- Zustand for state management
- Dexie.js for IndexedDB storage
- Tailwind CSS for styling
- Lucide React for icons
- Comprehensive test suite with Vitest
- ESLint and Prettier for code quality
