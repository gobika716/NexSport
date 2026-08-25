export interface EloPoint {
  month: string;
  Badminton: number;
  Football: number;
  Cricket: number;
}

export const eloTrend: EloPoint[] = [
  { month: "Jan", Badminton: 1180, Football: 1120, Cricket: 1090 },
  { month: "Feb", Badminton: 1212, Football: 1145, Cricket: 1078 },
  { month: "Mar", Badminton: 1198, Football: 1189, Cricket: 1124 },
  { month: "Apr", Badminton: 1256, Football: 1204, Cricket: 1160 },
  { month: "May", Badminton: 1301, Football: 1188, Cricket: 1201 },
  { month: "Jun", Badminton: 1288, Football: 1240, Cricket: 1235 },
  { month: "Jul", Badminton: 1342, Football: 1279, Cricket: 1218 },
  { month: "Aug", Badminton: 1388, Football: 1296, Cricket: 1264 },
];

export interface WeeklyActivity {
  week: string;
  wins: number;
  losses: number;
}

export const weeklyActivity: WeeklyActivity[] = [
  { week: "W1", wins: 3, losses: 1 },
  { week: "W2", wins: 2, losses: 2 },
  { week: "W3", wins: 4, losses: 1 },
  { week: "W4", wins: 1, losses: 3 },
  { week: "W5", wins: 5, losses: 0 },
  { week: "W6", wins: 3, losses: 2 },
  { week: "W7", wins: 4, losses: 2 },
  { week: "W8", wins: 6, losses: 1 },
];

export interface SkillPoint {
  attribute: string;
  you: number;
  average: number;
}

export const skillRadar: SkillPoint[] = [
  { attribute: "Stamina", you: 82, average: 65 },
  { attribute: "Accuracy", you: 74, average: 68 },
  { attribute: "Consistency", you: 88, average: 62 },
  { attribute: "Teamwork", you: 79, average: 71 },
  { attribute: "Reaction", you: 68, average: 64 },
  { attribute: "Fair Play", you: 95, average: 80 },
];

export interface SportSplit {
  name: string;
  value: number;
}

export const sportSplit: SportSplit[] = [
  { name: "Badminton", value: 42 },
  { name: "Football", value: 28 },
  { name: "Cricket", value: 18 },
  { name: "Tennis", value: 12 },
];

export interface HistoryRow {
  id: string;
  date: string;
  sport: string;
  venue: string;
  opponent: string;
  score: string;
  result: "Win" | "Loss";
  eloChange: number;
  rating: number;
}

export const matchHistory: HistoryRow[] = [
  {
    id: "h1",
    date: "12 Aug",
    sport: "Badminton",
    venue: "Sunrise Arena",
    opponent: "Nikita Rao",
    score: "21-18, 21-16",
    result: "Win",
    eloChange: 18,
    rating: 1388,
  },
  {
    id: "h2",
    date: "09 Aug",
    sport: "Football",
    venue: "Greenfield Turf",
    opponent: "Turf Titans",
    score: "3-2",
    result: "Win",
    eloChange: 15,
    rating: 1296,
  },
  {
    id: "h3",
    date: "06 Aug",
    sport: "Cricket",
    venue: "City Oval",
    opponent: "Oval XI",
    score: "142/6 vs 138/9",
    result: "Win",
    eloChange: 21,
    rating: 1264,
  },
  {
    id: "h4",
    date: "03 Aug",
    sport: "Badminton",
    venue: "Court 9 Club",
    opponent: "Devin Carter",
    score: "19-21, 15-21",
    result: "Loss",
    eloChange: -14,
    rating: 1370,
  },
  {
    id: "h5",
    date: "31 Jul",
    sport: "Tennis",
    venue: "Riverside Courts",
    opponent: "Grace Lim",
    score: "6-4, 3-6, 6-2",
    result: "Win",
    eloChange: 16,
    rating: 1211,
  },
  {
    id: "h6",
    date: "27 Jul",
    sport: "Football",
    venue: "Dockside Ground",
    opponent: "Harbour FC",
    score: "1-4",
    result: "Loss",
    eloChange: -17,
    rating: 1281,
  },
  {
    id: "h7",
    date: "24 Jul",
    sport: "Badminton",
    venue: "Sunrise Arena",
    opponent: "Sana Iqbal",
    score: "21-13, 21-19",
    result: "Win",
    eloChange: 12,
    rating: 1384,
  },
  {
    id: "h8",
    date: "20 Jul",
    sport: "Cricket",
    venue: "North Park",
    opponent: "Park Rangers",
    score: "96 all out vs 97/4",
    result: "Loss",
    eloChange: -19,
    rating: 1243,
  },
];

export const dashboardStats = [
  {
    id: "elo",
    label: "Current Elo",
    value: "1,388",
    sub: "Badminton · +46 this month",
    icon: "TrendingUp",
  },
  { id: "matches", label: "Matches played", value: "96", sub: "Across 4 sports", icon: "Trophy" },
  { id: "winrate", label: "Win rate", value: "71%", sub: "Last 20 matches", icon: "BarChart3" },
  {
    id: "fairplay",
    label: "Fair play score",
    value: "9.6",
    sub: "Top 5% of players",
    icon: "Heart",
  },
];
