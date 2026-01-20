#!/bin/bash

echo "🚀 Starting Firebase Setup for Tender Analysis System..."

# 1. Install Backend Deps
echo "📦 Installing Backend Dependencies..."
cd backend
npm install firebase-admin firebase-functions
cd ..

# 2. Install Frontend Deps
echo "📦 Installing Frontend Dependencies..."
cd frontend
npm install firebase
cd ..

# 3. Check for Credentials
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Warning: backend/.env not found!"
else
    echo "✅ backend/.env found."
fi

# 4. Build Frontend
echo "🏗️  Building Frontend..."
cd frontend
npm run build
cd ..

echo "✅ Setup Complete. Ready to deploy!"
echo "👉 Run: firebase deploy"
