#!/bin/bash

# Loomo Developer Setup Script
# This script installs dependencies for both Backend and Frontend.

set -e

echo "🚀 Starting Loomo developer setup..."

# 1. Backend Setup
echo "📦 Setting up Backend..."
cd Backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Created virtual environment."
fi

source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
echo "✅ Backend dependencies installed."

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "⚠️ Created Backend/.env from .env.example. Please update it with your keys!"
    else
        echo "CREATE DATABASE_URL=postgresql://user:pass@localhost:5432/loomo" > .env
        echo "SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')" >> .env
        echo "✅ Created a basic Backend/.env file."
    fi
fi
cd ..

# 2. Frontend Setup
echo "🌐 Setting up Frontend..."
cd Frontend
npm install
echo "✅ Frontend dependencies installed."

if [ ! -f ".env" ]; then
    echo "VITE_API_URL=http://127.0.0.1:8000" > .env
    echo "✅ Created Frontend/.env file."
fi
cd ..

echo "🎉 Setup complete!"
echo "To start the backend: cd Backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "To start the frontend: cd Frontend && npm run dev"
