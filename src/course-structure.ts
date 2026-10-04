// Course structure shared by the app, the database catalog sync, and tests. No React here.
import { appFoundationLessons, courseLessons, learnDisplayTitle, type LearnLesson } from "./learn-content";
import { LEARN_DEV_MODE } from "./learn-mode";

export type CourseModule = {
  pillar: CoursePillarId;
  title: string;
  description: string;
  lessons: LearnLesson[];
};

export type CoursePillarId = "discover" | "ai" | "operate" | "design" | "build" | "admin";

export type CoursePillar = {
  id: CoursePillarId;
  title: string;
  description: string;
  modules: CourseModule[];
};

export function learnSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const courseModules: CourseModule[] = [
  {
    pillar: "discover",
    title: "Replit 101",
    description: "See what Replit can do, then try the core outcomes through small, guided exercises.",
    lessons: courseLessons["Replit 101"],
  },
  { pillar: "discover", title: "Your workspace", description: "Understand where your work lives and how to find your way around Replit.", lessons: courseLessons["Your workspace"] },
  { pillar: "discover", title: "The prompt box", description: "Ask for what you need, add context, and explore models and modes.", lessons: courseLessons["The prompt box"] },
  { pillar: "discover", title: "Chats and projects", description: "Understand the difference between chats and projects, including chats inside projects.", lessons: courseLessons["Chats and projects"] },
  { pillar: "discover", title: "Build and Design", description: "Explore building an app and shaping its design on Canvas.", lessons: courseLessons["Build and Design"] },
  { pillar: "discover", title: "Your capstone", description: "Put it all together by building and testing your own picnic sign-up app.", lessons: courseLessons["Your capstone"] },
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

export const pillarDefinitions: Array<Omit<CoursePillar, "modules">> = [
  { id: "discover", title: "Replit 101", description: "See what Replit can do, then try the essentials one friendly step at a time." },
  { id: "ai", title: "AI 101", description: "Understand AI and learn how to guide Agent with clear goals, useful context, and thoughtful checks." },
  { id: "operate", title: "Operate", description: "Turn conversations, connected tools, and agent workflows into useful outcomes." },
  { id: "design", title: "Design", description: "Shape an idea into a clear app experience—even if you do not call yourself a designer." },
  { id: "build", title: "Build", description: "Take an app from the first working version to something secure, published, and ready to grow." },
  { id: "admin", title: "Admin", description: "Help an organization adopt Replit safely, confidently, and at its own pace." },
];

export const coursePillars: CoursePillar[] = pillarDefinitions.map((pillar) => ({
  ...pillar,
  modules: courseModules.filter((module) => module.pillar === pillar.id),
}));

export const lessonUrl = (module: CourseModule, lesson: LearnLesson) =>
  `/learn/${learnSegment(module.title)}/${learnSegment(lesson.title)}`;

// Courses learners can take today. Dev mode only changes browsing, never what is published.
export const PUBLISHED_PILLARS: CoursePillarId[] = ['discover'];
export const isAvailablePillar = (id: CoursePillarId) => LEARN_DEV_MODE || PUBLISHED_PILLARS.includes(id);
export const isAvailableModule = (module: CourseModule) => isAvailablePillar(module.pillar);
export const availableLessonUrls = new Set(courseModules.filter(isAvailableModule)
  .flatMap((module) => module.lessons.map((lesson) => lessonUrl(module, lesson))));

// Permanent lesson ID: the lesson's address after /learn/ (e.g. "replit-101/what-you-can-do-with-replit").
// Titles can change; once published, a lesson keeps this ID so saved progress stays attached.
export const lessonId = (module: CourseModule, lesson: LearnLesson) => lessonUrl(module, lesson).replace(/^\/learn\//, "");

export type LessonUnlock = { id: string; kind: "entry" | "prompt" | "reveal" | "step" | "activity"; label: string; position: number; sectionIndex?: number };

// Unlock buttons inside a lesson, in page order. IDs are permanent: "<lesson id>:entry", ":prompt-<section index>",
// ":reveal-<section index>" (show Replit's example answer after copying), ":step-<section index>" (a step button), ":activity".
export function lessonUnlocks(module: CourseModule, lesson: LearnLesson): LessonUnlock[] {
  const base = lessonId(module, lesson);
  const unlocks: Omit<LessonUnlock, "position">[] = [];
  if (lesson.entryLink) unlocks.push({ id: `${base}:entry`, kind: "entry", label: lesson.entryLabel ?? "Open Replit and start a chat" });
  lesson.sections.forEach((section, sectionIndex) => {
    const gated = (lesson.promptGate || lesson.copyPrompts) && !section.chatPrompt;
    if (gated && section.prompt) unlocks.push({ id: `${base}:prompt-${sectionIndex}`, kind: "prompt", label: "Copy the prompt", sectionIndex });
    if (gated && section.prompt && section.exchange) unlocks.push({ id: `${base}:reveal-${sectionIndex}`, kind: "reveal", label: "Show an example answer", sectionIndex });
    // The example reply's approval card: choosing the approve option and submitting unlocks the rest.
    if (gated && section.prompt && section.approval) {
      const accepted = ([] as string[]).concat(section.approval.approve);
      unlocks.push({ id: `${base}:step-${sectionIndex}`, kind: "step", label: section.approval.kind === "mode" ? `Choose ${accepted.join(" or ")} and continue` : section.approval.kind === "routine" || section.approval.kind === "project" ? `Click ${accepted[0]}` : `Select ${accepted[0]} and click Submit`, sectionIndex });
    }
    // After the card: open the new project (found through the learner's Replit apps) to continue.
    if (gated && section.prompt && section.openProject) unlocks.push({ id: `${base}:project-${sectionIndex}`, kind: "step", label: section.openProject.label, sectionIndex });
    if (section.step) unlocks.push({ id: `${base}:step-${sectionIndex}`, kind: "step", label: section.step.label, sectionIndex });
  });
  if (lesson.activityConfirmation && lesson.module !== "Your capstone" && !lesson.review) unlocks.push({ id: `${base}:activity`, kind: "activity", label: lesson.activityConfirmation });
  return unlocks.map((unlock, position) => ({ ...unlock, position }));
}

export type CatalogRows = {
  courses: Array<{ id: string; title: string; position: number; published: boolean }>;
  modules: Array<{ id: string; courseId: string; title: string; position: number }>;
  unlocks: Array<{ id: string; lessonId: string; kind: string; label: string; position: number }>;
  lessons: Array<{ id: string; moduleId: string; title: string; urlPath: string; position: number; hasQuiz: boolean }>;
};

// Flat rows for the database: confirmed (published) courses only, with their modules and lessons in display order.
export function catalogRows(): CatalogRows {
  const rows: CatalogRows = { courses: [], modules: [], lessons: [], unlocks: [] };
  coursePillars.forEach((pillar, coursePosition) => {
    if (!PUBLISHED_PILLARS.includes(pillar.id)) return;
    rows.courses.push({ id: pillar.id, title: pillar.title, position: coursePosition, published: PUBLISHED_PILLARS.includes(pillar.id) });
    pillar.modules.forEach((module, modulePosition) => {
      const moduleId = learnSegment(module.title);
      rows.modules.push({ id: moduleId, courseId: pillar.id, title: module.title, position: modulePosition });
      module.lessons.forEach((lesson, pagePosition) => {
        lessonUnlocks(module, lesson).forEach((unlock) => rows.unlocks.push({ id: unlock.id, lessonId: lessonId(module, lesson), kind: unlock.kind, label: unlock.label, position: unlock.position }));
        rows.lessons.push({ id: lessonId(module, lesson), moduleId, title: lesson.navigationTitle ?? learnDisplayTitle(lesson.title), urlPath: lessonUrl(module, lesson), position: pagePosition, hasQuiz: lesson.quiz.length > 0 });
      });
    });
  });
  return rows;
}
