import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Users, Loader2, Shuffle, ClipboardCheck } from "lucide-react";
import { ModalShell } from "./ModalShell";
import { Button } from "@/components/common/Button";
import { TeamBalanceCharts } from "@/components/rooms/TeamBalanceCharts";
import { TeamRoster } from "@/components/rooms/TeamRoster";
import type { MatchRoom } from "@/data/roomData";
import { rosterFor, skillLevels, zigZagBalance } from "@/lib/teamBalance";
import { cn } from "@/lib/utils";

type Stage = "form" | "balancing" | "confirmed";

interface JoinRoomModalProps {
  room: MatchRoom | null;
  onClose: () => void;
  onConfirmed: (room: MatchRoom, skill: string) => void;
  onGiveFeedback?: (room: MatchRoom, skill: string) => void;
}

export function JoinRoomModal({ room, onClose, onConfirmed, onGiveFeedback }: JoinRoomModalProps) {
  const [stage, setStage] = useState<Stage>("form");
  const [skill, setSkill] = useState<string>("Intermediate");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (room) {
      setStage("form");
      setSkill("Intermediate");
      setNote("");
    }
  }, [room]);

  useEffect(() => {
    if (stage !== "balancing") return;
    const t = window.setTimeout(() => setStage("confirmed"), 1200);
    return () => window.clearTimeout(t);
  }, [stage]);

  if (!room) return null;

  const selected = skillLevels.find((s) => s.id === skill) ?? skillLevels[1];
  const teams = zigZagBalance([
    ...rosterFor(room.id, Math.max(0, room.slots - 1), room.avgElo),
    { name: "You", elo: selected.elo, skill, isMe: true },
  ]);

  const confirm = () => {
    onConfirmed(room, skill);
    onClose();
  };

  return (
    <ModalShell
      open={Boolean(room)}
      onClose={onClose}
      title={stage === "confirmed" ? "You're in!" : `Join ${room.sport}`}
      subtitle={
        stage === "confirmed"
          ? "Your spot is locked and teams have been balanced."
          : `${room.venue} · ${room.time} · ${room.filled}/${room.slots} players`
      }
      wide={stage === "confirmed"}
    >
      {stage === "form" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setStage("balancing");
          }}
          className="space-y-5"
        >
          <div>
            <span className="text-sm font-semibold text-ink">Your skill level</span>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {skillLevels.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSkill(s.id)}
                  className={cn(
                    "rounded-2xl border p-3 text-left transition-all",
                    skill === s.id
                      ? "border-sky bg-sky/8 shadow-[var(--shadow-soft)]"
                      : "border-border hover:border-sky/60",
                  )}
                >
                  <span className="block text-sm font-semibold text-ink">{s.id}</span>
                  <span className="block text-xs text-gray-text">{s.hint}</span>
                  <span className="mt-1 block text-xs font-bold text-sky">seed Elo ~{s.elo}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-ink">Note for the host (optional)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 200))}
              rows={2}
              maxLength={200}
              placeholder="Bringing my own racquet, may arrive 5 min late…"
              className="mt-2 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-ink outline-none focus:border-sky"
            />
          </label>

          <div className="rounded-2xl bg-secondary/70 px-4 py-3 text-xs text-gray-text">
            Room avg Elo is {room.avgElo}. Your seed rating feeds the zig-zag algorithm that
            balances both sides.
          </div>

          <Button type="submit" size="lg" className="w-full">
            <Users size={17} /> Confirm my spot
          </Button>
        </form>
      ) : stage === "balancing" ? (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <Loader2 size={30} className="animate-spin text-sky" />
          <p className="text-sm font-semibold text-ink">Running zig-zag team balancing…</p>
          <p className="text-xs text-gray-text">Seeding you at ~{selected.elo} Elo</p>
        </div>
      ) : (
        <div className="space-y-5">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-3 rounded-2xl bg-lime/20 px-4 py-3"
          >
            <CheckCircle2 size={20} className="shrink-0 text-lime-deep" />
            <p className="text-sm font-semibold text-lime-deep">
              Spot confirmed as {skill} · seed Elo {selected.elo}
            </p>
          </motion.div>

          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Shuffle size={15} className="text-sky" /> Balanced teams
          </div>
          <TeamRoster teams={teams} compact />

          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            Balance breakdown
          </div>
          <TeamBalanceCharts teams={teams} />

          <div className="flex flex-col gap-3 sm:flex-row">
            {onGiveFeedback ? (
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={() => {
                  onConfirmed(room, skill);
                  onGiveFeedback(room, skill);
                }}
              >
                <ClipboardCheck size={16} /> Rate the match
              </Button>
            ) : null}
            <Button size="lg" className="flex-1" onClick={confirm}>
              Done
            </Button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
