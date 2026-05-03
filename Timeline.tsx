import { trpc } from "./src/providers/trpc";
import { AppLayout } from "./AppLayout";
import { Card, CardContent } from "./card";
import { Input } from "./input";
import { Button } from "./button";
import { Badge } from "./badge";
import { Skeleton } from "./skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { Clock, Trash2, ExternalLink, X, Filter, Pencil, Link2, Unlink, FileImage } from "lucide-react";
import { toast } from "sonner";
import { EditIncident } from "./EditIncident";
import { FloatingActionButton } from "./FloatingActionButton";
import { EvidencePreview } from "./EvidencePreview";

const EVENT_TYPE_LABELS: Record<string, string> = {
  harassment: "Harassment", defamation: "Defamation", doxxing: "Doxxing", threat: "Threat",
  narrative_seeding: "Narrative Seeding", dogpiling: "Dogpiling", coordinated_live: "Coordinated Live",
  evidence_leak: "Evidence Leak", false_allegation: "False Allegation",
  account_creation: "Acct Created", account_deletion: "Acct Deleted",
};

const STATUS_COLORS: Record<string, string> = {
  unreviewed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  logged: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  verified: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  archived: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  included_in_report: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

const CONFIDENCE_COLORS: Record<string, string> = {
  confirmed: "bg-green-500", strong_evidence: "bg-blue-500",
  moderate_evidence: "bg-yellow-500", unverified: "bg-gray-400", disputed: "bg-red-500",
};

export default function Timeline() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("selected");

  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [editIncidentId, setEditIncidentId] = useState<number | null>(null);
  const [detailIncident, setDetailIncident] = useState<number | null>(selectedId ? Number(selectedId) : null);

  const { data: incidents, isLoading } = trpc.incidents.list.useQuery(
    {
      eventType: filters.eventType,
      status: filters.status,
      personId: filters.personId ? Number(filters.personId) : undefined,
      tagId: filters.tagId ? Number(filters.tagId) : undefined,
    }
  );
  const { data: filterOptions } = trpc.incidents.filterOptions.useQuery();
  const { data: persons } = trpc.persons.list.useQuery();
  const { data: tags } = trpc.tags.list.useQuery();
  const { data: incidentTagsData } = trpc.tags.forUserIncidents.useQuery();
  const utils = trpc.useUtils();

  // Auto-open selected incident from URL (e.g., from global search)
  useEffect(() => {
    if (selectedId) {
      const id = Number(selectedId);
      if (!isNaN(id)) {
        setDetailIncident(id);
        // Scroll to the incident card
        setTimeout(() => {
          const el = document.getElementById(`incident-card-${id}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
      }
    }
  }, [selectedId]);

  const deleteMutation = trpc.incidents.delete.useMutation({
    onSuccess: () => { toast.success("Deleted"); utils.incidents.list.invalidate(); utils.incidents.stats.invalidate(); },
  });

  // Build tag lookup: incidentId -> tag[]
  const tagsByIncident: Record<number, Array<{ tagId: number; tagName: string; tagColor: string }>> = {};
  incidentTagsData?.forEach((t) => {
    if (!tagsByIncident[t.incidentId]) tagsByIncident[t.incidentId] = [];
    tagsByIncident[t.incidentId].push({ tagId: t.tagId, tagName: t.tagName, tagColor: t.tagColor || "#3b82f6" });
  });

  const filtered = incidents?.filter((inc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (inc.title?.toLowerCase().includes(q) || false) ||
      inc.description.toLowerCase().includes(q) ||
      (inc.transcript?.toLowerCase().includes(q) || false) ||
      (inc.attackerName?.toLowerCase().includes(q) || false) ||
      (inc.context?.toLowerCase().includes(q) || false);
  }) || [];

  const setFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value === "all" ? undefined : value }));
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Timeline</h1>
          <p className="text-sm text-muted-foreground mt-1">Chronological record of all events</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            {searchQuery && <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6" onClick={() => setSearchQuery("")}><X className="h-3 w-3" /></Button>}
          </div>
          <Select value={filters.eventType || "all"} onValueChange={(v) => setFilter("eventType", v)}>
            <SelectTrigger className="w-36"><Filter className="h-3 w-3 mr-1" /><SelectValue placeholder="Event Type" /></SelectTrigger>
            <SelectContent>{["all", ...(filterOptions?.eventTypes || [])].map((t) => <SelectItem key={t} value={t}>{EVENT_TYPE_LABELS[t] || t}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filters.status || "all"} onValueChange={(v) => setFilter("status", v)}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>{["all", "unreviewed", "logged", "verified", "archived", "included_in_report"].map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filters.personId || "all"} onValueChange={(v) => setFilter("personId", v)}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Person" /></SelectTrigger>
            <SelectContent>{[{ id: "all", displayName: "All" }, ...(persons || [])].map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.displayName}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filters.tagId || "all"} onValueChange={(v) => setFilter("tagId", v)}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Tag" /></SelectTrigger>
            <SelectContent>{[{ id: "all", name: "All" }, ...(tags || [])].map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <p className="text-xs text-muted-foreground">{filtered.length} incident{filtered.length !== 1 ? "s" : ""}</p>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-10 text-center"><p className="text-muted-foreground text-sm">No incidents found</p></CardContent></Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((inc) => (
              <Card key={inc.id} id={`incident-card-${inc.id}`} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={STATUS_COLORS[inc.status] || "bg-gray-100"}>{inc.status.replace(/_/g, " ")}</Badge>
                        <Badge variant="outline">{EVENT_TYPE_LABELS[inc.eventType] || inc.eventType}</Badge>
                        {inc.lieTopic && <Badge variant="secondary">{inc.lieTopic}</Badge>}
                        <div className={`w-2 h-2 rounded-full ${CONFIDENCE_COLORS[inc.confidenceLevel] || "bg-gray-400"}`} title={inc.confidenceLevel} />
                      </div>
                      {inc.title && <p className="font-semibold text-sm">{inc.title}</p>}
                      <p className="text-xs text-muted-foreground">
                        {new Date(inc.incidentDate).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                        {inc.incidentTime && ` at ${inc.incidentTime}`}
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">{inc.description}</p>

                      {/* Tags display */}
                      {tagsByIncident[inc.id] && tagsByIncident[inc.id].length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {tagsByIncident[inc.id].map((t) => (
                            <span key={t.tagId} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-white" style={{ backgroundColor: t.tagColor || "#3b82f6" }}>
                              {t.tagName}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {inc.attackerName && <span className="font-medium text-foreground">{inc.attackerName}</span>}
                        {inc.platform && <span>on {inc.platform}</span>}
                        <span>Sev: {inc.severity}/5</span>
                        <span>Impact: {inc.mentalHealthImpact}/10</span>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-center gap-1.5">
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setDetailIncident(inc.id)}>
                        <ExternalLink className="h-3 w-3 mr-1" />View
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setEditIncidentId(inc.id)}>
                        <Pencil className="h-3 w-3 mr-1" />Edit
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 text-red-500 hover:text-red-600" onClick={() => { if (confirm("Delete?")) deleteMutation.mutate({ id: inc.id }); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <EditIncident incidentId={editIncidentId ?? 0} open={editIncidentId !== null} onClose={() => setEditIncidentId(null)} />

        <FloatingActionButton onClick={() => window.location.href = "/log"} label="Log new incident" />

        {/* Detail Dialog with Related Incidents */}
        {detailIncident && (
          <IncidentDetailDialog
            incidentId={detailIncident}
            open={!!detailIncident}
            onClose={() => {
              setDetailIncident(null);
              // Clear the ?selected= param from URL
              if (searchParams.has("selected")) {
                const newParams = new URLSearchParams(searchParams);
                newParams.delete("selected");
                setSearchParams(newParams, { replace: true });
              }
            }}
            tagsByIncident={tagsByIncident}
          />
        )}
      </div>
    </AppLayout>
  );
}

// Detail dialog with related incidents support
function IncidentDetailDialog({
  incidentId, open, onClose, tagsByIncident,
}: {
  incidentId: number; open: boolean; onClose: () => void;
  tagsByIncident: Record<number, Array<{ tagId: number; tagName: string; tagColor: string }>>;
}) {
  const { data: incident } = trpc.incidents.getById.useQuery({ id: incidentId }, { enabled: open });
  const { data: related } = trpc.incidents.getRelated.useQuery({ incidentId }, { enabled: open });
  const { data: allIncidents } = trpc.incidents.list.useQuery({}, { enabled: open });
  const utils = trpc.useUtils();

  const addRelated = trpc.incidents.addRelated.useMutation({
    onSuccess: () => { toast.success("Linked"); utils.incidents.getRelated.invalidate({ incidentId }); },
  });
  const removeRelated = trpc.incidents.removeRelated.useMutation({
    onSuccess: () => { toast.success("Unlinked"); utils.incidents.getRelated.invalidate({ incidentId }); },
  });

  const [linkTargetId, setLinkTargetId] = useState("");

  if (!incident) return null;

  // Filter out current incident and already-linked incidents from the link dropdown
  const linkedIds = new Set(related?.map((r) => r.incident.id) || []);
  const availableIncidents = allIncidents?.filter(
    (i) => i.id !== incidentId && !linkedIds.has(i.id)
  ) || [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Incident #{incident.id}{incident.title && `: ${incident.title}`}</DialogTitle></DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge className={STATUS_COLORS[incident.status] || ""}>{incident.status.replace(/_/g, " ")}</Badge>
            <Badge variant="outline">{EVENT_TYPE_LABELS[incident.eventType] || incident.eventType}</Badge>
            <Badge variant="secondary">{incident.confidenceLevel}</Badge>
          </div>

          {tagsByIncident[incident.id] && tagsByIncident[incident.id].length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tagsByIncident[incident.id].map((t) => (
                <span key={t.tagId} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-white" style={{ backgroundColor: t.tagColor || "#3b82f6" }}>
                  {t.tagName}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-muted-foreground">Date:</span> {new Date(incident.incidentDate).toLocaleDateString()}</div>
            {incident.incidentTime && <div><span className="text-muted-foreground">Time:</span> {incident.incidentTime}</div>}
            {incident.attackerName && <div><span className="text-muted-foreground">Attacker:</span> {incident.attackerName}</div>}
            {incident.platform && <div><span className="text-muted-foreground">Platform:</span> {incident.platform}</div>}
            <div><span className="text-muted-foreground">Severity:</span> {incident.severity}/5</div>
            <div><span className="text-muted-foreground">Impact:</span> {incident.mentalHealthImpact}/10</div>
          </div>

          <div><span className="text-muted-foreground">Description:</span><p className="mt-1">{incident.description}</p></div>
          {incident.transcript && <div><span className="text-muted-foreground">Transcript:</span><p className="mt-1 whitespace-pre-wrap">{incident.transcript}</p></div>}
          {incident.notes && <div><span className="text-muted-foreground">Notes:</span><p className="mt-1">{incident.notes}</p></div>}
          {incident.context && <div><span className="text-muted-foreground">Context:</span><p className="mt-1">{incident.context}</p></div>}

          {/* Linked Evidence */}
          {incident.evidence && incident.evidence.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <FileImage className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Evidence ({incident.evidence.length})</span>
              </div>
              <div className="space-y-3">
                {incident.evidence.map((ev) => (
                  <Card key={ev.id}><CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <EvidencePreview
                        item={{ id: ev.id, fileName: ev.fileName, fileUrl: ev.fileUrl, filePath: ev.filePath, storageType: ev.storageType, evidenceType: ev.evidenceType, description: ev.description }}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{ev.fileName}</p>
                        <Badge variant="outline" className="text-[10px] mt-0.5">{ev.evidenceType.replace("_", " ")}</Badge>
                        {ev.storageType === "upload" && <Badge variant="secondary" className="text-[10px] mt-0.5 ml-1">Uploaded</Badge>}
                        {ev.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ev.description}</p>}
                      </div>
                    </div>
                  </CardContent></Card>
                ))}
              </div>
            </div>
          )}

          {/* Related Incidents */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Related Incidents</span>
            </div>

            {related && related.length > 0 && (
              <div className="space-y-2 mb-4">
                {related.map((r) => (
                  <Card key={r.linkId}><CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium">{r.incident.title || `Incident #${r.incident.id}`}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(r.incident.incidentDate).toLocaleDateString()} — {r.relationshipType || "Related"}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => removeRelated.mutate({ id: r.linkId })}>
                      <Unlink className="h-3 w-3 mr-1" />Unlink
                    </Button>
                  </CardContent></Card>
                ))}
              </div>
            )}

            {/* Link to another incident */}
            {availableIncidents.length > 0 && (
              <div className="flex gap-2">
                <Select value={linkTargetId} onValueChange={setLinkTargetId}>
                  <SelectTrigger className="flex-1 text-xs"><SelectValue placeholder="Link to another incident..." /></SelectTrigger>
                  <SelectContent>
                    {availableIncidents.map((i) => (
                      <SelectItem key={i.id} value={String(i.id)} className="text-xs">
                        #{i.id} {i.title || ""} ({new Date(i.incidentDate).toLocaleDateString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" disabled={!linkTargetId || addRelated.isPending} onClick={() => {
                  if (linkTargetId) addRelated.mutate({ incidentId, relatedIncidentId: Number(linkTargetId) });
                  setLinkTargetId("");
                }}>
                  <Link2 className="h-3 w-3 mr-1" />Link
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
