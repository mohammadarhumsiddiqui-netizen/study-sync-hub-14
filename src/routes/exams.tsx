import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader, Progress } from "@/components/AppShell";
import { STORAGE_KEYS, daysUntil, percent, uid, useStored } from "@/lib/storage";
import type { Exam, Subject } from "@/lib/types";

export const Route = createFileRoute("/exams")({
  head: () => ({
    meta: [
      { title: "Exam Mastery — Study Sync" },
      { name: "description", content: "Add subjects, break the syllabus into topics, track completion and allocate study time." },
      { property: "og:title", content: "Exam Mastery — Study Sync" },
      { property: "og:description", content: "Syllabus tracking, subject progress and exam countdowns." },
    ],
  }),
  component: ExamsPage,
});

const COLORS = ["#6ce0ff", "#2f7bff", "#34d399", "#fbbf24", "#f87171", "#a78bfa"];

function ExamsPage() {
  const [subjects, setSubjects] = useStored<Subject[]>(STORAGE_KEYS.subjects, []);
  const [exams, setExams] = useStored<Exam[]>(STORAGE_KEYS.exams, []);
  const [subjectName, setSubjectName] = useState("");
  const [topicDraft, setTopicDraft] = useState<Record<string, string>>({});
  const [examDraft, setExamDraft] = useState({ subject: "", date: "", note: "" });

  const allTopics = subjects.flatMap((s) => s.topics);
  const overall = percent(allTopics.filter((t) => t.done).length, allTopics.length);

  function addSubject(event: React.FormEvent) {
    event.preventDefault();
    if (!subjectName.trim()) return;
    setSubjects([
      ...subjects,
      {
        id: uid(),
        name: subjectName.trim(),
        color: COLORS[subjects.length % COLORS.length],
        allocatedMinutes: 180,
        topics: [],
      },
    ]);
    setSubjectName("");
  }

  const updateSubject = (id: string, patch: Partial<Subject>) =>
    setSubjects(subjects.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  function addTopic(subjectId: string) {
    const title = (topicDraft[subjectId] ?? "").trim();
    if (!title) return;
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;
    updateSubject(subjectId, { topics: [...subject.topics, { id: uid(), title, done: false }] });
    setTopicDraft({ ...topicDraft, [subjectId]: "" });
  }

  function toggleTopic(subjectId: string, topicId: string) {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;
    updateSubject(subjectId, {
      topics: subject.topics.map((t) => (t.id === topicId ? { ...t, done: !t.done } : t)),
    });
  }

  function removeTopic(subjectId: string, topicId: string) {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;
    updateSubject(subjectId, { topics: subject.topics.filter((t) => t.id !== topicId) });
  }

  function addExam(event: React.FormEvent) {
    event.preventDefault();
    if (!examDraft.subject.trim() || !examDraft.date) return;
    setExams([...exams, { id: uid(), ...examDraft, subject: examDraft.subject.trim() }]);
    setExamDraft({ subject: "", date: "", note: "" });
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Exam Mastery"
        title="Own your syllabus"
        subtitle="Break every subject into topics, tick them off, and watch mastery climb."
      />

      <section className="card" style={{ marginTop: 8 }}>
        <div className="between">
          <div className="min-w-0">
            <h2 className="card__title">Overall syllabus mastery</h2>
            <p className="muted">
              {allTopics.filter((t) => t.done).length} of {allTopics.length} topics complete
            </p>
          </div>
          <span className="badge">{overall}%</span>
        </div>
        <div style={{ marginTop: 12 }}>
          <Progress value={overall} />
        </div>
      </section>

      <form className="card row" style={{ marginTop: 16, gap: 8 }} onSubmit={addSubject}>
        <input
          className="input min-w-0"
          style={{ flex: 1 }}
          placeholder="Add a subject (e.g. Biology)"
          value={subjectName}
          onChange={(e) => setSubjectName(e.target.value)}
        />
        <button className="btn btn--primary" type="submit">
          Add subject
        </button>
      </form>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        {subjects.map((subject) => {
          const done = subject.topics.filter((t) => t.done).length;
          const value = percent(done, subject.topics.length);
          return (
            <section className="card" key={subject.id}>
              <div className="between">
                <div className="row min-w-0" style={{ gap: 10, flexWrap: "nowrap" }}>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 4,
                      background: subject.color,
                      flexShrink: 0,
                    }}
                  />
                  <h3 className="card__title truncate">{subject.name}</h3>
                </div>
                <button
                  className="icon-btn"
                  onClick={() => setSubjects(subjects.filter((s) => s.id !== subject.id))}
                  aria-label="Remove subject"
                >
                  ✕
                </button>
              </div>

              <div style={{ margin: "12px 0" }}>
                <Progress value={value} label={`${done}/${subject.topics.length} topics`} />
              </div>

              <div className="field" style={{ marginBottom: 12 }}>
                <label className="label">Study time allocated — {Math.round(subject.allocatedMinutes / 60)} h / week</label>
                <input
                  type="range"
                  min={30}
                  max={900}
                  step={30}
                  value={subject.allocatedMinutes}
                  onChange={(e) => updateSubject(subject.id, { allocatedMinutes: Number(e.target.value) })}
                />
              </div>

              <div className="stack" style={{ gap: 8 }}>
                {subject.topics.map((topic) => (
                  <div className={`item${topic.done ? " item--done" : ""}`} key={topic.id} style={{ padding: 10 }}>
                    <button
                      className={`check${topic.done ? " check--on" : ""}`}
                      onClick={() => toggleTopic(subject.id, topic.id)}
                      aria-label="Toggle topic"
                    >
                      {topic.done ? "✓" : ""}
                    </button>
                    <p className="item__title truncate">{topic.title}</p>
                    <button
                      className="icon-btn"
                      onClick={() => removeTopic(subject.id, topic.id)}
                      aria-label="Delete topic"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="row" style={{ gap: 8, marginTop: 12, flexWrap: "nowrap" }}>
                <input
                  className="input min-w-0"
                  placeholder="Add syllabus topic"
                  value={topicDraft[subject.id] ?? ""}
                  onChange={(e) => setTopicDraft({ ...topicDraft, [subject.id]: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTopic(subject.id);
                    }
                  }}
                />
                <button className="btn btn--sm" onClick={() => addTopic(subject.id)}>
                  Add
                </button>
              </div>
            </section>
          );
        })}
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <h2 className="card__title">Upcoming exams</h2>
        <form className="grid grid-3" style={{ margin: "12px 0" }} onSubmit={addExam}>
          <input
            className="input"
            placeholder="Subject"
            value={examDraft.subject}
            onChange={(e) => setExamDraft({ ...examDraft, subject: e.target.value })}
          />
          <input
            className="input"
            type="date"
            value={examDraft.date}
            onChange={(e) => setExamDraft({ ...examDraft, date: e.target.value })}
          />
          <div className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
            <input
              className="input min-w-0"
              placeholder="Note (units, room…)"
              value={examDraft.note}
              onChange={(e) => setExamDraft({ ...examDraft, note: e.target.value })}
            />
            <button className="btn btn--primary" type="submit">
              Add
            </button>
          </div>
        </form>

        <div className="stack" style={{ gap: 10 }}>
          {exams.length === 0 ? (
            <p className="muted">No exams scheduled yet.</p>
          ) : (
            [...exams]
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((exam) => {
                const d = daysUntil(exam.date);
                return (
                  <div className="item" key={exam.id}>
                    <span className={`badge${d <= 3 ? " badge--warn" : ""}`}>
                      {d < 0 ? "past" : d === 0 ? "today" : `${d}d`}
                    </span>
                    <div className="min-w-0">
                      <p className="item__title truncate">{exam.subject}</p>
                      <p className="muted truncate">
                        {new Date(`${exam.date}T00:00:00`).toDateString()} {exam.note ? `· ${exam.note}` : ""}
                      </p>
                    </div>
                    <button
                      className="icon-btn"
                      onClick={() => setExams(exams.filter((e) => e.id !== exam.id))}
                      aria-label="Delete exam"
                    >
                      ✕
                    </button>
                  </div>
                );
              })
          )}
        </div>
      </section>
    </AppShell>
  );
}
