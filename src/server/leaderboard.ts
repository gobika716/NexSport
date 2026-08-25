import { createServerFn } from "@tanstack/react-start";
import { desc } from "drizzle-orm";
import { db, schema } from "@/db/client";

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  initials: string;
  city: string;
  elo: number;
  change: number;
  matches: number;
  winRate: number;
  form: ("W" | "L")[];
  reliability: number;
}

export const leaderboardSports = [
  "Badminton",
  "Football",
  "Cricket",
  "Tennis",
  "Basketball",
] as const;

export type LeaderboardSport = (typeof leaderboardSports)[number];

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export const getLeaderboardFn = createServerFn({ method: "GET" })
  .validator((d: { sport: LeaderboardSport }) => d)
  .handler(async ({ data }) => {
    const users = db.select().from(schema.users).orderBy(desc(schema.users.elo)).all();

    // Build per-user match stats from the matches table
    const allMatches = db.select().from(schema.matches).all();
    const sportMatches = allMatches.filter((m) => m.sport === data.sport);

    const rows: LeaderboardEntry[] = users.map((u, i) => {
      const userMatches = sportMatches.filter((m) => m.opponent === u.name);
      const total = userMatches.length;
      const wins = userMatches.filter((m) => m.result === "Win").length;
      const winRate = total ? Math.round((wins / total) * 100) : 0;
      const form = userMatches
        .slice(-5)
        .map((m) => (m.result === "Win" ? "W" : m.result === "Loss" ? "L" : "D"))
        .filter((f): f is "W" | "L" => f !== "D");

      return {
        id: u.id,
        rank: i + 1,
        name: u.name,
        initials: initials(u.name),
        city: u.city ?? "—",
        elo: u.elo,
        change: u.streak > 0 ? u.streak * 3 : 0,
        matches: total || u.matchesPlayed,
        winRate,
        form: form.length ? form : (["W", "L", "W"] as ("W" | "L")[]),
        reliability: Math.round(u.reliability),
      };
    });

    return rows;
  });
