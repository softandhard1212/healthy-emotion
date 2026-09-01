const API_BASE = process.env.EXPO_PUBLIC_AGENT_API_URL;

export interface AgentMessage {
  type: "human" | "ai" | "tool" | string;
  content: string;
  tool_calls?: { name: string; args: Record<string, unknown> }[];
}

/**
 * Whether a message from the run belongs on screen. Tool calls and their
 * results are part of how the agent works, not part of the conversation, and
 * an assistant turn that only made a tool call has no text to show.
 */
export function isVisible(m: AgentMessage): boolean {
  if (m.type === "human") return true;
  if (m.type === "ai") return m.content.trim().length > 0;
  return false;
}

function authHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

export async function createThread(accessToken: string): Promise<string> {
  const res = await fetch(`${API_BASE}/threads`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    throw new Error(`Failed to create thread (${res.status})`);
  }
  const data = await res.json();
  return data.thread_id as string;
}

export async function fetchThreadHistory(
  accessToken: string,
  threadId: string,
): Promise<AgentMessage[]> {
  const res = await fetch(`${API_BASE}/threads/${threadId}/history`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ limit: 1 }),
  });
  if (!res.ok) {
    throw new Error(`Failed to load thread history (${res.status})`);
  }
  const data = await res.json();
  // Empty array for a brand-new thread with no runs yet.
  return (data[0]?.values?.messages ?? []) as AgentMessage[];
}

export async function sendMessage(
  accessToken: string,
  threadId: string,
  message: string,
): Promise<AgentMessage[]> {
  const res = await fetch(`${API_BASE}/threads/${threadId}/runs/wait`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({
      assistant_id: "my-agent",
      input: { messages: [{ role: "user", content: message }] },
    }),
  });
  if (!res.ok) {
    throw new Error(`Agent request failed (${res.status})`);
  }
  const data = await res.json();
  if (data.__error__) {
    throw new Error(data.__error__.message ?? "Agent error");
  }
  return data.messages as AgentMessage[];
}
