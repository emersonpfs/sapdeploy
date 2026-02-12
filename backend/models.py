from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base

class OSType(str, enum.Enum):
    LINUX = "linux"
    WINDOWS = "windows"

class DeploymentStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"

# Association table for many-to-many relationship
deployment_applications = Table(
    'deployment_applications',
    Base.metadata,
    Column('deployment_id', Integer, ForeignKey('deployments.id')),
    Column('application_id', Integer, ForeignKey('applications.id'))
)

deployment_servers = Table(
    'deployment_servers',
    Base.metadata,
    Column('deployment_id', Integer, ForeignKey('deployments.id')),
    Column('server_id', Integer, ForeignKey('servers.id'))
)

class Application(Base):
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    version = Column(String)
    os_type = Column(Enum(OSType))
    installer_url = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    install_command = Column(Text)
    install_parameters = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    deployments = relationship("Deployment", secondary=deployment_applications, back_populates="applications")

class Server(Base):
    __tablename__ = "servers"
    
    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String, unique=True, index=True)
    ip_address = Column(String)
    os_type = Column(Enum(OSType))
    username = Column(String)
    # Store encrypted password or key path
    password = Column(String, nullable=True)
    private_key_path = Column(String, nullable=True)
    port = Column(Integer, default=22)  # SSH port for Linux, WinRM port for Windows
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    deployments = relationship("Deployment", secondary=deployment_servers, back_populates="servers")

class Deployment(Base):
    __tablename__ = "deployments"
    
    id = Column(Integer, primary_key=True, index=True)
    status = Column(Enum(DeploymentStatus), default=DeploymentStatus.PENDING)
    logs = Column(Text, default="")
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    
    applications = relationship("Application", secondary=deployment_applications, back_populates="deployments")
    servers = relationship("Server", secondary=deployment_servers, back_populates="deployments")
