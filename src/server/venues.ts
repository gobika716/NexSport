import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import type { Venue } from "@/db/schema";

export type VenueDTO = Venue;

export const listVenuesFn = createServerFn({ method: "GET" })
  .validator((d: { search?: string } | undefined) => d ?? {})
  .handler(async ({ data }) => {
    const rows = db
      .select()
      .from(schema.venues)
      .where(eq(schema.venues.isActive, true))
      .orderBy(schema.venues.name)
      .all();

    if (!data?.search) {
      return rows;
    }

    const query = data.search.toLowerCase().trim();
    return rows.filter(
      (v) =>
        v.name.toLowerCase().includes(query) ||
        v.area.toLowerCase().includes(query) ||
        v.address.toLowerCase().includes(query),
    );
  });
