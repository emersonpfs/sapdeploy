import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getApplications, getAgents, createDeployment } from '@/lib/api';
import type { Application, Agent } from '@/types';
import {
  Rocket, ChevronRight, ChevronLeft, CheckCircle2,
  Package, Bot, ClipboardList, Plus, X,
  ArrowUp, ArrowDown, GripVertical,
} from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (deploymentId: number) => void;
}

const STEPS = [
  { id: 1, label: 'New Job',     icon: Rocket },
  { id: 2, label: 'Pack',        icon: Package },
  { id: 3, label: 'Agent',       icon: Bot },
  { id: 4, label: 'Review',      icon: ClipboardList },
];

// ── Step indicator ──────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, idx) => {
        const done = step.id < current;
        const active = step.id === current;
        const Icon = step.icon;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                done   ? 'border-green-500 bg-green-500 text-white' :
                active ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-50 dark:bg-slate-50 dark:text-slate-900' :
                         'border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900'
              }`}>
                {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={`text-xs font-medium ${active ? 'text-slate-900 dark:text-slate-50' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`mb-5 mx-2 h-0.5 w-12 transition-all ${done ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Pack Builder (Step 2) ───────────────────────────────────────────────────
function PackBuilder({
  applications,
  pack,
  onAdd,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  applications: Application[];
  pack: number[];           // ordered list of app IDs
  onAdd: (id: number) => void;
  onRemove: (id: number) => void;
  onMoveUp: (idx: number) => void;
  onMoveDown: (idx: number) => void;
}) {
  const available = applications.filter(a => !pack.includes(a.id));
  const packApps  = pack.map(id => applications.find(a => a.id === id)).filter(Boolean) as Application[];

  return (
    <div className="grid grid-cols-2 gap-4 min-h-[320px]">

      {/* Left — Available applications */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Available ({available.length})
        </p>
        <div className="flex-1 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
          {available.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-sm">
              <CheckCircle2 className="h-6 w-6 mb-2 text-green-400" />
              All added to pack
            </div>
          ) : (
            available.map(app => (
              <div
                key={app.id}
                className="flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">{app.os_type === 'linux' ? '🐧' : '🪟'}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{app.name}</p>
                    <p className="text-xs text-slate-400">v{app.version}</p>
                  </div>
                </div>
                <button
                  onClick={() => onAdd(app.id)}
                  className="shrink-0 ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-700 dark:bg-slate-50 dark:text-slate-900"
                  title="Add to pack"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right — Installation pack (ordered) */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Installation Pack ({packApps.length})
        </p>
        <div className="flex-1 overflow-y-auto rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 divide-y divide-slate-100 dark:divide-slate-800">
          {packApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-10 text-slate-400 text-sm text-center px-4">
              <Package className="h-6 w-6 mb-2 text-slate-300" />
              Click <strong className="mx-1 text-slate-500">+</strong> on an app<br/>to add it here
            </div>
          ) : (
            packApps.map((app, idx) => (
              <div
                key={app.id}
                className="flex items-center gap-2 px-2 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {/* Order badge */}
                <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 text-xs font-bold">
                  {idx + 1}
                </span>

                {/* App info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{app.name}</p>
                  <p className="text-xs text-slate-400">v{app.version}</p>
                </div>

                {/* Reorder + remove controls */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => onMoveUp(idx)}
                    disabled={idx === 0}
                    className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    title="Move up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onMoveDown(idx)}
                    disabled={idx === packApps.length - 1}
                    className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    title="Move down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onRemove(app.id)}
                    className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                    title="Remove"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Agent multi-select (Step 3) ─────────────────────────────────────────────
function AgentSelector({
  agents,
  selected,
  onToggle,
}: {
  agents: Agent[];
  selected: number[];
  onToggle: (id: number) => void;
}) {
  if (agents.length === 0) {
    return <p className="text-center py-8 text-sm text-slate-400">No agents registered. Go to Agents to register one.</p>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {agents.map(agent => {
        const isSelected = selected.includes(agent.id);
        return (
          <div
            key={agent.id}
            onClick={() => onToggle(agent.id)}
            className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
              isSelected
                ? 'border-slate-900 bg-slate-50 dark:border-slate-50 dark:bg-slate-800'
                : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{agent.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    agent.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {agent.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {agent.hostname || 'Not connected'}
                  {agent.ip_address ? ` · ${agent.ip_address}` : ''}
                  {agent.os_type ? ` · ${agent.os_type}` : ''}
                </p>
              </div>
              {isSelected && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main wizard ─────────────────────────────────────────────────────────────
export function NewDeploymentWizard({ open, onOpenChange, onCreated }: Props) {
  const [step, setStep] = useState(1);
  const [selectedApps, setSelectedApps] = useState<number[]>([]);   // ordered by selection
  const [selectedAgents, setSelectedAgents] = useState<number[]>([]);

  const { data: applications = [] } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => (await getApplications()).data,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => (await getAgents()).data,
  });

  const createMutation = useMutation({
    mutationFn: () => createDeployment({ application_ids: selectedApps, agent_ids: selectedAgents }),
    onSuccess: (res) => {
      onCreated(res.data.id);
      resetAndClose();
    },
  });

  const resetAndClose = () => {
    setStep(1);
    setSelectedApps([]);
    setSelectedAgents([]);
    onOpenChange(false);
  };

  // Pack actions
  const addApp = (id: number) => setSelectedApps(prev => [...prev, id]);
  const removeApp = (id: number) => setSelectedApps(prev => prev.filter(x => x !== id));

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setSelectedApps(prev => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = (idx: number) => {
    setSelectedApps(prev => {
      if (idx === prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const toggleAgent = (id: number) =>
    setSelectedAgents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const selectedAppObjs   = selectedApps.map(id => applications.find((a: Application) => a.id === id)).filter(Boolean) as Application[];
  const selectedAgentObjs = agents.filter((a: Agent) => selectedAgents.includes(a.id));

  const canProceed =
    step === 1 ? true :
    step === 2 ? selectedApps.length > 0 :
    step === 3 ? selectedAgents.length > 0 :
    true;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Deployment Job</DialogTitle>
        </DialogHeader>

        <StepIndicator current={step} />

        {/* Step 1 — Intro */}
        {step === 1 && (
          <div className="flex flex-col items-center justify-center py-6 text-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Rocket className="h-8 w-8 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Create a Deployment Job</h3>
              <p className="mt-2 text-sm text-slate-500 max-w-md">
                Build an installation pack choosing the apps and their order, select the target agents,
                review and submit. The agent will install each application in sequence.
              </p>
            </div>
          </div>
        )}

        {/* Step 2 — Pack Builder */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Build your installation pack and define the sequence:</p>
              {selectedApps.length > 0 && (
                <span className="text-xs text-slate-400">{selectedApps.length} app{selectedApps.length !== 1 ? 's' : ''} in pack</span>
              )}
            </div>
            <PackBuilder
              applications={applications}
              pack={selectedApps}
              onAdd={addApp}
              onRemove={removeApp}
              onMoveUp={moveUp}
              onMoveDown={moveDown}
            />
          </div>
        )}

        {/* Step 3 — Select Agents */}
        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">Select one or more agents to deploy to:</p>
            <AgentSelector
              agents={agents}
              selected={selectedAgents}
              onToggle={toggleAgent}
            />
          </div>
        )}

        {/* Step 4 — Review */}
        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Review your deployment before submitting:</p>

            {/* Installation pack with ordered sequence */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 text-xs font-semibold uppercase text-slate-500 flex items-center justify-between">
                <span>Installation Pack ({selectedAppObjs.length})</span>
                <span className="text-slate-400 normal-case font-normal">in order</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {selectedAppObjs.map((app, idx) => (
                  <div key={app.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-base">{app.os_type === 'linux' ? '🐧' : '🪟'}</span>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-100">{app.name}</p>
                      <p className="text-xs text-slate-400">v{app.version}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Agents */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 text-xs font-semibold uppercase text-slate-500">
                Agents ({selectedAgentObjs.length})
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {selectedAgentObjs.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-100">{agent.name}</p>
                      <p className="text-xs text-slate-400">
                        {agent.hostname || 'Not connected'}{agent.ip_address ? ` · ${agent.ip_address}` : ''}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      agent.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {agent.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
              This will create{' '}
              <strong>{selectedAppObjs.length * selectedAgentObjs.length}</strong>{' '}
              job{selectedAppObjs.length * selectedAgentObjs.length !== 1 ? 's' : ''}{' '}
              ({selectedAppObjs.length} app{selectedAppObjs.length !== 1 ? 's' : ''} × {selectedAgentObjs.length} agent{selectedAgentObjs.length !== 1 ? 's' : ''}).
              Each agent will install the apps in the sequence above.
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
          <Button
            variant="outline"
            onClick={() => step === 1 ? resetAndClose() : setStep(s => s - 1)}
          >
            {step === 1 ? 'Cancel' : <><ChevronLeft className="mr-1 h-4 w-4" /> Back</>}
          </Button>

          {step < 4 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed}>
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              className="min-w-36"
            >
              <Rocket className="mr-2 h-4 w-4" />
              {createMutation.isPending ? 'Submitting...' : 'Finish & Deploy'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
