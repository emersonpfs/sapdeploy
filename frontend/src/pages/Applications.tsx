import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getApplications, createApplication, updateApplication } from '@/lib/api';
import { Package, Plus } from 'lucide-react';
import { ApplicationList } from '@/components/applications/ApplicationList';
import { AppTypeSelector } from '@/components/applications/AppTypeSelector';
import { HanaForm } from '@/components/applications/forms/HanaForm';
import { SqlServerForm } from '@/components/applications/forms/SqlServerForm';
import { SapBoForm } from '@/components/applications/forms/SapBoForm';
import { SapBoSlForm } from '@/components/applications/forms/SapBoSlForm';
import { B1ifForm } from '@/components/applications/forms/B1ifForm';
import { WindowsAppForm } from '@/components/applications/forms/WindowsAppForm';
import type { Application, ApplicationCreate, AppType } from '@/types';

export default function Applications() {
  const queryClient = useQueryClient();

  // Flow state
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [activeType, setActiveType] = useState<AppType | null>(null);
  const [editingApp, setEditingApp] = useState<Application | undefined>(undefined);

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => (await getApplications()).data,
  });

  const createMutation = useMutation({
    mutationFn: (data: ApplicationCreate) => createApplication(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      closeAll();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ApplicationCreate }) =>
      updateApplication(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      closeAll();
    },
  });

  const closeAll = () => {
    setShowTypeSelector(false);
    setActiveType(null);
    setEditingApp(undefined);
  };

  const handleNewApp = () => setShowTypeSelector(true);

  const handleTypeSelect = (type: AppType) => {
    setShowTypeSelector(false);
    setActiveType(type);
  };

  const handleEdit = (app: Application) => {
    setEditingApp(app);
    setActiveType(app.app_type ?? 'generic');
  };

  const handleSubmit = (data: ApplicationCreate) => {
    if (editingApp) {
      updateMutation.mutate({ id: editingApp.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const formProps = {
    open: true,
    onBack: () => { setActiveType(null); setShowTypeSelector(true); },
    onClose: closeAll,
    onSubmit: handleSubmit,
    isLoading: isSubmitting,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Aplicações</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Gerencie o catálogo de aplicações disponíveis para deployment
          </p>
        </div>
        <Button onClick={handleNewApp} size="lg">
          <Plus className="mr-2 h-5 w-5" /> Nova Aplicação
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-500">Carregando aplicações...</p>
        </div>
      )}

      {!isLoading && applications.length > 0 && (
        <ApplicationList applications={applications} onEdit={handleEdit} />
      )}

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
              <Plus className="mr-2 h-4 w-4" /> Criar Primeira Aplicação
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 1: type selector */}
      <AppTypeSelector
        open={showTypeSelector}
        onSelect={handleTypeSelect}
        onClose={closeAll}
      />

      {/* Step 2: specific forms */}
      {activeType === 'hana' && (
        <HanaForm {...formProps} application={editingApp} />
      )}
      {activeType === 'sqlserver' && (
        <SqlServerForm {...formProps} application={editingApp} />
      )}
      {activeType === 'sapbo' && (
        <SapBoForm {...formProps} application={editingApp} />
      )}
      {activeType === 'sapbosl' && (
        <SapBoSlForm {...formProps} application={editingApp} />
      )}
      {activeType === 'b1if' && (
        <B1ifForm {...formProps} application={editingApp} />
      )}
      {activeType === 'windows' && (
        <WindowsAppForm {...formProps} application={editingApp} />
      )}
    </div>
  );
}
