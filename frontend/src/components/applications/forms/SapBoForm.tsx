import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Application, ApplicationCreate } from '@/types';
import { ArrowLeft } from 'lucide-react';

interface Fields {
  name: string;
  version: string;
  installer_path: string;
  db_type: string;
  db_server: string;
  db_port: string;
  license_server: string;
  site_user_password: string;
  b1_admin_password: string;
  install_path: string;
  shared_folder: string;
}

const defaults = (): Fields => ({
  name: 'SAP Business One',
  version: '10.0',
  installer_path: 'D:\\B1Install\\setup.exe',
  db_type: 'HANA',
  db_server: '',
  db_port: '30015',
  license_server: '',
  site_user_password: '',
  b1_admin_password: '',
  install_path: 'C:\\Program Files\\SAP\\SAP Business One',
  shared_folder: 'C:\\Program Files\\SAP\\SAP Business One\\SharedFolder',
});

function fromApp(app: Application): Fields {
  const v = Object.fromEntries(app.variables.map(x => [x.key, x.value]));
  return {
    name: app.name, version: app.version,
    installer_path: v['INSTALLER_PATH'] ?? 'D:\\B1Install\\setup.exe',
    db_type: v['DB_TYPE'] ?? 'HANA',
    db_server: v['DB_SERVER'] ?? '',
    db_port: v['DB_PORT'] ?? '30015',
    license_server: v['LICENSE_SERVER'] ?? '',
    site_user_password: v['SITE_USER_PASSWORD'] ?? '',
    b1_admin_password: v['B1_ADMIN_PASSWORD'] ?? '',
    install_path: v['INSTALL_PATH'] ?? 'C:\\Program Files\\SAP\\SAP Business One',
    shared_folder: v['SHARED_FOLDER'] ?? 'C:\\Program Files\\SAP\\SAP Business One\\SharedFolder',
  };
}

function buildPayload(f: Fields): ApplicationCreate {
  const cmd = [
    'Start-Process -FilePath "{{INSTALLER_PATH}}"',
    '-ArgumentList @(',
    '  "/Silent",',
    '  "/DBServerName={{DB_SERVER}}",',
    '  "/DBServerPort={{DB_PORT}}",',
    '  "/DBType={{DB_TYPE}}",',
    '  "/LicenseServer={{LICENSE_SERVER}}",',
    '  "/SiteUserPassword={{SITE_USER_PASSWORD}}",',
    '  "/B1AdminPassword={{B1_ADMIN_PASSWORD}}",',
    '  "/InstallDir=\\"{{INSTALL_PATH}}\\"",',
    '  "/SharedDir=\\"{{SHARED_FOLDER}}\\"" ',
    ') -Wait -NoNewWindow',
  ].join('\n');

  return {
    name: f.name, app_type: 'sapbo', version: f.version, os_type: 'windows',
    description: `SAP Business One ${f.version} — DB: ${f.db_server} (${f.db_type})`,
    install_command: cmd,
    variables: [
      { key: 'INSTALLER_PATH',     value: f.installer_path },
      { key: 'DB_TYPE',            value: f.db_type },
      { key: 'DB_SERVER',          value: f.db_server },
      { key: 'DB_PORT',            value: f.db_port },
      { key: 'LICENSE_SERVER',     value: f.license_server },
      { key: 'SITE_USER_PASSWORD', value: f.site_user_password },
      { key: 'B1_ADMIN_PASSWORD',  value: f.b1_admin_password },
      { key: 'INSTALL_PATH',       value: f.install_path },
      { key: 'SHARED_FOLDER',      value: f.shared_folder },
    ].filter(v => v.value),
  };
}

interface Props {
  open: boolean; onBack: () => void; onClose: () => void;
  onSubmit: (data: ApplicationCreate) => void;
  application?: Application; isLoading?: boolean;
}

export function SapBoForm({ open, onBack, onClose, onSubmit, application, isLoading }: Props) {
  const [f, setF] = useState<Fields>(() => application ? fromApp(application) : defaults());
  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {!application && <button onClick={onBack} className="text-slate-400 hover:text-slate-600 mr-1"><ArrowLeft className="h-4 w-4" /></button>}
            <DialogTitle>🟦 SAP Business One</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Identificação</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2"><Label>Nome *</Label><Input value={f.name} onChange={set('name')} placeholder="SAP Business One PRD" /></div>
              <div className="space-y-1.5"><Label>Versão *</Label><Input value={f.version} onChange={set('version')} placeholder="10.0 PL20" /></div>
            </div>
          </section>
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Instalação</h3>
            <div className="space-y-1.5"><Label>Caminho do instalador *</Label><Input value={f.installer_path} onChange={set('installer_path')} className="font-mono text-sm" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Caminho de instalação</Label><Input value={f.install_path} onChange={set('install_path')} className="font-mono text-sm" /></div>
              <div className="space-y-1.5"><Label>Pasta Compartilhada</Label><Input value={f.shared_folder} onChange={set('shared_folder')} className="font-mono text-sm" /></div>
            </div>
          </section>
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Banco de Dados</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={f.db_type} onValueChange={v => setF(p => ({ ...p, db_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HANA">SAP HANA</SelectItem>
                    <SelectItem value="MSSQL2022">SQL Server 2022</SelectItem>
                    <SelectItem value="MSSQL2019">SQL Server 2019</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2"><Label>Servidor do Banco *</Label><Input value={f.db_server} onChange={set('db_server')} placeholder="192.168.1.10" className="font-mono text-sm" /></div>
            </div>
            <div className="space-y-1.5"><Label>Porta</Label><Input value={f.db_port} onChange={set('db_port')} placeholder="30015" className="font-mono w-32" /></div>
          </section>
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Licença e Segurança</h3>
            <div className="space-y-1.5"><Label>License Server *</Label><Input value={f.license_server} onChange={set('license_server')} placeholder="192.168.1.10:30000" className="font-mono text-sm" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Site User Password *</Label><Input type="password" value={f.site_user_password} onChange={set('site_user_password')} /></div>
              <div className="space-y-1.5"><Label>B1 Admin Password *</Label><Input type="password" value={f.b1_admin_password} onChange={set('b1_admin_password')} /></div>
            </div>
          </section>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button disabled={!f.name || !f.db_server || !f.site_user_password || isLoading} onClick={() => onSubmit(buildPayload(f))}>
              {isLoading ? 'Salvando...' : application ? 'Atualizar' : 'Criar Aplicação'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
