from sqlalchemy.orm import Session
from typing import List, Optional
import models
import schemas
from cryptography.fernet import Fernet
import os

# Simple encryption key (in production, use env variable)
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", Fernet.generate_key())
cipher = Fernet(ENCRYPTION_KEY)

def encrypt_password(password: str) -> str:
    """Encrypt password for storage"""
    return cipher.encrypt(password.encode()).decode()

def decrypt_password(encrypted_password: str) -> str:
    """Decrypt password for use"""
    return cipher.decrypt(encrypted_password.encode()).decode()

# Application CRUD
def get_applications(db: Session, skip: int = 0, limit: int = 100) -> List[models.Application]:
    return db.query(models.Application).offset(skip).limit(limit).all()

def get_application(db: Session, application_id: int) -> Optional[models.Application]:
    return db.query(models.Application).filter(models.Application.id == application_id).first()

def create_application(db: Session, application: schemas.ApplicationCreate) -> models.Application:
    db_application = models.Application(**application.model_dump())
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    return db_application

def update_application(db: Session, application_id: int, application: schemas.ApplicationUpdate) -> Optional[models.Application]:
    db_application = get_application(db, application_id)
    if db_application:
        update_data = application.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_application, key, value)
        db.commit()
        db.refresh(db_application)
    return db_application

def delete_application(db: Session, application_id: int) -> bool:
    db_application = get_application(db, application_id)
    if db_application:
        db.delete(db_application)
        db.commit()
        return True
    return False

# Server CRUD
def get_servers(db: Session, skip: int = 0, limit: int = 100) -> List[models.Server]:
    return db.query(models.Server).offset(skip).limit(limit).all()

def get_server(db: Session, server_id: int) -> Optional[models.Server]:
    return db.query(models.Server).filter(models.Server.id == server_id).first()

def create_server(db: Session, server: schemas.ServerCreate) -> models.Server:
    server_data = server.model_dump()
    # Encrypt password if provided
    if server_data.get("password"):
        server_data["password"] = encrypt_password(server_data["password"])
    
    db_server = models.Server(**server_data)
    db.add(db_server)
    db.commit()
    db.refresh(db_server)
    return db_server

def update_server(db: Session, server_id: int, server: schemas.ServerUpdate) -> Optional[models.Server]:
    db_server = get_server(db, server_id)
    if db_server:
        update_data = server.model_dump(exclude_unset=True)
        # Encrypt password if provided
        if update_data.get("password"):
            update_data["password"] = encrypt_password(update_data["password"])
        
        for key, value in update_data.items():
            setattr(db_server, key, value)
        db.commit()
        db.refresh(db_server)
    return db_server

def delete_server(db: Session, server_id: int) -> bool:
    db_server = get_server(db, server_id)
    if db_server:
        db.delete(db_server)
        db.commit()
        return True
    return False

# Deployment CRUD
def get_deployments(db: Session, skip: int = 0, limit: int = 100) -> List[models.Deployment]:
    return db.query(models.Deployment).offset(skip).limit(limit).order_by(models.Deployment.started_at.desc()).all()

def get_deployment(db: Session, deployment_id: int) -> Optional[models.Deployment]:
    return db.query(models.Deployment).filter(models.Deployment.id == deployment_id).first()

def create_deployment(db: Session, deployment: schemas.DeploymentCreate) -> models.Deployment:
    # Create deployment
    db_deployment = models.Deployment()
    
    # Add applications
    applications = db.query(models.Application).filter(
        models.Application.id.in_(deployment.application_ids)
    ).all()
    db_deployment.applications = applications
    
    # Add servers
    servers = db.query(models.Server).filter(
        models.Server.id.in_(deployment.server_ids)
    ).all()
    db_deployment.servers = servers
    
    db.add(db_deployment)
    db.commit()
    db.refresh(db_deployment)
    return db_deployment

def update_deployment_status(
    db: Session, 
    deployment_id: int, 
    status: models.DeploymentStatus,
    logs: str = "",
    error_message: str = None
) -> Optional[models.Deployment]:
    db_deployment = get_deployment(db, deployment_id)
    if db_deployment:
        db_deployment.status = status
        if logs:
            db_deployment.logs += logs + "\n"
        if error_message:
            db_deployment.error_message = error_message
        if status in [models.DeploymentStatus.SUCCESS, models.DeploymentStatus.FAILED]:
            from datetime import datetime
            db_deployment.completed_at = datetime.utcnow()
        db.commit()
        db.refresh(db_deployment)
    return db_deployment

# Dashboard Stats
def get_dashboard_stats(db: Session) -> schemas.DashboardStats:
    total_servers = db.query(models.Server).count()
    total_applications = db.query(models.Application).count()
    total_deployments = db.query(models.Deployment).count()
    
    recent_deployments = db.query(models.Deployment).order_by(
        models.Deployment.started_at.desc()
    ).limit(5).all()
    
    # Calculate success rate
    success_count = db.query(models.Deployment).filter(
        models.Deployment.status == models.DeploymentStatus.SUCCESS
    ).count()
    
    success_rate = (success_count / total_deployments * 100) if total_deployments > 0 else 0
    
    return schemas.DashboardStats(
        total_servers=total_servers,
        total_applications=total_applications,
        total_deployments=total_deployments,
        recent_deployments=recent_deployments,
        success_rate=success_rate
    )
