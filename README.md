# Aura Finance - Personal Finance Dashboard

A sophisticated, local-first personal finance dashboard built with React, featuring a beautiful glassmorphism design and advanced Bank of America statement parsing capabilities.

## ✨ Features

### 🎨 Design & UI

- **Glassmorphism Aesthetic**: Beautiful frosted glass effect with backdrop blur
- **Notion-inspired Layout**: Clean, spacious, component-driven design
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark Theme**: Sophisticated dark charcoal background (#17181c)
- **Gradient Accents**: Vibrant teal-to-purple gradients for highlights

### 💾 Local-First Architecture

- **Zero Server Costs**: All data stored locally in your browser
- **Privacy-First**: Your financial data never leaves your device
- **IndexedDB Storage**: Robust local database using Dexie.js
- **Offline Capable**: Works completely offline once loaded

### 📊 Core Functionality

- **Net Worth Tracking**: Real-time calculation from all transactions
- **Account Management**: Multiple account types (checking, credit, savings)
- **Recent Transactions**: View and manage your latest transactions
- **Transaction Categories**: Automatic categorization with manual override

### 📄 Statement Import

- **CSV Support**: Import transaction data from CSV files
- **PDF OCR**: Advanced Bank of America statement parsing
- **Smart Parsing**: Optimized regex patterns for BoA statement structure
- **Batch Import**: Review and edit transactions before importing
- **Duplicate Detection**: Automatically removes duplicate transactions

### 🔧 Technology Stack

- **React 18**: Modern React with Hooks
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Dexie.js**: IndexedDB wrapper for local storage
- **Zustand**: Lightweight state management
- **Lucide React**: Beautiful icon library
- **Papa Parse**: CSV parsing library
- **Tesseract.js**: OCR for PDF processing

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd budget-networth-tracker
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 📖 Usage

### Importing Statements

1. **Click "Import Statement"** in the header
2. **Upload your file**:
   - **CSV**: Standard format with Date, Description, Amount columns
   - **PDF**: Bank of America credit card or bank statements
3. **Review transactions**: Edit dates, descriptions, amounts, and categories
4. **Select transactions**: Choose which transactions to import
5. **Import**: Click "Import Transactions" to save to your local database

### Managing Transactions

- **View recent transactions** on the dashboard
- **Track net worth** in real-time
- **Monitor accounts** and their balances
- **Categorize spending** for better insights

### Bank of America Statement Parsing

The application is specifically optimized for Bank of America statements and can parse:

- **Purchases and Adjustments** section
- **Payments and Other Credits** section
- **Transaction dates** in MM/DD/YYYY format
- **Amounts** with proper sign detection
- **Descriptions** with automatic categorization

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── Header.jsx      # Main header with import button
│   ├── Sidebar.jsx     # Collapsible navigation sidebar
│   ├── Dashboard.jsx   # Main dashboard layout
│   ├── NetWorth.jsx    # Net worth display card
│   ├── Accounts.jsx    # Account management
│   ├── RecentTransactions.jsx  # Transaction list
│   └── StatementImporter.jsx   # Import modal
├── utils/
│   └── statementParser.js      # CSV/PDF parsing logic
├── database.js         # Dexie.js database setup
├── store.js           # Zustand state management
├── App.jsx            # Main app component
└── index.css          # Tailwind and custom styles
```

## 🎯 Future Features

- **Charts & Analytics**: Spending patterns and trends
- **Budget Planning**: Set and track budget goals
- **Export Functionality**: Export data to CSV/PDF
- **Multiple Banks**: Support for other bank statements
- **Data Backup**: Export/import database backups
- **Advanced Categorization**: Machine learning for better categorization

## 🔒 Privacy & Security

- **100% Local**: No data sent to external servers
- **Browser Storage**: All data stored in IndexedDB
- **No Analytics**: No tracking or analytics scripts
- **Open Source**: Transparent code for security review

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Customization

- **Colors**: Modify `tailwind.config.js` for custom color schemes
- **Styling**: Update `src/index.css` for custom glassmorphism effects
- **Parsing**: Extend `src/utils/statementParser.js` for additional banks

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Aura Finance** - Your personal finance data, your control, your privacy.
