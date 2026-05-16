import { useState, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Application, ApplicationCreate, OSType } from '@/types';
import { Plus, Trash2 } from 'lucide-react';

interface ApplicationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ApplicationCreate) => void;
  application?: Application;
  isLoading?: boolean;
}

const emptyForm = (): ApplicationCreate => ({
  name: '',
  app_type: 'generic',
  version: '',
  os_type: 'linux' as OSType,
  installer_url: '',
  description: '',
  install_command: '',
  install_parameters: '',
  variables: [],
});

export function ApplicationForm({
  open,
  onOpenChange,
  onSubmit,
  application,
  isLoading,
}: ApplicationFormProps) {
  const [formData, setFormData] = useState<ApplicationCreate>(emptyForm());
  const [newVarKey, setNewVarKey] = useState('');
  const [newVarValue, setNewVarValue] = useState('');

  useEffect(() => {
    if (application) {
      setFormData({
        name: application.name,
        app_type: application.app_type ?? 'generic',
        version: application.version,
        os_type: application.os_type,
        installer_url: application.installer_url || '',
        description: application.description || '',
        install_command: application.install_command,
        install_parameters: application.install_parameters || '',
        variables: application.variables.map(v => ({ key: v.key, value: v.value })),
      });
    } else {
      setFormData(emptyForm());
    }
    setNewVarKey('');
    setNewVarValue('');
  }, [application, open]);

  const addVariable = () => {
    const key = newVarKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
    const value = newVarValue.trim();
    if (!key || !value) return;
    // Replace if key already exists
    const existing = formData.variables.findIndex(v => v.key === key);
    if (existing >= 0) {
      const updated = [...formData.variables];
      updated[existing] = { key, value };
      setFormData({ ...formData, variables: updated });
    } else {
      setFormData({ ...formData, variables: [...formData.variables, { key, value }] });
    }
    setNewVarKey('');
    setNewVarValue('');
  };

  const removeVariable = (key: string) => {
    setFormData({ ...formData, variables: formData.variables.filter(v => v.key !== key) });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {application ? 'Editar Aplicação' : 'Nova Aplicação'}
          </DialogTitle>
          <DialogDescription>
            {application
              ? 'Atualize as informações da aplicação'
              : 'Adicione uma nova aplicação ao catálogo'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Aplicação *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: SAP HANA Database"
              required
            />
          </div>

          {/* Versão */}
          <div className="space-y-2">
            <Label htmlFor="version">Versão *</Label>
            <Input
              id="version"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              placeholder="Ex: 2.0 SP07"
              required
            />
          </div>

          {/* SO */}
          <div className="space-y-2">
            <Label htmlFor="os_type">Sistema Operacional *</Label>
            <Select
              value={formData.os_type}
              onValueChange={(value) =>
                setFormData({ ...formData, os_type: value as OSType })
              }
            >
              <SelectTrigger id="os_type">
                <SelectValue placeholder="Selecione o SO" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linux">🐧 Linux</SelectItem>
                <SelectItem value="windows">🪟 Windows</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* URL do Instalador */}
          <div className="space-y-2">
            <Label htmlFor="installer_url">URL do Instalador</Label>
            <Input
              id="installer_url"
              type="url"
              value={formData.installer_url}
              onChange={(e) =>
                setFormData({ ...formData, installer_url: e.target.value })
              }
              placeholder="https://example.com/installer.tar.gz"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Descrição detalhada da aplicação..."
              rows={2}
            />
          </div>

          {/* Comando de Instalação */}
          <div className="space-y-2">
            <Label htmlFor="install_command">Comando de Instalação *</Label>
            <Textarea
              id="install_command"
              value={formData.install_command}
              onChange={(e) =>
                setFormData({ ...formData, install_command: e.target.value })
              }
              placeholder={
                formData.os_type === 'linux'
                  ? '/hana/shared/media/hdblcm --action=install --batch --sid={{SID}} --password={{PASSWORD}}'
                  : 'Setup.exe /Silent /SID={{SID}} /Password={{PASSWORD}}'
              }
              rows={4}
              className="font-mono text-sm"
              required
            />
            <p className="text-xs text-slate-500">
              Use <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{{VARIAVEL}}'}</code> para inserir valores dinâmicos definidos abaixo.
            </p>
          </div>

          {/* Parâmetros adicionais */}
          <div className="space-y-2">
            <Label htmlFor="install_parameters">Parâmetros Adicionais</Label>
            <Textarea
              id="install_parameters"
              value={formData.install_parameters}
              onChange={(e) =>
                setFormData({ ...formData, install_parameters: e.target.value })
              }
              placeholder="Flags ou parâmetros extras..."
              rows={2}
              className="font-mono text-sm"
            />
          </div>

          {/* ── Variáveis ── */}
          <div className="space-y-3 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Variáveis de Instalação
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Defina os valores que serão substituídos nos placeholders <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{{NOME}}'}</code> do comando acima.
              </p>
            </div>

            {/* Tabela de variáveis */}
            {formData.variables.length > 0 && (
              <div className="rounded border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-medium text-slate-500 w-2/5">Variável</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">Valor</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {formData.variables.map((v) => (
                      <tr key={v.key} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="px-3 py-2">
                          <code className="text-xs bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-mono">
                            {`{{${v.key}}}`}
                          </code>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-700 dark:text-slate-300 break-all">
                          {v.value}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeVariable(v.key)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Adicionar variável */}
            <div className="flex gap-2 items-end">
              <div className="w-2/5">
                <Label className="text-xs text-slate-500 mb-1 block">Nome</Label>
                <Input
                  placeholder="SID"
                  value={newVarKey}
                  onChange={e => setNewVarKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                  className="font-mono text-sm h-9"
                  spellCheck={false}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addVariable())}
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs text-slate-500 mb-1 block">Valor</Label>
                <Input
                  placeholder="PRD"
                  value={newVarValue}
                  onChange={e => setNewVarValue(e.target.value)}
                  className="text-sm h-9"
                  spellCheck={false}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addVariable())}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 shrink-0"
                onClick={addVariable}
                disabled={!newVarKey.trim() || !newVarValue.trim()}
              >
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : application ? 'Atualizar' : 'Criar Aplicação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
