import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getServers, createServer, updateServer } from '@/lib/api';
import { Server as ServerIcon, Plus } from 'lucide-react';
import { ServerForm } from '@/components/servers/ServerForm';
import { ServerList } from '@/components/servers/ServerList';
import type { Server, ServerCreate } from '@/types';

export default function Servers() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<Server | undefined>(undefined);
  const queryClient = useQueryClient();

  const { data: servers = [], isLoading } = useQuery({
    queryKey: ['servers'],
    queryFn: async () => (await getServers()).data,
  });

  const createMutation = useMutation({
    mutationFn: (data: ServerCreate) => createServer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      setFormOpen(false);
      setEditingServer(undefined);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ServerCreate }) =>
      updateServer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      setFormOpen(false);
      setEditingServer(undefined);
    },
  });

  const handleSubmit = (data: ServerCreate) => {
    if (editingServer) {
      updateMutation.mutate({ id: editingServer.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (server: Server) => {
    setEditingServer(server);
    setFormOpen(true);
  };

  const handleNewServer = () => {
    setEditingServer(undefined);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Servidores
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Gerencie os servidores de destino para deployments
          </p>
        </div>
        <Button onClick={handleNewServer} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Novo Servidor
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-500">Carregando servidores...</p>
        </div>
      )}

      {/* Servers List */}
      {!isLoading && servers.length > 0 && (
        <ServerList servers={servers} onEdit={handleEdit} />
      )}

      {/* Empty State */}
      {!isLoading && servers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ServerIcon className="h-16 w-16 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-2">
              Nenhum servidor cadastrado
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 text-center">
              Comece adicionando seu primeiro servidor
            </p>
            <Button onClick={handleNewServer}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Servidor
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Server Form Dialog */}
      <ServerForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingServer(undefined);
        }}
        onSubmit={handleSubmit}
        server={editingServer}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
