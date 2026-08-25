import { useEffect, useRef, useState } from "react";
import { useAuth } from "../lib/AuthContext";
import {
  createThread,
  fetchThreadHistory,
  sendMessage,
  type AgentMessage,
} from "../lib/agent";
import MoodLogFlow from "../components/moodlog/MoodLogFlow";
import { draftToMessage, type MoodLogDraft } from "../lib/emotions";

const THREAD_STORAGE_KEY = "healthy-emotion-thread-id";


function isVisible(m: AgentMessage): boolean {
  if (m.type === "human") return true;
  if (m.type === "ai") return m.content.trim().length > 0;
  return false;
}

export default function Chat() {
  const { session } = useAuth();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const accessToken = session?.access_token ?? null;

  useEffect(() => {
    if (!accessToken) return;
    const existing = localStorage.getItem(THREAD_STORAGE_KEY);
    if (existing) {
      setThreadId(existing);
      // A reused thread may already have history on the server — rehydrate
      // it, otherwise a page reload would show the empty-state picker again
      // and send a stray "first" message into an already-started thread.
      fetchThreadHistory(accessToken, existing)
        .then(setMessages)
        .catch((err) => setError(err instanceof Error ? err.message : String(err)))
        .finally(() => setLoadingHistory(false));
      return;
    }
    createThread(accessToken)
      .then((id) => {
        localStorage.setItem(THREAD_STORAGE_KEY, id);
        setThreadId(id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoadingHistory(false));
  }, [accessToken]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(text: string) {
    if (!accessToken || !threadId || !text.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const updated = await sendMessage(accessToken, threadId, text.trim());
      setMessages(updated);
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  }

  function startNewConversation() {
    localStorage.removeItem(THREAD_STORAGE_KEY);
    setThreadId(null);
    setMessages([]);
    setInput("");
    setError(null);
    if (accessToken) {
      createThread(accessToken)
        .then((id) => {
          localStorage.setItem(THREAD_STORAGE_KEY, id);
          setThreadId(id);
        })
        .catch((err) =>
          setError(err instanceof Error ? err.message : String(err)),
        );
    }
  }

  const isFirstTurn = messages.length === 0;
  const visibleMessages = messages.filter(isVisible);

  if (loadingHistory) {
    return (
      <div className="chat-page">
        <p className="chat-empty">Loading your conversation…</p>
      </div>
    );
  }

  return (
    <div className="chat-page">
      {!isFirstTurn && (
      <div className="chat-scroll">
        {visibleMessages.length === 0 && !isFirstTurn && (
          <p className="chat-empty">Starting a new conversation…</p>
        )}
        {visibleMessages.map((m, i) => (
          <div
            key={i}
            className={m.type === "human" ? "bubble bubble-user" : "bubble bubble-agent"}
          >
            {m.content}
          </div>
        ))}
        {sending && (
          <div className="bubble bubble-agent bubble-pending">…</div>
        )}
        <div ref={bottomRef} />
      </div>
      )}

      {error && <p className="error chat-error">{error}</p>}

      {isFirstTurn ? (
        <div className="min-h-0 flex-1">
          <MoodLogFlow
            saving={sending}
            onComplete={(draft: MoodLogDraft) => handleSend(draftToMessage(draft))}
          />
        </div>
      ) : (
        <form
          className="chat-input-row"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
        >
          <input
            type="text"
            placeholder="Type a message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
          />
          <button type="submit" disabled={sending || !input.trim()}>
            Send
          </button>
        </form>
      )}

      {!isFirstTurn && (
        <button type="button" className="link new-convo" onClick={startNewConversation}>
          Start a new conversation
        </button>
      )}
    </div>
  );
}
