import { useEffect, useRef, useState } from "react";

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
      <p>Select your project, then submit it for a read-only Agent review. This sends the course requirements to Agent in that project and may use Agent capacity. It does not publish or change your app.</p>
      <label htmlFor="capstone-project">Your recent Replit projects</label>
      <select id="capstone-project" value={selected} disabled={loading || busy} onChange={(event) => { setSelected(event.target.value); setSubmission(null); setMessage(""); }}>
        <option value="">Select the picnic project</option>
        {apps.map((app) => <option key={app.id} value={app.id}>{app.title}</option>)}
      </select>
      <button type="button" className="recipe-create-button" disabled={loading || busy || !apps.some((app) => app.id === selected)} onClick={submit}>
        {busy ? "Checking your project…" : "I have built and tested my picnic app. Submit for review"}
      </button>
      {submission?.passed === false && <p role="status">Agent answered NO. At least one requirement is missing or could not be verified. Review the checklist and your project notes, make improvements, then submit again.</p>}
    </>}
    <p role="status">{loading ? "Loading your projects…" : message}</p>
    {authNeeded && <a href={`/api/auth/login?returnTo=${encodeURIComponent(window.location.pathname)}`}>Connect Replit</a>}
  </section>;
}