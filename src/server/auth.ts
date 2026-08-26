import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import bcrypt from "bcryptjs";
import { calculateInitialSkill, type ExperienceLevel } from "@/lib/assessment";

export interface AuthResult {
  ok: boolean;
  message?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    mobileNumber?: string | null;
    city: string | null;
    elo: number;
    skillLevel?: string | null;
    profilePhoto?: string | null;
    certificateStatus?: string | null;
    accountStatus?: string | null;
    bio?: string | null;
    fairPlay?: number;
    reliability?: number;
    streak?: number;
    matchesPlayed?: number;
    hoursOnCourt?: number;
    createdAt?: string;
  };
}

function toUser(row: typeof schema.users.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    mobileNumber: row.mobileNumber,
    city: row.city,
    elo: row.elo,
    skillLevel: row.skillLevel,
    profilePhoto: row.profilePhoto,
    certificateStatus: row.certificateStatus,
    accountStatus: row.accountStatus,
    isAdmin: row.isAdmin,
    bio: row.bio ?? null,
    fairPlay: row.fairPlay,
    reliability: row.reliability,
    streak: row.streak,
    matchesPlayed: row.matchesPlayed,
    hoursOnCourt: row.hoursOnCourt,
    createdAt: row.createdAt,
  };
}

export const loginFn = createServerFn({ method: "POST" })
  .validator((d: { email: string; password: string }) => d)
  .handler(async ({ data }) => {
    const { email, password } = data;
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return { ok: false, message: "Please enter a valid email address." } satisfies AuthResult;
    }
    // Demo shortcut: accept hard‑coded demo credentials without DB lookup
    if (email === "demo@nexsport.app" && password === "demo1234") {
      const demoUser = {
        id: "u-demo",
        name: "Demo Player",
        email,
        mobileNumber: "9999999999",
        city: "Perundurai, Erode",
        elo: 1388,
        skillLevel: "Intermediate",
        profilePhoto: null,
        certificateStatus: "verified",
        accountStatus: "active",
      };
      return { ok: true, user: demoUser } satisfies AuthResult;
    }

    const row = db.select().from(schema.users).where(eq(schema.users.email, normalizedEmail)).get();

    if (!row) {
      return { ok: false, message: "No account found with that email." } satisfies AuthResult;
    }

    const valid = await bcrypt.compare(password, row.passwordHash);
    if (!valid) {
      return { ok: false, message: "Incorrect password. Try again." } satisfies AuthResult;
    }

    return { ok: true, user: toUser(row) } satisfies AuthResult;
  });

export const signupFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      name: string;
      email: string;
      password: string;
      mobileNumber?: string;
      city?: string | undefined;
      selectedGame?: string;
      experienceLevel?: ExperienceLevel;
      answers?: Record<string, string | string[]>;
      verificationType?: string;
      certificateName?: string;
      certificateData?: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    const { name, email, password, city, mobileNumber } = data;
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return { ok: false, message: "Please enter a valid email address." } satisfies AuthResult;
    }
    if (password.length < 8 || name.trim().length < 3 || !/^[6-9]\d{9}$/.test(mobileNumber ?? "")) {
      return {
        ok: false,
        message: "Please check your account details and try again.",
      } satisfies AuthResult;
    }
    const hasCertificate = data.verificationType === "Yes";
    let certificateImage: string | null = null;
    if (hasCertificate && data.certificateData) {
      const match = data.certificateData.match(
        /^data:(image\/(?:jpeg|png));base64,([A-Za-z0-9+/=]+)$/,
      );
      if (!match)
        return {
          ok: false,
          message: "Only JPG, JPEG, and PNG certificates are allowed.",
        } satisfies AuthResult;
      const bytes = Buffer.from(match[2], "base64");
      if (bytes.byteLength > 5 * 1024 * 1024)
        return { ok: false, message: "Certificate must be 5 MB or smaller." } satisfies AuthResult;
      certificateImage = data.certificateData;
    }

    const existing = db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, normalizedEmail))
      .get();

    if (existing) {
      return {
        ok: false,
        message: "An account already exists with this email. Please login instead.",
      } satisfies AuthResult;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const assessment =
      data.selectedGame && data.experienceLevel && data.answers && data.verificationType
        ? calculateInitialSkill({
            selectedGame: data.selectedGame as never,
            experienceLevel: data.experienceLevel,
            answers: data.answers,
            verificationType: data.verificationType,
          })
        : { initialSkillScore: 0, initialSkillConfidence: "Low" as const };
    const certificateStatus = data.verificationType === "Yes" ? "pending" : "not_provided";
    const accountStatus = data.verificationType === "Yes" ? "pending" : "active";
    const user = {
      id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      mobileNumber: mobileNumber?.trim() || null,
      passwordHash,
      city: city?.trim() || null,
      elo: 1200 + Math.round(assessment.initialSkillScore * 1.2),
      skillLevel: data.experienceLevel ?? null,
      profilePhoto: null,
      certificateStatus,
      accountStatus,
      matchesPlayed: 0,
      streak: 0,
      fairPlay: 0,
      reliability: 0,
      hoursOnCourt: 0,
      bio: null,
      createdAt: new Date().toISOString(),
    };

    db.insert(schema.users).values(user).run();

    if (data.selectedGame && data.experienceLevel && data.answers && data.verificationType) {
      const answers = data.answers;
      db.insert(schema.playerAssessments)
        .values({
          id: `assessment-${user.id}`,
          userId: user.id,
          selectedGame: data.selectedGame,
          experienceLevel: data.experienceLevel,
          yearsOfExperience: String(answers.yearsOfExperience ?? ""),
          playingFrequency: String(answers.playingFrequency ?? ""),
          tournamentExperience: String(answers.tournamentExperience ?? ""),
          preferredRole: answers.preferredRole ? String(answers.preferredRole) : null,
          preferredEvent: answers.preferredEvent ? String(answers.preferredEvent) : null,
          playingStyle: answers.playingStyle ? String(answers.playingStyle) : null,
          strengths: JSON.stringify(answers.strengths ?? []),
          improvementAreas: JSON.stringify(answers.improvementAreas ?? []),
          matchesPerMonth: String(answers.matchesPerMonth ?? ""),
          answers: JSON.stringify(answers),
          initialSkillScore: assessment.initialSkillScore,
          initialSkillConfidence: assessment.initialSkillConfidence,
          verificationType: data.verificationType,
          hasCertificate,
          certificateImage,
          certificatePath: null,
          certificateStatus: certificateStatus === "pending" ? "pending" : null,
          verifiedAt: null,
          videoPath: null,
          createdAt: user.createdAt,
          updatedAt: user.createdAt,
        })
        .run();
    }

    return {
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        city: user.city,
        elo: user.elo,
        skillLevel: user.skillLevel,
        profilePhoto: user.profilePhoto,
        certificateStatus: user.certificateStatus,
        accountStatus: user.accountStatus,
        bio: null,
        fairPlay: 0,
        reliability: 0,
        streak: 0,
        matchesPlayed: 0,
        hoursOnCourt: 0,
        createdAt: user.createdAt,
      },
    } satisfies AuthResult;
  });

export const getUserByIdFn = createServerFn({ method: "GET" })
  .validator((d: { userId: string }) => d)
  .handler(async ({ data }) => {
    const row = db.select().from(schema.users).where(eq(schema.users.id, data.userId)).get();
    if (!row) return null;
    return toUser(row);
  });
