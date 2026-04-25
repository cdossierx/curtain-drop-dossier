import { trpc } from "./trpc";
import { AppLayout } from "./components/AppLayout";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import { Card, CardContent } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Skeleton } from "./components/ui/skeleton";
import { Progress } from "./components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./components/ui/dialog";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Trash2, UserCircle, Pencil, Loader2 } from "lucide-react";
import { EditDialog } from "./components/EditDialog";
import { FloatingActionButton } from "./components/FloatingActionButton";

const EVENT_TYPE_LABELS: Record<string, string> = {
  harassment: "Harassment", defamation: "Defamation", doxxing: "Doxxing", threat: "Threat",
  narrative_seeding: "Narrative Seeding", dogpiling: "Dogpiling", coordinated_live: "Coordinated Live",
  evidence_leak: "Evidence Leak", false_allegation: "False Allegation",
  account_creation: "Acct Creation", account_deletion: "Acct Deletion",
};

export default function Persons() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("selected");

  const { data: persons, isLoading } = trpc.persons.list.useQuery();
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<number | null>(selectedId ? Number(selectedId) : null);
  const [editPerson, setEditPerson] = useState<{ id: number; displayName: string; firstSeenDate: string; notes: string } | null>(null);
  const [form, setForm] = useState({ displayName: "", firstSeenDate: "", notes: "" });

  // Auto-open selected person from URL
  useEffect(() => {
    if (selectedId) {
      const id = Number(selectedId);
      if (!isNaN(id)) {
        setSelectedPerson(id);
        setTimeout(() => {
          const el = document.getElementById(`person-card-${id}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
      }
    }
  }, [selectedId]);

  const createMutation = trpc.persons.create.useMutation({
    onSuccess: () => {
      toast.success("Person added");
      setShowForm(false);
      setForm({ displayName: "", firstSeenDate: "", notes: "" });
      utils.persons.list.invalidate();
    },
    onError: (err) => toast.error("Failed: " + err.message),
  });

  const deleteMutation = trpc.persons.delete.useMutation({
    onSuccess: () => { toast.success("Deleted"); utils.persons.list.invalidate(); },
    onError: (err) => toast.error("Delete failed: " + err.message),
  });

  const updateMutation = trpc.persons.update.useMutation({
    onSuccess: () => { toast.success("Person updated"); utils.persons.list.invalidate(); setEditPerson(null); },
    onError: (err) => toast.error("Update failed: " + err.message),
  });

  const { data: personDetail } = trpc.persons.getById.useQuery(
    { id: selectedPerson! },
    { enabled: !!selectedPerson }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.displayName.trim()) { toast.error("Name is required"); return; }
    createMutation.mutate({
      displayName: form.displayName.trim(),
      firstSeenDate: form.firstSeenDate || undefined,
      notes: form.notes || undefined,
    });
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Persons</h1>
            <p className="text-sm text-muted-foreground mt-1">Track people and their aliases</p>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-1" />Add Person</Button>
        </div>

        {showForm && (
          <Card>
            <CardContent className="p-4">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Name *</Label><Input placeholder="Display name" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>First Seen</Label><Input type="date" value={form.firstSeenDate} onChange={(e) => setForm({ ...form, firstSeenDate: e.target.value })} /></div>
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

        {isLoading ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div> : persons?.length === 0 ? (
          <Card><CardContent className="py-10 text-center"><p className="text-muted-foreground text-sm">No persons yet. Add your first.</p></CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {persons?.map((person) => (
              <Card key={person.id} id={`person-card-${person.id}`} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedPerson(person.id)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <UserCircle className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-semibold">{person.displayName}</p>
                        {person.firstSeenDate && <p className="text-xs text-muted-foreground">First seen: {new Date(person.firstSeenDate).toLocaleDateString()}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setEditPerson({ id: person.id, displayName: person.displayName, firstSeenDate: person.firstSeenDate ? (person.firstSeenDate instanceof Date ? person.firstSeenDate.toISOString().split("T")[0] : String(person.firstSeenDate).split("T")[0]) : "", notes: person.notes || "" }); }}>
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); if (confirm("Delete?")) deleteMutation.mutate({ id: person.id }); }}>
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
          open={editPerson !== null}
          onClose={() => setEditPerson(null)}
          title="Edit Person"
          fields={[
            { name: "displayName", label: "Name", type: "text" },
            { name: "firstSeenDate", label: "First Seen", type: "date" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]}
          values={editPerson ? { displayName: editPerson.displayName, firstSeenDate: editPerson.firstSeenDate, notes: editPerson.notes } : {}}
          onSave={(vals) => editPerson && updateMutation.mutate({ id: editPerson.id, displayName: vals.displayName, firstSeenDate: vals.firstSeenDate || undefined, notes: vals.notes || undefined })}
          isPending={updateMutation.isPending}
        />

        {selectedPerson && personDetail && (
          <Dialog open={!!selectedPerson} onOpenChange={() => { setSelectedPerson(null); if (searchParams.has("selected")) { const newParams = new URLSearchParams(searchParams); newParams.delete("selected"); setSearchParams(newParams, { replace: true }); } }}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{personDetail.displayName}</DialogTitle></DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Card><CardContent className="pt-4"><div className="text-xl font-bold">{personDetail.totalIncidents}</div><p className="text-xs text-muted-foreground">Incidents</p></CardContent></Card>
                  <Card><CardContent className="pt-4"><div className="text-xl font-bold">{personDetail.evidenceCount}</div><p className="text-xs text-muted-foreground">Evidence</p></CardContent></Card>
                  <Card><CardContent className="pt-4"><div className="text-xl font-bold">{personDetail.aliases.length}</div><p className="text-xs text-muted-foreground">Aliases</p></CardContent></Card>
                  <Card><CardContent className="pt-4"><div className="text-xl font-bold">{personDetail.platformsUsed.length}</div><p className="text-xs text-muted-foreground">Platforms</p></CardContent></Card>
                </div>
                {personDetail.firstSeenDate && <p><span className="text-muted-foreground">First seen:</span> {new Date(personDetail.firstSeenDate).toLocaleDateString()}</p>}
                {personDetail.platformsUsed.length > 0 && <p><span className="text-muted-foreground">Platforms:</span> {personDetail.platformsUsed.join(", ")}</p>}
                {personDetail.commonTactics.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-2">Common Tactics:</p>
                    <div className="space-y-1.5">
                      {personDetail.commonTactics.map((t) => (
                        <div key={t.tactic}>
                          <div className="flex justify-between text-xs mb-0.5"><span>{EVENT_TYPE_LABELS[t.tactic] || t.tactic}</span><span>{t.count}</span></div>
                          <Progress value={(t.count / (personDetail.commonTactics[0]?.count || 1)) * 100} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {personDetail.aliases.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-2">Known Aliases:</p>
                    <div className="flex flex-wrap gap-2">
                      {personDetail.aliases.map((a) => <Badge key={a.id} variant="outline">{a.alias}</Badge>)}
                    </div>
                  </div>
                )}
                {personDetail.notes && <div><p className="text-muted-foreground">Notes:</p><p>{personDetail.notes}</p></div>}
                {personDetail.incidents.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-2">Recent Incidents:</p>
                    <div className="space-y-2">
                      {personDetail.incidents.slice(0, 5).map((inc) => (
                        <Card key={inc.id}><CardContent className="p-3">
                          <div className="flex justify-between"><Badge variant="outline" className="text-xs">{EVENT_TYPE_LABELS[inc.eventType]}</Badge><span className="text-xs text-muted-foreground">{new Date(inc.incidentDate).toLocaleDateString()}</span></div>
                          {inc.title && <p className="font-medium mt-1">{inc.title}</p>}
                          <p className="text-xs mt-1 line-clamp-2">{inc.description}</p>
                        </CardContent></Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        <FloatingActionButton onClick={() => setShowForm(true)} label="Add person" />
      </div>
    </AppLayout>
  );
}
