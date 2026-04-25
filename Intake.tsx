import { useState, useRef, useCallback } from "react";
import { trpc } from "../providers/trpc";
import { AppLayout } from "./components/AppLayout";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./components/ui/dialog";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Badge } from "./components/ui/badge";
import { Separator } from "./components/ui/separator";
import { toast } from "sonner";
import {
  Upload, FileText, Trash2, Link2, Plus, Loader2,
  CheckCircle, XCircle, AlertTriangle, Eye, ChevronDown, ChevronUp,
  StickyNote, FileCheck
} from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  reviewed: "Reviewed",
  converted: "Converted",
  discarded: "Discarded",
};

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

export default function Intake() {
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [reviewFilter, setReviewFilter] = useState<string>("pending");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [transcriptText, setTranscriptText] = useState("");
  const [transcriptTitle, setTranscriptTitle] = useState("");
  const [pasting, setPasting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Review item detail
  const [detailItem, setDetailItem] = useState<number | null>(null);
  const [expandedText, setExpandedText] = useState<Record<number, boolean>>({});

  // Draft incident modal
  const [draftOpen, setDraftOpen] = useState(false);
  const [selectedIntakeIds, setSelectedIntakeIds] = useState<number[]>([]);
  const [draftForm, setDraftForm] = useState({
    title: "", description: "", incidentDate: "", eventType: "harassment",
    attackerName: "", platform: "", severity: 1, mentalHealthImpact: 1,
    confidenceLevel: "unverified", transcript: "", personId: "", tagIds: [] as number[],
  });

  // Link to existing incident
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkItemId, setLinkItemId] = useState<number | null>(null);
  const [linkIncidentId, setLinkIncidentId] = useState("");

  // tRPC queries/mutations
  const { data: items, isLoading } = trpc.intake.list.useQuery(
    reviewFilter === "all" ? undefined : { status: reviewFilter }
  );
  const { data: stats } = trpc.intake.stats.useQuery();
  const { data: persons } = trpc.persons.list.useQuery();
  const { data: incidents } = trpc.incidents.list.useQuery({});
  const { data: itemDetail } = trpc.intake.getById.useQuery(
    { id: detailItem! }, { enabled: !!detailItem }
  );

  const discardMutation = trpc.intake.discard.useMutation({
    onSuccess: () => { toast.success("Discarded"); utils.intake.list.invalidate(); utils.intake.stats.invalidate(); },
  });
  const restoreMutation = trpc.intake.restore.useMutation({
    onSuccess: () => { toast.success("Restored"); utils.intake.list.invalidate(); utils.intake.stats.invalidate(); },
  });
  const convertMutation = trpc.intake.convertToEvidence.useMutation({
    onSuccess: () => { toast.success("Saved as evidence"); utils.intake.list.invalidate(); utils.intake.stats.invalidate(); utils.evidence.list.invalidate(); setDetailItem(null); },
  });
  const linkMutation = trpc.intake.linkToIncident.useMutation({
    onSuccess: () => { toast.success("Linked to incident"); utils.intake.list.invalidate(); utils.intake.stats.invalidate(); setLinkOpen(false); setLinkItemId(null); },
  });
  const draftMutation = trpc.intake.createIncidentDraft.useMutation({
    onSuccess: () => {
      toast.success("Incident draft created");
      utils.intake.list.invalidate(); utils.intake.stats.invalidate(); utils.incidents.list.invalidate();
      setDraftOpen(false); setSelectedIntakeIds([]); setDraftForm({
        title: "", description: "", incidentDate: "", eventType: "harassment",
        attackerName: "", platform: "", severity: 1, mentalHealthImpact: 1,
        confidenceLevel: "unverified", transcript: "", personId: "", tagIds: [],
      });
    },
  });

  // ── Bulk file upload ──────────────────────────────────────────
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const res = await fetch("/api/intake/bulk", { method: "POST", body: formData });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Upload failed");
      }

      if (result.duplicates > 0) {
        toast.warning(`${result.duplicates} duplicate(s) skipped`);
      }
      if (result.errors > 0) {
        toast.error(`${result.errors} file(s) failed`);
      }

      toast.success(`${result.uploaded} file(s) uploaded to intake queue`);
      utils.intake.list.invalidate();
      utils.intake.stats.invalidate();
      setActiveTab("review");
      setReviewFilter("pending");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [utils]);

  // ── Paste transcript ──────────────────────────────────────────
  const handlePasteTranscript = async () => {
    if (!transcriptText.trim()) { toast.error("Enter transcript text"); return; }
    setPasting(true);
    try {
      const res = await fetch("/api/intake/paste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcriptText, title: transcriptTitle || "Pasted Transcript" }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success("Transcript added to intake queue");
      setTranscriptText("");
      setTranscriptTitle("");
      utils.intake.list.invalidate();
      utils.intake.stats.invalidate();
      setActiveTab("review");
    } catch (err: any) {
      toast.error("Failed: " + err.message);
    } finally {
      setPasting(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────
  const checkImage = (mime: string | null) => mime?.startsWith("image/") ?? false;
  const checkPdf = (mime: string | null) => mime === "application/pdf";

  const toggleSelect = (id: number) => {
    setSelectedIntakeIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const openDraft = (ids?: number[]) => {
    if (ids && ids.length > 0) {
      setSelectedIntakeIds(ids);
    }
    // Pre-fill from selected items
    const selected = items?.filter(i => selectedIntakeIds.includes(i.id)) || [];
    const texts = selected.map(s => s.transcriptText || s.extractedText).filter(Boolean);
    if (texts.length > 0) {
      setDraftForm(prev => ({ ...prev, transcript: texts.join("\n\n---\n\n").substring(0, 5000) }));
    }
    setDraftOpen(true);
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header with stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Intake Queue</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Bulk upload, review, and route evidence
            </p>
          </div>
          {stats && (
            <div className="flex items-center gap-3 text-xs">
              <Badge variant="secondary" className="gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" />{stats.pending} pending</Badge>
              <Badge variant="secondary" className="gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" />{stats.reviewed} reviewed</Badge>
              <Badge variant="secondary" className="gap-1"><span className="w-2 h-2 rounded-full bg-green-400" />{stats.converted} done</Badge>
            </div>
          )}
        </div>

        {/* Upload / Paste tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload"><Upload className="h-3.5 w-3.5 mr-1.5" />Upload</TabsTrigger>
            <TabsTrigger value="review"><Eye className="h-3.5 w-3.5 mr-1.5" />Review Queue ({stats?.pending || 0})</TabsTrigger>
          </TabsList>

          {/* UPLOAD TAB */}
          <TabsContent value="upload" className="space-y-4">
            {/* File upload */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <h3 className="font-semibold text-sm">Bulk File Upload</h3>
                  <p className="text-xs text-muted-foreground">Upload multiple screenshots, PDFs, and transcript files at once</p>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">Tap to select files</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, PNG, JPG, JPEG, WEBP, TXT, CSV — max 10MB each
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={uploading}
                  />
                </div>

                {uploading && uploadProgress && (
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <div className="flex-1">
                      <p className="text-xs font-medium">Uploading {uploadProgress.current} of {uploadProgress.total}...</p>
                    </div>
                  </div>
                )}

                {/* Upload results note */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>After upload, files go to the <strong>Review Queue</strong> where you can:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-1">
                    <li>Keep as standalone evidence</li>
                    <li>Attach to an existing incident</li>
                    <li>Create a new incident draft</li>
                    <li>Assign person, platform, and tags</li>
                  </ul>
                  <p className="mt-2"><AlertTriangle className="h-3 w-3 inline mr-1" />Duplicates are detected and skipped automatically.</p>
                </div>
              </CardContent>
            </Card>

            {/* Transcript paste */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <h3 className="font-semibold text-sm">Paste Transcript</h3>
                  <p className="text-xs text-muted-foreground">Paste YouTube transcript text or any transcript content</p>
                </div>

                <div className="space-y-2">
                  <Input
                    placeholder="Title (optional) — e.g. YouTube Live Transcript 2025-03-15"
                    value={transcriptTitle}
                    onChange={(e) => setTranscriptTitle(e.target.value)}
                  />
                  <Textarea
                    placeholder="Paste transcript text here..."
                    rows={8}
                    value={transcriptText}
                    onChange={(e) => setTranscriptText(e.target.value)}
                    className="font-mono text-xs"
                  />
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handlePasteTranscript} disabled={pasting || !transcriptText.trim()}>
                      {pasting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      <StickyNote className="h-3.5 w-3.5 mr-1" />
                      {pasting ? "Adding..." : "Add to Intake Queue"}
                    </Button>
                    {transcriptText.length > 0 && (
                      <span className="text-xs text-muted-foreground">{transcriptText.length} chars</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* REVIEW QUEUE TAB */}
          <TabsContent value="review" className="space-y-4">
            {/* Filter tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <Tabs value={reviewFilter} onValueChange={setReviewFilter} className="w-full">
                <TabsList className="grid grid-cols-5">
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
                  <TabsTrigger value="converted">Converted</TabsTrigger>
                  <TabsTrigger value="discarded">Discarded</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Batch actions */}
            {selectedIntakeIds.length > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-3 flex items-center justify-between">
                  <span className="text-sm font-medium">{selectedIntakeIds.length} selected</span>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => openDraft()}><Plus className="h-3 w-3 mr-1" />Create Draft Incident</Button>
                    <Button size="sm" variant="outline" onClick={() => setSelectedIntakeIds([])}>Clear</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Items list */}
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : items?.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <InboxIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No items in this queue</p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => setActiveTab("upload")}>
                    Upload Files
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {items?.map((item) => (
                  <IntakeCard
                    key={item.id}
                    item={item}
                    isSelected={selectedIntakeIds.includes(item.id)}
                    onToggleSelect={() => toggleSelect(item.id)}
                    onView={() => setDetailItem(item.id)}
                    onDiscard={() => discardMutation.mutate({ id: item.id })}
                    onRestore={() => restoreMutation.mutate({ id: item.id })}
                    onLink={() => { setLinkItemId(item.id); setLinkOpen(true); }}
                    isImageFn={checkImage}
                    isPdfFn={checkPdf}
                    expandedText={expandedText[item.id] || false}
                    onToggleText={() => setExpandedText(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Detail / Review Modal */}
        <Dialog open={!!detailItem} onOpenChange={(v) => !v && setDetailItem(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {itemDetail && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-sm">{itemDetail.originalFilename}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Preview */}
                  {checkImage(itemDetail.mimeType) && itemDetail.filePath ? (
                    <img src={itemDetail.filePath} alt="" className="max-h-64 rounded-lg border mx-auto" />
                  ) : checkPdf(itemDetail.mimeType) ? (
                    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                      <FileText className="h-8 w-8 text-red-500" />
                      <div>
                        <p className="font-medium text-sm">PDF Document</p>
                        {!itemDetail.extractedText && (
                          <p className="text-xs text-muted-foreground">Scanned/image PDF — no selectable text</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg">
                      <FileText className="h-8 w-8 text-primary" />
                      <p className="text-sm font-medium">Text File</p>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline">{itemDetail.mimeType || "unknown"}</Badge>
                    <Badge variant="outline">{(itemDetail.fileSize / 1024).toFixed(0)} KB</Badge>
                    <Badge variant="outline">{STATUS_LABELS[itemDetail.status]}</Badge>
                    <Badge variant="outline">{itemDetail.sourceType}</Badge>
                  </div>

                  {/* Extracted text / Transcript */}
                  {(itemDetail.extractedText || itemDetail.transcriptText) && (
                    <div className="space-y-2">
                      <Label className="text-xs">
                        {itemDetail.transcriptText ? "Transcript" : "Extracted Text"}
                        <span className="text-muted-foreground ml-1">
                          ({(itemDetail.extractedText || itemDetail.transcriptText || "").length} chars)
                        </span>
                      </Label>
                      <div className="bg-secondary/30 rounded-lg p-3 max-h-64 overflow-y-auto">
                        <pre className="text-xs font-mono whitespace-pre-wrap break-words text-muted-foreground">
                          {itemDetail.transcriptText || itemDetail.extractedText}
                        </pre>
                      </div>
                    </div>
                  )}

                  {!itemDetail.extractedText && !itemDetail.transcriptText && checkPdf(itemDetail.mimeType) && (
                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950 p-3 rounded-lg">
                      <AlertTriangle className="h-4 w-4" />
                      <span>This PDF contains no selectable text — it may be a scanned image. No text extraction was possible.</span>
                    </div>
                  )}

                  {/* Actions */}
                  <Separator />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => {
                      convertMutation.mutate({
                        id: itemDetail.id,
                        fileName: itemDetail.originalFilename,
                        evidenceType: itemDetail.evidenceType || "screenshot",
                        description: itemDetail.description || undefined,
                      });
                    }}>
                      <FileCheck className="h-3.5 w-3.5 mr-1" />Keep as Evidence
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setDetailItem(null); setLinkItemId(itemDetail.id); setLinkOpen(true); }}>
                      <Link2 className="h-3.5 w-3.5 mr-1" />Link to Incident
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setDetailItem(null); openDraft([itemDetail.id]); }}>
                      <Plus className="h-3.5 w-3.5 mr-1" />Create Draft
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => { discardMutation.mutate({ id: itemDetail.id }); setDetailItem(null); }}>
                      <Trash2 className="h-3.5 w-3.5 mr-1" />Discard
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Link to Incident Modal */}
        <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Link to Existing Incident</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Label>Select Incident</Label>
              <Select value={linkIncidentId} onValueChange={setLinkIncidentId}>
                <SelectTrigger><SelectValue placeholder="Choose an incident..." /></SelectTrigger>
                <SelectContent>
                  {incidents?.map((inc) => (
                    <SelectItem key={inc.id} value={String(inc.id)}>
                      #{inc.id} {inc.title || ""} ({new Date(inc.incidentDate).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setLinkOpen(false)}>Cancel</Button>
                <Button size="sm" disabled={!linkIncidentId || !linkItemId} onClick={() => {
                  if (linkItemId && linkIncidentId) linkMutation.mutate({ id: linkItemId, incidentId: Number(linkIncidentId) });
                }}>
                  <Link2 className="h-3.5 w-3.5 mr-1" />Link
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Draft Incident Modal */}
        <Dialog open={draftOpen} onOpenChange={setDraftOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Incident from Intake ({selectedIntakeIds.length} items)</DialogTitle></DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Title *</Label><Input value={draftForm.title} onChange={e => setDraftForm(p => ({ ...p, title: e.target.value }))} placeholder="Incident title" /></div>
                <div className="space-y-1"><Label>Date *</Label><Input type="date" value={draftForm.incidentDate} onChange={e => setDraftForm(p => ({ ...p, incidentDate: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Type</Label>
                  <Select value={draftForm.eventType} onValueChange={v => setDraftForm(p => ({ ...p, eventType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Person</Label>
                  <Select value={draftForm.personId} onValueChange={v => setDraftForm(p => ({ ...p, personId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>{persons?.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.displayName}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Attacker/Alias</Label><Input value={draftForm.attackerName} onChange={e => setDraftForm(p => ({ ...p, attackerName: e.target.value }))} placeholder="@username or name" /></div>
                <div className="space-y-1"><Label>Platform</Label><Input value={draftForm.platform} onChange={e => setDraftForm(p => ({ ...p, platform: e.target.value }))} placeholder="e.g. Twitter" /></div>
              </div>
              <div className="space-y-1"><Label>Description *</Label><Textarea rows={3} value={draftForm.description} onChange={e => setDraftForm(p => ({ ...p, description: e.target.value }))} placeholder="What happened..." /></div>
              {draftForm.transcript && (
                <div className="space-y-1">
                  <Label>Transcript (from intake items)</Label>
                  <div className="bg-secondary/30 rounded p-3 max-h-40 overflow-y-auto">
                    <pre className="text-xs font-mono whitespace-pre-wrap">{draftForm.transcript}</pre>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => setDraftOpen(false)}>Cancel</Button>
                <Button size="sm" disabled={!draftForm.title || !draftForm.description || !draftForm.incidentDate || draftMutation.isPending}
                  onClick={() => draftMutation.mutate({
                    intakeIds: selectedIntakeIds,
                    title: draftForm.title,
                    description: draftForm.description,
                    incidentDate: draftForm.incidentDate,
                    eventType: draftForm.eventType,
                    attackerName: draftForm.attackerName || undefined,
                    platform: draftForm.platform || undefined,
                    severity: draftForm.severity,
                    mentalHealthImpact: draftForm.mentalHealthImpact,
                    confidenceLevel: draftForm.confidenceLevel,
                    transcript: draftForm.transcript || undefined,
                    personId: draftForm.personId ? Number(draftForm.personId) : undefined,
                    tagIds: draftForm.tagIds.length > 0 ? draftForm.tagIds : undefined,
                  })}>
                  {draftMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  Create Incident
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

// ── Intake Card Component ───────────────────────────────────────
function IntakeCard({
  item,
  isSelected,
  onToggleSelect,
  onView,
  onDiscard,
  onRestore,
  onLink,
  isImageFn,
  isPdfFn,
  expandedText,
  onToggleText,
}: {
  item: any;
  isSelected: boolean;
  onToggleSelect: () => void;
  onView: () => void;
  onDiscard: () => void;
  onRestore: () => void;
  onLink: () => void;
  isImageFn: (mime: string | null) => boolean;
  isPdfFn: (mime: string | null) => boolean;
  expandedText: boolean;
  onToggleText: () => void;
}) {
  const hasText = item.extractedText || item.transcriptText;
  const textPreview = hasText ? (hasText as string).substring(0, 200) : "";
  const isDiscarded = item.status === "discarded";
  const isConverted = item.status === "converted";

  return (
    <Card className={`${isSelected ? "ring-2 ring-primary" : ""} ${isDiscarded ? "opacity-60" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox for batch select */}
          {!isConverted && !isDiscarded && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              className="mt-1 h-4 w-4 shrink-0"
            />
          )}
          {(isConverted || isDiscarded) && <div className="w-4 shrink-0" />}

          {/* Thumbnail / icon */}
          <button onClick={onView} className="shrink-0">
            {isImageFn(item.mimeType) ? (
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary">
                <img src={item.filePath} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ) : isPdfFn(item.mimeType) ? (
              <div className="w-16 h-16 rounded-lg bg-red-50 dark:bg-red-950 flex items-center justify-center">
                <FileText className="h-8 w-8 text-red-500" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center">
                <FileText className="h-8 w-8 text-primary" />
              </div>
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={onView} className="text-left">
                <span className="font-medium text-sm truncate">{item.originalFilename}</span>
              </button>
              <Badge variant="outline" className="text-[10px]">
                {(item.mimeType || "").split("/").pop()?.toUpperCase()}
              </Badge>
              <Badge className="text-[10px]" variant={item.status === "pending" ? "secondary" : item.status === "converted" ? "default" : "outline"}>
                {STATUS_LABELS[item.status]}
              </Badge>
              {item.sourceType === "paste" && <Badge variant="outline" className="text-[10px]">Pasted</Badge>}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{(item.fileSize / 1024).toFixed(0)} KB</span>
              {hasText && <span>{(hasText as string).length} chars</span>}
            </div>

            {/* Text preview */}
            {hasText && (
              <div className="mt-2">
                <button onClick={onToggleText} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  {expandedText ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {expandedText ? "Hide" : "Show"} extracted text
                </button>
                {expandedText && (
                  <div className="mt-1 bg-secondary/30 rounded p-2 max-h-40 overflow-y-auto">
                    <pre className="text-xs font-mono whitespace-pre-wrap break-words text-muted-foreground">
                      {hasText as string}
                    </pre>
                  </div>
                )}
                {!expandedText && textPreview.length > 0 && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{textPreview}...</p>
                )}
              </div>
            )}

            {/* Scanned PDF warning */}
            {isPdfFn(item.mimeType) && !hasText && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Scanned/image PDF — no selectable text
              </p>
            )}

            {/* Actions */}
            {!isConverted && !isDiscarded && (
              <div className="flex flex-wrap gap-2 mt-2">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onView}><Eye className="h-3 w-3 mr-1" />Review</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onLink}><Link2 className="h-3 w-3 mr-1" />Link</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500" onClick={onDiscard}><XCircle className="h-3 w-3 mr-1" />Discard</Button>
              </div>
            )}
            {isDiscarded && (
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onRestore}><CheckCircle className="h-3 w-3 mr-1" />Restore</Button>
              </div>
            )}
            {isConverted && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {item.linkedIncidentId ? "Linked to incident" : "Saved as evidence"}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Inbox icon (not in lucide-react default export)
function InboxIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}
