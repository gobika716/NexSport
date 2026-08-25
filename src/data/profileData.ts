export const profile = {
  name: "Arjun Verma",
  handle: "@arjunv",
  city: "Bengaluru, India",
  joined: "Joined March 2025",
  bio: "Weeknight badminton doubles, weekend football. Chasing a 1400 Elo before the season ends.",
  verified: true,
  fairPlay: 9.6,
  reliability: 97,
  streak: 5,
  primarySport: "Badminton",
};

export const profileStats = [
  { id: "elo", label: "Peak Elo", value: "1,392", sub: "Badminton · Aug 2026", icon: "TrendingUp" },
  { id: "played", label: "Matches played", value: "96", sub: "Across 4 sports", icon: "Trophy" },
  { id: "win", label: "Win rate", value: "71%", sub: "68W · 28L", icon: "BarChart3" },
  { id: "hours", label: "Hours on court", value: "184", sub: "Last 12 months", icon: "Clock" },
];

export interface SportStat {
  sport: string;
  elo: number;
  played: number;
  wins: number;
  losses: number;
  band: string;
  trend: number;
}

export const sportStats: SportStat[] = [
  { sport: "Badminton", elo: 1388, played: 41, wins: 31, losses: 10, band: "Advanced", trend: 46 },
  {
    sport: "Football",
    elo: 1296,
    played: 27,
    wins: 18,
    losses: 9,
    band: "Intermediate",
    trend: 22,
  },
  { sport: "Cricket", elo: 1264, played: 17, wins: 11, losses: 6, band: "Intermediate", trend: -8 },
  { sport: "Tennis", elo: 1211, played: 11, wins: 8, losses: 3, band: "Intermediate", trend: 14 },
];

export interface SkillMilestone {
  id: string;
  date: string;
  title: string;
  detail: string;
  band: string;
  elo: number;
}

export const skillHistory: SkillMilestone[] = [
  {
    id: "m1",
    date: "Aug 2026",
    title: "Advanced band unlocked",
    detail: "Five-match win streak in badminton doubles pushed the rating past 1350.",
    band: "Advanced",
    elo: 1388,
  },
  {
    id: "m2",
    date: "May 2026",
    title: "AI skill re-verification passed",
    detail: "Uploaded match clips and score sheets — verification confidence 94%.",
    band: "Intermediate+",
    elo: 1301,
  },
  {
    id: "m3",
    date: "Jan 2026",
    title: "Second sport added",
    detail: "Started 7-a-side football, seeded at 1120 from the MCQ assessment.",
    band: "Intermediate",
    elo: 1180,
  },
  {
    id: "m4",
    date: "Mar 2025",
    title: "Seed Elo generated",
    detail: "One-time MCQ assessment plus fitness self-report set the starting rating.",
    band: "Beginner+",
    elo: 1040,
  },
];

export const badges = [
  { id: "b1", label: "Fair play champion", icon: "Heart" },
  { id: "b2", label: "5-match streak", icon: "Flame" },
  { id: "b3", label: "Verified skill", icon: "ShieldCheck" },
  { id: "b4", label: "Room host ×12", icon: "Users" },
];
