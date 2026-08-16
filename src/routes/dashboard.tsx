import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell, PageHeader, Progress } from "@/components/AppShell";
import { STORAGE_KEYS, daysUntil, percent, todayKey, uid, useStored } from "@/lib/storage";
import { askNotificationPermission, ringReminder } from "@/lib/notify";
import type { Exam, RoutineItem, StudentProfile, Subject, Task } from "@/lib/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Study Sync" },
      { name: "description", content: "Today's homework, study timers, goal progress, upcoming exams and reminders." },
      { property: "og:title", content: "Dashboard — Study Sync" },
      { property: "og:description", content: "Track homework, timers, goals, exams and daily reminders." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [user] = useStored<StudentProfile | null>(STORAGE_KEYS.user, null);
  const [tasks, setTasks] = useStored<Task[]>(STORAGE_KEYS.tasks, []);
  const [subjects] = useStored<Subject[]>(STORAGE_KEYS.subjects, []);
  const [exams] = useStored<Exam[]>(STORAGE_KEYS.exams, []);
  const [routine, setRoutine] = useStored<RoutineItem[]>(STORAGE_KEYS.routine, []);
  const [focus, setFocus] = useStored<Record<string, number>>(STORAGE_KEYS.focusMinutes, {});
  const [draft, setDraft] = useState({ title: "", subject: "", minutes: 30 });

  const today = todayKey();
  const goalMinutes = (user?.goalHours ?? 4) * 60;
  const doneToday = focus[today] ?? 0;

  const todaysTasks = useMemo(
    () => tasks.filter((t) => !t.due || t.due <= today).sort((a, b) => Number(a.done) - Number(b.done)),
    [tasks, today],
  );
  const taskProgress = percent(todaysTasks.filter((t) => t.done).length, todaysTasks.length);

  const syllabusProgress = useMemo(() => {
    const topics = subjects.flatMap((s) => s.topics);
    return percent(topics.filter((t) => t.done).length, topics.length);
  }, [subjects]);

  const routineProgress = percent(routine.filter((r) => r.doneOn.includes(today)).length, routine.length);
  const nextExams = [...exams].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  const prayers = routine.filter((r) => r.kind === "prayer");

  function addTask(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.title.trim()) return;
    setTasks([
      {
        id: uid(),
        title: draft.title.trim(),
        subject: draft.subject.trim() || "General",
        due: today,
        minutes: Number(draft.minutes) || 30,
        done: false,
        createdAt: today,
      },
      ...tasks,
    ]);
    setDraft({ title: "", subject: "", minutes: 30 });
  }

  const toggleTask = (id: string) =>
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const removeTask = (id: string) => setTasks(tasks.filter((t) => t.id !== id));

  const toggleRoutine = (id: string) =>
    setRoutine(
      routine.map((r) =>
        r.id === id
          ? {
              ...r,
              doneOn: r.doneOn.includes(today) ? r.doneOn.filter((d) => d !== today) : [...r.doneOn, today],
            }
          : r,
      ),
    );

  const logFocus = (minutes: number) =>
    setFocus({ ...focus, [today]: (focus[today] ?? 0) + minutes });

  return (
    <AppShell>
      <PageHeader
        eyebrow={new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })}
        title={`Hey ${user?.name?.split(" ")[0] ?? "student"} 👋`}
        subtitle={`${todaysTasks.filter((t) => !t.done).length} tasks left today · ${doneToday}/${goalMinutes} focus minutes`}
      />

      <div className="grid grid-3" style={{ marginTop: 8 }}>
        <StatCard label="Daily goal" value={`${percent(doneToday, goalMinutes)}%`} sub={`${doneToday} of ${goalMinutes} min`} progress={percent(doneToday, goalMinutes)} />
        <StatCard label="Homework" value={`${taskProgress}%`} sub={`${todaysTasks.filter((t) => t.done).length}/${todaysTasks.length} completed`} progress={taskProgress} />
        <StatCard label="Syllabus" value={`${syllabusProgress}%`} sub={`${subjects.length} subjects tracked`} progress={syllabusProgress} />
      </div>

      <div className="grid grid-sidebar" style={{ marginTop: 16 }}>
        <div className="stack">
          <section className="card">
            <div className="between" style={{ marginBottom: 12 }}>
              <h2 className="card__title min-w-0 truncate">Today's homework</h2>
              <span className="badge">{todaysTasks.length} items</span>
            </div>

            <form className="grid grid-2" style={{ marginBottom: 12 }} onSubmit={addTask}>
              <input
                className="input"
                placeholder="Add a task (e.g. Algebra Ex 5.2)"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
              <div className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
                <input
                  className="input"
                  placeholder="Subject"
                  value={draft.subject}
                  onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                />
                <input
                  className="input"
                  type="number"
                  min={5}
                  max={240}
                  step={5}
                  style={{ width: 92 }}
                  value={draft.minutes}
                  onChange={(e) => setDraft({ ...draft, minutes: Number(e.target.value) })}
                />
                <button className="btn btn--primary" type="submit">
                  Add
                </button>
              </div>
            </form>

            <div className="stack" style={{ gap: 10 }}>
              {todaysTasks.length === 0 ? (
                <p className="muted">No tasks yet — add your first homework above.</p>
              ) : (
                todaysTasks.map((task) => (
                  <div className={`item${task.done ? " item--done" : ""}`} key={task.id}>
                    <button
                      className={`check${task.done ? " check--on" : ""}`}
                      onClick={() => toggleTask(task.id)}
                      aria-label={task.done ? "Mark incomplete" : "Mark complete"}
                    >
                      {task.done ? "✓" : ""}
                    </button>
                    <div className="min-w-0">
                      <p className="item__title truncate">{task.title}</p>
                      <p className="muted truncate">
                        {task.subject} · {task.minutes} min
                      </p>
                    </div>
                    <button className="icon-btn" onClick={() => removeTask(task.id)} aria-label="Delete task">
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <StudyTimer onComplete={logFocus} />
        </div>

        <div className="stack">
          <section className="card">
            <h2 className="card__title">Upcoming exams</h2>
            <div className="stack" style={{ gap: 10, marginTop: 12 }}>
              {nextExams.length === 0 ? (
                <p className="muted">
                  No exams added. <Link to="/exams" style={{ color: "var(--accent-2)" }}>Add one →</Link>
                </p>
              ) : (
                nextExams.map((exam) => {
                  const d = daysUntil(exam.date);
                  return (
                    <div className="item" key={exam.id} style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
                      <div className="min-w-0">
                        <p className="item__title truncate">{exam.subject}</p>
                        <p className="muted truncate">{exam.note || exam.date}</p>
                      </div>
                      <span className={`badge${d <= 3 ? " badge--warn" : ""}`}>
                        {d < 0 ? "past" : d === 0 ? "today" : `${d}d`}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="card">
            <div className="between">
              <h2 className="card__title min-w-0 truncate">Routine & prayers</h2>
              <span className="badge badge--ok">{routineProgress}%</span>
            </div>
            <div style={{ margin: "12px 0" }}>
              <Progress value={routineProgress} />
            </div>
            <div className="stack" style={{ gap: 8 }}>
              {prayers.map((p) => (
                <div className="item" key={p.id} style={{ padding: 10 }}>
                  <button
                    className={`check${p.doneOn.includes(today) ? " check--on" : ""}`}
                    onClick={() => toggleRoutine(p.id)}
                    aria-label="Toggle prayer"
                  >
                    {p.doneOn.includes(today) ? "✓" : ""}
                  </button>
                  <div className="min-w-0">
                    <p className="item__title truncate">{p.title}</p>
                  </div>
                  <span className="muted">{p.time}</span>
                </div>
              ))}
            </div>
            <Link to="/routine" className="btn btn--ghost btn--block btn--sm" style={{ marginTop: 12 }}>
              Open Routine & Health
            </Link>
          </section>

          <section className="card">
            <span className="eyebrow">AI Study Tutor</span>
            <p style={{ fontWeight: 700, marginTop: 6 }}>Stuck on a question?</p>
            <p className="muted" style={{ marginBottom: 12 }}>
              Ask maths, physics, chemistry or revision-planning questions and get step-by-step help.
            </p>
            <Link to="/tutor" className="btn btn--primary btn--block">
              Ask the tutor
            </Link>
          </section>
        </div>
      </div>

      <ReminderWatcher routine={routine} />

      <Link to="/tutor" className="fab">
        ✧ Tutor
      </Link>
    </AppShell>
  );
}

function StatCard({ label, value, sub, progress }: { label: string; value: string; sub: string; progress: number }) {
  return (
    <div className="card card--lift">
      <span className="eyebrow">{label}</span>
      <p style={{ fontSize: "1.7rem", fontWeight: 800, marginTop: 4 }}>{value}</p>
      <p className="muted" style={{ marginBottom: 10 }}>
        {sub}
      </p>
      <Progress value={progress} />
    </div>
  );
}

const PRESETS = [
  { label: "Pomodoro 25", minutes: 25 },
  { label: "Deep 50", minutes: 50 },
  { label: "Quick 10", minutes: 10 },
];

function StudyTimer({ onComplete }: { onComplete: (minutes: number) => void }) {
  const [minutes, setMinutes] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (remaining === 0 && running && !completedRef.current) {
      completedRef.current = true;
      setRunning(false);
      onComplete(minutes);
      ringReminder("Study block complete 🎉", `${minutes} minutes logged. Take a 5 minute break.`);
    }
  }, [remaining, running, minutes, onComplete]);

  function pick(next: number) {
    completedRef.current = false;
    setMinutes(next);
    setRemaining(next * 60);
    setRunning(false);
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const progress = percent(minutes * 60 - remaining, minutes * 60);

  return (
    <section className="card">
      <div className="between">
        <h2 className="card__title min-w-0 truncate">Homework timer</h2>
        <span className="badge">{progress}%</span>
      </div>
      <div className="row" style={{ marginTop: 14, gap: 20 }}>
        <div className="ring" style={{ ["--value" as string]: progress }}>
          <span className="ring__label">
            <span className="timer__display" style={{ fontSize: "1.4rem" }}>
              {mm}:{ss}
            </span>
          </span>
        </div>
        <div className="stack min-w-0" style={{ gap: 10, flex: 1 }}>
          <div className="chips">
            {PRESETS.map((p) => (
              <button
                key={p.minutes}
                className="chip"
                onClick={() => pick(p.minutes)}
                style={p.minutes === minutes ? { color: "var(--text)", background: "var(--accent-soft)" } : undefined}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button
              className="btn btn--primary"
              onClick={() => {
                completedRef.current = false;
                setRunning((r) => !r);
              }}
            >
              {running ? "Pause" : remaining === 0 ? "Restart" : "Start focus"}
            </button>
            <button className="btn" onClick={() => pick(minutes)}>
              Reset
            </button>
          </div>
          <p className="muted">Finishing a block logs the minutes toward today's goal and rings a chime.</p>
        </div>
      </div>
    </section>
  );
}

/** Rings + notifies when a routine reminder time is reached. */
function ReminderWatcher({ routine }: { routine: RoutineItem[] }) {
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    void askNotificationPermission();
    const id = window.setInterval(() => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      routine.forEach((item) => {
        const key = `${todayKey()}-${item.id}-${item.time}`;
        if (item.time === hhmm && !firedRef.current.has(key) && !item.doneOn.includes(todayKey())) {
          firedRef.current.add(key);
          ringReminder("Study Sync reminder", `${item.title} — scheduled for ${item.time}`);
        }
      });
    }, 20_000);
    return () => window.clearInterval(id);
  }, [routine]);

  return null;
}
