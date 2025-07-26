#!/bin/bash

echo "🚀 Starting Aura Finance Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if PostgreSQL is already running on port 5432
if lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  PostgreSQL is already running on port 5432. Stopping it..."
    docker stop aura-finance-db 2>/dev/null || true
fi

# Start the database
echo "📊 Starting PostgreSQL database..."
docker-compose up -d postgres

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Generate Prisma client
echo "🔧 Generating Prisma client..."
cd backend
npx prisma generate

# Push database schema
echo "🗄️  Setting up database schema..."
npx prisma db push

# Start backend
echo "🔙 Starting backend server..."
cd ..
docker-compose up -d backend

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 5

# Start frontend
echo "🎨 Starting frontend development server..."
docker-compose up -d frontend

echo ""
echo "✅ Aura Finance Development Environment is ready!"
echo ""
echo "📊 Database: http://localhost:5432"
echo "🔙 Backend API: http://localhost:3001"
echo "🎨 Frontend: http://localhost:5173"
echo "🗄️  Database Studio: http://localhost:5555 (run: cd backend && npm run db:studio)"
echo ""
echo "📝 Useful commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop all: docker-compose down"
echo "  - Restart: ./scripts/dev.sh"
echo "" 