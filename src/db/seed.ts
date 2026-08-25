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
    createdAt: new Date().toISOString(),
  });

  console.log("Seeding complete ✅ (demo user only)");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seeding failed", err);
    process.exit(1);
  });
