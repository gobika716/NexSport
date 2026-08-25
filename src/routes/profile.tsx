import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRequireAuth, useAuth } from "@/lib/auth";
import { MapPin, BadgeCheck, ChevronRight, Clock } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Icon } from "@/components/common/Icon";
import { getAnalyticsFn } from "@/server/analytics";
import { listRoomsFn } from "@/server/rooms";
import { cn } from "@/lib/utils";

const title = "My NexSport Profile — Skill History, Matches & Sports Stats";
const description =
  "View your NexSport player profile: skill band history, verified Elo per sport, recent matches, fair play score and upcoming rooms.";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function bandFromElo(elo: number): string {
  if (elo >= 1450) return "Pro";
  if (elo >= 1300) return "Advanced";
  if (elo >= 1100) return "Intermediate";
  return "Beginner";
}

function ProfilePage() {
  useRequireAuth();
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const { data: analytics } = useQuery({
    queryKey: ["analytics", userId],
    queryFn: () => getAnalyticsFn({ data: { userId } }),
    enabled: Boolean(userId),
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => listRoomsFn(),
  });

  if (!user) {
    return (
      <PageShell eyebrow="Player profile" title="Sign in" subtitle="Log in to view your profile.">
        <div className="mx-auto mt-10 max-w-3xl px-5 text-center lg:px-8">
          <p className="text-sm text-gray-text">You need to be signed in to see your profile.</p>
        </div>
      </PageShell>
    );
  }

  const stats = analytics?.stats;
  const assessment = analytics?.assessment;
  const sportStats = analytics?.sportStats ?? [];
  const matchHistory = analytics?.matchHistory ?? [];
  const elo = stats?.elo ?? user.elo ?? 1200;
  const band = bandFromElo(elo);
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const profileStats = [
    {
      id: "elo",
      label: "Current Elo",
      value: String(elo),
      sub: `${band} band`,
      icon: "TrendingUp",
    },
    {
      id: "played",
      label: "Matches played",
      value: String(stats?.matches ?? 0),
      sub: "All sports",
      icon: "Trophy",
    },
    {
      id: "win",
      label: "Win rate",
      value: `${stats?.winRate ?? 0}%`,
      sub: "Recent feedback",
      icon: "BarChart3",
    },
    {
      id: "hours",
      label: "Hours on court",
      value: String(stats?.hoursOnCourt ?? 0),
      sub: "Lifetime",
      icon: "Clock",
    },
  ];

  const badges = [
    { id: "b1", label: `Fair play ${(stats?.fairPlay ?? 0).toFixed(1)}`, icon: "Heart" },
    { id: "b2", label: `${stats?.streak ?? 0}-match streak`, icon: "Flame" },
    { id: "b3", label: `${band} band`, icon: "ShieldCheck" },
    { id: "b4", label: `${stats?.reliability ?? 0}% reliability`, icon: "Users" },
  ];

  const upcoming = rooms.slice(0, 3);

  const skillHistory = [
    {
      id: "s1",
      date: "Latest",
      title: "Elo snapshot",
      detail: `Your live rating is ${elo} (${band}).`,
      band,
      elo,
    },
  ];

  return (
    <PageShell
      eyebrow="Player profile"
      title={user.name}
      subtitle="Your NexSport performance at a glance."
    >
      <div className="mx-auto mt-10 max-w-7xl px-5 lg:px-8">
        <section className="card-soft flex flex-col gap-5 p-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-navy font-display text-xl font-bold text-white">
              {initials}
            </span>
            <div>
              <p className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                {user.name}
                <BadgeCheck size={17} className="text-sky" />
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-text">
                <MapPin size={14} className="text-sky" /> {user.city ?? "Your city"} · {band} band
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-xl font-bold text-ink">{stats?.fairPlay ?? 0}</p>
              <p className="text-xs text-gray-text">Fair play</p>
            </div>
            <div>
              <p className="text-xl font-bold text-ink">{stats?.reliability ?? 0}%</p>
              <p className="text-xs text-gray-text">Reliability</p>
            </div>
            <div>
              <p className="text-xl font-bold text-ink">{stats?.streak ?? 0}</p>
              <p className="text-xs text-gray-text">Win streak</p>
            </div>
          </div>
        </section>

        <div className="mt-4 flex flex-wrap gap-2">
          {badges.map((b) => (
            <span
              key={b.id}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-navy"
            >
              <Icon name={b.icon as "Heart"} size={14} /> {b.label}
            </span>
          ))}
        </div>

        {assessment ? (
          <section className="card-soft mt-6 p-6">
            <h2 className="font-display text-base font-semibold text-ink">Initial player profile</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ["Sport", assessment.selectedGame],
                ["Experience", assessment.experienceLevel],
                ["Initial skill", `${assessment.initialSkillScore} / 100`],
                ["Confidence", assessment.initialSkillConfidence],
                ["Certificate", assessment.hasCertificate ? "Verified" : "Not Provided"],
              ].map(([label, value]) => <div key={label} className="rounded-2xl bg-secondary/60 p-4"><p className="text-xs text-gray-text">{label}</p><p className="mt-1 text-sm font-bold capitalize text-ink">{value}</p></div>)}
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2"><div><p className="text-sm font-semibold text-ink">Strengths</p><p className="mt-1 text-sm text-gray-text">{Array.isArray(assessment.answers.strengths) ? assessment.answers.strengths.join(" · ") : "Not provided"}</p></div><div><p className="text-sm font-semibold text-ink">Areas to improve</p><p className="mt-1 text-sm text-gray-text">{Array.isArray(assessment.answers.improvementAreas) ? assessment.answers.improvementAreas.join(" · ") : "Not provided"}</p></div></div>
          </section>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {profileStats.map((s) => (
            <article key={s.id} className="card-soft p-6">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-accent text-navy">
                <Icon name={s.icon as "Heart"} size={18} />
              </span>
              <p className="mt-4 text-2xl font-bold text-ink">{s.value}</p>
              <p className="text-sm font-semibold text-gray-text">{s.label}</p>
              <p className="mt-1 text-xs text-gray-text">{s.sub}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <section className="card-soft p-6 lg:col-span-2">
            <h2 className="font-display text-base font-semibold text-ink">Sports stats</h2>
            <p className="mt-1 text-xs text-gray-text">Elo, record and current band per sport</p>
            <ul className="mt-4 space-y-3">
              {sportStats.length ? (
                sportStats.map((s) => {
                  const winPct = s.played ? Math.round((s.wins / s.played) * 100) : 0;
                  return (
                    <li key={s.sport} className="rounded-2xl bg-secondary/60 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-ink">
                          {s.sport}{" "}
                          <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-navy">
                            {s.band}
                          </span>
                        </p>
                        <p className="text-sm font-bold text-navy">
                          {s.elo}{" "}
                          <span
                            className={cn(
                              "text-xs",
                              s.trend >= 0 ? "text-lime-deep" : "text-destructive",
                            )}
                          >
                            ({s.trend >= 0 ? `+${s.trend}` : s.trend})
                          </span>
                        </p>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-sky"
                          style={{ width: `${winPct}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-gray-text">
                        {s.played} matches · {s.wins}W {s.losses}L · {winPct}% win rate
                      </p>
                    </li>
                  );
                })
              ) : (
                <li className="rounded-2xl bg-secondary/60 p-4 text-sm text-gray-text">
                  Record your first match to start building sport stats.
                </li>
              )}
            </ul>
          </section>

          <section className="card-soft p-6">
            <h2 className="font-display text-base font-semibold text-ink">Skill history</h2>
            <p className="mt-1 text-xs text-gray-text">How your band evolved over time</p>
            <ol className="mt-5 space-y-5 border-l border-border pl-5">
              {skillHistory.map((m) => (
                <li key={m.id} className="relative">
                  <span className="absolute top-1.5 -left-[27px] h-3 w-3 rounded-full border-2 border-card bg-sky" />
                  <p className="text-xs font-semibold text-gray-text">Elo {m.elo}</p>
                  <p className="mt-0.5 text-sm font-semibold text-ink">{m.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-text">{m.detail}</p>
                  <span className="mt-2 inline-block rounded-full bg-lime/25 px-2 py-0.5 text-[11px] font-bold text-lime-deep">
                    {m.band}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section className="card-soft p-6 lg:col-span-2">
            <h2 className="font-display text-base font-semibold text-ink">Recent matches</h2>
            <p className="mt-1 text-xs text-gray-text">Latest results across all sports</p>
            <ul className="mt-4 space-y-2">
              {matchHistory.length ? (
                matchHistory.slice(0, 6).map((m) => (
                  <li
                    key={m.id}
                    className="flex flex-wrap items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-3"
                  >
                    <span className="w-14 shrink-0 text-xs font-semibold text-gray-text">
                      {m.date}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {m.sport} vs {m.opponent}
                      </span>
                      <span className="block truncate text-xs text-gray-text">
                        {m.venue} · {m.score}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-bold",
                        m.result === "Win"
                          ? "bg-lime/25 text-lime-deep"
                          : m.result === "Draw"
                            ? "bg-sky/15 text-sky"
                            : "bg-destructive/10 text-destructive",
                      )}
                    >
                      {m.result}
                    </span>
                    <span
                      className={cn(
                        "w-12 text-right text-xs font-bold",
                        m.eloChange > 0 ? "text-lime-deep" : "text-destructive",
                      )}
                    >
                      {m.eloChange > 0 ? `+${m.eloChange}` : m.eloChange}
                    </span>
                  </li>
                ))
              ) : (
                <li className="rounded-2xl bg-secondary/60 px-4 py-3 text-sm text-gray-text">
                  No recorded matches yet.
                </li>
              )}
            </ul>
            <Link
              to="/dashboard"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sky hover:underline"
            >
              Full match history <ChevronRight size={15} />
            </Link>
          </section>

          <section className="card-soft p-6">
            <h2 className="font-display text-base font-semibold text-ink">Upcoming rooms</h2>
            <p className="mt-1 text-xs text-gray-text">Open rooms you can join</p>
            <ul className="mt-4 space-y-2">
              {upcoming.length ? (
                upcoming.map((e) => (
                  <li key={e.id}>
                    <Link
                      to="/rooms/$roomId"
                      params={{ roomId: e.id }}
                      className="flex items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-3 transition-colors hover:bg-secondary"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink">
                          {e.sport} · {e.venue}
                        </span>
                        <span className="block truncate text-xs text-gray-text">
                          {e.city} · {e.time}
                        </span>
                      </span>
                      <ChevronRight size={16} className="shrink-0 text-gray-text" />
                    </Link>
                  </li>
                ))
              ) : (
                <li className="rounded-2xl bg-secondary/60 px-4 py-3 text-sm text-gray-text">
                  No open rooms right now. Create one to get started.
                </li>
              )}
            </ul>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
