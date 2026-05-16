from sqlalchemy.orm import Session
from typing import List, Optional
import models
import schemas
import uuid
import re
from datetime import datetime, timedelta

# Application CRUD
def get_applications(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Application).offset(skip).limit(limit).all()

def get_application(db: Session, application_id: int):
    return db.query(models.Application).filter(models.Application.id == application_id).first()

def create_application(db: Session, application: schemas.ApplicationCreate):
    db_app = models.Application(**application.model_dump())
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    return db_app

def update_application(db: Session, application_id: int, application: schemas.ApplicationUpdate):
    db_app = get_application(db, application_id)
    if db_app:
        for key, value in application.model_dump(exclude_unset=True).items():
            setattr(db_app, key, value)
        db.commit()
        db.refresh(db_app)
    return db_app

def delete_application(db: Session, application_id: int):
    db_app = get_application(db, application_id)
    if db_app:
        db.delete(db_app)
        db.commit()
        return True
    return False

# Agent CRUD
def get_agents(db: Session):
    agents = db.query(models.Agent).all()
    # Update online/offline status based on last_seen
    threshold = datetime.utcnow() - timedelta(seconds=30)
    for agent in agents:
        if agent.last_seen and agent.last_seen > threshold:
            agent.status = models.AgentStatus.ONLINE
        else:
            agent.status = models.AgentStatus.OFFLINE
    db.commit()
    return agents

def get_agent_by_token(db: Session, token: str):
    return db.query(models.Agent).filter(models.Agent.token == token).first()

def get_agent(db: Session, agent_id: int):
    return db.query(models.Agent).filter(models.Agent.id == agent_id).first()

def create_agent(db: Session, agent: schemas.AgentCreate):
    token = str(uuid.uuid4())
    db_agent = models.Agent(name=agent.name, token=token)
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent

def delete_agent(db: Session, agent_id: int):
    db_agent = get_agent(db, agent_id)
    if db_agent:
        db.delete(db_agent)
        db.commit()
        return True
    return False

# Agent Variable CRUD
def get_agent_variables(db: Session, agent_id: int) -> list:
    return db.query(models.AgentVariable).filter(
        models.AgentVariable.agent_id == agent_id
    ).order_by(models.AgentVariable.key).all()

def upsert_agent_variable(db: Session, agent_id: int, key: str, value: str) -> models.AgentVariable:
    existing = db.query(models.AgentVariable).filter(
        models.AgentVariable.agent_id == agent_id,
        models.AgentVariable.key == key
    ).first()
    if existing:
        existing.value = value
        db.commit()
        db.refresh(existing)
        return existing
    var = models.AgentVariable(agent_id=agent_id, key=key, value=value)
    db.add(var)
    db.commit()
    db.refresh(var)
    return var

def delete_agent_variable(db: Session, variable_id: int, agent_id: int) -> bool:
    var = db.query(models.AgentVariable).filter(
        models.AgentVariable.id == variable_id,
        models.AgentVariable.agent_id == agent_id
    ).first()
    if var:
        db.delete(var)
        db.commit()
        return True
    return False

def interpolate_command(command: str, variables: list) -> str:
    """Replace {{KEY}} placeholders with agent variable values."""
    if not command or not variables:
        return command
    var_map = {v.key: v.value for v in variables}
    def replacer(match):
        key = match.group(1)
        return var_map.get(key, match.group(0))
    return re.sub(r'\{\{(\w+)\}\}', replacer, command)

def update_agent_heartbeat(db: Session, agent: models.Agent, heartbeat: schemas.AgentHeartbeat):
    agent.hostname = heartbeat.hostname
    agent.ip_address = heartbeat.ip_address
    agent.os_type = heartbeat.os_type
    agent.last_seen = datetime.utcnow()
    agent.status = models.AgentStatus.ONLINE
    db.commit()
    db.refresh(agent)
    return agent

# Job CRUD
def get_pending_job_for_agent(db: Session, agent_id: int):
    job = db.query(models.Job).filter(
        models.Job.agent_id == agent_id,
        models.Job.status == models.JobStatus.PENDING
    ).first()
    if job:
        # Attach interpolated commands as transient attributes
        variables = get_agent_variables(db, agent_id)
        if job.custom_command:
            job._interpolated_command = interpolate_command(job.custom_command, variables)
        elif job.application:
            job._interpolated_install_command = interpolate_command(job.application.install_command, variables)
            job._interpolated_install_parameters = interpolate_command(job.application.install_parameters or "", variables)
    return job

def get_job(db: Session, job_id: int):
    return db.query(models.Job).filter(models.Job.id == job_id).first()

def append_job_logs(db: Session, job: models.Job, logs: str):
    job.logs += logs
    if job.status == models.JobStatus.PENDING:
        job.status = models.JobStatus.RUNNING
        job.started_at = datetime.utcnow()
    db.commit()

def update_job_status(db: Session, job: models.Job, status: models.JobStatus, error_message: str = None):
    job.status = status
    job.completed_at = datetime.utcnow()
    if error_message:
        job.error_message = error_message
    db.commit()
    db.refresh(job)
    if job.deployment_id:
        _update_deployment_status(db, job.deployment_id)
    return job

def create_exec_job(db: Session, agent_id: int, command: str) -> models.Job:
    job = models.Job(
        agent_id=agent_id,
        custom_command=command,
        status=models.JobStatus.PENDING
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

def get_console_jobs(db: Session, agent_id: int, limit: int = 50) -> list:
    return db.query(models.Job).filter(
        models.Job.agent_id == agent_id,
        models.Job.custom_command.isnot(None)
    ).order_by(models.Job.created_at.desc()).limit(limit).all()

def _update_deployment_status(db: Session, deployment_id: int):
    deployment = db.query(models.Deployment).filter(models.Deployment.id == deployment_id).first()
    if not deployment:
        return
    jobs = deployment.jobs
    if not jobs:
        return
    statuses = [j.status for j in jobs]
    if all(s in [models.JobStatus.SUCCESS, models.JobStatus.FAILED] for s in statuses):
        if any(s == models.JobStatus.FAILED for s in statuses):
            deployment.status = models.DeploymentStatus.FAILED
        else:
            deployment.status = models.DeploymentStatus.SUCCESS
        deployment.completed_at = datetime.utcnow()
        db.commit()

# Deployment CRUD
def get_deployments(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Deployment).order_by(models.Deployment.started_at.desc()).offset(skip).limit(limit).all()

def get_deployment(db: Session, deployment_id: int):
    return db.query(models.Deployment).filter(models.Deployment.id == deployment_id).first()

def create_deployment(db: Session, deployment: schemas.DeploymentCreate):
    db_deployment = models.Deployment(status=models.DeploymentStatus.RUNNING)

    applications = db.query(models.Application).filter(
        models.Application.id.in_(deployment.application_ids)
    ).all()
    agents = db.query(models.Agent).filter(
        models.Agent.id.in_(deployment.agent_ids)
    ).all()

    db_deployment.applications = applications
    db_deployment.agents = agents
    db.add(db_deployment)
    db.flush()

    # Create one Job per agent x application combination
    for agent in agents:
        for application in applications:
            job = models.Job(
                deployment_id=db_deployment.id,
                agent_id=agent.id,
                application_id=application.id,
                status=models.JobStatus.PENDING
            )
            db.add(job)

    db.commit()
    db.refresh(db_deployment)
    return db_deployment

# Dashboard
def get_dashboard_stats(db: Session):
    total_agents = db.query(models.Agent).count()
    total_applications = db.query(models.Application).count()
    total_deployments = db.query(models.Deployment).count()
    recent_deployments = db.query(models.Deployment).order_by(
        models.Deployment.started_at.desc()
    ).limit(5).all()
    success_count = db.query(models.Deployment).filter(
        models.Deployment.status == models.DeploymentStatus.SUCCESS
    ).count()
    success_rate = (success_count / total_deployments * 100) if total_deployments > 0 else 0
    return schemas.DashboardStats(
        total_agents=total_agents,
        total_applications=total_applications,
        total_deployments=total_deployments,
        recent_deployments=recent_deployments,
        success_rate=success_rate
    )
