import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Application, ApplicationCreate } from '@/types';
import { ArrowLeft } from 'lucide-react';

interface Fields {
  name: string;
  version: string;
  installer_path: string;
  b1if_host: string;
  b1if_port: string;
  db_host: string;
  db_name: string;
  db_user: string;
  db_password: string;
  admin_password: string;
  install_path: string;
}

const defaults = (): Fields => ({
  name: 'Integration Framework',
  version: '2.0',
  installer_path: '/opt/sap/b1if/install.sh',
  b1if_host: '',
  b1if_port: '8080',
  db_host: '',
  db_name: 'B1iDB',
  db_user: 'b1iadmin',
  db_password: '',
  admin_password: '',
  install_path: '/opt/sap/b1if',
});

function fromApp(app: Application): Fields {
  const v = Object.fromEntries(app.variables.map(x => [x.key, x.value]));
  return {
    name: app.name, version: app.version,
    installer_path: v['INSTALLER_PATH'] ?? '/opt/sap/b1if/install.sh',
    b1if_host: v['B1IF_HOST'] ?? '',
    b1if_port: v['B1IF_PORT'] ?? '8080',
    db_host: v['DB_HOST'] ?? '',
    db_name: v['DB_NAME'] ?? 'B1iDB',
    db_user: v['DB_USER'] ?? 'b1iadmin',
    db_password: v['DB_PASSWORD'] ?? '',
    admin_password: v['ADMIN_PASSWORD'] ?? '',
    install_path: v['INSTALL_PATH'] ?? '/opt/sap/b1if',
  };
}

function buildPayload(f: Fields): ApplicationCreate {
  const cmd = [
    'bash {{INSTALLER_PATH}}',
    '--silent',
    '--host={{B1IF_HOST}}',
    '--port={{B1IF_PORT}}',
    '--db-host={{DB_HOST}}',
    '--db-name={{DB_NAME}}',
    '--db-user={{DB_USER}}',
    '--db-password={{DB_PASSWORD}}',
    '--admin-password={{ADMIN_PASSWORD}}',
    '--install-dir={{INSTALL_PATH}}',
  ].join(' \\\n  ');

  return {
    name: f.name, app_type: 'b1if', version: f.version, os_type: 'linux',
    description: `SAP B1 Integration Framework ${f.version} — Host: ${f.b1if_host}:${f.b1if_port}`,
    install_command: cmd,
    variables: [
      { key: 'INSTALLER_PATH', value: f.installer_path },
      { key: 'B1IF_HOST',      value: f.b1if_host },
      { key: 'B1IF_PORT',      value: f.b1if_port },
      { key: 'DB_HOST',        value: f.db_host },
      { key: 'DB_NAME',        value: f.db_name },
      { key: 'DB_USER',        value: f.db_user },
      { key: 'DB_PASSWORD',    value: f.db_password },
      { key: 'ADMIN_PASSWORD', value: f.admin_password },
      { key: 'INSTALL_PATH',   value: f.install_path },
    ].filter(v => v.value),
  };
}

interface Props {
  open: boolean; onBack: () => void; onClose: () => void;
  onSubmit: (data: ApplicationCreate) => void;
  application?: Application; isLoading?: boolean;
}

export function B1ifForm({ open, onBack, onClose, onSubmit, application, isLoading }: Props) {
  const [f, setF] = useState<Fields>(() => application ? fromApp(application) : defaults());
  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {!application && <button onClick={onBack} className="text-slate-400 hover:text-slate-600 mr-1"><ArrowLeft className="h-4 w-4" /></button>}
            <DialogTitle>🔄 Integration Framework (B1iF)</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Identificação</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2"><Label>Nome *</Label><Input value={f.name} onChange={set('name')} placeholder="Integration Framework PRD" /></div>
              <div className="space-y-1.5"><Label>Versão *</Label><Input value={f.version} onChange={set('version')} placeholder="2.0 PL20" /></div>
            </div>
          </section>
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Instalação</h3>
            <div className="space-y-1.5"><Label>Script de instalação *</Label><Input value={f.installer_path} onChange={set('installer_path')} className="font-mono text-sm" /></div>
            <div className="space-y-1.5"><Label>Diretório de instalação</Label><Input value={f.install_path} onChange={set('install_path')} className="font-mono text-sm" /></div>
          </section>
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Servidor B1iF</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5 col-span-2"><Label>Host *</Label><Input value={f.b1if_host} onChange={set('b1if_host')} placeholder="192.168.1.10" className="font-mono text-sm" /></div>
              <div className="space-y-1.5"><Label>Porta</Label><Input value={f.b1if_port} onChange={set('b1if_port')} placeholder="8080" className="font-mono" /></div>
            </div>
            <div className="space-y-1.5"><Label>Admin Password *</Label><Input type="password" value={f.admin_password} onChange={set('admin_password')} /></div>
          </section>
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Banco de Dados</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2"><Label>Host do Banco *</Label><Input value={f.db_host} onChange={set('db_host')} placeholder="192.168.1.10" className="font-mono text-sm" /></div>
              <div className="space-y-1.5"><Label>Nome do Banco</Label><Input value={f.db_name} onChange={set('db_name')} className="font-mono" /></div>
              <div className="space-y-1.5"><Label>Usuário</Label><Input value={f.db_user} onChange={set('db_user')} className="font-mono" /></div>
            </div>
            <div className="space-y-1.5"><Label>Senha do Banco *</Label><Input type="password" value={f.db_password} onChange={set('db_password')} /></div>
          </section>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button disabled={!f.name || !f.b1if_host || !f.admin_password || isLoading} onClick={() => onSubmit(buildPayload(f))}>
              {isLoading ? 'Salvando...' : application ? 'Atualizar' : 'Criar Aplicação'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
