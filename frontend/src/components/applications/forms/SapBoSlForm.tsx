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
  b1_server: string;
  hana_host: string;
  hana_instance: string;
  hana_user: string;
  hana_password: string;
  sl_port: string;
  install_path: string;
}

const defaults = (): Fields => ({
  name: 'SAP B1 Service Layer',
  version: '10.0',
  installer_path: '/opt/sap/b1sl/install.sh',
  b1_server: '',
  hana_host: '',
  hana_instance: '00',
  hana_user: 'SYSTEM',
  hana_password: '',
  sl_port: '50000',
  install_path: '/opt/sap/b1servicelayer',
});

function fromApp(app: Application): Fields {
  const v = Object.fromEntries(app.variables.map(x => [x.key, x.value]));
  return {
    name: app.name, version: app.version,
    installer_path: v['INSTALLER_PATH'] ?? '/opt/sap/b1sl/install.sh',
    b1_server: v['B1_SERVER'] ?? '',
    hana_host: v['HANA_HOST'] ?? '',
    hana_instance: v['HANA_INSTANCE'] ?? '00',
    hana_user: v['HANA_USER'] ?? 'SYSTEM',
    hana_password: v['HANA_PASSWORD'] ?? '',
    sl_port: v['SL_PORT'] ?? '50000',
    install_path: v['INSTALL_PATH'] ?? '/opt/sap/b1servicelayer',
  };
}

function buildPayload(f: Fields): ApplicationCreate {
  const cmd = [
    'bash {{INSTALLER_PATH}}',
    '--silent',
    '--b1-server={{B1_SERVER}}',
    '--hana-host={{HANA_HOST}}',
    '--hana-instance={{HANA_INSTANCE}}',
    '--hana-user={{HANA_USER}}',
    '--hana-password={{HANA_PASSWORD}}',
    '--port={{SL_PORT}}',
    '--install-dir={{INSTALL_PATH}}',
  ].join(' \\\n  ');

  return {
    name: f.name, app_type: 'sapbosl', version: f.version, os_type: 'linux',
    description: `SAP B1 Service Layer ${f.version} — HANA: ${f.hana_host}`,
    install_command: cmd,
    variables: [
      { key: 'INSTALLER_PATH', value: f.installer_path },
      { key: 'B1_SERVER',      value: f.b1_server },
      { key: 'HANA_HOST',      value: f.hana_host },
      { key: 'HANA_INSTANCE',  value: f.hana_instance },
      { key: 'HANA_USER',      value: f.hana_user },
      { key: 'HANA_PASSWORD',  value: f.hana_password },
      { key: 'SL_PORT',        value: f.sl_port },
      { key: 'INSTALL_PATH',   value: f.install_path },
    ].filter(v => v.value),
  };
}

interface Props {
  open: boolean; onBack: () => void; onClose: () => void;
  onSubmit: (data: ApplicationCreate) => void;
  application?: Application; isLoading?: boolean;
}

export function SapBoSlForm({ open, onBack, onClose, onSubmit, application, isLoading }: Props) {
  const [f, setF] = useState<Fields>(() => application ? fromApp(application) : defaults());
  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {!application && <button onClick={onBack} className="text-slate-400 hover:text-slate-600 mr-1"><ArrowLeft className="h-4 w-4" /></button>}
            <DialogTitle>🔗 SAP Business One Service Layer</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Identificação</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2"><Label>Nome *</Label><Input value={f.name} onChange={set('name')} placeholder="SAP B1 Service Layer PRD" /></div>
              <div className="space-y-1.5"><Label>Versão *</Label><Input value={f.version} onChange={set('version')} placeholder="10.0 PL20" /></div>
            </div>
          </section>
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Instalação</h3>
            <div className="space-y-1.5"><Label>Script de instalação *</Label><Input value={f.installer_path} onChange={set('installer_path')} className="font-mono text-sm" /></div>
            <div className="space-y-1.5"><Label>Diretório de instalação</Label><Input value={f.install_path} onChange={set('install_path')} className="font-mono text-sm" /></div>
          </section>
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">SAP Business One</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2"><Label>B1 Server Address *</Label><Input value={f.b1_server} onChange={set('b1_server')} placeholder="192.168.1.10" className="font-mono text-sm" /></div>
              <div className="space-y-1.5 col-span-2"><Label>Porta do Service Layer</Label><Input value={f.sl_port} onChange={set('sl_port')} placeholder="50000" className="font-mono w-28" /></div>
            </div>
          </section>
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">SAP HANA</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5 col-span-2"><Label>HANA Host *</Label><Input value={f.hana_host} onChange={set('hana_host')} placeholder="hana-server" className="font-mono text-sm" /></div>
              <div className="space-y-1.5"><Label>Instância</Label><Input value={f.hana_instance} onChange={set('hana_instance')} placeholder="00" className="font-mono" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Usuário HANA</Label><Input value={f.hana_user} onChange={set('hana_user')} placeholder="SYSTEM" className="font-mono" /></div>
              <div className="space-y-1.5"><Label>Senha HANA *</Label><Input type="password" value={f.hana_password} onChange={set('hana_password')} /></div>
            </div>
          </section>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button disabled={!f.name || !f.hana_host || !f.hana_password || isLoading} onClick={() => onSubmit(buildPayload(f))}>
              {isLoading ? 'Salvando...' : application ? 'Atualizar' : 'Criar Aplicação'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
