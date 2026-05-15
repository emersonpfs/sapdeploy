import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getDeployment } from '@/lib/api';
import type { Job } from '@/types';
import { Terminal, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';

interface Props {
  deploymentId: number;
  onClose: () => void;
}

function JobStatusIcon({ status }: { status: string }) {
  if (status === 'success') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (status === 'failed')  return <XCircle className="h-4 w-4 text-red-500" />;
  if (status === 'running') return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
  return <Clock className="h-4 w-4 text-slate-400" />;
}

function JobStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-slate-100 text-slate-600',
    running: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700',
    failed:  'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${map[status] ?? map['pending']}`}>
      <JobStatusIcon status={status} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function LogConsole({ logs, isActive }: { logs: string; isActive: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="relative rounded-md overflow-hidden">
      <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5">
        <Terminal className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-xs text-slate-400 font-mono">output</span>
        {isActive && (
          <span className="ml-auto flex items-center gap-1 text-xs text-blue-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            live
          </span>
        )}
      </div>
      <div className="max-h-64 overflow-y-auto bg-slate-950 px-4 py-3 font-mono text-xs text-slate-100">
        <pre className="whitespace-pre-wrap break-words">
          {logs || 'Waiting for agent to pick up this job...'}
        </pre>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export function JobLogViewer({ deploymentId, onClose }: Props) {
  const { data: deployment } = useQuery({
    queryKey: ['deployment', deploymentId],
    queryFn: async () => (await getDeployment(deploymentId)).data,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 2000;
      const active = data.jobs.some((j: { status: string }) => j.status === 'pending' || j.status === 'running');
      return active ? 2000 : false;
    },
  });

  if (!deployment) {
    return (
      <Dialog open onOpenChange={() => onClose()}>
        <DialogContent className="max-w-3xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const totalJobs    = deployment.jobs.length;
  const doneJobs     = deployment.jobs.filter(j => j.status === 'success' || j.status === 'failed').length;
  const successJobs  = deployment.jobs.filter(j => j.status === 'success').length;
  const isActive     = deployment.jobs.some(j => j.status === 'pending' || j.status === 'running');

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Deployment #{deployment.id} — Logs
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Summary bar */}
        <div className="flex flex-wrap gap-4 rounded-lg bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm">
          <div>
            <span className="text-slate-400">Status </span>
            <span className={`font-semibold ${
              deployment.status === 'success' ? 'text-green-600' :
              deployment.status === 'failed'  ? 'text-red-600' :
              deployment.status === 'running' ? 'text-blue-600' :
              'text-slate-600'
            }`}>
              {deployment.status.charAt(0).toUpperCase() + deployment.status.slice(1)}
            </span>
          </div>
          <div>
            <span className="text-slate-400">Jobs </span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {doneJobs}/{totalJobs} done · {successJobs} succeeded
            </span>
          </div>
          <div>
            <span className="text-slate-400">Apps </span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {deployment.applications.map(a => a.name).join(', ')}
            </span>
          </div>
          <div>
            <span className="text-slate-400">Agents </span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {deployment.agents.map(a => a.name).join(', ')}
            </span>
          </div>
          {isActive && (
            <div className="ml-auto flex items-center gap-1.5 text-blue-600 text-xs font-medium">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Refreshing automatically...
            </div>
          )}
        </div>

        {/* Jobs */}
        <div className="space-y-4">
          {deployment.jobs.map((job: Job) => (
            <div key={job.id} className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 px-4 py-3">
                <div className="flex items-center gap-3">
                  <JobStatusIcon status={job.status} />
                  <div>
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                      {job.application.name}
                      <span className="ml-2 font-normal text-xs text-slate-400">v{job.application.version}</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      Job #{job.id}
                      {job.started_at && ` · started ${new Date(job.started_at).toLocaleTimeString('pt-BR')}`}
                      {job.completed_at && ` · finished ${new Date(job.completed_at).toLocaleTimeString('pt-BR')}`}
                    </p>
                  </div>
                </div>
                <JobStatusBadge status={job.status} />
              </div>

              <div className="p-3">
                <LogConsole
                  logs={job.logs}
                  isActive={job.status === 'running' || job.status === 'pending'}
                />
                {job.error_message && (
                  <div className="mt-2 rounded bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                    <strong>Error:</strong> {job.error_message}
                  </div>
                )}
              </div>
            </div>
          ))}

          {deployment.jobs.length === 0 && (
            <p className="text-center text-sm text-slate-400 py-6">No jobs found for this deployment.</p>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
