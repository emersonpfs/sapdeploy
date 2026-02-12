import { Link, useLocation } from 'react-router-dom';
import { Home, Package, Server, Rocket, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Applications', href: '/applications', icon: Package },
  { name: 'Servers', href: '/servers', icon: Server },
  { name: 'Deployments', href: '/deployments', icon: Rocket },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      {/* Header */}
      <div className="flex h-16 items-center border-b border-slate-200 px-6 dark:border-slate-800">
        <Rocket className="h-8 w-8 text-slate-900 dark:text-slate-50" />
        <span className="ml-3 text-xl font-bold text-slate-900 dark:text-slate-50">
          DeployMaster
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-50'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive
                    ? 'text-slate-900 dark:text-slate-50'
                    : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <Link
          to="/settings"
          className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-50"
        >
          <Settings className="mr-3 h-5 w-5 text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300" />
          Settings
        </Link>
      </div>
    </div>
  );
}
