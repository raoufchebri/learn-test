import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import { appFoundationLessons, courseLessons, learnDisplayTitle, type LearnLesson } from "./learn-content";
import { ReplitAccount } from "./replit-account";
import { RecipeBuildProvider, RecipeBuildStep, RecipeBuildStatus, ProjectLessonStep, useRecipeActivity, RECIPE_PROMPT, RECIPE_DEMO } from "./recipe-build";
import {
  ReplitPromptComposer,
  type AskDocsReference,
  type DocsSlashPage,
} from "./replit-prompt-composer";
import "./styles.css";
import "./layout-overrides.css";
import "./standalone.css";

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
type CourseModule = {
  pillar: CoursePillarId;
  title: string;
  description: string;
  lessons: LearnLesson[];
};

type CoursePillarId = "discover" | "ai" | "operate" | "design" | "build" | "admin";

type CoursePillar = {
  id: CoursePillarId;
  title: string;
  description: string;
  modules: CourseModule[];
};

function learnSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const courseModules: CourseModule[] = [
  {
    pillar: "discover",
    title: "Replit 101",
    description: "See what Replit can do, then try the core outcomes through small, guided exercises.",
    lessons: courseLessons["Replit 101"],
  },
  {
    pillar: "ai",
    title: "Work with Agent",
    description: "Direct Agent with clear outcomes, useful context, and the right working mode.",
    lessons: courseLessons["Work with Agent"],
  },
  {
    pillar: "ai",
    title: "AI Foundations",
    description: "Understand the models, inputs, and evaluation practices behind AI-powered apps.",
    lessons: courseLessons["AI Foundations"],
  },
  {
    pillar: "ai",
    title: "Agent Foundations",
    description: "Understand how agents use context, tools, and human direction to complete work.",
    lessons: courseLessons["Agent Foundations"],
  },
  {
    pillar: "operate",
    title: "Operate with Replit",
    description: "Use conversations, context, integrations, Routines, Reps, and Nexus to move work forward.",
    lessons: courseLessons["Operate with Replit"],
  },
  {
    pillar: "design",
    title: "Design with Agent",
    description: "Turn product ideas into clear, useful interfaces.",
    lessons: courseLessons["Design with Agent"],
  },
  {
    pillar: "build",
    title: "App Foundations",
    description: "Understand the core parts of software without needing to write code manually.",
    lessons: appFoundationLessons.filter((lesson) => lesson.title !== 'Welcome to Build'),
  },
  {
    pillar: "build",
    title: "Build with Agent",
    description: "Turn a prototype into a working, tested, published app.",
    lessons: courseLessons["Build with Agent"],
  },
  {
    pillar: "build",
    title: "Secure and Monitor",
    description: "Protect your app, then observe and respond once it is live.",
    lessons: courseLessons["Secure and Monitor"],
  },
  {
    pillar: "build",
    title: "Grow and Scale",
    description: "Find more people, improve the product experience, and serve growing demand.",
    lessons: courseLessons["Grow and Scale"],
  },
  {
    pillar: "admin",
    title: "Administer Replit",
    description: "Configure, govern, secure, and roll out Replit across an organization.",
    lessons: courseLessons["Administer Replit"],
  },
];

const pillarDefinitions: Array<Omit<CoursePillar, "modules">> = [
  { id: "discover", title: "Replit 101", description: "See what Replit can do, then try the essentials one friendly step at a time." },
  { id: "ai", title: "AI 101", description: "Understand AI and learn how to guide Agent with clear goals, useful context, and thoughtful checks." },
  { id: "operate", title: "Operate", description: "Turn conversations, connected tools, and agent workflows into useful outcomes." },
  { id: "design", title: "Design", description: "Shape an idea into a clear app experience—even if you do not call yourself a designer." },
  { id: "build", title: "Build", description: "Take an app from the first working version to something secure, published, and ready to grow." },
  { id: "admin", title: "Admin", description: "Help an organization adopt Replit safely, confidently, and at its own pace." },
];

const coursePillars: CoursePillar[] = pillarDefinitions.map((pillar) => ({
  ...pillar,
  modules: courseModules.filter((module) => module.pillar === pillar.id),
}));

const lessonUrl = (module: CourseModule, lesson: LearnLesson) =>
  `/learn/${learnSegment(module.title)}/${learnSegment(lesson.title)}`;

const isAvailablePillar = (id: CoursePillarId) => id === 'discover' || id === 'build';
const isAvailableModule = (module: CourseModule) => isAvailablePillar(module.pillar)
  && coursePillars.find((pillar) => pillar.id === module.pillar)?.modules[0] === module;
const availableLessonUrls = new Set(courseModules.filter(isAvailableModule)
  .flatMap((module) => module.lessons.slice(0, module.pillar === 'discover' ? 2 : 3).map((lesson) => lessonUrl(module, lesson))));

const askLearnPages: DocsSlashPage[] = [
  { label: "Welcome to Replit Learn", path: "/", section: "Learn" },
  ...courseModules.flatMap((module) =>
    module.lessons.map((lesson) => ({
      label: lesson.title,
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

function LessonPage({
  lesson,
  chapter,
  nextLesson,
  chatOpen = false,
  onComplete,
  completed = false,
}: {
  lesson: LearnLesson;
  chapter: number;
  chatOpen?: boolean;
  onComplete?: () => void;
  completed?: boolean;
  nextLesson?: { title: string; onClick: () => void };
}) {
  const recipe = useRecipeActivity();
  const recipeLesson = lesson.activity === "recipe-build";
  const [entryOpened, setEntryOpened] = useState(!lesson.entryLink);
  const [promptContinued, setPromptContinued] = useState(!lesson.promptGate);
  const [copiedPrompt, setCopiedPrompt] = useState('');
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
  const frontendVisible = !hasCheckpoint || frontendOpened;
  useEffect(() => { setFrontendAnswers([]); setFrontendReady(RECIPE_DEMO && hasFrontendCheck); setFrontendOpened(RECIPE_DEMO && hasFrontendCheck); }, [lesson.title]);
  const unlocked = lesson.testingUnlocked || (lesson.projectTask ? recipe.inspections[lesson.projectTask.id] === 'complete' : !recipeLesson || (!!recipe.build.replId && ['creating', 'complete'].includes(recipe.build.status)));
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
  const [copyStatus, setCopyStatus] = useState('Copy request');
  const practiceDone = !lesson.practice || lesson.practice.checks.every((_, index) => practiceChecks.includes(index));
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
    if (!onComplete || completed || !quizPassed || !unlocked) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    nextUnlockRef.current?.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "center" });
    const reveal = window.setTimeout(() => {
      onComplete();
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
        } catch { /* Celebration audio is optional. */ }
      }
      unlockTimers.current.push(window.setTimeout(() => setUnlockCelebration(false), 2000));
    }, reduced ? 250 : 1100);
    return () => window.clearTimeout(reveal);
  }, [quizPassed, completed, unlocked]);
  const [videoFloating, setVideoFloating] = useState(false);
  const [videoReturning, setVideoReturning] = useState(false);
  const [videoDismissed, setVideoDismissed] = useState(false);
  const [videoMotion, setVideoMotion] = useState({ x: 0, y: 0, scale: 1 });
  const videoAnchorRef = useRef<HTMLDivElement>(null);
  const videoFloatingRef = useRef(false);
  const videoReturningRef = useRef(false);
  const videoReturnTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    setAnswers([]);
    setVideoDismissed(false);
    videoFloatingRef.current = false;
    videoReturningRef.current = false;
    setVideoReturning(false);
    setVideoFloating(false);
    window.clearTimeout(videoReturnTimerRef.current);
    if (location.hash) {
      const targetId = decodeURIComponent(location.hash.slice(1));
      window.requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({ block: "start" });
      });
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [lesson.title, location.hash]);

  useEffect(() => {
    const videoAnchor = videoAnchorRef.current;
    if (!videoAnchor) return;
    videoReturningRef.current = false;
    setVideoReturning(false);
    let frame = 0;
    const updateVideoPosition = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const videoRect = videoAnchor.getBoundingClientRect();
        const chatVideoSlot = chatOpen && window.innerWidth >= 1600;
        const canFloat = !chatOpen || chatVideoSlot;
        const rightOffset = chatVideoSlot ? 458 : 18;
        if (canFloat && !videoFloatingRef.current && videoRect.top < -24) {
          const targetWidth = chatVideoSlot ? 260 : Math.min(340, window.innerWidth - 36);
          setVideoMotion({
            x: videoRect.left - (window.innerWidth - targetWidth - rightOffset),
            y: videoRect.top - 18,
            scale: videoRect.width / targetWidth,
          });
          videoFloatingRef.current = true;
          videoReturningRef.current = false;
          setVideoReturning(false);
          setVideoFloating(true);
        } else if (videoFloatingRef.current && !videoReturningRef.current && (!canFloat || videoRect.top > 16)) {
          const floatingWidth = chatVideoSlot ? 260 : Math.min(340, window.innerWidth - 36);
          setVideoMotion({
            x: videoRect.left - (window.innerWidth - floatingWidth - rightOffset),
            y: videoRect.top - 18,
            scale: videoRect.width / floatingWidth,
          });
          videoReturningRef.current = true;
          setVideoReturning(true);
          videoReturnTimerRef.current = window.setTimeout(() => {
            videoFloatingRef.current = false;
            videoReturningRef.current = false;
            setVideoReturning(false);
            setVideoFloating(false);
          }, 380);
        }
        if (videoRect.top > 16) setVideoDismissed(false);
      });
    };
    updateVideoPosition();
    window.addEventListener("scroll", updateVideoPosition, { passive: true });
    window.addEventListener("resize", updateVideoPosition);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(videoReturnTimerRef.current);
      window.removeEventListener("scroll", updateVideoPosition);
      window.removeEventListener("resize", updateVideoPosition);
    };
  }, [lesson.title, chatOpen]);

  return (
    <article className="lesson-content learn-content-stage" id="overview" key={lesson.title}>
      {unlockCelebration && createPortal(<div className="lesson-confetti" aria-hidden="true">{Array.from({ length: 64 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, background: ["#e89a58", "#91bca5", "#a299cf", "#edc76b", "#88b9ce"][i % 5], animationDelay: `${(i % 8) * 35}ms`, "--drift": `${((i * 19) % 160) - 80}px` } as CSSProperties} />)}</div>, document.body)}
      <div className="lesson-video-shell" ref={videoAnchorRef}>
        <div
          className={`lesson-video lesson-video-embed ${videoFloating && !videoDismissed ? "floating" : ""} ${videoReturning ? "returning" : ""}`}
          style={{
            "--video-float-x": `${videoMotion.x}px`,
            "--video-float-y": `${videoMotion.y}px`,
            "--video-float-scale": videoMotion.scale,
          } as CSSProperties}
        >
          <div className="welcome-video-frame">
            <iframe
              src="https://www.youtube-nocookie.com/embed/pajkCpfpcP4"
              title={`${learnDisplayTitle(lesson.title)} video`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          {videoFloating && !videoDismissed && (
            <button
              className="lesson-video-dismiss"
              type="button"
              aria-label="Close floating video"
              onClick={() => setVideoDismissed(true)}
            >
              <Icons.X size={15} />
            </button>
          )}
        </div>
      </div>
      <small className="caption lesson-video-caption-top">Video placeholder · This lesson will include its own walkthrough</small>
      <p className="eyebrow">{learnDisplayTitle(lesson.module).toUpperCase()} / CHAPTER {chapter + 1} · {lesson.duration}</p>
      <h1>{learnDisplayTitle(lesson.title)}</h1>
      {lesson.testingUnlocked && lesson.projectTask && <p className="caption">Testing access: this lesson is open for review. Project inspection still requires a completed app.</p>}
      <p className="intro">{lesson.summary}</p>
      {lesson.openingImage && <figure className="lesson-app-screenshot"><img src={lesson.openingImage.src} alt={lesson.openingImage.alt} /><figcaption>Replit home · Personal details replaced for this example.</figcaption></figure>}
      {lesson.introduction?.map((paragraph) => typeof paragraph === 'string'
        ? <p className="lesson-introduction-copy" key={paragraph}>{paragraph}</p>
        : <div className="lesson-introduction-copy" key={paragraph.text}><p>{paragraph.text}</p><ul>{paragraph.items.map((item) => <li key={item}>{item}</li>)}</ul></div>)}
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
        <p>First, open a new conversation in Replit. Keep this lesson open so you can follow along.</p>
        <a className="recipe-create-button" href={lesson.entryLink} target="_blank" rel="noopener noreferrer" onClick={() => {
          if (!entryOpened) {
            setEntryOpened(true);
            setUnlockCelebration(true);
            if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) playUnlockChime();
            unlockTimers.current.push(window.setTimeout(() => setUnlockCelebration(false), 2000));
          }
        }}><LessonUnlockIcon /><span>Open Replit and start a conversation ↗</span></a>
        <small>Opens in a new tab. Write and send your prompt there.</small>
      </div>}
      {entryOpened && <>
      {lesson.sections.map((section, sectionIndex) => (
        ((!promptContinued && sectionIndex > 0) || (!unlocked && sectionIndex > promptIndex) || (!frontendVisible && sectionIndex > checkpointIndex) || (hasFrontendCheck && sectionIndex > 5 && recipe.iteration !== 'complete')) ? null : <section className={`foundation-section ${((recipeLesson || lesson.projectTask) && sectionIndex > promptIndex) || (hasCheckpoint && sectionIndex > checkpointIndex) || (lesson.promptGate && sectionIndex > 0) ? "lesson-unlocked" : ""}`} id={section.id ?? learnSegment(section.heading)} key={section.heading}>
          <h2>{section.heading}</h2>
          <p>{section.body}</p>
          {section.prompt && <blockquote className="lesson-example-prompt"><p>{section.prompt}</p></blockquote>}
          {lesson.promptGate && section.prompt && <div className="practice-actions"><button type="button" onClick={async () => {
            try { await navigator.clipboard.writeText(section.prompt!); setCopiedPrompt(section.prompt!); }
            catch { setCopiedPrompt('failed'); }
          }}>{copiedPrompt === section.prompt ? 'Copied' : 'Copy prompt'}</button><span role="status">{copiedPrompt === 'failed' ? 'Select the prompt above and copy it manually.' : 'Paste it into Replit and send it there.'}</span></div>}
          {lesson.promptGate && sectionIndex === 0 && <div className={`recipe-unlock-action ${promptContinued ? 'is-open' : ''}`}><button className="recipe-create-button" disabled={promptContinued} onClick={() => {
            setPromptContinued(true); setUnlockCelebration(true);
            if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) playUnlockChime();
            unlockTimers.current.push(window.setTimeout(() => setUnlockCelebration(false), 2000));
          }}><LessonUnlockIcon /><span>{promptContinued ? 'Next section unlocked' : 'I’ve sent the prompt · Continue'}</span></button><small>This confirms your progress here; it doesn’t send the prompt for you.</small></div>}
          {recipeLesson && section.prompt && <RecipeBuildStep unlocking={unlockCelebration} />}
          {lesson.projectTask && sectionIndex === 0 && <ProjectLessonStep task={lesson.projectTask} />}
          {section.afterPrompt && unlocked && (recipeLesson ? <>
            <h2 id="recipe-prompt-explanation">What just happened now?</h2>
            <p>The highlighted area on the right side of the screen is the chat. It shows your request in a message bubble. On smaller screens, the chat opens in its own panel. That request is a prompt: a description of what you want to create, written in natural language.</p>
            <p>You asked for a personal recipe app where you can add, edit, and find recipes. Each recipe needs a name, ingredients, and instructions.</p>
            <p>That means an interface with forms and buttons, app logic that responds when you use them, and storage that keeps your recipes in this browser. For this first version, all three work in the browser. No sign-in or separate backend is needed.</p>
            <p>Let’s explore the building blocks this prompt describes.</p>
          </> : <p>{section.afterPrompt}</p>)}
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
          {section.image && (
            <figure className="lesson-app-screenshot">
              <img src={section.image.src} alt={section.image.alt} loading="lazy" />
              <figcaption>{section.image.caption} <a href={section.image.source} target="_blank" rel="noreferrer">Source</a></figcaption>
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
      {promptContinued && unlocked && frontendVisible && (!hasFrontendCheck || recipe.iteration === 'complete') && <div className={recipeLesson ? "lesson-unlocked" : undefined}>
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
      <section className="lesson-quiz">
        <div className="quiz-heading"><span>{lesson.quiz.length} {lesson.quiz.length === 1 ? 'question' : 'questions'}</span><p className="eyebrow">CHECK YOUR UNDERSTANDING</p></div>
        <h2>Quick check</h2>
        {lesson.quiz.map((question, questionIndex) => (
          <div className="quiz-question" key={question.prompt}>
            <h3>{questionIndex + 1}. {question.prompt}</h3>
            {question.choices.map((choice, choiceIndex) => (
              <button
                className={`${answers[questionIndex] === choiceIndex ? "selected" : ""} ${answers[questionIndex] === choiceIndex && choiceIndex === question.answer ? "correct" : ""}`}
                onClick={() => setAnswers((current) => {
                  const next = [...current];
                  next[questionIndex] = choiceIndex;
                  return next;
                })}
                key={choice}
              >
                <span>{String.fromCharCode(65 + choiceIndex)}</span>
                {choice}
                {answers[questionIndex] === choiceIndex && <i>{choiceIndex === question.answer ? "✓" : "Selected"}</i>}
              </button>
            ))}
            {answers[questionIndex] !== undefined && (
              <p className={answers[questionIndex] === question.answer ? "quiz-feedback success" : "quiz-feedback retry"}>
                {answers[questionIndex] === question.answer
                  ? question.feedback ?? "✦ That’s the idea. Nice work."
                  : "Not quite, and that’s okay. Revisit the idea above, then try another answer."}
              </p>
            )}
          </div>
        ))}
        {nextLesson && (
          onComplete ? <div className={`recipe-unlock-action ${completed ? "is-open" : ""} ${unlockCelebration ? "is-unlocking" : ""}`}>
            <button ref={nextUnlockRef} className="recipe-create-button" disabled={!completed} onClick={nextLesson.onClick}>
              <LessonUnlockIcon />
              <span>{completed ? "Continue to " : "Unlock "}{learnDisplayTitle(nextLesson.title)}</span>
            </button>
            {!completed && <small>{lesson.practice ? 'Complete your activity checks and answer every question correctly to unlock the next lesson.' : 'Answer every question correctly to unlock the next lesson.'}</small>}
          </div> : <button className="next-lesson" onClick={nextLesson.onClick}>
            <span>CONTINUE</span><strong>{learnDisplayTitle(nextLesson.title)}</strong><b>→</b>
          </button>
        )}
        {!nextLesson && onComplete && <div className={`recipe-unlock-action ${completed ? 'is-open' : ''}`}>
          <button ref={nextUnlockRef} className="recipe-create-button" disabled={!completed} onClick={() => window.location.assign('/')}><LessonUnlockIcon /><span>{completed ? 'Section complete · Explore courses' : 'Complete the activity and quiz'}</span></button>
        </div>}
      </section>
      </div>}
      </>}
    </article>
  );
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

function WelcomePage({ onStart, learnerName, learnerKey }: { onStart: (pillar: CoursePillar) => void; learnerName?: string; learnerKey?: string }) {
  const welcomeDialog = useRef<HTMLDialogElement>(null);
  const greeted = useRef(false);
  const [hasProjects, setHasProjects] = useState(false);
  useEffect(() => {
    if (learnerName === undefined) { greeted.current = false; return; }
    if (!learnerKey) return;
    const storageKey = `replit-learn-welcome-seen:${learnerKey}`;
    let seen = false;
    try { seen = window.localStorage.getItem(storageKey) === 'true'; } catch { /* Storage may be unavailable. */ }
    if (!greeted.current && !seen && welcomeDialog.current) {
      greeted.current = true;
      welcomeDialog.current.showModal();
      try { window.localStorage.setItem(storageKey, 'true'); } catch { /* Keep the welcome usable without storage. */ }
    }
    const controller = new AbortController();
    void fetch('/api/mcp/apps', { credentials: 'same-origin', signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => { if (!controller.signal.aborted) setHasProjects(result?.status === 'ready' && Array.isArray(result.apps) && result.apps.length > 0); })
      .catch(() => {});
    return () => controller.abort();
  }, [learnerName, learnerKey]);
  return (
    <article className="lesson-content learn-content-stage">
      <p className="eyebrow">WELCOME TO REPLIT LEARN</p>
      <h1>Start where you are. Build from there.</h1>
      {learnerName !== undefined && <dialog ref={welcomeDialog} className="learner-welcome learner-welcome-modal" aria-labelledby="learner-welcome-title">
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
            src="https://www.youtube-nocookie.com/embed/pajkCpfpcP4"
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
        <p>The first section of Replit 101 and App Foundations in Build are ready to explore. More sections and courses are coming soon.</p>
        <div className="learn-course-grid">
          {(['discover', 'build', 'ai', 'design', 'admin'] as CoursePillarId[]).map((id, index) => {
            const pillar = coursePillars.find((entry) => entry.id === id)!;
            const available = isAvailablePillar(pillar.id);
            const pillarLessonCount = pillar.modules[0]?.lessons.length ?? 0;
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
          setStatus(session.authenticated === true ? "signed-in" : "signed-out");
          setLearnerName(session.authenticated === true ? (session.user?.firstName || session.user?.username || '') : undefined);
          setLearnerKey(session.authenticated === true ? String(session.user?.id || session.user?.username || '') : undefined);
        }
      } catch { if (active && current === request && !background) setStatus("error"); }
    };
    void check();
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
  const [enteringCourse, setEnteringCourse] = useState<string | null>(null);
  const [entryRevealing, setEntryRevealing] = useState(false);
  const entryDestination = useRef<string | null>(null);
  const entryTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(entryTimer.current), []);
  useEffect(() => {
    if (!enteringCourse || location.pathname !== entryDestination.current || access === 'checking') return;
    if (access !== 'signed-in') {
      setEnteringCourse(null); setEntryRevealing(false); entryDestination.current = null;
      window.clearTimeout(entryTimer.current); entryTimer.current = undefined;
      return;
    }
    setEntryRevealing(true);
    entryTimer.current = window.setTimeout(() => {
      setEnteringCourse(null); setEntryRevealing(false); entryDestination.current = null; entryTimer.current = undefined;
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1200);
    return () => window.clearTimeout(entryTimer.current);
  }, [location.pathname, access, enteringCourse]);
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
    if (location.pathname.startsWith("/learn/") && (access === "signed-out" || access === "error")) {
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
  const buildSequence = courseModules.filter((entry) => entry.pillar === "build").flatMap((entry) => entry.lessons.map((item) => ({ module: entry, lesson: item, url: lessonUrl(entry, item) })));
  const firstApp = buildSequence.findIndex((entry) => entry.lesson.title === "What Is an App?");
  const sequence = firstApp >= 0 ? buildSequence.slice(firstApp) : [];
  const isLocked = (url: string) => {
    if (url && !availableLessonUrls.has(url)) return true;
    if (url === '/learn/replit-101/from-conversation-to-outcome') return !completedLessons.includes('/learn/replit-101/what-you-can-do-with-replit');
    const index = sequence.findIndex((entry) => entry.url === url);
    return index > 0 && sequence.slice(0, index).some((entry) => !completedLessons.includes(entry.url));
  };
  const currentUrl = module && lesson ? lessonUrl(module, lesson) : "";
  const sequenceIndex = sequence.findIndex((entry) => entry.url === currentUrl);
  const currentLocked = isLocked(currentUrl);
  useEffect(() => {
    if (access === "signed-in" && currentLocked) {
      if (!availableLessonUrls.has(currentUrl)) { navigate('/', { replace: true }); return; }
      if (currentUrl === '/learn/replit-101/from-conversation-to-outcome') { navigate('/learn/replit-101/what-you-can-do-with-replit', { replace: true }); return; }
      const available = sequence.find((entry) => !completedLessons.includes(entry.url));
      if (available) navigate(available.url, { replace: true });
    }
  }, [access, currentLocked, currentUrl, completedLessons, navigate]);

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
    if (access === "signed-in") enterCourse(destination, coursePillars.find((pillar) => pillar.id === target.pillar)?.title ?? target.title);
    else setPendingCourse(destination);
  };
  const startPillar = (pillar: CoursePillar) => {
    const firstModule = pillar.modules[0];
    if (firstModule) startModule(firstModule);
  };
  const nextLesson = module && lessonIndex >= 0 ? module.lessons[lessonIndex + 1] : undefined;
  const showCourseNavigation = moduleIndex >= 0 && access === "signed-in";
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
                    const moduleProgress = pillar.id === "build" ? 100 * targetModule.lessons.filter((item) => completedLessons.includes(lessonUrl(targetModule, item))).length / targetModule.lessons.length : moduleGroupIndex < activeModuleGroupIndex
                      ? 100
                      : moduleCurrent
                        ? ((lessonIndex + 1) / targetModule.lessons.length) * 100
                        : 0;
                    return (
                      <section className={`course-module-group ${moduleCurrent ? "current" : ""}`} key={targetModule.title}>
                        <div className="course-module-heading">
                          <b>{String(moduleGroupIndex + 1).padStart(2, "0")}</b>
                          <strong>{learnDisplayTitle(targetModule.title)}</strong>
                          <small>{isAvailableModule(targetModule) ? `${moduleMinutes} min` : 'Coming soon'}</small>
                        </div>
                        <div
                          className="course-chapters"
                          id={`course-module-${index}`}
                          style={{ "--course-module-progress": `${moduleProgress}%` } as CSSProperties}
                        >
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
                                <span>{learnDisplayTitle(targetLesson.title)}</span>
                                {locked ? <Icons.LockKeyhole size={16} aria-label="Locked" /> : <span className={`lesson-nav-state ${lessonComplete ? 'is-complete' : 'is-progress'}`} role="img" aria-label={lessonComplete ? 'Completed' : 'In progress'}><Icons.Check size={12} strokeWidth={2.5} aria-hidden="true" /></span>}
                              </button>
                            );
                          })}
                          </div>
                      </section>
                    );
                  })}
                  {pillar.id === 'discover' && <section className="course-module-group">
                    <div className="course-module-heading">
                      <b>02</b>
                      <strong>More to explore</strong>
                      <small>Coming soon</small>
                    </div>
                  </section>}
              </div>
            </section>
          );
        })}
        </div>
        </aside>
      </>}
      <div className="learn-main-column">
        {composer}
        {lesson && module && access === "signed-in" && !currentLocked ? (
          <LessonPage
            key={currentUrl}
            completed={completedLessons.includes(currentUrl)}
            onComplete={sequenceIndex >= 0 || module.pillar === 'discover' ? () => setCompletedLessons((current) => current.includes(currentUrl) ? current : [...current, currentUrl]) : undefined}
            chatOpen={chatOpen}
            lesson={lesson}
            chapter={lessonIndex}
            nextLesson={sequenceIndex >= 0 && sequence[sequenceIndex + 1] && availableLessonUrls.has(sequence[sequenceIndex + 1].url) ? {
              title: sequence[sequenceIndex + 1].lesson.title,
              onClick: () => navigate(sequence[sequenceIndex + 1].url),
            } : nextLesson && availableLessonUrls.has(lessonUrl(module, nextLesson)) ? {
              title: nextLesson.title,
              onClick: () => navigate(lessonUrl(module, nextLesson)),
            } : undefined}
          />
        ) : (
          <WelcomePage onStart={startPillar} learnerName={access === 'signed-in' ? learnerName : undefined} learnerKey={access === 'signed-in' ? learnerKey : undefined} />
        )}
        <dialog className="learn-sign-in-modal" ref={signInDialog} onCancel={dismissSignIn} onClose={dismissSignIn} aria-labelledby="learn-sign-in-title" aria-describedby="learn-sign-in-description">
          <button className="modal-close" aria-label="Close sign-in" onClick={dismissSignIn}><Icons.X size={20} /></button>
          <div className="signin-emblem" aria-hidden="true"><Icons.Sparkles size={30} /></div>
          <p className="signin-eyebrow">REPLIT LEARN</p>
          <h2 id="learn-sign-in-title">Your next idea starts here.</h2>
          <p id="learn-sign-in-description">Sign in to explore, try something new, and build along with each lesson.</p>
          {access === "checking" ? <p role="status">Checking your sign-in…</p> : access === "error" ? <><p>Your sign-in could not be checked.</p><button onClick={retry}>Try again</button></> : <>
            <a className="signin-primary" href="/api/auth/login?returnTo=%2F">Continue with Replit <Icons.ArrowRight size={18} /></a>
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
  return build.status === 'idle' ? <p className="caption">Your app’s build updates will appear here after you create it in “What is an app?”</p> : <RecipeBuildStatus />;
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
        <button type="button" onClick={onBack}><Icons.ArrowLeft size={15} /> Back to Learn</button>
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
  const [open, setOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [avatar, setAvatar] = useState<string | undefined>();
  const [username, setUsername] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const dock = useRef<HTMLElement>(null);

  useEffect(() => {
    let active = true;
    const updateFromSession = () => {
      fetch("/api/auth/session", { credentials: "same-origin", headers: { accept: "application/json" } })
        .then((response) => response.ok ? response.json() as Promise<{ authenticated?: boolean; user?: { username?: string; profileImageUrl?: string } }> : Promise.reject())
        .then((session) => { if (active) { setAuthenticated(session.authenticated === true); setAvatar(session.user?.profileImageUrl); setUsername(session.user?.username ?? ""); } })
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
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (dock.current && !dock.current.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

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

  const openHeaderAccount = () => {
    setOpen(false);
    document.querySelector<HTMLButtonElement>(".account-trigger:not(.account-loading)")?.click();
  };

  const openAccount = () => {
    if (authenticated === true) openHeaderAccount();
    if (authenticated === false) signIn();
  };

  return (
    <aside className="learn-settings-dock" ref={dock} aria-label="Learn account and settings">
      {open && (
        <section className="learn-settings-panel" id="learn-settings-panel" role="dialog" aria-label="Learn settings">
          <header>
            <div><strong>Settings</strong><small>Personalize Replit Learn</small></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close settings"><Icons.X size={16} /></button>
          </header>

          <div className="learn-settings-section">
            <span>Appearance</span>
            <div className="learn-settings-mode-grid" role="group" aria-label="Appearance mode">
              <button type="button" className={theme === "light" ? "selected" : ""} onClick={() => onThemeChange("light")} aria-pressed={theme === "light"}>
                <Icons.Sun size={16} /> Light
              </button>
              <button type="button" className={theme === "dark" ? "selected" : ""} onClick={() => onThemeChange("dark")} aria-pressed={theme === "dark"}>
                <Icons.Moon size={16} /> Dark
              </button>
            </div>
          </div>

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
          {authenticated && <div className="learn-settings-section">
            <button className="learn-sign-out" type="button" onClick={() => void signOut()} disabled={signingOut}><Icons.LogOut size={16} /> {signingOut ? 'Signing out…' : 'Sign out'}</button>
            {signOutError && <p role="alert">{signOutError}</p>}
          </div>}
        </section>
      )}

      <div className="learn-settings-dock-row">
        <button className="learn-settings-dock-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-label="Learn settings" aria-haspopup="dialog" aria-controls="learn-settings-panel" aria-expanded={open}>
          {avatar ? <img src={avatar} alt="" /> : username ? <span>{username.slice(0, 2).toUpperCase()}</span> : <Icons.UserRound size={18} />}
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
  const showLessonChat = askTurns.length > 0 || (['/learn/app-foundations/what-is-replit-building', '/learn/app-foundations/projects-code-files'].includes(location.pathname) && chatDismissedOn !== location.pathname);
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
