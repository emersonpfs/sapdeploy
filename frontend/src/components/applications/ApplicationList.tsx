import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { deleteApplication } from '@/lib/api';
import { getOSIcon, formatDate } from '@/lib/utils';
import { Edit2, Trash2, ExternalLink } from 'lucide-react';
import type { Application } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ApplicationListProps {
  applications: Application[];
  onEdit: (application: Application) => void;
}

export function ApplicationList({ applications, onEdit }: ApplicationListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState<Application | null>(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setDeleteDialogOpen(false);
      setApplicationToDelete(null);
    },
  });

  const handleDeleteClick = (app: Application) => {
    setApplicationToDelete(app);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (applicationToDelete) {
      deleteMutation.mutate(applicationToDelete.id);
    }
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {applications.map((app) => (
          <Card key={app.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-3xl">{getOSIcon(app.os_type)}</span>
                  <div>
                    <CardTitle className="text-lg">{app.name}</CardTitle>
                    <CardDescription>v{app.version}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Description */}
              {app.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                  {app.description}
                </p>
              )}

              {/* Installer URL */}
              {app.installer_url && (
                <div className="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-400">
                  <ExternalLink className="h-3 w-3" />
                  <a
                    href={app.installer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline truncate"
                  >
                    {new URL(app.installer_url).hostname}
                  </a>
                </div>
              )}

              {/* Install Command Preview */}
              <div className="rounded bg-slate-50 p-2 dark:bg-slate-900">
                <p className="text-xs font-mono text-slate-700 dark:text-slate-300 line-clamp-2">
                  {app.install_command}
                </p>
              </div>

              {/* Parameters */}
              {app.install_parameters && (
                <div className="text-xs text-slate-500">
                  <span className="font-medium">Parâmetros:</span>{' '}
                  <span className="font-mono">{app.install_parameters}</span>
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center justify-between pt-2 text-xs text-slate-500 border-t border-slate-200 dark:border-slate-800">
                <span>OS: {app.os_type}</span>
                <span>{formatDate(app.created_at)}</span>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onEdit(app)}
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleDeleteClick(app)}
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
              Tem certeza que deseja excluir a aplicação{' '}
              <strong>{applicationToDelete?.name}</strong>?
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
