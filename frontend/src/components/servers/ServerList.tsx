import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { deleteServer } from '@/lib/api';
import { getOSIcon, formatDate } from '@/lib/utils';
import { Edit2, Trash2, Key, Lock } from 'lucide-react';
import type { Server } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ServerListProps {
  servers: Server[];
  onEdit: (server: Server) => void;
}

export function ServerList({ servers, onEdit }: ServerListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serverToDelete, setServerToDelete] = useState<Server | null>(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteServer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      setDeleteDialogOpen(false);
      setServerToDelete(null);
    },
  });

  const handleDeleteClick = (server: Server) => {
    setServerToDelete(server);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (serverToDelete) {
      deleteMutation.mutate(serverToDelete.id);
    }
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {servers.map((server) => (
          <Card key={server.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-3xl">{getOSIcon(server.os_type)}</span>
                  <div>
                    <CardTitle className="text-lg">{server.hostname}</CardTitle>
                    <CardDescription>{server.ip_address}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Connection Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Usuário:</span>
                  <span className="font-medium">{server.username}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Porta:</span>
                  <span className="font-medium">{server.port}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Autenticação:</span>
                  <div className="flex items-center space-x-1">
                    {server.os_type === 'linux' ? (
                      <>
                        <Key className="h-3 w-3 text-blue-600" />
                        <span className="text-xs font-medium text-blue-600">SSH Key ou Senha</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-3 w-3 text-purple-600" />
                        <span className="text-xs font-medium text-purple-600">Senha</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Connection String Preview */}
              <div className="rounded bg-slate-50 p-2 dark:bg-slate-900">
                <p className="text-xs font-mono text-slate-700 dark:text-slate-300">
                  {server.os_type === 'linux'
                    ? `ssh ${server.username}@${server.ip_address} -p ${server.port}`
                    : `winrm ${server.username}@${server.ip_address}:${server.port}`}
                </p>
              </div>

              {/* Metadata */}
              <div className="flex items-center justify-between pt-2 text-xs text-slate-500 border-t border-slate-200 dark:border-slate-800">
                <span>OS: {server.os_type}</span>
                <span>{formatDate(server.created_at)}</span>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onEdit(server)}
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleDeleteClick(server)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o servidor{' '}
              <strong>{serverToDelete?.hostname}</strong>?
              <br />
              <br />
              Esta ação não pode ser desfeita e todos os deployments associados serão
              afetados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
