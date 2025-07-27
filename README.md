# Aura Finance - Personal Finance Dashboard

A modern personal finance dashboard built with React and Supabase, designed to help you track expenses, manage accounts, and achieve your financial goals.

## 🎯 Project Overview

This is a personal project exploring modern web development and entrepreneurship. It demonstrates:

- **Full-stack development** with React and Supabase
- **Modern UI/UX** with responsive design and dark mode
- **Real-time data synchronization** across devices
- **Secure authentication** and data protection
- **Professional deployment** practices

## ✨ Features

### 🎨 Design & User Experience

- **Modern Interface**: Clean, responsive design that works on all devices
- **Dark Mode**: Sophisticated dark theme with proper contrast ratios
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

### 📄 Data Import

- **CSV Support**: Import transaction data from CSV files
- **PDF Processing**: OCR support for bank statements
- **Smart Parsing**: Optimized for common bank statement formats
- **Batch Import**: Review and edit transactions before importing
- **Duplicate Detection**: Automatically identifies duplicate entries

### 🔧 Technology Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS for utility-first styling
- **Database**: PostgreSQL on Supabase
- **Authentication**: Supabase Auth
- **State Management**: Zustand for lightweight state
- **Icons**: Lucide React for consistent iconography
- **Data Processing**: Papa Parse for CSV, Tesseract.js for OCR

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

3. **Set up Supabase**
   - Create a project at [https://app.supabase.com](https://app.supabase.com)
   - Get your project URL and anon key
   - Create a `.env` file with your credentials

4. **Deploy database schema**

   ```bash
   supabase login
   supabase link --project-ref your_project_ref
   supabase db push
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

### 🎯 Demo Account

**Try the app instantly with our demo account:**

- **Email**: `test@gmail.com`
- **Password**: `demo`
- **Demo URL**: https://aura-finance-tool.vercel.app/auth

**Setup demo account locally:**

```bash
# Create demo account with sample data
npm run demo:setup

# Show demo credentials
npm run demo:info
```

## 🚀 Deployment

### Quick Deploy

```bash
./scripts/deploy.sh
```

### Manual Deploy

```bash
npm run build
vercel --prod
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 📦 Version Management

### Current Version

- **Version**: 1.0.0
- **Status**: Production Release
- **Release Date**: 2025-07-27

### Version Commands

```bash
# Show current version
./scripts/version.sh version

# Release new version
./scripts/version.sh release patch  # 1.0.0 → 1.0.1
./scripts/version.sh release minor  # 1.0.0 → 1.1.0
./scripts/version.sh release major  # 1.0.0 → 2.0.0

# Run tests
./scripts/version.sh test

# Build project
./scripts/version.sh build

# Deploy to production
./scripts/version.sh deploy
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
   - **PDF**: Bank statements (OCR processing)
3. **Review and edit** transactions before importing
4. **Confirm import** to add to your database

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
