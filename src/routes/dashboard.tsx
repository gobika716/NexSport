import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useRequireAuth, useAuth } from "@/lib/auth";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { PageShell } from "@/components/layout/PageShell";
import { Icon } from "@/components/common/Icon";
import { AiCoachPanel } from "@/components/dashboard/AiCoachPanel";
import { FeedbackPanel } from "@/components/dashboard/FeedbackPanel";
import { cn } from "@/lib/utils";
import { getAnalyticsFn } from "@/server/analytics";
import {
  getAdminStatsFn,
  listUsersFn,
  getUserDetailsFn,
  updateCertificateStatusFn,
  type AdminDetailsPayload,
  type AdminUserRow,
} from "@/server/admin";
import type { AnalyticsPayload } from "@/server/analytics";

const title = "Performance Dashboard — Track Your NexSport Progress";
const description =
  "Follow your Elo curve, win-loss activity, skill profile and full match history with clear charts built for community sports players.";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

const NAVY = "#0b2d5c";
const SKY = "#20b7f3";
const LIME = "#7ed321";
const LIME_DEEP = "#4e8a10";
const GRID = "#e2e8f0";
const AXIS = "#64748b";

const pieColors = [NAVY, SKY, LIME, LIME_DEEP];

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--color-border)",
  background: "var(--color-card)",
  fontSize: 12,
} as const;

function ChartCard({
  title: cardTitle,
  hint,
  children,
  className,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("card-soft p-6", className)}>
      <h2 className="font-display text-base font-semibold text-ink">{cardTitle}</h2>
      <p className="mt-1 text-xs text-gray-text">{hint}</p>
      <div className="mt-5 h-64">{children}</div>
    </section>
  );
}

function eloLineData(payload: AnalyticsPayload | undefined) {
  const trend = payload?.eloTrend ?? [];
  const bySport = new Map<string, { month: string; elo: number }[]>();
  for (const p of trend) {
    const sport = p.sport ?? "Overall";
    if (!bySport.has(sport)) bySport.set(sport, []);
    bySport.get(sport)!.push({ month: p.month, elo: p.elo });
  }
  const months = Array.from(new Set(trend.map((p) => p.month)));
  return {
    months,
    series: Array.from(bySport.entries()).map(([sport, points]) => ({
      sport,
      data: months.map((m) => points.find((p) => p.month === m)?.elo ?? 0),
    })),
  };
}

function sportPieData(payload: AnalyticsPayload | undefined) {
  const stats = payload?.sportStats ?? [];
  return stats.map((s) => ({ name: s.sport, value: s.played }));
}

function statCards(payload: AnalyticsPayload | undefined) {
  const s = payload?.stats;
  return [
    {
      id: "elo",
      label: "Current Elo",
      value: s ? s.elo.toLocaleString() : "—",
      sub: "Overall rating",
      icon: "TrendingUp",
    },
    {
      id: "matches",
      label: "Matches played",
      value: s ? String(s.matches) : "—",
      sub: "Confirmed results",
      icon: "Trophy",
    },
    {
      id: "winrate",
      label: "Win rate",
      value: s ? `${s.winRate}%` : "—",
      sub: "Across all sports",
      icon: "BarChart3",
    },
    {
      id: "fairplay",
      label: "Fair play score",
      value: s ? s.fairPlay.toFixed(1) : "—",
      sub: "Community rating",
      icon: "Heart",
    },
  ];
}

function DashboardPage() {
  useRequireAuth();
  const { user } = useAuth();

  const { data: payload, isLoading } = useQuery({
    queryKey: ["analytics", user?.id],
    queryFn: () => getAnalyticsFn({ data: { userId: user!.id } }),
    enabled: !!user?.id,
  });

  const line = eloLineData(payload);
  const pie = sportPieData(payload);
  const stats = statCards(payload);
  const history = payload?.matchHistory ?? [];
  const sportStats = payload?.sportStats ?? [];

  const isAdmin = user?.isAdmin ?? false;
  const [adminSearch, setAdminSearch] = useState("");
  const [adminSportFilter, setAdminSportFilter] = useState("all");
  const [adminCertFilter, setAdminCertFilter] = useState("all");
  const [adminSortBy, setAdminSortBy] = useState<"date" | "name">("date");
  const [adminSortOrder, setAdminSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<AdminDetailsPayload | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const { data: adminStats } = useQuery({
    queryKey: ["adminStats"],
    queryFn: () => getAdminStatsFn(),
    enabled: isAdmin,
  });

  const { data: adminUsersData, refetch: refetchUsers } = useQuery({
    queryKey: [
      "adminUsers",
      adminSearch,
      adminSportFilter,
      adminCertFilter,
      adminSortBy,
      adminSortOrder,
    ],
    queryFn: () =>
      listUsersFn({
        data: {
          search: adminSearch || undefined,
          sport: adminSportFilter === "all" ? undefined : adminSportFilter,
          certificateStatus: adminCertFilter === "all" ? undefined : adminCertFilter,
          sortBy: adminSortBy,
          sortOrder: adminSortOrder,
        },
      }),
    enabled: isAdmin,
  });

  const adminUsers = adminUsersData?.users ?? [];
  const adminSports = adminUsersData?.sports ?? [];

  return (
    <PageShell
      eyebrow="Your progress"
      title="Performance Dashboard"
      subtitle="Ratings, form and match history in one place — synced from your matches and feedback in real time."
    >
      <div className="mx-auto mt-10 max-w-7xl px-5 lg:px-8">
        {isLoading ? (
          <p className="text-sm text-gray-text">Loading your analytics…</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((s) => (
                <article key={s.id} className="card-soft p-6">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-accent text-navy">
                    <Icon name={s.icon} size={18} />
                  </span>
                  <p className="mt-4 text-2xl font-bold text-ink">{s.value}</p>
                  <p className="text-sm font-semibold text-gray-text">{s.label}</p>
                  <p className="mt-1 text-xs text-gray-text">{s.sub}</p>
                </article>
              ))}
            </div>

            {payload?.assessment ? (
              <section className="card-soft mt-6 p-6">
                <p className="text-xs font-semibold tracking-wide text-sky uppercase">
                  Player profile
                </p>
                <h2 className="mt-1 font-display text-xl font-bold text-ink">
                  Welcome, {user?.name}!
                </h2>
                <p className="mt-1 text-sm text-gray-text">
                  Your NexSport player profile is ready.
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <ProfileMetric label="Sport" value={payload.assessment.selectedGame} />
                  <ProfileMetric label="Experience" value={payload.assessment.experienceLevel} />
                  <ProfileMetric
                    label="Initial skill"
                    value={`${payload.assessment.initialSkillScore} / 100`}
                  />
                  <ProfileMetric
                    label="Confidence"
                    value={payload.assessment.initialSkillConfidence}
                  />
                  <ProfileMetric
                    label="Certificate"
                    value={payload.assessment.hasCertificate ? "Verified" : "Not provided"}
                  />
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <ProfileList label="Strengths" values={payload.assessment.answers.strengths} />
                  <ProfileList
                    label="Areas to improve"
                    values={payload.assessment.answers.improvementAreas}
                  />
                </div>
              </section>
            ) : null}

            <AiCoachPanel analytics={payload} />

            <FeedbackPanel />

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <ChartCard
                title="Elo rating over time"
                hint="Your Elo from recorded history snapshots"
                className="lg:col-span-2"
              >
                {line.series.length === 0 ? (
                  <p className="mt-10 text-sm text-gray-text">
                    No Elo history yet — play a match to start tracking.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={line.months.map((month, i) => ({
                        month,
                        ...Object.fromEntries(line.series.map((s) => [s.sport, s.data[i]])),
                      }))}
                      margin={{ left: -18, right: 8, top: 8 }}
                    >
                      <CartesianGrid strokeDasharray="4 4" stroke={GRID} vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                        stroke={AXIS}
                      />
                      <YAxis
                        domain={["auto", "auto"]}
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                        stroke={AXIS}
                      />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      {line.series.map((s, i) => (
                        <Line
                          key={s.sport}
                          type="monotone"
                          dataKey={s.sport}
                          stroke={pieColors[i % pieColors.length]}
                          strokeWidth={2.5}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              <ChartCard title="Match split" hint="Share of matches by sport">
                {pie.length === 0 ? (
                  <p className="mt-10 text-sm text-gray-text">No match data yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pie}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={52}
                        outerRadius={84}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {pie.map((entry, i) => (
                          <Cell key={entry.name} fill={pieColors[i % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              <ChartCard title="Win rate by sport" hint="Your confirmed record per sport">
                {sportStats.length === 0 ? (
                  <p className="mt-10 text-sm text-gray-text">No sport stats yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sportStats} margin={{ left: -22, right: 8, top: 8 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke={GRID} vertical={false} />
                      <XAxis
                        dataKey="sport"
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                        stroke={AXIS}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                        stroke={AXIS}
                      />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#eef2f7" }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="winRate" name="Win %" fill={SKY} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </div>

            <section className="card-soft mt-6 overflow-x-auto p-2 sm:p-4">
              <h2 className="px-4 pt-4 font-display text-base font-semibold text-ink">
                Match history
              </h2>
              {history.length === 0 ? (
                <p className="px-4 py-6 text-sm text-gray-text">
                  No recorded matches yet. Once you confirm results, they appear here.
                </p>
              ) : (
                <table className="mt-4 w-full min-w-[760px] border-collapse text-left">
                  <thead>
                    <tr className="text-xs tracking-wide text-gray-text uppercase">
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Sport</th>
                      <th className="px-4 py-3 font-semibold">Venue</th>
                      <th className="px-4 py-3 font-semibold">Opponent</th>
                      <th className="px-4 py-3 font-semibold">Score</th>
                      <th className="px-4 py-3 font-semibold">Result</th>
                      <th className="px-4 py-3 font-semibold">Elo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((m) => (
                      <tr
                        key={m.id}
                        className="border-t border-border/70 transition-colors hover:bg-secondary/60"
                      >
                        <td className="px-4 py-4 text-sm text-gray-text">{m.date}</td>
                        <td className="px-4 py-4 text-sm font-semibold text-ink">{m.sport}</td>
                        <td className="px-4 py-4 text-sm text-gray-text">{m.venue}</td>
                        <td className="px-4 py-4 text-sm text-gray-text">{m.opponent}</td>
                        <td className="px-4 py-4 text-sm text-gray-text">{m.score}</td>
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-xs font-bold",
                              m.result === "Win"
                                ? "bg-lime/25 text-lime-deep"
                                : "bg-destructive/10 text-destructive",
                            )}
                          >
                            {m.result}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-navy">
                          {m.rating}{" "}
                          <span
                            className={cn(
                              "text-xs font-bold",
                              m.eloChange > 0 ? "text-lime-deep" : "text-destructive",
                            )}
                          >
                            ({m.eloChange > 0 ? `+${m.eloChange}` : m.eloChange})
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}

        {isAdmin ? (
          <section className="card-soft mt-6 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-ink">Admin Dashboard</h2>
                <p className="mt-1 text-xs text-gray-text">
                  Manage verified signups, certificates and player records.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  placeholder="Search name or email…"
                  className="h-9 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-sky"
                />
                <select
                  value={adminSportFilter}
                  onChange={(e) => setAdminSportFilter(e.target.value)}
                  className="h-9 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-sky"
                >
                  <option value="all">All Sports</option>
                  {adminSports.map((sport) => (
                    <option key={sport} value={sport}>
                      {sport}
                    </option>
                  ))}
                </select>
                <select
                  value={adminCertFilter}
                  onChange={(e) => setAdminCertFilter(e.target.value)}
                  className="h-9 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-sky"
                >
                  <option value="all">All Status</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="not_provided">Not Provided</option>
                </select>
                <select
                  value={adminSortBy}
                  onChange={(e) => setAdminSortBy(e.target.value as "date" | "name")}
                  className="h-9 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-sky"
                >
                  <option value="date">Sort by Date</option>
                  <option value="name">Sort by Name</option>
                </select>
                <button
                  type="button"
                  onClick={() => setAdminSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
                  className="h-9 rounded-xl border border-border bg-secondary px-3 text-sm font-semibold text-ink"
                >
                  {adminSortOrder === "asc" ? "Asc" : "Desc"}
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <AdminStatCard
                label="Total Users"
                value={String(adminStats?.totalUsers ?? 0)}
                icon="Users"
              />
              <AdminStatCard
                label="Verified Players"
                value={String(adminStats?.verifiedPlayers ?? 0)}
                icon="ShieldCheck"
              />
              <AdminStatCard
                label="Pending Verification"
                value={String(adminStats?.pendingVerification ?? 0)}
                icon="Clock"
              />
              <AdminStatCard
                label="Rejected Certificates"
                value={String(adminStats?.rejectedCertificates ?? 0)}
                icon="XCircle"
              />
              <AdminStatCard
                label="Total Sports"
                value={String(adminStats?.totalSports ?? 0)}
                icon="Trophy"
              />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(adminStats?.sportWiseCounts ?? []).slice(0, 8).map((item) => (
                <div key={item.sport} className="rounded-2xl border border-border p-4">
                  <p className="text-sm font-semibold text-ink capitalize">
                    {item.sport.replace(/-/g, " ")}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-navy">{item.players}</p>
                  <p className="text-xs text-gray-text">Players</p>
                </div>
              ))}
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="text-xs tracking-wide text-gray-text uppercase">
                    <th className="px-4 py-3 font-semibold">User ID</th>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 font-semibold">Sport</th>
                    <th className="px-4 py-3 font-semibold">Skill Level</th>
                    <th className="px-4 py-3 font-semibold">Location</th>
                    <th className="px-4 py-3 font-semibold">Certificate</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-6 text-sm text-gray-text">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    adminUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="border-t border-border/70 transition-colors hover:bg-secondary/60"
                      >
                        <td className="px-4 py-4 text-sm font-mono text-gray-text">{u.id}</td>
                        <td className="px-4 py-4 text-sm font-semibold text-ink">{u.name}</td>
                        <td className="px-4 py-4 text-sm text-gray-text">{u.email}</td>
                        <td className="px-4 py-4 text-sm text-gray-text">
                          {u.mobileNumber ?? "—"}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-text capitalize">
                          {(u.sport ?? u.skillLevel ?? "—").replace(/-/g, " ")}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-text capitalize">
                          {u.skillLevel ?? "—"}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-text">{u.city ?? "—"}</td>
                        <td className="px-4 py-4 text-sm text-gray-text capitalize">
                          {(u.certificateStatus ?? "not_provided").replace(/_/g, " ")}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-xs font-bold",
                              u.accountStatus === "active"
                                ? "bg-lime/25 text-lime-deep"
                                : u.accountStatus === "pending"
                                  ? "bg-accent text-navy"
                                  : "bg-destructive/10 text-destructive",
                            )}
                          >
                            {u.accountStatus ?? "active"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-text">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <button
                            type="button"
                            onClick={async () => {
                              const details = await getUserDetailsFn({ data: { userId: u.id } });
                              setSelectedDetails(details);
                              setSelectedUser(u);
                              setDetailsOpen(true);
                            }}
                            className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-sky hover:text-sky"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {detailsOpen && selectedDetails ? (
          <UserDetailsModal
            details={selectedDetails}
            onClose={() => {
              setDetailsOpen(false);
              setSelectedDetails(null);
              setSelectedUser(null);
            }}
            onStatusChange={async (status) => {
              if (!selectedUser) return;
              setUpdatingStatus(selectedUser.id);
              await updateCertificateStatusFn({ data: { userId: selectedUser.id, status } });
              setUpdatingStatus(null);
              setDetailsOpen(false);
              setSelectedDetails(null);
              setSelectedUser(null);
              refetchUsers();
            }}
            updating={updatingStatus}
          />
        ) : null}
      </div>
    </PageShell>
  );
}

function AdminStatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="card-soft p-4">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-accent text-navy">
        <Icon name={icon} size={18} />
      </span>
      <p className="mt-3 text-2xl font-bold text-ink">{value}</p>
      <p className="text-xs font-semibold text-gray-text">{label}</p>
    </div>
  );
}

function UserDetailsModal({
  details,
  onClose,
  onStatusChange,
  updating,
}: {
  details: AdminDetailsPayload;
  onClose: () => void;
  onStatusChange: (status: "pending" | "verified" | "rejected" | "not_provided") => void;
  updating: string | null;
}) {
  const u = details.user;
  const a = details.assessment;
  const certStatus = a?.certificateStatus ?? u.certificateStatus ?? "not_provided";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card-soft max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-ink">User Details</h3>
            <p className="text-xs text-gray-text">{u.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-gray-text hover:text-ink"
          >
            Close
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <DetailField label="Full Name" value={u.name} />
          <DetailField label="Email" value={u.email} />
          <DetailField label="Phone" value={u.mobileNumber ?? "—"} />
          <DetailField label="Sport" value={a ? a.selectedGame.replace(/-/g, " ") : "—"} />
          <DetailField label="Experience" value={a ? a.experienceLevel : "—"} />
          <DetailField label="Skill Level" value={u.skillLevel ?? "—"} />
          <DetailField label="Location" value={u.city ?? "—"} />
          <DetailField label="Signup Date" value={new Date(u.createdAt).toLocaleString()} />
          <DetailField label="Account Status" value={u.accountStatus ?? "active"} />
          <DetailField label="Certificate Status" value={certStatus.replace(/_/g, " ")} />
        </div>

        {a ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <DetailField label="Years of Experience" value={a.yearsOfExperience} />
            <DetailField label="Playing Frequency" value={a.playingFrequency} />
            <DetailField label="Tournament Experience" value={a.tournamentExperience} />
            <DetailField label="Preferred Role" value={a.preferredRole ?? "—"} />
            <DetailField label="Preferred Event" value={a.preferredEvent ?? "—"} />
            <DetailField label="Playing Style" value={a.playingStyle ?? "—"} />
            <DetailField label="Initial Skill Score" value={`${a.initialSkillScore} / 100`} />
            <DetailField label="Skill Confidence" value={a.initialSkillConfidence} />
            <DetailField label="Verification Type" value={a.verificationType} />
            <DetailField label="Has Certificate" value={a.hasCertificate ? "Yes" : "No"} />
          </div>
        ) : null}

        {a?.strengths?.length ? (
          <div className="mt-4">
            <p className="text-sm font-semibold text-ink">Strengths</p>
            <p className="mt-1 text-sm text-gray-text">{a.strengths.join(", ")}</p>
          </div>
        ) : null}
        {a?.improvementAreas?.length ? (
          <div className="mt-3">
            <p className="text-sm font-semibold text-ink">Areas to Improve</p>
            <p className="mt-1 text-sm text-gray-text">{a.improvementAreas.join(", ")}</p>
          </div>
        ) : null}

        {a?.certificateImage ? (
          <div className="mt-5">
            <p className="text-sm font-semibold text-ink">Certificate Preview</p>
            <img
              src={a.certificateImage}
              alt="Certificate"
              className="mt-2 max-h-60 rounded-xl border border-border object-contain"
            />
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={updating !== null}
            onClick={() => onStatusChange("pending")}
            className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-ink transition-colors hover:border-sky disabled:opacity-50"
          >
            Mark Pending
          </button>
          <button
            type="button"
            disabled={updating !== null}
            onClick={() => onStatusChange("verified")}
            className="rounded-xl border border-lime-deep/40 bg-lime/10 px-4 py-2 text-xs font-semibold text-lime-deep transition-colors hover:bg-lime/20 disabled:opacity-50"
          >
            Verify Certificate
          </button>
          <button
            type="button"
            disabled={updating !== null}
            onClick={() => onStatusChange("rejected")}
            className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-text">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary/60 p-4">
      <p className="text-xs text-gray-text">{label}</p>
      <p className="mt-1 text-sm font-bold capitalize text-ink">{value}</p>
    </div>
  );
}

function ProfileList({ label, values }: { label: string; values: string | string[] | undefined }) {
  const list = Array.isArray(values) ? values : values ? [values] : [];
  return (
    <div>
      <p className="text-sm font-semibold text-ink">{label}</p>
      <p className="mt-2 text-sm text-gray-text">
        {list.length ? list.join(" · ") : "Not provided"}
      </p>
    </div>
  );
}
