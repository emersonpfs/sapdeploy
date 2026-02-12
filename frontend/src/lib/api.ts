import axios from 'axios';
import type {
  Application,
  ApplicationCreate,
  Server,
  ServerCreate,
  Deployment,
  DeploymentCreate,
  DashboardStats,
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Applications
export const getApplications = () => api.get<Application[]>('/applications');
export const getApplication = (id: number) => api.get<Application>(`/applications/${id}`);
export const createApplication = (data: ApplicationCreate) => api.post<Application>('/applications', data);
export const updateApplication = (id: number, data: Partial<ApplicationCreate>) => 
  api.put<Application>(`/applications/${id}`, data);
export const deleteApplication = (id: number) => api.delete(`/applications/${id}`);

// Servers
export const getServers = () => api.get<Server[]>('/servers');
export const getServer = (id: number) => api.get<Server>(`/servers/${id}`);
export const createServer = (data: ServerCreate) => api.post<Server>('/servers', data);
export const updateServer = (id: number, data: Partial<ServerCreate>) => 
  api.put<Server>(`/servers/${id}`, data);
export const deleteServer = (id: number) => api.delete(`/servers/${id}`);

// Deployments
export const getDeployments = () => api.get<Deployment[]>('/deployments');
export const getDeployment = (id: number) => api.get<Deployment>(`/deployments/${id}`);
export const createDeployment = (data: DeploymentCreate) => api.post<Deployment>('/deployments', data);

// Dashboard
export const getDashboardStats = () => api.get<DashboardStats>('/dashboard');

export default api;
