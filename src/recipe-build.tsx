import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { RECIPE_PROMPT, type RecipeBuild } from "./recipe-activity";

// Local and hosted lessons both use the authenticated MCP integration.
export const RECIPE_DEMO = false;
const TEST_APP_URL = 'https://replit.com/@raoufchebri/CyanRundownObjects';

type Activity = {
  build: RecipeBuild; checking: boolean; error: string; needsAuth: boolean;
  disconnected: boolean; start: () => Promise<void>; refresh: () => Promise<void>;
  showChat: () => void; reconnect: () => void;
  inspections: Record<string, 'loading' | 'complete' | 'error'>;
  inspect: (id: string, prompt: string) => Promise<void>;
  iteration: 'idle' | 'sending' | 'complete' | 'error';
  iterate: () => Promise<void>;
};
const RecipeContext = createContext<Activity | null>(null);
export function useRecipeActivity() {
  const activity = useContext(RecipeContext);
  if (!activity) throw new Error("Recipe activity provider missing");
  return activity;
}

export function RecipeBuildProvider({ children, onShowChat, onAppCreated, onInspect, onIterate }: { children: ReactNode; onShowChat: () => void; onAppCreated: (id: string) => void; onInspect: (prompt: string, appId: string) => Promise<void>; onIterate: () => Promise<void> }) {
  const [iteration, setIteration] = useState<'idle' | 'sending' | 'complete' | 'error'>('idle');
  const iterationPending = useRef(false);
  async function iterate() {
    if (iterationPending.current || iteration === 'complete' || build.status !== 'complete' || !build.replId) return;
    iterationPending.current = true;
    setIteration('sending');
    try { await onIterate(); setIteration('complete'); }
    catch { setIteration('error'); }
    finally { iterationPending.current = false; }
  }
  const [build, setBuild] = useState<RecipeBuild>({ status: "idle" });
  const [checking, setChecking] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [error, setError] = useState("");
  const [disconnected, setDisconnected] = useState(false);
  const [connection, setConnection] = useState(0);
  const submitting = useRef(false);
  const startedThisVisit = useRef(false);
  const inspecting = useRef(false);
  const [inspections, setInspections] = useState<Record<string, 'loading' | 'complete' | 'error'>>({});
  const demoTimers = useRef<number[]>([]);
  useEffect(() => { if (build.replId && !RECIPE_DEMO) onAppCreated(build.replId); }, [build.replId, onAppCreated]);
  useEffect(() => () => demoTimers.current.forEach(window.clearTimeout), []);

  async function refresh() {
    if (RECIPE_DEMO) { setChecking(false); setNeedsAuth(false); return; }
    try {
      const response = await fetch("/api/activities/recipe");
      if (response.status === 401) {
        setBuild({ status: "idle" }); setNeedsAuth(true); setError(""); return;
      }
      if (!response.ok) throw new Error();
      const result = await response.json();
      setBuild(startedThisVisit.current ? result.build : { status: 'idle' });
      setNeedsAuth(!result.canCreate);
      setError("");
    } catch {
      setError("We couldn’t check your saved request. Check again before creating an app.");
    } finally { setChecking(false); }
  }
  useEffect(() => {
    void refresh();
    const checkSession = () => { if (!submitting.current) void refresh(); };
    window.addEventListener("focus", checkSession);
    return () => window.removeEventListener("focus", checkSession);
  }, []);
  useEffect(() => {
    if (build.status !== "submitting") return;
    const timer = window.setInterval(() => { if (!submitting.current) void refresh(); }, 3000);
    return () => window.clearInterval(timer);
  }, [build.status]);

  useEffect(() => {
    if (RECIPE_DEMO || build.status !== "creating") return;
    let errors = 0;
    const events = new EventSource("/api/activities/recipe/events");
    setDisconnected(false);
    events.onmessage = (message) => {
      let event: { status?: string };
      try { event = JSON.parse(message.data); } catch { return; }
      if (event.status === "complete") {
        setBuild((current) => ({ ...current, status: "complete" }));
        setDisconnected(false); events.close();
        void refresh();
      } else if (event.status === "disconnected") {
        setDisconnected(true); events.close();
      } else if (event.status === "creating") {
        errors = 0; setDisconnected(false);
      }
    };
    events.onerror = () => {
      setDisconnected(true);
      if (++errors >= 3) events.close();
    };
    return () => events.close();
  }, [build.status, connection]);

  async function start() {
    if (submitting.current || checking || build.status !== "idle" || needsAuth || error) return;
    submitting.current = true;
    startedThisVisit.current = true;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      try {
        const audio = new AudioContext();
        void audio.resume();
        [523.25, 659.25, 783.99].forEach((frequency, index) => {
          const tone = audio.createOscillator();
          const volume = audio.createGain();
          const at = audio.currentTime + .95 + index * .12;
          tone.frequency.value = frequency;
          volume.gain.setValueAtTime(0, at);
          volume.gain.linearRampToValueAtTime(.025, at + .025);
          volume.gain.exponentialRampToValueAtTime(.001, at + .45);
          tone.connect(volume); volume.connect(audio.destination);
          tone.start(at); tone.stop(at + .5);
        });
        window.setTimeout(() => void audio.close(), 2100);
      } catch { /* Audio is optional; creation must still work when it is unavailable. */ }
    }
    setBuild({ status: "submitting" }); setError(""); onShowChat();
    if (RECIPE_DEMO) {
      demoTimers.current.push(window.setTimeout(() => setBuild({ status: "creating", replId: "demo-only" }), 1200));
      demoTimers.current.push(window.setTimeout(() => { setBuild({ status: "complete", replId: "demo-only" }); submitting.current = false; }, 5000));
      return;
    }
    try {
      const response = await fetch("/api/activities/recipe", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fresh: true }),
      });
      if (response.status === 401) {
        setNeedsAuth(true); setBuild({ status: "idle" });
        setError("Connect Replit with permission to create your app, then try again."); return;
      }
      if (!response.ok) {
        await refresh();
        setError("We couldn’t confirm the request. Check its status before trying again."); return;
      }
      const result = await response.json();
      setBuild(result.build);
    } catch {
      setBuild({ status: "unknown" });
      setError("The connection was interrupted. Check the saved request; do not submit it again.");
    } finally { submitting.current = false; }
  }
  async function inspect(id: string, prompt: string) {
    if (RECIPE_DEMO || inspecting.current || !build.replId || build.status !== 'complete' || inspections[id] === 'complete') return;
    inspecting.current = true;
    setInspections((current) => ({ ...current, [id]: 'loading' }));
    try {
      await onInspect(prompt, build.replId);
      setInspections((current) => ({ ...current, [id]: 'complete' }));
    } catch {
      setInspections((current) => ({ ...current, [id]: 'error' }));
    } finally { inspecting.current = false; }
  }
  return <RecipeContext.Provider value={{ build, checking, error, needsAuth, disconnected, start, refresh, inspections, inspect, iteration, iterate, showChat: onShowChat, reconnect: () => setConnection((value) => value + 1) }}>{children}</RecipeContext.Provider>;
}

export function ProjectLessonStep({ task }: { task: { id: string; label: string; prompt: string } }) {
  const activity = useRecipeActivity();
  const status = activity.inspections[task.id];
  const ready = !RECIPE_DEMO && activity.build.status === 'complete' && !!activity.build.replId;
  return <div className="recipe-build-step project-lesson-step">
    <div className={`recipe-unlock-action ${status === 'complete' ? 'is-open' : ''}`}>
      <button className="recipe-create-button" disabled={!ready || status === 'loading' || status === 'complete'} onClick={() => void activity.inspect(task.id, task.prompt)}>
        <span aria-hidden="true">{status === 'complete' ? '✓' : '⌕'}</span>
        {status === 'complete' ? 'Project explored' : status === 'loading' ? 'Reading your project…' : task.label}
      </button>
    </div>
    <small>{RECIPE_DEMO ? 'Live project inspection is paused for this simulated walkthrough.' : ready ? 'Read-only: shows an explanation of your actual project in chat. No files or services are changed.' : 'Your app needs to finish building before Replit can inspect it.'}</small>
    {!ready && <button onClick={activity.showChat}>Show build status</button>}
    {status === 'loading' && <span className="recipe-demo-spinner" role="status" aria-label="Reading project" />}
    {status === 'error' && <p role="alert">The inspection could not finish. Check the message in chat, then try again. Your lesson stays here.</p>}
  </div>;
}

export function RecipeBuildStatus() {
  const { build, disconnected, reconnect, error, refresh, needsAuth } = useRecipeActivity();
  if (RECIPE_DEMO) return <div className="recipe-build-status" aria-live="polite">
    <small>Simulated conversation</small>
    <strong>{build.status === 'submitting' || build.status === 'creating' ? 'Putting your recipe app together…' : 'Your recipe app is ready to explore'}</strong>
    {(build.status === 'submitting' || build.status === 'creating') && <span className="recipe-demo-spinner" role="status" aria-label="Simulated app creation in progress" />}
    <p>Your request brings together a simple recipe list, a form for adding and editing recipes, and a way to save them in your browser. No sign-in is needed inside this first version.</p>
    <p>For this walkthrough, you can explore the existing test app while you learn how those pieces fit together.</p>
    <a href={TEST_APP_URL} target="_blank" rel="noreferrer">Open the test app ↗</a>
  </div>;
  const active = build.status === "submitting" || (build.status === "creating" && !disconnected);
  const label = build.status === "complete" ? "Your first version is ready to try"
    : build.status === "submitting" ? "Sending your request to Replit"
    : build.status === "creating" && !disconnected ? "Replit is building your recipe app"
    : build.status === "creating" ? "Build started. Live updates are unavailable"
    : build.status === "unknown" ? "We couldn’t confirm the build status"
    : needsAuth ? "Connect Replit to continue" : "Your request hasn’t started yet";
  return <div className="recipe-build-status" aria-live="polite">
    <strong>{label}</strong>
    {active && <span className="recipe-demo-spinner" role="status" aria-label={label} />}
    {build.status === "creating" && <p>The lesson below is unlocked. Explore how your app works while Replit builds it.</p>}
    {build.status === "complete" && <p>Open your app and try adding a recipe. A completed build still needs your review.</p>}
    {build.status === "unknown" && <p>The request may already have created an app. Check your Replit projects before doing anything else. This button will not create another copy.</p>}
    {error && <p role="alert">{error}</p>}
    {build.replUrl && <a href={build.replUrl} target="_blank" rel="noreferrer">Open your recipe app ↗</a>}
    {build.previewUrl && <><a href={build.previewUrl} target="_blank" rel="noreferrer">Try the app preview ↗</a><small>The development preview may require Replit sign-in or a running project. Use the project link if it is unavailable.</small></>}
    {build.status === "unknown" && <a href="https://replit.com/~" target="_blank" rel="noreferrer">Check your Replit projects ↗</a>}
    {disconnected && <button onClick={reconnect}>Reconnect live updates</button>}
    {(error || build.status === "unknown") && <button onClick={() => void refresh()}>Check saved request</button>}
  </div>;
}

export function RecipeBuildStep({ unlocking = false }: { unlocking?: boolean }) {
  const { build, checking, needsAuth, error, start, refresh } = useRecipeActivity();
  const returnTo = window.location.pathname + "#your-app-can-start-with-something-familiar";
  const authUrl = `/api/auth/login?activity=recipe&returnTo=${encodeURIComponent(returnTo)}`;
  const label = checking ? "Checking progress…" : build.replId ? "Lesson unlocked" : build.status === "idle" ? "Click here to create the app" : build.status === "submitting" ? "Creating your app…" : "Check your request below";
  const contents = <>
    <span className="lesson-lock-icon" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path className="lesson-lock-shackle" d="M7 11V7a5 5 0 0 1 10 0v4" /><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M12 15v2" /></svg></span>
    <span>{label}</span>
    <span className="unlock-sparkles" aria-hidden="true"><i>✦</i><i>✧</i><i>✦</i></span>
  </>;
  return <div className="recipe-build-step">
    <div className={`recipe-unlock-action ${unlocking ? "is-unlocking" : ""} ${build.replId || build.status === "submitting" || build.status === "unknown" ? "is-open" : ""}`}>
      {!checking && build.status === "idle" && needsAuth
        ? <a className="recipe-create-button" href={authUrl}>{contents}</a>
        : <button className="recipe-create-button" disabled={checking || build.status !== "idle" || !!error} onClick={() => void start()}>{contents}</button>}
    </div>
    {!checking && build.status === "idle" ? <>
      <small>{RECIPE_DEMO ? "Animation demo only. No account connection, app creation, or credits required." : "Creates a project in your Replit account and may use credits. Nothing is published automatically."}</small>
      {needsAuth && <small>Connect Replit first. You’ll return here to start the build.</small>}
      {error && <><p role="alert">{error}</p><button onClick={() => void refresh()}>Check again</button></>}
    </> : null}
  </div>;
}

export { RECIPE_PROMPT };
