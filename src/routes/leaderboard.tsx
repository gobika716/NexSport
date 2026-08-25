import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useRequireAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { TrendingUp, TrendingDown, Minus, Trophy } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { cn } from "@/lib/utils";
import { getLeaderboardFn, leaderboardSports, type LeaderboardSport } from "@/server/leaderboard";

const title = "Leaderboard — NexSport Elo Rankings by Sport";
const description =
  "Live-style NexSport leaderboards with dynamic Elo ratings, recent form and reliability scores across badminton, football, cricket, tennis and basketball.";

export const Route = createFileRoute("/leaderboard")({
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
  component: LeaderboardPage,
});

function Delta({ change }: { change: number }) {
  const Icon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold",
        change > 0 ? "text-lime-deep" : change < 0 ? "text-destructive" : "text-gray-text",
      )}
    >
      <Icon size={14} />
      {change > 0 ? `+${change}` : change}
    </span>
  );
}

function LeaderboardPage() {
  useRequireAuth();
  const [sport, setSport] = useState<LeaderboardSport>("Badminton");
  const { data: rows = [] } = useQuery({
    queryKey: ["leaderboard", sport],
    queryFn: () => getLeaderboardFn({ data: { sport } }),
  });
  const topElo = useMemo(() => Math.max(...rows.map((r) => r.elo), 1), [rows]);

  return (
    <PageShell
      eyebrow="Rankings"
      title="Leaderboard"
      subtitle="Composite ranking blends dynamic Elo, recent form and reliability — so consistency counts as much as raw skill."
    >
      <div className="mx-auto mt-10 max-w-7xl px-5 lg:px-8">
        <div className="flex flex-wrap gap-2">
          {leaderboardSports.map((s) => (
            <button
              key={s}
              onClick={() => setSport(s)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                s === sport
                  ? "border-transparent gradient-blue text-white"
                  : "border-border bg-card text-gray-text hover:border-sky hover:text-sky",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {rows.slice(0, 3).map((r, i) => (
            <motion.article
              key={r.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className="card-soft flex items-center gap-4 p-6"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent font-display text-lg font-bold text-navy">
                {i === 0 ? <Trophy size={20} className="text-lime-deep" /> : r.rank}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-base font-semibold text-ink">{r.name}</p>
                <p className="truncate text-xs text-gray-text">
                  {r.city} · {r.matches} matches
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm font-bold text-navy">
                  {r.elo}
                  <Delta change={r.change} />
                </p>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="card-soft mt-8 overflow-x-auto p-2 sm:p-4">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="text-xs tracking-wide text-gray-text uppercase">
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Player</th>
                <th className="px-4 py-3 font-semibold">Elo</th>
                <th className="px-4 py-3 font-semibold">Change</th>
                <th className="px-4 py-3 font-semibold">Matches</th>
                <th className="px-4 py-3 font-semibold">Win %</th>
                <th className="px-4 py-3 font-semibold">Form</th>
                <th className="px-4 py-3 font-semibold">Reliability</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-border/70 transition-colors hover:bg-secondary/60"
                >
                  <td className="px-4 py-4 text-sm font-semibold text-gray-text">{r.rank}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-navy/6 text-xs font-bold text-navy">
                        {r.initials}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{r.name}</p>
                        <p className="truncate text-xs text-gray-text">{r.city}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-navy">{r.elo}</span>
                      <span className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-secondary lg:block">
                        <span
                          className="block h-full rounded-full gradient-blue"
                          style={{ width: `${Math.round((r.elo / topElo) * 100)}%` }}
                        />
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Delta change={r.change} />
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-text">{r.matches}</td>
                  <td className="px-4 py-4 text-sm text-gray-text">{r.winRate}%</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-1">
                      {r.form.map((f, i) => (
                        <span
                          key={i}
                          className={cn(
                            "grid h-6 w-6 place-items-center rounded-md text-[11px] font-bold",
                            f === "W"
                              ? "bg-lime/25 text-lime-deep"
                              : "bg-destructive/10 text-destructive",
                          )}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-text">{r.reliability}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-gray-text">
          Live data from nexsport.db. Elo updates use R' = R + K × (S − E) after every confirmed
          result.
        </p>
      </div>
    </PageShell>
  );
}
