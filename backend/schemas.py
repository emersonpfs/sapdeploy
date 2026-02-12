from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from models import OSType, DeploymentStatus

# Application Schemas
class ApplicationBase(BaseModel):
    name: str
    version: str
    os_type: OSType
    installer_url: Optional[str] = None
    description: Optional[str] = None
    install_command: str
    install_parameters: Optional[str] = None

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(BaseModel):
    name: Optional[str] = None
    version: Optional[str] = None
    os_type: Optional[OSType] = None
    installer_url: Optional[str] = None
    description: Optional[str] = None
    install_command: Optional[str] = None
    install_parameters: Optional[str] = None

class Application(ApplicationBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Server Schemas
class ServerBase(BaseModel):
    hostname: str
    ip_address: str
    os_type: OSType
    username: str
    password: Optional[str] = None
    ssh_key_content: Optional[str] = None
    port: int = Field(default=22)

class ServerCreate(ServerBase):
    pass

class ServerUpdate(BaseModel):
    hostname: Optional[str] = None
    ip_address: Optional[str] = None
    os_type: Optional[OSType] = None
    username: Optional[str] = None
    password: Optional[str] = None
    ssh_key_content: Optional[str] = None
    port: Optional[int] = None

class Server(ServerBase):
    id: int
    created_at: datetime
    updated_at: datetime
    # Don't expose password or SSH key in responses
    password: Optional[str] = Field(exclude=True)
    ssh_key_content: Optional[str] = Field(exclude=True)
    
    class Config:
        from_attributes = True

# Deployment Schemas
class DeploymentCreate(BaseModel):
    application_ids: List[int]
    server_ids: List[int]

class DeploymentLog(BaseModel):
    server_id: int
    server_hostname: str
    application_id: int
    application_name: str
    output: str
    success: bool

class Deployment(BaseModel):
    id: int
    status: DeploymentStatus
    logs: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    applications: List[Application]
    servers: List[Server]
    
    class Config:
        from_attributes = True

# Dashboard Stats
class DashboardStats(BaseModel):
    total_servers: int
    total_applications: int
    total_deployments: int
    recent_deployments: List[Deployment]
    success_rate: float
