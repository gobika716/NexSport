import { ArrowDown } from "lucide-react";
import { steps } from "@/data/sportsData";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Icon } from "@/components/common/Icon";

export function HowItWorks() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-4xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="From sign-up to first fair game"
          subtitle="Ten steps from registration to an updated rating — the platform handles the hard parts in between."
        />

        <div className="mt-14">
          {steps.map((step, i) => (
            <div key={step.id}>
              <Reveal delay={i * 0.05}>
                <article className="card-soft grid grid-cols-[auto_minmax(0,1fr)] items-start gap-5 p-6 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] sm:p-7">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl gradient-blue font-display text-lg font-bold text-white">
                    {step.id}
                  </span>
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <Icon name={step.icon} size={18} className="shrink-0 text-sky" />
                      <h3 className="truncate font-display text-lg font-semibold text-ink">
                        {step.title}
                      </h3>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-gray-text">
                      {step.description}
                    </p>
                  </div>
                </article>
              </Reveal>

              {i < steps.length - 1 ? (
                <div className="flex justify-center py-3" aria-hidden>
                  <ArrowDown size={18} className="text-sky/60" />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
