import { useState } from "react";
import { ModalShell } from "./ModalShell";
import { Button } from "@/components/common/Button";
import { Sparkles, Trophy, Target, Calendar, CheckCircle2, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

export function OnboardingModal({ open, onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [sport, setSport] = useState("Badminton");
  const [skill, setSkill] = useState("Intermediate");
  const [frequency, setFrequency] = useState("2-3 times a week");
  const [goal, setGoal] = useState("Improve Elo rating & competitive matches");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    startingElo: number;
    recommendedBand: string;
    advice: string;
  } | null>(null);

  const sports = ["Badminton", "Football", "Cricket", "Tennis", "Basketball"];
  const skills = ["Beginner", "Intermediate", "Advanced", "Pro"];
  const frequencies = ["1 day a week", "2-3 times a week", "4+ times a week"];
  const goals = [
    "Improve Elo rating & competitive matches",
    "Find friendly local casual games",
    "Track match fitness & heart rate",
    "Build team consistency & climb leaderboards",
  ];

  const runAiAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => {
      let baseElo = 1200;
      if (skill === "Beginner") baseElo = 1050;
      if (skill === "Intermediate") baseElo = 1250;
      if (skill === "Advanced") baseElo = 1420;
      if (skill === "Pro") baseElo = 1580;

      let band = "Intermediate Player";
      if (baseElo >= 1400) band = "Competitive Contender";
      if (baseElo < 1150) band = "Rising Athlete";

      setResult({
        startingElo: baseElo,
        recommendedBand: band,
        advice: `Based on your ${frequency} commitment in ${sport}, we've calibrated your seed Elo to ${baseElo}. Join ${skill} rooms to start matching with balanced opponents.`,
      });
      setAnalyzing(false);
      toast.success("AI Profile Created!", {
        description: `Recommended starting Elo: ${baseElo}`,
      });
    }, 1200);
  };

  const handleReset = () => {
    setStep(1);
    setResult(null);
    onClose();
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="AI Player Onboarding"
      subtitle="Answer 4 quick questions to get personalized court recommendations and seed Elo calibration."
    >
      {analyzing ? (
        <div className="py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-navy text-sky shadow-lg animate-pulse">
            <Bot size={32} />
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-ink">
            Analyzing Your Athletic Profile…
          </h3>
          <p className="mt-1 text-sm text-gray-text">
            Synthesizing sport rules, skill bands & Elo baseline...
          </p>
        </div>
      ) : result ? (
        <div className="space-y-5 py-2">
          <div className="gradient-blue rounded-3xl p-6 text-white text-center shadow-md">
            <span className="inline-flex items-center gap-1 rounded-full bg-lime/25 px-3 py-1 text-xs font-bold text-lime">
              <Sparkles size={14} /> AI Analysis Complete
            </span>
            <h3 className="mt-3 font-display text-2xl font-bold">{result.recommendedBand}</h3>
            <p className="mt-1 text-sm text-white/80">
              Estimated Seed Elo: <span className="font-bold text-lime">{result.startingElo}</span>
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-secondary/60 p-4 text-sm leading-relaxed text-ink">
            <p className="font-semibold text-sky flex items-center gap-1.5">
              <CheckCircle2 size={16} /> AI Coach Recommendation:
            </p>
            <p className="mt-1.5 text-gray-text">{result.advice}</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="primary" size="md" onClick={handleReset} className="w-full">
              Start Playing Matches
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between text-xs font-semibold text-gray-text">
            <span>Question {step} of 4</span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-2 w-7 rounded-full transition-all",
                    i <= step ? "bg-sky" : "bg-border",
                  )}
                />
              ))}
            </div>
          </div>

          {/* Question 1: Preferred Sport */}
          {step === 1 && (
            <div>
              <h3 className="font-display text-base font-bold text-ink flex items-center gap-2">
                <Trophy size={18} className="text-sky" /> What is your primary sport?
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {sports.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSport(s)}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-sm font-semibold transition-all text-left",
                      sport === s
                        ? "border-sky bg-accent text-navy shadow-sm"
                        : "border-border bg-card text-ink hover:border-sky/50",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Question 2: Skill Assessment */}
          {step === 2 && (
            <div>
              <h3 className="font-display text-base font-bold text-ink flex items-center gap-2">
                <Target size={18} className="text-sky" /> How do you assess your current skill level
                in {sport}?
              </h3>
              <div className="mt-4 space-y-2">
                {skills.map((sk) => (
                  <button
                    key={sk}
                    type="button"
                    onClick={() => setSkill(sk)}
                    className={cn(
                      "w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition-all text-left flex items-center justify-between",
                      skill === sk
                        ? "border-sky bg-accent text-navy shadow-sm"
                        : "border-border bg-card text-ink hover:border-sky/50",
                    )}
                  >
                    <span>{sk}</span>
                    {skill === sk && <CheckCircle2 size={16} className="text-navy" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Question 3: Play Frequency */}
          {step === 3 && (
            <div>
              <h3 className="font-display text-base font-bold text-ink flex items-center gap-2">
                <Calendar size={18} className="text-sky" /> How often do you play or train?
              </h3>
              <div className="mt-4 space-y-2">
                {frequencies.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFrequency(f)}
                    className={cn(
                      "w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition-all text-left flex items-center justify-between",
                      frequency === f
                        ? "border-sky bg-accent text-navy shadow-sm"
                        : "border-border bg-card text-ink hover:border-sky/50",
                    )}
                  >
                    <span>{f}</span>
                    {frequency === f && <CheckCircle2 size={16} className="text-navy" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Question 4: Primary Goal */}
          {step === 4 && (
            <div>
              <h3 className="font-display text-base font-bold text-ink flex items-center gap-2">
                <Sparkles size={18} className="text-sky" /> What is your main athletic goal on
                NexSport?
              </h3>
              <div className="mt-4 space-y-2">
                {goals.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGoal(g)}
                    className={cn(
                      "w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition-all text-left flex items-center justify-between",
                      goal === g
                        ? "border-sky bg-accent text-navy shadow-sm"
                        : "border-border bg-card text-ink hover:border-sky/50",
                    )}
                  >
                    <span>{g}</span>
                    {goal === g && <CheckCircle2 size={16} className="text-navy" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            {step > 1 ? (
              <Button variant="secondary" size="sm" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button variant="primary" size="sm" onClick={() => setStep((s) => s + 1)}>
                Next Question
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={runAiAnalysis}>
                <Sparkles size={15} /> Analyze with AI
              </Button>
            )}
          </div>
        </div>
      )}
    </ModalShell>
  );
}
