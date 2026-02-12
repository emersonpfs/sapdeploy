import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Upload, X } from 'lucide-react';
import type { Server, ServerCreate, OSType } from '@/types';

interface ServerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ServerCreate) => void;
  server?: Server;
  isLoading?: boolean;
}

export function ServerForm({
  open,
  onOpenChange,
  onSubmit,
  server,
  isLoading,
}: ServerFormProps) {
  const [formData, setFormData] = useState<ServerCreate>({
    hostname: '',
    ip_address: '',
    os_type: 'linux' as OSType,
    username: '',
    password: '',
    ssh_key_content: '',
    port: 22,
  });

  const [useSSHKey, setUseSSHKey] = useState(false);
  const [sshKeyFileName, setSSHKeyFileName] = useState<string>('');

  useEffect(() => {
    if (server) {
      setFormData({
        hostname: server.hostname,
        ip_address: server.ip_address,
        os_type: server.os_type,
        username: server.username,
        password: '',
        ssh_key_content: '',
        port: server.port,
      });
      setUseSSHKey(false);
      setSSHKeyFileName('');
    } else {
      setFormData({
        hostname: '',
        ip_address: '',
        os_type: 'linux',
        username: '',
        password: '',
        ssh_key_content: '',
        port: 22,
      });
      setUseSSHKey(false);
      setSSHKeyFileName('');
    }
  }, [server, open]);

  const handleOSChange = (value: string) => {
    const newOSType = value as OSType;
    setFormData({
      ...formData,
      os_type: newOSType,
      port: newOSType === 'windows' ? 5985 : 22,
    });
    // Reset SSH key option when switching to Windows
    if (newOSType === 'windows') {
      setUseSSHKey(false);
      setSSHKeyFileName('');
      setFormData(prev => ({ ...prev, ssh_key_content: '' }));
    }
  };

  const handleSSHKeyToggle = (checked: boolean) => {
    setUseSSHKey(checked);
    if (checked) {
      setFormData({ ...formData, password: '' });
    } else {
      setFormData({ ...formData, ssh_key_content: '' });
      setSSHKeyFileName('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setFormData({ ...formData, ssh_key_content: content });
        setSSHKeyFileName(file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleRemoveSSHKey = () => {
    setFormData({ ...formData, ssh_key_content: '' });
    setSSHKeyFileName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create clean data object
    const submitData: ServerCreate = {
      hostname: formData.hostname,
      ip_address: formData.ip_address,
      os_type: formData.os_type,
      username: formData.username,
      port: formData.port,
    };

    // Add password or SSH key based on selection
    if (formData.os_type === 'linux' && useSSHKey) {
      submitData.ssh_key_content = formData.ssh_key_content;
    } else {
      submitData.password = formData.password;
    }

    onSubmit(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {server ? 'Editar Servidor' : 'Novo Servidor'}
          </DialogTitle>
          <DialogDescription>
            {server
              ? 'Atualize as informações do servidor'
              : 'Adicione um novo servidor para deployments'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sistema Operacional */}
          <div className="space-y-2">
            <Label htmlFor="os_type">Sistema Operacional *</Label>
            <Select
              value={formData.os_type}
              onValueChange={handleOSChange}
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

          {/* Nome do Servidor */}
          <div className="space-y-2">
            <Label htmlFor="hostname">Nome do Servidor *</Label>
            <Input
              id="hostname"
              value={formData.hostname}
              onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
              placeholder="Ex: web-server-01"
              required
            />
          </div>

          {/* Endereço IP */}
          <div className="space-y-2">
            <Label htmlFor="ip_address">Endereço IP *</Label>
            <Input
              id="ip_address"
              value={formData.ip_address}
              onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
              placeholder="Ex: 192.168.1.100"
              required
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Usuário *</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder={
                formData.os_type === 'windows' ? 'Administrator' : 'ubuntu'
              }
              required
            />
          </div>

          {/* SSH Key Toggle (somente para Linux) */}
          {formData.os_type === 'linux' && (
            <div className="flex items-center space-x-2 rounded-md border border-slate-200 p-4 dark:border-slate-800">
              <input
                type="checkbox"
                id="use_ssh_key"
                checked={useSSHKey}
                onChange={(e) => handleSSHKeyToggle(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              <Label htmlFor="use_ssh_key" className="cursor-pointer">
                Usar Chave SSH?
              </Label>
            </div>
          )}

          {/* Password or SSH Key */}
          {!useSSHKey || formData.os_type === 'windows' ? (
            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Digite a senha"
                required
              />
              <p className="text-xs text-slate-500">
                A senha será armazenada criptografada
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="ssh_key">Chave SSH Privada *</Label>
              
              {!sshKeyFileName ? (
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="ssh_key"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 mb-3 text-slate-400" />
                      <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                        <span className="font-semibold">Clique para fazer upload</span>
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Arquivo PEM, PPK ou chave privada OpenSSH
                      </p>
                    </div>
                    <input
                      id="ssh_key"
                      type="file"
                      className="hidden"
                      accept=".pem,.ppk,.key,*"
                      onChange={handleFileUpload}
                      required
                    />
                  </label>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <div className="rounded bg-green-100 p-2 dark:bg-green-900">
                      <Upload className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{sshKeyFileName}</p>
                      <p className="text-xs text-slate-500">Chave carregada</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveSSHKey}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <p className="text-xs text-slate-500">
                A chave será armazenada criptografada no banco de dados
              </p>
            </div>
          )}

          {/* Porta */}
          <div className="space-y-2">
            <Label htmlFor="port">Porta</Label>
            <Input
              id="port"
              type="number"
              value={formData.port}
              onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
            />
            <p className="text-xs text-slate-500">
              {formData.os_type === 'windows'
                ? 'Porta WinRM (padrão: 5985 HTTP, 5986 HTTPS)'
                : 'Porta SSH (padrão: 22)'}
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
                : server
                ? 'Atualizar'
                : 'Criar Servidor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
