import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Application, ApplicationCreate, ApplicationVariable } from '@/types';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface Fields {
  name: string;
  version: string;
  installer_path: string;
  silent_switch: string;
  extra_params: string;
  description: string;
  extra_vars: ApplicationVariable[];
}

const defaults = (): Fields => ({
  name: '',
  version: '1.0',
  installer_path: '',
  silent_switch: '/S',
  extra_params: '',
  description: '',
  extra_vars: [],
});

function fromApp(app: Application): Fields {
  const known = ['INSTALLER_PATH', 'SILENT_SWITCH', 'EXTRA_PARAMS'];
  const v = Object.fromEntries(app.variables.map(x => [x.key, x.value]));
  return {
    name: app.name, version: app.version,
    installer_path: v['INSTALLER_PATH'] ?? '',
    silent_switch: v['SILENT_SWITCH'] ?? '/S',
    extra_params: v['EXTRA_PARAMS'] ?? '',
    description: app.description ?? '',
    extra_vars: app.variables.filter(x => !known.includes(x.key)),
  };
}

function buildPayload(f: Fields): ApplicationCreate {
  const cmd = 'Start-Process -FilePath "{{INSTALLER_PATH}}" -ArgumentList "{{SILENT_SWITCH}} {{EXTRA_PARAMS}}" -Wait -NoNewWindow';
  const baseVars: ApplicationVariable[] = [
    { key: 'INSTALLER_PATH', value: f.installer_path },
    { key: 'SILENT_SWITCH',  value: f.silent_switch },
    { key: 'EXTRA_PARAMS',   value: f.extra_params },
  ];
  return {
    name: f.name, app_type: 'windows', version: f.version, os_type: 'windows',
    description: f.description,
    install_command: cmd,
    variables: [...baseVars, ...f.extra_vars].filter(v => v.value),
  };
}

interface Props {
  open: boolean; onBack: () => void; onClose: () => void;
  onSubmit: (data: ApplicationCreate) => void;
  application?: Application; isLoading?: boolean;
}

export function WindowsAppForm({ open, onBack, onClose, onSubmit, application, isLoading }: Props) {
  const [f, setF] = useState<Fields>(() => application ? fromApp(application) : defaults());
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');
  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF(prev => ({ ...prev, [k]: e.target.value }));

  const addVar = () => {
    const key = newKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
    if (!key || !newVal.trim()) return;
    setF(p => ({ ...p, extra_vars: [...p.extra_vars.filter(v => v.key !== key), { key, value: newVal.trim() }] }));
    setNewKey(''); setNewVal('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {!application && <button onClick={onBack} className="text-slate-400 hover:text-slate-600 mr-1"><ArrowLeft className="h-4 w-4" /></button>}
            <DialogTitle>🪟 Aplicação Windows</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Identificação</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2"><Label>Nome da Aplicação *</Label><Input value={f.name} onChange={set('name')} placeholder="Nome do software" /></div>
              <div className="space-y-1.5"><Label>Versão *</Label><Input value={f.version} onChange={set('version')} placeholder="1.0.0" /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea value={f.description} onChange={set('description')} rows={2} placeholder="Descrição da aplicação..." />
            </div>
          </section>
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Instalação</h3>
            <div className="space-y-1.5">
              <Label>Caminho do instalador *</Label>
              <Input value={f.installer_path} onChange={set('installer_path')} placeholder="C:\installers\setup.exe" className="font-mono text-sm" />
              <p className="text-xs text-slate-400">Pode usar variáveis: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{{VARIAVEL}}'}</code></p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Switch silencioso</Label>
                <Input value={f.silent_switch} onChange={set('silent_switch')} placeholder="/S" className="font-mono" />
                <p className="text-xs text-slate-400">Ex: /S, /silent, /qn, /quiet</p>
              </div>
              <div className="space-y-1.5">
                <Label>Parâmetros extras</Label>
                <Input value={f.extra_params} onChange={set('extra_params')} placeholder="/D=C:\Program Files\App" className="font-mono text-sm" />
              </div>
            </div>
          </section>

          {/* Variáveis adicionais */}
          <section className="space-y-3 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Variáveis adicionais</h3>
            {f.extra_vars.length > 0 && (
              <div className="rounded border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {f.extra_vars.map(v => (
                      <tr key={v.key} className="border-t border-slate-100 dark:border-slate-800 first:border-0">
                        <td className="px-3 py-2"><code className="text-xs bg-blue-50 dark:bg-blue-950 text-blue-600 px-1.5 py-0.5 rounded font-mono">{`{{${v.key}}}`}</code></td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-600 dark:text-slate-300">{v.value}</td>
                        <td className="px-2 py-2 text-center">
                          <button type="button" onClick={() => setF(p => ({ ...p, extra_vars: p.extra_vars.filter(x => x.key !== v.key) }))} className="text-slate-400 hover:text-red-500">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex gap-2 items-end">
              <div className="w-2/5">
                <Label className="text-xs text-slate-500 mb-1 block">Nome</Label>
                <Input placeholder="SERIAL_KEY" value={newKey} onChange={e => setNewKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))} className="font-mono text-sm h-9" />
              </div>
              <div className="flex-1">
                <Label className="text-xs text-slate-500 mb-1 block">Valor</Label>
                <Input placeholder="XXXX-YYYY-ZZZZ" value={newVal} onChange={e => setNewVal(e.target.value)} className="text-sm h-9" />
              </div>
              <Button type="button" variant="outline" size="sm" className="h-9 shrink-0" onClick={addVar} disabled={!newKey || !newVal}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </section>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button disabled={!f.name || !f.installer_path || isLoading} onClick={() => onSubmit(buildPayload(f))}>
              {isLoading ? 'Salvando...' : application ? 'Atualizar' : 'Criar Aplicação'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
