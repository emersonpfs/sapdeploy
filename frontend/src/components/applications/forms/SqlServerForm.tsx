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
  instance_name: string;
  sa_password: string;
  sa_account: string;
  data_path: string;
  log_path: string;
  edition: string;
  collation: string;
  features: string;
}

const defaults = (): Fields => ({
  name: 'SQL Server',
  version: '2022',
  installer_path: 'D:\\SQLServer\\setup.exe',
  instance_name: 'MSSQLSERVER',
  sa_password: '',
  sa_account: 'BUILTIN\\Administrators',
  data_path: 'C:\\SQLData',
  log_path: 'C:\\SQLLog',
  edition: 'Standard',
  collation: 'SQL_Latin1_General_CP1_CI_AS',
  features: 'SQLEngine,FullText',
});

function fromApp(app: Application): Fields {
  const v = Object.fromEntries(app.variables.map(x => [x.key, x.value]));
  return {
    name: app.name,
    version: app.version,
    installer_path: v['INSTALLER_PATH'] ?? 'D:\\SQLServer\\setup.exe',
    instance_name: v['INSTANCE_NAME'] ?? 'MSSQLSERVER',
    sa_password: v['SA_PASSWORD'] ?? '',
    sa_account: v['SA_ACCOUNT'] ?? 'BUILTIN\\Administrators',
    data_path: v['DATA_PATH'] ?? 'C:\\SQLData',
    log_path: v['LOG_PATH'] ?? 'C:\\SQLLog',
    edition: v['EDITION'] ?? 'Standard',
    collation: v['COLLATION'] ?? 'SQL_Latin1_General_CP1_CI_AS',
    features: v['FEATURES'] ?? 'SQLEngine,FullText',
  };
}

function buildPayload(f: Fields): ApplicationCreate {
  const cmd = [
    'Start-Process -FilePath "{{INSTALLER_PATH}}"',
    '-ArgumentList @(',
    '  "/QS",',
    '  "/ACTION=Install",',
    '  "/FEATURES={{FEATURES}}",',
    '  "/INSTANCENAME={{INSTANCE_NAME}}",',
    '  "/SQLSYSADMINACCOUNTS=\\"{{SA_ACCOUNT}}\\"",',
    '  "/SAPWD=\\"{{SA_PASSWORD}}\\"",',
    '  "/SQLUSERDBDIR=\\"{{DATA_PATH}}\\"",',
    '  "/SQLUSERDBLOGDIR=\\"{{LOG_PATH}}\\"",',
    '  "/TCPENABLED=1",',
    '  "/IACCEPTSQLSERVERLICENSETERMS"',
    ') -Wait -NoNewWindow',
  ].join('\n');

  return {
    name: f.name,
    app_type: 'sqlserver',
    version: f.version,
    os_type: 'windows',
    description: `Microsoft SQL Server ${f.version} — Instância: ${f.instance_name}`,
    install_command: cmd,
    variables: [
      { key: 'INSTALLER_PATH', value: f.installer_path },
      { key: 'INSTANCE_NAME',  value: f.instance_name },
      { key: 'SA_PASSWORD',    value: f.sa_password },
      { key: 'SA_ACCOUNT',     value: f.sa_account },
      { key: 'DATA_PATH',      value: f.data_path },
      { key: 'LOG_PATH',       value: f.log_path },
      { key: 'EDITION',        value: f.edition },
      { key: 'COLLATION',      value: f.collation },
      { key: 'FEATURES',       value: f.features },
    ].filter(v => v.value),
  };
}

interface Props {
  open: boolean;
  onBack: () => void;
  onClose: () => void;
  onSubmit: (data: ApplicationCreate) => void;
  application?: Application;
  isLoading?: boolean;
}

export function SqlServerForm({ open, onBack, onClose, onSubmit, application, isLoading }: Props) {
  const [f, setF] = useState<Fields>(() => application ? fromApp(application) : defaults());
  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {!application && (
              <button onClick={onBack} className="text-slate-400 hover:text-slate-600 mr-1">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <DialogTitle>🗄️ Microsoft SQL Server</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Identificação</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>Nome da Aplicação *</Label>
                <Input value={f.name} onChange={set('name')} placeholder="SQL Server PRD" />
              </div>
              <div className="space-y-1.5">
                <Label>Versão *</Label>
                <Select value={f.version} onValueChange={v => setF(p => ({ ...p, version: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2022">SQL Server 2022</SelectItem>
                    <SelectItem value="2019">SQL Server 2019</SelectItem>
                    <SelectItem value="2017">SQL Server 2017</SelectItem>
                    <SelectItem value="2016">SQL Server 2016</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Edição</Label>
                <Select value={f.edition} onValueChange={v => setF(p => ({ ...p, edition: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Developer">Developer</SelectItem>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                    <SelectItem value="Express">Express</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Instalação</h3>
            <div className="space-y-1.5">
              <Label>Caminho do instalador *</Label>
              <Input value={f.installer_path} onChange={set('installer_path')} placeholder="D:\SQLServer\setup.exe" className="font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label>Features</Label>
              <Input value={f.features} onChange={set('features')} placeholder="SQLEngine,FullText" className="font-mono text-sm" />
              <p className="text-xs text-slate-400">Separadas por vírgula: SQLEngine, FullText, AS, RS, IS</p>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Instância</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nome da Instância *</Label>
                <Input value={f.instance_name} onChange={set('instance_name')} placeholder="MSSQLSERVER" className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>Collation</Label>
                <Input value={f.collation} onChange={set('collation')} placeholder="SQL_Latin1_General_CP1_CI_AS" className="font-mono text-sm" />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Segurança</h3>
            <div className="space-y-1.5">
              <Label>SA Password *</Label>
              <Input type="password" value={f.sa_password} onChange={set('sa_password')} placeholder="Senha do SA" />
            </div>
            <div className="space-y-1.5">
              <Label>Conta de Administrador do SQL</Label>
              <Input value={f.sa_account} onChange={set('sa_account')} placeholder="BUILTIN\Administrators" className="font-mono text-sm" />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Diretórios</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data Path</Label>
                <Input value={f.data_path} onChange={set('data_path')} placeholder="C:\SQLData" className="font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label>Log Path</Label>
                <Input value={f.log_path} onChange={set('log_path')} placeholder="C:\SQLLog" className="font-mono text-sm" />
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button
              disabled={!f.name || !f.sa_password || !f.installer_path || isLoading}
              onClick={() => onSubmit(buildPayload(f))}
            >
              {isLoading ? 'Salvando...' : application ? 'Atualizar' : 'Criar Aplicação'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
