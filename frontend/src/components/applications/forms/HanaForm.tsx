import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Application, ApplicationCreate } from '@/types';
import { ArrowLeft, Eye, EyeOff, RefreshCw, Copy, Check } from 'lucide-react';

// ── Password generator ────────────────────────────────────────────────────────
// Excluded: @ # ^ ' " ? ` ~ ! & =
const UPPER  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER  = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const SAFE   = '-_.:;,()[]{}+*/%<>\\|';

function generatePassword(length = 16): string {
  const all = UPPER + LOWER + DIGITS + SAFE;
  const rand = (chars: string) => chars[Math.floor(Math.random() * chars.length)];
  // Guarantee at least one of each class
  const required = [rand(UPPER), rand(LOWER), rand(DIGITS), rand(SAFE)];
  const rest = Array.from({ length: length - 4 }, () => rand(all));
  return [...required, ...rest]
    .sort(() => Math.random() - 0.5)
    .join('');
}

// ── PasswordField component ───────────────────────────────────────────────────
interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  required?: boolean;
}

function PasswordField({ label, value, onChange, placeholder, hint, required }: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => onChange(generatePassword(16));

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-1.5">
      <Label>{label}{required && ' *'}</Label>
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <Input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="font-mono text-sm pr-8"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            tabIndex={-1}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {/* Copy */}
        <button
          type="button"
          onClick={handleCopy}
          disabled={!value}
          title="Copiar senha"
          className="flex items-center justify-center w-9 h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-slate-400" />}
        </button>
        {/* Generate */}
        <button
          type="button"
          onClick={handleGenerate}
          title="Gerar senha aleatória (16 chars)"
          className="flex items-center justify-center w-9 h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-400 transition-colors"
        >
          <RefreshCw className="h-4 w-4 text-slate-400 hover:text-blue-500" />
        </button>
      </div>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

// ── Form state ────────────────────────────────────────────────────────────────
interface Fields {
  name: string;
  version: string;
  media_url: string;
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
  media_url: '',
  media_path: '/hana/shared/media',
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
    media_url: app.installer_url ?? '',
    media_path: v['MEDIA_PATH'] ?? '/hana/shared/media',
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
    installer_url: f.media_url || undefined,
    description: `SAP HANA Database — SID: ${f.sid}, Instância: ${f.instance}`,
    install_command: cmd,
    variables: [
      { key: 'MEDIA_PATH',      value: f.media_path },
      { key: 'SID',             value: f.sid.toUpperCase() },
      { key: 'INSTANCE',        value: f.instance },
      { key: 'MASTER_PASSWORD', value: f.master_password },
      { key: 'SYSTEM_PASSWORD', value: f.system_password || f.master_password },
      { key: 'SAPADM_PASSWORD', value: f.sapadm_password || f.master_password },
      { key: 'DATA_PATH',       value: f.data_path },
      { key: 'LOG_PATH',        value: f.log_path },
      { key: 'SHARED_PATH',     value: f.shared_path },
    ].filter(v => v.value),
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
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

  const setVal = (k: keyof Fields) => (v: string) =>
    setF(prev => ({ ...prev, [k]: v }));

  const canSubmit = f.name && f.sid.trim().length >= 1 && f.master_password && f.media_path;

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

        <div className="space-y-5 pt-1">

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

          {/* Mídia de Instalação */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Mídia de Instalação</h3>
            <div className="space-y-1.5">
              <Label>URL de download da mídia</Label>
              <Input
                value={f.media_url}
                onChange={set('media_url')}
                placeholder="https://download.example.com/HANA2_SPS07.zip"
                type="url"
              />
              <p className="text-xs text-slate-400">
                URL para download do pacote de instalação (opcional). O agente fará o download antes de instalar.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Caminho local da mídia *</Label>
              <Input
                value={f.media_path}
                onChange={set('media_path')}
                placeholder="/hana/shared/media/51057281"
                className="font-mono text-sm"
              />
              <p className="text-xs text-slate-400">
                Diretório no servidor onde o <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">hdblcm</code> está localizado.
              </p>
            </div>
          </section>

          {/* Sistema HANA */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Sistema HANA</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>SID (System ID) *</Label>
                <Input
                  value={f.sid}
                  onChange={e => setF(p => ({ ...p, sid: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) }))}
                  placeholder="PRD"
                  maxLength={3}
                  className="font-mono uppercase tracking-widest text-center text-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Número da Instância *</Label>
                <Input
                  value={f.instance}
                  onChange={e => setF(p => ({ ...p, instance: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                  placeholder="00"
                  maxLength={2}
                  className="font-mono tracking-widest text-center text-lg"
                />
              </div>
            </div>
          </section>

          {/* Senhas */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Senhas</h3>
            <p className="text-xs text-slate-400 -mt-1">
              Mínimo 14 caracteres · maiúsculas, minúsculas e números obrigatórios · caracteres permitidos: letras, dígitos e <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">- _ . : ; , ( ) + % / &lt; &gt;</code>
            </p>
            <PasswordField
              label="Master Password"
              required
              value={f.master_password}
              onChange={setVal('master_password')}
              hint="Usada para os usuários SYSTEM e como padrão para os demais se não preenchidos."
            />
            <PasswordField
              label="System User Password"
              value={f.system_password}
              onChange={setVal('system_password')}
              hint="Deixe vazio para herdar o Master Password."
            />
            <PasswordField
              label="SAPADM Password"
              value={f.sapadm_password}
              onChange={setVal('sapadm_password')}
              hint="Deixe vazio para herdar o Master Password."
            />
          </section>

          {/* Diretórios */}
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

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button
              disabled={!canSubmit || isLoading}
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
