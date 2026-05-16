import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { AppType } from '@/types';

interface AppTypeDef {
  id: AppType;
  label: string;
  icon: string;
  description: string;
  os: 'linux' | 'windows' | 'both';
}

export const APP_TYPES: AppTypeDef[] = [
  {
    id: 'hana',
    label: 'SAP HANA',
    icon: '🔷',
    description: 'SAP HANA Database Server',
    os: 'linux',
  },
  {
    id: 'sqlserver',
    label: 'SQL Server',
    icon: '🗄️',
    description: 'Microsoft SQL Server',
    os: 'windows',
  },
  {
    id: 'sapbo',
    label: 'SAP Business One',
    icon: '🟦',
    description: 'SAP Business One Server',
    os: 'windows',
  },
  {
    id: 'sapbosl',
    label: 'SAP B1 Service Layer',
    icon: '🔗',
    description: 'SAP Business One Service Layer',
    os: 'linux',
  },
  {
    id: 'b1if',
    label: 'Integration Framework',
    icon: '🔄',
    description: 'SAP Business One Integration Framework (B1iF)',
    os: 'linux',
  },
  {
    id: 'windows',
    label: 'Aplicação Windows',
    icon: '🪟',
    description: 'Instalador genérico para Windows',
    os: 'windows',
  },
];

interface Props {
  open: boolean;
  onSelect: (type: AppType) => void;
  onClose: () => void;
}

export function AppTypeSelector({ open, onSelect, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova Aplicação — Selecione o tipo</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 pt-2">
          {APP_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-left hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 dark:hover:border-blue-500 transition-all group"
            >
              <span className="text-3xl mt-0.5">{t.icon}</span>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                  {t.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>
                <span className={`inline-block mt-1.5 text-xs px-1.5 py-0.5 rounded font-medium ${
                  t.os === 'linux'
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                    : t.os === 'windows'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {t.os === 'linux' ? '🐧 Linux' : t.os === 'windows' ? '🪟 Windows' : '🌐 Multi'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
