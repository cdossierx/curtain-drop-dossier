import { AppLayout } from "./AppLayout";
import { Panel } from "./intel/Panel";
import { Chip } from "./intel/Chip";
import {
  incidentIntel,
  signals,
  timelineActivity,
  transcriptAnalysis,
  patternMonitoring,
  datasets,
  receiptsVault,
} from "./intel/mockData";
import {
  Activity,
  AlertTriangle,
  Archive,
  BookOpen,
  Database,
  FileText,
  GitBranch,
  Layers,
  MessageSquareQuote,
  Radio,
  Sparkles,
  TrendingUp,
  Waves,
} from "lucide-react";
function Metric({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3">
      <p className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="text-2xl font-semibold text-zinc-50 mt-1 tabular-nums">{value}</p>
      {hint && <p className="text-[11px] text-zinc-500 mt-1">{hint}</p>}
    </div>
  );
}

export default function IntelDashboard() {
  return (
    <AppLayout>
      <div className="intel-page -mx-4 lg:-mx-7 px-4 lg:px-7 pb-10 min-h-[calc(100vh-3.5rem)]">
        {/* Ambient backdrop */}
        <div
          className="pointer-events-none fixed inset-0 lg:left-56 -z-10 opacity-90"
          aria-hidden
        >
          <div className="absolute inset-0 bg-[#070b12]" />
          <div className="absolute top-0 left-1/4 h-[28rem] w-[28rem] rounded-full bg-cyan-500/[0.07] blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 h-[24rem] w-[24rem] rounded-full bg-violet-600/[0.08] blur-[90px]" />
        </div>

        {/* Header */}
        <header className="relative mb-8 pt-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-2">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                </div>
                <Chip tone="cyan">Varity</Chip>
                <Chip tone="neutral">Narrative Intelligence</Chip>
              </div>
              <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-zinc-50">
                Narrative Intelligence
              </h1>
              <p className="text-sm text-zinc-400 mt-1 max-w-xl">
                Organized reality — patterns, contradictions, and narrative structure across your record.
              </p>
            </div>
            <blockquote className="max-w-xs rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl px-5 py-4 text-right">
              <p className="text-sm italic text-zinc-300 font-serif">&ldquo;Truth leaves patterns.&rdquo;</p>
              <footer className="text-[10px] text-zinc-500 mt-2 uppercase tracking-widest">Varity</footer>
            </blockquote>
          </div>
        </header>

        <div className="relative space-y-6">
          {/* Row 1: Incident Intelligence + Signals */}
          <div className="grid gap-6 lg:grid-cols-5">
            <Panel
              title="Incident Intelligence"
              subtitle="Contradictions, overlap, escalation, coordination"
              glow="cyan"
              className="lg:col-span-3"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Metric
                  label="Contradictions"
                  value={incidentIntel.contradictions}
                  hint="Detected across corpus"
                />
                <Metric
                  label="Narrative overlap"
                  value={`${incidentIntel.narrativeOverlap}%`}
                  hint="Shared framing score"
                />
                <Metric
                  label="Escalation trend"
                  value={incidentIntel.escalationTrend}
                  hint="30-day rolling"
                />
                <Metric
                  label="Coordinated activity"
                  value={incidentIntel.coordinatedActivity}
                  hint="Active clusters"
                />
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
                <TrendingUp className="h-3.5 w-3.5 text-cyan-400/80" />
                <span>Escalation index rising — review transcript conflicts from the past 72h.</span>
              </div>
            </Panel>

            <Panel title="Signals" subtitle="Live narrative indicators" glow="violet" className="lg:col-span-2">
              <ul className="space-y-3">
                {signals.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-start gap-3 rounded-xl border border-white/[0.05] bg-black/20 px-3 py-2.5"
                  >
                    <Radio className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-zinc-200">{s.label}</span>
                        <Chip tone={s.tone}>{s.strength}</Chip>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{s.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          {/* Row 2: Timeline + Transcript */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Timeline Activity" subtitle="Recent narrative events" glow="amber">
              <ul className="space-y-2">
                {timelineActivity.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-white/[0.04] px-3 py-2.5 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="w-14 shrink-0 text-[11px] font-medium text-amber-200/90">{item.date}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-zinc-300 truncate">{item.event}</p>
                    </div>
                    <span className="text-[11px] tabular-nums text-zinc-500">{item.count}</span>
                    <Activity className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Transcript Analysis" subtitle="Conflict summaries & contradiction counts" glow="rose">
              <ul className="space-y-3">
                {transcriptAnalysis.map((t, i) => (
                  <li
                    key={i}
                    className="rounded-xl border border-white/[0.05] bg-black/20 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <MessageSquareQuote className="h-4 w-4 text-rose-400/80 shrink-0" />
                        <span className="text-xs font-medium text-zinc-200 truncate">{t.title}</span>
                      </div>
                      <Chip tone="rose">{t.contradictions} contradictions</Chip>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">{t.summary}</p>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          {/* Row 3: Pattern Monitoring */}
          <Panel title="Pattern Monitoring" subtitle="Themes, overlap, escalation, contradiction clusters" glow="violet">
            <div className="grid gap-6 lg:grid-cols-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Recurring themes</p>
                <div className="flex flex-wrap gap-2">
                  {patternMonitoring.recurringThemes.map((theme) => (
                    <Chip key={theme} tone="violet">
                      {theme}
                    </Chip>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Metric label="Overlap score" value={`${patternMonitoring.overlapScore}%`} />
                <Metric label="Escalation index" value={patternMonitoring.escalationIndex} hint="Normalized 0–2" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Contradiction clusters</p>
                <ul className="space-y-2">
                  {patternMonitoring.contradictionClusters.map((c) => (
                    <li
                      key={c.label}
                      className="flex items-center justify-between text-xs text-zinc-400 border-b border-white/[0.04] pb-2 last:border-0"
                    >
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500/70" />
                        {c.label}
                      </span>
                      <span className="tabular-nums text-zinc-300">{c.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Panel>

          {/* Row 4: Datasets + Receipts Vault */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Datasets" subtitle="Corpus sources & sync status" glow="cyan">
              <ul className="space-y-2">
                {datasets.map((d) => (
                  <li
                    key={d.name}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-black/20 px-3 py-3"
                  >
                    <Database className="h-4 w-4 text-cyan-400/80 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-zinc-200">{d.name}</p>
                      <p className="text-[10px] text-zinc-500">{d.records} records · {d.updated}</p>
                    </div>
                    <Chip tone={d.status === "synced" ? "cyan" : "amber"}>{d.status}</Chip>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Receipts Vault" subtitle="Supporting records linked to narrative threads" glow="amber">
              <ul className="space-y-2">
                {receiptsVault.map((r) => (
                  <li
                    key={r.name}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-black/20 px-3 py-3"
                  >
                    <Archive className="h-4 w-4 text-amber-400/80 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-zinc-200 truncate">{r.name}</p>
                      <p className="text-[10px] text-zinc-500 capitalize">
                        {r.type} · {r.date}
                      </p>
                    </div>
                    <span className="text-[10px] text-zinc-500 tabular-nums">{r.linked} linked</span>
                  </li>
                ))}
              </ul>
              <p className="text-[10px] text-zinc-600 mt-3 flex items-center gap-1.5">
                <FileText className="h-3 w-3" />
                Evidence is labeled Receipts on this view — organized for narrative review.
              </p>
            </Panel>
          </div>

          {/* Footer strip — narrative context, not surveillance */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md px-5 py-4 flex flex-wrap items-center gap-4 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-zinc-600" />
              Organized reality
            </span>
            <span className="flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5 text-zinc-600" />
              Pattern-first review
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-zinc-600" />
              Narrative structure over surveillance
            </span>
            <span className="flex items-center gap-1.5 ml-auto">
              <Waves className="h-3.5 w-3.5 text-cyan-500/60" />
              Mock intelligence layer — connect live data when ready
            </span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
