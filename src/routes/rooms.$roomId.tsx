import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRequireAuth, useAuth } from "@/lib/auth";
import {
  MapPin,
  Clock,
  Users,
  Navigation,
  ShieldCheck,
  ArrowLeft,
  Shuffle,
  ClipboardCheck,
  HeartPulse,
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/common/Button";
import { JoinRoomModal } from "@/components/modals/JoinRoomModal";
import { MatchFeedbackModal } from "@/components/modals/MatchFeedbackModal";
import { TeamRoster } from "@/components/rooms/TeamRoster";
import { RoomChat } from "@/components/rooms/RoomChat";
import { TeamBalanceCharts } from "@/components/rooms/TeamBalanceCharts";
import { LiveHeartRate } from "@/components/rooms/LiveHeartRate";
import { rulesFor } from "@/data/sportRules";
import type { MatchRoom } from "@/data/roomData";
import { getRoomFn, joinRoomFn, listRoomRostersFn } from "@/server/rooms";
import { listRoomMetricsFn, recordMetricsFn } from "@/server/metrics";
import { rosterFor, zigZagBalance } from "@/lib/teamBalance";
import { useGeolocation, haversineKm, formatDistanceKm } from "@/hooks/use-geolocation";
import { useLiveRefresh } from "@/lib/live";

const title = "Match Room Details — Players, Rules & Balanced Teams | NexSport";
const description =
  "See who is playing, the live GPS location, sport rules and the zig-zag balanced team breakdown before you claim a spot in a NexSport match room.";

export const Route = createFileRoute("/rooms/$roomId")({
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
  component: RoomDetailsPage,
});

function RoomDetailsPage() {
  useRequireAuth();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { roomId } = useParams({ from: "/rooms/$roomId" });
  const { position: myPosition } = useGeolocation();
  const [joinOpen, setJoinOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ room: MatchRoom; skill: string } | null>(null);

  const { data: room, isLoading } = useQuery({
    queryKey: ["rooms", roomId],
    queryFn: () => getRoomFn({ data: { id: roomId } }),
  });

  const { data: rosterRows = [] } = useQuery({
    queryKey: ["roster", roomId],
    queryFn: () => listRoomRostersFn({ data: { roomId } }),
    enabled: Boolean(roomId),
  });

  useLiveRefresh(true);

  if (isLoading) {
    return (
      <PageShell
        eyebrow="Match rooms"
        title="Loading room…"
        subtitle="Fetching match room details."
      >
        <div className="mx-auto mt-10 max-w-3xl px-5 text-center lg:px-8">
          <p className="text-sm text-gray-text">Loading…</p>
        </div>
      </PageShell>
    );
  }

  if (!room) {
    return (
      <PageShell
        eyebrow="Match rooms"
        title="Room not found"
        subtitle="This room may have been closed or the link is out of date."
      >
        <div className="mx-auto mt-10 max-w-3xl px-5 text-center lg:px-8">
          <Link
            to="/rooms"
            className="inline-flex items-center gap-2 text-sm font-semibold text-sky hover:underline"
          >
            <ArrowLeft size={15} /> Back to all rooms
          </Link>
        </div>
      </PageShell>
    );
  }

  const membership = user?.id
    ? (rosterRows.find((player) => player.id === user.id) ??
      (room.hostUserId === user.id
        ? { id: user.id, name: user.name, skill: room.skill, elo: user.elo ?? room.avgElo }
        : null))
    : null;
  const myJoin = membership ? { skill: membership.skill, roomId: room.id } : null;
  const rules = rulesFor(room.sport);
  const participants = rosterRows.length
    ? rosterRows.map((p) => ({
        name: p.name,
        skill: p.skill,
        elo: p.elo,
        isMe: p.isMe ?? user?.id === p.id,
      }))
    : rosterFor(room.id, Math.max(0, room.filled), room.avgElo);
  const projected = zigZagBalance(
    myJoin && !participants.some((p) => p.isMe)
      ? [...participants, { name: "You", elo: user?.elo ?? 1180, skill: myJoin.skill, isMe: true }]
      : participants,
  );
  const isClosed = room.status === "closed" || room.filled >= room.slots;

  return (
    <PageShell
      eyebrow={`${room.sport} · ${room.city}`}
      title={room.venue}
      subtitle={room.description ?? "Everything you need to know before claiming a spot."}
    >
      <div className="mx-auto mt-10 max-w-7xl px-5 lg:px-8">
        <Link
          to="/rooms"
          className="inline-flex items-center gap-2 text-sm font-semibold text-sky hover:underline"
        >
          <ArrowLeft size={15} /> All rooms
        </Link>

        <div className="card-soft mt-5 flex flex-col gap-5 p-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid gap-3 sm:grid-cols-3 sm:gap-8">
            <div className="flex items-center gap-2 text-sm text-gray-text">
              <Clock size={16} className="text-sky" /> {room.time}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-text">
              <Users size={16} className="text-sky" /> {room.filled}/{room.slots} · avg Elo{" "}
              {room.avgElo}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-text">
              <ShieldCheck size={16} className="text-sky" /> {room.skill}
            </div>
          </div>
          <Button
            size="lg"
            disabled={isClosed || Boolean(myJoin)}
            variant={isClosed ? "secondary" : "primary"}
            onClick={() => setJoinOpen(true)}
          >
            {isClosed ? "Room locked" : myJoin ? `Joined as ${myJoin.skill}` : "Join this room"}
          </Button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <section className="card-soft p-6 lg:col-span-2">
            <h2 className="font-display text-base font-semibold text-ink">
              Participants ({participants.length})
            </h2>
            <p className="mt-1 text-xs text-gray-text">Confirmed players and their seed ratings</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {participants.map((p, i) => (
                <li
                  key={`${p.name}-${i}`}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/60 px-4 py-3"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy text-xs font-bold text-white">
                      {p.name.slice(0, 1)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {p.name}
                        {p.name === room.host ? " · host" : ""}
                      </span>
                      <span className="block text-xs text-gray-text">{p.skill}</span>
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-bold text-navy">{p.elo}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card-soft p-6">
            <h2 className="font-display text-base font-semibold text-ink">Location</h2>
            <p className="mt-1 text-xs text-gray-text">
              {room.lat != null ? "Live GPS coordinates" : "Mock GPS coordinates for the prototype"}
            </p>
            <div className="relative mt-4 h-40 overflow-hidden rounded-2xl bg-secondary">
              <div
                className="absolute inset-0 opacity-70"
                style={{
                  backgroundImage:
                    "linear-gradient(0deg, rgba(32,183,243,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(32,183,243,.18) 1px, transparent 1px)",
                  backgroundSize: "26px 26px",
                }}
              />
              <span className="absolute top-1/2 left-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-sky/20">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-navy text-white">
                  <MapPin size={15} />
                </span>
              </span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-gray-text">
              <li className="flex items-center gap-2">
                <MapPin size={15} className="text-sky" /> {room.venue}, {room.city}
              </li>
              {room.lat != null && room.lng != null ? (
                <li className="flex items-center gap-2">
                  <Navigation size={15} className="text-sky" /> {room.lat.toFixed(4)}° N,{" "}
                  {room.lng.toFixed(4)}° E
                </li>
              ) : null}
              {myPosition && room.lat != null && room.lng != null ? (
                <li className="flex items-center gap-2">
                  <Navigation size={15} className="text-sky" />{" "}
                  {formatDistanceKm(
                    haversineKm(myPosition.lat, myPosition.lng, room.lat, room.lng),
                  )}{" "}
                  from you
                </li>
              ) : (
                <li className="flex items-center gap-2">
                  <Navigation size={15} className="text-sky" /> {room.distanceKm} km from you ·
                  approx {Math.max(5, Math.round(room.distanceKm * 4))} min drive
                </li>
              )}
            </ul>
          </section>

          <section className="card-soft p-6">
            <LiveHeartRate roomId={room.id} userId={user?.id} />
          </section>

          <section className="card-soft p-6">
            <h2 className="font-display text-base font-semibold text-ink">{room.sport} rules</h2>
            <p className="mt-1 text-xs text-gray-text">
              {rules.format} · {rules.duration}
            </p>
            <ul className="mt-4 space-y-2.5">
              {rules.rules.map((r) => (
                <li key={r} className="flex gap-2.5 text-sm leading-relaxed text-gray-text">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lime" />
                  {r}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs font-semibold text-ink">What to bring</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {rules.gear.map((g) => (
                <span
                  key={g}
                  className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-navy"
                >
                  {g}
                </span>
              ))}
            </div>
          </section>

          <RoomChat
            roomId={room.id}
            roomName={`${room.sport} · ${room.venue}`}
            canChat={Boolean(myJoin)}
          />

          <section className="card-soft p-6 lg:col-span-2">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
              <Shuffle size={16} className="text-sky" /> Projected balanced teams
            </h2>
            <p className="mt-1 text-xs text-gray-text">
              Preview from the zig-zag algorithm — regenerated when the room locks
            </p>
            <div className="mt-4">
              <TeamRoster teams={projected} compact />
            </div>
            <div className="mt-4">
              <TeamBalanceCharts teams={projected} />
            </div>
          </section>
        </div>

        {myJoin ? (
          <div className="card-soft mt-6 flex flex-col items-start justify-between gap-4 bg-secondary/60 p-7 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-display text-lg font-bold text-ink">Already played this one?</h2>
              <p className="mt-1 text-sm text-gray-text">
                Rate fairness, teammates and your own performance — it shows up on your dashboard.
              </p>
            </div>
            <Button size="lg" onClick={() => setFeedback({ room, skill: myJoin.skill })}>
              <ClipboardCheck size={17} /> Give post-match feedback
            </Button>
          </div>
        ) : null}
      </div>

      <JoinRoomModal
        room={joinOpen ? room : null}
        onClose={() => setJoinOpen(false)}
        onConfirmed={async (r, skill) => {
          const res = await joinRoomFn({
            data: {
              roomId: r.id,
              name: user?.name ?? "You",
              skill,
              ...(user?.id ? { userId: user.id } : {}),
            },
          });
          if (!res.ok) {
            toast.error(res.message ?? "Could not join this room.");
            return;
          }
          await queryClient.invalidateQueries({ queryKey: ["rooms", roomId] });
          await queryClient.invalidateQueries({ queryKey: ["messages", roomId] });
          toast.success("Spot confirmed", { description: `${r.sport} · ${r.venue}` });
        }}
        onGiveFeedback={(r, skill) => {
          setJoinOpen(false);
          setFeedback({ room: r, skill });
        }}
      />

      <MatchFeedbackModal
        room={feedback?.room ?? null}
        skill={feedback?.skill ?? "Intermediate"}
        onClose={() => setFeedback(null)}
      />
    </PageShell>
  );
}
