#!/bin/bash

echo "🚀 Starting Aura Finance Full-Stack Development Environment"
echo "=================================================="

# Function to cleanup background processes on exit
cleanup() {
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend
echo "📡 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Test backend health
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend is running on http://localhost:3001"
else
    echo "❌ Backend failed to start"
    cleanup
fi

# Start frontend
echo "🎨 Starting frontend development server..."
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 5

# Test frontend
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend is running on http://localhost:5173"
else
    echo "❌ Frontend failed to start"
    cleanup
fi

echo ""
echo "🎉 Full-stack environment is ready!"
echo "=================================================="
echo "📡 Backend API: http://localhost:3001"
echo "🎨 Frontend App: http://localhost:5173"
echo "📊 Health Check: http://localhost:3001/health"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Keep script running
wait 