import { CheckCircle2 } from "lucide-react";
import { Reveal } from "@/components/common/Reveal";
import { mockMatches } from "@/data/mockMatches";

const points = [
  "No more endless group chats to fill a single slot",
  "Skill-aware matching so games stay competitive",
  "Transparent ratings that update after every result",
];

export function AboutSection() {
  return (
    <section id="about" className="bg-secondary/50 py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2 lg:px-8">
        <Reveal>
          <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold tracking-wide text-navy uppercase">
            About NexSport
          </span>
          <h2 className="mt-4 text-3xl font-bold text-ink sm:text-4xl">
            Local sport, organised properly
          </h2>
          <p className="mt-5 leading-relaxed text-gray-text">
            Community sport breaks down on two problems: finding enough people, and finding the
            right people. NexSport solves both. We map every player to a rating derived from a
            structured skill assessment, then keep that rating honest with an Elo model that reacts
            to real results.
          </p>
          <p className="mt-4 leading-relaxed text-gray-text">
            Around that sits everything an organiser actually needs — geo-ranked discovery, one-tap
            match creation, automatic team balancing, and a performance layer that turns your
            history into insight instead of a spreadsheet.
          </p>
          <ul className="mt-7 space-y-3">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-ink">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-lime" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.15} className="space-y-4">
          {mockMatches.map((m) => (
            <div
              key={m.id}
              className="card-soft grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 p-5 hover:shadow-[var(--shadow-lift)]"
            >
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <h3 className="truncate font-display text-base font-semibold text-ink">
                    {m.sport}
                  </h3>
                  <span className="shrink-0 rounded-full bg-lime/15 px-2 py-0.5 text-[11px] font-semibold text-navy">
                    Avg {m.avgElo}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-gray-text">
                  {m.venue} · {m.distanceKm} km
                </p>
                <p className="mt-0.5 text-xs text-gray-text">{m.time}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-display text-lg font-bold text-navy">
                  {m.filled}/{m.slots}
                </p>
                <p className="text-xs text-gray-text">slots filled</p>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
