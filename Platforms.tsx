import { trpc } from ",../trpc";
import { AppLayout } from "./AppLayout";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";
import { Textarea } from "../textarea";
import { Card, CardContent } from "../card";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Trash2, Globe, Pencil, Loader2 } from "lucide-react";
import { EditDialog } from "./EditDialog";
import { FloatingActionButton } from "./FloatingActionButton";

export default function Platforms() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("selected");

  const { data: platforms, isLoading } = trpc.platforms.list.useQuery();
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [editPlatform, setEditPlatform] = useState<{ id: number; name: string; urlPattern: string; notes: string } | null>(null);
  const [form, setForm] = useState({ name: "", urlPattern: "", notes: "" });

  // Auto-open selected platform from URL
  useEffect(() => {
    if (selectedId && platforms) {
      const id = Number(selectedId);
      const match = platforms.find((p) => p.id === id);
      if (match) {
        setEditPlatform({ id: match.id, name: match.name, urlPattern: match.urlPattern || "", notes: match.notes || "" });
        setTimeout(() => {
          const el = document.getElementById(`platform-card-${id}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 200);
      }
    }
  }, [selectedId, platforms]);

  const createMutation = trpc.platforms.create.useMutation({
    onSuccess: () => {
      toast.success("Platform added");
      setShowForm(false);
      setForm({ name: "", urlPattern: "", notes: "" });
      utils.platforms.list.invalidate();
      utils.platforms.stats.invalidate();
    },
    onError: (err) => toast.error("Failed: " + err.message),
  });

  const deleteMutation = trpc.platforms.delete.useMutation({
    onSuccess: () => { toast.success("Deleted"); utils.platforms.list.invalidate(); utils.platforms.stats.invalidate(); },
    onError: (err) => toast.error("Delete failed: " + err.message),
  });

  const updateMutation = trpc.platforms.update.useMutation({
    onSuccess: () => { toast.success("Platform updated"); utils.platforms.list.invalidate(); utils.platforms.stats.invalidate(); setEditPlatform(null); },
    onError: (err) => toast.error("Update failed: " + err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    createMutation.mutate({
      name: form.name.trim(),
      urlPattern: form.urlPattern || undefined,
      notes: form.notes || undefined,
    });
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Platforms</h1>
            <p className="text-sm text-muted-foreground mt-1">Track where attacks happen</p>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-1" />Add Platform</Button>
        </div>

        {showForm && (
          <Card>
            <CardContent className="p-4">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Name *</Label><Input placeholder="e.g. Twitter / X" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>URL Pattern</Label><Input placeholder="https://twitter.com/..." value={form.urlPattern} onChange={(e) => setForm({ ...form, urlPattern: e.target.value })} /></div>
                </div>
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

        {isLoading ? <div className="text-sm text-muted-foreground">Loading...</div> : platforms?.length === 0 ? (
          <Card><CardContent className="py-10 text-center"><p className="text-muted-foreground text-sm">No platforms yet</p></CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {platforms?.map((p) => (
              <Card key={p.id} id={`platform-card-${p.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditPlatform({ id: p.id, name: p.name, urlPattern: p.urlPattern || "", notes: p.notes || "" })}>
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { if (confirm("Delete?")) deleteMutation.mutate({ id: p.id }); }}>
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  {p.urlPattern && <p className="text-xs text-muted-foreground mt-1 truncate">{p.urlPattern}</p>}
                  {p.notes && <p className="text-xs text-muted-foreground mt-1">{p.notes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <EditDialog
          open={editPlatform !== null}
          onClose={() => {
            setEditPlatform(null);
            if (searchParams.has("selected")) {
              const newParams = new URLSearchParams(searchParams);
              newParams.delete("selected");
              setSearchParams(newParams, { replace: true });
            }
          }}
          title="Edit Platform"
          fields={[
            { name: "name", label: "Name", type: "text" },
            { name: "urlPattern", label: "URL Pattern", type: "text" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]}
          values={editPlatform ? { name: editPlatform.name, urlPattern: editPlatform.urlPattern, notes: editPlatform.notes } : {}}
          onSave={(vals) => editPlatform && updateMutation.mutate({ id: editPlatform.id, name: vals.name, urlPattern: vals.urlPattern, notes: vals.notes })}
          isPending={updateMutation.isPending}
        />

        <FloatingActionButton onClick={() => setShowForm(true)} label="Add platform" />
      </div>
    </AppLayout>
  );
}
