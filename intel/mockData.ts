export const incidentIntel = {
  contradictions: 7,
  narrativeOverlap: 68,
  escalationTrend: "+12%",
  coordinatedActivity: 4,
};

export const signals = [
  { id: 1, label: "Coordinated activity", detail: "3 accounts posted within 41 min", tone: "violet" as const, strength: "high" },
  { id: 2, label: "Spike detected", detail: "Incident volume up 2.4× vs 30-day avg", tone: "amber" as const, strength: "medium" },
  { id: 3, label: "Narrative shift", detail: "Framing moved from dispute → misconduct", tone: "cyan" as const, strength: "medium" },
  { id: 4, label: "Repeat offender", detail: "Same handle in 5 separate threads", tone: "rose" as const, strength: "high" },
  { id: 5, label: "Cross-posting", detail: "Identical phrasing on 2 platforms", tone: "violet" as const, strength: "low" },
];

export const timelineActivity = [
  { date: "May 16", event: "Thread cluster — coordinated replies", count: 8 },
  { date: "May 14", event: "Transcript ingest — custody call", count: 1 },
  { date: "May 11", event: "Narrative overlap spike (+18%)", count: 3 },
  { date: "May 9", event: "Contradiction flagged — timeline vs post", count: 2 },
  { date: "May 6", event: "Receipt added — screenshot archive", count: 4 },
];

export const transcriptAnalysis = [
  {
    title: "Custody call — Mar 12",
    summary: "Speaker A claims no prior contact; receipts show 3 messages the week before.",
    contradictions: 2,
  },
  {
    title: "Group chat excerpt — Apr 2",
    summary: "Agreement described as mutual; later messages reference one-sided pressure.",
    contradictions: 3,
  },
  {
    title: "Voicemail transcript — Apr 18",
    summary: "Tone characterized as neutral; word-level sentiment analysis reads elevated.",
    contradictions: 1,
  },
];

export const patternMonitoring = {
  recurringThemes: ["Credibility attack", "Parenting narrative", "Third-party amplification"],
  overlapScore: 72,
  escalationIndex: 1.34,
  contradictionClusters: [
    { label: "Timeline vs public posts", count: 4 },
    { label: "Statement vs receipt metadata", count: 2 },
    { label: "Witness accounts diverge", count: 1 },
  ],
};

export const datasets = [
  { name: "Incident corpus", records: 142, updated: "2h ago", status: "synced" },
  { name: "Transcript archive", records: 38, updated: "1d ago", status: "synced" },
  { name: "Receipt index", records: 89, updated: "4h ago", status: "synced" },
  { name: "Narrative fingerprints", records: 56, updated: "6h ago", status: "processing" },
];

export const receiptsVault = [
  { name: "screenshot-thread-may16.png", type: "image", date: "May 16, 2026", linked: 2 },
  { name: "custody-call-transcript.pdf", type: "document", date: "May 14, 2026", linked: 1 },
  { name: "dm-export-apr02.txt", type: "transcript", date: "May 11, 2026", linked: 3 },
  { name: "platform-notice-redacted.pdf", type: "document", date: "May 6, 2026", linked: 1 },
];
