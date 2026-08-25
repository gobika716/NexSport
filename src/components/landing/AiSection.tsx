import { aiCards } from "@/data/algorithmData";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Icon } from "@/components/common/Icon";

export function AiSection() {
  return (
    <section className="relative overflow-hidden gradient-blue py-20 lg:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-sky/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 -left-24 h-80 w-80 rounded-full bg-lime/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          tone="dark"
          eyebrow="Intelligence layer"
          title="AI that actually reads your game"
          subtitle="Summaries, coaching and trend detection generated from your own match history."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {aiCards.map((c, i) => (
            <Reveal key={c.id} delay={i * 0.08}>
              <article className="glass-card h-full p-7 transition-transform duration-300 hover:-translate-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/12 text-sky">
                    <Icon name={c.icon} size={20} />
                  </span>
                  <span className="rounded-full bg-lime/20 px-2.5 py-1 text-[11px] font-bold tracking-wide text-lime uppercase">
                    AI
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-white">{c.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-white/70">{c.description}</p>
                <p className="mt-5 rounded-2xl bg-white/8 p-4 text-sm leading-relaxed text-white/85 italic">
                  {c.sample}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
