export interface BalancedPlayer {
  name: string;
  elo: number;
  skill: string;
  isMe?: boolean;
}

export interface BalancedTeams {
  a: BalancedPlayer[];
  b: BalancedPlayer[];
  avgA: number;
  avgB: number;
  gap: number;
  fairness: number;
}

export const skillLevels = [
  { id: "Beginner", elo: 1000, hint: "New or casual player" },
  { id: "Intermediate", elo: 1180, hint: "Plays weekly, knows the basics" },
  { id: "Advanced", elo: 1350, hint: "Competitive, club-level" },
  { id: "Pro", elo: 1520, hint: "Tournament experience" },
] as const;

export type SkillId = (typeof skillLevels)[number]["id"];

export function skillFromElo(elo: number): SkillId {
  if (elo >= 1450) return "Pro";
  if (elo >= 1300) return "Advanced";
  if (elo >= 1100) return "Intermediate";
  return "Beginner";
}

const NAMES = [
  "Aarav M.",
  "Priya S.",
  "Marco S.",
  "Leah K.",
  "Vikram J.",
  "Grace L.",
  "Jamal R.",
  "Nina P.",
  "Omar F.",
  "Riya D.",
  "Tom H.",
  "Sara B.",
  "Diego A.",
  "Mei C.",
  "Ravi K.",
  "Elena V.",
  "Noah W.",
  "Zara Q.",
  "Ken T.",
  "Ana R.",
  "Ibrahim N.",
  "Chloe F.",
];

/** Deterministic mock roster for a room so every screen shows the same people. */
export function rosterFor(roomId: string, count: number, avgElo: number): BalancedPlayer[] {
  const seed = roomId.split("").reduce((s, ch) => s + ch.charCodeAt(0), 0);
  return Array.from({ length: Math.max(0, count) }, (_, i) => {
    const offset = (((seed + i * 53) % 25) - 12) * 10;
    const elo = avgElo + offset;
    return { name: NAMES[(seed + i * 3) % NAMES.length]!, elo, skill: skillFromElo(elo) };
  });
}

/** Greedy zig-zag (serpentine) draft: sort by rating, then alternate pick direction. */
export function zigZagBalance(players: BalancedPlayer[]): BalancedTeams {
  const sorted = [...players].sort((x, y) => y.elo - x.elo);
  const perTeam = Math.ceil(sorted.length / 2);
  const a: BalancedPlayer[] = [];
  const b: BalancedPlayer[] = [];

  sorted.forEach((p, i) => {
    const row = Math.floor(i / 2);
    const preferA = row % 2 === 0 ? i % 2 === 0 : i % 2 === 1;
    const first = preferA ? a : b;
    const second = preferA ? b : a;
    (first.length >= perTeam ? second : first).push(p);
  });

  const avg = (t: BalancedPlayer[]) =>
    t.length ? Math.round(t.reduce((s, p) => s + p.elo, 0) / t.length) : 0;
  const avgA = avg(a);
  const avgB = avg(b);
  const gap = Math.abs(avgA - avgB);
  const fairness = Math.max(0, Math.min(100, Math.round(100 - (gap / 120) * 100)));

  return { a, b, avgA, avgB, gap, fairness };
}

/** Per-team aggregates used by the distribution charts. */
export function skillDistribution(teams: BalancedTeams) {
  const buckets = skillLevels.map((s) => s.id);
  return buckets.map((bucket) => ({
    band: bucket,
    "Team A": teams.a.filter((p) => p.skill === bucket).length,
    "Team B": teams.b.filter((p) => p.skill === bucket).length,
  }));
}

export function eloSpread(teams: BalancedTeams) {
  const rows = Math.max(teams.a.length, teams.b.length);
  return Array.from({ length: rows }, (_, i) => ({
    slot: `P${i + 1}`,
    "Team A": teams.a[i]?.elo ?? 0,
    "Team B": teams.b[i]?.elo ?? 0,
  }));
}

export function teamStrengthRadar(teams: BalancedTeams) {
  const stat = (t: BalancedPlayer[], mode: "top" | "depth" | "spread" | "avg") => {
    if (!t.length) return 0;
    const elos = t.map((p) => p.elo);
    const max = Math.max(...elos);
    const min = Math.min(...elos);
    const mean = elos.reduce((s, e) => s + e, 0) / elos.length;
    const norm = (v: number) => Math.round(Math.max(0, Math.min(100, ((v - 900) / 700) * 100)));
    if (mode === "top") return norm(max);
    if (mode === "depth") return norm(min);
    if (mode === "avg") return norm(mean);
    return Math.round(Math.max(0, 100 - ((max - min) / 400) * 100));
  };
  return [
    { attribute: "Top end", "Team A": stat(teams.a, "top"), "Team B": stat(teams.b, "top") },
    { attribute: "Depth", "Team A": stat(teams.a, "depth"), "Team B": stat(teams.b, "depth") },
    { attribute: "Average", "Team A": stat(teams.a, "avg"), "Team B": stat(teams.b, "avg") },
    {
      attribute: "Consistency",
      "Team A": stat(teams.a, "spread"),
      "Team B": stat(teams.b, "spread"),
    },
  ];
}
