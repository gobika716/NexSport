export interface ScheduleEntry {
  id: string;
  roomId: string;
  sport: string;
  venue: string;
  city: string;
  /** ISO-like date used only for mock calendar placement */
  date: string;
  time: string;
  status: "upcoming" | "past";
  result?: "Win" | "Loss" | "Draw";
  note: string;
}

/** Mock calendar month for the prototype */
export const calendarMonth = { label: "August 2026", year: 2026, month: 7, days: 31 };

export const scheduleEntries: ScheduleEntry[] = [
  {
    id: "s1",
    roomId: "r1",
    sport: "Badminton",
    venue: "Sunrise Sports Arena",
    city: "Bengaluru",
    date: "2026-08-09",
    time: "7:00 PM",
    status: "upcoming",
    note: "Doubles · two courts booked",
  },
  {
    id: "s2",
    roomId: "r2",
    sport: "Football",
    venue: "Greenfield Turf",
    city: "Bengaluru",
    date: "2026-08-10",
    time: "6:30 AM",
    status: "upcoming",
    note: "7-a-side · teams auto-balanced",
  },
  {
    id: "s3",
    roomId: "r3",
    sport: "Cricket",
    venue: "City Oval Ground",
    city: "Mumbai",
    date: "2026-08-15",
    time: "8:00 AM",
    status: "upcoming",
    note: "Advanced · 20 overs",
  },
  {
    id: "s4",
    roomId: "r4",
    sport: "Tennis",
    venue: "Riverside Courts",
    city: "Pune",
    date: "2026-08-22",
    time: "5:30 PM",
    status: "upcoming",
    note: "Singles ladder",
  },
  {
    id: "s5",
    roomId: "r1",
    sport: "Badminton",
    venue: "Sunrise Sports Arena",
    city: "Bengaluru",
    date: "2026-08-02",
    time: "7:00 PM",
    status: "past",
    result: "Win",
    note: "21-18, 21-16 · +18 Elo",
  },
  {
    id: "s6",
    roomId: "r5",
    sport: "Basketball",
    venue: "Northside Court",
    city: "Delhi",
    date: "2026-08-04",
    time: "8:00 PM",
    status: "past",
    result: "Loss",
    note: "38-44 · -12 Elo",
  },
  {
    id: "s7",
    roomId: "r2",
    sport: "Football",
    venue: "Greenfield Turf",
    city: "Bengaluru",
    date: "2026-08-06",
    time: "6:30 AM",
    status: "past",
    result: "Win",
    note: "3-2 · +15 Elo",
  },
  {
    id: "s8",
    roomId: "r3",
    sport: "Cricket",
    venue: "City Oval Ground",
    city: "Mumbai",
    date: "2026-08-07",
    time: "8:00 AM",
    status: "past",
    result: "Draw",
    note: "Rain-shortened · no rating change",
  },
];
