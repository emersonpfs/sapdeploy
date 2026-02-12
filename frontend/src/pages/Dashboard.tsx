import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDashboardStats } from '@/lib/api';
import { Server, Package, Rocket, TrendingUp } from 'lucide-react';
import { formatDate, getStatusColor } from '@/lib/utils';

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await getDashboardStats()).data,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const statCards = [
    {
      title: 'Total Servers',
      value: stats?.total_servers || 0,
      icon: Server,
      color: 'text-blue-600',
    },
    {
      title: 'Total Applications',
      value: stats?.total_applications || 0,
      icon: Package,
      color: 'text-purple-600',
    },
    {
      title: 'Total Deployments',
      value: stats?.total_deployments || 0,
      icon: Rocket,
      color: 'text-orange-600',
    },
    {
      title: 'Success Rate',
      value: `${stats?.success_rate.toFixed(1) || 0}%`,
      icon: TrendingUp,
      color: 'text-green-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Welcome to DeployMaster - Your deployment control center
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Deployments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Deployments</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recent_deployments && stats.recent_deployments.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_deployments.map((deployment) => (
                <div
                  key={deployment.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-800"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(
                          deployment.status
                        )}`}
                      >
                        {deployment.status.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium">
                        {deployment.applications.map((app) => app.name).join(', ')}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Deployed to: {deployment.servers.map((srv) => srv.hostname).join(', ')}
                    </p>
                  </div>
                  <div className="text-sm text-slate-500">{formatDate(deployment.started_at)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-slate-500">No deployments yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
