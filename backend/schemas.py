from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from models import OSType, DeploymentStatus, AgentStatus, JobStatus

# ==================== Application Variables ====================

class ApplicationVariableCreate(BaseModel):
    key: str
    value: str

class ApplicationVariableOut(BaseModel):
    id: int
    key: str
    value: str
    class Config:
        from_attributes = True

# ==================== Applications ====================

class ApplicationBase(BaseModel):
    name: str
    app_type: Optional[str] = "generic"
    version: str
    os_type: OSType
    installer_url: Optional[str] = None
    description: Optional[str] = None
    install_command: str
    install_parameters: Optional[str] = None

class ApplicationCreate(ApplicationBase):
    variables: List[ApplicationVariableCreate] = []

class ApplicationUpdate(BaseModel):
    name: Optional[str] = None
    app_type: Optional[str] = None
    version: Optional[str] = None
    os_type: Optional[OSType] = None
    installer_url: Optional[str] = None
    description: Optional[str] = None
    install_command: Optional[str] = None
    install_parameters: Optional[str] = None
    variables: Optional[List[ApplicationVariableCreate]] = None

class Application(ApplicationBase):
    id: int
    created_at: datetime
    updated_at: datetime
    variables: List[ApplicationVariableOut] = []
    class Config:
        from_attributes = True

# ==================== Agents ====================

class AgentCreate(BaseModel):
    name: str

class AgentHeartbeat(BaseModel):
    hostname: str
    ip_address: str
    os_type: str

class AgentOut(BaseModel):
    id: int
    name: str
    hostname: Optional[str] = None
    ip_address: Optional[str] = None
    os_type: Optional[str] = None
    status: AgentStatus
    last_seen: Optional[datetime] = None
    created_at: datetime
    class Config:
        from_attributes = True

class AgentRegisterResponse(BaseModel):
    id: int
    name: str
    token: str
    install_command_linux: str
    install_command_windows: str

# ==================== Jobs ====================

class JobOut(BaseModel):
    id: int
    deployment_id: int
    agent_id: int
    application_id: int
    status: JobStatus
    logs: str
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    application: Application
    class Config:
        from_attributes = True

class PendingJob(BaseModel):
    id: int
    application_name: str
    install_command: str
    install_parameters: Optional[str] = None
    is_console: bool = False

class ExecCommand(BaseModel):
    command: str

class ConsoleJobOut(BaseModel):
    id: int
    command: str
    status: JobStatus
    logs: str
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    class Config:
        from_attributes = True

class JobLogAppend(BaseModel):
    logs: str

class JobStatusUpdate(BaseModel):
    status: JobStatus
    error_message: Optional[str] = None

# ==================== Deployments ====================

class DeploymentCreate(BaseModel):
    application_ids: List[int]
    agent_ids: List[int]

class Deployment(BaseModel):
    id: int
    status: DeploymentStatus
    logs: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    applications: List[Application]
    agents: List[AgentOut]
    jobs: List[JobOut] = []
    class Config:
        from_attributes = True

# ==================== Dashboard ====================

class DashboardStats(BaseModel):
    total_agents: int
    total_applications: int
    total_deployments: int
    recent_deployments: List[Deployment]
    success_rate: float
