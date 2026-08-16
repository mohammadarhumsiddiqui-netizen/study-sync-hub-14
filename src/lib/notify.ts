/** Reminder helpers: browser notification + a short beep via Web Audio. */

export async function askNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "default") {
    try {
      return await Notification.requestPermission();
    } catch {
      return "denied";
    }
  }
  return Notification.permission;
}

export function playChime(times = 2) {
  if (typeof window === "undefined") return;
  const Ctx = window.AudioContext ?? (window as any).webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  for (let i = 0; i < times; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime + i * 0.36;
    osc.type = "sine";
    osc.frequency.setValueAtTime(i % 2 ? 660 : 880, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.32);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.34);
  }
  window.setTimeout(() => ctx.close().catch(() => {}), times * 400 + 400);
}

export function ringReminder(title: string, body: string) {
  playChime();
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, { body, icon: "/favicon.ico" });
    } catch {
      /* ignore */
    }
  }
}
