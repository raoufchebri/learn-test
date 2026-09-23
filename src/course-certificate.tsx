import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Award, LockKeyhole, Printer } from "lucide-react";
import { LEARN_DEV_MODE } from "./learn-mode";

export function CourseCertificate() {
  const [status, setStatus] = useState<"loading" | "locked" | "ready" | "error">("loading");
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [simulated, setSimulated] = useState(false);
  useEffect(() => {
    let active = true;
    async function load() {
      setStatus("loading"); setUnlocked(false); setName("");
      try {
        const [reviewResponse, sessionResponse] = await Promise.all([fetch("/api/activities/capstone"), fetch("/api/auth/session")]);
        if (reviewResponse.status === 401) { if (active) setStatus("locked"); return; }
        if (!reviewResponse.ok || !sessionResponse.ok) throw new Error();
        const [review, session] = await Promise.all([reviewResponse.json(), sessionResponse.json()]);
        if (!active) return;
        if (!session.authenticated || review.submission?.passed !== true) { setStatus("locked"); return; }
        setName([session.user.firstName, session.user.lastName].filter(Boolean).join(" ") || session.user.username || "");
        setDate(new Date(review.submission.checkedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }));
        setStatus("ready");
      } catch { if (active) setStatus("error"); }
    }
    void load();
    window.addEventListener("replit-auth-changed", load);
    return () => { active = false; window.removeEventListener("replit-auth-changed", load); };
  }, []);
  return <section className="course-certificate-section">
    {LEARN_DEV_MODE && <div className="practice-actions certificate-controls">
      <button type="button" onClick={() => { setSimulated(!simulated); setUnlocked(false); }}>
        {simulated ? "Exit simulation" : "Simulate congratulations"}
      </button>
      <span>Preview only. Does not change your capstone result.</span>
    </div>}
    {!simulated && status === "loading" && <p role="status">Checking your capstone result…</p>}
    {!simulated && status === "error" && <p role="alert">We couldn’t check your completion. Refresh this page to try again. Your certificate has not been unlocked.</p>}
    {!simulated && status === "locked" && <div className="certificate-controls">
      <p><LockKeyhole size={18} aria-hidden="true" /> Complete a successful capstone review to unlock your certificate.</p>
      <Link to="/learn/your-capstone/review">Go to your capstone review →</Link>
    </div>}
    {(status === "ready" || simulated) && <>
      <h2>Congratulations on finishing Replit 101!</h2>
      <p>You’ve taken an idea from a conversation to a working app. Your certificate is ready to unlock.</p>
      <div className="certificate-controls">
        {!unlocked ? <>
          <label htmlFor="certificate-name">Name on your certificate</label>
          <input id="certificate-name" value={name} maxLength={100} autoComplete="name" onChange={event => setName(event.target.value)} />
          <button className="certificate-unlock" disabled={!name.trim()} onClick={() => setUnlocked(true)}><Award size={20} /> Unlock my certificate</button>
          <small>This is a course completion certificate, not an accredited qualification.</small>
        </> : <button className="certificate-unlock" onClick={() => window.print()}><Printer size={18} /> Print or save as PDF</button>}
      </div>
      {unlocked && <article className="course-certificate" aria-label="Replit 101 completion certificate">
        {simulated && <p className="certificate-kicker">PREVIEW · SIMULATED COMPLETION</p>}
        <img src="/brand-assets/logos/replit-wordmark-dark.svg" alt="Replit" />
        <p className="certificate-kicker">CERTIFICATE OF COMPLETION</p>
        <h2>Congratulations on finishing<br />Replit 101.</h2>
        <p>Presented to</p>
        <h3>{name.trim()}</h3>
        <p>For learning to turn an idea into a working app with Replit, and successfully completing the capstone review.</p>
        <footer><span>Replit 101 · Learn by building</span><span>{date || new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</span></footer>
      </article>}
    </>}
  </section>;
}