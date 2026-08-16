import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, PageHeader, Progress } from "@/components/AppShell";
import { STORAGE_KEYS, percent, todayKey, uid, useStored } from "@/lib/storage";
import { askNotificationPermission, ringReminder } from "@/lib/notify";
import type { RoutineItem } from "@/lib/types";

export const Route = createFileRoute("/routine")({
  head: () => ({
    meta: [
      { title: "Routine & Health — Study Sync" },
      { name: "description", content: "Daily habits, exercise challenges, prayer reminders and custom alerts with sound notifications." },
      { property: "og:title", content: "Routine & Health — Study Sync" },
      { property: "og:description", content: "Balance study with prayer, exercise and healthy habits." },
    ],
  }),
  component: RoutinePage,
});

const KINDS: { value: RoutineItem["kind"]; label: string }[] = [
  { value: "prayer", label: "Prayer" },
  { value: "exercise", label: "Exercise" },
  { value: "health", label: "Health" },
  { value: "custom", label: "Custom" },
];

function RoutinePage() {
  const [routine, setRoutine] = useStored<RoutineItem[]>(STORAGE_KEYS.routine, []);
  const [draft, setDraft] = useState({ title: "", kind: "custom" as RoutineItem["kind"], time: "18:00" });
  const [filter, setFilter] = useState<"all" | RoutineItem["kind"]>("all");
  const today = todayKey();

  const visible = useMemo(
    () => (filter === "all" ? routine : routine.filter((r) => r.kind === filter)),
    [routine, filter],
  );
  const dayProgress = percent(routine.filter((r) => r.doneOn.includes(today)).length, routine.length);

  const streak = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 30; i++) {
      const day = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
      const total = routine.length;
      const done = routine.filter((r) => r.doneOn.includes(day)).length;
      if (total > 0 && done / total >= 0.6) count++;
      else if (i > 0) break;
    }
    return count;
  }, [routine]);

  function addItem(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.title.trim()) return;
    setRoutine([...routine, { id: uid(), title: draft.title.trim(), kind: draft.kind, time: draft.time, doneOn: [] }]);
    setDraft({ title: "", kind: "custom", time: "18:00" });
    void askNotificationPermission();
  }

  const toggle = (id: string) =>
    setRoutine(
      routine.map((r) =>
        r.id === id
          ? { ...r, doneOn: r.doneOn.includes(today) ? r.doneOn.filter((d) => d !== today) : [...r.doneOn, today] }
          : r,
      ),
    );

  return (
    <AppShell>
      <PageHeader
        eyebrow="Routine & Health"
        title="Study hard, live well"
        subtitle="Prayer times, exercise challenges and healthy habits — with ringing reminders."
      />

      <div className="grid grid-3" style={{ marginTop: 8 }}>
        <div className="card">
          <span className="eyebrow">Today</span>
          <p style={{ fontSize: "1.7rem", fontWeight: 800 }}>{dayProgress}%</p>
          <Progress value={dayProgress} />
        </div>
        <div className="card">
          <span className="eyebrow">Streak</span>
          <p style={{ fontSize: "1.7rem", fontWeight: 800 }}>{streak} days</p>
          <p className="muted">60%+ of habits completed</p>
        </div>
        <div className="card">
          <span className="eyebrow">Reminders</span>
          <p style={{ fontSize: "1.7rem", fontWeight: 800 }}>{routine.length}</p>
          <button
            className="btn btn--sm"
            style={{ marginTop: 8 }}
            onClick={async () => {
              await askNotificationPermission();
              ringReminder("Reminders enabled 🔔", "Study Sync will ring and notify you on time.");
            }}
          >
            Test sound & notification
          </button>
        </div>
      </div>

      <form className="card grid grid-3" style={{ marginTop: 16 }} onSubmit={addItem}>
        <input
          className="input"
          placeholder="New habit or reminder"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />
        <select
          className="select"
          value={draft.kind}
          onChange={(e) => setDraft({ ...draft, kind: e.target.value as RoutineItem["kind"] })}
        >
          {KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
        <div className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
          <input
            className="input min-w-0"
            type="time"
            value={draft.time}
            onChange={(e) => setDraft({ ...draft, time: e.target.value })}
          />
          <button className="btn btn--primary" type="submit">
            Add
          </button>
        </div>
      </form>

      <div className="chips" style={{ marginTop: 16 }}>
        {(["all", ...KINDS.map((k) => k.value)] as const).map((value) => (
          <button
            key={value}
            className="chip"
            onClick={() => setFilter(value)}
            style={filter === value ? { color: "var(--text)", background: "var(--accent-soft)" } : undefined}
          >
            {value === "all" ? "All" : KINDS.find((k) => k.value === value)?.label}
          </button>
        ))}
      </div>

      <div className="grid grid-2" style={{ marginTop: 12 }}>
        {visible.map((item) => {
          const done = item.doneOn.includes(today);
          return (
            <div className={`item${done ? " item--done" : ""}`} key={item.id}>
              <button
                className={`check${done ? " check--on" : ""}`}
                onClick={() => toggle(item.id)}
                aria-label="Toggle habit"
              >
                {done ? "✓" : ""}
              </button>
              <div className="min-w-0">
                <p className="item__title truncate">{item.title}</p>
                <p className="muted truncate">
                  {KINDS.find((k) => k.value === item.kind)?.label} · {item.time} · {item.doneOn.length} times done
                </p>
              </div>
              <button
                className="icon-btn"
                onClick={() => setRoutine(routine.filter((r) => r.id !== item.id))}
                aria-label="Delete habit"
              >
                ✕
              </button>
            </div>
          );
        })}
        {visible.length === 0 ? <p className="muted">Nothing here yet — add a habit above.</p> : null}
      </div>
    </AppShell>
  );
}
