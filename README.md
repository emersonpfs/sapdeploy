# DeployMaster 🚀

A modern, full-stack deployment management platform for orchestrating software installations across Linux and Windows servers.

## 📋 Overview

DeployMaster is a web-based application that allows you to:
- **Manage Applications**: Define software packages with installation commands
- **Manage Servers**: Register Linux and Windows target servers
- **Execute Deployments**: Deploy applications to multiple servers simultaneously
- **Monitor Progress**: Watch real-time deployment logs via WebSocket
- **Track History**: View deployment history and success rates

## 🎨 Tech Stack

### Backend
- **Python 3.11+** with FastAPI
- **SQLite** database with SQLAlchemy ORM
- **Paramiko** for SSH (Linux deployments)
- **PyWinRM** for WinRM (Windows deployments)
- **WebSockets** for live log streaming

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** + **Shadcn/UI** for modern design
- **React Query** for data fetching
- **React Router** for navigation
- **Lucide React** for icons

## 🚀 Installation & Setup

### Prerequisites

- Ubuntu Server (20.04+ or 22.04+)
- Python 3.11 or higher
- Node.js 18+ and npm
- Git

### 1. Clone the Repository

```bash
cd /opt  # or your preferred location
git clone <your-repo-url> deploy-master
cd deploy-master
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Generate encryption key
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Create .env file
cp .env.example .env
# Edit .env and add your ENCRYPTION_KEY

# Initialize database (tables will be created automatically on first run)
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Build for production
npm run build

# Or run in development mode
npm run dev
```

### 4. Running the Application

#### Option A: Development Mode (Separate Terminals)

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
python main.py
# Backend runs on http://localhost:9090
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

#### Option B: Production Mode with Systemd

**Backend Service** (`/etc/systemd/system/deploymaster-backend.service`):
```ini
[Unit]
Description=DeployMaster Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/deploy-master/backend
Environment="PATH=/opt/deploy-master/backend/venv/bin"
ExecStart=/opt/deploy-master/backend/venv/bin/python main.py
Restart=always

[Install]
WantedBy=multi-user.target
```

**Frontend with Nginx** (`/etc/nginx/sites-available/deploymaster`):
```nginx
server {
    listen 80;
    server_name deploymaster.local;
    
    # Frontend
    root /opt/deploy-master/frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API proxy
    location /api {
        proxy_pass http://localhost:9090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket proxy
    location /ws {
        proxy_pass http://localhost:9090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

**Enable services:**
```bash
# Backend
sudo systemctl enable deploymaster-backend
sudo systemctl start deploymaster-backend

# Frontend (Nginx)
sudo ln -s /etc/nginx/sites-available/deploymaster /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 📖 Usage Guide

### 1. Adding Applications

Navigate to **Applications** page and create application entries:

**Example - Nginx on Linux:**
- Name: `Nginx Web Server`
- Version: `1.24`
- OS Type: `Linux`
- Install Command:
```bash
sudo apt-get update && sudo apt-get install -y nginx && sudo systemctl enable nginx && sudo systemctl start nginx
```

**Example - Chrome on Windows:**
- Name: `Google Chrome`
- Version: `Latest`
- OS Type: `Windows`
- Install Command:
```powershell
$url = "https://dl.google.com/chrome/install/latest/chrome_installer.exe"
$output = "$env:TEMP\chrome_installer.exe"
Invoke-WebRequest -Uri $url -OutFile $output
Start-Process -FilePath $output -ArgumentList "/silent /install" -Wait
Remove-Item $output
```

### 2. Adding Servers

Navigate to **Servers** page and register your target servers:

**Linux Server Example:**
- Hostname: `web-server-01`
- IP Address: `192.168.1.100`
- OS Type: `Linux`
- Username: `ubuntu`
- Password or Private Key Path: `/home/user/.ssh/id_rsa`
- Port: `22`

**Windows Server Example:**
- Hostname: `win-server-01`
- IP Address: `192.168.1.101`
- OS Type: `Windows`
- Username: `Administrator`
- Password: `YourSecurePassword`
- Port: `5985` (WinRM HTTP)

### 3. Deploying Applications

Navigate to **Deployments** page:

1. **Select Applications** - Choose one or more applications
2. **Select Servers** - Choose target servers (OS types must match)
3. **Click "Start Deployment"**
4. **Watch Live Console** - Real-time logs stream as deployment progresses

### 4. Dashboard

View overview statistics:
- Total servers registered
- Total applications available
- Deployment count and success rate
- Recent deployment history

## 🔒 Security Considerations

### Password Encryption
- Passwords are encrypted using Fernet (symmetric encryption)
- Encryption key stored in `.env` file
- **Important**: Keep your `ENCRYPTION_KEY` secure

### SSH Key Authentication (Recommended)
For Linux servers, prefer SSH key authentication:
```bash
# Generate key pair
ssh-keygen -t rsa -b 4096 -f ~/.ssh/deploymaster_key

# Copy to target server
ssh-copy-id -i ~/.ssh/deploymaster_key.pub user@target-server

# Use key path in DeployMaster: /home/user/.ssh/deploymaster_key
```

### WinRM Configuration (Windows)
Enable WinRM on Windows servers:
```powershell
# Run as Administrator
winrm quickconfig
winrm set winrm/config/service/auth '@{Basic="true"}'
winrm set winrm/config/service '@{AllowUnencrypted="true"}'
```

**⚠️ Note**: For production, use HTTPS (port 5986) with proper certificates.

## 🛠️ API Endpoints

### Applications
- `GET /api/applications` - List all applications
- `POST /api/applications` - Create application
- `PUT /api/applications/{id}` - Update application
- `DELETE /api/applications/{id}` - Delete application

### Servers
- `GET /api/servers` - List all servers
- `POST /api/servers` - Create server
- `PUT /api/servers/{id}` - Update server
- `DELETE /api/servers/{id}` - Delete server

### Deployments
- `GET /api/deployments` - List all deployments
- `POST /api/deployments` - Create and execute deployment
- `GET /api/deployments/{id}` - Get deployment details
- `WS /ws/deployments/{id}` - WebSocket for live logs

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics

## 🔧 Troubleshooting

### Backend Issues

**Database errors:**
```bash
# Delete and recreate database
rm deploymaster.db
# Restart backend - tables will be recreated
```

**SSH Connection failures:**
- Verify SSH key permissions: `chmod 600 ~/.ssh/deploymaster_key`
- Test manual SSH: `ssh -i ~/.ssh/key user@host`
- Check firewall rules on target server

**WinRM Connection failures:**
- Verify WinRM is running: `winrm enumerate winrm/config/listener`
- Test with curl: `curl -u user:pass http://host:5985/wsman`
- Check Windows Firewall rules

### Frontend Issues

**Build errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**WebSocket connection issues:**
- Check proxy configuration in `vite.config.ts` or Nginx
- Verify backend WebSocket endpoint is accessible
- Check browser console for connection errors

## 📊 Database Schema

```
applications
  - id, name, version, os_type, install_command
  - created_at, updated_at

servers
  - id, hostname, ip_address, os_type
  - username, password (encrypted), private_key_path, port
  - created_at, updated_at

deployments
  - id, status, logs, started_at, completed_at
  - error_message

deployment_applications (many-to-many)
deployment_servers (many-to-many)
```

## 🎯 Roadmap

- [ ] Add CRUD forms for Applications and Servers in UI
- [ ] Implement user authentication and RBAC
- [ ] Add deployment scheduling (cron jobs)
- [ ] Support for deployment rollback
- [ ] Multi-step deployment workflows
- [ ] Integration with Ansible playbooks
- [ ] Email/Slack notifications
- [ ] Deployment templates and presets

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.

## 📧 Support

For issues or questions, please create a GitHub issue or contact the maintainer.

---

**Built with ❤️ using FastAPI, React, and modern DevOps practices**
