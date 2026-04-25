import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { trpc } from "./providers/trpc";

/**
 * BackendHealth — Detects whether the API server is reachable.
 *
 * In production deployments (static hosting), the backend Hono server
 * does NOT run, so all /api/trpc calls will fail. This component
 * shows a clear warning instead of misleading empty lists.
 *
 * Usage: Place inside AppLayout (already wraps all pages).
 */

export function BackendHealth() {
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");

  // Use the existing ping query to verify connectivity
  const pingQuery = trpc.ping.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (pingQuery.isLoading) {
      setStatus("checking");
    } else if (pingQuery.isError || !pingQuery.data) {
      setStatus("offline");
    } else {
      setStatus("online");
    }
  }, [pingQuery.isLoading, pingQuery.isError, pingQuery.data]);

  // Online: show nothing (silent)
  if (status === "online") return null;

  // Checking: small unobtrusive indicator
  if (status === "checking") {
    return (
      <div className="bg-muted border-b px-4 py-2 text-xs text-muted-foreground flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        Checking backend connection...
      </div>
    );
  }

  // Offline: FULL BLOCKING BANNER — do not show empty lists
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="max-w-md w-full mx-4 p-6 border rounded-xl shadow-lg bg-card">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <h2 className="text-lg font-semibold">Backend Unavailable</h2>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          This deployment is <strong>not connected to the database</strong>. The frontend
          cannot reach the API server that handles all data queries.
        </p>

        <div className="bg-secondary rounded-lg p-4 space-y-2 text-sm">
          <p className="font-medium text-foreground">To use the app with your data:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>
              Open a terminal in the project folder{" "}
              <code className="text-xs bg-background px-1 py-0.5 rounded border">/mnt/agents/output/app</code>
            </li>
            <li>
              Run: <code className="text-xs bg-background px-1 py-0.5 rounded border font-mono">npm run dev</code>
            </li>
            <li>
              Open <code className="text-xs bg-background px-1 py-0.5 rounded border font-mono">http://localhost:3000</code>
            </li>
          </ol>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>Your data is safe in the remote MySQL database</span>
        </div>
      </div>
    </div>
  );
}
