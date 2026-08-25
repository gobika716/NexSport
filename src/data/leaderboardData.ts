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

const build = (
  rows: [string, string, number, number, number, number, string, number][],
): LeaderboardEntry[] =>
  rows.map(([name, city, elo, change, matches, winRate, form, reliability], i) => ({
    id: `${name}-${i}`.toLowerCase().replace(/\s+/g, "-"),
    rank: i + 1,
    name,
    initials: name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    city,
    elo,
    change,
    matches,
    winRate,
    form: form.split("") as ("W" | "L")[],
    reliability,
  }));

export const leaderboards: Record<LeaderboardSport, LeaderboardEntry[]> = {
  Badminton: build([
    ["Aarav Menon", "Bengaluru", 1682, 24, 96, 74, "WWLWW", 98],
    ["Nikita Rao", "Pune", 1654, 12, 88, 71, "WLWWW", 96],
    ["Devin Carter", "Bengaluru", 1611, -8, 74, 68, "LWWLW", 92],
    ["Sana Iqbal", "Hyderabad", 1578, 18, 61, 66, "WWWLL", 95],
    ["Rohit Sharma", "Mumbai", 1544, -14, 80, 63, "LLWWL", 89],
    ["Mei Tanaka", "Chennai", 1512, 9, 54, 61, "WLWLW", 93],
    ["Jonas Weber", "Pune", 1488, 5, 47, 58, "WLLWW", 90],
    ["Priya Nair", "Kochi", 1461, -3, 66, 57, "LWLWL", 91],
  ]),
  Football: build([
    ["Marco Silva", "Goa", 1731, 31, 112, 77, "WWWWL", 97],
    ["Kabir Anand", "Delhi", 1690, -6, 104, 73, "WLWWL", 94],
    ["Tomas Rivera", "Mumbai", 1648, 21, 91, 70, "WWLWW", 96],
    ["Arjun Pillai", "Kochi", 1602, 14, 87, 67, "LWWWL", 92],
    ["Sam Okoro", "Bengaluru", 1571, -11, 78, 64, "LLWWW", 88],
    ["Ivan Petrov", "Pune", 1533, 7, 69, 61, "WLWLL", 90],
    ["Hassan Ali", "Hyderabad", 1499, 3, 58, 59, "WWLLW", 93],
    ["Leo Fernandes", "Goa", 1466, -9, 63, 55, "LWLLW", 87],
  ]),
  Cricket: build([
    ["Vikram Joshi", "Mumbai", 1705, 19, 128, 75, "WWLWW", 98],
    ["Ananya Desai", "Ahmedabad", 1667, 26, 96, 72, "WWWLW", 95],
    ["Rahul Verma", "Delhi", 1620, -12, 118, 69, "LWLWW", 91],
    ["Zara Sheikh", "Hyderabad", 1584, 8, 84, 66, "WLWWL", 94],
    ["Naveen Kumar", "Chennai", 1551, 15, 92, 63, "WWLLW", 92],
    ["Aditya Bose", "Kolkata", 1517, -5, 77, 60, "LWWLL", 89],
    ["Farhan Qureshi", "Lucknow", 1483, 11, 68, 57, "WLLWW", 90],
    ["Ishan Gupta", "Pune", 1452, -7, 71, 54, "LLWLW", 86],
  ]),
  Tennis: build([
    ["Elena Duarte", "Bengaluru", 1698, 22, 74, 76, "WWWLW", 97],
    ["Karan Malhotra", "Delhi", 1655, -4, 81, 72, "WLWWL", 93],
    ["Grace Lim", "Chennai", 1613, 17, 66, 69, "WWLWW", 96],
    ["Yusuf Khan", "Hyderabad", 1576, 6, 59, 65, "LWWLW", 91],
    ["Tara Mehta", "Mumbai", 1539, -10, 63, 62, "LLWWL", 88],
    ["Owen Blake", "Pune", 1504, 13, 52, 59, "WWLLW", 92],
    ["Riya Kapoor", "Jaipur", 1471, 2, 48, 56, "WLLWL", 89],
    ["Daniel Cruz", "Goa", 1443, -6, 44, 53, "LWLLW", 85],
  ]),
  Basketball: build([
    ["Andre Whitmore", "Bengaluru", 1716, 28, 89, 78, "WWWWL", 96],
    ["Simran Kaur", "Chandigarh", 1672, 10, 82, 74, "WLWWW", 95],
    ["Chen Wei", "Mumbai", 1629, -9, 76, 70, "LWWLW", 90],
    ["Jamal Reed", "Delhi", 1591, 16, 71, 67, "WWLWL", 94],
    ["Ayesha Rahman", "Kolkata", 1556, 4, 64, 63, "WLWLW", 92],
    ["Nikhil Shetty", "Chennai", 1522, -13, 58, 60, "LLWWL", 87],
    ["Peter Ncube", "Pune", 1487, 8, 51, 57, "WLLWW", 91],
    ["Divya Menon", "Kochi", 1455, -2, 47, 54, "LWLWL", 88],
  ]),
};
