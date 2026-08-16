import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GoogleSignIn, type GoogleAccount } from "@/components/GoogleSignIn";
import { STORAGE_KEYS, useStored } from "@/lib/storage";
import { seedIfEmpty } from "@/lib/seed";
import { askNotificationPermission } from "@/lib/notify";
import type { StudentProfile } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Study Sync — Student Productivity & AI Study Tutor" },
      {
        name: "description",
        content:
          "Study Sync helps students plan homework, master exam syllabus, keep healthy routines and prayer reminders, and learn with an AI study tutor.",
      },
      { property: "og:title", content: "Study Sync — Student Productivity & AI Study Tutor" },
      {
        property: "og:description",
        content: "Homework timers, syllabus tracking, routine and prayer reminders, plus an AI study tutor.",
      },
    ],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  const navigate = useNavigate();
  const [user, setUser, loaded] = useStored<StudentProfile | null>(STORAGE_KEYS.user, null);
  const [form, setForm] = useState({ name: "", email: "", school: "", grade: "Grade 10", goalHours: 4 });

  useEffect(() => {
    if (loaded && user) void navigate({ to: "/dashboard" });
  }, [loaded, user, navigate]);

  function signIn(profile: StudentProfile) {
    seedIfEmpty();
    setUser(profile);
    void askNotificationPermission();
    void navigate({ to: "/dashboard" });
  }

  function handleGoogle(account: GoogleAccount) {
    signIn({
      name: account.name,
      email: account.email,
      school: "",
      grade: "Grade 10",
      goalHours: 4,
      provider: "google",
      signedInAt: new Date().toISOString(),
    });
  }

  function handleManual(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    signIn({
      name: form.name.trim(),
      email: form.email.trim(),
      school: form.school.trim(),
      grade: form.grade,
      goalHours: Number(form.goalHours) || 4,
      provider: "manual",
      signedInAt: new Date().toISOString(),
    });
  }

  return (
    <div className="auth">
      <div className="auth__panel fade-in">
        <section className="stack" style={{ gap: 18 }}>
          <div className="row" style={{ gap: 10 }}>
            <span className="brand__mark">S</span>
            <strong style={{ letterSpacing: "-0.02em" }}>Study Sync</strong>
          </div>
          <h1 className="hero__title">
            Study smarter.
            <br />
            <span className="hero__gradient">Live better.</span>
          </h1>
          <p className="muted" style={{ maxWidth: 460, fontSize: "0.98rem" }}>
            One calm dark workspace for homework timers, exam syllabus mastery, healthy routines with
            prayer reminders, and an AI study tutor that explains instead of just answering.
          </p>
          <div className="grid grid-3">
            {[
              { k: "Focus", v: "Pomodoro homework timers" },
              { k: "Mastery", v: "Syllabus % per subject" },
              { k: "Balance", v: "Prayer + health reminders" },
            ].map((f) => (
              <div className="card card--lift" key={f.k} style={{ padding: 14 }}>
                <span className="eyebrow">{f.k}</span>
                <p style={{ fontWeight: 700, fontSize: "0.9rem", marginTop: 6 }}>{f.v}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card" style={{ padding: 22 }}>
          <h2 style={{ fontSize: "1.2rem" }}>Welcome back</h2>
          <p className="muted" style={{ marginBottom: 16 }}>
            Sign in to load your study data from this device.
          </p>

          <GoogleSignIn onSuccess={handleGoogle} />

          <div className="divider" style={{ margin: "16px 0" }}>
            <span>or add your student details</span>
          </div>

          <form className="stack" onSubmit={handleManual}>
            <div className="grid grid-2">
              <div className="field">
                <label className="label" htmlFor="name">
                  Full name
                </label>
                <input
                  id="name"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ali Ahmed"
                  required
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@school.edu"
                  required
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="school">
                  School / College
                </label>
                <input
                  id="school"
                  className="input"
                  value={form.school}
                  onChange={(e) => setForm({ ...form, school: e.target.value })}
                  placeholder="City Grammar School"
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="grade">
                  Class
                </label>
                <select
                  id="grade"
                  className="select"
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                >
                  {["Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12", "University"].map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <label className="label" htmlFor="goal">
                Daily study goal — {form.goalHours} hours
              </label>
              <input
                id="goal"
                type="range"
                min={1}
                max={10}
                value={form.goalHours}
                onChange={(e) => setForm({ ...form, goalHours: Number(e.target.value) })}
              />
            </div>
            <button className="btn btn--primary btn--block" type="submit">
              Enter Study Sync
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
