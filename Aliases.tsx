import { trpc } from "@/providers/trpc";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Textarea } from "./textarea";
import { Card, CardContent } from "./card";
import { Badge } from "./badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { Plus, Trash2, AtSign, Pencil, Loader2 } from "lucide-react";
import { EditDialog } from "@/components/EditDialog";
import { FloatingActionButton } from "@/components/FloatingActionButton";

const CONFIDENCE_LABELS: Record<string, string> = {
  confirmed: "Confirmed", strong_evidence: "Strong", moderate_evidence: "Moderate", unverified: "Unverified", disputed: "Disputed",
};
const CONFIDENCE_COLORS: Record<string, string> = {
  confirmed: "bg-green-100 text-green-800", strong_evidence: "bg-blue-100 text-blue-800",
  moderate_evidence: "bg-yellow-100 text-yellow-800", unverified: "bg-gray-100 text-gray-800", disputed: "bg-red-100 text-red-800",
};

export default function Aliases() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("selected");

  const { data: aliases, isLoading } = trpc.aliases.list.useQuery();
  const { data: persons } = trpc.persons.list.useQuery();
  const { data: platforms } = trpc.platforms.list.useQuery();
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [editAlias, setEditAlias] = useState<{ id: number; alias: string; suspectedOperator: string; confidence: string; evidenceDescription: string; notes: string } | null>(null);
  const [form, setForm] = useState({ personId: "", alias: "", platformId: "", suspectedOperator: "", confidence: "unverified" as string, evidenceDescription: "", notes: "" });

  // Auto-open selected alias from URL
  useEffect(() => {
    if (selectedId && aliases) {
      const id = Number(selectedId);
      const match = aliases.find((a) => a.id === id);
      if (match) {
        setEditAlias({ id: match.id, alias: match.alias, suspectedOperator: match.suspectedOperator || "", confidence: match.confidence, evidenceDescription: match.evidenceDescription || "", notes: match.notes || "" });
        setTimeout(() => {
          const el = document.getElementById(`alias-card-${id}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 200);
      }
    }
  }, [selectedId, aliases]);

  const createMutation = trpc.aliases.create.useMutation({
    onSuccess: () => {
      toast.success("Alias added");
      setShowForm(false);
      setForm({ personId: "", alias: "", platformId: "", suspectedOperator: "", confidence: "unverified", evidenceDescription: "", notes: "" });
      utils.aliases.list.invalidate();
    },
    onError: (err) => toast.error("Failed: " + err.message),
  });

  const deleteMutation = trpc.aliases.delete.useMutation({
    onSuccess: () => { toast.success("Deleted"); utils.aliases.list.invalidate(); },
    onError: (err) => toast.error("Delete failed: " + err.message),
  });

  const updateMutation = trpc.aliases.update.useMutation({
    onSuccess: () => { toast.success("Alias updated"); utils.aliases.list.invalidate(); setEditAlias(null); },
    onError: (err) => toast.error("Update failed: " + err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.alias.trim()) { toast.error("Alias is required"); return; }
    createMutation.mutate({
      alias: form.alias.trim(),
      personId: form.personId ? Number(form.personId) : undefined,
      platformId: form.platformId ? Number(form.platformId) : undefined,
      suspectedOperator: form.suspectedOperator || undefined,
      confidence: form.confidence as "confirmed" | "strong_evidence" | "moderate_evidence" | "unverified" | "disputed",
      evidenceDescription: form.evidenceDescription || undefined,
      notes: form.notes || undefined,
    });
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Aliases</h1>
            <p className="text-sm text-muted-foreground mt-1">Map aliases to suspected operators</p>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-1" />Add Alias</Button>
        </div>

        {showForm && (
          <Card>
            <CardContent className="p-4">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Alias *</Label><Input placeholder="@username or handle" value={form.alias} onChange={(e) => setForm({ ...form, alias: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Person</Label>
                    <Select value={form.personId} onValueChange={(v) => setForm({ ...form, personId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select person..." /></SelectTrigger>
                      <SelectContent>{persons?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.displayName}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Platform</Label>
                    <Select value={form.platformId} onValueChange={(v) => setForm({ ...form, platformId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>{platforms?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Confidence</Label>
                    <Select value={form.confidence} onValueChange={(v) => setForm({ ...form, confidence: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(CONFIDENCE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5"><Label>Suspected Operator</Label><Input placeholder="Who might be behind this?" value={form.suspectedOperator} onChange={(e) => setForm({ ...form, suspectedOperator: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Evidence Linking</Label><Textarea placeholder="Evidence connecting alias to person..." rows={2} value={form.evidenceDescription} onChange={(e) => setForm({ ...form, evidenceDescription: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Notes</Label><Textarea placeholder="Notes..." rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    {createMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {isLoading ? <div className="text-sm text-muted-foreground">Loading...</div> : aliases?.length === 0 ? (
          <Card><CardContent className="py-10 text-center"><p className="text-muted-foreground text-sm">No aliases yet</p></CardContent></Card>
        ) : (
          <div className="space-y-2">
            {aliases?.map((a) => (
              <Card key={a.id} id={`alias-card-${a.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AtSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{a.alias}</span>
                          <Badge className={`text-xs ${CONFIDENCE_COLORS[a.confidence]}`}>{CONFIDENCE_LABELS[a.confidence]}</Badge>
                        </div>
                        {a.suspectedOperator && <p className="text-xs text-muted-foreground">Suspected: {a.suspectedOperator}</p>}
                        {a.evidenceDescription && <p className="text-xs text-muted-foreground mt-0.5">{a.evidenceDescription}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditAlias({ id: a.id, alias: a.alias, suspectedOperator: a.suspectedOperator || "", confidence: a.confidence, evidenceDescription: a.evidenceDescription || "", notes: a.notes || "" })}>
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { if (confirm("Delete?")) deleteMutation.mutate({ id: a.id }); }}>
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <EditDialog
          open={editAlias !== null}
          onClose={() => {
            setEditAlias(null);
            if (searchParams.has("selected")) {
              const newParams = new URLSearchParams(searchParams);
              newParams.delete("selected");
              setSearchParams(newParams, { replace: true });
            }
          }}
          title="Edit Alias"
          fields={[
            { name: "alias", label: "Alias", type: "text" },
            { name: "confidence", label: "Confidence", type: "select", options: [
              { value: "confirmed", label: "Confirmed" }, { value: "strong_evidence", label: "Strong" },
              { value: "moderate_evidence", label: "Moderate" }, { value: "unverified", label: "Unverified" }, { value: "disputed", label: "Disputed" },
            ]},
            { name: "suspectedOperator", label: "Suspected Operator", type: "text" },
            { name: "evidenceDescription", label: "Evidence Linking", type: "textarea" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]}
          values={editAlias ? { alias: editAlias.alias, confidence: editAlias.confidence, suspectedOperator: editAlias.suspectedOperator, evidenceDescription: editAlias.evidenceDescription, notes: editAlias.notes } : {}}
          onSave={(vals) => editAlias && updateMutation.mutate({ id: editAlias.id, alias: vals.alias, confidence: vals.confidence as any, suspectedOperator: vals.suspectedOperator, evidenceDescription: vals.evidenceDescription, notes: vals.notes })}
          isPending={updateMutation.isPending}
        />

        <FloatingActionButton onClick={() => setShowForm(true)} label="Add alias" />
      </div>
    </AppLayout>
  );
}
