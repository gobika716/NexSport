import { createServerFn } from "@tanstack/react-start";
import { eq, asc } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { gameNames } from "@/data/gameQuestions";
import { sports } from "@/data/sportsData";

export interface EloTrendPoint {
  month: string;
  elo: number;
  /** Sport this snapshot is for; "Overall" when aggregated. */
  sport?: string;
}

export interface SportStatRow {
  sport: string;
  elo: number;
  played: number;
  wins: number;
  losses: number;
  band: string;
  trend: number;
}

export interface MatchHistoryRow {
  id: string;
  date: string;
  sport: string;
  venue: string;
  opponent: string;
  score: string;
  result: "Win" | "Loss" | "Draw";
  eloChange: number;
  rating: number;
}

export interface DashboardStats {
  elo: number;
  matches: number;
  winRate: number;
  fairPlay: number;
  reliability: number;
  streak: number;
  hoursOnCourt: number;
}

export interface AnalyticsPayload {
  stats: DashboardStats;
  assessment: {
    selectedGame: string;
    experienceLevel: string;
    answers: Record<string, string | string[]>;
    initialSkillScore: number;
    initialSkillConfidence: string;
    hasCertificate: boolean;
  } | null;
  eloTrend: EloTrendPoint[];
  sportStats: SportStatRow[];
  matchHistory: MatchHistoryRow[];
}

const sportNameMap = new Map<string, string>();
for (const s of sports) {
  sportNameMap.set(s.id.toLowerCase(), s.name);
  sportNameMap.set(s.name.toLowerCase(), s.name);
}

function sportLabel(raw: string): string {
  const trimmed = raw.trim();
  const found = sportNameMap.get(trimmed.toLowerCase());
  if (found) return found;
  if (trimmed.length > 0) return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  return trimmed;
}

function bandFromElo(elo: number): string {
  if (elo >= 1450) return "Pro";
  if (elo >= 1300) return "Advanced";
  if (elo >= 1100) return "Intermediate";
  return "Beginner";
}

export const getAnalyticsFn = createServerFn({ method: "GET" })
  .validator((d: { userId: string }) => d)
  .handler(async ({ data }) => {
    const user = db.select().from(schema.users).where(eq(schema.users.id, data.userId)).get();

    if (!user) {
      return {
        stats: {
          elo: 1200,
          matches: 0,
          winRate: 0,
          fairPlay: 0,
          reliability: 0,
          streak: 0,
          hoursOnCourt: 0,
        },
        assessment: null,
        eloTrend: [],
        sportStats: [],
        matchHistory: [],
      } satisfies AnalyticsPayload;
    }

    const assessmentRow = db
      .select()
      .from(schema.playerAssessments)
      .where(eq(schema.playerAssessments.userId, data.userId))
      .get();
    const assessment = assessmentRow
      ? {
          selectedGame: assessmentRow.selectedGame,
          experienceLevel: assessmentRow.experienceLevel,
          answers: JSON.parse(assessmentRow.answers) as Record<string, string | string[]>,
          initialSkillScore: assessmentRow.initialSkillScore,
          initialSkillConfidence: assessmentRow.initialSkillConfidence,
          hasCertificate: assessmentRow.hasCertificate,
        }
      : null;

    // Elo history
    const historyRows = db
      .select()
      .from(schema.eloHistory)
      .where(eq(schema.eloHistory.userId, data.userId))
      .orderBy(asc(schema.eloHistory.recordedAt))
      .all();

    const eloTrend: EloTrendPoint[] = historyRows.map((h) => ({
      month: new Date(h.recordedAt).toLocaleDateString([], { month: "short" }),
      elo: h.elo,
      sport: sportLabel(h.sport),
    }));

    // Match history
    const allMatches = db.select().from(schema.matches).all();
    const matchHistory: MatchHistoryRow[] = allMatches.map((m) => ({
      id: m.id,
      date: new Date(m.date).toLocaleDateString([], { day: "numeric", month: "short" }),
      sport: sportLabel(m.sport),
      venue: m.venue,
      opponent: m.opponent,
      score: m.score,
      result: m.result,
      eloChange: m.eloChange,
      rating: m.eloAfter,
    }));

    // Sport stats from feedback
    const allFeedback = db.select().from(schema.feedback).all();
    const sportMap = new Map<string, SportStatRow>();
    for (const fb of allFeedback) {
      if (fb.userId !== data.userId) continue;
      const normalizedSport = sportLabel(fb.sport);
      const cur = sportMap.get(normalizedSport) ?? {
        sport: normalizedSport,
        elo: user.elo,
        played: 0,
        wins: 0,
        losses: 0,
        band: bandFromElo(user.elo),
        trend: 0,
      };
      cur.played += 1;
      if (fb.result === "Win") cur.wins += 1;
      if (fb.result === "Loss") cur.losses += 1;
      sportMap.set(normalizedSport, cur);
    }

    // Seed from rooms the user is part of
    const memberships = db
      .select()
      .from(schema.roomMembers)
      .where(eq(schema.roomMembers.userId, data.userId))
      .all();
    const memberRoomIds = memberships.map((m) => m.roomId);
    const roomRows = db.select().from(schema.rooms).all();
    for (const r of roomRows) {
      if (!memberRoomIds.includes(r.id)) continue;
      const normalizedRoomSport = sportLabel(r.sport);
      if (!sportMap.has(normalizedRoomSport)) {
        sportMap.set(normalizedRoomSport, {
          sport: normalizedRoomSport,
          elo: user.elo,
          played: 0,
          wins: 0,
          losses: 0,
          band: bandFromElo(user.elo),
          trend: 0,
        });
      }
    }

    const feedbackRows = allFeedback.filter((f) => f.userId === data.userId);
    const totalMatches = feedbackRows.length || user.matchesPlayed;
    const wins = feedbackRows.filter((f) => f.result === "Win").length;
    const winRate = totalMatches ? Math.round((wins / totalMatches) * 100) : 0;

    const stats: DashboardStats = {
      elo: user.elo,
      matches: totalMatches,
      winRate,
      fairPlay: user.fairPlay,
      reliability: user.reliability,
      streak: user.streak,
      hoursOnCourt: user.hoursOnCourt,
    };

    return {
      stats,
      assessment,
      eloTrend,
      sportStats: Array.from(sportMap.values()),
      matchHistory,
    } satisfies AnalyticsPayload;
  });
