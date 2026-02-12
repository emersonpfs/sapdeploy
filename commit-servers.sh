#!/bin/bash

cd /deploysap/deploy-master

echo "📝 Fazendo commit e push: Servers CRUD completo"

git add .

git commit -m "feat: Complete CRUD for Servers with SSH key upload

## Backend Updates
- Updated Server model to store SSH key content (encrypted)
- Modified schemas to handle ssh_key_content field
- Updated CRUD operations to encrypt SSH keys
- Modified deployment.py to load SSH keys from content instead of file path

## Frontend Updates
- Created ServerForm component with conditional fields based on OS
- Implemented SSH key file upload for Linux servers
- Added toggle between password and SSH key authentication
- Created ServerList component with server details
- Updated Servers page with complete CRUD operations
- Added visual indicators for authentication type

## Features
- Windows servers: Name, IP, Username, Password
- Linux servers: Name, IP, Username, Password OR SSH Key
- SSH Key upload: Supports PEM, PPK, and OpenSSH private keys
- Toggle checkbox: 'Usar Chave SSH?' for Linux servers
- File upload with drag-and-drop interface
- SSH keys stored encrypted in database
- Visual connection string preview
- Port configuration (22 for SSH, 5985 for WinRM)

## UI/UX
- Modern card-based layout
- OS-specific icons and labels
- Authentication type badges
- Connection command preview
- Responsive design with Shadcn/UI components
"

git push origin main

echo "✅ Push concluído!"
echo ""
echo "Repositório: https://github.com/emersonpfs/sapdeploy"
