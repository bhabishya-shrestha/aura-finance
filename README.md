# Aura Finance - Personal Finance Management

A modern, AI-powered personal finance management application built with React, featuring advanced document import capabilities, real-time analytics, and a beautiful Apple-inspired design.

## ✨ Features

### 🚀 Enhanced Document Import System

- **Multi-format Support**: Import from CSV, PDF, and image files (JPG, PNG, GIF, WebP, HEIC)
- **AI-Powered Analysis**: Uses Google Gemini 1.5 Flash for intelligent document processing
- **Smart Categorization**: Automatically categorizes transactions based on merchant names
- **Professional UI/UX**: Drag-and-drop interface with real-time progress tracking
- **Preview & Validation**: Review extracted transactions before importing
- **Error Handling**: Comprehensive error messages and validation

### 📊 Financial Management

- **Transaction Tracking**: Monitor income and expenses with detailed categorization
- **Account Management**: Multiple account support with balance tracking
- **Net Worth Analytics**: Real-time net worth calculation and trends
- **Visual Reports**: Beautiful charts and analytics powered by Recharts
- **Search & Filter**: Advanced search and filtering capabilities

### 🎨 Modern Design

- **Apple-Inspired UI**: Clean, modern interface with glassmorphism effects
- **Dark/Light Mode**: Seamless theme switching with persistent preferences
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Accessibility**: WCAG compliant with keyboard navigation support

### 🔐 Security & Authentication

- **User Authentication**: Secure login and registration system
- **Data Privacy**: Local storage with optional cloud sync via Supabase
- **API Security**: Rate limiting and secure API key management

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **State Management**: Zustand
- **AI Integration**: Google Gemini 1.5 Flash API
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom JWT-based auth
- **Testing**: Vitest, React Testing Library
- **Deployment**: Vercel

## 🤖 AI Services Configuration

Aura Finance supports two AI providers for document analysis and transaction extraction:

### Google Gemini API (Free Tier)
- **Daily Limit**: 150 requests
- **Per Minute**: 15 requests
- **Cost**: Free
- **Best For**: Development, testing, and light usage

### Hugging Face Inference API (Recommended - Free)
- **Daily Limit**: 30,000 requests
- **Per Minute**: 500 requests
- **Cost**: Free
- **Best For**: High-volume usage without cost
- **Setup**: Just need an API token from Hugging Face

### Setting Up Hugging Face (Recommended)

1. **Create a Hugging Face Account**
   - Go to [huggingface.co](https://huggingface.co) and sign up
   - Verify your email address

2. **Get Your API Token**
   - Go to your [Access Tokens page](https://huggingface.co/settings/tokens)
   - Click "New token"
   - Give it a name (e.g., "Aura Finance")
   - Select "Read" permissions
   - Copy the generated token

3. **Configure Environment Variables**
   ```env
   VITE_HUGGINGFACE_API_KEY=your_huggingface_token_here
   ```

### Switching Between Providers

1. Go to **Settings** → **AI Services**
2. Toggle between **Gemini API** (150/day) and **Hugging Face** (30,000/day)
3. The system automatically falls back to other providers if one fails
4. Monitor usage in the settings panel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Google Gemini API key (for AI features)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/aura-finance.git
   cd aura-finance
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp env.example .env.local
   ```

   Configure your AI service provider:

   **Option A: Google Gemini API (Free Tier)**
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

   **Option B: Hugging Face Inference API (Recommended for High Volume)**
   ```env
   VITE_HUGGINGFACE_API_KEY=your_huggingface_api_key_here
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
aura-finance/
├── src/
│   ├── components/          # React components
│   │   ├── StatementImporter.jsx  # Enhanced import system
│   │   ├── auth/            # Authentication components
│   │   └── ...
│   ├── services/            # API and external services
│   │   ├── geminiService.js # AI document analysis
│   │   └── ...
│   ├── utils/               # Utility functions
│   │   ├── statementParser.js # CSV parsing utilities
│   │   └── ...
│   ├── contexts/            # React contexts
│   └── pages/               # Page components
├── supabase/                # Database migrations
├── scripts/                 # Build and deployment scripts
└── tests/                   # Test files
```

## 🔧 Enhanced Import System

### Supported File Types

- **CSV Files**: Standard CSV format with Date, Description, and Amount columns
- **PDF Documents**: Bank statements, receipts, invoices
- **Image Files**: JPG, PNG, GIF, WebP, HEIC (iPhone photos)

### AI-Powered Processing

The application uses Google Gemini 1.5 Flash to intelligently analyze documents:

1. **Document Type Detection**: Automatically identifies document types (bank statements, receipts, invoices)
2. **Transaction Extraction**: Extracts transaction details with high accuracy
3. **Smart Categorization**: Categorizes transactions based on merchant patterns
4. **Data Validation**: Ensures data quality and completeness
5. **Fallback Processing**: Text-based extraction when AI analysis fails

### Import Workflow

1. **File Upload**: Drag-and-drop or click to browse
2. **Validation**: File size and type validation
3. **Processing**: AI analysis with progress tracking
4. **Preview**: Review extracted transactions
5. **Import**: Confirm and import to your account

### Error Handling

- **File Validation**: Size limits (20MB) and format restrictions
- **Processing Errors**: Graceful handling of API failures
- **Data Quality**: Validation of extracted transaction data
- **User Feedback**: Clear error messages and recovery options

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

Run specific test files:

```bash
npm test -- StatementImporter.test.jsx
```

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
npm run build
npm run preview
```

## 📈 Performance

- **Bundle Size**: Optimized with Vite and tree shaking
- **Loading Speed**: Lazy loading and code splitting
- **AI Processing**: Rate limiting and caching for API calls
- **Database**: Optimized queries and indexing

## 🔒 Security

- **API Keys**: Secure storage and rate limiting
- **Data Privacy**: Local-first architecture
- **Authentication**: JWT-based with secure token management
- **Input Validation**: Comprehensive validation and sanitization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Google Gemini](https://ai.google.dev/) for AI document analysis
- [Supabase](https://supabase.com/) for backend services
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide React](https://lucide.dev/) for icons
- [Recharts](https://recharts.org/) for data visualization

## 📞 Support

For support and questions:

- Create an issue on GitHub
- Check the documentation
- Review existing issues and discussions

---

**Aura Finance** - Making personal finance management beautiful and intelligent. 💰✨

# Trigger CI/CD re-run
