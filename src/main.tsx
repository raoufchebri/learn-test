import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import { appFoundationLessons, courseLessons, learnDisplayTitle, type ChatExchangeExample, type LearnLesson } from "./learn-content";
import { ReplitAccount } from "./replit-account";
import { CapstoneSubmission } from "./capstone-submission";
import { CourseCertificate } from "./course-certificate";
import { LessonPrompt } from "./lesson-prompt";
import { LessonQuizCard } from "./lesson-quiz-card";
import { LEARN_DEV_MODE } from "./learn-mode";
import { courseModules, coursePillars, learnSegment, lessonUrl, lessonUnlocks, isAvailablePillar, isAvailableModule, availableLessonUrls, type CourseModule, type CoursePillar, type CoursePillarId, type LessonUnlock } from "./course-structure";
import { RecipeBuildProvider, RecipeBuildStep, RecipeBuildStatus, ProjectLessonStep, useRecipeActivity, RECIPE_PROMPT, RECIPE_DEMO } from "./recipe-build";
import {
  ReplitPromptComposer,
  type AskDocsReference,
  type DocsSlashPage,
} from "./replit-prompt-composer";
import "./styles.css";
import "./layout-overrides.css";
import "./standalone.css";
import "./video-learning.css";

type Theme = "light" | "dark";
type Palette = "neutral" | "replit" | "silver";
type AskViewMode = "split" | "focus";
type AskSource = { id: string; title: string; heading: string; url: string };
type AskTurn = {
  id: string;
  question: string;
  answer: string;
  error: string;
  loading: boolean;
  sources: AskSource[];
  recipeBuild?: boolean;
  simulatedIteration?: boolean;
};

const askLearnPages: DocsSlashPage[] = [
  { label: "Welcome to Replit Learn", path: "/", section: "Learn" },
  ...courseModules.flatMap((module) =>
    module.lessons.map((lesson) => ({
      label: module.pillar === "discover" ? learnDisplayTitle(lesson.title) : lesson.title,
      path: lessonUrl(module, lesson),
      section: module.title,
    })),
  ),
];

function AppArchitectureMap() {
  return (
    <figure className="recipe-architecture recipe-architecture-image" aria-labelledby="recipe-architecture-title">
      <a href="/images/recipe-app-architecture.png" target="_blank" rel="noreferrer" aria-label="Open recipe app architecture diagram at full size">
        <img src="/images/recipe-app-architecture.png" width="1536" height="1024" loading="lazy" alt="One recipe app, two stages. A personal recipe app saves and loads recipes in browser storage on one device. A private family app sends requests to a backend that verifies sign-in and family access, then reads and writes recipes and membership in a shared database." />
      </a>
      <figcaption id="recipe-architecture-title">One recipe app, two stages</figcaption>
      <p className="recipe-diagram-note">Select the diagram to view it at full size.</p>
    </figure>
  );
}

function UIStatesMap() {
  return (
    <figure className="ui-states-map">
      <figcaption>What someone can experience in an app</figcaption>
      <div>
        <section><span>01</span><b>Empty</b><small>There is nothing here yet. Show the next useful action.</small></section>
        <i>→</i>
        <section><span>02</span><b>Loading</b><small>The app is working. Let people know their request is in progress.</small></section>
        <i>→</i>
        <section><span>03</span><b>Ready</b><small>The information or action is available.</small></section>
        <i>→</i>
        <section><span>04</span><b>Success or error</b><small>Confirm what happened, or explain what someone can do next.</small></section>
      </div>
    </figure>
  );
}

function FrontendExample() {
  return (
    <figure className="frontend-example">
      <figcaption>A frontend turns an app task into a clear screen</figcaption>
      <div className="frontend-window">
        <header><span className="window-mark">▣</span><strong>Weekly plan</strong><button>＋ Add task</button></header>
        <main>
          <section>
            <p>MONDAY, JULY 14</p>
            <h3>Today’s tasks</h3>
            <div className="task-row"><span className="task-check checked">✓</span><b>Send project update</b><small>Done</small></div>
            <div className="task-row"><span className="task-check" /><b>Review new requests</b><small>2:00 PM</small></div>
            <div className="task-row"><span className="task-check" /><b>Plan tomorrow</b><small>4:30 PM</small></div>
          </section>
          <aside><span>READY</span><strong>3 tasks</strong><small>Your plan is up to date.</small></aside>
        </main>
      </div>
      <p>The interface shows information, makes an action easy to find, and gives feedback when something changes.</p>
    </figure>
  );
}

// Renders [label](https://...) in lesson copy as an external link; everything else stays plain text.
function LinkedText({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\(https:\/\/[^)\s]+\))/g);
  return <>{parts.map((part, index) => {
    const match = /^\[([^\]]+)\]\((https:\/\/[^)\s]+)\)$/.exec(part);
    return match ? <a key={index} href={match[2]} target="_blank" rel="noopener noreferrer">{match[1]}</a> : part;
  })}</>;
}

// The lesson's prompt as a Replit chat bubble. Clicking it copies the prompt; hovering shows how.
function PromptBubble({ prompt, done, status, onCopy }: { prompt: string; done: boolean; status?: "copied" | "failed"; onCopy: () => void }) {
  return <div className={`prompt-bubble-row ${done ? "is-done" : ""} ${status ? "has-status" : ""}`}>
    <button type="button" className="prompt-bubble" onClick={onCopy} aria-label={`Copy prompt: ${prompt}`} aria-describedby={undefined}>
      <span className="prompt-bubble-copy" aria-hidden="true"><Icons.Copy size={14} /></span>
      {prompt}
    </button>
    <p className="prompt-bubble-meta" role="status">
      {status === "failed" ? "Couldn’t copy automatically. Select the text and copy it."
        : status === "copied" ? <><Icons.Check size={12} aria-hidden="true" /> Copied</>
        : <><Icons.Copy size={12} aria-hidden="true" /> Click to copy</>}
    </p>
  </div>;
}

// Replit's reply under the bubble: a note that it's an example, the thinking line, then the answer.
// With stream, the thinking line shimmers briefly and the answer appears a few words at a time, like Replit's chat.
function ChatExchange({ exchange, stream = false, onDone }: { exchange: ChatExchangeExample; stream?: boolean; onDone?: () => void }) {
  type Part = { text: string; bold?: boolean };
  type Block = { kind: "p" | "li" | "tools" | "image"; parts: Part[] };
  const blocks = useMemo(() => {
    const list: Block[] = [];
    if (exchange.intro) list.push({ kind: "p", parts: [{ text: exchange.intro }] });
    if (exchange.tools) list.push({ kind: "tools", parts: [{ text: exchange.tools }] });
    if (exchange.imageCard) list.push({ kind: "image", parts: [{ text: "image" }] });
    (exchange.items ?? []).forEach((item) => list.push({ kind: "li", parts: [{ text: item.label, bold: true }, { text: `${exchange.labelSeparator ?? ": "}${item.text}` }] }));
    if (exchange.outro) list.push({ kind: "p", parts: [{ text: exchange.outro }] });
    if (exchange.question) list.push({ kind: "p", parts: [{ text: exchange.question, bold: true }] });
    // The image card counts as a few "words" so it appears as one piece mid-stream.
    return list.map((block) => ({ ...block, parts: block.parts.map((part) => ({ ...part, tokens: block.kind === "image" ? ["", "", "", "", "", ""] : part.text.split(/(\s+)/).filter(Boolean) })) }));
  }, [exchange]);
  const total = blocks.reduce((sum, block) => sum + block.parts.reduce((count, part) => count + part.tokens.length, 0), 0);
  const animate = stream && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [thinking, setThinking] = useState(animate);
  const [shown, setShown] = useState(animate ? 0 : total);
  useEffect(() => {
    if (!animate) return;
    let interval = 0;
    const start = window.setTimeout(() => {
      setThinking(false);
      interval = window.setInterval(() => setShown((value) => { const next = value + 3; if (next >= total) window.clearInterval(interval); return Math.min(next, total); }), 40);
    }, exchange.thinking ? 1000 : 600);
    return () => { window.clearTimeout(start); window.clearInterval(interval); };
  }, [animate, total]);
  // Tell the lesson when the answer is fully shown, so the next content can fade in.
  useEffect(() => { if (!thinking && shown >= total) onDone?.(); }, [thinking, shown, total]);
  let budget = shown;
  const rendered = blocks.map((block) => {
    const parts = block.parts.map((part) => { const take = Math.max(0, Math.min(part.tokens.length, budget)); budget -= take; return { ...part, visible: part.tokens.slice(0, take).join(""), complete: take === part.tokens.length }; });
    return { kind: block.kind, parts, empty: block.kind === "image" ? !parts.every((part) => part.complete) : parts.every((part) => !part.visible), done: parts.every((part) => part.complete) };
  });
  const content = (block: typeof rendered[number]) => block.parts.map((part, index) => part.visible ? (part.bold ? <strong key={index}>{part.visible}</strong> : <span key={index}>{part.visible}</span>) : null);
  const items = rendered.filter((block) => block.kind === "li" && !block.empty);
  const firstLi = rendered.findIndex((block) => block.kind === "li");
  return <div className="chat-reply" aria-label="Example reply from Replit" aria-busy={shown < total}>
    <p className="chat-reply-note">Here’s an example of what Replit can answer. Yours may be different.</p>
    {exchange.thinking && <p className={`chat-reply-thinking ${thinking ? "is-thinking" : ""}`}>{exchange.thinking}</p>}
    {thinking && !exchange.thinking && <p className="chat-reply-thinking is-thinking">Thinking…</p>}
    {!thinking && <div className="chat-reply-answer">
      {rendered.map((block, index) => {
        if (block.kind === "li") return index === firstLi && items.length ? <ol key="list">{items.map((item, itemIndex) => <li key={itemIndex}>{content(item)}</li>)}</ol> : null;
        if (block.kind === "image") return block.done && exchange.imageCard ? <figure key={index} className="chat-reply-image-card fade-in-step">
          <div className="chat-reply-image-header"><span aria-hidden="true"><Icons.Image size={16} /></span><div><strong>{exchange.imageCard.title}</strong><small>Image</small></div></div>
          <div className="chat-reply-image-body"><ZoomableImage src={exchange.imageCard.src} alt={exchange.imageCard.alt} lazy /></div>
        </figure> : null;
        if (block.kind === "tools") return block.empty ? null : <p key={index} className="chat-reply-tools">{content(block)}</p>;
        return block.empty ? null : <p key={index}>{content(block)}</p>;
      })}
    </div>}
  </div>;
}

// Opens a URL in a window on the right half of the screen so the lesson stays visible. Returns false if the
// browser blocked the window, in which case the link's normal new-tab behaviour is used instead.
function openBesideLesson(url: string): boolean {
  const screenLeft = (window.screen as Screen & { availLeft?: number }).availLeft ?? 0;
  const screenTop = (window.screen as Screen & { availTop?: number }).availTop ?? 0;
  const width = Math.max(480, Math.round(window.screen.availWidth / 2));
  const height = window.screen.availHeight;
  const left = screenLeft + window.screen.availWidth - width;
  const opened = window.open(url, "replit-beside-lesson", `popup=yes,width=${width},height=${height},left=${left},top=${screenTop}`);
  if (!opened) return false;
  try { opened.opener = null; } catch { /* Cross-origin windows may not allow this. */ }
  // Best effort: ask to keep the lesson in front. Most browsers ignore this on purpose (no pop-unders); a few honour it.
  try { opened.blur(); window.focus(); window.setTimeout(() => window.focus(), 0); } catch { /* Ignored by the browser. */ }
  return true;
}

// Screenshot that opens large on click. In the viewer, clicking the image toggles fit-to-screen and full size.
function ZoomableImage({ src, alt, lazy = false }: { src: string; alt: string; lazy?: boolean }) {
  const viewer = useRef<HTMLDialogElement>(null);
  const [fullSize, setFullSize] = useState(false);
  const open = () => { setFullSize(false); viewer.current?.showModal(); };
  return <>
    <button type="button" className="screenshot-zoom-trigger" onClick={open} aria-label={`Zoom in: ${alt}`}>
      <img src={src} alt={alt} loading={lazy ? "lazy" : undefined} />
      <span className="screenshot-zoom-hint" aria-hidden="true"><Icons.ZoomIn size={16} /></span>
    </button>
    <dialog ref={viewer} className="screenshot-viewer" aria-label={alt} onClick={(event) => { if (event.target === event.currentTarget) viewer.current?.close(); }}>
      <button type="button" className="screenshot-viewer-close" onClick={() => viewer.current?.close()} aria-label="Close"><Icons.X size={20} /></button>
      <div className={`screenshot-viewer-stage ${fullSize ? "is-full" : ""}`} onClick={(event) => { if (event.target === event.currentTarget) viewer.current?.close(); }}>
        <img src={src} alt={alt} onClick={() => setFullSize((value) => !value)} title={fullSize ? "Fit to screen" : "View full size"} />
      </div>
    </dialog>
  </>;
}

function LessonPage({
  lesson,
  chapter,
  nextLesson,
  chatOpen = false,
  onComplete,
  completed = false,
  unlocks = [],
  doneUnlocks = [],
  onUnlock,
}: {
  lesson: LearnLesson;
  chapter: number;
  chatOpen?: boolean;
  onComplete?: () => void;
  completed?: boolean;
  unlocks?: LessonUnlock[];
  doneUnlocks?: string[];
  onUnlock?: (id: string) => void;
  nextLesson?: { title: string; onClick: () => void };
}) {
  const recipe = useRecipeActivity();
  const recipeLesson = lesson.activity === "recipe-build";
  // A completed lesson opens fully: every gate below counts as passed.
  // Unlock buttons (entry, copy-the-prompt, activity) are stored per learner, so an unlocked step stays unlocked.
  const [sessionUnlocks, setSessionUnlocks] = useState<string[]>([]);
  const isUnlocked = (id?: string) => !id || LEARN_DEV_MODE || completed || doneUnlocks.includes(id) || sessionUnlocks.includes(id);
  const entryUnlock = unlocks.find((unlock) => unlock.kind === "entry");
  const activityUnlock = unlocks.find((unlock) => unlock.kind === "activity");
  const promptUnlocks = unlocks.filter((unlock) => unlock.kind === "prompt");
  const revealUnlocks = unlocks.filter((unlock) => unlock.kind === "reveal");
  // Steps that gate the rest of the lesson, in order: copy the prompt, then (when there's an example) reveal the answer.
  const firstLockedPrompt = unlocks.filter((unlock) => unlock.kind === "prompt" || unlock.kind === "reveal").find((unlock) => !isUnlocked(unlock.id))?.sectionIndex ?? -1;
  const sectionStepsDone = (sectionIndex: number) => isUnlocked(promptUnlocks.find((unlock) => unlock.sectionIndex === sectionIndex)?.id) && isUnlocked(revealUnlocks.find((unlock) => unlock.sectionIndex === sectionIndex)?.id);
  const [entryOpenedState, setEntryOpened] = useState(LEARN_DEV_MODE || !lesson.entryLink);
  const entryOpened = entryOpenedState || isUnlocked(entryUnlock?.id) && !!entryUnlock || completed;
  const promptContinuedSteps = LEARN_DEV_MODE || completed || firstLockedPrompt < 0;
  const [promptCopy, setPromptCopy] = useState<Record<number, "copied" | "failed">>({});
  // Sections whose example answer was just revealed in this visit: those stream in; stored ones appear instantly.
  const [streamingSections, setStreamingSections] = useState<number[]>([]);
  // Sequence after copying: the button turns green, the answer streams, then the rest fades in.
  const [streamDone, setStreamDone] = useState<number[]>([]);
  const holdingSection = streamingSections.filter((index) => !streamDone.includes(index)).sort((a, b) => a - b)[0] ?? -1;
  // Fade in only content that first appears after a learner unlocks something in this visit (not on page load).
  const revealAnimating = useRef(false);
  const fadeAtMount = useRef(new Map<string, boolean>());
  const fadeClass = (key: string) => {
    if (!fadeAtMount.current.has(key)) fadeAtMount.current.set(key, revealAnimating.current);
    return fadeAtMount.current.get(key) ? "fade-in-step" : "";
  };
  const promptContinued = promptContinuedSteps && holdingSection < 0;
  const hasFrontendCheck = lesson.title === 'What Is Replit Building?';
  const hasCheckpoint = hasFrontendCheck || !!lesson.checkpoint;
  const checkpointIndex = lesson.checkpoint?.afterSection ?? 2;
  const [frontendAnswers, setFrontendAnswers] = useState<Array<number | undefined>>([]);
  const frontendQuestions = lesson.checkpoint?.questions ?? [
    { prompt: 'What tells your recipe app how to save a recipe?', choices: ['Written instructions called code, saved in files', 'The name of the project alone', 'The screenshot of the app'], answer: 0, feedback: 'Code gives the app instructions, and Replit saves those instructions in files.' },
    { prompt: 'You type into the search field and the recipe list changes. Which explanation fits?', choices: ['The frontend is only a picture, so it cannot respond', 'The frontend shows the field and list, while app logic decides which recipes match', 'Every search needs a separate published app'], answer: 1, feedback: 'The interface and logic work together. In this recipe app, both run in your browser.' },
  ];
  const frontendPassed = !hasCheckpoint || frontendQuestions.every((question, index) => frontendAnswers[index] === question.answer);
  const [frontendReady, setFrontendReady] = useState(RECIPE_DEMO && hasFrontendCheck);
  const [frontendOpened, setFrontendOpened] = useState(RECIPE_DEMO && hasFrontendCheck);
  const frontendUnlockRef = useRef<HTMLButtonElement>(null);
  const frontendVisible = LEARN_DEV_MODE || completed || !hasCheckpoint || frontendOpened;
  useEffect(() => { setFrontendAnswers([]); setFrontendReady(RECIPE_DEMO && hasFrontendCheck); setFrontendOpened(RECIPE_DEMO && hasFrontendCheck); }, [lesson.title]);
  const unlocked = LEARN_DEV_MODE || completed || lesson.testingUnlocked || (lesson.projectTask ? recipe.inspections[lesson.projectTask.id] === 'complete' : !recipeLesson || (!!recipe.build.replId && ['creating', 'complete'].includes(recipe.build.status)));
  const promptIndex = lesson.projectTask ? 0 : lesson.sections.findIndex((section) => !!section.prompt);
  const location = useLocation();
  const [unlockCelebration, setUnlockCelebration] = useState(false);
  const previousBuildStatus = useRef(recipe.build.status);
  const previousIteration = useRef(recipe.iteration);
  useEffect(() => {
    const justFinished = previousIteration.current !== 'complete' && recipe.iteration === 'complete';
    previousIteration.current = recipe.iteration;
    if (!hasFrontendCheck || !justFinished) return;
    setUnlockCelebration(true);
    playUnlockChime();
    const timer = window.setTimeout(() => setUnlockCelebration(false), 2200);
    return () => window.clearTimeout(timer);
  }, [recipe.iteration, hasFrontendCheck]);
  const unlockTimers = useRef<number[]>([]);
  // Unlock a step once: celebrate and save it. Already-unlocked steps (stored or this visit) do nothing.
  // Celebrate an unlock: the lock opens, the sound plays, and optionally confetti.
  const celebrateUnlock = (alwaysChime = false, confetti = false) => {
    setUnlockCelebration(true);
    if (confetti) setConfettiBurst((burst) => burst + 1);
    if (alwaysChime || !window.matchMedia('(prefers-reduced-motion: reduce)').matches) playUnlockChime();
    unlockTimers.current.push(window.setTimeout(() => setUnlockCelebration(false), 2000));
  };
  // quiet saves the unlock now and leaves the celebration for later (after an answer streams in).
  const unlockStep = (id?: string, alwaysChime = false, confetti = false, quiet = false) => {
    if (id && isUnlocked(id)) return;
    revealAnimating.current = true;
    if (id) { setSessionUnlocks((current) => [...current, id]); onUnlock?.(id); }
    if (!quiet) celebrateUnlock(alwaysChime, confetti);
  };
  // Sections waiting to celebrate once their answer finishes streaming (value: whether to add confetti).
  const pendingCelebrations = useRef(new Map<number, boolean>());
  const inspectedBefore = useRef(unlocked);
  useEffect(() => {
    const justInspected = !inspectedBefore.current && unlocked;
    inspectedBefore.current = unlocked;
    if (!lesson.projectTask || !justInspected) return;
    const timer = window.setTimeout(() => {
      const section = lesson.sections[1];
      document.getElementById(section.id ?? learnSegment(section.heading))?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [unlocked, lesson]);
  useEffect(() => () => {
    unlockTimers.current.forEach(window.clearTimeout);
  }, [lesson]);
  useEffect(() => {
    const justCreated = previousBuildStatus.current === "idle" && recipe.build.status === "submitting";
    previousBuildStatus.current = recipe.build.status;
    if (!recipeLesson || !justCreated) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const celebrate = window.setTimeout(() => setUnlockCelebration(true), reduced ? 0 : 950);
    const timer = window.setTimeout(() => {
      const nextSection = lesson.sections[promptIndex + 1];
      const target = document.getElementById("recipe-prompt-explanation") ?? (nextSection && document.getElementById(nextSection.id ?? learnSegment(nextSection.heading)));
      if (!target) return;
      const from = window.scrollY;
      const to = from + target.getBoundingClientRect().top - 28;
      if (reduced) { window.scrollTo(0, to); return; }
      const started = performance.now();
      const scroll = window.setInterval(() => {
        const t = Math.min(1, (performance.now() - started) / 1000);
        const eased = t * t * (3 - 2 * t);
        window.scrollTo({ top: from + (to - from) * eased, behavior: "instant" });
        if (t === 1) window.clearInterval(scroll);
      }, 16);
      unlockTimers.current.push(scroll);
    }, reduced ? 0 : 2450);
    const finish = window.setTimeout(() => setUnlockCelebration(false), reduced ? 50 : 3450);
    const orient = window.setTimeout(() => window.dispatchEvent(new Event("learn-highlight-chat")), reduced ? 100 : 3650);
    unlockTimers.current.push(celebrate, timer, finish, orient);
  }, [recipe.build.status, recipe.build.replId, recipeLesson, lesson, promptIndex]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [practiceChecks, setPracticeChecks] = useState<number[]>([]);
  const [confirmedActivity, setConfirmedActivity] = useState<string | null>(null);
  const activityConfirmed = completed || !lesson.activityConfirmation || confirmedActivity === lesson.title || (!!activityUnlock && isUnlocked(activityUnlock.id));
  useEffect(() => {
    setConfirmedActivity(null);
    setUnlockCelebration(false);
  }, [lesson.title]);
  const [copyStatus, setCopyStatus] = useState('Copy request');
  const practiceDone = completed || activityConfirmed && (!lesson.practice || lesson.practice.checks.every((_, index) => practiceChecks.includes(index)));
  const quizPassed = practiceDone && lesson.quiz.length > 0 && lesson.quiz.every((question, index) => answers[index] === question.answer);
  const nextUnlockRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!hasCheckpoint || !frontendPassed || frontendReady) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    frontendUnlockRef.current?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'center' });
    const timer = window.setTimeout(() => {
      setFrontendReady(true);
      setUnlockCelebration(true);
      if (!reduced) {
        try {
          const audio = new AudioContext();
          void audio.resume();
          [523.25, 659.25, 783.99].forEach((frequency, index) => {
            const tone = audio.createOscillator();
            const volume = audio.createGain();
            const at = audio.currentTime + index * .12;
            tone.frequency.value = frequency;
            volume.gain.setValueAtTime(0, at);
            volume.gain.linearRampToValueAtTime(.025, at + .025);
            volume.gain.exponentialRampToValueAtTime(.001, at + .45);
            tone.connect(volume); volume.connect(audio.destination);
            tone.start(at); tone.stop(at + .5);
          });
          window.setTimeout(() => void audio.close(), 1000);
        } catch { /* Optional audio. */ }
      }
      unlockTimers.current.push(window.setTimeout(() => setUnlockCelebration(false), 2000));
    }, reduced ? 250 : 1100);
    return () => window.clearTimeout(timer);
  }, [hasCheckpoint, frontendPassed, frontendReady]);
  useEffect(() => {
    // Only a quiz the learner answered in this visit can complete the lesson (never answers filled in for review).
    if (!onComplete || completed || !quizPassed || !unlocked || !answeredThisVisit.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    nextUnlockRef.current?.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "center" });
    const reveal = window.setTimeout(() => {
      onComplete();
      setUnlockCelebration(true);
      setConfettiBurst((burst) => burst + 1);
      if (!reduced) {
        try {
          const audio = new AudioContext();
          void audio.resume();
          [523.25, 659.25, 783.99].forEach((frequency, index) => {
            const tone = audio.createOscillator();
            const volume = audio.createGain();
            const at = audio.currentTime + index * .12;
            tone.frequency.value = frequency;
            volume.gain.setValueAtTime(0, at);
            volume.gain.linearRampToValueAtTime(.025, at + .025);
            volume.gain.exponentialRampToValueAtTime(.001, at + .45);
            tone.connect(volume); volume.connect(audio.destination);
            tone.start(at); tone.stop(at + .5);
          });
          window.setTimeout(() => void audio.close(), 1000);
        } catch { /* Celebration audio is optional. */ }
      }
      unlockTimers.current.push(window.setTimeout(() => setUnlockCelebration(false), 2000));
    }, reduced ? 250 : 1100);
    return () => window.clearTimeout(reveal);
  }, [quizPassed, completed, unlocked]);
  const [quizMode, setQuizMode] = useState(false);
  const quizReview = useRef(false);
  const answeredThisVisit = useRef(false);
  // Each celebration starts a confetti shower that runs to the end on its own timer.
  const [confettiBurst, setConfettiBurst] = useState(0);
  // Confetti is only for completing a lesson (passing its quiz). Unlock buttons keep their lock animation and chime.
  const quizCardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!quizMode) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (quizReview.current) return; // Revisiting a completed lesson: show the passed quiz in place, don't jump to it.
    quizCardRef.current?.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "start" });
    quizCardRef.current?.focus({ preventScroll: true });
  }, [quizMode]);

  useEffect(() => {
    setAnswers([]);
    if (location.hash) {
      const targetId = decodeURIComponent(location.hash.slice(1));
      window.requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({ block: "start" });
      });
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [lesson.title, location.hash]);
  // Completed lesson: the quiz is shown as taken, with the correct answers checked and the Continue button.
  // If the lesson turns out not to be completed (for example after a reset), clear those review answers.
  useEffect(() => {
    if (!completed) {
      if (quizReview.current && !answeredThisVisit.current) { quizReview.current = false; setAnswers([]); setQuizMode(false); }
      return;
    }
    if (lesson.quiz.length === 0 || quizMode) return;
    quizReview.current = true;
    setAnswers(lesson.quiz.map((question) => question.answer));
    setQuizMode(true);
  }, [completed]);

  return (
    <article className={`lesson-content learn-content-stage ${quizMode ? 'quiz-mode' : ''}`} id="overview" key={lesson.title}>
      {confettiBurst > 0 && <LessonConfetti key={confettiBurst} onDone={() => setConfettiBurst(0)} />}
      <p className="eyebrow">{learnDisplayTitle(lesson.module).toUpperCase()} / {lesson.navigationTitle === 'Module overview' ? 'MODULE OVERVIEW' : `CHAPTER ${chapter + 1}`} · {lesson.duration}</p>
      <h1>{learnDisplayTitle(lesson.title)}</h1>
      <div className="lesson-reading-body">
      {lesson.testingUnlocked && lesson.projectTask && <p className="caption">Testing access: this lesson is open for review. Project inspection still requires a completed app.</p>}
      <p className="intro">{lesson.summary}</p>
      {lesson.openingImage && <figure className="lesson-app-screenshot"><ZoomableImage src={lesson.openingImage.src} alt={lesson.openingImage.alt} /><figcaption>Replit home · Personal details replaced for this example.</figcaption></figure>}
      {lesson.introduction?.map((paragraph) => typeof paragraph === 'string'
        ? <p className="lesson-introduction-copy" key={paragraph}><LinkedText text={paragraph} /></p>
        : <div className="lesson-introduction-copy" key={paragraph.text}><p><LinkedText text={paragraph.text} /></p><ul>{paragraph.items.map((item) => <li key={item}><LinkedText text={item} /></li>)}</ul></div>)}
      {lesson.title === 'What Is Replit Building?' && <RecipeProjectLink />}
      {lesson.encouragement && (
        <aside className="lesson-encouragement">
          <Icons.Sparkles size={18} aria-hidden="true" />
          <p>{lesson.encouragement}</p>
        </aside>
      )}
      {lesson.outcomes && (
        <section className="learning-outcomes">
          <p className="learning-outcomes-heading">By the end of this lesson, you will be able to:</p>
          <ul>{lesson.outcomes.map((outcome) => <li key={outcome}><span>✓</span>{outcome}</li>)}</ul>
        </section>
      )}
      {lesson.entryLink && <div className={`recipe-unlock-action ${entryOpened ? 'is-open' : ''}`}>
        <p>{lesson.entryIntro ?? 'First, open a new conversation in Replit. Keep this lesson open so you can follow along.'}</p>
        <a className="recipe-create-button" href={lesson.entryLink} target="_blank" rel="noopener noreferrer" onClick={(event) => {
          // Plain click: open Replit in a window on the right half of the screen, beside the lesson.
          // ⌘/Ctrl/Shift-click keeps the browser's own behaviour (for example a background tab).
          if (!event.metaKey && !event.ctrlKey && !event.shiftKey && openBesideLesson(lesson.entryLink!)) event.preventDefault();
          if (!entryOpened) { setEntryOpened(true); unlockStep(entryUnlock?.id); }
        }} onAuxClick={(event) => {
          // Middle-click opens Replit in a background tab; count it as opening Replit too.
          if (event.button === 1 && !entryOpened) { setEntryOpened(true); unlockStep(entryUnlock?.id); }
        }}><LessonUnlockIcon /><span>{lesson.entryLabel ?? 'Open Replit and start a chat'}</span></a>
        <small>Opens Replit in a window next to this lesson, so you can see both.</small>
      </div>}
      {entryOpened && <>
      {lesson.sections.map((section, sectionIndex) => (
        (!LEARN_DEV_MODE && !completed && ((firstLockedPrompt >= 0 && sectionIndex > firstLockedPrompt) || (holdingSection >= 0 && sectionIndex > holdingSection) || (!unlocked && sectionIndex > promptIndex) || (!frontendVisible && sectionIndex > checkpointIndex) || (hasFrontendCheck && sectionIndex > 5 && recipe.iteration !== 'complete'))) ? null : <section className={`foundation-section ${fadeClass(`section-${sectionIndex}`)} ${((recipeLesson || lesson.projectTask) && sectionIndex > promptIndex) || (hasCheckpoint && sectionIndex > checkpointIndex) || (lesson.promptGate && sectionIndex > 0) ? "lesson-unlocked" : ""}`} id={section.id ?? learnSegment(section.heading)} key={section.heading}>
          <h2>{section.heading}</h2>
          <p>{section.body}</p>
          {section.prompt && (() => {
            const promptUnlock = promptUnlocks.find((unlock) => unlock.sectionIndex === sectionIndex);
            if (!promptUnlock) return <LessonPrompt key={section.prompt} prompt={section.prompt} />;
            const done = isUnlocked(promptUnlock.id);
            const copy = promptCopy[sectionIndex];
            const revealUnlock = revealUnlocks.find((unlock) => unlock.sectionIndex === sectionIndex);
            const revealed = isUnlocked(revealUnlock?.id);
            // Copying the prompt also reveals Replit's example answer (streamed, with confetti) in the chat above.
            const copyPrompt = async () => {
              try { await navigator.clipboard.writeText(section.prompt!); setPromptCopy((current) => ({ ...current, [sectionIndex]: "copied" })); }
              catch { setPromptCopy((current) => ({ ...current, [sectionIndex]: "failed" })); }
              const reveal = revealUnlocks.find((unlock) => unlock.sectionIndex === sectionIndex);
              if (reveal && !isUnlocked(reveal.id)) {
                // Sequence: the answer streams first; when it ends, the button turns green, the sound
                // (and, for the lesson's first answer only, confetti) plays, and the next block fades in.
                pendingCelebrations.current.set(sectionIndex, reveal.id === revealUnlocks[0]?.id);
                setStreamingSections((current) => [...current, sectionIndex]);
                unlockStep(promptUnlock.id, false, false, true);
                unlockStep(reveal.id, false, false, true);
              } else unlockStep(promptUnlock.id);
            };
            return <>
              <div className={`lesson-chat-thread ${holdingSection === sectionIndex ? 'is-streaming' : ''}`} role="group" aria-label="Chat in Replit">
                <PromptBubble prompt={section.prompt} done={done} status={copy} onCopy={copyPrompt} />
                {section.exchange && done && revealed && <ChatExchange exchange={section.exchange} stream={streamingSections.includes(sectionIndex)}
                  onDone={() => {
                    setStreamDone((current) => current.includes(sectionIndex) ? current : [...current, sectionIndex]);
                    const confetti = pendingCelebrations.current.get(sectionIndex);
                    if (confetti === undefined) return;
                    pendingCelebrations.current.delete(sectionIndex);
                    celebrateUnlock(false, confetti);
                  }} />}
              </div>
              {/* Unlock button under each chat: stays in place and turns green with a check once unlocked. */}
              {revealUnlock && <div className={`recipe-unlock-action reveal-unlock ${done && revealed && holdingSection !== sectionIndex ? 'is-open' : ''}`}>
                <button type="button" className="recipe-create-button" onClick={() => void copyPrompt()}>
                  {done && revealed && holdingSection !== sectionIndex ? <Icons.Check size={20} aria-hidden="true" /> : <LessonUnlockIcon />}<span>Click on the prompt to copy it</span>
                </button>
              </div>}
            </>;
          })()}
          {recipeLesson && section.prompt && <RecipeBuildStep unlocking={unlockCelebration} />}
          {lesson.projectTask && sectionIndex === 0 && <ProjectLessonStep task={lesson.projectTask} />}
          {section.afterPrompt && unlocked && sectionStepsDone(sectionIndex) && holdingSection !== sectionIndex && (recipeLesson ? <>
            <h2 id="recipe-prompt-explanation">What just happened now?</h2>
            <p>The highlighted area on the right side of the screen is the chat. It shows your request in a message bubble. On smaller screens, the chat opens in its own panel. That request is a prompt: a description of what you want to create, written in natural language.</p>
            <p>You asked for a personal recipe app where you can add, edit, and find recipes. Each recipe needs a name, ingredients, and instructions.</p>
            <p>That means an interface with forms and buttons, app logic that responds when you use them, and storage that keeps your recipes in this browser. For this first version, all three work in the browser. No sign-in or separate backend is needed.</p>
            <p>Let’s explore the building blocks this prompt describes.</p>
          </> : <p className={fadeClass(`after-${sectionIndex}`)}>{section.afterPrompt}</p>)}
          {section.items && <ul className="lesson-points">{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}
          {hasCheckpoint && sectionIndex === checkpointIndex && <div className="lesson-quiz" aria-label="Lesson checkpoint">
            <h3>Try these two ideas</h3>
            {frontendQuestions.map((question, index) => <div className="quiz-question" key={question.prompt}>
              <h3>{index + 1}. {question.prompt}</h3>
              {question.choices.map((choice, choiceIndex) => <button key={choice} aria-pressed={frontendAnswers[index] === choiceIndex} className={frontendAnswers[index] === choiceIndex ? choiceIndex === question.answer ? 'selected correct' : 'selected' : ''} onClick={() => setFrontendAnswers(current => { const next = [...current]; next[index] = choiceIndex; return next; })}><span>{String.fromCharCode(65 + choiceIndex)}</span>{choice}</button>)}
              {frontendAnswers[index] !== undefined && <p role="status" className="quiz-feedback">{frontendAnswers[index] === question.answer ? `That’s right. ${question.feedback ?? ''}` : 'Not quite. Revisit the explanation above, then try another answer.'}</p>}
            </div>)}
            <div className={`recipe-unlock-action ${frontendReady ? 'is-open' : ''} ${unlockCelebration ? 'is-unlocking' : ''}`}>
              <button ref={frontendUnlockRef} className="recipe-create-button" disabled={!frontendReady || frontendOpened} onClick={() => {
                setFrontendOpened(true);
                window.setTimeout(() => document.getElementById(learnSegment(lesson.sections[checkpointIndex + 1].heading))?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }), 100);
              }}><LessonUnlockIcon /><span>{frontendOpened ? 'Lesson unlocked' : frontendReady ? 'Continue the lesson' : 'Unlock the rest of the lesson'}</span></button>
              <small role="status">{frontendReady ? 'Ready when you are. Continue below.' : 'Answer both questions correctly to unlock the rest of the lesson.'}</small>
            </div>
          </div>}
          {recipeLesson && section.id === "a-few-building-blocks-make-it-work" && <p>In the next lesson, you’ll explore what Replit is doing while your app builds. After that, you’ll look inside its project, code, and files.</p>}
          {section.image && sectionStepsDone(sectionIndex) && (
            <figure className="lesson-app-screenshot">
              <ZoomableImage src={section.image.src} alt={section.image.alt} lazy />
              <figcaption>{section.image.caption}{section.image.source && <> <a href={section.image.source} target="_blank" rel="noreferrer">Source</a></>}</figcaption>
            </figure>
          )}
          {section.diagram === 'recipe-architecture' && <AppArchitectureMap />}
          {section.diagram === 'recipe-iteration' && <div><p>This is what the cycle looks like:</p><ol className="recipe-iteration-flow">{['Describe your idea in a prompt.', 'Create a first version.', 'Try it and compare it with your expectations.', 'Request one specific improvement.', 'Try again. Repeat as your idea takes shape.'].map(step => <li key={step}>{step}</li>)}</ol><p>For example: “Keep the current recipe features, but add a way to mark favorites.” Try that change before asking for another.</p><p>This course focuses on how the app’s components work together. Explore the Design course to go deeper into appearance and different visual directions.</p></div>}
          {lesson.title === 'What Is Replit Building?' && section.heading === 'When it is ready, give it a small test' && <RecipeProjectPreview />}
          {hasFrontendCheck && section.diagram === 'recipe-iteration' && <div className={`recipe-unlock-action ${recipe.iteration === 'complete' ? 'is-open' : ''} ${unlockCelebration ? 'is-unlocking' : ''}`}>
            <button className="recipe-create-button" disabled={recipe.build.status !== 'complete' || recipe.iteration === 'sending' || recipe.iteration === 'complete'} onClick={() => void recipe.iterate()}>
              <LessonUnlockIcon />
              {recipe.iteration === 'complete' ? 'Lesson unlocked' : recipe.iteration === 'sending' ? 'Sending your request…' : 'Ask Replit to make this change'}
            </button>
            <p>Click this button to ask Replit to make the change and unlock the rest of the lesson.</p>
            <small>Updates your recipe app in Replit and may use credits. Wait for the first build to finish. Nothing is published automatically.</small>
            {recipe.iteration === 'error' && <p role="alert">We couldn’t confirm the request. Check your project in Replit before trying again.</p>}
          </div>}
        </section>
      ))}
      {promptContinued && unlocked && frontendVisible && (LEARN_DEV_MODE || completed || !hasFrontendCheck || recipe.iteration === 'complete') && <div className={`${recipeLesson ? "lesson-unlocked" : ""} ${fadeClass("lesson-end")}`}>
      {lesson.replitExample && !recipeLesson && <section className="replit-example">
        <p className="eyebrow">IN REPLIT</p>
        <p>{lesson.replitExample}</p>
      </section>}
      {lesson.practice && <section id="your-turn" className="lesson-practice foundation-section">
        <h2>Your turn</h2>
        <p>Try this in Replit, then return here to check what you noticed. These checkboxes record your own progress; they do not run the task or verify your account.</p>
        <blockquote className="lesson-example-prompt"><p>{lesson.practice.prompt}</p></blockquote>
        <div className="practice-actions">
          <button type="button" onClick={async () => {
            try { await navigator.clipboard.writeText(lesson.practice!.prompt); setCopyStatus('Copied'); }
            catch { setCopyStatus('Select and copy the request above'); }
          }}>{copyStatus}</button>
          <a href="https://replit.com/" target="_blank" rel="noopener noreferrer">Open Replit ↗</a>
        </div>
        {lesson.practice.checks.map((check, index) => <label key={check}>
          <input type="checkbox" checked={practiceChecks.includes(index)} onChange={(event) => setPracticeChecks((current) => event.target.checked ? [...current, index] : current.filter((item) => item !== index))} />
          <span>{check}</span>
        </label>)}
      </section>}
      {lesson.module === 'Your capstone' && lesson.title === 'Congratulations' && <CourseCertificate />}
      {lesson.module === 'Your capstone' && lesson.title === 'Review' && <CapstoneSubmission onValidated={(passed) => {
        setConfirmedActivity(passed ? lesson.title : null);
      }} />}
      {lesson.activityConfirmation && lesson.module !== 'Your capstone' && <div className={`recipe-unlock-action activity-confirmation ${activityConfirmed ? 'is-open' : ''}`}>
        <button type="button" className="recipe-create-button" disabled={activityConfirmed} aria-expanded={activityConfirmed} aria-controls="confirmed-activity-quiz" onClick={() => {
          setConfirmedActivity(lesson.title);
          unlockStep(activityUnlock?.id, true);
        }}>
          {activityConfirmed ? <Icons.Check size={20} aria-hidden="true" /> : <LessonUnlockIcon />}
          <span>{lesson.activityConfirmation}</span>
        </button>
        <small aria-live="polite">{activityConfirmed ? 'Success! Your quiz is unlocked.' : 'Confirm you’ve completed the activity to unlock the quiz. This records your progress; it doesn’t verify actions in Replit.'}</small>
      </div>}
      {lesson.quiz.length === 0 && nextLesson && <button className="next-lesson" onClick={() => { onComplete?.(); nextLesson.onClick(); }}>
        <span>{lesson.module === 'Your capstone' ? 'CONTINUE' : 'NEXT MODULE'}</span><strong>{learnDisplayTitle(nextLesson.title)}</strong><b>→</b>
      </button>}
      {activityConfirmed && lesson.quiz.length > 0 && !quizMode && <div className="recipe-unlock-action lesson-quiz-entry" id={lesson.activityConfirmation ? 'confirmed-activity-quiz' : undefined}>
        <p>Ready to check what you’ve learned?</p>
        <button type="button" className="recipe-create-button" disabled={!practiceDone} onClick={() => setQuizMode(true)}>Take the quiz →</button>
        {!practiceDone && <small>Complete the activity checks above first.</small>}
      </div>}
      </div>}
      </>}
      </div>
      {quizMode && <div ref={quizCardRef} tabIndex={-1} className="lesson-quiz-stage">
        <LessonQuizCard key={lesson.title} lesson={lesson} answers={answers} completed={completed} next={nextLesson}
          onAnswer={(index, answer) => { answeredThisVisit.current = true; setAnswers(current => { const next = [...current]; next[index] = answer; return next; }); }} />
      </div>}
    </article>
  );
}

const CONFETTI_COLORS = ["#e89a58", "#91bca5", "#a299cf", "#edc76b", "#88b9ce", "#e07a8a"];
const CONFETTI_MS = 6400;

// Confetti falls from above the viewport to below it. Every piece gets its own speed, delay, sway, and tumble.
function LessonConfetti({ onDone }: { onDone: () => void }) {
  const [pieces] = useState(() => Array.from({ length: 110 }, () => {
    const round = Math.random() < .25;
    const width = 6 + Math.random() * 6;
    return {
      left: Math.random() * 100,
      delay: Math.random() * 1400,
      fall: 2800 + Math.random() * 2200,
      drift: (Math.random() - .5) * 180,
      sway: 18 + Math.random() * 34,
      swayMs: 700 + Math.random() * 900,
      flipMs: 450 + Math.random() * 1100,
      axis: `${(.2 + Math.random() * .8).toFixed(2)}, ${Math.random().toFixed(2)}, ${(Math.random() * .4).toFixed(2)}`,
      width,
      height: round ? width : width * (1.3 + Math.random() * .8),
      round,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    };
  }));
  useEffect(() => {
    const timer = window.setTimeout(onDone, CONFETTI_MS);
    return () => window.clearTimeout(timer);
  }, []);
  return createPortal(<div className="lesson-confetti" aria-hidden="true">{pieces.map((piece, i) => <i key={i} style={{
    left: `${piece.left}%`, animationDuration: `${piece.fall}ms`, animationDelay: `${piece.delay}ms`, "--drift": `${piece.drift}px`,
  } as CSSProperties}><b style={{
    width: piece.width, height: piece.height, background: piece.color, borderRadius: piece.round ? "50%" : 2,
    "--sway": `${piece.sway}px`, "--axis": piece.axis,
    animationDuration: `${piece.swayMs}ms, ${piece.flipMs}ms`, animationDelay: `-${Math.round(piece.swayMs * Math.random())}ms, 0ms`,
  } as CSSProperties} /></i>)}</div>, document.body);
}

const AVATAR_COLORS = ["#d9643a", "#2f7fbf", "#3f8a5c", "#7b5cc4", "#c98a1c", "#c2507a", "#23877b", "#5a62d6"];

// Initials from first and last name, else from the username's word parts (RaoufChebri1 → RC).
function avatarInitials(username: string, first?: string, last?: string) {
  const fromName = `${first?.trim()[0] ?? ""}${last?.trim()[0] ?? ""}`;
  if (fromName.length === 2) return fromName.toUpperCase();
  const parts = username.replace(/[0-9]+/g, " ").split(/[\s._-]+|(?=[A-Z])/).filter(Boolean);
  const fromUsername = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : username.slice(0, 2);
  return (fromName.length === 1 ? fromName + (parts[1]?.[0] ?? "") : fromUsername).toUpperCase();
}

// Fallback when Replit doesn't share a profile picture: initials on one plain color picked from the username.
function avatarColor(username: string) {
  let hash = 0;
  for (const char of username) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function playUnlockChime() {
  try {
    const audio = new AudioContext();
    void audio.resume();
    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      const tone = audio.createOscillator();
      const volume = audio.createGain();
      const at = audio.currentTime + index * .12;
      tone.frequency.value = frequency;
      volume.gain.setValueAtTime(0, at);
      volume.gain.linearRampToValueAtTime(.025, at + .025);
      volume.gain.exponentialRampToValueAtTime(.001, at + .45);
      tone.connect(volume); volume.connect(audio.destination);
      tone.start(at); tone.stop(at + .5);
    });
    window.setTimeout(() => void audio.close(), 1000);
  } catch { /* Audio may be unavailable or blocked by browser settings. */ }
}

function LessonUnlockIcon() {
  return <span className="lesson-lock-icon" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path className="lesson-lock-shackle" d="M7 11V7a5 5 0 0 1 10 0v4" /><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M12 15v2" /></svg><span className="unlock-sparkles"><i>✦</i><i>✧</i><i>✦</i></span></span>;
}

function CoursePillarIcon({ id }: { id: CoursePillarId }) {
  if (id === "discover") return <span className="learn-course-card-replit-mark" aria-hidden="true" />;
  if (id === "ai") return <Icons.Sparkles aria-hidden="true" />;
  if (id === "operate") return <Icons.Workflow aria-hidden="true" />;
  if (id === "design") return <Icons.Frame aria-hidden="true" />;
  if (id === "build") return <Icons.Blocks aria-hidden="true" />;
  return <Icons.ShieldCheck aria-hidden="true" />;
}

const pillarCategory = (id: CoursePillarId) => id === "discover" || id === "ai"
  ? "Foundation"
  : id === "admin"
    ? "Enterprise"
    : "Specialist";

type ResumeTarget = { lessonTitle: string; moduleTitle: string; done: number; total: number; onClick: () => void };

// welcomeDismissed comes from the database (undefined = not loaded or unavailable, then the browser flag is used).
function WelcomePage({ onStart, learnerName, learnerKey, resume, welcomeDismissed, welcomeReady = true, onWelcomeDismissed }: { onStart: (pillar: CoursePillar) => void; learnerName?: string; learnerKey?: string; resume?: ResumeTarget; welcomeDismissed?: boolean; welcomeReady?: boolean; onWelcomeDismissed?: () => void }) {
  const welcomeDialog = useRef<HTMLDialogElement>(null);
  const greeted = useRef(false);
  const [hasProjects, setHasProjects] = useState(false);
  useEffect(() => {
    if (learnerName === undefined) { greeted.current = false; return; }
    if (!learnerKey) return;
    const storageKey = `replit-learn-welcome-seen:${learnerKey}`;
    let seen = !welcomeReady; // Wait for the database's answer before deciding.
    if (!welcomeReady) { /* still loading */ }
    else if (welcomeDismissed !== undefined) seen = welcomeDismissed;
    else { try { seen = window.localStorage.getItem(storageKey) === 'true'; } catch { /* Storage may be unavailable. */ } }
    if (!greeted.current && !seen && welcomeDialog.current) {
      greeted.current = true;
      welcomeDialog.current.showModal();
      if (welcomeDismissed === undefined) { try { window.localStorage.setItem(storageKey, 'true'); } catch { /* Keep the welcome usable without storage. */ } }
    }
    const controller = new AbortController();
    void fetch('/api/mcp/apps', { credentials: 'same-origin', signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => { if (!controller.signal.aborted) setHasProjects(result?.status === 'ready' && Array.isArray(result.apps) && result.apps.length > 0); })
      .catch(() => {});
    return () => controller.abort();
  }, [learnerName, learnerKey, welcomeDismissed, welcomeReady]);
  return (
    <article className="lesson-content learn-content-stage">
      <p className="eyebrow">WELCOME TO REPLIT LEARN</p>
      <h1>Start where you are. Build from there.</h1>
      {resume && <section className="resume-card" aria-labelledby="resume-card-title">
        <div className="resume-card-copy">
          <p className="resume-card-eyebrow">Replit 101 · {resume.done} of {resume.total} lessons completed</p>
          <h2 id="resume-card-title">Pick up right where you left off</h2>
          <p>Next up: <strong>{resume.lessonTitle}</strong> <span>in {resume.moduleTitle}</span></p>
          <div className="resume-card-progress" role="progressbar" aria-label="Course progress" aria-valuemin={0} aria-valuemax={resume.total} aria-valuenow={resume.done}><i style={{ width: `${Math.round((resume.done / resume.total) * 100)}%` }} /></div>
        </div>
        <button type="button" className="recipe-create-button resume-card-button" onClick={resume.onClick}>Continue lesson <Icons.ArrowRight size={18} aria-hidden="true" /></button>
      </section>}
      {learnerName !== undefined && <dialog ref={welcomeDialog} className="learner-welcome learner-welcome-modal" aria-labelledby="learner-welcome-title" onClose={() => onWelcomeDismissed?.()}>
        <button className="welcome-modal-close" aria-label="Close welcome" onClick={() => welcomeDialog.current?.close()}><Icons.X size={20} /></button>
        <span className="learner-welcome-icon" aria-hidden="true"><Icons.Sparkles size={24} /></span>
        <h2 id="learner-welcome-title">{learnerName ? `Welcome, ${learnerName}.` : 'Welcome to Replit Learn.'}</h2>
        <p>It’s good to have you here.{hasProjects ? ' You already have projects available in Replit. Let’s build on that starting point.' : ' Let’s find a starting point for your next idea.'}</p>
        <p>We recommend the <strong className="welcome-course-emphasis">Replit 101 course</strong> to learn the fundamentals of working effectively with Replit and explore more of what you can do.</p>
        <button className="welcome-recommended-card" onClick={() => { welcomeDialog.current?.close(); onStart(coursePillars.find((pillar) => pillar.id === 'discover')!); }}>
          <span className="welcome-recommended-icon"><CoursePillarIcon id="discover" /></span>
          <span className="welcome-recommended-copy"><small>Recommended for you</small><strong>Replit 101</strong></span>
          <Icons.ArrowUpRight size={22} aria-hidden="true" />
        </button>
        <p className="welcome-other-courses">You can also explore our other courses.</p>
        <button className="welcome-browse" onClick={() => welcomeDialog.current?.close()}>Browse other courses <Icons.ArrowRight size={18} aria-hidden="true" /></button>
      </dialog>}
      <div className="lesson-video welcome-video">
        <div className="welcome-video-frame">
          <iframe
            src="https://www.youtube-nocookie.com/embed/jb8Qh6lxTaw"
            title="Replit Design overview"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
      <small className="caption">Video · See what creating with Replit can look like</small>
      <p>Start with a little curiosity. Explore the essentials in Replit 101, or build your understanding of apps in Build. Each path gives you clear explanations and small opportunities to learn by doing.</p>
      <section className="learn-path-intro">
        <p className="eyebrow">CHOOSE A COURSE</p>
        <h3>Choose your next step.</h3>
        <p>Start with Replit 101 and work through each lesson in order. Other courses are coming soon.</p>
        <div className="learn-course-grid">
          {((LEARN_DEV_MODE ? ['discover', 'build', 'ai', 'operate', 'design', 'admin'] : ['discover', 'build', 'ai', 'design', 'admin']) as CoursePillarId[]).map((id, index) => {
            const pillar = coursePillars.find((entry) => entry.id === id)!;
            const available = isAvailablePillar(pillar.id);
            const pillarLessonCount = pillar.modules.reduce((count, module) => count + module.lessons.length, 0);
            return (
              <button
                className={`learn-course-card learn-course-card-${pillar.id} ${available ? '' : 'coming-soon'}`}
                disabled={!available}
                onClick={() => onStart(pillar)}
                key={pillar.id}
              >
                <span className="learn-course-card-glow" aria-hidden="true" />
                <span className="learn-course-card-topline">
                  <b>{pillarCategory(pillar.id)}</b>
                  <i>{String(index + 1).padStart(2, "0")}</i>
                </span>
                <span className="learn-course-card-icon"><CoursePillarIcon id={pillar.id} /></span>
                <span className="learn-course-card-copy">
                  <strong>{pillar.title}</strong>
                  <small>{pillar.description}</small>
                </span>
                <span className="learn-course-card-footer">
                  <small>{available ? `1 section · ${pillarLessonCount} lessons` : 'Not available yet'}</small>
                  <strong>{available ? <>Explore course <Icons.ArrowUpRight size={16} /></> : 'Coming soon'}</strong>
                </span>
                <span className="learn-course-card-art" aria-hidden="true"><i /><i /><i /></span>
              </button>
            );
          })}
        </div>
      </section>
    </article>
  );
}

function useLessonSession() {
  const location = useLocation();
  const [status, setStatus] = useState<"checking" | "signed-in" | "signed-out" | "error">("checking");
  const [attempt, setAttempt] = useState(0);
  const [learnerName, setLearnerName] = useState<string | undefined>();
  const [learnerKey, setLearnerKey] = useState<string | undefined>();
  // After the first answer, moving between lessons re-checks the session in the background. Showing "checking"
  // again would briefly hide the lesson and flash the homepage between pages.
  const checkedOnce = useRef(false);
  useEffect(() => {
    let active = true;
    let request = 0;
    const check = async (background = false) => {
      const current = ++request;
      if (!background) setStatus("checking");
      try {
        const response = await fetch("/api/auth/session", { credentials: "same-origin", cache: "no-store" });
        if (!response.ok) throw new Error();
        const session = await response.json();
        if (active && current === request) {
          checkedOnce.current = true;
          setStatus(session.authenticated === true ? "signed-in" : "signed-out");
          setLearnerName(session.authenticated === true ? (session.user?.firstName || session.user?.username || '') : undefined);
          setLearnerKey(session.authenticated === true ? String(session.user?.id || session.user?.username || '') : undefined);
        }
      } catch { if (active && current === request && !background) setStatus("error"); }
    };
    void check(checkedOnce.current);
    const authChanged = () => void check();
    const refocused = () => void check(true);
    window.addEventListener("replit-auth-changed", authChanged);
    window.addEventListener("focus", refocused);
    return () => { active = false; window.removeEventListener("replit-auth-changed", authChanged); window.removeEventListener("focus", refocused); };
  }, [location.pathname, attempt]);
  return { status, learnerName, learnerKey, retry: () => setAttempt((value) => value + 1) };
}

function LearnPage({ composer, chatOpen = false }: { composer?: ReactNode; chatOpen?: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { status: access, learnerName, learnerKey, retry } = useLessonSession();
  const canBrowseLessons = LEARN_DEV_MODE || access === "signed-in";
  const [enteringCourse, setEnteringCourse] = useState<string | null>(null);
  const [entryRevealing, setEntryRevealing] = useState(false);
  const entryDestination = useRef<string | null>(null);
  const entryTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(entryTimer.current), []);
  useEffect(() => {
    if (!enteringCourse || location.pathname !== entryDestination.current || (!LEARN_DEV_MODE && access === 'checking')) return;
    if (!canBrowseLessons) {
      setEnteringCourse(null); setEntryRevealing(false); entryDestination.current = null;
      window.clearTimeout(entryTimer.current); entryTimer.current = undefined;
      return;
    }
    setEntryRevealing(true);
    entryTimer.current = window.setTimeout(() => {
      setEnteringCourse(null); setEntryRevealing(false); entryDestination.current = null; entryTimer.current = undefined;
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1200);
    return () => window.clearTimeout(entryTimer.current);
  }, [location.pathname, access, enteringCourse, canBrowseLessons]);
  const enterCourse = (destination: string, title: string) => {
    if (entryTimer.current !== undefined) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setEnteringCourse(title);
    setEntryRevealing(false);
    entryDestination.current = destination;
    if (!reduced) {
      try {
        const audio = new AudioContext();
        void audio.resume();
        [261.63, 392, 523.25].forEach((frequency) => {
          const tone = audio.createOscillator(); const gain = audio.createGain();
          tone.type = 'sine'; tone.frequency.value = frequency;
          gain.gain.setValueAtTime(0, audio.currentTime);
          gain.gain.linearRampToValueAtTime(.018, audio.currentTime + .375);
          gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + 1.65);
          tone.connect(gain); gain.connect(audio.destination); tone.start(); tone.stop(audio.currentTime + 1.8);
        });
        window.setTimeout(() => void audio.close(), 2100);
      } catch { /* Navigation remains available without audio. */ }
    }
    entryTimer.current = window.setTimeout(() => {
      navigate(destination);
    }, reduced ? 0 : 1125);
  };
  const [pendingCourse, setPendingCourse] = useState<string | null>(null);
  const [invitationOpen, setInvitationOpen] = useState(false);
  const invitationShown = useRef(false);
  const dismissSignIn = () => { setPendingCourse(null); setInvitationOpen(false); };
  const signInDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (access === 'signed-out' && location.pathname === '/' && !invitationShown.current) {
      invitationShown.current = true;
      setInvitationOpen(true);
    }
  }, [access, location.pathname]);
  useEffect(() => {
    if (pendingCourse && access === "signed-in") {
      setPendingCourse(null);
      setInvitationOpen(false);
      navigate('/');
    }
  }, [pendingCourse, access, navigate]);
  useEffect(() => {
    if (!LEARN_DEV_MODE && location.pathname.startsWith("/learn/") && (access === "signed-out" || access === "error")) {
      setPendingCourse(location.pathname + location.search + location.hash);
      navigate("/", { replace: true });
    }
  }, [access, location.pathname, location.search, location.hash, navigate]);
  useEffect(() => {
    if ((pendingCourse || invitationOpen) && access !== "signed-in") signInDialog.current?.showModal();
    else signInDialog.current?.close();
  }, [pendingCourse, invitationOpen, access]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [courseNavCollapsed, setCourseNavCollapsed] = useState(
    () => window.localStorage.getItem("replit-learn-course-nav-collapsed") === "true",
  );
  const path = useMemo(() => location.pathname.split("/").filter(Boolean), [location.pathname]);
  const moduleIndex = path.length > 1
    ? courseModules.findIndex((module) => learnSegment(module.title) === path[1])
    : -1;
  const module = moduleIndex >= 0 ? courseModules[moduleIndex] : undefined;
  const lessonIndex = module && path[2]
    ? module.lessons.findIndex((lesson) => learnSegment(lesson.title) === path[2])
    : -1;
  const lesson = module && lessonIndex >= 0 ? module.lessons[lessonIndex] : undefined;
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const sequence = courseModules.filter(isAvailableModule).flatMap((entry) => entry.lessons.map((item) => ({ module: entry, lesson: item, url: lessonUrl(entry, item) })));
  const [progressOwner, setProgressOwner] = useState<string | undefined>();
  useEffect(() => {
    setCompletedLessons([]);
    setProgressOwner(undefined);
    if (!learnerKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(`replit-101-progress:v2:${learnerKey}`) ?? '[]');
      if (Array.isArray(saved)) setCompletedLessons(saved.filter((url): url is string => typeof url === 'string' && availableLessonUrls.has(url)));
    } catch { /* Start fresh if local progress is unavailable. */ }
    setProgressOwner(learnerKey);
  }, [learnerKey]);
  // The database is the source of truth when it's reachable; browser storage is the instant first paint and the fallback.
  const [serverProgress, setServerProgress] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState<boolean | undefined>();
  // True once the learner has opened any Replit 101 page (database: user_course_state), even before completing one.
  const [courseStarted, setCourseStarted] = useState(false);
  // Lessons the learner has opened (database: a user_lesson_progress row). Only these show the in-progress check.
  const [seenLessons, setSeenLessons] = useState<string[]>([]);
  // Unlock buttons the learner has used (database: user_unlocks).
  const [unlockedSteps, setUnlockedSteps] = useState<string[]>([]);
  // False until the progress request finishes (either answer or failure), so the welcome modal doesn't guess.
  const [progressSettled, setProgressSettled] = useState(false);
  useEffect(() => {
    setServerProgress(false);
    setWelcomeDismissed(undefined);
    setCourseStarted(false);
    setProgressSettled(false);
    setSeenLessons([]);
    setUnlockedSteps([]);
    if (!learnerKey || progressOwner !== learnerKey) return;
    let active = true;
    const local = (() => { try { const saved = JSON.parse(localStorage.getItem(`replit-101-progress:v2:${learnerKey}`) ?? '[]'); return Array.isArray(saved) ? saved.filter((url): url is string => typeof url === 'string' && availableLessonUrls.has(url)) : []; } catch { return []; } })();
    const post = (path: string, body: unknown) => fetch(path, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    (async () => {
      try {
        const response = await fetch('/api/progress', { credentials: 'same-origin', headers: { accept: 'application/json' } });
        if (!response.ok) return;
        type Snapshot = { completed?: string[]; seen?: string[]; unlocked?: string[]; lastLessons?: Record<string, string>; welcomeDismissed?: boolean; progressImported?: boolean };
        let snapshot = await response.json() as Snapshot;
        // Browser progress is copied in once per learner; after that the database always wins.
        if (!snapshot.progressImported) {
          const imported = await post('/api/progress/import', { lessons: local });
          if (imported.ok) snapshot = await imported.json() as Snapshot;
        }
        if (!active || !Array.isArray(snapshot.completed)) return;
        setCompletedLessons(snapshot.completed.filter((url) => availableLessonUrls.has(url)));
        setWelcomeDismissed(snapshot.welcomeDismissed === true);
        setCourseStarted(Boolean(snapshot.lastLessons?.discover));
        if (Array.isArray(snapshot.unlocked)) setUnlockedSteps((current) => [...new Set([...current, ...snapshot.unlocked!])]);
        if (Array.isArray(snapshot.seen)) setSeenLessons((current) => [...new Set([...current, ...snapshot.seen!])]);
        setServerProgress(true);
      } catch { /* Keep browser progress when the server is unreachable. */ }
      finally { if (active) setProgressSettled(true); }
    })();
    return () => { active = false; };
  }, [learnerKey, progressOwner]);
  const recordUnlock = (id: string) => {
    setUnlockedSteps((current) => current.includes(id) ? current : [...current, id]);
    if (!serverProgress) return;
    fetch('/api/progress/unlock', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ unlock: id }) }).catch(() => undefined);
  };
  const recordCompletion = (url: string) => {
    setCompletedLessons((current) => current.includes(url) ? current : [...current, url]);
    if (!serverProgress) return;
    fetch('/api/progress/complete', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ lesson: url }) })
      .then((response) => response.ok ? response.json() as Promise<{ completed?: string[] }> : undefined)
      .then((snapshot) => { if (snapshot?.completed) setCompletedLessons((current) => [...new Set([...current, ...snapshot.completed!.filter((entry) => availableLessonUrls.has(entry))])]); })
      .catch(() => { /* Browser storage still has it; the next sign-in imports it. */ });
  };
  useEffect(() => {
    if (!learnerKey || progressOwner !== learnerKey) return;
    try { localStorage.setItem(`replit-101-progress:v2:${learnerKey}`, JSON.stringify(completedLessons)); } catch { /* In-memory progress still works. */ }
  }, [completedLessons, learnerKey, progressOwner]);
  const isLocked = (url: string) => {
    if (LEARN_DEV_MODE) return false;
    if (url && !availableLessonUrls.has(url)) return true;
    const index = sequence.findIndex((entry) => entry.url === url);
    return index > 0 && sequence.slice(0, index).some((entry) => !completedLessons.includes(entry.url));
  };
  // Shown on the courses page once a learner has started Replit 101 (opened a page or completed one) and hasn't finished it.
  const completedInSequence = sequence.filter((entry) => completedLessons.includes(entry.url)).length;
  const nextUnfinished = sequence.find((entry) => !completedLessons.includes(entry.url));
  const resumeTarget: ResumeTarget | undefined = progressOwner === learnerKey && (completedInSequence > 0 || courseStarted) && nextUnfinished ? {
    lessonTitle: nextUnfinished.lesson.navigationTitle ?? learnDisplayTitle(nextUnfinished.lesson.title),
    moduleTitle: nextUnfinished.module.title,
    done: completedInSequence,
    total: sequence.length,
    onClick: () => navigate(nextUnfinished.url),
  } : undefined;
  const currentUrl = module && lesson ? lessonUrl(module, lesson) : "";
  const sequenceIndex = sequence.findIndex((entry) => entry.url === currentUrl);
  const currentLocked = isLocked(currentUrl);
  // Last page seen: recorded whenever a learner opens a page they're allowed to see.
  useEffect(() => {
    if (currentUrl && !currentLocked && availableLessonUrls.has(currentUrl)) setSeenLessons((current) => current.includes(currentUrl) ? current : [...current, currentUrl]);
    if (!serverProgress || !currentUrl || currentLocked || !availableLessonUrls.has(currentUrl)) return;
    setCourseStarted(true);
    fetch('/api/progress/seen', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ lesson: currentUrl }) }).catch(() => undefined);
  }, [serverProgress, currentUrl, currentLocked]);
  useEffect(() => {
    // Wait for the database's progress before redirecting away from a lesson that only looks locked.
    if (access === "signed-in" && progressOwner === learnerKey && progressSettled && currentLocked) {
      if (!availableLessonUrls.has(currentUrl)) { navigate('/', { replace: true }); return; }
      const available = sequence.find((entry) => !completedLessons.includes(entry.url));
      if (available) navigate(available.url, { replace: true });
    }
  }, [access, currentLocked, currentUrl, completedLessons, navigate, progressOwner, learnerKey, progressSettled]);

  useEffect(() => {
    if (location.pathname === "/") {
      return;
    }
    if (location.pathname === "/learn") {
      navigate("/", { replace: true });
      return;
    }
    if (location.pathname === "/learn/app-foundations/app-architecture") {
      navigate("/learn/app-foundations/integrations", { replace: true });
      return;
    }
    if (location.pathname === "/learn/app-foundations/while-your-app-builds") {
      navigate("/learn/app-foundations/what-is-replit-building", { replace: true });
      return;
    }
    if (path[0] === "learn" && ["discover-replit", "experience-replit"].includes(path[1]) && path[2]) {
      navigate(`/learn/replit-101/${path[2]}`, { replace: true });
      return;
    }
    if (path[0] !== "learn" || ![1, 3].includes(path.length) || (path.length === 3 && (!module || !lesson))) {
      navigate("/", { replace: true });
    }
  }, [lesson, location.pathname, module, navigate, path]);

  useEffect(() => setMobileNavOpen(false), [location.pathname]);

  useEffect(() => {
    window.localStorage.setItem("replit-learn-course-nav-collapsed", String(courseNavCollapsed));
  }, [courseNavCollapsed]);

  const startModule = (target: CourseModule) => {
    if (!isAvailableModule(target)) return;
    const destination = lessonUrl(target, target.lessons[0]);
    if (canBrowseLessons) enterCourse(destination, coursePillars.find((pillar) => pillar.id === target.pillar)?.title ?? target.title);
    else setPendingCourse(destination);
  };
  const startPillar = (pillar: CoursePillar) => {
    const firstModule = pillar.modules[0];
    if (firstModule) startModule(firstModule);
  };
  const nextLesson = module && lessonIndex >= 0 ? module.lessons[lessonIndex + 1] : undefined;
  const showCourseNavigation = moduleIndex >= 0 && canBrowseLessons;
  const activePillar = module ? coursePillars.find((pillar) => pillar.id === module.pillar) : undefined;
  const activeModuleGroupIndex = activePillar && module ? activePillar.modules.indexOf(module) : -1;

  return (
    <main className={`learn-page ${entryRevealing ? 'course-entry-revealing' : ''} ${showCourseNavigation ? "" : "welcome-mode"} ${showCourseNavigation && courseNavCollapsed ? "course-nav-collapsed" : ""}`}>
      {showCourseNavigation && <>
        <button
          className="course-mobile-toggle"
          onClick={() => setMobileNavOpen((open) => !open)}
          aria-expanded={mobileNavOpen}
          aria-controls="learn-course-nav"
        >
          <Icons.ListTree size={17} /> Course navigation <span>{mobileNavOpen ? "−" : "+"}</span>
        </button>
        <aside id="learn-course-nav" className={`course-nav ${mobileNavOpen ? "mobile-open" : ""} ${courseNavCollapsed ? "desktop-collapsed" : ""}`}>
        <div className="course-nav-header">
          <strong>{activePillar ? activePillar.title : "Course navigation"}</strong>
          <button
            className="course-desktop-collapse"
            type="button"
            onClick={() => setCourseNavCollapsed((collapsed) => !collapsed)}
            aria-label={courseNavCollapsed ? "Show course navigation" : "Hide course navigation"}
            aria-expanded={!courseNavCollapsed}
            aria-controls="course-navigation-contents"
            title={courseNavCollapsed ? "Show course navigation" : "Hide course navigation"}
          >
            {courseNavCollapsed ? <Icons.PanelLeftOpen size={17} /> : <Icons.PanelLeftClose size={17} />}
          </button>
        </div>
        <div id="course-navigation-contents" className="course-navigation-contents">
        <button className="course-welcome" onClick={() => navigate("/")}>
          <b>←</b><span>All courses</span>
        </button>
        {activePillar && [activePillar].map((pillar) => {
          return (
            <section className="course-pillar open active" key={pillar.id}>
              <div className="course-pillar-modules" id={`course-pillar-${pillar.id}`}>
                  {pillar.modules.map((targetModule, moduleGroupIndex) => {
                    const index = courseModules.indexOf(targetModule);
                    const moduleCurrent = moduleIndex === index;
                    const moduleMinutes = targetModule.lessons.reduce((total, targetLesson) => total + Number.parseInt(targetLesson.duration, 10), 0);
                    const moduleProgress = targetModule.lessons.length === 0 ? 0 : 100 * targetModule.lessons.filter((item) => completedLessons.includes(lessonUrl(targetModule, item))).length / targetModule.lessons.length;
                    return (
                      <section className={`course-module-group ${moduleCurrent ? "current" : ""}`} key={targetModule.title}>
                        <div className="course-module-heading">
                          <b>{String(moduleGroupIndex + 1).padStart(2, "0")}</b>
                          <strong>{learnDisplayTitle(targetModule.title)}</strong>
                          <small>{targetModule.lessons.length > 0 && isAvailableModule(targetModule) ? `${moduleMinutes} min` : 'Coming soon'}</small>
                        </div>
                        <div
                          className="course-chapters"
                          id={`course-module-${index}`}
                          style={{ "--course-module-progress": `${moduleProgress}%` } as CSSProperties}
                        >
                          {targetModule.lessons.length === 0 && isAvailableModule(targetModule) && <button
                            className={moduleCurrent ? "active" : ""}
                            aria-current={moduleCurrent ? "page" : undefined}
                            onClick={() => navigate(`/learn/${learnSegment(targetModule.title)}`)}
                          ><span>Module overview</span></button>}
                          {(isAvailableModule(targetModule) ? targetModule.lessons : []).map((targetLesson, chapterIndex) => {
                            const lessonActive = moduleCurrent && lessonIndex === chapterIndex;
                            const locked = isLocked(lessonUrl(targetModule, targetLesson));
                            const lessonComplete = completedLessons.includes(lessonUrl(targetModule, targetLesson));
                            return (
                              <button
                                className={locked ? "lesson-nav-locked" : lessonActive ? "active" : ""}
                                disabled={locked}
                                title={!isAvailableModule(targetModule) ? 'Coming soon' : locked ? "Complete the previous lessons to unlock" : undefined}
                                aria-current={lessonActive ? "page" : undefined}
                                onClick={() => navigate(lessonUrl(targetModule, targetLesson))}
                                key={targetLesson.title}
                              >
                                <span>{targetLesson.navigationTitle ?? learnDisplayTitle(targetLesson.title)}</span>
                                {locked ? <Icons.LockKeyhole size={16} aria-label="Locked" /> : lessonComplete ? <span className="lesson-nav-state is-complete" role="img" aria-label="Completed"><Icons.Check size={12} strokeWidth={2.5} aria-hidden="true" /></span> : seenLessons.includes(lessonUrl(targetModule, targetLesson)) ? <span className="lesson-nav-state is-progress" role="img" aria-label="In progress"><Icons.Check size={12} strokeWidth={2.5} aria-hidden="true" /></span> : <span className="lesson-nav-state is-unseen" aria-hidden="true" />}
                              </button>
                            );
                          })}
                          </div>
                      </section>
                    );
                  })}
              </div>
            </section>
          );
        })}
        </div>
        </aside>
      </>}
      <div className="learn-main-column">
        {LEARN_DEV_MODE && <p role="status" className="caption">Development mode: all courses and lessons are open. Account actions still require sign-in.</p>}
        {composer}
        {lesson && module && canBrowseLessons && !currentLocked ? (
          <LessonPage
            key={currentUrl}
            completed={completedLessons.includes(currentUrl)}
            unlocks={module && lesson ? lessonUnlocks(module, lesson) : []}
            doneUnlocks={unlockedSteps}
            onUnlock={recordUnlock}
            onComplete={sequenceIndex >= 0 || module.pillar === 'discover' ? () => recordCompletion(currentUrl) : undefined}
            chatOpen={chatOpen}
            lesson={lesson}
            chapter={lessonIndex}
            nextLesson={sequenceIndex >= 0 && sequence[sequenceIndex + 1] && availableLessonUrls.has(sequence[sequenceIndex + 1].url) ? {
              title: sequence[sequenceIndex + 1].lesson.title,
              onClick: () => navigate(sequence[sequenceIndex + 1].url),
            } : nextLesson && availableLessonUrls.has(lessonUrl(module, nextLesson)) ? {
              title: nextLesson.title,
              onClick: () => navigate(lessonUrl(module, nextLesson)),
            } : lesson.title === 'You’ve discovered Replit' && LEARN_DEV_MODE ? {
              title: 'Your workspace',
              onClick: () => navigate('/learn/your-workspace/what-is-a-workspace'),
            } : lesson.title === 'Manage integrations' && LEARN_DEV_MODE ? {
              title: 'The prompt box',
              onClick: () => navigate('/learn/the-prompt-box/get-to-know-the-prompt-box'),
            } : lesson.title === 'Tools and integrations' && LEARN_DEV_MODE ? {
              title: 'Chats and projects',
              onClick: () => navigate('/learn/chats-and-projects/what-is-a-chat'),
            } : lesson.title === 'From chat to project' && LEARN_DEV_MODE ? {
              title: 'Build and Design',
              onClick: () => navigate('/learn/build-and-design/explore-your-project'),
            } : lesson.module === 'Build and Design' && lesson.title === 'What is an artifact?' && LEARN_DEV_MODE ? {
              title: 'Your capstone',
              onClick: () => navigate('/learn/your-capstone/build-a-picnic-sign-up-app'),
            } : undefined}
          />
        ) : module && module.lessons.length === 0 && isAvailableModule(module) && canBrowseLessons ? (
          <article className="lesson-content learn-content-stage" key={module.title}>
            <p className="eyebrow">UP NEXT</p>
            <h1>{learnDisplayTitle(module.title)}</h1>
            <p>{module.description}</p>
            <p>The lessons in this module are coming soon.</p>
          </article>
        ) : location.pathname.startsWith("/learn/") && (access === "checking" || (access === "signed-in" && (!progressSettled || currentLocked))) ? (
          // Opening a lesson link: stay blank while sign-in and progress load, or while a locked lesson redirects,
          // instead of flashing the homepage and its video.
          <article className="lesson-content learn-content-stage" aria-busy="true" aria-label="Loading lesson" />
        ) : (
          <WelcomePage onStart={startPillar} learnerName={access === 'signed-in' ? learnerName : undefined} learnerKey={access === 'signed-in' ? learnerKey : undefined} resume={access === 'signed-in' ? resumeTarget : undefined}
            welcomeDismissed={serverProgress ? welcomeDismissed : undefined}
            welcomeReady={progressSettled}
            onWelcomeDismissed={() => {
              if (!serverProgress || welcomeDismissed) return;
              setWelcomeDismissed(true);
              fetch('/api/onboarding/welcome-dismissed', { method: 'POST', credentials: 'same-origin' }).catch(() => undefined);
            }} />
        )}
        <dialog className="learn-sign-in-modal" ref={signInDialog} onCancel={dismissSignIn} onClose={dismissSignIn} aria-labelledby="learn-sign-in-title" aria-describedby="learn-sign-in-description">
          <button className="modal-close" aria-label="Close sign-in" onClick={dismissSignIn}><Icons.X size={20} /></button>
          <div className="signin-emblem" aria-hidden="true"><Icons.Sparkles size={30} /></div>
          <p className="signin-eyebrow">REPLIT LEARN</p>
          <h2 id="learn-sign-in-title">Your next idea starts here.</h2>
          <p id="learn-sign-in-description">Sign in to explore, try something new, and build along with each lesson.</p>
          {access === "checking" ? <p role="status">Checking your sign-in…</p> : access === "error" ? <><p>Your sign-in could not be checked.</p><button onClick={retry}>Try again</button></> : <>
            <a className="signin-primary" href="/api/auth/login?returnTo=%2F">Continue with Replit <Icons.ArrowRight size={18} /></a>
            <p className="signin-create">New to Replit? <a href="https://replit.com/signup" target="_blank" rel="noopener noreferrer">Create a free account</a>, then come back and continue.</p>
            <button className="signin-browse" onClick={dismissSignIn}>Explore courses first</button>
            <small className="signin-note">Browse freely. Sign in when you’re ready to start a lesson.</small>
          </>}
        </dialog>
      </div>
      {enteringCourse && <div className={`course-entry-transition ${entryRevealing ? 'is-revealing' : ''}`} role="status" aria-live="polite"><span className="course-entry-wave" aria-hidden="true" /><Icons.Sparkles size={30} aria-hidden="true" /><p>Let’s explore</p><strong>{enteringCourse}</strong></div>}
    </main>
  );
}

function EmptyLessonChat() {
  const { build } = useRecipeActivity();
  const location = useLocation();
  return location.pathname.startsWith('/learn/app-foundations/') && build.status !== 'idle' ? <RecipeBuildStatus /> : <div className="lesson-assistant-welcome"><Icons.Sparkles size={20} /><h3>Learn at your own pace</h3><p>Ask about the lesson, get an example, or work through something you’re unsure about.</p><p className="caption">Try “Explain this more simply” or “How can I use this for my birthday app?”</p></div>;
}

function RecipeProjectPreview() {
  const { build } = useRecipeActivity();
  const url = RECIPE_DEMO ? 'https://replit.com/@raoufchebri/CyanRundownObjects' : build.replUrl;
  return <div className="recipe-project-preview">{url && <a className="recipe-create-button" href={url} target="_blank" rel="noreferrer">Open your app ↗</a>}<figure><img src="/images/recipe-project-clean.png" alt="Recipe Box in Replit, with a build summary beside the running recipe app" loading="lazy" /><figcaption>An example first version. Your app may look different.</figcaption></figure></div>;
}

function RecipeProjectLink() {
  const { build } = useRecipeActivity();
  const url = RECIPE_DEMO ? 'https://replit.com/@raoufchebri/CyanRundownObjects' : build.replUrl;
  return url ? <p><a href={url} target="_blank" rel="noreferrer">Follow your project in Replit ↗</a></p> : null;
}

function AskConversationView({
  turns,
  mode,
  onModeChange,
  onBack,
}: {
  turns: AskTurn[];
  mode: AskViewMode;
  onModeChange: (mode: AskViewMode) => void;
  onBack: () => void;
}) {
  const view = useRef<HTMLElement>(null);
  useEffect(() => {
    const panel = view.current;
    const latest = panel?.querySelector('.ask-conversation-turn:last-child');
    if (!panel || !latest || turns.length < 2) return;
    panel.scrollTo({ top: panel.scrollTop + latest.getBoundingClientRect().top - panel.getBoundingClientRect().top, behavior: 'smooth' });
  }, [turns.length]);
  return (
    <section ref={view} className="ask-conversation-view" aria-label="Ask AI conversation" aria-live="polite">
      <header>
        <strong className="lesson-assistant-title"><Icons.Sparkles size={16} /> Lesson assistant</strong>
        <button type="button" onClick={onBack} aria-label="Close lesson assistant"><Icons.X size={16} /></button>
        <button type="button" onClick={() => onModeChange(mode === "split" ? "focus" : "split")}>
          {mode === "split" ? <><Icons.Maximize2 size={14} /> Focus</> : <><Icons.Columns2 size={14} /> Split view</>}
        </button>
      </header>
      <div className="ask-conversation-turns">
        {turns.length === 0 && <EmptyLessonChat />}
        {turns.map((turn) => (
          <section className={`ask-conversation-turn ${turn.recipeBuild ? "recipe-chat-turn" : ""}`} key={turn.id}>
            <div className="ask-conversation-question"><p>{turn.question}</p></div>
            {turn.simulatedIteration && <small>Simulated request · <a href="https://replit.com/@raoufchebri/CyanRundownObjects" target="_blank" rel="noreferrer">Recipe Box · current test app ↗</a></small>}
            <div className="ask-conversation-answer"><div>
              {turn.recipeBuild && <RecipeBuildStatus />}
              {turn.loading && !turn.answer && <p className="ask-conversation-working"><i /><i /><i /> Replit is reading your context…</p>}
              {turn.answer && <div>{turn.answer.split(/(```[\s\S]*?```)/g).filter(Boolean).map((part, index) => part.startsWith('```') ? <pre className="project-code-excerpt" key={index}><code>{part.replace(/^```[^\n]*\n?/, '').replace(/```$/, '')}</code></pre> : <p key={index}>{part}</p>)}<span className={turn.loading ? "ask-stream-cursor" : ""} aria-hidden="true" /></div>}
              {turn.sources.length > 0 && (
                <nav className="ask-conversation-sources" aria-label="Sources">
                  <span className="ask-conversation-sources-label">Sources</span>
                  <ol>{turn.sources.map((source, index) => <li key={source.id}><a href={source.url}><span className="ask-conversation-source-number">{index + 1}</span><span><strong>{source.heading}</strong><small>{source.title}</small></span><Icons.ArrowUpRight size={13} /></a></li>)}</ol>
                </nav>
              )}
              {!turn.loading && turn.error && <p className="ask-conversation-error">{turn.error}</p>}
              {!turn.loading && !turn.error && turn.answer && <img className="ask-conversation-signature" src="/brand-assets/logos/replit-symbol.svg" alt="" aria-hidden="true" />}
            </div></div>
          </section>
        ))}
      </div>
    </section>
  );
}

function LearnSettingsDock({
  theme,
  palette,
  onThemeChange,
  onPaletteChange,
}: {
  theme: Theme;
  palette: Palette;
  onThemeChange: (theme: Theme) => void;
  onPaletteChange: (palette: Palette) => void;
}) {
  // Only one popover at a time: the theme picker or the account menu.
  const [menu, setMenu] = useState<'theme' | 'account' | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [avatar, setAvatar] = useState<string | undefined>();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState<{ first?: string; last?: string }>({});
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const dock = useRef<HTMLElement>(null);

  useEffect(() => {
    let active = true;
    const updateFromSession = () => {
      fetch("/api/auth/session", { credentials: "same-origin", headers: { accept: "application/json" } })
        .then((response) => response.ok ? response.json() as Promise<{ authenticated?: boolean; user?: { username?: string; firstName?: string; lastName?: string; profileImageUrl?: string } }> : Promise.reject())
        .then((session) => { if (active) { setAuthenticated(session.authenticated === true); setAvatar(session.user?.profileImageUrl); setUsername(session.user?.username ?? ""); setDisplayName({ first: session.user?.firstName, last: session.user?.lastName }); } })
        .catch(() => { if (active) setAuthenticated(false); });
    };
    const updateFromEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ authenticated?: boolean }>).detail;
      if (active && typeof detail?.authenticated === "boolean") setAuthenticated(detail.authenticated);
    };
    updateFromSession();
    window.addEventListener("replit-auth-changed", updateFromEvent);
    return () => {
      active = false;
      window.removeEventListener("replit-auth-changed", updateFromEvent);
    };
  }, []);

  useEffect(() => {
    if (!menu) return;
    const close = (event: MouseEvent) => {
      if (dock.current && !dock.current.contains(event.target as Node)) setMenu(null);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setMenu(null); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [menu]);

  const signIn = () => {
    window.location.assign('/api/auth/login?returnTo=%2F');
  };

  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      if (!response.ok) throw new Error('Sign-out failed');
      try {
        Object.keys(window.localStorage)
          .filter((key) => key.startsWith('replit-learn-welcome-seen:'))
          .forEach((key) => window.localStorage.removeItem(key));
      } catch { /* Signing out remains available when browser storage is blocked. */ }
      window.location.assign('/');
    } catch {
      setSignOutError('Could not sign out. Please try again.');
      setSigningOut(false);
    }
  };

  const isDark = theme === "dark";
  return (
    <aside className="learn-settings-dock" ref={dock} aria-label="Learn account and settings">
      {menu === "theme" && (
        <section className="learn-settings-panel learn-theme-panel" id="learn-theme-panel" role="dialog" aria-label="Color theme">
          <div className="learn-settings-section">
            <span>Theme</span>
            <div className="learn-settings-palette-list" role="group" aria-label="Color theme">
              <button type="button" className={palette === "replit" ? "selected" : ""} onClick={() => onPaletteChange("replit")} aria-pressed={palette === "replit"}>
                <i className="theme-swatch theme-swatch-replit" aria-hidden="true" />
                <span><strong>Replit</strong><small>Warm brand colors</small></span>
                {palette === "replit" && <Icons.Check size={15} />}
              </button>
              <button type="button" className={palette === "silver" ? "selected" : ""} onClick={() => onPaletteChange("silver")} aria-pressed={palette === "silver"}>
                <i className="theme-swatch theme-swatch-silver" aria-hidden="true" />
                <span><strong>Silver</strong><small>Cool neutral colors</small></span>
                {palette === "silver" && <Icons.Check size={15} />}
              </button>
              <button type="button" className={palette === "neutral" ? "selected" : ""} onClick={() => onPaletteChange("neutral")} aria-pressed={palette === "neutral"}>
                <i className="theme-swatch theme-swatch-neutral" aria-hidden="true" />
                <span><strong>Soft Stone</strong><small>Quiet neutral colors</small></span>
                {palette === "neutral" && <Icons.Check size={15} />}
              </button>
            </div>
          </div>
        </section>
      )}

      {menu === "account" && authenticated && (
        <section className="learn-settings-panel learn-account-panel" id="learn-account-panel" role="dialog" aria-label="Account">
          <button className="learn-sign-out" type="button" onClick={() => void signOut()} disabled={signingOut}><Icons.LogOut size={16} /> {signingOut ? 'Signing out…' : 'Sign out'}</button>
          {signOutError && <p role="alert">{signOutError}</p>}
        </section>
      )}

      <div className="learn-settings-dock-row">
        <button className="learn-dock-icon" type="button" onClick={() => setMenu((current) => current === "theme" ? null : "theme")} aria-label="Color theme" title="Color theme" aria-haspopup="dialog" aria-controls="learn-theme-panel" aria-expanded={menu === "theme"}>
          <Icons.Palette size={18} aria-hidden="true" />
        </button>
        <button className="learn-dock-icon" type="button" onClick={() => onThemeChange(isDark ? "light" : "dark")} aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"} title={isDark ? "Light mode" : "Dark mode"}>
          {isDark ? <Icons.Sun size={18} aria-hidden="true" /> : <Icons.Moon size={18} aria-hidden="true" />}
        </button>
        <button className={`learn-settings-dock-toggle ${!avatar && username ? 'is-initials' : ''}`} type="button"
          onClick={() => { if (authenticated === false) signIn(); else setMenu((current) => current === "account" ? null : "account"); }}
          aria-label={authenticated === false ? "Sign in" : "Account"} aria-haspopup={authenticated === false ? undefined : "dialog"} aria-controls={authenticated === false ? undefined : "learn-account-panel"} aria-expanded={authenticated === false ? undefined : menu === "account"}
          style={!avatar && username ? { background: avatarColor(username) } : undefined}>
          {avatar ? <img src={avatar} alt="" /> : username ? avatarInitials(username, displayName.first, displayName.last) : <Icons.UserRound size={18} />}
        </button>
      </div>
    </aside>
  );
}

function App() {
  const location = useLocation();
  const [chatHighlighted, setChatHighlighted] = useState(false);
  useEffect(() => {
    let startY = window.scrollY;
    const highlight = () => { startY = window.scrollY; setChatHighlighted(true); };
    const scroll = () => { if (window.scrollY > startY + 40) setChatHighlighted(false); };
    window.addEventListener("learn-highlight-chat", highlight);
    window.addEventListener("scroll", scroll, { passive: true });
    setChatHighlighted(false);
    return () => { window.removeEventListener("learn-highlight-chat", highlight); window.removeEventListener("scroll", scroll); };
  }, [location.pathname]);
  const [askQuery, setAskQuery] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askTurns, setAskTurns] = useState<AskTurn[]>([]);
  const [askViewMode, setAskViewMode] = useState<AskViewMode>("split");
  const [chatDismissedOn, setChatDismissedOn] = useState<string | null>(null);
  // Assistant opens only when the learner asks something, not automatically.
  const showLessonChat = askTurns.length > 0;
  const closeLessonChat = () => { setAskTurns([]); setChatDismissedOn(location.pathname); };
  useEffect(() => { setChatDismissedOn(null); }, [location.pathname]);
  const [selectedAskAppId, setSelectedAskAppId] = useState("");
  useEffect(() => {
    if (RECIPE_DEMO && location.pathname.startsWith('/learn/app-foundations/')) setSelectedAskAppId('simulated-recipe-context');
    else if (selectedAskAppId === 'simulated-recipe-context') setSelectedAskAppId('');
  }, [location.pathname]);
  const [selectedAskDocs, setSelectedAskDocs] = useState<AskDocsReference[]>([]);
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = window.localStorage.getItem("replit-learn-theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [palette, setPalette] = useState<Palette>(() => {
    const saved = window.localStorage.getItem("replit-learn-palette");
    if (saved === "replit" || saved === "silver" || saved === "neutral") return saved;
    return "neutral";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("replit-learn-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.palette = palette;
    window.localStorage.setItem("replit-learn-palette", palette);
  }, [palette]);

  const previousChatPath = useRef(location.pathname);
  useEffect(() => {
    const stayingInAppFoundations = previousChatPath.current.startsWith("/learn/app-foundations/") && location.pathname.startsWith("/learn/app-foundations/");
    previousChatPath.current = location.pathname;
    if (stayingInAppFoundations) return;
    setAskTurns([]);
    setAskLoading(false);
  }, [location.pathname]);

  useEffect(() => {
    if (RECIPE_DEMO && location.pathname === '/learn/app-foundations/what-is-replit-building') {
      setAskTurns(current => current.some(turn => turn.recipeBuild) ? current : [
        { id: 'recipe-build', question: RECIPE_PROMPT, answer: '', error: '', loading: false, sources: [], recipeBuild: true }, ...current,
      ]);
    }
  }, [location.pathname]);

  const submitAsk = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try { await sendAsk(askQuery.trim(), selectedAskAppId, selectedAskDocs); } catch { /* Error appears in chat. */ }
  };
  const sendAsk = async (question: string, appId: string, docs: typeof selectedAskDocs, keepPosition = false) => {
    if (!question || askLoading) throw new Error('Finish the current chat request first.');
    if (appId === 'simulated-recipe-context') {
      if (!RECIPE_DEMO) throw new Error('Select a connected Replit project.');
      setAskQuery('');
      setAskViewMode('split');
      setAskTurns(current => [...current, { id: crypto.randomUUID(), question, answer: 'This request is attached to Recipe Box in the simulated walkthrough. No request was sent to Replit and the app has not been changed.', error: '', loading: false, sources: [], simulatedIteration: true }]);
      return;
    }
    if (!keepPosition) window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    const turnId = window.crypto.randomUUID();
    const history = askTurns
      .filter((turn) => turn.answer)
      .map(({ question: previousQuestion, answer }) => ({ question: previousQuestion, answer }));
    setAskTurns((current) => [...current, { id: turnId, question, answer: "", error: "", loading: true, sources: [] }]);
    setAskViewMode("split");
    setAskQuery("");
    setAskLoading(true);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question,
          appId,
          docs,
          history,
          currentPage: location.pathname,
        }),
      });
      if (!response.ok) {
        const raw = await response.text();
        let data: { error?: string } = {};
        try { data = JSON.parse(raw) as { error?: string }; } catch { data = { error: raw }; }
        throw new Error(
          data.error === 'app_busy' ? 'Replit is still working on this app. This question was not sent. Wait a moment, then try again.' : data.error === "reauth_required"
            ? "Reconnect Replit to continue using Ask AI."
            : data.error === "authentication_required"
              ? "Sign in with Replit to use Ask AI."
              : "Ask AI is unavailable right now.",
        );
      }

      if (response.body && response.headers.get("content-type")?.includes("application/x-ndjson")) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let pending = "";
        let finished = false;
        const applyEvent = (line: string) => {
          if (!line.trim()) return;
          const streamEvent = JSON.parse(line) as { type?: string; text?: string; sources?: AskSource[] };
          if (streamEvent.type === 'done') finished = true;
          if (streamEvent.type === 'error') throw new Error('Replit could not finish this response. Please try again.');
          if (streamEvent.type === "delta" && streamEvent.text) {
            setAskTurns((current) => current.map((turn) => turn.id === turnId ? { ...turn, answer: turn.answer + streamEvent.text } : turn));
          }
          if (streamEvent.type === "meta" && Array.isArray(streamEvent.sources)) {
            setAskTurns((current) => current.map((turn) => turn.id === turnId ? { ...turn, sources: streamEvent.sources ?? [] } : turn));
          }
        };
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          pending += decoder.decode(value, { stream: true });
          const lines = pending.split("\n");
          pending = lines.pop() ?? "";
          lines.forEach(applyEvent);
        }
        pending += decoder.decode();
        if (pending.trim()) applyEvent(pending);
        if (!finished) throw new Error('The response was interrupted. Please try the inspection again.');
      } else {
        const answer = await response.text();
        if (!answer.trim()) throw new Error('Replit returned no explanation. Please try again.');
        setAskTurns((current) => current.map((turn) => turn.id === turnId ? { ...turn, answer } : turn));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ask AI is unavailable right now.";
      setAskTurns((current) => current.map((turn) => turn.id === turnId ? { ...turn, error: message } : turn));
      throw error;
    } finally {
      setAskTurns((current) => current.map((turn) => turn.id === turnId ? { ...turn, loading: false } : turn));
      setAskLoading(false);
    }
  };

  const composer = (
    <ReplitPromptComposer
      value={askQuery}
      loading={askLoading}
      selectedAppId={selectedAskAppId}
      selectedDocs={selectedAskDocs}
      docsPages={askLearnPages}
      onChange={setAskQuery}
      onAppChange={setSelectedAskAppId}
      onDocsChange={setSelectedAskDocs}
      onSubmit={submitAsk}
    />
  );

  return (
    <RecipeBuildProvider onIterate={async () => {
      const id = crypto.randomUUID();
      setAskViewMode('split');
      setChatDismissedOn(null);
      setAskTurns(current => [...current, { id, question: 'Keep the current recipe features, but add a way to mark favorites.', answer: '', error: '', loading: true, sources: [] }]);
      try {
        const response = await fetch('/api/activities/recipe/iterate', { method: 'POST' });
        const result = await response.json();
        if (!response.ok || !result.accepted) throw new Error('Request not confirmed');
        setAskTurns(current => current.map(turn => turn.id === id ? { ...turn, loading: false, answer: 'Replit has accepted the change request and is adding favorites to your recipe app. Open your project to follow progress and test the result when it is ready.' } : turn));
      } catch (error) {
        setAskTurns(current => current.map(turn => turn.id === id ? { ...turn, loading: false, error: 'We couldn’t confirm this change. Check your project in Replit before retrying.' } : turn));
        throw error;
      }
    }} onAppCreated={setSelectedAskAppId} onInspect={(prompt, appId) => sendAsk(prompt, appId, [], true)} onShowChat={() => {
      setAskViewMode("split");
      setAskTurns((current) => current.some((turn) => turn.recipeBuild) ? current : [...current, { id: "recipe-build", question: RECIPE_PROMPT, answer: "", error: "", loading: false, sources: [], recipeBuild: true }]);
    }}>
    <div className="app-shell">
      <LearnSettingsDock theme={theme} palette={palette} onThemeChange={setTheme} onPaletteChange={setPalette} />
      <div className="page-stage standalone-learn-stage">
        {showLessonChat && askViewMode === "focus" ? (
          <section className="learn-ask-focus">
            <AskConversationView turns={askTurns} mode={askViewMode} onModeChange={setAskViewMode} onBack={closeLessonChat} />
            <div className="learn-focus-composer">
              <ReplitPromptComposer
                value={askQuery}
                loading={askLoading}
                selectedAppId={selectedAskAppId}
                selectedDocs={selectedAskDocs}
                docsPages={askLearnPages}
                layout="panel"
                onChange={setAskQuery}
                onAppChange={setSelectedAskAppId}
                onDocsChange={setSelectedAskDocs}
                onSubmit={submitAsk}
              />
            </div>
          </section>
        ) : (
          <div className={showLessonChat ? "learn-with-ask" : ""}>
            <LearnPage chatOpen={showLessonChat} />
            {showLessonChat && (
              <aside className={`ask-chat-blade standalone-ask-blade ${chatHighlighted ? "chat-rainbow-highlight" : ""}`} tabIndex={-1} aria-label="Lesson chat">
                <AskConversationView turns={askTurns} mode={askViewMode} onModeChange={setAskViewMode} onBack={closeLessonChat} />
                <ReplitPromptComposer
                  value={askQuery}
                  loading={askLoading}
                  selectedAppId={selectedAskAppId}
                  selectedDocs={selectedAskDocs}
                  docsPages={askLearnPages}
                  layout="panel"
                  onChange={setAskQuery}
                  onAppChange={setSelectedAskAppId}
                  onDocsChange={setSelectedAskDocs}
                  onSubmit={submitAsk}
                />
              </aside>
            )}
          </div>
        )}
      </div>
    </div>
    </RecipeBuildProvider>
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Missing Learn application root");

// Prototype refreshes start from the same locked lesson and reading position.
// Keep section links intact for ordinary navigation, but clear them on reload.
if ((performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type === "reload") {
  window.history.scrollRestoration = "manual";
  window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
}

type LearnRoot = ReturnType<typeof createRoot>;
const browserWindow = window as typeof window & { __replitLearnRoot?: LearnRoot };
const learnRoot = browserWindow.__replitLearnRoot ?? createRoot(rootElement);
browserWindow.__replitLearnRoot = learnRoot;

learnRoot.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
