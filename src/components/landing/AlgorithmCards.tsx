import { algorithms } from "@/data/algorithmData";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Icon } from "@/components/common/Icon";

export function AlgorithmCards() {
  return (
    <section className="bg-secondary/50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="Under the hood"
          title="The maths that keeps games fair"
          subtitle="No black boxes. Every ranking and pairing decision comes from logic you can read."
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {algorithms.map((a, i) => (
            <Reveal key={a.id} delay={i * 0.06}>
              <article className="card-soft group flex h-full flex-col p-7 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-navy/6 text-navy transition-colors group-hover:bg-lime/20">
                  <Icon name={a.icon} size={20} />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-ink">{a.title}</h3>
                <p className="mt-2.5 flex-1 text-sm leading-relaxed text-gray-text">
                  {a.description}
                </p>
                <code className="mt-5 block overflow-x-auto rounded-xl bg-navy px-4 py-3 font-mono text-[12px] whitespace-nowrap text-sky">
                  {a.formula}
                </code>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
