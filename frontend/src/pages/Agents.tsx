import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getAgents, createAgent, deleteAgent } from '@/lib/api';
import type { Agent, AgentRegisterResponse } from '@/types';
import { Plus, Trash2, Copy, CheckCircle, Circle, Download, Terminal, Variable } from 'lucide-react';
import { AgentConsole } from '@/components/agents/AgentConsole';
import { AgentVariables } from '@/components/agents/AgentVariables';

const PLATFORMS = [
  { id: 'linux-amd64',   label: 'Linux',         arch: 'x86_64',  icon: '🐧' },
  { id: 'linux-arm64',   label: 'Linux',         arch: 'ARM64',   icon: '🐧' },
  { id: 'windows-amd64', label: 'Windows',       arch: 'x86_64',  icon: '🪟' },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="ml-2 text-slate-400 hover:text-slate-600">
      {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

export default function Agents() {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [installInfo, setInstallInfo] = useState<AgentRegisterResponse | null>(null);
  const [consoleAgent, setConsoleAgent] = useState<Agent | null>(null);
  const [variablesAgent, setVariablesAgent] = useState<Agent | null>(null);

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => (await getAgents()).data,
    refetchInterval: 10000,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => createAgent({ name }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setInstallInfo(res.data);
      setShowAddDialog(false);
      setShowInstallDialog(true);
      setNewAgentName('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAgent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agents'] }),
  });

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return 'Never';
    const diff = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return new Date(lastSeen).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Agents</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Manage agents installed on your target servers
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Agent
        </Button>
      </div>

      {/* Download section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4" />
            Download Agent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-slate-500">
            Download the agent binary for your target server's platform, then run it with the token shown after registering.
          </p>
          <div className="flex flex-wrap gap-3">
            {PLATFORMS.map((p) => (
              <a
                key={p.id}
                href={`/api/agents/download/${p.id}`}
                download
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <span className="text-lg">{p.icon}</span>
                <div className="text-left">
                  <div className="font-semibold">{p.label}</div>
                  <div className="text-xs text-slate-400">{p.arch}</div>
                </div>
                <Download className="ml-2 h-3.5 w-3.5 text-slate-400" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div>Loading...</div>
      ) : agents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-slate-500">No agents registered yet.</p>
            <p className="mt-1 text-sm text-slate-400">Click "Add Agent" to register a new one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {agents.map((agent) => (
            <Card key={agent.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {agent.status === 'online' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-300" />
                    )}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      agent.status === 'online'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {agent.status.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-50">{agent.name}</p>
                    <p className="text-sm text-slate-500">
                      {agent.hostname || 'Not connected'}{agent.ip_address ? ` — ${agent.ip_address}` : ''}
                      {agent.os_type ? ` (${agent.os_type})` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-400">Last seen: {formatLastSeen(agent.last_seen)}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVariablesAgent(agent)}
                  >
                    <Variable className="mr-1.5 h-4 w-4" />
                    Variables
                    {agent.variables?.length > 0 && (
                      <span className="ml-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                        {agent.variables.length}
                      </span>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConsoleAgent(agent)}
                  >
                    <Terminal className="mr-1.5 h-4 w-4" /> Console
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(agent.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Agent Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Agent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="agentName">Agent Name</Label>
              <Input
                id="agentName"
                placeholder="e.g. web-server-01"
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button
              className="w-full"
              disabled={!newAgentName.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate(newAgentName.trim())}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Agent'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Agent Variables */}
      {variablesAgent && (
        <AgentVariables agent={variablesAgent} onClose={() => setVariablesAgent(null)} />
      )}

      {/* Agent Console */}
      {consoleAgent && (
        <AgentConsole agent={consoleAgent} onClose={() => setConsoleAgent(null)} />
      )}

      {/* Install Instructions Dialog */}
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agent "{installInfo?.name}" created!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-slate-600">
              Copy and run one of the commands below on your target server to start the agent:
            </p>
            <div>
              <Label className="text-xs font-semibold uppercase text-slate-500">Linux</Label>
              <div className="mt-1 flex items-center rounded-md bg-slate-950 px-3 py-2">
                <code className="flex-1 text-xs text-green-400 break-all">
                  {installInfo?.install_command_linux}
                </code>
                <CopyButton text={installInfo?.install_command_linux || ''} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase text-slate-500">Windows (PowerShell)</Label>
              <div className="mt-1 flex items-center rounded-md bg-slate-950 px-3 py-2">
                <code className="flex-1 text-xs text-blue-400 break-all">
                  {installInfo?.install_command_windows}
                </code>
                <CopyButton text={installInfo?.install_command_windows || ''} />
              </div>
            </div>
            <p className="text-xs text-slate-400">
              The agent will appear as Online within 10 seconds after starting.
            </p>
            <Button className="w-full" onClick={() => setShowInstallDialog(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
