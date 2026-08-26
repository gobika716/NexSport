import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ModalShell } from "./ModalShell";
import { Button } from "@/components/common/Button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useRouter } from "@tanstack/react-router";
import { gameNames, gameQuestions, type GameId } from "@/data/gameQuestions";
import badminton from "@/assets/sport-badminton.jpg";
import cricket from "@/assets/sport-cricket.jpg";
import football from "@/assets/sport-football.jpg";
import basketball from "@/assets/sport-basketball.jpg";
import volleyball from "@/assets/sport-volleyball.jpg";
import tennis from "@/assets/sport-tennis.jpg";
import tabletennis from "@/assets/sport-tabletennis.jpg";
import kabaddi from "@/assets/sport-kabaddi.jpg";

type Mode = "login" | "signup";
type SignupStep = "account" | "sport" | "experience" | "assessment" | "verification";
type Answers = Record<string, string | string[]>;
const accountSchema = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters"),
  email: z.string().trim().email("Enter a valid email address"),
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type AccountValues = z.infer<typeof accountSchema>;
type LoginValues = z.infer<typeof loginSchema>;
const inputClass =
  "h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-ink outline-none transition-colors placeholder:text-gray-text focus:border-sky";
const steps: SignupStep[] = ["account", "sport", "experience", "assessment", "verification"];
const stepLabels = ["Account", "Sport", "Experience", "Assessment", "Verification"];
const gameImages: Record<GameId, string> = {
  badminton,
  cricket,
  football,
  basketball,
  volleyball,
  tennis,
  "table-tennis": tabletennis,
  kabaddi,
};

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-destructive">{message}</p> : null;
}

export function AuthModal({
  open,
  mode,
  onClose,
  onModeChange,
}: {
  open: boolean;
  mode: Mode;
  onClose: () => void;
  onModeChange: (mode: Mode) => void;
}) {
  const auth = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>("account");
  const [selectedGame, setSelectedGame] = useState<GameId | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<
    "Beginner" | "Intermediate" | "Advanced" | null
  >(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [verificationType, setVerificationType] = useState("No");
  const [certificateData, setCertificateData] = useState("");
  const [certificateError, setCertificateError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AccountValues>({ resolver: zodResolver(accountSchema) });
  const loginForm = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const currentIndex = steps.indexOf(step);
  const questions = useMemo(
    () => (selectedGame ? gameQuestions[selectedGame] : []),
    [selectedGame],
  );
  useEffect(() => {
    if (!open) {
      reset();
      setStep("account");
      setSelectedGame(null);
      setExperienceLevel(null);
      setAnswers({});
      setVerificationType("No");
      setCertificateData("");
      setCertificateError("");
    }
  }, [open, reset]);
  const updateAnswer = (key: string, value: string, multiple: boolean) =>
    setAnswers((previous) => ({
      ...previous,
      [key]: multiple
        ? [...(Array.isArray(previous[key]) ? previous[key] : []), value].filter(
            (item, index, all) => all.indexOf(item) === index,
          )
        : value,
    }));
  const isAssessmentComplete = questions.every((question) => {
    const answer = answers[question.key];
    return !question.required || (Array.isArray(answer) ? answer.length > 0 : Boolean(answer));
  });
  const goNext = () => {
    if (step === "sport" && !selectedGame) return;
    if (step === "experience" && !experienceLevel) return;
    if (step === "assessment" && !isAssessmentComplete) return;
    setStep(steps[Math.min(currentIndex + 1, steps.length - 1)]);
  };
  const loginSubmit = async (values: LoginValues) => {
    setSubmitting(true);
    try {
      if (await auth.login(values.email, values.password)) {
        onClose();
        loginForm.reset();
      }
    } finally {
      setSubmitting(false);
    }
  };
  const submitSignup = async (account: AccountValues) => {
    if (!selectedGame || !experienceLevel || !isAssessmentComplete) return;
    if (verificationType === "Yes" && !certificateData) {
      setCertificateError("Please upload a JPG, JPEG, or PNG certificate, or select No.");
      return;
    }
    setSubmitting(true);
    try {
      const ok = await auth.signup({
        name: account.username,
        email: account.email,
        mobileNumber: account.mobileNumber,
        password: account.password,
        selectedGame,
        experienceLevel,
        answers,
        verificationType,
        ...(certificateData ? { certificateData } : {}),
      });
      if (ok) {
        onClose();
        reset();
        router.navigate({ to: "/dashboard" });
      }
    } finally {
      setSubmitting(false);
    }
  };
  const modeTabs = (
    <div className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-secondary p-1">
      <button
        type="button"
        onClick={() => onModeChange("login")}
        className={cn(
          "h-9 rounded-full text-sm font-semibold",
          mode === "login" ? "gradient-blue text-white" : "text-gray-text",
        )}
      >
        Login
      </button>
      <button
        type="button"
        onClick={() => onModeChange("signup")}
        className={cn(
          "h-9 rounded-full text-sm font-semibold",
          mode === "signup" ? "gradient-blue text-white" : "text-gray-text",
        )}
      >
        Sign Up
      </button>
    </div>
  );
  if (mode === "login")
    return (
      <ModalShell
        open={open}
        onClose={onClose}
        title="Welcome back"
        subtitle="Sign in to continue playing fair."
      >
        {modeTabs}
        <form onSubmit={loginForm.handleSubmit(loginSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">Email</label>
            <input
              className={inputClass}
              placeholder="you@example.com"
              {...loginForm.register("email")}
            />
            <FieldError message={loginForm.formState.errors.email?.message} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">Password</label>
            <input
              type="password"
              className={inputClass}
              placeholder="********"
              {...loginForm.register("password")}
            />
            <FieldError message={loginForm.formState.errors.password?.message} />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Please wait..." : "Login"}
          </Button>
        </form>
      </ModalShell>
    );
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Create your NexSport profile"
      subtitle="Your assessment seeds a starting profile; real match performance will matter more over time."
      wide
    >
      {modeTabs}
      <div className="mb-7 grid grid-cols-5 gap-1">
        {stepLabels.map((label, index) => (
          <div key={label} className="text-center">
            <div
              className={cn(
                "mx-auto mb-2 h-2 rounded-full",
                index <= currentIndex ? "bg-sky" : "bg-secondary",
              )}
            />
            <span
              className={cn(
                "text-[10px] font-semibold sm:text-xs",
                index === currentIndex ? "text-navy" : "text-gray-text",
              )}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
      {step === "account" ? (
        <form onSubmit={handleSubmit(() => setStep("sport"))} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">Username</label>
            <input className={inputClass} placeholder="ananya_rao" {...register("username")} />
            <FieldError message={errors.username?.message} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">Email</label>
            <input className={inputClass} placeholder="you@example.com" {...register("email")} />
            <FieldError message={errors.email?.message} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">Mobile Number</label>
            <input
              className={inputClass}
              inputMode="numeric"
              placeholder="9876543210"
              {...register("mobileNumber")}
            />
            <FieldError message={errors.mobileNumber?.message} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">Password</label>
            <input
              type="password"
              className={inputClass}
              placeholder="8+ characters"
              {...register("password")}
            />
            <FieldError message={errors.password?.message} />
          </div>
          <Button type="submit" size="lg" className="mt-2 w-full sm:col-span-2">
            Continue
          </Button>
        </form>
      ) : null}
      {step === "sport" ? (
        <div>
          <h4 className="text-lg font-bold text-ink">Choose your game</h4>
          <p className="mt-1 text-sm text-gray-text">Your questions will adapt to this choice.</p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(Object.keys(gameNames) as GameId[]).map((game) => (
              <button
                type="button"
                key={game}
                onClick={() => {
                  setSelectedGame(game);
                  setAnswers({});
                }}
                className={cn(
                  "overflow-hidden rounded-2xl border text-left transition-all",
                  selectedGame === game
                    ? "border-sky ring-2 ring-sky/20"
                    : "border-border hover:border-sky",
                )}
              >
                <img src={gameImages[game]} alt="" className="h-20 w-full object-cover" />
                <span className="block p-3 text-sm font-semibold text-ink">{gameNames[game]}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {step === "experience" ? (
        <div>
          <h4 className="text-lg font-bold text-ink">What is your current experience level?</h4>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {(["Beginner", "Intermediate", "Advanced"] as const).map((level) => (
              <button
                type="button"
                key={level}
                onClick={() => setExperienceLevel(level)}
                className={cn(
                  "rounded-2xl border p-5 text-left transition-all",
                  experienceLevel === level
                    ? "border-sky bg-sky/5 ring-2 ring-sky/20"
                    : "border-border hover:border-sky",
                )}
              >
                <span className="block text-base font-bold text-ink">{level}</span>
                <span className="mt-1 block text-xs text-gray-text">
                  A starting point, never a permanent label.
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {step === "assessment" ? (
        <div>
          <h4 className="text-lg font-bold text-ink">
            {selectedGame ? `${gameNames[selectedGame]} Assessment` : "Game Assessment"}
          </h4>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {questions.map((question) => (
              <fieldset key={question.key}>
                <legend className="mb-2 text-sm font-semibold text-ink">{question.label}</legend>
                <div className="grid gap-2">
                  {question.options.map((option) => {
                    const checked =
                      question.type === "multi"
                        ? Array.isArray(answers[question.key]) &&
                          answers[question.key].includes(option)
                        : answers[question.key] === option;
                    return (
                      <label
                        key={option}
                        className="flex cursor-pointer items-center gap-2 text-sm text-gray-text"
                      >
                        <input
                          type={question.type === "multi" ? "checkbox" : "radio"}
                          name={question.key}
                          checked={checked}
                          onChange={() =>
                            updateAnswer(question.key, option, question.type === "multi")
                          }
                          className="accent-sky"
                        />
                        {option}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        </div>
      ) : null}
      {step === "verification" ? (
        <div>
          <h4 className="text-lg font-bold text-ink">
            Do you have a high-level sports certificate?
          </h4>
          <p className="mt-1 text-sm text-gray-text">
            Upload only a high-level sports achievement certificate. District, state, national,
            university, or official championship certificates are accepted.
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {["Yes", "No"].map((type) => (
              <label
                key={type}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 text-sm font-medium text-ink"
              >
                <input
                  type="radio"
                  name="verification"
                  checked={verificationType === type}
                  onChange={() => setVerificationType(type)}
                  className="accent-sky"
                />
                {type}
              </label>
            ))}
          </div>
          {verificationType === "Yes" ? (
            <div className="mt-4">
              <label className="text-xs font-semibold text-ink">
                Upload your high-level sports certificate (JPG, JPEG or PNG, max 5 MB)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                className="mt-2 block w-full text-sm"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setCertificateError("");
                  setCertificateData("");
                  if (!file) return;
                  if (
                    !["image/jpeg", "image/png"].includes(file.type) ||
                    file.size > 5 * 1024 * 1024
                  ) {
                    setCertificateError("Choose a JPG, JPEG, or PNG image up to 5 MB.");
                    event.currentTarget.value = "";
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => setCertificateData(String(reader.result));
                  reader.readAsDataURL(file);
                }}
              />
              {certificateData ? (
                <img
                  src={certificateData}
                  alt="Certificate preview"
                  className="mt-3 max-h-40 rounded-xl border border-border object-contain"
                />
              ) : null}
              <FieldError message={certificateError} />
            </div>
          ) : null}
        </div>
      ) : null}
      {step !== "account" ? (
        <div className="mt-7 flex justify-between gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setStep(steps[Math.max(currentIndex - 1, 0)])}
          >
            Previous
          </Button>
          {step === "verification" ? (
            <Button type="button" onClick={handleSubmit(submitSignup)} disabled={submitting}>
              {submitting ? "Creating profile..." : "Complete signup"}
            </Button>
          ) : (
            <Button type="button" onClick={goNext}>
              Next
            </Button>
          )}
        </div>
      ) : null}
      <p className="mt-6 text-center text-sm text-gray-text">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => onModeChange("login")}
          className="font-semibold text-sky"
        >
          Log in
        </button>
      </p>
    </ModalShell>
  );
}
