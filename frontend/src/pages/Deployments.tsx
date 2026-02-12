import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeploymentWizard } from '@/components/deployments/DeploymentWizard';
import { LiveConsole } from '@/components/deployments/LiveConsole';
import { Rocket } from 'lucide-react';

export default function Deployments() {
  const [activeDeploymentId, setActiveDeploymentId] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Deployments</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Deploy applications to your servers
          </p>
        </div>
      </div>

      {/* Deployment Wizard */}
      <DeploymentWizard onDeploymentCreated={setActiveDeploymentId} />

      {/* Live Console */}
      {activeDeploymentId && <LiveConsole deploymentId={activeDeploymentId} />}

      {/* Info Card */}
      {!activeDeploymentId && (
        <Card className="border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Rocket className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-slate-50">
                Ready to Deploy
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Select applications and servers above, then click "Start Deployment"
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
