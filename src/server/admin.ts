import { createServerFn } from "@tanstack/react-start";
import { eq, like, sql, asc, desc, SQL, and, or } from "drizzle-orm";
import { db, schema } from "@/db/client";

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  mobileNumber: string | null;
  city: string | null;
  sport: string | null;
  experienceLevel: string | null;
  skillLevel: string | null;
  certificateStatus: string | null;
  accountStatus: string | null;
  isAdmin: boolean;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  verifiedPlayers: number;
  pendingVerification: number;
  rejectedCertificates: number;
  totalSports: number;
  sportWiseCounts: { sport: string; players: number }[];
}

export interface AdminDetailsPayload {
  user: AdminUserRow;
  assessment: {
    selectedGame: string;
    experienceLevel: string;
    yearsOfExperience: string;
    playingFrequency: string;
    tournamentExperience: string;
    preferredRole: string | null;
    preferredEvent: string | null;
    playingStyle: string | null;
    strengths: string[];
    improvementAreas: string[];
    matchesPerMonth: string;
    initialSkillScore: number;
    initialSkillConfidence: string;
    verificationType: string;
    hasCertificate: boolean;
    certificateImage: string | null;
    certificateStatus: string | null;
    verifiedAt: string | null;
    answers: Record<string, string | string[]>;
  } | null;
}

function mapUserRow(
  row: typeof schema.users.$inferSelect & {
    selectedGame?: string | null;
    experienceLevel?: string | null;
  },
): AdminUserRow {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    mobileNumber: row.mobileNumber,
    city: row.city,
    sport: row.selectedGame ?? null,
    experienceLevel: row.experienceLevel ?? null,
    skillLevel: row.skillLevel,
    certificateStatus: row.certificateStatus,
    accountStatus: row.accountStatus,
    isAdmin: row.isAdmin,
    createdAt: row.createdAt,
  };
}

export const getAdminStatsFn = createServerFn({ method: "GET" }).handler(async () => {
  const users = db.select().from(schema.users).all();
  const assessments = db.select().from(schema.playerAssessments).all();
  const assessmentMap = new Map(assessments.map((a) => [a.userId, a]));

  const totalUsers = users.length;
  let verifiedPlayers = 0;
  let pendingVerification = 0;
  let rejectedCertificates = 0;
  const sportMap = new Map<string, number>();

  for (const u of users) {
    const assessment = assessmentMap.get(u.id);
    const certStatus = assessment?.certificateStatus ?? u.certificateStatus ?? "not_provided";
    if (certStatus === "verified") verifiedPlayers += 1;
    else if (certStatus === "pending") pendingVerification += 1;
    else if (certStatus === "rejected") rejectedCertificates += 1;

    const sport = assessment?.selectedGame ?? u.skillLevel;
    if (sport) {
      sportMap.set(sport, (sportMap.get(sport) ?? 0) + 1);
    }
  }

  return {
    totalUsers,
    verifiedPlayers,
    pendingVerification,
    rejectedCertificates,
    totalSports: sportMap.size,
    sportWiseCounts: Array.from(sportMap.entries())
      .map(([sport, players]) => ({ sport, players }))
      .sort((a, b) => b.players - a.players),
  } satisfies AdminStats;
});

export const listUsersFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      search?: string;
      sport?: string;
      certificateStatus?: string;
      sortBy?: "date" | "name";
      sortOrder?: "asc" | "desc";
    }) => d,
  )
  .handler(async ({ data }) => {
    const { search, sport, certificateStatus, sortBy = "date", sortOrder = "desc" } = data;

    const assessments = db.select().from(schema.playerAssessments).all();
    const assessmentMap = new Map(assessments.map((a) => [a.userId, a]));

    const query = db.select().from(schema.users);

    const conditions: SQL[] = [];
    if (search) {
      const term = `%${search}%`;
      conditions.push(or(like(schema.users.name, term), like(schema.users.email, term)));
    }
    if (certificateStatus && certificateStatus !== "all") {
      if (certificateStatus === "not_provided") {
        conditions.push(
          sql`${schema.users.certificateStatus} IS NULL OR ${schema.users.certificateStatus} = 'not_provided'`,
        );
      } else {
        conditions.push(eq(schema.users.certificateStatus, certificateStatus));
      }
    }

    let rows = conditions.length > 0 ? query.where(and(...conditions)).all() : query.all();

    rows = rows.filter((u) => {
      if (!sport || sport === "all") return true;
      const assessment = assessmentMap.get(u.id);
      const userSport = assessment?.selectedGame ?? u.skillLevel;
      return userSport === sport;
    });

    const sports = Array.from(new Set(assessments.map((a) => a.selectedGame))).filter(
      Boolean,
    ) as string[];

    const orderFn = sortOrder === "asc" ? asc : desc;
    if (sortBy === "name") {
      rows.sort(orderFn((a, b) => a.name.localeCompare(b.name)));
    } else {
      rows.sort(
        orderDesc((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      );
    }

    return {
      users: rows.map((r) =>
        mapUserRow({
          ...r,
          selectedGame: assessmentMap.get(r.id)?.selectedGame ?? null,
          experienceLevel: assessmentMap.get(r.id)?.experienceLevel ?? null,
        }),
      ),
      sports,
    };
  });

function orderDesc<T>(fn: (a: T, b: T) => number) {
  return (a: T, b: T) => fn(b, a);
}

export const getUserDetailsFn = createServerFn({ method: "GET" })
  .validator((d: { userId: string }) => d)
  .handler(async ({ data }) => {
    const user = db.select().from(schema.users).where(eq(schema.users.id, data.userId)).get();
    if (!user) return null;

    const assessment = db
      .select()
      .from(schema.playerAssessments)
      .where(eq(schema.playerAssessments.userId, data.userId))
      .get();

    return {
      user: mapUserRow({
        ...user,
        selectedGame: assessment?.selectedGame ?? null,
        experienceLevel: assessment?.experienceLevel ?? null,
      }),
      assessment: assessment
        ? {
            selectedGame: assessment.selectedGame,
            experienceLevel: assessment.experienceLevel,
            yearsOfExperience: assessment.yearsOfExperience,
            playingFrequency: assessment.playingFrequency,
            tournamentExperience: assessment.tournamentExperience,
            preferredRole: assessment.preferredRole,
            preferredEvent: assessment.preferredEvent,
            playingStyle: assessment.playingStyle,
            strengths: JSON.parse(assessment.strengths) as string[],
            improvementAreas: JSON.parse(assessment.improvementAreas) as string[],
            matchesPerMonth: assessment.matchesPerMonth,
            initialSkillScore: assessment.initialSkillScore,
            initialSkillConfidence: assessment.initialSkillConfidence,
            verificationType: assessment.verificationType,
            hasCertificate: assessment.hasCertificate,
            certificateImage: assessment.certificateImage,
            certificateStatus: assessment.certificateStatus,
            verifiedAt: assessment.verifiedAt,
            answers: JSON.parse(assessment.answers) as Record<string, string | string[]>,
          }
        : null,
    } satisfies AdminDetailsPayload;
  });

export const updateCertificateStatusFn = createServerFn({ method: "POST" })
  .validator(
    (d: { userId: string; status: "pending" | "verified" | "rejected" | "not_provided" }) => d,
  )
  .handler(async ({ data }) => {
    const user = db.select().from(schema.users).where(eq(schema.users.id, data.userId)).get();
    if (!user) {
      return { ok: false, message: "User not found." };
    }

    const now = new Date().toISOString();
    db.update(schema.users)
      .set({
        certificateStatus: data.status,
        accountStatus:
          data.status === "verified"
            ? "active"
            : data.status === "rejected"
              ? "suspended"
              : "pending",
      })
      .where(eq(schema.users.id, data.userId))
      .run();

    const assessment = db
      .select()
      .from(schema.playerAssessments)
      .where(eq(schema.playerAssessments.userId, data.userId))
      .get();

    if (assessment) {
      db.update(schema.playerAssessments)
        .set({
          certificateStatus: data.status,
          verifiedAt: data.status === "verified" ? now : null,
          updatedAt: now,
        })
        .where(eq(schema.playerAssessments.userId, data.userId))
        .run();
    }

    return { ok: true };
  });
