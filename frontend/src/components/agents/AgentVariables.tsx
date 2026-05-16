import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getAgentVariables, setAgentVariable, deleteAgentVariable } from '@/lib/api';
import type { Agent } from '@/types';
import { Trash2, Plus, Variable } from 'lucide-react';

interface Props {
  agent: Agent;
  onClose: () => void;
}

export function AgentVariables({ agent, onClose }: Props) {
  const queryClient = useQueryClient();
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const { data: variables = [], isLoading } = useQuery({
    queryKey: ['agent-variables', agent.id],
    queryFn: async () => (await getAgentVariables(agent.id)).data,
  });

  const addMutation = useMutation({
    mutationFn: () => setAgentVariable(agent.id, newKey.trim().toUpperCase(), newValue.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-variables', agent.id] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setNewKey('');
      setNewValue('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (variableId: number) => deleteAgentVariable(agent.id, variableId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-variables', agent.id] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim() || addMutation.isPending) return;
    addMutation.mutate();
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Variable className="h-5 w-5" />
            Variables — {agent.name}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-slate-500 -mt-1">
          Use <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs font-mono">{'{{VARIABLE_NAME}}'}</code> in install commands to inject these values per agent.
        </p>

        {/* Variable table */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300 w-1/3">Variable</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300">Value</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400 text-sm">Loading...</td>
                </tr>
              ) : variables.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400 text-sm">
                    No variables yet. Add one below.
                  </td>
                </tr>
              ) : (
                variables.map((v) => (
                  <tr key={v.id} className="border-t hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-2.5">
                      <code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400">
                        {`{{${v.key}}}`}
                      </code>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-700 dark:text-slate-300 break-all">
                      {v.value}
                    </td>
                    <td className="px-2 py-2">
                      <button
                        onClick={() => deleteMutation.mutate(v.id)}
                        disabled={deleteMutation.isPending}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add new variable */}
        <form onSubmit={handleAdd} className="flex gap-2 items-end pt-1">
          <div className="flex-1">
            <label className="text-xs font-medium text-slate-500 mb-1 block">Variable name</label>
            <Input
              placeholder="SID"
              value={newKey}
              onChange={e => setNewKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
              className="font-mono uppercase"
              spellCheck={false}
            />
          </div>
          <div className="flex-[2]">
            <label className="text-xs font-medium text-slate-500 mb-1 block">Value</label>
            <Input
              placeholder="PRD"
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              spellCheck={false}
            />
          </div>
          <Button
            type="submit"
            disabled={!newKey.trim() || !newValue.trim() || addMutation.isPending}
            className="shrink-0"
          >
            <Plus className="h-4 w-4 mr-1" />
            {addMutation.isPending ? 'Adding...' : 'Add'}
          </Button>
        </form>

        <div className="flex justify-end pt-1">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
