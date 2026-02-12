import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getServers } from '@/lib/api';
import { Server as ServerIcon } from 'lucide-react';
import { getOSIcon } from '@/lib/utils';

export default function Servers() {
  const { data: servers = [], isLoading } = useQuery({
    queryKey: ['servers'],
    queryFn: async () => (await getServers()).data,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Servers</h1>
          <p className="mt-2 text-sm text-slate-600">Manage your target servers</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {servers.map((server) => (
          <Card key={server.id}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{getOSIcon(server.os_type)}</span>
                <CardTitle className="text-lg">{server.hostname}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">{server.ip_address}</p>
              <p className="mt-2 text-xs text-slate-500">
                {server.username}@{server.os_type}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {servers.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <ServerIcon className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-4 text-lg font-medium">No servers yet</h3>
              <p className="mt-2 text-sm text-slate-600">Add your first server</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
