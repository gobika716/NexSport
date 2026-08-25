import type { GameId } from "@/data/gameQuestions";

export type ExperienceLevel = "Beginner" | "Intermediate" | "Advanced";
export type SkillConfidence = "Low" | "Medium" | "High";

export interface AssessmentInput {
  selectedGame: GameId;
  experienceLevel: ExperienceLevel;
  answers: Record<string, string | string[]>;
  verificationType: string;
}

const scoreByAnswer = (value: string | string[] | undefined) => {
  if (!value || (Array.isArray(value) && value.length === 0)) return 0;
  if (Array.isArray(value)) return Math.min(12, value.length * 3);
  return value.includes("More than 5") || value.includes("National") || value.includes("every day")
    ? 18
    : 10;
};

export function calculateInitialSkill(input: AssessmentInput) {
  const experienceScore = { Beginner: 8, Intermediate: 18, Advanced: 27 }[input.experienceLevel];
  const answerValues = Object.values(input.answers);
  const answerScore = answerValues.reduce((total, value) => total + scoreByAnswer(value), 0);
  const completeness = answerValues.length
    ? answerValues.filter(Boolean).length / answerValues.length
    : 0;
  const verificationScore = input.verificationType === "None" ? 0 : 8;
  const raw = Math.round((experienceScore + answerScore + verificationScore) / 2.1);
  const initialSkillScore = Math.max(0, Math.min(100, raw));
  const initialSkillConfidence: SkillConfidence =
    completeness >= 0.95 && input.verificationType !== "None"
      ? "High"
      : completeness >= 0.8
        ? "Medium"
        : "Low";

  return { initialSkillScore, initialSkillConfidence };
}
