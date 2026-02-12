"""
Sample Data Seeder for DeployMaster
Run this script to populate the database with sample applications and servers
"""

from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
import crud
import schemas

def seed_data():
    """Seed the database with sample data"""
    
    # Create tables if they don't exist
    models.Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    
    try:
        # Check if data already exists
        existing_apps = db.query(models.Application).count()
        if existing_apps > 0:
            print("⚠️  Database already contains data. Skipping seed.")
            return
        
        print("🌱 Seeding database with sample data...")
        
        # Sample Linux Applications
        linux_apps = [
            schemas.ApplicationCreate(
                name="Nginx Web Server",
                version="1.24",
                os_type=models.OSType.LINUX,
                install_command="sudo apt-get update && sudo apt-get install -y nginx && sudo systemctl enable nginx && sudo systemctl start nginx"
            ),
            schemas.ApplicationCreate(
                name="Docker Engine",
                version="24.0",
                os_type=models.OSType.LINUX,
                install_command="curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh && sudo systemctl enable docker && sudo systemctl start docker"
            ),
            schemas.ApplicationCreate(
                name="Node.js LTS",
                version="20.x",
                os_type=models.OSType.LINUX,
                install_command="curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
            ),
        ]
        
        # Sample Windows Applications
        windows_apps = [
            schemas.ApplicationCreate(
                name="Google Chrome",
                version="Latest",
                os_type=models.OSType.WINDOWS,
                install_command="""$url = "https://dl.google.com/chrome/install/latest/chrome_installer.exe"
$output = "$env:TEMP\\chrome_installer.exe"
Invoke-WebRequest -Uri $url -OutFile $output
Start-Process -FilePath $output -ArgumentList "/silent /install" -Wait
Remove-Item $output"""
            ),
            schemas.ApplicationCreate(
                name="Git for Windows",
                version="2.43",
                os_type=models.OSType.WINDOWS,
                install_command="""$url = "https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe"
$output = "$env:TEMP\\git-installer.exe"
Invoke-WebRequest -Uri $url -OutFile $output
Start-Process -FilePath $output -ArgumentList "/VERYSILENT /NORESTART" -Wait
Remove-Item $output"""
            ),
        ]
        
        # Create applications
        print("  Creating applications...")
        for app in linux_apps + windows_apps:
            crud.create_application(db, app)
            print(f"    ✓ {app.name}")
        
        # Sample Linux Servers
        linux_servers = [
            schemas.ServerCreate(
                hostname="web-server-01",
                ip_address="192.168.1.100",
                os_type=models.OSType.LINUX,
                username="ubuntu",
                password="change_me_in_production",
                port=22
            ),
            schemas.ServerCreate(
                hostname="app-server-01",
                ip_address="192.168.1.101",
                os_type=models.OSType.LINUX,
                username="ubuntu",
                password="change_me_in_production",
                port=22
            ),
        ]
        
        # Sample Windows Servers
        windows_servers = [
            schemas.ServerCreate(
                hostname="win-server-01",
                ip_address="192.168.1.200",
                os_type=models.OSType.WINDOWS,
                username="Administrator",
                password="change_me_in_production",
                port=5985
            ),
        ]
        
        # Create servers
        print("  Creating servers...")
        for server in linux_servers + windows_servers:
            crud.create_server(db, server)
            print(f"    ✓ {server.hostname}")
        
        print("\n✅ Sample data seeded successfully!")
        print("\n⚠️  IMPORTANT: Change default passwords before using in production!")
        
    except Exception as e:
        print(f"\n❌ Error seeding data: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
