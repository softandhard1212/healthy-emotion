import AsyncStorage from "@react-native-async-storage/async-storage";
import { createThread } from "./agent";

const KEY = "be.thread-id";

/**
 * The one conversation thread this device holds with the agent.
 *
 * One thread rather than one per check-in: the coach's value is in what it
 * remembers, and a check-in that opened a fresh thread would meet an agent
 * with no memory of last week. The id is persisted so the conversation
 * survives an app restart; the agent holds the messages themselves.
 */
export async function getThreadId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export async function ensureThread(accessToken: string): Promise<string> {
  const existing = await getThreadId();
  if (existing) return existing;
  const id = await createThread(accessToken);
  await AsyncStorage.setItem(KEY, id).catch(() => {});
  return id;
}

/** Forget the thread, e.g. on sign-out, so the next person starts clean. */
export async function clearThread(): Promise<void> {
  await AsyncStorage.removeItem(KEY).catch(() => {});
}
