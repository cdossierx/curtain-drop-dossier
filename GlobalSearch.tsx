import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "./providers/trpc";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./ui/command";
import { Search, Loader2, UserCircle, AtSign, AlertTriangle, Shield } from "lucide-react";
import { Button } from "./button";

const EVENT_TYPE_LABELS: Record<string, string> = {
  harassment: "Harassment", defamation: "Defamation", doxxing: "Doxxing", threat: "Threat",
  narrative_seeding: "Narrative Seeding", dogpiling: "Dogpiling", coordinated_live: "Coordinated Live",
  evidence_leak: "Evidence Leak", false_allegation: "False Allegation",
  account_creation: "Acct Created", account_deletion: "Acct Deleted",
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const { data: results, isFetching } = trpc.search.global.useQuery(
    { query: query.trim() },
    { enabled: query.trim().length > 0 }
  );

  const incidents = results?.incidents ?? [];
  const persons = results?.persons ?? [];
  const aliases = results?.aliases ?? [];
  const evidence = results?.evidence ?? [];
  const tags = results?.tags ?? [];

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback((type: string, id: number) => {
    setOpen(false);
    setQuery("");
    switch (type) {
      case "incident": navigate(`/timeline?selected=${id}`); break;
      case "person": navigate(`/persons?selected=${id}`); break;
      case "alias": navigate(`/aliases?selected=${id}`); break;
      case "evidence": navigate(`/evidence?selected=${id}`); break;
      case "tag": navigate(`/tags?selected=${id}`); break;
    }
  }, [navigate]);

  const hasResults = incidents.length > 0 || persons.length > 0 || aliases.length > 0 || evidence.length > 0 || tags.length > 0;

  return (
    <>
      <Button
        variant="outline"
        className="relative h-8 w-full justify-start rounded-md bg-muted/50 text-sm font-normal text-muted-foreground shadow-none hover:bg-accent lg:pr-12 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-3.5 w-3.5" />
        <span className="hidden lg:inline">Search...</span>
        <span className="lg:hidden">Search</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1/2 hidden h-5 -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 lg:flex">
          <span className="text-xs">Ctrl</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search incidents, persons, aliases, evidence, tags..." value={query} onValueChange={setQuery} />
        <CommandList>
          {query.trim().length === 0 && <CommandEmpty>Type to search across all your data.</CommandEmpty>}
          {query.trim().length > 0 && !isFetching && !hasResults && <CommandEmpty>No results found.</CommandEmpty>}
          {isFetching && query.trim().length > 0 && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
            </div>
          )}

          {incidents.length > 0 && (
            <CommandGroup heading={`Incidents (${incidents.length})`}>
              {incidents.map((inc) => (
                <CommandItem key={`inc-${inc.id}`} onSelect={() => handleSelect("incident", inc.id)} className="flex items-start gap-2 py-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{inc.title || `Incident #${inc.id}`}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {EVENT_TYPE_LABELS[inc.eventType] || inc.eventType}
                      {inc.attackerName && ` · ${inc.attackerName}`}
                      {inc.incidentDate && ` · ${new Date(inc.incidentDate).toLocaleDateString()}`}
                    </p>
                    {inc.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{inc.description}</p>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {incidents.length > 0 && <CommandSeparator />}

          {persons.length > 0 && (
            <CommandGroup heading={`Persons (${persons.length})`}>
              {persons.map((p) => (
                <CommandItem key={`per-${p.id}`} onSelect={() => handleSelect("person", p.id)} className="flex items-start gap-2 py-2">
                  <UserCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.displayName || `Person #${p.id}`}</p>
                    {p.firstSeenDate && <p className="text-xs text-muted-foreground">First seen: {new Date(p.firstSeenDate).toLocaleDateString()}</p>}
                    {p.notes && <p className="text-xs text-muted-foreground truncate">{p.notes}</p>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {persons.length > 0 && <CommandSeparator />}

          {aliases.length > 0 && (
            <CommandGroup heading={`Aliases (${aliases.length})`}>
              {aliases.map((a) => (
                <CommandItem key={`alias-${a.id}`} onSelect={() => handleSelect("alias", a.id)} className="flex items-start gap-2 py-2">
                  <AtSign className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{a.alias || `Alias #${a.id}`}</p>
                    {a.suspectedOperator && <p className="text-xs text-muted-foreground">Suspected: {a.suspectedOperator}</p>}
                    <p className="text-xs text-muted-foreground">Confidence: {a.confidence}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {aliases.length > 0 && <CommandSeparator />}

          {evidence.length > 0 && (
            <CommandGroup heading={`Evidence (${evidence.length})`}>
              {evidence.map((ev) => (
                <CommandItem key={`ev-${ev.id}`} onSelect={() => handleSelect("evidence", ev.id)} className="flex items-start gap-2 py-2">
                  {ev.storageType === "upload" && ev.filePath ? (
                    <div className="w-6 h-6 rounded overflow-hidden bg-secondary shrink-0 mt-0.5">
                      <img src={ev.filePath} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : <Shield className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{ev.fileName || `Evidence #${ev.id}`}</p>
                    <p className="text-xs text-muted-foreground">{(ev.evidenceType || "evidence").replace("_", " ")}{ev.storageType === "upload" && " · Uploaded"}</p>
                    {ev.description && <p className="text-xs text-muted-foreground truncate">{ev.description}</p>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {evidence.length > 0 && <CommandSeparator />}

          {tags.length > 0 && (
            <CommandGroup heading={`Tags (${tags.length})`}>
              {tags.map((t) => (
                <CommandItem key={`tag-${t.id}`} onSelect={() => handleSelect("tag", t.id)} className="flex items-center gap-2 py-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.color || "#3b82f6" }} />
                  <span className="text-sm font-medium">{t.name || `Tag #${t.id}`}</span>
                  {t.description && <span className="text-xs text-muted-foreground truncate ml-1">{t.description}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
