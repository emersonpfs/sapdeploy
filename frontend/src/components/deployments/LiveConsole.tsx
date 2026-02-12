import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Terminal } from 'lucide-react';

interface LiveConsoleProps {
  deploymentId: number;
}

export function LiveConsole({ deploymentId }: LiveConsoleProps) {
  const [logs, setLogs] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/deployments/${deploymentId}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setLogs((prev) => prev + '🔌 Connected to deployment stream...\n\n');
    };

    ws.onmessage = (event) => {
      setLogs((prev) => prev + event.data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setLogs((prev) => prev + '\n❌ Connection error occurred\n');
    };

    ws.onclose = () => {
      setIsConnected(false);
      setLogs((prev) => prev + '\n🔌 Connection closed\n');
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [deploymentId]);

  useEffect(() => {
    // Auto-scroll to bottom
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <Card className="mt-4">
      <CardHeader className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <Terminal className="mr-2 h-5 w-5" />
            Live Console
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div
              className={`h-2 w-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-slate-500">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-96 overflow-y-auto bg-slate-950 p-4 font-mono text-sm text-slate-50">
          <pre className="whitespace-pre-wrap">{logs || 'Waiting for deployment to start...'}</pre>
          <div ref={logEndRef} />
        </div>
      </CardContent>
    </Card>
  );
}
