#!/bin/bash

# Git Setup and Push Script for DeployMaster
# Execute este script no seu servidor

set -e  # Exit on error

echo "🚀 DeployMaster - Git Setup Script"
echo "===================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
PROJECT_DIR="/deploysap/deploy-master"

cd "$PROJECT_DIR"

# Initialize git if not already
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}Inicializando repositório Git...${NC}"
    git init
    git remote add origin "$REPO_URL"
else
    echo -e "${GREEN}✓ Repositório Git já inicializado${NC}"
    
    # Update remote URL if needed
    git remote set-url origin "$REPO_URL"
fi

# Configure git user (if not set)
if [ -z "$(git config user.email)" ]; then
    echo -e "${YELLOW}Configurando usuário Git...${NC}"
    git config user.name "Emerson"
    git config user.email "emersonpfs@users.noreply.github.com"
fi

# Add all files
echo -e "${YELLOW}Adicionando arquivos ao Git...${NC}"
git add .

# Check if there are changes to commit
if git diff-index --quiet HEAD -- 2>/dev/null; then
    echo -e "${GREEN}✓ Nenhuma mudança para commitar${NC}"
else
    # Commit
    echo -e "${YELLOW}Criando commit...${NC}"
    git commit -m "feat: Initial commit - DeployMaster v1.0

- Backend: FastAPI with SSH/WinRM support for Linux/Windows deployments
- Frontend: React + TypeScript + Tailwind CSS + Shadcn/UI
- Features: Complete CRUD for Applications with installer URL, description, parameters
- Database: SQLite with encrypted password storage
- Deployment: Real-time logs via WebSocket
- UI: Modern SaaS dashboard design with dark mode support
- Configuration: Backend on port 9090, Frontend on 5173
- External access: Configured for schemamanager.skyinone.net
- Documentation: Complete README, Quick Start guide, and setup scripts
"
fi

# Push to GitHub
echo -e "${YELLOW}Fazendo push para GitHub...${NC}"
git branch -M main
git push -u origin main

echo ""
echo -e "${GREEN}===================================="
echo "✅ Push concluído com sucesso!"
echo "====================================${NC}"
echo ""
echo "Repositório: https://github.com/emersonpfs/sapdeploy"
echo ""
echo "Para futuras alterações, use:"
echo "  git add ."
echo "  git commit -m 'sua mensagem'"
echo "  git push"
echo ""
echo "Para baixar atualizações:"
echo "  git pull origin main"
