import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";

export interface PlayerAssessmentPayload {
  selectedGame: string;
  experienceLevel: string;
  answers: Record<string, string | string[]>;
  initialSkillScore: number;
  initialSkillConfidence: string;
  hasCertificate: boolean;
  certificateImage: string | null;
}

export const getAssessmentFn = createServerFn({ method: "GET" })
  .validator((d: { userId: string }) => d)
  .handler(async ({ data }) => {
    const assessment = db
      .select()
      .from(schema.playerAssessments)
      .where(eq(schema.playerAssessments.userId, data.userId))
      .get();
    if (!assessment) return null;
    return {
      selectedGame: assessment.selectedGame,
      experienceLevel: assessment.experienceLevel,
      answers: JSON.parse(assessment.answers) as Record<string, string | string[]>,
      initialSkillScore: assessment.initialSkillScore,
      initialSkillConfidence: assessment.initialSkillConfidence,
      hasCertificate: assessment.hasCertificate,
      certificateImage: assessment.certificateImage,
    } satisfies PlayerAssessmentPayload;
  });
