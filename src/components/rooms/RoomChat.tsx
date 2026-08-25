import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/common/Button";
import { quickReplies } from "@/data/chatData";
import { sendMessageFn, listMessagesFn } from "@/server/chat";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function RoomChat({
  roomId,
  roomName,
  canChat,
}: {
  roomId: string;
  roomName: string;
  canChat: boolean;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: list = [] } = useQuery({
    queryKey: ["messages", roomId, user?.id],
    queryFn: () => listMessagesFn({ data: { roomId, userId: user?.id } }),
  });

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [list.length]);

  const submit = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !canChat || !user?.id) return;
    try {
      await sendMessageFn({ data: { roomId, author: user.name, userId: user.id, text: trimmed } });
      setDraft("");
      await queryClient.invalidateQueries({ queryKey: ["messages", roomId] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send message.");
    }
  };

  return (
    <section className="card-soft flex flex-col p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-accent text-navy">
          <MessageCircle size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold text-ink">Room chat</h2>
          <p className="truncate text-xs text-gray-text">
            {roomName} · {list.length} messages
          </p>
        </div>
      </div>

      {canChat ? (
        <>
          <div ref={scrollRef} className="mt-5 max-h-80 space-y-3 overflow-y-auto pr-1">
            {list.map((m) =>
              m.system ? (
                <p
                  key={m.id}
                  className="mx-auto w-fit rounded-full bg-secondary px-3 py-1 text-center text-xs text-gray-text"
                >
                  {m.text} · {m.time}
                </p>
              ) : (
                <div
                  key={m.id}
                  className={cn("flex items-end gap-2", m.isMe && "flex-row-reverse")}
                >
                  <span
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                      m.isMe ? "bg-lime text-navy" : "bg-navy text-white",
                    )}
                  >
                    {m.initials}
                  </span>
                  <div className={cn("max-w-[78%]", m.isMe && "text-right")}>
                    <p className="text-[11px] font-semibold text-gray-text">
                      {m.author} · {m.time}
                    </p>
                    <p
                      className={cn(
                        "mt-1 rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                        m.isMe ? "bg-navy text-white" : "bg-secondary/70 text-ink",
                      )}
                    >
                      {m.text}
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {quickReplies.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => submit(q)}
                className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-gray-text transition-colors hover:border-sky hover:text-sky"
              >
                {q}
              </button>
            ))}
          </div>
          <form
            className="mt-4 flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit(draft);
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Message the room…"
              aria-label="Message the room"
              className="h-11 min-w-0 flex-1 rounded-full border border-border bg-card px-4 text-sm text-ink outline-none focus:border-sky"
            />
            <Button type="submit" size="md" disabled={!draft.trim()} aria-label="Send message">
              <Send size={16} />
            </Button>
          </form>
        </>
      ) : (
        <div className="mt-5 rounded-2xl bg-secondary/70 px-4 py-5 text-sm text-gray-text">
          Join this room to chat with the confirmed players.
        </div>
      )}
    </section>
  );
}
