import { useCallback, useEffect, useState } from "react";

/** Keys used for every piece of Study Sync data saved in localStorage. */
export const STORAGE_KEYS = {
  user: "studysync.user",
  tasks: "studysync.tasks",
  subjects: "studysync.subjects",
  exams: "studysync.exams",
  routine: "studysync.routine",
  reminders: "studysync.reminders",
  chat: "studysync.chat",
  focusMinutes: "studysync.focusMinutes",
} as const;

export function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStored<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("studysync:store", { detail: key }));
  } catch {
    /* storage full or blocked — ignore */
  }
}

/**
 * SSR-safe localStorage state. The value starts as `initial` on the server and
 * during hydration, then loads from storage inside an effect.
 */
export function useStored<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setValue(readStored<T>(key, initial));
    setLoaded(true);
    const sync = () => setValue(readStored<T>(key, initial));
    window.addEventListener("studysync:store", sync);
    return () => window.removeEventListener("studysync:store", sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T | ((current: T) => T)) => {
      setValue((current) => {
        const resolved =
          typeof next === "function" ? (next as (c: T) => T)(current) : next;
        writeStored(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  return [value, update, loaded] as const;
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export const todayKey = () => new Date().toISOString().slice(0, 10);

export function daysUntil(dateString: string) {
  const target = new Date(`${dateString}T00:00:00`).getTime();
  const now = new Date(todayKey() + "T00:00:00").getTime();
  return Math.round((target - now) / 86_400_000);
}

export const percent = (done: number, total: number) =>
  total <= 0 ? 0 : Math.round((done / total) * 100);
