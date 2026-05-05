import { trpc } from "./providers/trpc";
import { AppLayout } from "./AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Skeleton } from "./skeleton";
import { Download } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#6b7280", "#14b8a6", "#f43f5e", "#8b5cf6"];

const EVENT_LABELS: Record<string, string> = {
  harassment: "Harassment", defamation: "Defamation", doxxing: "Doxxing", threat: "Threat",
  narrative_seeding: "Narrative Seeding", dogpiling: "Dogpiling", coordinated_live: "Coordinated Live",
  evidence_leak: "Evidence Leak", false_allegation: "False Allegation",
  account_creation: "Acct Creation", account_deletion: "Acct Deletion",
};

const STATUS_LABELS: Record<string, string> = {
  unreviewed: "Unreviewed", logged: "Logged", verified: "Verified", archived: "Archived", included_in_report: "In Report",
};

export default function Analytics() {
  const { data: stats, isLoading } = trpc.incidents.stats.useQuery();
  const { data: personStats } = trpc.persons.stats.useQuery();
  const { data: evidenceStats } = trpc.evidence.stats.useQuery();
  const { data: platformStats } = trpc.platforms.stats.useQuery();

  const eventData = stats?.byEventType.map((item) => ({ name: EVENT_LABELS[item.eventType] || item.eventType, value: item.count })) || [];
  const statusData = stats?.byStatus.map((item) => ({ name: STATUS_LABELS[item.status] || item.status, value: item.count })) || [];
  const timelineData = stats?.timeline.map((item) => ({ month: item.month, incidents: item.count, mentalHealth: Math.round(item.avgMentalHealth * 10) / 10 })) || [];
  const platformData = stats?.byPlatform.filter((p): p is { platform: string; count: number } => !!p.platform).map((p) => ({ name: p.platform, value: p.count })) || [];

  // Mental health trend calculation for future use

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Documentary Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">Visuals and data for your documentary</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.print()}><Download className="h-4 w-4 mr-2" />Print / PDF</Button>
        </div>

        {isLoading ? <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80" />)}</div> : stats?.total === 0 ? (
          <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">No data yet. Log incidents to generate visuals.</p></CardContent></Card>
        ) : (
          <>
            {/* Key Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 print:grid-cols-5">
              <Card className="border-l-4 border-l-red-500"><CardContent className="pt-5"><div className="text-2xl font-bold">{stats?.total ?? 0}</div><p className="text-xs text-muted-foreground">Incidents</p></CardContent></Card>
              <Card className="border-l-4 border-l-orange-500"><CardContent className="pt-5"><div className="text-2xl font-bold">{evidenceStats?.total ?? 0}</div><p className="text-xs text-muted-foreground">Evidence</p></CardContent></Card>
              <Card className="border-l-4 border-l-yellow-500"><CardContent className="pt-5"><div className="text-2xl font-bold">{personStats?.total ?? 0}</div><p className="text-xs text-muted-foreground">People</p></CardContent></Card>
              <Card className="border-l-4 border-l-green-500"><CardContent className="pt-5"><div className="text-2xl font-bold">{platformStats?.total ?? 0}</div><p className="text-xs text-muted-foreground">Platforms</p></CardContent></Card>
              <Card className="border-l-4 border-l-blue-500"><CardContent className="pt-5"><div className="text-2xl font-bold">{stats?.avgMentalHealth ?? 0}/10</div><p className="text-xs text-muted-foreground">Avg Impact</p></CardContent></Card>
            </div>

            {/* Primary Chart: Incidents by Person */}
            <Card className="print:break-inside-avoid">
              <CardHeader><CardTitle className="text-base">Top Persons by Incident Count</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={stats?.byPerson.slice(0, 10).map((p) => ({ name: `Person ${p.personId}`, incidents: p.count })) || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="name" type="category" width={80} /><Tooltip />
                    <Bar dataKey="incidents" fill="#ef4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="print:break-inside-avoid">
                <CardHeader><CardTitle className="text-base">By Event Type</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={eventData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {eventData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="print:break-inside-avoid">
                <CardHeader><CardTitle className="text-base">By Status</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Timeline */}
            <Card className="print:break-inside-avoid">
              <CardHeader><CardTitle className="text-base">Timeline: Attacks vs Mental Health Impact</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis yAxisId="left" /><YAxis yAxisId="right" orientation="right" domain={[0, 10]} />
                    <Tooltip /><Legend />
                    <Bar yAxisId="left" dataKey="incidents" fill="#ef4444" name="Incidents" />
                    <Line yAxisId="right" type="monotone" dataKey="mentalHealth" stroke="#3b82f6" strokeWidth={3} name="Avg Mental Health Impact" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {platformData.length > 0 && (
              <Card className="print:break-inside-avoid">
                <CardHeader><CardTitle className="text-base">By Platform</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={platformData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {platformData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {eventData.length > 2 && (
              <Card className="print:break-inside-avoid">
                <CardHeader><CardTitle className="text-base">Attack Pattern Profile</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={eventData.map((d) => ({ ...d, fullMark: Math.max(...eventData.map((x) => x.value)) }))}>
                      <PolarGrid /><PolarAngleAxis dataKey="name" /><PolarRadiusAxis />
                      <Radar dataKey="value" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
