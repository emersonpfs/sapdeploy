import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NewDeploymentWizard } from '@/components/deployments/NewDeploymentWizard';
import { JobLogViewer } from '@/components/deployments/JobLogViewer';
import { getDeployments } from '@/lib/api';
import type { Deployment } from '@/types';
import { Plus, Rocket, Eye, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    pending:  { label: 'Pending',  className: 'bg-slate-100 text-slate-600',   icon: <Clock className="h-3 w-3" /> },
    running:  { label: 'Running',  className: 'bg-blue-100 text-blue-700',    icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    success:  { label: 'Success',  className: 'bg-green-100 text-green-700',  icon: <CheckCircle2 className="h-3 w-3" /> },
    failed:   { label: 'Failed',   className: 'bg-red-100 text-red-700',      icon: <XCircle className="h-3 w-3" /> },
  };
  const s = map[status] ?? map['pending'];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.className}`}>
      {s.icon} {s.label}
    </span>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function Deployments() {
  const queryClient = useQueryClient();
  const [showWizard, setShowWizard] = useState(false);
  const [viewingDeploymentId, setViewingDeploymentId] = useState<number | null>(null);

  const { data: deployments = [], isLoading } = useQuery({
    queryKey: ['deployments'],
    queryFn: async () => (await getDeployments()).data,
    refetchInterval: 5000,
  });

  const handleDeploymentCreated = (id: number) => {
    queryClient.invalidateQueries({ queryKey: ['deployments'] });
    setShowWizard(false);
    setViewingDeploymentId(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Deployments</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Create and manage deployment jobs
          </p>
        </div>
        <Button onClick={() => setShowWizard(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Deployment
        </Button>
      </div>

      {/* Jobs list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : deployments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Rocket className="h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-medium text-slate-700 dark:text-slate-300">No deployments yet</h3>
            <p className="mt-1 text-sm text-slate-400">Click "New Deployment" to create your first job.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Applications</th>
                <th className="px-4 py-3 text-left">Agents</th>
                <th className="px-4 py-3 text-left">Jobs</th>
                <th className="px-4 py-3 text-left">Started</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-950">
              {deployments.map((d: Deployment) => (
                <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-400">#{d.id}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {d.applications.map(a => a.name).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {d.agents.map(a => a.name).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {d.jobs.map(j => (
                        <span
                          key={j.id}
                          title={`${j.application.name} — ${j.status}`}
                          className={`h-2 w-2 rounded-full ${
                            j.status === 'success' ? 'bg-green-500' :
                            j.status === 'failed'  ? 'bg-red-500' :
                            j.status === 'running' ? 'bg-blue-400' :
                            'bg-slate-300'
                          }`}
                        />
                      ))}
                      <span className="ml-1 text-xs text-slate-400">{d.jobs.length} job{d.jobs.length !== 1 ? 's' : ''}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(d.started_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingDeploymentId(d.id)}
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" /> View Logs
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Deployment Wizard */}
      <NewDeploymentWizard
        open={showWizard}
        onOpenChange={setShowWizard}
        onCreated={handleDeploymentCreated}
      />

      {/* Job Log Viewer */}
      {viewingDeploymentId && (
        <JobLogViewer
          deploymentId={viewingDeploymentId}
          onClose={() => setViewingDeploymentId(null)}
        />
      )}
    </div>
  );
}
