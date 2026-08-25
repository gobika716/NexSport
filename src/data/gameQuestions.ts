export type GameId =
  | "badminton"
  | "cricket"
  | "football"
  | "basketball"
  | "volleyball"
  | "tennis"
  | "table-tennis"
  | "kabaddi";

export type QuestionType = "single" | "multi";

export interface GameQuestion {
  key: string;
  label: string;
  type: QuestionType;
  options: string[];
  required?: boolean;
}

const years = ["Less than 1 year", "1–2 years", "3–5 years", "More than 5 years"];
const frequency = ["Occasionally", "1–2 times a week", "3–4 times a week", "Almost every day"];
const tournament = [
  "No",
  "School/College level",
  "District level",
  "State level",
  "National level",
];
const matches = ["0–2", "3–5", "6–10", "More than 10"];

const common = (strengths: string[], improvementAreas: string[]): GameQuestion[] => [
  {
    key: "yearsOfExperience",
    label: "How many years have you been playing?",
    type: "single",
    options: years,
    required: true,
  },
  {
    key: "playingFrequency",
    label: "How often do you play?",
    type: "single",
    options: frequency,
    required: true,
  },
  {
    key: "tournamentExperience",
    label: "Have you participated in tournaments?",
    type: "single",
    options: tournament,
    required: true,
  },
  {
    key: "strengths",
    label: "What are your strengths?",
    type: "multi",
    options: strengths,
    required: true,
  },
  {
    key: "improvementAreas",
    label: "What would you like to improve?",
    type: "multi",
    options: improvementAreas,
    required: true,
  },
  {
    key: "matchesPerMonth",
    label: "Approximately how many matches do you play per month?",
    type: "single",
    options: matches,
    required: true,
  },
];

export const gameQuestions: Record<GameId, GameQuestion[]> = {
  badminton: [
    ...common(
      ["Serve", "Smash", "Drop Shot", "Clear", "Net Play", "Footwork", "Defense"],
      ["Serve", "Smash", "Footwork", "Defense", "Net Play", "Stamina", "Strategy"],
    ),
    {
      key: "preferredEvent",
      label: "Which event do you mainly play?",
      type: "single",
      options: ["Singles", "Doubles", "Mixed Doubles", "All"],
      required: true,
    },
    {
      key: "playingStyle",
      label: "What is your preferred playing style?",
      type: "single",
      options: ["Attacking", "Defensive", "All-round"],
      required: true,
    },
  ],
  cricket: [
    ...common(
      ["Batting", "Bowling", "Fielding", "Wicket Keeping", "Running Between Wickets"],
      ["Batting", "Bowling", "Fielding", "Wicket Keeping", "Running Between Wickets"],
    ),
    {
      key: "preferredRole",
      label: "What is your primary role?",
      type: "single",
      options: ["Batsman", "Bowler", "All-rounder", "Wicket Keeper"],
      required: true,
    },
    {
      key: "bowlingType",
      label: "What is your bowling type?",
      type: "single",
      options: ["Fast", "Medium Pace", "Spin", "Not applicable"],
      required: true,
    },
    {
      key: "battingStyle",
      label: "What is your batting style?",
      type: "single",
      options: ["Right Hand", "Left Hand"],
      required: true,
    },
    {
      key: "ballType",
      label: "What ball type do you normally play?",
      type: "single",
      options: ["Tennis Ball", "Leather Ball", "Both"],
      required: true,
    },
  ],
  football: [
    ...common(
      ["Passing", "Dribbling", "Shooting", "Defending", "Crossing", "Ball Control", "Stamina"],
      ["Passing", "Dribbling", "Shooting", "Defending", "Crossing", "Ball Control", "Stamina"],
    ),
    {
      key: "preferredRole",
      label: "What is your preferred position?",
      type: "single",
      options: ["Goalkeeper", "Defender", "Midfielder", "Winger", "Forward"],
      required: true,
    },
    {
      key: "playingStyle",
      label: "What is your preferred style?",
      type: "single",
      options: ["Attacking", "Defensive", "Possession", "Counter Attack", "All-round"],
      required: true,
    },
  ],
  basketball: [
    ...common(
      ["Shooting", "Passing", "Dribbling", "Rebounding", "Defense", "Speed"],
      ["Shooting", "Passing", "Dribbling", "Rebounding", "Defense", "Speed"],
    ),
    {
      key: "preferredRole",
      label: "What is your preferred position?",
      type: "single",
      options: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"],
      required: true,
    },
  ],
  volleyball: [
    ...common(
      ["Serving", "Spiking", "Blocking", "Setting", "Receiving", "Defense"],
      ["Serving", "Spiking", "Blocking", "Setting", "Receiving", "Defense"],
    ),
    {
      key: "preferredRole",
      label: "What is your preferred position?",
      type: "single",
      options: ["Setter", "Outside Hitter", "Opposite", "Middle Blocker", "Libero"],
      required: true,
    },
  ],
  tennis: [
    ...common(
      ["Serve", "Forehand", "Backhand", "Volley", "Footwork", "Defense"],
      ["Serve", "Forehand", "Backhand", "Volley", "Footwork", "Defense"],
    ),
    {
      key: "preferredEvent",
      label: "What format do you prefer?",
      type: "single",
      options: ["Singles", "Doubles", "Both"],
      required: true,
    },
    {
      key: "playingStyle",
      label: "What is your playing style?",
      type: "single",
      options: ["Aggressive", "Defensive", "All-round"],
      required: true,
    },
  ],
  "table-tennis": [
    ...common(
      ["Serve", "Forehand", "Backhand", "Spin", "Footwork", "Defense"],
      ["Serve", "Forehand", "Backhand", "Spin", "Footwork", "Defense"],
    ),
    {
      key: "preferredEvent",
      label: "What format do you prefer?",
      type: "single",
      options: ["Singles", "Doubles", "Both"],
      required: true,
    },
    {
      key: "playingStyle",
      label: "What is your playing style?",
      type: "single",
      options: ["Attacking", "Defensive", "All-round"],
      required: true,
    },
  ],
  kabaddi: [
    ...common(
      ["Raiding", "Tackling", "Agility", "Strength", "Stamina", "Reflexes"],
      ["Raiding", "Tackling", "Agility", "Strength", "Stamina", "Reflexes"],
    ),
    {
      key: "preferredRole",
      label: "What is your preferred role?",
      type: "single",
      options: ["Raider", "Defender", "All-rounder"],
      required: true,
    },
  ],
};

export const gameNames: Record<GameId, string> = {
  badminton: "Badminton",
  cricket: "Cricket",
  football: "Football",
  basketball: "Basketball",
  volleyball: "Volleyball",
  tennis: "Tennis",
  "table-tennis": "Table Tennis",
  kabaddi: "Kabaddi",
};
