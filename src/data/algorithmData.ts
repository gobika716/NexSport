import type { AlgorithmInfo, AiCard } from "@/types";

export const algorithms: AlgorithmInfo[] = [
  {
    id: "mcq",
    title: "MCQ Assessment",
    description:
      "A weighted questionnaire on experience, frequency and competitive history scores your baseline ability.",
    formula: "score = Σ (answerWeight × questionWeight)",
    icon: "ClipboardCheck",
  },
  {
    id: "seed-elo",
    title: "Seed Elo Formula",
    description:
      "Assessment score maps onto a starting rating so new players never enter a match unrated.",
    formula: "seedElo = 800 + (score / maxScore) × 700",
    icon: "Rocket",
  },
  {
    id: "dynamic-elo",
    title: "Dynamic Elo",
    description:
      "Ratings move after every result, scaled by opponent strength and a confidence-based K-factor.",
    formula: "R' = R + K × (S − E),  E = 1 / (1 + 10^((Ro−R)/400))",
    icon: "TrendingUp",
  },
  {
    id: "greedy",
    title: "Greedy Team Balancing",
    description:
      "Players are sorted by rating and assigned to whichever side is currently weaker, minimising the gap.",
    formula: "sort desc → assign to argmin(teamTotal)",
    icon: "Users",
  },
  {
    id: "haversine",
    title: "Haversine Distance",
    description:
      "Great-circle distance between you and every open match, so 'nearby' actually means nearby.",
    formula: "d = 2r · asin(√(sin²(Δφ/2) + cosφ₁cosφ₂sin²(Δλ/2)))",
    icon: "MapPin",
  },
  {
    id: "leaderboard",
    title: "Leaderboard Ranking",
    description:
      "A composite score blends rating, recent form and reliability so consistency is rewarded.",
    formula: "rank = 0.6·elo + 0.25·form + 0.15·reliability",
    icon: "Medal",
  },
];

export const aiCards: AiCard[] = [
  {
    id: "summary",
    title: "AI Match Summary",
    description:
      "Every match gets a short, readable recap of momentum, standout players and turning points.",
    sample:
      '"Tight 3-set badminton win. You converted 71% of long rallies — a big jump from last week."',
    icon: "FileText",
  },
  {
    id: "coach",
    title: "Weekly Coach",
    description:
      "A Sunday briefing with one focus area, one drill and one match type to target next week.",
    sample: '"Focus: backhand returns under pressure. Play two singles games this week."',
    icon: "Bot",
  },
  {
    id: "insights",
    title: "Performance Insights",
    description:
      "Trend detection across your history surfaces patterns you would never spot manually.",
    sample: '"You win 84% of morning matches vs 52% after 8pm. Book earlier slots."',
    icon: "Sparkles",
  },
];
