import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getApplications, getServers, createDeployment } from '@/lib/api';
import { getOSIcon } from '@/lib/utils';
import { Rocket, CheckCircle2 } from 'lucide-react';
import type { Application, Server } from '@/types';

interface DeploymentWizardProps {
  onDeploymentCreated: (deploymentId: number) => void;
}

export function DeploymentWizard({ onDeploymentCreated }: DeploymentWizardProps) {
  const [selectedApps, setSelectedApps] = useState<number[]>([]);
  const [selectedServers, setSelectedServers] = useState<number[]>([]);
  const queryClient = useQueryClient();

  const { data: applications = [] } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => (await getApplications()).data,
  });

  const { data: servers = [] } = useQuery({
    queryKey: ['servers'],
    queryFn: async () => (await getServers()).data,
  });

  const deployMutation = useMutation({
    mutationFn: async () => {
      const response = await createDeployment({
        application_ids: selectedApps,
        server_ids: selectedServers,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
      onDeploymentCreated(data.id);
      // Reset selections
      setSelectedApps([]);
      setSelectedServers([]);
    },
  });

  const toggleApp = (appId: number) => {
    setSelectedApps((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  const toggleServer = (serverId: number) => {
    setSelectedServers((prev) =>
      prev.includes(serverId) ? prev.filter((id) => id !== serverId) : [...prev, serverId]
    );
  };

  const canDeploy = selectedApps.length > 0 && selectedServers.length > 0;

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

      {/* Step 2: Select Servers */}
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Select Target Servers</CardTitle>
          <CardDescription>Choose the servers to deploy to</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {servers.map((server: Server) => (
              <div
                key={server.id}
                onClick={() => toggleServer(server.id)}
                className={`cursor-pointer rounded-lg border p-4 transition-all hover:border-slate-400 ${
                  selectedServers.includes(server.id)
                    ? 'border-slate-900 bg-slate-50 dark:border-slate-50 dark:bg-slate-900'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getOSIcon(server.os_type)}</span>
                      <h4 className="font-semibold">{server.hostname}</h4>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{server.ip_address}</p>
                  </div>
                  {selectedServers.includes(server.id) && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
          {servers.length === 0 && (
            <p className="text-center text-sm text-slate-500">
              No servers available. Create one first.
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
              <strong>{selectedServers.length}</strong> server(s)
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
