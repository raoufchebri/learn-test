import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Folder, LoaderCircle, X } from "lucide-react";
import { CAPSTONE_REQUIREMENTS, type CapstoneCheck } from "./capstone-rubric";
import { LessonPrompt } from "./lesson-prompt";

type App = { id: string; title: string; url?: string };
type Submission = { appId: string; title: string; url?: string; passed: boolean; checks?: CapstoneCheck[]; checkedAt: string };
function improvementPrompt(check: CapstoneCheck) {
  const requirement = CAPSTONE_REQUIREMENTS.find(item => item.id === check.id);
  return check.prompt ?? `Help me address this capstone requirement: ${requirement?.detail ?? check.id} The review said: ${check.feedback} Inspect what already works, help me resolve the gap, and show me how to test it with fictional data. Do not invent test results or publish anything.`;
}

function CapstoneActionPlan({ submission, projectUrl }: { submission: Submission; projectUrl?: string }) {
  const fixes = submission.checks?.filter(check => check.status !== "passed") ?? [];
  return <section className="capstone-action-plan" aria-labelledby="capstone-action-title">
    <p className="eyebrow">YOUR NEXT STEPS</p>
    <h3 id="capstone-action-title">Let’s improve {submission.title}</h3>
    <p>Your review is saved here. Work through these actions in your existing project, one at a time. Test each change, then return here for another review.</p>
    {fixes.length === 0 && <p>This earlier review did not save detailed feedback. Recheck the project to get an actionable checklist.</p>}
    {fixes.map((check, index) => <section className="foundation-section" key={check.id}>
      <h2>{index + 1}. {CAPSTONE_REQUIREMENTS.find(item => item.id === check.id)?.title}</h2>
      <span className="capstone-check-label">{check.status === "unverified" ? "More evidence needed" : "Needs work"}</span>
      <p><strong>What needs attention:</strong> {check.feedback}</p>
      <p><strong>Next action:</strong> {check.status === "unverified" ? "Ask Agent to inspect and test this requirement first. Record the actual result; only change the app if a gap is found." : "Paste this request into your project’s Agent, review the proposed fix, then test the updated feature."}</p>
      <LessonPrompt key={improvementPrompt(check)} prompt={improvementPrompt(check)} copyable />
    </section>)}
    {projectUrl && <a className="capstone-review-button" href={projectUrl} target="_blank" rel="noopener noreferrer">Let’s work some more on the project <ArrowRight size={18} /></a>}
    <small>Prompts are suggestions based on the review, not a guarantee of passing. Nothing is sent to Agent until you paste and submit it.</small>
  </section>;
}
export function CapstoneSubmission({ onValidated }: { onValidated: (passed: boolean) => void }) {
  const [apps, setApps] = useState<App[]>([]);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [authNeeded, setAuthNeeded] = useState(false);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [step, setStep] = useState<"project" | "review">("project");
  const projectUrl = submission?.url ?? apps.find(app => app.id === selected)?.url;
  const dialog = useRef<HTMLDialogElement>(null);
  const validated = useRef(onValidated);
  validated.current = onValidated;
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setSubmission(null); setSelected(""); setApps([]);
      setStep("project");
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
          setStep("review");
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
          inconclusive_review: "Agent didn’t return a complete checklist. Nothing was validated. Try again.",
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
    <h2>{submission?.passed ? "Your capstone is complete" : submission?.passed === false ? "Your review and next steps" : "Submit your picnic app"}</h2>
    {submission?.passed ? <div role="status">
      <h3>Congratulations, you’ve done this really well!</h3>
      <p>{submission.title} passed the review. Your submission is saved.</p>
      <button type="button" className="recipe-create-button" onClick={() => dialog.current?.showModal()}>View review checklist</button>
      <small>Reviewed {new Date(submission.checkedAt).toLocaleString()}. This is an Agent assessment of the project at submission time, not a guarantee or a new browser test.</small>
    </div> : <>
      {submission?.passed === false ? <CapstoneActionPlan submission={submission} projectUrl={projectUrl} /> : <p>Ready to show what you’ve made? Choose your project and let Agent check your work.</p>}
      <button type="button" className="recipe-create-button" onClick={() => dialog.current?.showModal()}>
        {submission?.passed === false ? "I’ve made changes. Open my review" : "I’ve built my picnic app"} <ArrowRight size={18} aria-hidden="true" />
      </button>
    </>}
    <dialog ref={dialog} className="learn-sign-in-modal capstone-project-modal" aria-labelledby="capstone-modal-title" aria-describedby="capstone-modal-description">
      <button type="button" className="modal-close" aria-label="Close project selection" onClick={() => dialog.current?.close()}><X size={20} /></button>
      <div className="capstone-modal-icon" aria-hidden="true">{submission?.passed ? <Check size={26} /> : <Folder size={26} />}</div>
      <p className="signin-eyebrow">{step === "project" ? "STEP 1 OF 2 · CHOOSE YOUR PROJECT" : "STEP 2 OF 2 · REVIEW YOUR WORK"}</p>
      <h2 id="capstone-modal-title" tabIndex={-1}>{submission?.passed ? "You did it!" : step === "review" ? "Let’s check your work" : "Which project was it?"}</h2>
      <p id="capstone-modal-description">{submission?.passed ? "Congratulations, you accomplished the task. Your submission is saved." : busy ? "Agent is reviewing your picnic app against the course requirements. This can take a moment." : step === "review" ? `Here’s what we’ll check in ${apps.find(app => app.id === selected)?.title ?? submission?.title ?? "your project"}.` : "Pick the picnic app you built to continue."}</p>
      {step === "review" && <div className="capstone-checklist" aria-label="Capstone requirements" aria-busy={busy}>
        <p className="capstone-checklist-summary">{busy ? "Checking all six requirements…" : submission?.checks ? `${submission.checks.filter(item => item.status === "passed").length} of ${CAPSTONE_REQUIREMENTS.length} requirements passed` : "What we’ll check"}</p>
        {CAPSTONE_REQUIREMENTS.map(requirement => {
          const result = busy ? undefined : submission?.checks?.find(item => item.id === requirement.id);
          const label = result?.status === "passed" ? "Passed" : result?.status === "needs_work" ? "Needs work" : result?.status === "unverified" ? "Not verified" : busy ? "Reviewing" : "Not checked";
          return <div key={requirement.id} className={`capstone-check-row ${result?.status ?? "pending"}`}>
            <span className="capstone-check-icon" aria-hidden="true">{result?.status === "passed" ? <Check size={15} /> : result ? <X size={15} /> : busy ? <LoaderCircle className="capstone-spinner" size={15} /> : <span>·</span>}</span>
            <div><strong>{requirement.title}</strong><span className="capstone-check-label">{label}</span><p>{result?.feedback ?? requirement.detail}</p>
              {result && result.status !== "passed" && <LessonPrompt key={improvementPrompt(result)} prompt={improvementPrompt(result)} copyable />}
            </div>
          </div>;
        })}
        {submission && !submission.checks && <p>This earlier review has no item-level results saved.</p>}
      </div>}
      {submission?.passed ? <button type="button" className="capstone-review-button" onClick={() => dialog.current?.close()}>Continue learning <ArrowRight size={18} /></button> : <>
        {step === "project" && <div className="capstone-project-list" role="group" aria-label="Your recent projects" aria-busy={loading || busy}>
          {apps.map((app) => <button type="button" className={`capstone-project-card ${selected === app.id ? "is-selected" : ""}`} key={app.id} disabled={busy} onClick={() => {
            setSelected(app.id); setSubmission(null); setMessage(""); setStep("review");
            requestAnimationFrame(() => { dialog.current?.scrollTo(0, 0); dialog.current?.querySelector<HTMLElement>("#capstone-modal-title")?.focus(); });
          }}>
            <span className="capstone-project-symbol"><Folder size={21} aria-hidden="true" /></span>
            <span className="capstone-project-copy"><strong>{app.title}</strong><small>{app.url?.replace(/^https:\/\//, "") ?? "Replit project"}</small></span>
            <span className="capstone-project-check" aria-hidden="true">{selected === app.id && <Check size={14} />}</span>
          </button>)}
        </div>}
        <p className="capstone-review-status" role="status">{loading ? "Loading your projects…" : message}</p>
        {submission?.passed === false && !busy && <p className="capstone-review-status" role="status">Not quite yet. Follow the checklist feedback above, improve your project, and submit again. “Not verified” means evidence was missing, not necessarily that the feature is broken.</p>}
        {submission?.passed === false && !busy && <button type="button" className="capstone-back-button" onClick={() => {
          dialog.current?.close();
          requestAnimationFrame(() => document.getElementById("capstone-action-title")?.scrollIntoView({ block: "start" }));
        }}>View my action plan on the capstone page</button>}
        {submission?.passed === false && !busy && projectUrl && <a className="signin-primary" href={projectUrl} target="_blank" rel="noopener noreferrer">Let’s work some more on the project <ArrowRight size={18} /></a>}
        {submission?.passed === false && !busy && <small className="capstone-review-note">Paste a suggested prompt into your project’s Agent, make the improvement, and test it. Return here when you’re ready to recheck.{!projectUrl && " Open your project from Replit to continue working."}</small>}
        {authNeeded ? <a className="signin-primary" href={`/api/auth/login?returnTo=${encodeURIComponent(window.location.pathname)}`}>Connect Replit <ArrowRight size={18} /></a> : step === "review" && <button type="button" className={submission?.passed === false && !busy ? "capstone-back-button" : "capstone-review-button"} disabled={loading || busy || !apps.some((app) => app.id === selected)} onClick={submit}>
          {busy ? <><LoaderCircle className="capstone-spinner" size={18} /> Reviewing project</> : submission?.passed === false ? "I’ve made changes. Recheck my project" : <>Review my project <ArrowRight size={18} /></>}
        </button>}
        {step === "review" && <button type="button" className="capstone-back-button" disabled={busy} onClick={() => { setStep("project"); setSubmission(null); setMessage(""); }}>Choose a different project</button>}
        <small className="capstone-review-note">Read-only Agent review. Nothing is published or changed. May use Agent capacity.</small>
      </>}
    </dialog>
  </section>;
}