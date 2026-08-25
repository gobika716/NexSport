import type { SportCategory, FeatureInfo, StepInfo, StatItem } from "@/types";

import cricket from "@/assets/sport-cricket.jpg";
import football from "@/assets/sport-football.jpg";
import badminton from "@/assets/sport-badminton.jpg";
import basketball from "@/assets/sport-basketball.jpg";
import volleyball from "@/assets/sport-volleyball.jpg";
import tennis from "@/assets/sport-tennis.jpg";
import tabletennis from "@/assets/sport-tabletennis.jpg";
import kabaddi from "@/assets/sport-kabaddi.jpg";
import hockey from "@/assets/sport-hockey.jpg";
import chess from "@/assets/sport-chess.jpg";
import running from "@/assets/sport-running.jpg";
import cycling from "@/assets/sport-cycling.jpg";

export const sports: SportCategory[] = [
  {
    id: "cricket",
    name: "Cricket",
    group: "team",
    image: cricket,
    players: "1,240 players",
    badge: "Trending",
  },
  {
    id: "football",
    name: "Football",
    group: "team",
    image: football,
    players: "980 players",
    badge: "Trending",
  },
  {
    id: "badminton",
    name: "Badminton",
    group: "racquet",
    image: badminton,
    players: "870 players",
  },
  {
    id: "basketball",
    name: "Basketball",
    group: "team",
    image: basketball,
    players: "610 players",
  },
  {
    id: "volleyball",
    name: "Volleyball",
    group: "team",
    image: volleyball,
    players: "430 players",
  },
  { id: "tennis", name: "Tennis", group: "racquet", image: tennis, players: "520 players" },
  {
    id: "table-tennis",
    name: "Table Tennis",
    group: "racquet",
    image: tabletennis,
    players: "390 players",
  },
  {
    id: "kabaddi",
    name: "Kabaddi",
    group: "team",
    image: kabaddi,
    players: "260 players",
    badge: "Local favourite",
  },
  { id: "hockey", name: "Hockey", group: "team", image: hockey, players: "210 players" },
  { id: "chess", name: "Chess", group: "solo", image: chess, players: "740 players" },
  { id: "running", name: "Running", group: "solo", image: running, players: "1,020 players" },
  { id: "cycling", name: "Cycling", group: "solo", image: cycling, players: "580 players" },
];

export const sportFilters = [
  { id: "all", label: "All" },
  { id: "team", label: "Team" },
  { id: "racquet", label: "Racquet" },
  { id: "solo", label: "Solo / Mind" },
] as const;

export const features: FeatureInfo[] = [
  {
    id: "nearby",
    title: "Nearby Players",
    description:
      "Discover verified players within your radius, ranked by skill proximity and availability windows.",
    icon: "MapPin",
  },
  {
    id: "create",
    title: "Create Matches",
    description:
      "Publish a match in seconds — pick sport, venue, slots and skill band, then let requests roll in.",
    icon: "CalendarPlus",
  },
  {
    id: "teams",
    title: "Balanced Teams",
    description:
      "Greedy balancing splits the roster so both sides land within a few rating points of each other.",
    icon: "Users",
  },
  {
    id: "elo",
    title: "Dynamic Elo",
    description:
      "Every result updates your rating with a K-factor tuned to match importance and confidence.",
    icon: "TrendingUp",
  },
  {
    id: "dashboard",
    title: "Performance Dashboard",
    description:
      "Win rate, form curve, sport-wise breakdown and streaks in one clean, readable dashboard.",
    icon: "BarChart3",
  },
  {
    id: "ai",
    title: "AI Insights",
    description:
      "Automatic match summaries and a weekly coach that tells you exactly what to work on next.",
    icon: "Sparkles",
  },
  {
    id: "verification",
    title: "AI Skill Verification",
    description:
      "Uploaded match images and past results are cross-checked so self-reported skill stays honest.",
    icon: "ShieldCheck",
  },
  {
    id: "rooms",
    title: "GPS Match Rooms",
    description:
      "Location-aware rooms notify nearby players instantly and close automatically an hour before start.",
    icon: "Navigation",
  },
  {
    id: "feedback",
    title: "Peer Feedback & Fair Play",
    description:
      "Post-match peer ratings feed a fair-play score that keeps community games friendly and reliable.",
    icon: "Heart",
  },
];

export const steps: StepInfo[] = [
  {
    id: 1,
    title: "Register / Login",
    description: "Create your profile, set your city, sports and availability.",
    icon: "UserPlus",
  },
  {
    id: 2,
    title: "One-Time MCQ Assessment",
    description: "Experience, fitness and game knowledge questions score your baseline.",
    icon: "ClipboardCheck",
  },
  {
    id: 3,
    title: "AI Skill Verification",
    description: "Match images and results are verified before your rating is issued.",
    icon: "ShieldCheck",
  },
  {
    id: 4,
    title: "Seed Elo Rating",
    description: "Your assessment maps onto a starting Elo so you never play unrated.",
    icon: "Rocket",
  },
  {
    id: 5,
    title: "Create or Join Match Room",
    description:
      "Set sport, ground, GPS location, time, slots and skill level — or join an open room.",
    icon: "CalendarPlus",
  },
  {
    id: 6,
    title: "Nearby Players Notified",
    description: "Players in range get pinged and fill the room; otherwise it waits for more.",
    icon: "Bell",
  },
  {
    id: 7,
    title: "Room Closes Automatically",
    description: "Once full — or one hour before start — the room locks in the roster.",
    icon: "Lock",
  },
  {
    id: 8,
    title: "Balanced Teams Created",
    description: "The AI greedy zig-zag algorithm splits the roster into evenly matched sides.",
    icon: "Shuffle",
  },
  {
    id: 9,
    title: "Play & Upload Results",
    description: "Play the match, then upload the result, statistics and peer feedback.",
    icon: "Trophy",
  },
  {
    id: 10,
    title: "Dynamic Elo & Profile Update",
    description: "Ratings, match history, performance and fair-play score refresh instantly.",
    icon: "LineChart",
  },
];

export const stats: StatItem[] = [
  { id: "players", value: 5000, suffix: "+", label: "Players" },
  { id: "matches", value: 1200, suffix: "+", label: "Matches" },
  { id: "sports", value: 12, suffix: "", label: "Sports" },
  { id: "fair", value: 95, suffix: "%", label: "Fair Matchmaking" },
];
