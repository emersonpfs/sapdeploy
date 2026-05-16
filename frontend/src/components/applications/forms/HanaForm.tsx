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
  media_path: string;
  sid: string;
  instance: string;
  master_password: string;
  system_password: string;
  sapadm_password: string;
  data_path: string;
  log_path: string;
  shared_path: string;
}

const defaults = (): Fields => ({
  name: 'SAP HANA',
  version: '2.0',
  media_path: '/hana/shared/media/51057281',
  sid: '',
  instance: '00',
  master_password: '',
  system_password: '',
  sapadm_password: '',
  data_path: '/hana/data',
  log_path: '/hana/log',
  shared_path: '/hana/shared',
});

function fromApp(app: Application): Fields {
  const v = Object.fromEntries(app.variables.map(x => [x.key, x.value]));
  return {
    name: app.name,
    version: app.version,
    media_path: v['MEDIA_PATH'] ?? '/hana/shared/media/51057281',
    sid: v['SID'] ?? '',
    instance: v['INSTANCE'] ?? '00',
    master_password: v['MASTER_PASSWORD'] ?? '',
    system_password: v['SYSTEM_PASSWORD'] ?? '',
    sapadm_password: v['SAPADM_PASSWORD'] ?? '',
    data_path: v['DATA_PATH'] ?? '/hana/data',
    log_path: v['LOG_PATH'] ?? '/hana/log',
    shared_path: v['SHARED_PATH'] ?? '/hana/shared',
  };
}

function buildPayload(f: Fields): ApplicationCreate {
  const cmd = [
    '{{MEDIA_PATH}}/hdblcm',
    '--action=install',
    '--batch',
    '--sid={{SID}}',
    '--number={{INSTANCE}}',
    '--password={{MASTER_PASSWORD}}',
    '--system_user_password={{SYSTEM_PASSWORD}}',
    '--sapadm_password={{SAPADM_PASSWORD}}',
    '--datapath={{DATA_PATH}}/{{SID}}',
    '--logpath={{LOG_PATH}}/{{SID}}',
    '--sapmnt={{SHARED_PATH}}',
  ].join(' \\\n  ');

  return {
    name: f.name,
    app_type: 'hana',
    version: f.version,
    os_type: 'linux',
    description: `SAP HANA Database — SID: ${f.sid}, Instance: ${f.instance}`,
    install_command: cmd,
    variables: [
      { key: 'MEDIA_PATH',       value: f.media_path },
      { key: 'SID',              value: f.sid.toUpperCase() },
      { key: 'INSTANCE',         value: f.instance },
      { key: 'MASTER_PASSWORD',  value: f.master_password },
      { key: 'SYSTEM_PASSWORD',  value: f.system_password },
      { key: 'SAPADM_PASSWORD',  value: f.sapadm_password },
      { key: 'DATA_PATH',        value: f.data_path },
      { key: 'LOG_PATH',         value: f.log_path },
      { key: 'SHARED_PATH',      value: f.shared_path },
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

export function HanaForm({ open, onBack, onClose, onSubmit, application, isLoading }: Props) {
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
            <DialogTitle>🔷 SAP HANA Database</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Identificação */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Identificação</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>Nome da Aplicação *</Label>
                <Input value={f.name} onChange={set('name')} placeholder="SAP HANA PRD" />
              </div>
              <div className="space-y-1.5">
                <Label>Versão *</Label>
                <Input value={f.version} onChange={set('version')} placeholder="2.0 SP07" />
              </div>
            </div>
          </section>

          {/* Instalação */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Instalação</h3>
            <div className="space-y-1.5">
              <Label>Caminho da mídia de instalação *</Label>
              <Input value={f.media_path} onChange={set('media_path')} placeholder="/hana/shared/media/51057281" className="font-mono text-sm" />
              <p className="text-xs text-slate-400">Diretório onde o hdblcm está localizado</p>
            </div>
          </section>

          {/* Sistema */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Sistema HANA</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>SID (System ID) *</Label>
                <Input value={f.sid} onChange={set('sid')} placeholder="PRD" maxLength={3} className="font-mono uppercase" />
              </div>
              <div className="space-y-1.5">
                <Label>Número da Instância *</Label>
                <Input value={f.instance} onChange={set('instance')} placeholder="00" maxLength={2} className="font-mono" />
              </div>
            </div>
          </section>

          {/* Senhas */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Senhas</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <Label>Master Password *</Label>
                <Input type="password" value={f.master_password} onChange={set('master_password')} placeholder="Senha mínima 8 chars, maiúsc., minúsc. e número" />
                <p className="text-xs text-slate-400">Usada para o usuário SYSTEM e como base para outros</p>
              </div>
              <div className="space-y-1.5">
                <Label>System User Password</Label>
                <Input type="password" value={f.system_password} onChange={set('system_password')} placeholder="Deixe vazio para usar o Master Password" />
              </div>
              <div className="space-y-1.5">
                <Label>SAPADM Password</Label>
                <Input type="password" value={f.sapadm_password} onChange={set('sapadm_password')} placeholder="Deixe vazio para usar o Master Password" />
              </div>
            </div>
          </section>

          {/* Paths */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Diretórios</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <Label>Data Path</Label>
                <Input value={f.data_path} onChange={set('data_path')} placeholder="/hana/data" className="font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label>Log Path</Label>
                <Input value={f.log_path} onChange={set('log_path')} placeholder="/hana/log" className="font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label>Shared Path</Label>
                <Input value={f.shared_path} onChange={set('shared_path')} placeholder="/hana/shared" className="font-mono text-sm" />
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button
              disabled={!f.name || !f.sid || !f.master_password || !f.media_path || isLoading}
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
