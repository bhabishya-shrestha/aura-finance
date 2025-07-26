# Aura Finance Backend API

A robust Node.js/Express.js backend API for the Aura Finance application with PostgreSQL database and Prisma ORM.

## 🚀 Features

- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Database**: PostgreSQL with Prisma ORM for type-safe database operations
- **Security**: Helmet.js for security headers, CORS configuration
- **Logging**: Morgan for HTTP request logging
- **Error Handling**: Comprehensive error handling middleware
- **API Documentation**: RESTful API endpoints with consistent response format

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Docker (optional, for containerized development)

## 🛠️ Installation

### Option 1: Local Development

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Set up database:**

   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push schema to database
   npm run db:push
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

### Option 2: Docker Development

1. **Start the full stack:**

   ```bash
   ./scripts/dev.sh
   ```

   This will start:
   - PostgreSQL database
   - Backend API server
   - Frontend development server

## 📊 Database Schema

### Models

- **User**: Authentication and user profiles
- **Account**: Financial accounts (checking, savings, credit, investment)
- **Transaction**: Financial transactions with categories
- **Category**: Transaction categories with colors and icons

### Relationships

- User has many Accounts
- User has many Transactions
- User has many Categories
- Account has many Transactions
- Category has many Transactions

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Users

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Accounts

- `GET /api/accounts` - Get all user accounts
- `GET /api/accounts/:id` - Get single account with transactions
- `POST /api/accounts` - Create new account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Soft delete account

### Transactions

- `GET /api/transactions` - Get all user transactions (with pagination)
- `GET /api/transactions/:id` - Get single transaction
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Categories

- `GET /api/categories` - Get all user categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

## 🔧 Development Scripts

```bash
npm run dev          # Start development server with nodemon
npm run start        # Start production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database with sample data
```

## 🌐 Environment Variables

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/aura_finance"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN="http://localhost:5173"
```

## 🔒 Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **JWT Authentication**: Secure token-based authentication
- **CORS Protection**: Configured CORS for frontend integration
- **Security Headers**: Helmet.js for security headers
- **Input Validation**: Request validation and sanitization
- **Error Handling**: Secure error responses without sensitive data

## 📝 API Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "pagination": {
    // Pagination info (if applicable)
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message"
}
```

## 🚀 Deployment

### Local to Cloud Migration

The backend is designed to easily migrate from local development to cloud deployment:

1. **Update environment variables** for production
2. **Set up cloud database** (AWS RDS, Google Cloud SQL, etc.)
3. **Deploy to cloud platform** (AWS, Google Cloud, Railway, Render, etc.)

### Recommended Cloud Platforms

- **Railway**: Simple deployment with PostgreSQL
- **Render**: Free tier available with PostgreSQL
- **AWS**: EC2 + RDS for scalable deployment
- **Google Cloud**: Compute Engine + Cloud SQL

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/backend-feature`
2. Make your changes
3. Test thoroughly
4. Commit with conventional commits: `git commit -m "feat: add new API endpoint"`
5. Push and create a pull request

## 📄 License

This project is licensed under the ISC License.
