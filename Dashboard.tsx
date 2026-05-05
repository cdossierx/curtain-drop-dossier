import { trpc } from "@/providers/trpc";
import { AppLayout } from "./AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line,
} from "recharts";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { useNavigate } from "react-router";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#6b7280", "#14b8a6", "#f43f5e", "#8b5cf6"];

const EVENT_TYPE_LABELS: Record<string, string> = {
  harassment: "Harassment",
  defamation: "Defamation",
  doxxing: "Doxxing",
  threat: "Threat",
  narrative_seeding: "Narrative Seeding",
  dogpiling: "Dogpiling",
  coordinated_live: "Coordinated Live",
  evidence_leak: "Evidence Leak",
  false_allegation: "False Allegation",
  account_creation: "Account Creation",
  account_deletion: "Account Deletion",
};

const STATUS_LABELS: Record<string, string> = {
  unreviewed: "Unreviewed",
  logged: "Logged",
  verified: "Verified",
  archived: "Archived",
  included_in_report: "In Report",
};

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = trpc.incidents.stats.useQuery();
  const { data: personStats } = trpc.persons.stats.useQuery();
  const { data: personsList } = trpc.persons.list.useQuery();
  const navigate = useNavigate();
  const { data: evidenceStats } = trpc.evidence.stats.useQuery();
  const { data: platformStats } = trpc.platforms.stats.useQuery();

  // Map personId to display name
  const personNameMap: Record<number, string> = {};
  personsList?.forEach((p) => { personNameMap[p.id] = p.displayName; });

  const eventTypeData = stats?.byEventType.map((item) => ({
    name: EVENT_TYPE_LABELS[item.eventType] || item.eventType,
    value: item.count,
  })) || [];

  const statusData = stats?.byStatus.map((item) => ({
    name: STATUS_LABELS[item.status] || item.status,
    value: item.count,
  })) || [];

  const timelineData = stats?.timeline.map((item) => ({
    month: item.month,
    incidents: item.count,
    mentalHealth: Math.round(item.avgMentalHealth * 10) / 10,
  })) || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Evidence, timelines, transcripts, and linked profiles
          </p>
        </div>

        {statsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <Card><CardContent className="pt-5"><div className="text-2xl font-bold">{stats?.total || 0}</div><p className="text-xs text-muted-foreground mt-1">Incidents</p></CardContent></Card>
            <Card><CardContent className="pt-5"><div className="text-2xl font-bold">{evidenceStats?.total || 0}</div><p className="text-xs text-muted-foreground mt-1">Evidence Files</p></CardContent></Card>
            <Card><CardContent className="pt-5"><div className="text-2xl font-bold">{personStats?.total || 0}</div><p className="text-xs text-muted-foreground mt-1">People Tracked</p></CardContent></Card>
            <Card><CardContent className="pt-5"><div className="text-2xl font-bold">{platformStats?.total || 0}</div><p className="text-xs text-muted-foreground mt-1">Platforms</p></CardContent></Card>
            <Card><CardContent className="pt-5"><div className="text-2xl font-bold">{stats?.avgMentalHealth || 0}/10</div><p className="text-xs text-muted-foreground mt-1">Avg. Mental Impact</p></CardContent></Card>
          </div>
        )}

        {/* Top Persons - with display names */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Activity className="h-4 w-4" />Most Active Persons</CardTitle></CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-32" /> : stats?.byPerson.length === 0 ? (
              <p className="text-muted-foreground text-center py-6 text-sm">No data yet. Start logging incidents.</p>
            ) : (
              <div className="space-y-3">
                {stats?.byPerson.slice(0, 5).map((p) => {
                  const max = stats.byPerson[0]?.count || 1;
                  const name = p.personId ? (personNameMap[p.personId] || `Person #${p.personId}`) : "Unknown";
                  return (
                    <div key={p.personId || 0} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{name}</span>
                        <span className="text-muted-foreground">{p.count} incidents</span>
                      </div>
                      <Progress value={(p.count / max) * 100} />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">By Event Type</CardTitle></CardHeader>
            <CardContent>
              {eventTypeData.length === 0 ? <p className="text-muted-foreground text-center py-8 text-sm">No data</p> : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={eventTypeData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {eventTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">By Status</CardTitle></CardHeader>
            <CardContent>
              {statusData.length === 0 ? <p className="text-muted-foreground text-center py-8 text-sm">No data</p> : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Timeline: Incidents vs Mental Health Impact</CardTitle></CardHeader>
          <CardContent>
            {timelineData.length === 0 ? <p className="text-muted-foreground text-center py-8 text-sm">No data yet</p> : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis yAxisId="left" /><YAxis yAxisId="right" orientation="right" domain={[0, 10]} />
                  <Tooltip /><Legend />
                  <Bar yAxisId="left" dataKey="incidents" fill="#ef4444" name="Incidents" />
                  <Line yAxisId="right" type="monotone" dataKey="mentalHealth" stroke="#3b82f6" strokeWidth={2} name="Avg. Mental Health Impact" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <FloatingActionButton onClick={() => navigate("/log")} label="Log new incident" />
      </div>
    </AppLayout>
  );
}
