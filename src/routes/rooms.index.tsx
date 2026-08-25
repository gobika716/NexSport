import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRequireAuth, useAuth } from "@/lib/auth";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  MapPin,
  Clock,
  Users,
  Plus,
  Lock,
  ArrowRight,
  Map as MapIcon,
  LayoutGrid,
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/common/Button";
import { VenueMap } from "@/components/rooms/VenueMap";
import { CreateMatchModal } from "@/components/modals/CreateMatchModal";
import { JoinRoomModal } from "@/components/modals/JoinRoomModal";
import { MatchFeedbackModal } from "@/components/modals/MatchFeedbackModal";
import { type MatchRoom } from "@/data/roomData";
import { listRoomsFn, createRoomFn, joinRoomFn } from "@/server/rooms";
import { useGeolocation, haversineKm, formatDistanceKm } from "@/hooks/use-geolocation";
import { cn } from "@/lib/utils";
import { useLiveRefresh } from "@/lib/live";

const title = "Match Rooms — Create or Join Games Near You | NexSport";
const description =
  "Open a GPS-based NexSport match room with sport, ground, time, slots and skill band — or join nearby rooms filling up right now.";

export const Route = createFileRoute("/rooms/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RoomsPage,
});

const statusStyles: Record<MatchRoom["status"], string> = {
  open: "bg-lime/25 text-lime-deep",
  filling: "bg-sky/15 text-sky",
  closed: "bg-navy/8 text-gray-text",
};

function RoomsPage() {
  useRequireAuth();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { position: myPosition, status: gpsStatus } = useGeolocation();
  const [createOpen, setCreateOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [activeRoom, setActiveRoom] = useState<MatchRoom | null>(null);
  const [feedbackRoom, setFeedbackRoom] = useState<{ room: MatchRoom; skill: string } | null>(null);
  const [joinedIds, setJoinedIds] = useState<string[]>([]);

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => listRoomsFn(),
  });

  useLiveRefresh(true);

  const handleCreated = async (room: {
    sport: string;
    venue: string;
    date: string;
    players: number;
    skill: string;
  }) => {
    const created = await createRoomFn({
      data: {
        sport: room.sport,
        venue: room.venue,
        city: myPosition ? "Current location" : "Your area",
        distanceKm: 0,
        time: room.date
          ? new Date(room.date).toLocaleString(undefined, {
              weekday: "short",
              hour: "numeric",
              minute: "2-digit",
            })
          : "Time to be confirmed",
        slots: room.players,
        skill: room.skill,
        host: user?.name ?? "You",
        ...(user?.id ? { hostUserId: user.id } : {}),
        description: "Your room is live — nearby players have been notified.",
        ...(myPosition ? { lat: myPosition.lat, lng: myPosition.lng } : {}),
      },
    });
    setJoinedIds((prev) => [...prev, created.id]);
    await queryClient.invalidateQueries({ queryKey: ["rooms"] });
    toast.success("Match room created & joined as Host!", {
      description: `${created.sport} at ${created.venue} · ${created.slots} players`,
    });
  };

  const confirmJoin = async (room: MatchRoom, skill: string) => {
    if (joinedIds.includes(room.id)) return;
    const res = await joinRoomFn({
      data: {
        roomId: room.id,
        name: user?.name ?? "You",
        skill,
        ...(user?.id ? { userId: user.id } : {}),
      },
    });
    if (!res.ok) {
      toast.error(res.message ?? "Could not join this room.");
      return;
    }
    setJoinedIds((prev) => [...prev, room.id]);
    await queryClient.invalidateQueries({ queryKey: ["rooms"] });
    toast.success("Spot confirmed", {
      description: `${room.sport} · ${room.venue} · joined as ${skill}`,
    });
  };

  return (
    <PageShell
      eyebrow="Match rooms"
      title="Create a room. Fill it. Play fair."
      subtitle="Rooms are GPS-aware: nearby players get notified, and the room locks automatically once it is full or an hour before start."
    >
      <div className="mx-auto mt-10 max-w-7xl px-5 lg:px-8">
        <div className="card-soft flex flex-col items-start justify-between gap-4 bg-secondary/60 p-7 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Host your own match</h2>
            <p className="mt-1 text-sm text-gray-text">
              Sport, ground, date, slots and skill band — takes under a minute.
            </p>
          </div>
          <Button size="lg" onClick={() => setCreateOpen(true)}>
            <Plus size={18} />
            Create match room
          </Button>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Rooms near you</h2>
            {myPosition ? (
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-text">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-lime/25 text-lime-deep">
                  <MapPin size={12} />
                </span>
                Using your live location — distances are calculated in real time.
              </p>
            ) : gpsStatus === "locating" ? (
              <p className="mt-1 text-sm text-gray-text">Locating you…</p>
            ) : gpsStatus === "denied" || gpsStatus === "unsupported" ? (
              <p className="mt-1 text-sm text-gray-text">
                Location unavailable — showing stored distance estimates.
              </p>
            ) : null}
          </div>

          <div className="flex items-center rounded-full border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
                viewMode === "grid"
                  ? "bg-navy text-white shadow-sm"
                  : "text-gray-text hover:text-ink",
              )}
            >
              <LayoutGrid size={14} /> Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
                viewMode === "map"
                  ? "bg-navy text-white shadow-sm"
                  : "text-gray-text hover:text-ink",
              )}
            >
              <MapIcon size={14} /> Interactive Radar
            </button>
          </div>
        </div>

        {isLoading ? (
          <p className="mt-6 text-sm text-gray-text">Loading rooms…</p>
        ) : viewMode === "map" ? (
          <VenueMap
            rooms={rooms}
            className="mt-6"
            onSelectRoom={(id) => {
              const target = rooms.find((r) => r.id === id);
              if (target) setActiveRoom(target);
            }}
          />
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence initial={false}>
              {rooms.map((r) => {
                const pct = Math.round((r.filled / r.slots) * 100);
                const isClosed = r.status === "closed" || r.filled >= r.slots;
                const isHost = Boolean(user?.id && r.hostUserId === user.id);
                const hasJoined = joinedIds.includes(r.id) || isHost;
                return (
                  <motion.article
                    key={r.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="card-soft flex h-full flex-col p-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-lg font-semibold text-ink">
                          {r.sport}
                        </h3>
                        <p className="truncate text-sm text-gray-text">{r.venue}</p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase",
                          statusStyles[isClosed ? "closed" : r.status],
                        )}
                      >
                        {isClosed ? "Closed" : r.status}
                      </span>
                    </div>

                    <ul className="mt-4 space-y-2 text-sm text-gray-text">
                      <li className="flex items-center gap-2">
                        <MapPin size={15} className="shrink-0 text-sky" />
                        {r.city}{" "}
                        {myPosition && r.lat != null && r.lng != null ? (
                          <span className="text-ink">
                            ·{" "}
                            {formatDistanceKm(
                              haversineKm(myPosition.lat, myPosition.lng, r.lat, r.lng),
                            )}{" "}
                            away
                          </span>
                        ) : (
                          <span>· {r.distanceKm} km away</span>
                        )}
                      </li>
                      <li className="flex items-center gap-2">
                        <Clock size={15} className="shrink-0 text-sky" />
                        {r.time}
                      </li>
                      <li className="flex items-center gap-2">
                        <Users size={15} className="shrink-0 text-sky" />
                        {r.filled}/{r.slots} players · avg Elo {r.avgElo}
                      </li>
                    </ul>

                    {r.description ? (
                      <p className="mt-3 text-xs leading-relaxed text-gray-text">{r.description}</p>
                    ) : null}

                    <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="gradient-blue h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="mt-auto pt-5">
                      <span className="block truncate text-xs text-gray-text">
                        Host: {r.host} · {r.skill}
                      </span>
                      <div className="mt-3 flex items-center gap-2">
                        <Link
                          to="/rooms/$roomId"
                          params={{ roomId: r.id }}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-sky hover:text-sky"
                        >
                          View details <ArrowRight size={14} />
                        </Link>
                        <Button
                          size="sm"
                          variant={isClosed ? "secondary" : hasJoined ? "secondary" : "primary"}
                          disabled={isClosed}
                          onClick={() => {
                            if (hasJoined) {
                              router.navigate({ to: "/rooms/$roomId", params: { roomId: r.id } });
                            } else {
                              setActiveRoom(r);
                            }
                          }}
                        >
                          {isClosed ? (
                            <>
                              <Lock size={14} /> Locked
                            </>
                          ) : isHost ? (
                            "Joined (Host)"
                          ) : hasJoined ? (
                            "Joined"
                          ) : (
                            "Join room"
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <CreateMatchModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />

      <JoinRoomModal
        room={activeRoom}
        onClose={() => setActiveRoom(null)}
        onConfirmed={confirmJoin}
        onGiveFeedback={(room, skill) => {
          setActiveRoom(null);
          setFeedbackRoom({ room, skill });
        }}
      />

      <MatchFeedbackModal
        room={feedbackRoom?.room ?? null}
        skill={feedbackRoom?.skill ?? "Intermediate"}
        onClose={() => setFeedbackRoom(null)}
      />
    </PageShell>
  );
}
