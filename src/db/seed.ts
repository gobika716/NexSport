import { db, schema } from "./client";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding NexSport database…");

  // Clear existing data (in dependency order)
  db.delete(schema.messages).run();
  db.delete(schema.roomMembers).run();
  db.delete(schema.feedback).run();
  db.delete(schema.playerMetrics).run();
  db.delete(schema.eloHistory).run();
  db.delete(schema.matches).run();
  db.delete(schema.rooms).run();
  db.delete(schema.users).run();

  // Seed only the demo user — rooms, chat and matches are created live in-app.
  const passwordHash = await bcrypt.hash("demo1234", 10);
  await db.insert(schema.users).values({
    id: "u-demo",
    name: "Demo Player",
    email: "demo@nexsport.app",
    passwordHash,
    city: "Perundurai, Erode",
    elo: 1388,
    fairPlay: 9.6,
    reliability: 97,
    streak: 5,
    hoursOnCourt: 24,
    skillLevel: "Intermediate",
    certificateStatus: "verified",
    accountStatus: "active",
    isAdmin: true,
    createdAt: new Date().toISOString(),
  });

  await db.insert(schema.playerAssessments)
    .values({
      id: "assessment-u-demo",
      userId: "u-demo",
      selectedGame: "cricket",
      experienceLevel: "Intermediate",
      yearsOfExperience: "3–5 years",
      playingFrequency: "3–4 times a week",
      tournamentExperience: "State level",
      preferredRole: "All-rounder",
      preferredEvent: null,
      playingStyle: "All-round",
      strengths: JSON.stringify(["Batting", "Bowling", "Fielding"]),
      improvementAreas: JSON.stringify(["Running Between Wickets", "Bowling"]),
      matchesPerMonth: "6–10",
      answers: JSON.stringify({}),
      initialSkillScore: 65,
      initialSkillConfidence: "High",
      verificationType: "Yes",
      hasCertificate: true,
      certificateImage: null,
      certificatePath: null,
      certificateStatus: "verified",
      verifiedAt: new Date().toISOString(),
      videoPath: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .run();

  console.log("Seeding complete ✅ (demo user only)");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seeding failed", err);
    process.exit(1);
  });
