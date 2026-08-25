import { FormEvent, useState } from "react";
import { Bot, MessageCircle, Send, X, Sparkles, HelpCircle } from "lucide-react";
import { OnboardingModal } from "@/components/modals/OnboardingModal";

type Message = { role: "assistant" | "user"; text: string };

const welcome =
  "Hi! I am your AI NexSport Assistant. Ask me anything about hosting matches, Elo calculation, Web Bluetooth heart monitors, or sports rules!";

const quickPrompts = [
  "How is Elo calculated?",
  "How to host a match room?",
  "How to connect Web Bluetooth HR?",
  "Take AI Onboarding Survey",
];

function answer(question: string): string {
  const text = question.toLowerCase();
  if (text.includes("onboard") || text.includes("survey") || text.includes("start")) {
    return "Click 'Take AI Onboarding Survey' in the quick menu or navigation bar to complete a 4-step athletic profile assessment!";
  }
  if (text.includes("create") || text.includes("host") || text.includes("room")) {
    return "Open Match Rooms and click 'Create match room'. Choose your sport, venue, time, player count, and skill band. Your room is immediately broadcasted to nearby players with GPS coordinates.";
  }
  if (text.includes("join") || text.includes("match")) {
    return "Browse Match Rooms on your radar or grid view. Select any open room, click 'Join room', and pick your skill level. Once joined, you get access to the live room chat and team balance preview.";
  }
  if (text.includes("elo") || text.includes("rating")) {
    return "NexSport uses standard Elo rating formulas: R' = R + K * (S - E). Winning against higher-rated opponents yields larger Elo gains. Your live Elo history is graphed on your Dashboard.";
  }
  if (
    text.includes("heart") ||
    text.includes("bluetooth") ||
    text.includes("device") ||
    text.includes("hr")
  ) {
    return "In any match room you've joined, open the 'Live Heart Rate' widget and click 'Connect BLE Device'. Your browser will pair with standard Web Bluetooth heart-rate monitors!";
  }
  if (text.includes("dashboard") || text.includes("insight") || text.includes("feedback")) {
    return "Your Dashboard synthesizes all recorded match results, fair-play ratings, and heart-rate metrics to generate tailored AI Coach advice and training drills.";
  }
  return "I'm trained on all NexSport features including room creation, zig-zag team balancing, Elo algorithms, and IoT metrics. Feel free to ask any specific question!";
}

export function NexSportAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: welcome }]);

  const sendQuestion = (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed) return;
    if (trimmed.toLowerCase().includes("survey") || trimmed.toLowerCase().includes("onboard")) {
      setOnboardingOpen(true);
    }
    setMessages((current) => [
      ...current,
      { role: "user", text: trimmed },
      { role: "assistant", text: answer(trimmed) },
    ]);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendQuestion(input);
    setInput("");
  };

  return (
    <>
      <div className="fixed right-4 bottom-4 z-50 sm:right-6 sm:bottom-6">
        {open ? (
          <section className="card-soft mb-3 w-[min(23rem,calc(100vw-2rem))] overflow-hidden bg-card shadow-[var(--shadow-lift)] border border-border/80">
            <header className="gradient-blue flex items-center justify-between px-4 py-3 text-white">
              <span className="flex items-center gap-2 text-sm font-bold">
                <Bot size={18} className="text-lime" /> NexSport AI Assistant
              </span>
              <button type="button" aria-label="Close assistant" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </header>

            <div className="max-h-72 space-y-3 overflow-y-auto p-4">
              {messages.map((message, index) => (
                <p
                  key={`${message.role}-${index}`}
                  className={
                    message.role === "user"
                      ? "ml-8 rounded-2xl bg-navy px-3.5 py-2 text-sm text-white"
                      : "mr-4 rounded-2xl bg-secondary px-3.5 py-2 text-sm leading-relaxed text-ink"
                  }
                >
                  {message.text}
                </p>
              ))}
            </div>

            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap gap-1.5 px-3 py-2 border-t border-border/50 bg-secondary/30">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendQuestion(prompt)}
                  className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-gray-text hover:border-sky hover:text-sky transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="flex gap-2 border-t border-border p-3">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask AI about NexSport…"
                className="min-w-0 flex-1 rounded-full border border-border bg-background px-3.5 py-2 text-sm outline-none focus:border-sky"
              />
              <button
                type="submit"
                aria-label="Send question"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-navy text-white hover:bg-navy-mid"
              >
                <Send size={15} />
              </button>
            </form>
          </section>
        ) : null}

        <button
          type="button"
          aria-label="Open NexSport Assistant"
          onClick={() => setOpen((value) => !value)}
          className="gradient-blue grid h-12 w-12 place-items-center rounded-full text-white shadow-[var(--shadow-lift)] transition-transform hover:scale-105"
        >
          <MessageCircle size={21} />
        </button>
      </div>

      <OnboardingModal open={onboardingOpen} onClose={() => setOnboardingOpen(false)} />
    </>
  );
}
