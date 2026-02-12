import { useState, useEffect } from 'react';
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

interface ApplicationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ApplicationCreate) => void;
  application?: Application;
  isLoading?: boolean;
}

export function ApplicationForm({
  open,
  onOpenChange,
  onSubmit,
  application,
  isLoading,
}: ApplicationFormProps) {
  const [formData, setFormData] = useState<ApplicationCreate>({
    name: '',
    version: '',
    os_type: 'linux' as OSType,
    installer_url: '',
    description: '',
    install_command: '',
    install_parameters: '',
  });

  useEffect(() => {
    if (application) {
      setFormData({
        name: application.name,
        version: application.version,
        os_type: application.os_type,
        installer_url: application.installer_url || '',
        description: application.description || '',
        install_command: application.install_command,
        install_parameters: application.install_parameters || '',
      });
    } else {
      setFormData({
        name: '',
        version: '',
        os_type: 'linux',
        installer_url: '',
        description: '',
        install_command: '',
        install_parameters: '',
      });
    }
  }, [application, open]);

  const handleSubmit = (e: React.FormEvent) => {
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
          {/* Nome da Aplicação */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Aplicação *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Nginx Web Server"
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
              placeholder="Ex: 1.24.0"
              required
            />
          </div>

          {/* Sistema Operacional */}
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
              placeholder="https://example.com/installer.exe"
            />
            <p className="text-xs text-slate-500">
              URL para download do instalador (opcional)
            </p>
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
              rows={3}
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
                  ? 'sudo apt-get update && sudo apt-get install -y nginx'
                  : 'Invoke-WebRequest -Uri $url -OutFile $output'
              }
              rows={4}
              className="font-mono text-sm"
              required
            />
            <p className="text-xs text-slate-500">
              {formData.os_type === 'linux'
                ? 'Comandos shell para execução via SSH'
                : 'Comandos PowerShell para execução via WinRM'}
            </p>
          </div>

          {/* Parâmetros de Instalação */}
          <div className="space-y-2">
            <Label htmlFor="install_parameters">Parâmetros de Instalação</Label>
            <Textarea
              id="install_parameters"
              value={formData.install_parameters}
              onChange={(e) =>
                setFormData({ ...formData, install_parameters: e.target.value })
              }
              placeholder="Parâmetros adicionais ou flags de instalação..."
              rows={2}
              className="font-mono text-sm"
            />
            <p className="text-xs text-slate-500">
              Parâmetros opcionais para customizar a instalação
            </p>
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
              {isLoading
                ? 'Salvando...'
                : application
                ? 'Atualizar'
                : 'Criar Aplicação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
