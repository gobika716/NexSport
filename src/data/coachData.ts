export interface CoachInsight {
  id: string;
  headline: string;
  summary: string;
  focus: string;
  tips: string[];
  drills: { name: string; detail: string }[];
  form: number;
  eloDelta: number;
}

export const coachInsights: CoachInsight[] = [
  {
    id: "w1",
    headline: "Strong week on the badminton court",
    summary:
      "You played 5 matches (4W-1L) and gained 34 Elo. Your rallies lasted longer than usual, and 68% of your points came from the forecourt.",
    focus: "Backhand clears under pressure",
    eloDelta: 34,
    form: 80,
    tips: [
      "Your first-serve return win rate dropped to 41% — step half a metre back on returns.",
      "You lost 7 of 9 rallies longer than 20 shots. Build stamina with interval footwork.",
      "Close out games faster: you conceded an average of 3.2 points after leading 18-14.",
    ],
    drills: [
      { name: "Shadow footwork 6-corner", detail: "3 sets × 90s, 45s rest" },
      { name: "Backhand clear wall reps", detail: "120 reps, focus on wrist snap" },
      { name: "Interval sprints", detail: "10 × 30s hard / 30s easy" },
    ],
  },
  {
    id: "w2",
    headline: "Mixed week across football and cricket",
    summary:
      "3 matches (1W-1D-1L), net -8 Elo. Your team balance score stayed high, but your second-half output dipped in both football games.",
    focus: "Late-game endurance",
    eloDelta: -8,
    form: 52,
    tips: [
      "Second-half sprint count fell 28% — pace your first 20 minutes.",
      "Passing accuracy was strongest on the left channel; use it earlier.",
      "Your fair-play rating stayed at 4.9 — teammates rate you highly.",
    ],
    drills: [
      { name: "Tempo runs", detail: "2 × 12 min at conversational pace" },
      { name: "Weak-foot passing", detail: "200 touches against wall" },
      { name: "Core circuit", detail: "3 rounds, 8 min each" },
    ],
  },
  {
    id: "w3",
    headline: "Breakthrough consistency streak",
    summary:
      "6 matches, 5 wins, +47 Elo across two sports. Your skill radar shows consistency up 12 points — the biggest jump this season.",
    focus: "Converting pressure into points",
    eloDelta: 47,
    form: 91,
    tips: [
      "You are now in the top 12% of your skill band — consider moving up a tier.",
      "Unforced errors dropped to 6 per match, your season best.",
      "Recovery days matter: your best results followed a rest day.",
    ],
    drills: [
      { name: "Match-pace rallies", detail: "5 × 5 min at 90% intensity" },
      { name: "Serve placement grid", detail: "60 serves, 4 target zones" },
      { name: "Mobility flow", detail: "15 min post-session" },
    ],
  },
];
