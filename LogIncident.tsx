import { trpc } from ".../providers/trpc";
import { AppLayout } from ".../components/AppLayout";
import { Button } from ".../components/ui/button";
import { Input } from ".../components/ui/input";
import { Label } from ".../components/ui/label";
import { Textarea } from ".../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from ".../components/ui/card";
import { Slider } from ".../components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Save, RotateCcw } from "lucide-react";

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

const SOURCE_TYPES = [
  { value: "screenshot", label: "Screenshot" },
  { value: "video_clip", label: "Video Clip" },
  { value: "full_video", label: "Full Video" },
  { value: "audio_recording", label: "Audio Recording" },
  { value: "transcript", label: "Transcript" },
  { value: "chat_log", label: "Chat Log" },
  { value: "court_document", label: "Court Document" },
  { value: "social_media_post", label: "Social Media Post" },
  { value: "eyewitness", label: "Eyewitness" },
  { value: "third_party", label: "Third Party" },
];

export default function LogIncident() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const { data: persons } = trpc.persons.list.useQuery();
  const { data: aliases } = trpc.aliases.list.useQuery();
  const { data: platforms } = trpc.platforms.list.useQuery();
  const { data: tags } = trpc.tags.list.useQuery();

  const [form, setForm] = useState({
    incidentDate: new Date().toISOString().split("T")[0],
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
    sourceType: "" as string,
    capturedBy: "",
    captureDate: "",
    lieTopic: "",
    notes: "",
    context: "",
    tagIds: [] as number[],
  });

  const createMutation = trpc.incidents.create.useMutation({
    onSuccess: () => {
      toast.success("Incident logged");
      utils.incidents.stats.invalidate();
      utils.incidents.list.invalidate();
      utils.incidents.filterOptions.invalidate();
      navigate("/timeline");
    },
    onError: (err) => toast.error("Error: " + err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      incidentDate: form.incidentDate,
      incidentTime: form.incidentTime || undefined,
      title: form.title || undefined,
      description: form.description,
      transcript: form.transcript || undefined,
      personId: form.personId ? Number(form.personId) : undefined,
      aliasId: form.aliasId ? Number(form.aliasId) : undefined,
      platformId: form.platformId ? Number(form.platformId) : undefined,
      attackerName: form.attackerName || undefined,
      platform: form.platform || undefined,
      eventType: form.eventType as
        "harassment" | "defamation" | "doxxing" | "threat" |
        "narrative_seeding" | "dogpiling" | "coordinated_live" |
        "evidence_leak" | "false_allegation" | "account_creation" | "account_deletion",
      severity: form.severity[0],
      mentalHealthImpact: form.mentalHealthImpact[0],
      status: form.status as "unreviewed" | "logged" | "verified" | "archived" | "included_in_report",
      confidenceLevel: form.confidenceLevel as "confirmed" | "strong_evidence" | "moderate_evidence" | "unverified" | "disputed",
      sourceType: form.sourceType as
        "screenshot" | "video_clip" | "full_video" | "audio_recording" |
        "transcript" | "chat_log" | "court_document" | "social_media_post" | "eyewitness" | "third_party" | undefined,
      capturedBy: form.capturedBy || undefined,
      captureDate: form.captureDate || undefined,
      lieTopic: form.lieTopic || undefined,
      notes: form.notes || undefined,
      context: form.context || undefined,
      tagIds: form.tagIds.length > 0 ? form.tagIds : undefined,
    });
  };

  const toggleTag = (tagId: number) => {
    setForm((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Log Incident</h1>
          <p className="text-sm text-muted-foreground mt-1">Document a new event</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left column */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Basic Info</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>Date *</Label><Input type="date" required value={form.incidentDate} onChange={(e) => setForm({ ...form, incidentDate: e.target.value })} /></div>
                    <div className="space-y-1.5"><Label>Time</Label><Input type="time" value={form.incidentTime} onChange={(e) => setForm({ ...form, incidentTime: e.target.value })} /></div>
                  </div>
                  <div className="space-y-1.5"><Label>Title</Label><Input placeholder="Short title..." value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Description *</Label><Textarea required placeholder="What happened..." rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Transcript</Label><Textarea placeholder="Full transcript if available..." rows={2} value={form.transcript} onChange={(e) => setForm({ ...form, transcript: e.target.value })} /></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Classification</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Event Type *</Label>
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

            {/* Right column */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Attribution</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Person</Label>
                    <Select value={form.personId} onValueChange={(v) => setForm({ ...form, personId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select person..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {persons?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.displayName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Alias / Account</Label>
                    <Select value={form.aliasId} onValueChange={(v) => setForm({ ...form, aliasId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select alias..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {aliases?.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.alias}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Platform</Label>
                    <Select value={form.platformId} onValueChange={(v) => setForm({ ...form, platformId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select platform..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {platforms?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Attacker Name (legacy)</Label><Input placeholder="@handle or name" value={form.attackerName} onChange={(e) => setForm({ ...form, attackerName: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Platform Name (legacy)</Label><Input placeholder="e.g. Twitter" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} /></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Source Tracking</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Source Type</Label>
                    <Select value={form.sourceType} onValueChange={(v) => setForm({ ...form, sourceType: v })}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>{SOURCE_TYPES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>Captured By</Label><Input value={form.capturedBy} onChange={(e) => setForm({ ...form, capturedBy: e.target.value })} /></div>
                    <div className="space-y-1.5"><Label>Capture Date</Label><Input type="date" value={form.captureDate} onChange={(e) => setForm({ ...form, captureDate: e.target.value })} /></div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Tags</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {tags?.map((tag) => (
                      <button key={tag.id} type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          form.tagIds.includes(tag.id)
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}>
                        {tag.name}
                      </button>
                    ))}
                    {(!tags || tags.length === 0) && <p className="text-xs text-muted-foreground">No tags created yet</p>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5"><Label>Lie Topic (if applicable)</Label><Input placeholder="What was the lie about?" value={form.lieTopic} onChange={(e) => setForm({ ...form, lieTopic: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Context / Notes</Label><Textarea placeholder="Additional context..." rows={2} value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Private Notes</Label><Textarea placeholder="Private notes..." rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex gap-3 pt-4 sticky bottom-4 bg-background/80 backdrop-blur p-4 rounded-lg border">
            <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />{createMutation.isPending ? "Saving..." : "Log Incident"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setForm({
              incidentDate: new Date().toISOString().split("T")[0], incidentTime: "", title: "", description: "", transcript: "",
              personId: "", aliasId: "", platformId: "", attackerName: "", platform: "", eventType: "harassment",
              severity: [3], mentalHealthImpact: [5], status: "unreviewed", confidenceLevel: "unverified", sourceType: "",
              capturedBy: "", captureDate: "", lieTopic: "", notes: "", context: "", tagIds: [],
            })}>
              <RotateCcw className="h-4 w-4 mr-2" />Reset
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
