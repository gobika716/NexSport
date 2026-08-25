import { Star, ClipboardCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { listFeedbackFn } from "@/server/feedback";
import { cn } from "@/lib/utils";

function Stars({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={13}
          className={cn(n <= value ? "fill-lime text-lime-deep" : "text-border")}
        />
      ))}
    </span>
  );
}

export function FeedbackPanel() {
  const { user } = useAuth();
  const { data: feedback = [] } = useQuery({
    queryKey: ["feedback", user?.id ?? "public"],
    queryFn: () => listFeedbackFn({ data: user?.id ? { userId: user.id } : {} }),
    enabled: Boolean(user),
  });

  const avg = (key: "fairness" | "teammates" | "performance") =>
    feedback.length ? (feedback.reduce((s, f) => s + f[key], 0) / feedback.length).toFixed(1) : "—";

  return (
    <section className="card-soft mt-6 p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-accent text-navy">
          <ClipboardCheck size={18} />
        </span>
        <div>
          <h2 className="font-display text-base font-semibold text-ink">Post-match feedback</h2>
          <p className="text-xs text-gray-text">Your submitted ratings from matches you joined</p>
        </div>
      </div>

      {feedback.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-secondary/60 px-4 py-5 text-sm text-gray-text">
          No feedback yet. Join a room from{" "}
          <Link to="/rooms" className="font-semibold text-sky hover:underline">
            Match Rooms
          </Link>{" "}
          and rate the match to see your averages here.
        </p>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Avg team fairness", value: avg("fairness") },
              { label: "Avg teammate rating", value: avg("teammates") },
              { label: "Avg self performance", value: avg("performance") },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-secondary/60 px-4 py-4">
                <p className="text-2xl font-bold text-ink">{s.value}</p>
                <p className="text-xs font-semibold text-gray-text">{s.label}</p>
              </div>
            ))}
          </div>

          <ul className="mt-5 space-y-3">
            {feedback.slice(0, 5).map((f) => (
              <li key={f.id} className="rounded-2xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-ink">
                    {f.sport} · {f.venue}
                  </span>
                  <span className="flex items-center gap-2 text-xs text-gray-text">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-bold",
                        f.result === "Win"
                          ? "bg-lime/25 text-lime-deep"
                          : f.result === "Loss"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-secondary text-gray-text",
                      )}
                    >
                      {f.result}
                    </span>
                    {f.date}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-text">
                  <span className="flex items-center gap-2">
                    Fairness <Stars value={f.fairness} />
                  </span>
                  <span className="flex items-center gap-2">
                    Teammates <Stars value={f.teammates} />
                  </span>
                  <span className="flex items-center gap-2">
                    You <Stars value={f.performance} />
                  </span>
                </div>
                {f.comment ? (
                  <p className="mt-3 text-xs leading-relaxed text-gray-text">“{f.comment}”</p>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
