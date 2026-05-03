import { trpc } from "./trpc";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Slider } from "../ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, X } from "lucide-react";

const EVENT_TYPES = [
  { value: "harassment", label: "Harassment" },
  { value: "defamation", label: "Defamation" },
  { value: "doxxing", label: "Doxxing" },
  { value: "threat", label: "Threat" },
  { value: "narrative_seeding", label: "Narrative Seeding" },
  { value: "dogpiling", label: "Dogpiling" },
  { value: "coordinated_live", label: "Coordinated Live" },
  { value: "evidence_leak", label: "Evidence Leak" },
  { value: "false_allegation", label: "False Allegation" },
  { value: "account_creation", label: "Account Creation" },
  { value: "account_deletion", label: "Account Deletion" },
];

const STATUS_OPTIONS = [
  { value: "unreviewed", label: "Unreviewed" },
  { value: "logged", label: "Logged" },
  { value: "verified", label: "Verified" },
  { value: "archived", label: "Archived" },
  { value: "included_in_report", label: "Included in Report" },
];

const CONFIDENCE_OPTIONS = [
  { value: "confirmed", label: "Confirmed" },
  { value: "strong_evidence", label: "Strong Evidence" },
  { value: "moderate_evidence", label: "Moderate Evidence" },
  { value: "unverified", label: "Unverified" },
  { value: "disputed", label: "Disputed" },
];

interface EditIncidentProps {
  incidentId: number;
  open: boolean;
  onClose: () => void;
}

export function EditIncident({ incidentId, open, onClose }: EditIncidentProps) {
  const { data: incident } = trpc.incidents.getById.useQuery({ id: incidentId }, { enabled: open && incidentId > 0 });
  const { data: persons } = trpc.persons.list.useQuery();
  const { data: aliases } = trpc.aliases.list.useQuery();
  const { data: platforms } = trpc.platforms.list.useQuery();
  const utils = trpc.useUtils();

  const updateMutation = trpc.incidents.update.useMutation({
    onSuccess: () => {
      toast.success("Incident updated");
      utils.incidents.list.invalidate();
      utils.incidents.stats.invalidate();
      utils.incidents.getById.invalidate({ id: incidentId });
      onClose();
    },
    onError: (err) => toast.error("Error: " + err.message),
  });

  const [form, setForm] = useState({
    incidentDate: "",
    incidentTime: "",
    title: "",
    description: "",
    transcript: "",
    personId: "",
    aliasId: "",
    platformId: "",
    attackerName: "",
    platform: "",
    eventType: "harassment",
    severity: [3],
    mentalHealthImpact: [5],
    status: "unreviewed" as string,
    confidenceLevel: "unverified" as string,
    lieTopic: "",
    notes: "",
    context: "",
  });

  useEffect(() => {
    if (incident) {
      const d = incident.incidentDate as unknown;
      const dateStr = d instanceof Date ? d.toISOString().split("T")[0] : typeof d === "string" ? d.split("T")[0] : "";
      setForm({
        incidentDate: dateStr,
        incidentTime: incident.incidentTime || "",
        title: incident.title || "",
        description: incident.description,
        transcript: incident.transcript || "",
        personId: incident.personId ? String(incident.personId) : "",
        aliasId: incident.aliasId ? String(incident.aliasId) : "",
        platformId: incident.platformId ? String(incident.platformId) : "",
        attackerName: incident.attackerName || "",
        platform: incident.platform || "",
        eventType: incident.eventType,
        severity: [incident.severity],
        mentalHealthImpact: [incident.mentalHealthImpact],
        status: incident.status,
        confidenceLevel: incident.confidenceLevel,
        lieTopic: incident.lieTopic || "",
        notes: incident.notes || "",
        context: incident.context || "",
      });
    }
  }, [incident]);

  if (!incident) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      id: incidentId,
      incidentDate: form.incidentDate || undefined,
      incidentTime: form.incidentTime || undefined,
      title: form.title || undefined,
      description: form.description || undefined,
      transcript: form.transcript || undefined,
      personId: form.personId ? Number(form.personId) : undefined,
      aliasId: form.aliasId ? Number(form.aliasId) : undefined,
      platformId: form.platformId ? Number(form.platformId) : undefined,
      attackerName: form.attackerName || undefined,
      platform: form.platform || undefined,
      eventType: form.eventType as any,
      severity: form.severity[0],
      mentalHealthImpact: form.mentalHealthImpact[0],
      status: form.status as any,
      confidenceLevel: form.confidenceLevel as any,
      lieTopic: form.lieTopic || undefined,
      notes: form.notes || undefined,
      context: form.context || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Incident #{incidentId}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Basic Info</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.incidentDate} onChange={(e) => setForm({ ...form, incidentDate: e.target.value })} /></div>
                    <div className="space-y-1.5"><Label>Time</Label><Input type="time" value={form.incidentTime} onChange={(e) => setForm({ ...form, incidentTime: e.target.value })} /></div>
                  </div>
                  <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Transcript</Label><Textarea rows={2} value={form.transcript} onChange={(e) => setForm({ ...form, transcript: e.target.value })} /></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Classification</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Event Type</Label>
                    <Select value={form.eventType} onValueChange={(v) => setForm({ ...form, eventType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{EVENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Status</Label>
                      <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Confidence</Label>
                      <Select value={form.confidenceLevel} onValueChange={(v) => setForm({ ...form, confidenceLevel: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{CONFIDENCE_OPTIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Impact Scoring</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><Label>Severity</Label><span>{form.severity[0]}/5</span></div>
                    <Slider value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })} max={5} min={1} step={1} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><Label>Mental Health Impact</Label><span>{form.mentalHealthImpact[0]}/10</span></div>
                    <Slider value={form.mentalHealthImpact} onValueChange={(v) => setForm({ ...form, mentalHealthImpact: v })} max={10} min={1} step={1} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Attribution</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Person</Label>
                    <Select value={form.personId} onValueChange={(v) => setForm({ ...form, personId: v })}>
                      <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent><SelectItem value="">None</SelectItem>{persons?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.displayName}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Alias</Label>
                    <Select value={form.aliasId} onValueChange={(v) => setForm({ ...form, aliasId: v })}>
                      <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent><SelectItem value="">None</SelectItem>{aliases?.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.alias}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Platform</Label>
                    <Select value={form.platformId} onValueChange={(v) => setForm({ ...form, platformId: v })}>
                      <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent><SelectItem value="">None</SelectItem>{platforms?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Attacker Name (legacy)</Label><Input value={form.attackerName} onChange={(e) => setForm({ ...form, attackerName: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Platform Name (legacy)</Label><Input value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} /></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5"><Label>Lie Topic</Label><Input value={form.lieTopic} onChange={(e) => setForm({ ...form, lieTopic: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Context / Notes</Label><Textarea rows={2} value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Private Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex gap-3 pt-4 sticky bottom-0 bg-background p-4 border-t mt-4">
            <Button type="submit" className="flex-1" disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />{updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
