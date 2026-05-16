import axios from 'axios';
import type {
  Application, ApplicationCreate,
  Agent, AgentRegisterResponse, AgentVariable,
  Deployment, DeploymentCreate,
  DashboardStats, ConsoleJob,
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Applications
export const getApplications = () => api.get<Application[]>('/applications');
export const getApplication = (id: number) => api.get<Application>(`/applications/${id}`);
export const createApplication = (data: ApplicationCreate) => api.post<Application>('/applications', data);
export const updateApplication = (id: number, data: Partial<ApplicationCreate>) => api.put<Application>(`/applications/${id}`, data);
export const deleteApplication = (id: number) => api.delete(`/applications/${id}`);

// Agents
export const getAgents = () => api.get<Agent[]>('/agents');
export const createAgent = (data: { name: string }) => api.post<AgentRegisterResponse>('/agents', data);
export const deleteAgent = (id: number) => api.delete(`/agents/${id}`);
export const execCommand = (agentId: number, command: string) =>
  api.post<ConsoleJob>(`/agents/${agentId}/exec`, { command });
export const getConsoleJobs = (agentId: number) =>
  api.get<ConsoleJob[]>(`/agents/${agentId}/console`);
export const getJob = (jobId: number) => api.get<ConsoleJob>(`/jobs/${jobId}`);
export const getAgentVariables = (agentId: number) =>
  api.get<AgentVariable[]>(`/agents/${agentId}/variables`);
export const setAgentVariable = (agentId: number, key: string, value: string) =>
  api.post<AgentVariable>(`/agents/${agentId}/variables`, { key, value });
export const deleteAgentVariable = (agentId: number, variableId: number) =>
  api.delete(`/agents/${agentId}/variables/${variableId}`);

// Deployments
export const getDeployments = () => api.get<Deployment[]>('/deployments');
export const getDeployment = (id: number) => api.get<Deployment>(`/deployments/${id}`);
export const createDeployment = (data: DeploymentCreate) => api.post<Deployment>('/deployments', data);

// Dashboard
export const getDashboardStats = () => api.get<DashboardStats>('/dashboard');

export default api;
