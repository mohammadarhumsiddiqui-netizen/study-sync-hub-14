import { useState } from "react";

/**
 * Google sign-in flow.
 * Study Sync stores everything locally (no server), so the Google account
 * chooser collects the student's Google details and the profile is written to
 * the local data file (localStorage) exactly like a real OAuth callback would.
 */
export type GoogleAccount = { name: string; email: string };

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.9 6.1C12.3 13.4 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-2.8-.4-4.1H24v8.4h12.7c-.3 2.1-1.6 5.2-4.6 7.3l7.7 6c4.5-4.2 6.7-10.3 6.7-17.6z" />
      <path fill="#FBBC05" d="M10.4 28.6a14.8 14.8 0 0 1 0-9.2l-7.9-6.1a24 24 0 0 0 0 21.4l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.6l-7.7-6c-2.1 1.4-4.8 2.4-7.6 2.4-6.4 0-11.7-3.9-13.6-9.4l-7.9 6.1C6.4 42.6 14.6 48 24 48z" />
    </svg>
  );
}

export function GoogleSignIn({ onSuccess }: { onSuccess: (account: GoogleAccount) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return setError("Enter the name on your Google account.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email address.");
    setError("");
    setConnecting(true);
    window.setTimeout(() => onSuccess({ name: name.trim(), email: email.trim().toLowerCase() }), 700);
  }

  return (
    <>
      <button type="button" className="google-btn" onClick={() => setOpen(true)}>
        <GoogleLogo />
        Continue with Google
      </button>

      {open ? (
        <div
          className="card fade-in"
          style={{ marginTop: 12, borderColor: "var(--border-strong)" }}
          role="dialog"
          aria-label="Choose an account"
        >
          <div className="between" style={{ marginBottom: 12 }}>
            <div className="row min-w-0" style={{ gap: 8 }}>
              <GoogleLogo />
              <strong className="truncate">Choose an account</strong>
            </div>
            <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close">
              ✕
            </button>
          </div>

          <form className="stack" onSubmit={submit}>
            <div className="field">
              <label className="label" htmlFor="g-name">
                Full name
              </label>
              <input
                id="g-name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ali Ahmed"
                autoComplete="name"
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="g-email">
                Google email
              </label>
              <input
                id="g-email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                autoComplete="email"
                inputMode="email"
              />
            </div>
            {error ? (
              <p className="muted" style={{ color: "var(--danger)" }}>
                {error}
              </p>
            ) : null}
            <button className="btn btn--primary btn--block" type="submit" disabled={connecting}>
              {connecting ? "Signing you in…" : "Continue"}
            </button>
            <p className="muted" style={{ fontSize: "0.72rem" }}>
              Study Sync saves your profile to this device only (local data file).
            </p>
          </form>
        </div>
      ) : null}
    </>
  );
}
