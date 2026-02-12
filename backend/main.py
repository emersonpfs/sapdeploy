from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import asyncio
import json

import models
import schemas
import crud
from database import engine, get_db
from deployment import DeploymentExecutor

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="DeployMaster", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, WebSocket] = {}

    async def connect(self, deployment_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[deployment_id] = websocket

    def disconnect(self, deployment_id: int):
        if deployment_id in self.active_connections:
            del self.active_connections[deployment_id]

    async def send_log(self, deployment_id: int, message: str):
        if deployment_id in self.active_connections:
            try:
                await self.active_connections[deployment_id].send_text(message)
            except:
                self.disconnect(deployment_id)

manager = ConnectionManager()

# ==================== Applications ====================

@app.get("/api/applications", response_model=List[schemas.Application])
def list_applications(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all applications"""
    return crud.get_applications(db, skip=skip, limit=limit)

@app.get("/api/applications/{application_id}", response_model=schemas.Application)
def get_application(application_id: int, db: Session = Depends(get_db)):
    """Get specific application"""
    application = crud.get_application(db, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return application

@app.post("/api/applications", response_model=schemas.Application, status_code=201)
def create_application(application: schemas.ApplicationCreate, db: Session = Depends(get_db)):
    """Create new application"""
    return crud.create_application(db, application)

@app.put("/api/applications/{application_id}", response_model=schemas.Application)
def update_application(
    application_id: int,
    application: schemas.ApplicationUpdate,
    db: Session = Depends(get_db)
):
    """Update application"""
    updated = crud.update_application(db, application_id, application)
    if not updated:
        raise HTTPException(status_code=404, detail="Application not found")
    return updated

@app.delete("/api/applications/{application_id}")
def delete_application(application_id: int, db: Session = Depends(get_db)):
    """Delete application"""
    if not crud.delete_application(db, application_id):
        raise HTTPException(status_code=404, detail="Application not found")
    return {"message": "Application deleted successfully"}

# ==================== Servers ====================

@app.get("/api/servers", response_model=List[schemas.Server])
def list_servers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all servers"""
    return crud.get_servers(db, skip=skip, limit=limit)

@app.get("/api/servers/{server_id}", response_model=schemas.Server)
def get_server(server_id: int, db: Session = Depends(get_db)):
    """Get specific server"""
    server = crud.get_server(db, server_id)
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    return server

@app.post("/api/servers", response_model=schemas.Server, status_code=201)
def create_server(server: schemas.ServerCreate, db: Session = Depends(get_db)):
    """Create new server"""
    return crud.create_server(db, server)

@app.put("/api/servers/{server_id}", response_model=schemas.Server)
def update_server(
    server_id: int,
    server: schemas.ServerUpdate,
    db: Session = Depends(get_db)
):
    """Update server"""
    updated = crud.update_server(db, server_id, server)
    if not updated:
        raise HTTPException(status_code=404, detail="Server not found")
    return updated

@app.delete("/api/servers/{server_id}")
def delete_server(server_id: int, db: Session = Depends(get_db)):
    """Delete server"""
    if not crud.delete_server(db, server_id):
        raise HTTPException(status_code=404, detail="Server not found")
    return {"message": "Server deleted successfully"}

# ==================== Deployments ====================

@app.get("/api/deployments", response_model=List[schemas.Deployment])
def list_deployments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all deployments"""
    return crud.get_deployments(db, skip=skip, limit=limit)

@app.get("/api/deployments/{deployment_id}", response_model=schemas.Deployment)
def get_deployment(deployment_id: int, db: Session = Depends(get_db)):
    """Get specific deployment"""
    deployment = crud.get_deployment(db, deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    return deployment

@app.post("/api/deployments", response_model=schemas.Deployment, status_code=201)
async def create_deployment(
    deployment: schemas.DeploymentCreate,
    db: Session = Depends(get_db)
):
    """Create and execute new deployment"""
    # Create deployment record
    db_deployment = crud.create_deployment(db, deployment)
    
    # Start deployment in background
    asyncio.create_task(execute_deployment_background(db_deployment.id, db_deployment))
    
    return db_deployment

async def execute_deployment_background(deployment_id: int, deployment: models.Deployment):
    """Execute deployment in background with live logging"""
    from database import SessionLocal
    db = SessionLocal()
    
    try:
        # Update status to running
        crud.update_deployment_status(db, deployment_id, models.DeploymentStatus.RUNNING)
        
        all_success = True
        
        # Execute for each server x application combination
        for server in deployment.servers:
            for application in deployment.applications:
                # Check OS compatibility
                if server.os_type != application.os_type:
                    log_msg = f"⚠️  Skipping {application.name} on {server.hostname} - OS type mismatch\n"
                    await manager.send_log(deployment_id, log_msg)
                    crud.update_deployment_status(db, deployment_id, models.DeploymentStatus.RUNNING, log_msg)
                    continue
                
                # Create log callback
                async def log_callback(message: str):
                    await manager.send_log(deployment_id, message)
                    crud.update_deployment_status(db, deployment_id, models.DeploymentStatus.RUNNING, message)
                
                # Execute deployment
                success, output = await DeploymentExecutor.execute_deployment_async(
                    server, application, log_callback
                )
                
                if not success:
                    all_success = False
        
        # Update final status
        final_status = models.DeploymentStatus.SUCCESS if all_success else models.DeploymentStatus.FAILED
        crud.update_deployment_status(
            db, 
            deployment_id, 
            final_status,
            error_message=None if all_success else "Some deployments failed"
        )
        
        # Send completion message
        await manager.send_log(
            deployment_id, 
            f"\n{'='*60}\n✅ Deployment completed!\n{'='*60}\n"
        )
        
    except Exception as e:
        error_msg = f"Deployment error: {str(e)}"
        crud.update_deployment_status(
            db, 
            deployment_id, 
            models.DeploymentStatus.FAILED,
            error_message=error_msg
        )
        await manager.send_log(deployment_id, f"\n❌ {error_msg}\n")
    
    finally:
        db.close()

@app.websocket("/ws/deployments/{deployment_id}")
async def deployment_websocket(websocket: WebSocket, deployment_id: int):
    """WebSocket endpoint for live deployment logs"""
    await manager.connect(deployment_id, websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(deployment_id)

# ==================== Dashboard ====================

@app.get("/api/dashboard", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics"""
    return crud.get_dashboard_stats(db)

# ==================== Health Check ====================

@app.get("/api/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=9090, reload=True)
