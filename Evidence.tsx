import { trpc } from "./providers/trpc";
import { AppLayout } from "./components/AppLayout";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import { Card, CardContent } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink, Pencil, Loader2, Upload, Link2, FileText, X } from "lucide-react";
import { EditDialog } from "./components/EditDialog";
import { FloatingActionButton } from "./components/FloatingActionButton";
import { EvidencePreview } from "./components/EvidencePreview";

const EVIDENCE_TYPES = [
  { value: "screenshot", label: "Screenshot" }, { value: "video_clip", label: "Video Clip" },
  { value: "full_video", label: "Full Video" }, { value: "audio_recording", label: "Audio Recording" },
  { value: "transcript", label: "Transcript" }, { value: "chat_log", label: "Chat Log" },
  { value: "court_document", label: "Court Document" }, { value: "social_media_post", label: "Social Media Post" },
];

const CONFIDENCE_COLORS: Record<string, string> = {
  confirmed: "bg-green-100 text-green-800", strong_evidence: "bg-blue-100 text-blue-800",
  moderate_evidence: "bg-yellow-100 text-yellow-800", unverified: "bg-gray-100 text-gray-800", disputed: "bg-red-100 text-red-800",
};

const ALLOWED_TYPES = ".pdf,.png,.jpg,.jpeg,.webp";
const MAX_SIZE_MB = 10;

export default function Evidence() {
  const { data: files, isLoading } = trpc.evidence.list.useQuery({});
  const { data: persons } = trpc.persons.list.useQuery();
  const utils = trpc.useUtils();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("selected");

  const [showForm, setShowForm] = useState(false);
  const [editEvidence, setEditEvidence] = useState<{ id: number; fileName: string; fileUrl: string; evidenceType: string; description: string; confidence: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-open selected evidence from URL
  useEffect(() => {
    if (selectedId && files) {
      const id = Number(selectedId);
      const match = files.find((f) => f.id === id);
      if (match) {
        setEditEvidence({ id: match.id, fileName: match.fileName, fileUrl: match.fileUrl || "", evidenceType: match.evidenceType, description: match.description || "", confidence: match.confidence });
        setTimeout(() => {
          const el = document.getElementById(`evidence-card-${id}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 200);
      }
    }
  }, [selectedId, files]);

  // Form state
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [uploadedFile, setUploadedFile] = useState<{ fileName: string; filePath: string; size: number } | null>(null);
  const [form, setForm] = useState({
    fileName: "", fileUrl: "", evidenceType: "screenshot" as string, personId: "",
    capturedBy: "", captureDate: "", originalPlatform: "", description: "", confidence: "unverified" as string,
  });
  const [uploading, setUploading] = useState(false);

  const createMutation = trpc.evidence.create.useMutation({
    onSuccess: () => {
      toast.success("Evidence added");
      setShowForm(false);
      resetForm();
      utils.evidence.list.invalidate();
      utils.evidence.stats.invalidate();
    },
    onError: (err) => toast.error("Failed: " + err.message),
  });

  const deleteMutation = trpc.evidence.delete.useMutation({
    onSuccess: () => { toast.success("Deleted"); utils.evidence.list.invalidate(); utils.evidence.stats.invalidate(); },
    onError: (err) => toast.error("Delete failed: " + err.message),
  });

  const updateMutation = trpc.evidence.update.useMutation({
    onSuccess: () => { toast.success("Evidence updated"); utils.evidence.list.invalidate(); utils.evidence.stats.invalidate(); setEditEvidence(null); },
    onError: (err) => toast.error("Update failed: " + err.message),
  });

  const resetForm = () => {
    setTab("upload");
    setUploadedFile(null);
    setForm({ fileName: "", fileUrl: "", evidenceType: "screenshot", personId: "", capturedBy: "", captureDate: "", originalPlatform: "", description: "", confidence: "unverified" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle file selection and immediate upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const allowedExts = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedExts.includes(ext)) {
      toast.error(`File type not allowed: ${ext}. Use: PDF, PNG, JPG, JPEG, WEBP`);
      e.target.value = "";
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: ${MAX_SIZE_MB}MB`);
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: data });
      const result = await res.json();

      if (!res.ok || result.error) {
        throw new Error(result.error || "Upload failed");
      }

      setUploadedFile({ fileName: result.fileName, filePath: result.filePath, size: result.size });
      setForm((prev) => ({ ...prev, fileName: result.fileName }));
      toast.success(`Uploaded: ${result.fileName}`);
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "upload" && !uploadedFile) { toast.error("Please select and upload a file first"); return; }
    if (tab === "url" && !form.fileUrl.trim()) { toast.error("URL is required"); return; }
    if (!form.fileName.trim() && tab === "url") { toast.error("File name is required"); return; }

    createMutation.mutate({
      fileName: form.fileName.trim() || uploadedFile?.fileName || "Untitled",
      fileUrl: tab === "url" ? form.fileUrl.trim() : undefined,
      filePath: tab === "upload" ? uploadedFile?.filePath : undefined,
      storageType: tab === "upload" ? "upload" : "url",
      evidenceType: form.evidenceType as any,
      personId: form.personId ? Number(form.personId) : undefined,
      capturedBy: form.capturedBy || undefined,
      captureDate: form.captureDate || undefined,
      originalPlatform: form.originalPlatform || undefined,
      description: form.description || undefined,
      confidence: form.confidence as any,
    });
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Evidence Vault</h1>
            <p className="text-sm text-muted-foreground mt-1">Upload files or paste links</p>
          </div>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(!showForm); }}><Plus className="h-4 w-4 mr-1" />Add Evidence</Button>
        </div>

        {showForm && (
          <Card>
            <CardContent className="p-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Upload vs URL tabs */}
                <Tabs value={tab} onValueChange={(v) => setTab(v as "upload" | "url")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload"><Upload className="h-3.5 w-3.5 mr-1.5" />Upload File</TabsTrigger>
                    <TabsTrigger value="url"><Link2 className="h-3.5 w-3.5 mr-1.5" />Paste URL</TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="space-y-3 mt-3">
                    {/* File dropzone / picker */}
                    {!uploadedFile ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                      >
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm font-medium">Tap to select a file</p>
                        <p className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG, JPEG, WEBP — max {MAX_SIZE_MB}MB</p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept={ALLOWED_TYPES}
                          className="hidden"
                          onChange={handleFileSelect}
                          disabled={uploading}
                        />
                        {uploading && (
                          <div className="flex items-center justify-center gap-2 mt-3">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-xs">Uploading...</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                        <FileText className="h-5 w-5 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{uploadedFile.fileName}</p>
                          <p className="text-xs text-muted-foreground">{(uploadedFile.size / 1024).toFixed(0)} KB — Uploaded</p>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { setUploadedFile(null); setForm((p) => ({ ...p, fileName: "" })); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="url" className="space-y-3 mt-3">
                    <div className="space-y-1.5">
                      <Label>File Name *</Label>
                      <Input placeholder="e.g. Screenshot_01.png" value={form.fileName} onChange={(e) => setForm({ ...form, fileName: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>URL / Link *</Label>
                      <Input placeholder="https://..." value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} />
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Common fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Type</Label>
                    <Select value={form.evidenceType} onValueChange={(v) => setForm({ ...form, evidenceType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{EVIDENCE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Person</Label>
                    <Select value={form.personId} onValueChange={(v) => setForm({ ...form, personId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>{persons?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.displayName}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Captured By</Label><Input value={form.capturedBy} onChange={(e) => setForm({ ...form, capturedBy: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Capture Date</Label><Input type="date" value={form.captureDate} onChange={(e) => setForm({ ...form, captureDate: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Original Platform</Label><Input placeholder="e.g. Twitter" value={form.originalPlatform} onChange={(e) => setForm({ ...form, originalPlatform: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Confidence</Label>
                    <Select value={form.confidence} onValueChange={(v) => setForm({ ...form, confidence: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="strong_evidence">Strong</SelectItem>
                        <SelectItem value="moderate_evidence">Moderate</SelectItem>
                        <SelectItem value="unverified">Unverified</SelectItem>
                        <SelectItem value="disputed">Disputed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5"><Label>Description</Label><Textarea placeholder="Description..." rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button type="submit" size="sm" disabled={createMutation.isPending || uploading}>
                    {createMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    {createMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Evidence list */}
        {isLoading ? <div className="text-sm text-muted-foreground">Loading...</div> : files?.length === 0 ? (
          <Card><CardContent className="py-10 text-center"><p className="text-muted-foreground text-sm">No evidence yet</p></CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {files?.map((f) => (
              <Card key={f.id} id={`evidence-card-${f.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <EvidencePreview
                        item={{ id: f.id, fileName: f.fileName, fileUrl: f.fileUrl, filePath: f.filePath, storageType: f.storageType, evidenceType: f.evidenceType, description: f.description }}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm truncate">{f.fileName}</span>
                          {f.storageType === "upload" && <Badge variant="secondary" className="text-[10px]">Uploaded</Badge>}
                          <Badge variant="outline" className="text-xs">{f.evidenceType.replace("_", " ")}</Badge>
                          <Badge className={`text-xs ${CONFIDENCE_COLORS[f.confidence]}`}>{f.confidence}</Badge>
                        </div>
                        {f.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{f.description}</p>}
                        {f.originalPlatform && <p className="text-xs text-muted-foreground">Platform: {f.originalPlatform}</p>}
                        {f.captureDate && <p className="text-xs text-muted-foreground">Captured: {new Date(f.captureDate).toLocaleDateString()}</p>}
                        {/* Link to view/download */}
                        {f.storageType === "upload" && f.filePath ? (
                          <a href={f.filePath} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                            <ExternalLink className="h-3 w-3" />Open File
                          </a>
                        ) : f.fileUrl ? (
                          <a href={f.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                            <ExternalLink className="h-3 w-3" />Open Link
                          </a>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditEvidence({ id: f.id, fileName: f.fileName, fileUrl: f.fileUrl || "", evidenceType: f.evidenceType, description: f.description || "", confidence: f.confidence })}>
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { if (confirm("Delete?")) deleteMutation.mutate({ id: f.id }); }}>
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
          open={editEvidence !== null}
          onClose={() => {
            setEditEvidence(null);
            if (searchParams.has("selected")) {
              const newParams = new URLSearchParams(searchParams);
              newParams.delete("selected");
              setSearchParams(newParams, { replace: true });
            }
          }}
          title="Edit Evidence"
          fields={[
            { name: "fileName", label: "File Name", type: "text" },
            { name: "fileUrl", label: "URL / Link", type: "text" },
            { name: "evidenceType", label: "Type", type: "select", options: EVIDENCE_TYPES },
            { name: "confidence", label: "Confidence", type: "select", options: [
              { value: "confirmed", label: "Confirmed" }, { value: "strong_evidence", label: "Strong" },
              { value: "moderate_evidence", label: "Moderate" }, { value: "unverified", label: "Unverified" }, { value: "disputed", label: "Disputed" },
            ]},
            { name: "description", label: "Description", type: "textarea" },
          ]}
          values={editEvidence ? { fileName: editEvidence.fileName, fileUrl: editEvidence.fileUrl, evidenceType: editEvidence.evidenceType, confidence: editEvidence.confidence, description: editEvidence.description } : {}}
          onSave={(vals) => editEvidence && updateMutation.mutate({ id: editEvidence.id, fileName: vals.fileName, fileUrl: vals.fileUrl, evidenceType: vals.evidenceType as any, confidence: vals.confidence as any, description: vals.description })}
          isPending={updateMutation.isPending}
        />

        <FloatingActionButton onClick={() => { resetForm(); setShowForm(true); }} label="Add evidence" />
      </div>
    </AppLayout>
  );
}
