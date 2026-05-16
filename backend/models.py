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

class AgentStatus(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"

class JobStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"

deployment_applications = Table(
    'deployment_applications', Base.metadata,
    Column('deployment_id', Integer, ForeignKey('deployments.id')),
    Column('application_id', Integer, ForeignKey('applications.id'))
)

deployment_agents = Table(
    'deployment_agents', Base.metadata,
    Column('deployment_id', Integer, ForeignKey('deployments.id')),
    Column('agent_id', Integer, ForeignKey('agents.id'))
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

class Agent(Base):
    __tablename__ = "agents"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    hostname = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    os_type = Column(String, nullable=True)
    token = Column(String, unique=True, index=True)
    last_seen = Column(DateTime, nullable=True)
    status = Column(Enum(AgentStatus), default=AgentStatus.OFFLINE)
    created_at = Column(DateTime, default=datetime.utcnow)
    jobs = relationship("Job", back_populates="agent")
    deployments = relationship("Deployment", secondary=deployment_agents, back_populates="agents")
    variables = relationship("AgentVariable", back_populates="agent", cascade="all, delete-orphan")

class AgentVariable(Base):
    __tablename__ = "agent_variables"
    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False)
    key = Column(String, nullable=False)
    value = Column(Text, nullable=False)
    agent = relationship("Agent", back_populates="variables")

class Deployment(Base):
    __tablename__ = "deployments"
    id = Column(Integer, primary_key=True, index=True)
    status = Column(Enum(DeploymentStatus), default=DeploymentStatus.PENDING)
    logs = Column(Text, default="")
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    applications = relationship("Application", secondary=deployment_applications, back_populates="deployments")
    agents = relationship("Agent", secondary=deployment_agents, back_populates="deployments")
    jobs = relationship("Job", back_populates="deployment")

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    deployment_id = Column(Integer, ForeignKey("deployments.id"), nullable=True)
    agent_id = Column(Integer, ForeignKey("agents.id"))
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=True)
    custom_command = Column(Text, nullable=True)   # for ad-hoc console exec
    status = Column(Enum(JobStatus), default=JobStatus.PENDING)
    logs = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    agent = relationship("Agent", back_populates="jobs")
    deployment = relationship("Deployment", back_populates="jobs")
    application = relationship("Application")
