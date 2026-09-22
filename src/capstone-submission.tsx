import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Folder, LoaderCircle, X } from "lucide-react";

type App = { id: string; title: string; url?: string };
type Submission = { appId: string; title: string; passed: boolean; checkedAt: string };
export function CapstoneSubmission({ onValidated }: { onValidated: (passed: boolean) => void }) {
  const [apps, setApps] = useState<App[]>([]);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [authNeeded, setAuthNeeded] = useState(false);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const validated = useRef(onValidated);
  validated.current = onValidated;
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setSubmission(null); setSelected(""); setApps([]);
      validated.current(false);
      try {
        const response = await fetch("/api/mcp/apps", { signal: controller.signal });
        const data = await response.json();
        if (controller.signal.aborted) return;
        if (response.status === 401 || data.status === "reauth_required") {
          setAuthNeeded(true); setMessage("Sign in or reconnect Replit to select your project."); return;
        }
        if (!response.ok || data.status !== "ready") throw new Error();
        setAuthNeeded(false);
        setApps(data.apps);
        setMessage(data.apps.length ? "" : "No recent projects found. Build your picnic app, then refresh this page.");
        const saved = await fetch("/api/activities/capstone", { signal: controller.signal });
        if (!saved.ok) return;
        const result = await saved.json();
        if (controller.signal.aborted) return;
        if (result.submission) {
          setSubmission(result.submission); setSelected(result.submission.appId);
          if (result.submission.passed === true) validated.current(true);
        }
      } catch { if (!controller.signal.aborted) setMessage("Couldn’t load projects. Refresh the page to try again."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    window.addEventListener("replit-auth-changed", load);
    return () => { controller.abort(); window.removeEventListener("replit-auth-changed", load); };
  }, []);
  async function submit() {
    if (busy || !selected) return;
    setBusy(true); setMessage("Agent is checking your project against the capstone requirements…");
    try {
      const response = await fetch("/api/activities/capstone", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ appId: selected }),
      });
      const data = await response.json();
      if (!response.ok) {
        const errors: Record<string, string> = {
          app_busy: "Agent is busy in this project. Wait for it to finish, then submit again.",
          authentication_required: "Sign in to Replit, then submit again.",
          reauth_required: "Reconnect Replit, then submit again.",
          invalid_project: "This project is no longer in your available recent projects. Refresh and select it again.",
          inconclusive_review: "Agent didn’t return a clear YES or NO. Nothing was validated. Try again.",
        };
        if (response.status === 401) setAuthNeeded(true);
        setMessage(errors[data.error] ?? "The review couldn’t finish. Nothing was validated. Try again.");
        return;
      }
      setSubmission(data.submission);
      setMessage("");
      validated.current(data.submission.passed === true);
    } catch { setMessage("The connection was interrupted. Refresh to check your saved result before retrying."); }
    finally { setBusy(false); }
  }
  return <section className="recipe-unlock-action activity-confirmation" aria-label="Submit your capstone">
    <h2>Submit your picnic app</h2>
    {submission?.passed ? <div role="status">
      <h3>Congratulations, you accomplished the task!</h3>
      <p>Agent answered YES for {submission.title}. Your submission is saved.</p>
      <small>Reviewed {new Date(submission.checkedAt).toLocaleString()}. This is an Agent assessment of the project at submission time, not a guarantee or a new browser test.</small>
    </div> : <>
      <p>Ready to show what you’ve made? Choose your project and let Agent check your work.</p>
      <button type="button" className="recipe-create-button" onClick={() => dialog.current?.showModal()}>
        I’ve built my picnic app <ArrowRight size={18} aria-hidden="true" />
      </button>
    </>}
    <dialog ref={dialog} className="learn-sign-in-modal capstone-project-modal" aria-labelledby="capstone-modal-title" aria-describedby="capstone-modal-description">
      <button type="button" className="modal-close" aria-label="Close project selection" onClick={() => dialog.current?.close()}><X size={20} /></button>
      <div className="capstone-modal-icon" aria-hidden="true">{submission?.passed ? <Check size={26} /> : <Folder size={26} />}</div>
      <p className="signin-eyebrow">YOUR CAPSTONE</p>
      <h2 id="capstone-modal-title">{submission?.passed ? "You did it!" : busy ? "Let’s check your work" : "Which project was it?"}</h2>
      <p id="capstone-modal-description">{submission?.passed ? "Congratulations, you accomplished the task. Your submission is saved." : busy ? "Agent is reviewing your picnic app against the course requirements. This can take a moment." : "Pick the picnic app you built. We’ll take it from here."}</p>
      {submission?.passed ? <button type="button" className="capstone-review-button" onClick={() => dialog.current?.close()}>Continue learning <ArrowRight size={18} /></button> : <>
        <div className="capstone-project-list" role="group" aria-label="Your recent projects" aria-busy={loading || busy}>
          {apps.map((app) => <button type="button" className={`capstone-project-card ${selected === app.id ? "is-selected" : ""}`} key={app.id} aria-pressed={selected === app.id} disabled={busy} onClick={() => { setSelected(app.id); setSubmission(null); setMessage(""); }}>
            <span className="capstone-project-symbol"><Folder size={21} aria-hidden="true" /></span>
            <span className="capstone-project-copy"><strong>{app.title}</strong><small>{app.url?.replace(/^https:\/\//, "") ?? "Replit project"}</small></span>
            <span className="capstone-project-check" aria-hidden="true">{selected === app.id && <Check size={14} />}</span>
          </button>)}
        </div>
        <p className="capstone-review-status" role="status">{loading ? "Loading your projects…" : message}</p>
        {submission?.passed === false && <p className="capstone-review-status" role="status">Not quite yet. Agent answered NO: something is missing or could not be verified. Check the requirements, improve your project, and try again.</p>}
        {authNeeded ? <a className="signin-primary" href={`/api/auth/login?returnTo=${encodeURIComponent(window.location.pathname)}`}>Connect Replit <ArrowRight size={18} /></a> : <button type="button" className="capstone-review-button" disabled={loading || busy || !apps.some((app) => app.id === selected)} onClick={submit}>
          {busy ? <><LoaderCircle className="capstone-spinner" size={18} /> Reviewing project</> : <>Review my project <ArrowRight size={18} /></>}
        </button>}
        <small className="capstone-review-note">Read-only Agent review. Nothing is published or changed. May use Agent capacity.</small>
      </>}
    </dialog>
  </section>;
}