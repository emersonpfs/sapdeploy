from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import models
import schemas
import crud
from database import engine, get_db
import os

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="DeployMaster", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SERVER_URL = os.getenv("SERVER_URL", "http://localhost:9090")

# ==================== Applications ====================

@app.get("/api/applications", response_model=List[schemas.Application])
def list_applications(db: Session = Depends(get_db)):
    return crud.get_applications(db)

@app.get("/api/applications/{application_id}", response_model=schemas.Application)
def get_application(application_id: int, db: Session = Depends(get_db)):
    app_obj = crud.get_application(db, application_id)
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")
    return app_obj

@app.post("/api/applications", response_model=schemas.Application, status_code=201)
def create_application(application: schemas.ApplicationCreate, db: Session = Depends(get_db)):
    return crud.create_application(db, application)

@app.put("/api/applications/{application_id}", response_model=schemas.Application)
def update_application(application_id: int, application: schemas.ApplicationUpdate, db: Session = Depends(get_db)):
    updated = crud.update_application(db, application_id, application)
    if not updated:
        raise HTTPException(status_code=404, detail="Application not found")
    return updated

@app.delete("/api/applications/{application_id}")
def delete_application(application_id: int, db: Session = Depends(get_db)):
    if not crud.delete_application(db, application_id):
        raise HTTPException(status_code=404, detail="Application not found")
    return {"message": "Deleted"}

# ==================== Agents (UI) ====================

@app.get("/api/agents", response_model=List[schemas.AgentOut])
def list_agents(db: Session = Depends(get_db)):
    return crud.get_agents(db)

@app.post("/api/agents", response_model=schemas.AgentRegisterResponse, status_code=201)
def create_agent(agent: schemas.AgentCreate, db: Session = Depends(get_db)):
    db_agent = crud.create_agent(db, agent)
    return schemas.AgentRegisterResponse(
        id=db_agent.id,
        name=db_agent.name,
        token=db_agent.token,
        install_command_linux=f"./agent-linux-amd64 --server {SERVER_URL} --token {db_agent.token}",
        install_command_windows=f".\\agent-windows-amd64.exe --server {SERVER_URL} --token {db_agent.token}"
    )

@app.get("/api/agents/download/{platform}")
def download_agent(platform: str):
    """Download pre-built agent binary for the given platform."""
    filenames = {
        "linux-amd64":   ("agent-linux-amd64",       "agent-linux-amd64"),
        "linux-arm64":   ("agent-linux-arm64",        "agent-linux-arm64"),
        "windows-amd64": ("agent-windows-amd64.exe",  "agent-windows-amd64.exe"),
    }
    if platform not in filenames:
        raise HTTPException(status_code=404, detail="Platform not found. Valid: linux-amd64, linux-arm64, windows-amd64")

    disk_name, download_name = filenames[platform]
    # Look in ../agent/dist/ relative to this file
    base_dir = os.path.dirname(os.path.abspath(__file__))
    binary_path = os.path.join(base_dir, "..", "agent", "dist", disk_name)

    if not os.path.isfile(binary_path):
        raise HTTPException(
            status_code=404,
            detail=f"Binary not built yet. Run 'cd agent && ./build.sh' to compile the agents."
        )

    return FileResponse(
        path=binary_path,
        filename=download_name,
        media_type="application/octet-stream"
    )

@app.post("/api/agents/{agent_id}/exec", response_model=schemas.ConsoleJobOut, status_code=201)
def exec_command(agent_id: int, body: schemas.ExecCommand, db: Session = Depends(get_db)):
    """Send an ad-hoc command to an agent via the console."""
    agent = crud.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    job = crud.create_exec_job(db, agent_id, body.command)
    return schemas.ConsoleJobOut(
        id=job.id,
        command=body.command,
        status=job.status,
        logs=job.logs,
        created_at=job.created_at,
        started_at=job.started_at,
        completed_at=job.completed_at,
        error_message=job.error_message,
    )

@app.get("/api/agents/{agent_id}/console", response_model=list[schemas.ConsoleJobOut])
def get_console_jobs(agent_id: int, db: Session = Depends(get_db)):
    """Get recent console (ad-hoc) jobs for an agent."""
    jobs = crud.get_console_jobs(db, agent_id)
    return [
        schemas.ConsoleJobOut(
            id=j.id,
            command=j.custom_command,
            status=j.status,
            logs=j.logs,
            created_at=j.created_at,
            started_at=j.started_at,
            completed_at=j.completed_at,
            error_message=j.error_message,
        ) for j in jobs
    ]

@app.get("/api/jobs/{job_id}", response_model=schemas.ConsoleJobOut)
def get_job(job_id: int, db: Session = Depends(get_db)):
    """Get a single job (used to poll console job status)."""
    job = crud.get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return schemas.ConsoleJobOut(
        id=job.id,
        command=job.custom_command or (job.application.install_command if job.application else ""),
        status=job.status,
        logs=job.logs,
        created_at=job.created_at,
        started_at=job.started_at,
        completed_at=job.completed_at,
        error_message=job.error_message,
    )

@app.delete("/api/agents/{agent_id}")
def delete_agent(agent_id: int, db: Session = Depends(get_db)):
    if not crud.delete_agent(db, agent_id):
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"message": "Deleted"}

# ==================== Agent API (called by agent binary) ====================

def get_agent_from_token(x_agent_token: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not x_agent_token:
        raise HTTPException(status_code=401, detail="Missing X-Agent-Token header")
    agent = crud.get_agent_by_token(db, x_agent_token)
    if not agent:
        raise HTTPException(status_code=401, detail="Invalid token")
    return agent

@app.post("/api/agent/heartbeat")
def agent_heartbeat(
    heartbeat: schemas.AgentHeartbeat,
    agent: models.Agent = Depends(get_agent_from_token),
    db: Session = Depends(get_db)
):
    crud.update_agent_heartbeat(db, agent, heartbeat)
    return {"status": "ok"}

@app.get("/api/agent/jobs/pending")
def get_pending_job(
    agent: models.Agent = Depends(get_agent_from_token),
    db: Session = Depends(get_db)
):
    job = crud.get_pending_job_for_agent(db, agent.id)
    if not job:
        return None
    if job.custom_command:
        return schemas.PendingJob(
            id=job.id,
            application_name="console",
            install_command=getattr(job, '_interpolated_command', job.custom_command),
            install_parameters=None,
            is_console=True
        )
    return schemas.PendingJob(
        id=job.id,
        application_name=job.application.name,
        install_command=getattr(job, '_interpolated_install_command', job.application.install_command),
        install_parameters=getattr(job, '_interpolated_install_parameters', job.application.install_parameters),
        is_console=False
    )

@app.post("/api/agent/jobs/{job_id}/logs")
def append_job_logs(
    job_id: int,
    body: schemas.JobLogAppend,
    agent: models.Agent = Depends(get_agent_from_token),
    db: Session = Depends(get_db)
):
    job = crud.get_job(db, job_id)
    if not job or job.agent_id != agent.id:
        raise HTTPException(status_code=404, detail="Job not found")
    crud.append_job_logs(db, job, body.logs)
    return {"status": "ok"}

@app.patch("/api/agent/jobs/{job_id}/status")
def update_job_status(
    job_id: int,
    body: schemas.JobStatusUpdate,
    agent: models.Agent = Depends(get_agent_from_token),
    db: Session = Depends(get_db)
):
    job = crud.get_job(db, job_id)
    if not job or job.agent_id != agent.id:
        raise HTTPException(status_code=404, detail="Job not found")
    crud.update_job_status(db, job, body.status, body.error_message)
    return {"status": "ok"}

# ==================== Deployments ====================

@app.get("/api/deployments", response_model=List[schemas.Deployment])
def list_deployments(db: Session = Depends(get_db)):
    return crud.get_deployments(db)

@app.get("/api/deployments/{deployment_id}", response_model=schemas.Deployment)
def get_deployment(deployment_id: int, db: Session = Depends(get_db)):
    d = crud.get_deployment(db, deployment_id)
    if not d:
        raise HTTPException(status_code=404, detail="Deployment not found")
    return d

@app.post("/api/deployments", response_model=schemas.Deployment, status_code=201)
def create_deployment(deployment: schemas.DeploymentCreate, db: Session = Depends(get_db)):
    return crud.create_deployment(db, deployment)

# ==================== Dashboard ====================

@app.get("/api/dashboard", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    return crud.get_dashboard_stats(db)

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=9090, reload=True)
