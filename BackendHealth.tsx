import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
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
  const [message, setMessage] = useState("");

  // Use the existing ping query to verify connectivity
  const pingQuery = trpc.ping.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (pingQuery.isLoading) {
      setStatus("checking");
      setMessage("");
    } else if (pingQuery.isError || !pingQuery.data?.ok) {
      setStatus("offline");
      const errMsg = pingQuery.error?.message ?? "";
      const isNetwork =
        pingQuery.isError &&
        (/failed to fetch|network|load failed/i.test(errMsg) || errMsg === "Failed to fetch");
      setMessage(
        isNetwork
          ? "API server is not reachable. Run `npm run dev` (not `npm run preview`)."
          : pingQuery.data?.error || errMsg || "Saves and uploads cannot reach the database.",
      );
    } else {
      setStatus("online");
      setMessage("");
    }
  }, [pingQuery.isLoading, pingQuery.isError, pingQuery.data, pingQuery.error]);

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
    <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-xs text-destructive flex items-center gap-2">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>Persistence is offline: {message}</span>
    </div>
  );
}
