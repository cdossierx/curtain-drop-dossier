import { trpc } from "@/providers/trpc";
import { AppLayout } from "./AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { toast } from "sonner";
import { Download, RotateCcw, Shield, Database, AlertTriangle, CheckCircle, FileJson, Archive, FileImage, Tag } from "lucide-react";

export default function Settings() {
  const { data: exportData, isLoading: exportLoading } = trpc.export.full.useQuery();
  const utils = trpc.useUtils();

  const restoreIncident = trpc.incidents.restore.useMutation({
    onSuccess: () => { toast.success("Incident restored"); utils.incidents.stats.invalidate(); utils.incidents.list.invalidate(); },
  });
  const restorePerson = trpc.persons.restore.useMutation({
    onSuccess: () => { toast.success("Person restored"); utils.export.full.invalidate(); utils.persons.list.invalidate(); },
  });
  const restoreAlias = trpc.aliases.restore.useMutation({
    onSuccess: () => { toast.success("Alias restored"); utils.export.full.invalidate(); utils.aliases.list.invalidate(); },
  });
  const restoreEvidence = trpc.evidence.restore.useMutation({
    onSuccess: () => { toast.success("Receipt restored"); utils.export.full.invalidate(); utils.evidence.list.invalidate(); utils.evidence.stats.invalidate(); },
  });
  const restoreTag = trpc.tags.restore.useMutation({
    onSuccess: () => { toast.success("Tag restored"); utils.export.full.invalidate(); utils.tags.list.invalidate(); },
  });

  const handleExport = () => {
    if (!exportData) return;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipts-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded");
  };

  const trash = exportData?.data?.trash;
  const totalTrash = exportData?.summary?.deletedInTrash
    ? (exportData.summary.deletedInTrash.incidents + exportData.summary.deletedInTrash.persons + exportData.summary.deletedInTrash.aliases + exportData.summary.deletedInTrash.evidence + exportData.summary.deletedInTrash.tags)
    : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Safety & Backup</h1>
          <p className="text-sm text-muted-foreground mt-1">Data protection, export, and recovery</p>
        </div>

        {/* Backup Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Download className="h-5 w-5 text-primary" />Full Data Export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Download a complete JSON backup of every incident, person, alias, receipt file, tag, and platform in your account. This is your disaster recovery file.
            </p>
            {exportData && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                <div className="text-center p-3 bg-secondary rounded-lg">
                  <div className="font-bold text-lg">{exportData.summary.incidents}</div>
                  <div className="text-xs text-muted-foreground">Incidents</div>
                </div>
                <div className="text-center p-3 bg-secondary rounded-lg">
                  <div className="font-bold text-lg">{exportData.summary.persons}</div>
                  <div className="text-xs text-muted-foreground">Persons</div>
                </div>
                <div className="text-center p-3 bg-secondary rounded-lg">
                  <div className="font-bold text-lg">{exportData.summary.aliases}</div>
                  <div className="text-xs text-muted-foreground">Aliases</div>
                </div>
                <div className="text-center p-3 bg-secondary rounded-lg">
                  <div className="font-bold text-lg">{exportData.summary.evidence}</div>
                  <div className="text-xs text-muted-foreground">Receipts</div>
                </div>
                <div className="text-center p-3 bg-secondary rounded-lg">
                  <div className="font-bold text-lg">{exportData.summary.tags}</div>
                  <div className="text-xs text-muted-foreground">Tags</div>
                </div>
              </div>
            )}
            <Button onClick={handleExport} disabled={!exportData} className="w-full sm:w-auto">
              <FileJson className="h-4 w-4 mr-2" />
              {exportData ? "Download Full Backup (.json)" : exportLoading ? "Loading..." : "Backup unavailable"}
            </Button>
          </CardContent>
        </Card>

        {/* Trash / Recovery */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Archive className="h-5 w-5 text-orange-500" />Trash / Recently Deleted</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Deleted items are kept in soft-delete mode and can be restored. They are hidden from normal views but still in the database.
            </p>
            {totalTrash === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <CheckCircle className="h-4 w-4 text-green-500" />Trash is empty
              </div>
            ) : (
              <>
                <div className="grid grid-cols-5 gap-2 text-sm">
                  <div className="text-center p-2 bg-red-50 dark:bg-red-950 rounded"><div className="font-bold">{exportData?.summary.deletedInTrash.incidents}</div><div className="text-xs">Incidents</div></div>
                  <div className="text-center p-2 bg-red-50 dark:bg-red-950 rounded"><div className="font-bold">{exportData?.summary.deletedInTrash.persons}</div><div className="text-xs">Persons</div></div>
                  <div className="text-center p-2 bg-red-50 dark:bg-red-950 rounded"><div className="font-bold">{exportData?.summary.deletedInTrash.aliases}</div><div className="text-xs">Aliases</div></div>
                  <div className="text-center p-2 bg-red-50 dark:bg-red-950 rounded"><div className="font-bold">{exportData?.summary.deletedInTrash.evidence}</div><div className="text-xs">Receipts</div></div>
                  <div className="text-center p-2 bg-red-50 dark:bg-red-950 rounded"><div className="font-bold">{exportData?.summary.deletedInTrash.tags}</div><div className="text-xs">Tags</div></div>
                </div>

                {trash?.incidents && trash.incidents.length > 0 && (
                  <TrashSection title="Deleted Incidents" icon={<Archive className="h-4 w-4" />} items={trash.incidents.map((i) => ({ id: i.id, label: i.title || `Incident #${i.id}`, sub: new Date(i.incidentDate).toLocaleDateString() }))} onRestore={(id) => restoreIncident.mutate({ id })} />
                )}
                {trash?.persons && trash.persons.length > 0 && (
                  <TrashSection title="Deleted Persons" icon={<Shield className="h-4 w-4" />} items={trash.persons.map((p) => ({ id: p.id, label: p.displayName, sub: "" }))} onRestore={(id) => restorePerson.mutate({ id })} />
                )}
                {trash?.aliases && trash.aliases.length > 0 && (
                  <TrashSection title="Deleted Aliases" icon={<Database className="h-4 w-4" />} items={trash.aliases.map((a) => ({ id: a.id, label: a.alias, sub: "" }))} onRestore={(id) => restoreAlias.mutate({ id })} />
                )}
                {trash?.evidence && trash.evidence.length > 0 && (
                  <TrashSection title="Deleted Receipts" icon={<FileImage className="h-4 w-4" />} items={trash.evidence.map((e) => ({ id: e.id, label: e.fileName, sub: e.evidenceType }))} onRestore={(id) => restoreEvidence.mutate({ id })} />
                )}
                {trash?.tags && trash.tags.length > 0 && (
                  <TrashSection title="Deleted Tags" icon={<Tag className="h-4 w-4" />} items={trash.tags.map((t) => ({ id: t.id, label: t.name, sub: "" }))} onRestore={(id) => restoreTag.mutate({ id })} />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Honest Backup Reality */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Shield className="h-5 w-5 text-yellow-500" />Backup & Safety Reality</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Database className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Where Your Data Lives</p>
                  <p className="text-muted-foreground">Remote MySQL database on Alibaba Cloud. Data persists across server restarts, rebuilds, and deployments.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Soft Delete is Active</p>
                  <p className="text-muted-foreground">When you click "Delete," records are hidden but NOT destroyed. They sit in the trash until restored. All 6 entity types (incidents, persons, aliases, receipts, tags, platforms) support soft delete.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Download className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">You Can Export Everything</p>
                  <p className="text-muted-foreground">Use the "Full Data Export" button above to download a complete JSON snapshot. Do this regularly — before major updates, after bulk entries, weekly.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">No Automatic Cloud Backups</p>
                  <p className="text-muted-foreground">The managed MySQL instance does NOT have automatic daily snapshots configured. If the database is corrupted or wiped, data could be lost. Your JSON exports are your disaster recovery.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Schema Changes Are Destructive</p>
                  <p className="text-muted-foreground">If the database schema is modified via `drizzle-kit push --force`, columns or tables could be dropped. Always export your data before any schema migration.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Recommended Safety Practice</p>
                  <p className="text-muted-foreground">1) Export JSON after every session. 2) Keep exports in cloud storage (Google Drive, Dropbox). 3) Before any code update, export first. 4) Never share your deployed URL or .env file.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function TrashSection({ title, icon, items, onRestore }: {
  title: string; icon: React.ReactNode;
  items: Array<{ id: number; label: string; sub: string }>;
  onRestore: (id: number) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium mb-2 flex items-center gap-1.5">{icon}{title}</p>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-2.5 bg-secondary/50 rounded-lg">
            <div className="text-sm min-w-0">
              <span className="font-medium truncate">{item.label}</span>
              {item.sub && <span className="text-muted-foreground text-xs ml-2">{item.sub}</span>}
            </div>
            <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={() => onRestore(item.id)}>
              <RotateCcw className="h-3 w-3 mr-1" />Restore
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
