import { trpc } from "./trpc"
import { AppLayout } from "./components/AppLayout";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Card, CardContent } from "./components/ui/card";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Loader2 } from "lucide-react";
import { EditDialog } from "./components/EditDialog";
import { FloatingActionButton } from "./components/FloatingActionButton";

export default function TagsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("selected");

  const { data: tags, isLoading } = trpc.tags.list.useQuery();
  
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [editTag, setEditTag] = useState<{ id: number; name: string; color: string; description: string } | null>(null);
  const [form, setForm] = useState({ name: "", color: "#3b82f6", description: "" });

  // Auto-open selected tag from URL
  useEffect(() => {
    if (selectedId && tags) {
      const id = Number(selectedId);
      const match = tags.find((t) => t.id === id);
      if (match) {
        setEditTag({ id: match.id, name: match.name, color: match.color || "#3b82f6", description: match.description || "" });
        setTimeout(() => {
          const el = document.getElementById(`tag-card-${id}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 200);
      }
    }
  }, [selectedId, tags]);

  const createMutation = trpc.tags.create.useMutation({
    onSuccess: () => {
      toast.success("Tag created");
      setShowForm(false);
      setForm({ name: "", color: "#3b82f6", description: "" });
      utils.tags.list.invalidate();
    },
    onError: (err) => {
      toast.error("Failed to create tag: " + err.message);
    },
  });

  const deleteMutation = trpc.tags.delete.useMutation({
    onSuccess: () => { toast.success("Deleted"); utils.tags.list.invalidate(); },
    onError: (err) => toast.error("Delete failed: " + err.message),
  });

  const updateMutation = trpc.tags.update.useMutation({
    onSuccess: () => { toast.success("Tag updated"); utils.tags.list.invalidate(); setEditTag(null); },
    onError: (err) => toast.error("Update failed: " + err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    createMutation.mutate({ name: form.name.trim(), color: form.color, description: form.description || undefined });
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tags</h1>
            <p className="text-sm text-muted-foreground mt-1">Organize incidents with tags</p>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-1" />Add Tag</Button>
        </div>

        {showForm && (
          <Card>
            <CardContent className="p-4">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="tag-name">Name *</Label>
                    <Input id="tag-name" placeholder="e.g. Priority" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tag-color">Color</Label>
                    <Input id="tag-color" type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tag-desc">Description</Label>
                    <Input id="tag-desc" placeholder="Optional" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={createMutation.isPending}>
                    {createMutation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
                    {createMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {isLoading ? <div className="text-sm text-muted-foreground">Loading...</div> : tags?.length === 0 ? (
          <Card><CardContent className="py-10 text-center"><p className="text-muted-foreground text-sm">No tags yet</p></CardContent></Card>
        ) : (
          <div className="flex flex-wrap gap-3">
            {tags?.map((tag) => (
              <Card key={tag.id} id={`tag-card-${tag.id}`} className="min-w-[200px]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color || "#3b82f6" }} />
                      <span className="font-medium">{tag.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditTag({ id: tag.id, name: tag.name, color: tag.color || "#3b82f6", description: tag.description || "" })}>
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { if (confirm("Delete?")) deleteMutation.mutate({ id: tag.id }); }}>
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  {tag.description && <p className="text-xs text-muted-foreground mt-1">{tag.description}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <EditDialog
          open={editTag !== null}
          onClose={() => {
            setEditTag(null);
            if (searchParams.has("selected")) {
              const newParams = new URLSearchParams(searchParams);
              newParams.delete("selected");
              setSearchParams(newParams, { replace: true });
            }
          }}
          title="Edit Tag"
          fields={[
            { name: "name", label: "Name", type: "text" },
            { name: "color", label: "Color", type: "color" },
            { name: "description", label: "Description", type: "textarea" },
          ]}
          values={editTag ? { name: editTag.name, color: editTag.color, description: editTag.description } : {}}
          onSave={(vals) => editTag && updateMutation.mutate({ id: editTag.id, name: vals.name, color: vals.color, description: vals.description })}
          isPending={updateMutation.isPending}
        />

        <FloatingActionButton onClick={() => setShowForm(true)} label="Add tag" />
      </div>
    </AppLayout>
  );
}
