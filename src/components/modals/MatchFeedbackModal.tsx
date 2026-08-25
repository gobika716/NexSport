import { useEffect, useState } from "react";
import { Star, Send } from "lucide-react";
import { toast } from "sonner";
import { ModalShell } from "./ModalShell";
import { Button } from "@/components/common/Button";
import { addFeedbackFn } from "@/server/feedback";
import { useAuth } from "@/lib/auth";
import type { MatchRoom } from "@/data/roomData";
import { cn } from "@/lib/utils";

interface MatchFeedbackModalProps {
  room: MatchRoom | null;
  skill: string;
  onClose: () => void;
}

function StarRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-ink">{label}</span>
        <span className="text-xs text-gray-text">{value}/5</span>
      </div>
      <p className="text-xs text-gray-text">{hint}</p>
      <div className="mt-2 flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${label}: ${n} of 5`}
            onClick={() => onChange(n)}
            className="rounded-full p-1 transition-transform hover:scale-110"
          >
            <Star
              size={22}
              className={cn(
                "transition-colors",
                n <= value ? "fill-lime text-lime-deep" : "text-border",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function MatchFeedbackModal({ room, skill, onClose }: MatchFeedbackModalProps) {
  const { user } = useAuth();
  const [fairness, setFairness] = useState(4);
  const [teammates, setTeammates] = useState(4);
  const [performance, setPerformance] = useState(3);
  const [result, setResult] = useState<"Win" | "Loss" | "Draw">("Win");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!room) return;
    setFairness(4);
    setTeammates(4);
    setPerformance(3);
    setResult("Win");
    setComment("");
  }, [room]);

  if (!room) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addFeedbackFn({
      data: {
        roomId: room.id,
        ...(user?.id ? { userId: user.id } : {}),
        sport: room.sport,
        venue: room.venue,
        date: "Today",
        skill,
        fairness,
        teammates,
        performance,
        result,
        comment: comment.trim().slice(0, 300),
      },
    });
    toast.success("Feedback submitted", {
      description: "Your ratings now appear on your dashboard.",
    });
    onClose();
  };

  return (
    <ModalShell
      open={Boolean(room)}
      onClose={onClose}
      title="Post-match feedback"
      subtitle={`${room.sport} · ${room.venue}`}
    >
      <form onSubmit={submit} className="space-y-5">
        <div>
          <span className="text-sm font-semibold text-ink">Result</span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(["Win", "Draw", "Loss"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setResult(r)}
                className={cn(
                  "rounded-full border px-3 py-2 text-sm font-semibold transition-all",
                  result === r
                    ? "border-sky bg-sky/10 text-sky"
                    : "border-border text-gray-text hover:border-sky/60",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <StarRow
          label="Team fairness"
          hint="Were the balanced sides evenly matched?"
          value={fairness}
          onChange={setFairness}
        />
        <StarRow
          label="Teammates & fair play"
          hint="Attitude, punctuality and sportsmanship"
          value={teammates}
          onChange={setTeammates}
        />
        <StarRow
          label="Your own performance"
          hint="Honest self-rating feeds your skill profile"
          value={performance}
          onChange={setPerformance}
        />

        <label className="block">
          <span className="text-sm font-semibold text-ink">Anything to add? (optional)</span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 300))}
            rows={3}
            maxLength={300}
            placeholder="Great tempo, courts were a bit slippery near the net…"
            className="mt-2 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-ink outline-none focus:border-sky"
          />
        </label>

        <Button type="submit" size="lg" className="w-full">
          <Send size={16} /> Submit feedback
        </Button>
        <p className="text-center text-xs text-gray-text">
          Mock submission — stored locally for this prototype.
        </p>
      </form>
    </ModalShell>
  );
}
