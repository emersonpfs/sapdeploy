import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { execCommand, getConsoleJobs, getJob } from '@/lib/api';
import type { Agent, ConsoleJob } from '@/types';
import { CheckCircle2, XCircle, Loader2, Wifi, WifiOff } from 'lucide-react';

interface Props {
  agent: Agent;
  onClose: () => void;
}

interface ConsoleEntry {
  jobId: number;
  command: string;
  output: string;
  status: ConsoleJob['status'];
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR');
}

export function AgentConsole({ agent, onClose }: Props) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [pollingJobIds, setPollingJobIds] = useState<number[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load previous console jobs on open
  const { data: previousJobs } = useQuery({
    queryKey: ['console-jobs', agent.id],
    queryFn: async () => (await getConsoleJobs(agent.id)).data,
  });

  useEffect(() => {
    if (previousJobs && entries.length === 0) {
      const loaded = [...previousJobs].reverse().map(j => ({
        jobId: j.id,
        command: j.command,
        output: j.logs,
        status: j.status,
      }));
      setEntries(loaded);
    }
  }, [previousJobs]);

  // Poll active jobs
  useEffect(() => {
    if (pollingJobIds.length === 0) return;
    const interval = setInterval(async () => {
      const stillActive: number[] = [];
      for (const jobId of pollingJobIds) {
        try {
          const res = await getJob(jobId);
          const job = res.data;
          setEntries(prev => prev.map(e =>
            e.jobId === jobId
              ? { ...e, output: job.logs, status: job.status }
              : e
          ));
          if (job.status === 'pending' || job.status === 'running') {
            stillActive.push(jobId);
          }
        } catch {}
      }
      setPollingJobIds(stillActive);
    }, 1500);
    return () => clearInterval(interval);
  }, [pollingJobIds]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const execMutation = useMutation({
    mutationFn: (cmd: string) => execCommand(agent.id, cmd),
    onSuccess: (res, cmd) => {
      const job = res.data;
      setEntries(prev => [...prev, {
        jobId: job.id,
        command: cmd,
        output: '',
        status: 'pending',
      }]);
      setPollingJobIds(prev => [...prev, job.id]);
      setHistory(prev => [cmd, ...prev.filter(h => h !== cmd)].slice(0, 50));
      setHistoryIdx(-1);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd || execMutation.isPending) return;
    if (cmd === 'clear') {
      setEntries([]);
      setInput('');
      return;
    }
    setInput('');
    execMutation.mutate(cmd);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = Math.min(historyIdx + 1, history.length - 1);
      setHistoryIdx(idx);
      setInput(history[idx] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const idx = Math.max(historyIdx - 1, -1);
      setHistoryIdx(idx);
      setInput(idx === -1 ? '' : history[idx]);
    }
  };

  const statusIcon = (status: ConsoleJob['status']) => {
    if (status === 'success') return <CheckCircle2 className="h-3 w-3 text-green-400 shrink-0 mt-0.5" />;
    if (status === 'failed')  return <XCircle className="h-3 w-3 text-red-400 shrink-0 mt-0.5" />;
    return <Loader2 className="h-3 w-3 text-blue-400 animate-spin shrink-0 mt-0.5" />;
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-950 border-slate-800 gap-0">

        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500 cursor-pointer" onClick={onClose} />
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <div className="h-3 w-3 rounded-full bg-green-500" />
            </div>
            <span className="text-slate-400 text-xs font-mono">
              {agent.hostname || agent.name} — console
            </span>
          </div>
          <div className="flex items-center gap-2">
            {agent.status === 'online'
              ? <><Wifi className="h-3.5 w-3.5 text-green-400" /><span className="text-xs text-green-400">online</span></>
              : <><WifiOff className="h-3.5 w-3.5 text-slate-500" /><span className="text-xs text-slate-500">offline</span></>
            }
          </div>
        </div>

        {/* Console output */}
        <div
          className="h-[500px] overflow-y-auto px-4 py-3 font-mono text-sm space-y-3 cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          {/* Welcome */}
          {entries.length === 0 && (
            <div className="text-slate-500 text-xs">
              Connected to <span className="text-green-400">{agent.name}</span>
              {agent.hostname && <> ({agent.hostname})</>}
              {agent.ip_address && <> · {agent.ip_address}</>}
              {agent.os_type && <> · {agent.os_type}</>}
              <br />
              Type a command and press Enter. Type <span className="text-slate-300">clear</span> to clear the console.
            </div>
          )}

          {entries.map((entry, idx) => (
            <div key={`${entry.jobId}-${idx}`} className="space-y-1">
              {/* Command line */}
              <div className="flex items-start gap-2">
                {statusIcon(entry.status)}
                <div className="flex-1 min-w-0">
                  <span className="text-green-400 select-none">
                    {agent.hostname || agent.name}:~$&nbsp;
                  </span>
                  <span className="text-slate-100">{entry.command}</span>
                </div>
              </div>

              {/* Output */}
              {entry.output && (
                <pre className="text-slate-300 text-xs whitespace-pre-wrap break-words pl-5 leading-relaxed">
                  {entry.output}
                </pre>
              )}

              {/* Status + timing */}
              {(entry.status === 'success' || entry.status === 'failed') && (
                <div className={`pl-5 text-xs ${entry.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {entry.status === 'success' ? '✓ done' : '✗ failed'}
                </div>
              )}

              {(entry.status === 'pending' || entry.status === 'running') && (
                <div className="pl-5 text-xs text-blue-500 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> waiting for agent...
                </div>
              )}
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3 bg-slate-900 border-t border-slate-800">
          <span className="text-green-400 font-mono text-sm shrink-0 select-none">
            {agent.hostname || agent.name}:~$
          </span>
          <input
            ref={inputRef}
            autoFocus
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={agent.status === 'offline'}
            placeholder={agent.status === 'offline' ? 'Agent is offline' : ''}
            className="flex-1 bg-transparent text-slate-100 font-mono text-sm outline-none placeholder:text-slate-600 disabled:cursor-not-allowed"
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
          {execMutation.isPending && (
            <Loader2 className="h-4 w-4 animate-spin text-slate-500 shrink-0" />
          )}
        </form>

      </DialogContent>
    </Dialog>
  );
}
