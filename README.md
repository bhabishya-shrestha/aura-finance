# Aura Finance - Personal Finance Dashboard

A modern personal finance dashboard built with React and Supabase, designed to help you track expenses, manage accounts, and achieve your financial goals.

## 🎯 Project Overview

This is a personal project exploring modern web development. I am trying to improve on the following skills:

- **Full-stack development** with React and Supabase
- **Modern UI/UX** with responsive design and dark mode
- **Real-time data synchronization** across devices
- **Secure authentication** and data protection
- **Professional deployment** practices
- **Mobile-first design** with optimized touch interactions

## ✨ Features

### 🎨 Design & User Experience

- **Modern Interface**: Clean, responsive design that works on all devices
- **Dark Mode**: Sophisticated dark theme with proper contrast ratios
- **Mobile Optimized**: Enhanced mobile navigation and touch interactions
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Smooth Animations**: Subtle transitions and micro-interactions
- **Professional Typography**: Clear hierarchy and readable fonts

### ☁️ Cloud Architecture

- **Zero Cost Deployment**: Free tier hosting on Vercel + Supabase
- **Real-time Sync**: Automatic data synchronization across devices
- **Secure Authentication**: Built-in user management with Supabase Auth
- **Scalable Database**: PostgreSQL with Row Level Security
- **Global CDN**: Fast loading times worldwide

### 📊 Core Functionality

- **Net Worth Tracking**: Real-time calculation from all transactions
- **Account Management**: Multiple account types (checking, savings, credit)
- **Transaction History**: View and manage your financial records
- **Category Management**: Organize transactions with custom categories
- **Multi-user Support**: Secure user isolation with RLS
- **Financial Reports**: Comprehensive analytics and insights

### 📄 Smart Document Import

- **AI-Powered OCR**: Google Gemini AI for intelligent document analysis
- **Multi-Format Support**: CSV, PDF, and image files (JPG, PNG, GIF, WebP)
- **Smart Document Detection**: Automatically identifies receipts, bank statements, and credit card statements
- **Intelligent Parsing**: AI extracts transaction details with high accuracy
- **Real-time Preview**: See document analysis results before importing
- **Batch Import**: Review and edit transactions before importing
- **Duplicate Detection**: Automatically identifies duplicate entries
- **Confidence Scoring**: Shows AI analysis confidence levels

### 🔧 Technology Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS for utility-first styling
- **Database**: PostgreSQL on Supabase
- **Authentication**: Supabase Auth
- **State Management**: Zustand for lightweight state
- **Icons**: Lucide React for consistent iconography
- **Data Processing**: Papa Parse for CSV, Tesseract.js for PDF OCR
- **AI Integration**: Google Gemini API for intelligent document analysis

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Supabase account (free)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd aura-finance
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   # Copy the example environment file
   cp env.example .env

   # Edit .env with your actual values
   # Required: Supabase credentials
   # Optional: Gemini AI key for document analysis
   ```

4. **Set up Supabase (Required)**
   - Create a project at [https://app.supabase.com](https://app.supabase.com)
   - Get your project URL and anon key
   - Update `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`

5. **Set up Gemini AI (Optional but recommended)**
   - Get a free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Update `VITE_GEMINI_API_KEY` in `.env`
   - This enables AI-powered document analysis for receipts and statements

6. **Deploy database schema**

   ```bash
   supabase login
   supabase link --project-ref your_project_ref
   supabase db push
   ```

7. **Start the development server**

   ```bash
   npm run dev
   ```

8. **Open your browser**
   Navigate to `http://localhost:5173`

### 🎯 Demo Account

**Try the app instantly with our demo account:**

- **Email**: `test@gmail.com`
- **Password**: `demo123`
- **Demo URL**: https://aura-finance-tool.vercel.app/auth

**Setup demo account locally:**

```bash
# Create demo account with sample data
npm run demo:setup

# Show demo credentials
npm run demo:info
```

## 🚀 Deployment

### Professional Release Process

```bash
# Release a new patch version (1.1.0 → 1.1.1)
npm run release:patch

# Release a new minor version (1.1.0 → 1.2.0)
npm run release:minor

# Release a new major version (1.1.0 → 2.0.0)
npm run release:major
```

The release process includes:

- ✅ Pre-release validation (branch, uncommitted changes)
- ✅ Automated testing
- ✅ Build verification
- ✅ Version bump and git tagging
- ✅ GitHub release creation
- ✅ Production deployment
- ✅ Post-release validation

### Quick Deploy

```bash
./scripts/deploy.sh
```

### Manual Deploy

```bash
npm run build
vercel --prod
```

### Vercel Deployment with AI Features

To enable AI-powered document analysis in production:

1. **Set up Vercel Environment Variables**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your aura-finance project
   - Go to Settings → Environment Variables
   - Add: `VITE_GEMINI_API_KEY` with your actual API key
   - Redeploy your project

2. **Domain Restrictions (Recommended)**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Edit your API key
   - Add domain restrictions: `yourdomain.vercel.app`
   - This prevents unauthorized usage

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 📦 Version Management

### Current Version

- **Version**: 1.1.0
- **Status**: Production Release
- **Release Date**: 2025-01-01

### Version Commands

```bash
# Show current version
node -p "require('./package.json').version"

# Professional release (recommended)
npm run release:patch   # 1.1.0 → 1.1.1
npm run release:minor   # 1.1.0 → 1.2.0
npm run release:major   # 1.1.0 → 2.0.0

# Manual version bump
npm run version:patch
npm run version:minor
npm run version:major
```

### Semantic Versioning

- **MAJOR**: Breaking changes (1.0.0 → 2.0.0)
- **MINOR**: New features, backward compatible (1.0.0 → 1.1.0)
- **PATCH**: Bug fixes, backward compatible (1.0.0 → 1.0.1)

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history.

## 📖 Usage

### Getting Started

1. **Sign up** for an account
2. **Add your accounts** (checking, savings, credit cards)
3. **Import transactions** from your bank statements
4. **Track your net worth** and financial progress

### Importing Statements

1. **Click "Import Statement"** in the header
2. **Upload your file**:
   - **CSV**: Standard format with Date, Description, Amount columns
   - **PDF**: Bank statements (enhanced OCR processing)
3. **Review and edit** transactions before importing
4. **Confirm import** to add to your database

**PDF Requirements:**

- File size under 10MB
- Contains readable text (not scanned images)
- Not password-protected
- Valid bank statement format

## 🧪 Development

### Running Tests

```bash
npm test
```

### Code Quality

```bash
npm run lint
npm run format
```

### Building for Production

```bash
npm run build
```

## 📈 Recent Updates (v1.1.0)

### ✨ New Features

- **Enhanced Mobile Experience**: Optimized mobile navigation and responsive design
- **Improved PDF Import**: Enhanced PDF parsing with better error handling and validation
- **Professional Versioning**: Implemented proper semantic versioning and release procedures

### 🔧 Improvements

- **Mobile Navigation**: Fixed bottom navigation bar spacing and touch target issues
- **PDF Import Validation**: Improved PDF file validation and error messaging
- **Responsive Design**: Enhanced mobile layout for better usability on small screens
- **Touch Interactions**: Optimized touch targets and gesture handling for mobile devices

### 🐛 Bug Fixes

- **Mobile UI**: Resolved squished bottom navigation and responsive layout issues
- **PDF Processing**: Fixed "invalid PDF" errors with better validation and error handling
- **User Experience**: Improved loading states and user feedback throughout the app

## 📈 Future Roadmap

- **Advanced Analytics**: Spending patterns and budget insights
- **Goal Tracking**: Set and monitor financial goals
- **Export Features**: Generate reports and exports
- **Mobile App**: Native mobile application
- **API Integration**: Connect with banking APIs

## 🤝 Contributing

This is a personal project for learning and exploration. Feel free to fork and experiment with your own ideas!

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/)
- Database powered by [Supabase](https://supabase.com/)
- Deployed on [Vercel](https://vercel.com/)
- Icons from [Lucide](https://lucide.dev/)
