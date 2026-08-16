import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useStored } from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/storage";
import type { StudentProfile } from "@/lib/types";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: "◈" },
  { to: "/exams", label: "Exams", icon: "◎" },
  { to: "/routine", label: "Routine", icon: "✦" },
  { to: "/tutor", label: "AI Tutor", icon: "✧" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [user] = useStored<StudentProfile | null>(STORAGE_KEYS.user, null);

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__inner">
          <Link to="/dashboard" className="brand">
            <span className="brand__mark">S</span>
            <span className="min-w-0">
              <span className="brand__name truncate">Study Sync</span>
              <span className="muted truncate" style={{ display: "block", fontSize: "0.7rem" }}>
                {user ? `Focus mode · ${user.name.split(" ")[0]}` : "Student productivity OS"}
              </span>
            </span>
          </Link>

          <div className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
            <nav className="tabs">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`nav__link${pathname === n.to ? " nav__link--active" : ""}`}
                >
                  <span aria-hidden>{n.icon}</span>
                  {n.label}
                </Link>
              ))}
            </nav>
            <Link to="/" className="avatar" title={user?.email ?? "Sign in"}>
              {user?.name?.[0]?.toUpperCase() ?? "?"}
            </Link>
          </div>
        </div>
      </header>

      <main className="container fade-in">{children}</main>

      <nav className="nav">
        <div className="nav__inner">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={`nav__link${pathname === n.to ? " nav__link--active" : ""}`}
            >
              <span aria-hidden style={{ fontSize: "1.05rem" }}>
                {n.icon}
              </span>
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function Progress({ value, label }: { value: number; label?: string }) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="stack" style={{ gap: 6 }}>
      {label ? (
        <div className="between">
          <span className="muted min-w-0 truncate">{label}</span>
          <span className="badge">{safe}%</span>
        </div>
      ) : null}
      <div className="progress" role="progressbar" aria-valuenow={safe}>
        <div className="progress__bar" style={{ width: `${safe}%` }} />
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="stack" style={{ gap: 6, marginBottom: 4 }}>
      <span className="eyebrow">{eyebrow}</span>
      <h1 style={{ fontSize: "clamp(1.5rem, 5vw, 2rem)" }}>{title}</h1>
      <p className="muted">{subtitle}</p>
    </div>
  );
}
