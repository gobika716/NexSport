import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bot, Sparkles, RefreshCw, Target, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { Button } from "@/components/common/Button";
import { cn } from "@/lib/utils";
import type { AnalyticsPayload, SportStatRow } from "@/server/analytics";

interface AiCoachPanelProps {
  analytics?: AnalyticsPayload | undefined;
}

function buildInsight(analytics: AnalyticsPayload | undefined) {
  const stats = analytics?.stats;
  const sportStats = analytics?.sportStats ?? [];
  const history = analytics?.matchHistory ?? [];
  const elo = stats?.elo ?? 1200;
  const matches = stats?.matches ?? 0;
  const winRate = stats?.winRate ?? 0;

  const bestSport: SportStatRow | undefined = [...sportStats].sort(
    (a, b) => b.wins - b.played * 0.5 - (a.wins - a.played * 0.5),
  )[0];

  const lastResult = history[0]?.result;
  const recentWins = history.slice(0, 5).filter((m) => m.result === "Win").length;
  const form = Math.min(100, Math.max(20, winRate + recentWins * 4 + (bestSport ? 8 : 0)));

  let headline = "Build consistency — protect your win rate";
  let summary = `You've played ${matches} confirmed match${matches === 1 ? "" : "es"} with a ${winRate}% win rate and a live Elo of ${elo}. Solid, but the biggest gains come from turning close matches into wins.`;
  let focus = "Consistency";
  const tips: string[] = [];
  const drills: { name: string; detail: string }[] = [];

  if (bestSport) {
    headline = `Push ${bestSport.sport} past ${bestSport.elo}`;
    summary = `${bestSport.sport} is your strongest sport at Elo ${bestSport.elo} (${bestSport.played} matches, ${bestSport.wins}W ${bestSport.losses}L). Keep compounding these reps to cross the next band.`;
    focus = bestSport.sport;
    tips.push(
      `Book one extra ${bestSport.sport} session this week — volume on your best sport grows rating fastest.`,
      `Replay your winning patterns: note what shot/drill won most points and repeat them under pressure.`,
      `Track match fitness with the live heart-rate monitor to keep your output consistent across sets.`,
    );
    drills.push(
      { name: "Conditioning", detail: "Intervals at ~80% max HR" },
      { name: "Skill reps", detail: `${bestSport.sport} focus drills` },
      { name: "Tactical reset", detail: "Serve/return patterns" },
    );
  } else {
    tips.push(
      "Record your first confirmed match to unlock tailored AI coaching.",
      "Use the match room skill filter to find opponents at your level.",
      "Pair a Bluetooth heart-rate monitor to track in-game intensity.",
    );
    drills.push(
      { name: "Foundation", detail: "20 min warm-up + drills" },
      { name: "Match sim", detail: "Play a practice match" },
    );
  }

  if (lastResult === "Win") {
    tips.push(
      "Momentum is on your side — ride the win streak by scheduling a rematch while your form is high.",
    );
  } else if (lastResult === "Loss") {
    tips.push(
      "Review the last loss: check your Elo change and the scoreline to spot the biggest leak to fix.",
    );
  }

  const first = history[0];
  const last = history[history.length - 1];
  const eloDelta =
    history.length >= 2 && first && last ? first.rating - last.rating : first ? first.eloChange : 0;

  return { headline, summary, focus, form, tips, drills, eloDelta };
}

export function AiCoachPanel({ analytics }: AiCoachPanelProps) {
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);
  const insight = buildInsight(analytics);

  const regenerate = () => {
    if (loading) return;
    setLoading(true);
    window.setTimeout(() => {
      setTick((n) => n + 1);
      setLoading(false);
    }, 900);
  };

  const up = insight.eloDelta >= 0;

  return (
    <section className="card-soft mt-6 overflow-hidden p-0">
      <div className="gradient-blue flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15 text-white">
            <Bot size={20} />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-white">AI Coach</h2>
            <p className="text-sm text-white/75">
              Auto-generated insights from your live match data
            </p>
          </div>
        </div>
        <Button variant="outline-light" size="sm" onClick={regenerate} disabled={loading}>
          <RefreshCw size={15} className={cn(loading && "animate-spin")} />
          {loading ? "Analysing…" : "Regenerate insights"}
        </Button>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={String(loading) + tick}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-4 animate-pulse rounded-full bg-secondary"
                    style={{ width: `${90 - i * 12}%` }}
                  />
                ))}
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-display text-xl font-bold text-ink">{insight.headline}</h3>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
                      up ? "bg-lime/25 text-lime-deep" : "bg-destructive/10 text-destructive",
                    )}
                  >
                    {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    {up ? `+${insight.eloDelta}` : insight.eloDelta} Elo
                  </span>
                </div>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-text">
                  {insight.summary}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-4">
                  <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-navy">
                    <Target size={14} /> Focus: {insight.focus}
                  </span>
                  <div className="flex min-w-40 flex-1 items-center gap-3">
                    <span className="text-xs font-semibold text-gray-text">Form</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                      <motion.div
                        className="gradient-blue h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${insight.form}%` }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-xs font-bold text-ink">{insight.form}</span>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-bold text-ink">
                      <Sparkles size={15} className="text-sky" /> Actionable tips
                    </h4>
                    <ul className="mt-3 space-y-3">
                      {insight.tips.map((t) => (
                        <li key={t} className="flex gap-3 text-sm leading-relaxed text-gray-text">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink">Training plan</h4>
                    <ul className="mt-3 space-y-3">
                      {insight.drills.map((d) => (
                        <li
                          key={d.name}
                          className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/70 px-4 py-3"
                        >
                          <span className="text-sm font-semibold text-ink">{d.name}</span>
                          <span className="text-xs text-gray-text">{d.detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <p className="mt-5 flex items-center gap-1.5 text-xs text-gray-text">
                  <Activity size={13} />
                  Generated from your live match, feedback and Elo data.
                </p>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
