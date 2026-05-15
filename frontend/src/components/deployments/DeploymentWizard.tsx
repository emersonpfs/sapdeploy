import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getApplications, getAgents, createDeployment } from '@/lib/api';
import { getOSIcon } from '@/lib/utils';
import { Rocket, CheckCircle2 } from 'lucide-react';
import type { Application, Agent } from '@/types';

interface DeploymentWizardProps {
  onDeploymentCreated: (deploymentId: number) => void;
}

export function DeploymentWizard({ onDeploymentCreated }: DeploymentWizardProps) {
  const [selectedApps, setSelectedApps] = useState<number[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<number[]>([]);
  const queryClient = useQueryClient();

  const { data: applications = [] } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => (await getApplications()).data,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => (await getAgents()).data,
  });

  const deployMutation = useMutation({
    mutationFn: async () => {
      const response = await createDeployment({
        application_ids: selectedApps,
        agent_ids: selectedAgents,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
      onDeploymentCreated(data.id);
      // Reset selections
      setSelectedApps([]);
      setSelectedAgents([]);
    },
  });

  const toggleApp = (appId: number) => {
    setSelectedApps((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  const toggleAgent = (agentId: number) => {
    setSelectedAgents((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
  };

  const canDeploy = selectedApps.length > 0 && selectedAgents.length > 0;

  return (
    <div className="space-y-6">
      {/* Step 1: Select Applications */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Select Applications</CardTitle>
          <CardDescription>Choose the applications you want to deploy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {applications.map((app: Application) => (
              <div
                key={app.id}
                onClick={() => toggleApp(app.id)}
                className={`cursor-pointer rounded-lg border p-4 transition-all hover:border-slate-400 ${
                  selectedApps.includes(app.id)
                    ? 'border-slate-900 bg-slate-50 dark:border-slate-50 dark:bg-slate-900'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getOSIcon(app.os_type)}</span>
                      <h4 className="font-semibold">{app.name}</h4>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">v{app.version}</p>
                  </div>
                  {selectedApps.includes(app.id) && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
          {applications.length === 0 && (
            <p className="text-center text-sm text-slate-500">
              No applications available. Create one first.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Select Agents */}
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Select Target Agents</CardTitle>
          <CardDescription>Choose the agents to deploy to</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent: Agent) => (
              <div
                key={agent.id}
                onClick={() => toggleAgent(agent.id)}
                className={`cursor-pointer rounded-lg border p-4 transition-all hover:border-slate-400 ${
                  selectedAgents.includes(agent.id)
                    ? 'border-slate-900 bg-slate-50 dark:border-slate-50 dark:bg-slate-900'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold">{agent.name}</h4>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        agent.status === 'online'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {agent.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {agent.hostname || 'Not connected'}
                      {agent.ip_address ? ` — ${agent.ip_address}` : ''}
                    </p>
                    {agent.os_type && (
                      <p className="text-xs text-slate-400">{agent.os_type}</p>
                    )}
                  </div>
                  {selectedAgents.includes(agent.id) && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
          {agents.length === 0 && (
            <p className="text-center text-sm text-slate-500">
              No agents available. Register one first.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Deploy Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={() => deployMutation.mutate()}
          disabled={!canDeploy || deployMutation.isPending}
          className="min-w-48"
        >
          <Rocket className="mr-2 h-5 w-5" />
          {deployMutation.isPending ? 'Starting Deployment...' : 'Start Deployment'}
        </Button>
      </div>

      {/* Summary */}
      {canDeploy && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Ready to deploy <strong>{selectedApps.length}</strong> application(s) to{' '}
              <strong>{selectedAgents.length}</strong> agent(s)
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
