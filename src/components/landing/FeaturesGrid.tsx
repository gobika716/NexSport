import { features } from "@/data/sportsData";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Icon } from "@/components/common/Icon";

export function FeaturesGrid() {
  return (
    <section id="features" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="Why NexSport"
          title="Everything a community player needs"
          subtitle="Nine building blocks that turn scattered pickup games into a properly run local sports scene."
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.id} delay={i * 0.06}>
              <article className="card-soft group h-full p-7 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-navy transition-colors group-hover:gradient-blue group-hover:text-white">
                  <Icon name={f.icon} />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-ink">{f.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-gray-text">{f.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
