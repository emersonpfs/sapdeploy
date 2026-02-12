import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getApplications, createApplication, updateApplication } from '@/lib/api';
import { Package, Plus } from 'lucide-react';
import { ApplicationForm } from '@/components/applications/ApplicationForm';
import { ApplicationList } from '@/components/applications/ApplicationList';
import type { Application, ApplicationCreate } from '@/types';

export default function Applications() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | undefined>(undefined);
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => (await getApplications()).data,
  });

  const createMutation = useMutation({
    mutationFn: (data: ApplicationCreate) => createApplication(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setFormOpen(false);
      setEditingApp(undefined);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ApplicationCreate }) =>
      updateApplication(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setFormOpen(false);
      setEditingApp(undefined);
    },
  });

  const handleSubmit = (data: ApplicationCreate) => {
    if (editingApp) {
      updateMutation.mutate({ id: editingApp.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (app: Application) => {
    setEditingApp(app);
    setFormOpen(true);
  };

  const handleNewApp = () => {
    setEditingApp(undefined);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Aplicações
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Gerencie o catálogo de aplicações disponíveis para deployment
          </p>
        </div>
        <Button onClick={handleNewApp} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Nova Aplicação
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-500">Carregando aplicações...</p>
        </div>
      )}

      {/* Applications List */}
      {!isLoading && applications.length > 0 && (
        <ApplicationList applications={applications} onEdit={handleEdit} />
      )}

      {/* Empty State */}
      {!isLoading && applications.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-2">
              Nenhuma aplicação cadastrada
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 text-center">
              Comece adicionando sua primeira aplicação ao catálogo
            </p>
            <Button onClick={handleNewApp}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Aplicação
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Application Form Dialog */}
      <ApplicationForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingApp(undefined);
        }}
        onSubmit={handleSubmit}
        application={editingApp}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
