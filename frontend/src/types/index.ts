export type OSType = 'linux' | 'windows';

export type DeploymentStatus = 'pending' | 'running' | 'success' | 'failed';

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

export interface Server {
  id: number;
  hostname: string;
  ip_address: string;
  os_type: OSType;
  username: string;
  port: number;
  created_at: string;
  updated_at: string;
}

export interface Deployment {
  id: number;
  status: DeploymentStatus;
  logs: string;
  started_at: string;
  completed_at?: string;
  error_message?: string;
  applications: Application[];
  servers: Server[];
}

export interface DashboardStats {
  total_servers: number;
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

export interface ServerCreate {
  hostname: string;
  ip_address: string;
  os_type: OSType;
  username: string;
  password?: string;
  ssh_key_content?: string;
  port: number;
}

export interface DeploymentCreate {
  application_ids: number[];
  server_ids: number[];
}
