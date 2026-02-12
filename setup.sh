#!/bin/bash

# DeployMaster Quick Start Script
echo "🚀 DeployMaster Setup Script"
echo "=============================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running from correct directory
if [ ! -f "README.md" ]; then
    echo -e "${RED}Error: Please run this script from the deploy-master root directory${NC}"
    exit 1
fi

# Backend Setup
echo -e "\n${YELLOW}Step 1: Setting up Backend...${NC}"
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Generate encryption key if .env doesn't exist
if [ ! -f ".env" ]; then
    echo "Generating encryption key..."
    ENCRYPTION_KEY=$(python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
    cat > .env << EOF
PORT=9090
HOST=0.0.0.0
ENCRYPTION_KEY=$ENCRYPTION_KEY
DATABASE_URL=sqlite:///./deploymaster.db
EOF
    echo -e "${GREEN}✓ Created .env file with encryption key${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

cd ..

# Frontend Setup
echo -e "\n${YELLOW}Step 2: Setting up Frontend...${NC}"
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies (this may take a few minutes)..."
    npm install
else
    echo -e "${GREEN}✓ Node modules already installed${NC}"
fi

cd ..

# Summary
echo -e "\n${GREEN}=============================="
echo "✓ Setup Complete!"
echo "==============================${NC}"
echo ""
echo "To start the application:"
echo ""
echo "  Backend (Terminal 1):"
echo "  $ cd backend"
echo "  $ source venv/bin/activate"
echo "  $ python main.py"
echo ""
echo "  Frontend (Terminal 2):"
echo "  $ cd frontend"
echo "  $ npm run dev"
echo ""
echo "Then open: http://localhost:5173"
echo ""
echo -e "${YELLOW}Tip: Check README.md for production deployment with systemd + nginx${NC}"
