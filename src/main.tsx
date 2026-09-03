import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import { appFoundationLessons, courseLessons, type LearnLesson } from "./learn-content";
import { ReplitAccount } from "./replit-account";
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
};
type CourseModule = {
  title: string;
  description: string;
  lessons: LearnLesson[];
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
    title: "App Foundations",
    description: "Learn how Replit projects work and ship a simple app.",
    lessons: appFoundationLessons,
  },
  {
    title: "AI Foundations",
    description: "Understand the models, inputs, and evaluation practices behind AI-powered apps.",
    lessons: courseLessons["AI Foundations"],
  },
  {
    title: "Agent Foundations",
    description: "Understand how agents use context, tools, and human direction to complete work.",
    lessons: courseLessons["Agent Foundations"],
  },
  {
    title: "Design with Agent",
    description: "Turn product ideas into clear, useful interfaces.",
    lessons: courseLessons["Design with Agent"],
  },
  {
    title: "Build with Agent",
    description: "Turn a prototype into a working, tested, published app.",
    lessons: courseLessons["Build with Agent"],
  },
  {
    title: "Secure and Monitor",
    description: "Protect your app, then observe and respond once it is live.",
    lessons: courseLessons["Secure and Monitor"],
  },
  {
    title: "Grow and Scale",
    description: "Find more people, improve the product experience, and serve growing demand.",
    lessons: courseLessons["Grow and Scale"],
  },
];

const lessonCount = courseModules.reduce((total, module) => total + module.lessons.length, 0);
const lessonUrl = (module: CourseModule, lesson: LearnLesson) =>
  `/learn/${learnSegment(module.title)}/${learnSegment(lesson.title)}`;

const askLearnPages: DocsSlashPage[] = [
  { label: "Welcome to Replit Learn", path: "/learn", section: "Learn" },
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
    <figure className="architecture-map">
      <figcaption>A simple app system</figcaption>
      <div>
        <section>
          <b>Frontend &amp; UI</b>
          <span>HTML · CSS · JavaScript</span>
          <small>People click, read, and make requests.</small>
        </section>
        <i>→</i>
        <section>
          <b>Backend &amp; Logic</b>
          <span>Rules · APIs · Workflows</span>
          <small>The app decides what should happen.</small>
        </section>
        <i>→</i>
        <section>
          <b>Data &amp; Services</b>
          <span>Database · Storage · Integrations</span>
          <small>The app remembers and connects.</small>
        </section>
      </div>
      <p>Identity and permissions help the right people access the right parts of every layer.</p>
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
}: {
  lesson: LearnLesson;
  chapter: number;
  nextLesson?: { title: string; onClick: () => void };
}) {
  const location = useLocation();
  const [answers, setAnswers] = useState<number[]>([]);

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

  return (
    <article className="lesson-content learn-content-stage" id="overview" key={lesson.title}>
      <p className="eyebrow">{lesson.module.toUpperCase()} / CHAPTER {chapter + 1} · {lesson.duration}</p>
      <h1>{lesson.title}</h1>
      <p className="intro">{lesson.summary}</p>
      {lesson.outcomes && (
        <section className="learning-outcomes">
          <p className="eyebrow">BY THE END OF THIS PAGE</p>
          <ul>{lesson.outcomes.map((outcome) => <li key={outcome}><span>✓</span>{outcome}</li>)}</ul>
        </section>
      )}
      <div className="lesson-video compact-video">
        <div className="video-top">✚ Replit <b>Learn</b></div>
        <div className="video-board">
          <section><strong>{lesson.video}</strong><small>Video placeholder · approximately two minutes</small></section>
          <aside>
            <div><b>✧</b><strong>Concept first</strong><small>Build a useful mental model.</small></div>
            <div><b>↗</b><strong>Try it in Replit</strong><small>Connect the idea to a real project.</small></div>
          </aside>
          <button aria-label="Play lesson video">▷</button>
        </div>
      </div>
      {lesson.sections.map((section) => (
        <section className="foundation-section" id={learnSegment(section.heading)} key={section.heading}>
          <h2>{section.heading}</h2>
          <p>{section.body}</p>
          {section.items && <ul className="lesson-points">{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}
        </section>
      ))}
      {lesson.title === "What Is an App?" && <AppArchitectureMap />}
      {lesson.title === "Frontend & UI" && <><UIStatesMap /><FrontendExample /></>}
      <section className="replit-example">
        <p className="eyebrow">IN REPLIT</p>
        <p>{lesson.replitExample}</p>
      </section>
      <section className="lesson-quiz">
        <div className="quiz-heading"><span>3 questions</span><p className="eyebrow">CHECK YOUR UNDERSTANDING</p></div>
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
                  ? "✦ You got it — nice work."
                  : "Almost. Revisit the idea above, then try another answer."}
              </p>
            )}
          </div>
        ))}
        {nextLesson && (
          <button className="next-lesson" onClick={nextLesson.onClick}>
            <span>CONTINUE</span><strong>{nextLesson.title}</strong><b>→</b>
          </button>
        )}
      </section>
    </article>
  );
}

function WelcomePage({ onStart }: { onStart: (module: CourseModule) => void }) {
  return (
    <article className="lesson-content learn-content-stage">
      <p className="eyebrow">WELCOME TO REPLIT LEARN</p>
      <h1>Build with confidence.</h1>
      <div className="lesson-video">
        <div className="video-top">✚ Replit <b>Workspace</b></div>
        <div className="video-board">
          <section><strong>Start with an idea</strong><small>Describe what you want to build, then make it real.</small></section>
          <aside>
            <div><b>✧</b><strong>Build with Agent</strong><small>Move from prompt to product.</small></div>
            <div><b>↗</b><strong>Keep learning</strong><small>Follow each chapter at your pace.</small></div>
          </aside>
          <button aria-label="Play learning path video">▷</button>
        </div>
      </div>
      <small className="caption">Video · A tour of the Replit learning path</small>
      <p>This course gives you a practical path from a blank idea to a production-ready application. You’ll begin with the fundamentals of a Replit app: how projects fit together, how the Workspace supports your work, and how to turn an initial version into something you can publish and share.</p>
      <section className="learn-path-intro">
        <p className="eyebrow">WHAT YOU’LL BUILD</p>
        <h3>From an idea to a production-ready app.</h3>
        <p>Choose a module from the left to see its chapters and begin learning.</p>
        <div>{courseModules.map((module, index) => <button onClick={() => onStart(module)} key={module.title}><span>{String(index + 1).padStart(2, "0")}</span>{module.title}</button>)}</div>
      </section>
    </article>
  );
}

function LearnPage({ composer }: { composer?: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [expandedModuleIndex, setExpandedModuleIndex] = useState(-1);
  const path = useMemo(() => location.pathname.split("/").filter(Boolean), [location.pathname]);
  const moduleIndex = path.length > 1
    ? courseModules.findIndex((module) => learnSegment(module.title) === path[1])
    : -1;
  const module = moduleIndex >= 0 ? courseModules[moduleIndex] : undefined;
  const lessonIndex = module && path[2]
    ? module.lessons.findIndex((lesson) => learnSegment(lesson.title) === path[2])
    : -1;
  const lesson = module && lessonIndex >= 0 ? module.lessons[lessonIndex] : undefined;

  useEffect(() => {
    if (location.pathname === "/") {
      navigate("/learn", { replace: true });
      return;
    }
    if (path[0] !== "learn" || ![1, 3].includes(path.length) || (path.length === 3 && (!module || !lesson))) {
      navigate("/learn", { replace: true });
    }
  }, [lesson, location.pathname, module, navigate, path]);

  useEffect(() => setMobileNavOpen(false), [location.pathname]);

  useEffect(() => {
    setExpandedModuleIndex(moduleIndex);
  }, [moduleIndex]);

  const startModule = (target: CourseModule) => navigate(lessonUrl(target, target.lessons[0]));
  const changeModule = (target: CourseModule, index: number) => {
    if (expandedModuleIndex === index) {
      setExpandedModuleIndex(-1);
      return;
    }
    setExpandedModuleIndex(index);
    if (moduleIndex !== index) startModule(target);
  };
  const nextLesson = module && lessonIndex >= 0 ? module.lessons[lessonIndex + 1] : undefined;

  return (
    <main className="learn-page">
      <button
        className="course-mobile-toggle"
        onClick={() => setMobileNavOpen((open) => !open)}
        aria-expanded={mobileNavOpen}
        aria-controls="learn-course-nav"
      >
        <Icons.ListTree size={17} /> Course navigation <span>{mobileNavOpen ? "−" : "+"}</span>
      </button>
      <aside id="learn-course-nav" className={`course-nav ${mobileNavOpen ? "mobile-open" : ""}`}>
        <strong>Learning path</strong>
        <span><b>0%</b> &nbsp; 0 of {lessonCount} complete</span>
        <div className="course-progress" />
        <button className={moduleIndex === -1 ? "course-welcome active" : "course-welcome"} onClick={() => navigate("/learn")}>
          <b>✦</b><span>Welcome to Replit Learn</span>
        </button>
        {courseModules.map((targetModule, index) => (
          <section className={expandedModuleIndex === index ? "course-module open" : "course-module"} key={targetModule.title}>
            <button
              className="course-module-title"
              onClick={() => changeModule(targetModule, index)}
              aria-expanded={expandedModuleIndex === index}
              aria-controls={`course-module-${index}`}
            >
              <b>{String(index + 1).padStart(2, "0")}</b>
              <span>{targetModule.title}</span>
              <small>{expandedModuleIndex === index ? "−" : "+"}</small>
            </button>
            {expandedModuleIndex === index && (
              <div className="course-chapters" id={`course-module-${index}`}>
                {targetModule.lessons.map((targetLesson, chapterIndex) => (
                  <button
                    className={lessonIndex === chapterIndex ? "active" : ""}
                    aria-current={moduleIndex === index && lessonIndex === chapterIndex ? "page" : undefined}
                    onClick={() => navigate(lessonUrl(targetModule, targetLesson))}
                    key={targetLesson.title}
                  >
                    <b>{chapterIndex + 1}</b>
                    <span>{targetLesson.title}</span>
                    <small>{lessonIndex === chapterIndex ? "Current" : "Next"}</small>
                  </button>
                ))}
              </div>
            )}
          </section>
        ))}
      </aside>
      <div className="learn-main-column">
        {composer}
        {lesson && module ? (
          <LessonPage
            lesson={lesson}
            chapter={lessonIndex}
            nextLesson={nextLesson ? {
              title: nextLesson.title,
              onClick: () => navigate(lessonUrl(module, nextLesson)),
            } : undefined}
          />
        ) : (
          <WelcomePage onStart={startModule} />
        )}
      </div>
    </main>
  );
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
  return (
    <section className="ask-conversation-view" aria-label="Ask AI conversation" aria-live="polite">
      <header>
        <button type="button" onClick={onBack}><Icons.ArrowLeft size={15} /> Back to Learn</button>
        <button type="button" onClick={() => onModeChange(mode === "split" ? "focus" : "split")}>
          {mode === "split" ? <><Icons.Maximize2 size={14} /> Focus</> : <><Icons.Columns2 size={14} /> Split view</>}
        </button>
      </header>
      <div className="ask-conversation-turns">
        {turns.map((turn) => (
          <section className="ask-conversation-turn" key={turn.id}>
            <div className="ask-conversation-question"><p>{turn.question}</p></div>
            <div className="ask-conversation-answer"><div>
              {turn.loading && !turn.answer && <p className="ask-conversation-working"><i /><i /><i /> Agent is working with your context…</p>}
              {turn.answer && <p>{turn.answer}<span className={turn.loading ? "ask-stream-cursor" : ""} aria-hidden="true" /></p>}
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

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [askQuery, setAskQuery] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askTurns, setAskTurns] = useState<AskTurn[]>([]);
  const [askViewMode, setAskViewMode] = useState<AskViewMode>("split");
  const [selectedAskAppId, setSelectedAskAppId] = useState("");
  const [selectedAskDocs, setSelectedAskDocs] = useState<AskDocsReference[]>([]);
  const [themeSettingsOpen, setThemeSettingsOpen] = useState(false);
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

  useEffect(() => {
    setAskTurns([]);
    setAskLoading(false);
  }, [location.pathname]);

  const submitAsk = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = askQuery.trim();
    if (!question || askLoading) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
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
          appId: selectedAskAppId,
          docs: selectedAskDocs,
          history,
          currentPage: location.pathname,
        }),
      });
      if (!response.ok) {
        const raw = await response.text();
        let data: { error?: string } = {};
        try { data = JSON.parse(raw) as { error?: string }; } catch { data = { error: raw }; }
        throw new Error(
          data.error === "reauth_required"
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
        const applyEvent = (line: string) => {
          if (!line.trim()) return;
          const streamEvent = JSON.parse(line) as { type?: string; text?: string; sources?: AskSource[] };
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
      } else {
        const answer = await response.text();
        setAskTurns((current) => current.map((turn) => turn.id === turnId ? { ...turn, answer } : turn));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ask AI is unavailable right now.";
      setAskTurns((current) => current.map((turn) => turn.id === turnId ? { ...turn, error: message } : turn));
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

  const logo = palette === "neutral"
    ? "/brand-assets/logos/replit-wordmark-dark.svg"
    : theme === "dark"
      ? "/brand-assets/logos/replit-wordmark-on-dark.svg"
      : "/brand-assets/logos/replit-wordmark.svg";

  return (
    <div className="app-shell">
      <header className="main-header">
        <button className="brand" onClick={() => navigate("/learn")} aria-label="Replit Learn home">
          <img className="brand-wordmark" src={logo} alt="Replit" />
        </button>
        <nav className="product-nav" aria-label="Product">
          <a href="https://docs.replit.com">Docs</a>
          <a href="https://docs.replit.com/use-cases">Use Cases</a>
          <button className="selected" onClick={() => navigate("/learn")}>Learn</button>
        </nav>
        <div className="header-actions">
          <button className="appearance-toggle" onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`} title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
            {theme === "light" ? <Icons.Moon size={18} /> : <Icons.Sun size={18} />}
          </button>
          <div className="theme-settings">
            <button className="theme-settings-trigger" onClick={() => setThemeSettingsOpen((open) => !open)} aria-label="Theme settings" aria-expanded={themeSettingsOpen}><Icons.Settings2 size={18} /></button>
            {themeSettingsOpen && (
              <div className="theme-settings-panel">
                <div>
                  <span>Theme</span>
                  <div role="group" aria-label="Color theme">
                    <button className={palette === "replit" ? "selected" : ""} onClick={() => setPalette("replit")}>Replit<i className="theme-swatch theme-swatch-replit" aria-hidden="true" /></button>
                    <button className={palette === "silver" ? "selected" : ""} onClick={() => setPalette("silver")}>Silver<i className="theme-swatch theme-swatch-silver" aria-hidden="true" /></button>
                    <button className={palette === "neutral" ? "selected" : ""} onClick={() => setPalette("neutral")}>Soft Stone<i className="theme-swatch theme-swatch-neutral" aria-hidden="true" /></button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <button className="search" onClick={() => document.querySelector<HTMLTextAreaElement>('[aria-label="Ask Replit Learn"]')?.focus()} aria-label="Ask AI" title="Ask AI"><Icons.Search size={19} /></button>
          <ReplitAccount />
          <a className="open-button" href="https://replit.com" target="_blank" rel="noreferrer">Open Replit <span>→</span></a>
        </div>
      </header>
      <div className="page-stage standalone-learn-stage">
        {askTurns.length > 0 && askViewMode === "focus" ? (
          <section className="learn-ask-focus">
            <AskConversationView turns={askTurns} mode={askViewMode} onModeChange={setAskViewMode} onBack={() => setAskTurns([])} />
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
          <div className={askTurns.length ? "learn-with-ask" : ""}>
            <LearnPage composer={askTurns.length ? undefined : composer} />
            {askTurns.length > 0 && (
              <aside className="ask-chat-blade standalone-ask-blade">
                <AskConversationView turns={askTurns} mode={askViewMode} onModeChange={setAskViewMode} onBack={() => setAskTurns([])} />
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
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Missing Learn application root");

type LearnRoot = ReturnType<typeof createRoot>;
const browserWindow = window as typeof window & { __replitLearnRoot?: LearnRoot };
const learnRoot = browserWindow.__replitLearnRoot ?? createRoot(rootElement);
browserWindow.__replitLearnRoot = learnRoot;

learnRoot.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
