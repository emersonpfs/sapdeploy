export type OSType = 'linux' | 'windows';
export type DeploymentStatus = 'pending' | 'running' | 'success' | 'failed';
export type AgentStatus = 'online' | 'offline';
export type JobStatus = 'pending' | 'running' | 'success' | 'failed';

export interface Application {
  id: number;
  name: string;
  version: string;
  os_type: OSType;
  installer_url?: string;
  description?: string;
  install_command: string;
  install_parameters?: string;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: number;
  name: string;
  hostname?: string;
  ip_address?: string;
  os_type?: string;
  status: AgentStatus;
  last_seen?: string;
  created_at: string;
}

export interface AgentRegisterResponse {
  id: number;
  name: string;
  token: string;
  install_command_linux: string;
  install_command_windows: string;
}

export interface Job {
  id: number;
  deployment_id: number;
  agent_id: number;
  application_id: number;
  status: JobStatus;
  logs: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  application: Application;
}

export interface Deployment {
  id: number;
  status: DeploymentStatus;
  logs: string;
  started_at: string;
  completed_at?: string;
  error_message?: string;
  applications: Application[];
  agents: Agent[];
  jobs: Job[];
}

export interface DashboardStats {
  total_agents: number;
  total_applications: number;
  total_deployments: number;
  recent_deployments: Deployment[];
  success_rate: number;
}

export interface ApplicationCreate {
  name: string;
  version: string;
  os_type: OSType;
  installer_url?: string;
  description?: string;
  install_command: string;
  install_parameters?: string;
}

export interface DeploymentCreate {
  application_ids: number[];
  agent_ids: number[];
}
