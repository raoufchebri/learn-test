import { recipeFoundationLessons } from './app-foundation-content';
import { discoverLessons } from './discover-content';

export type QuizQuestion = {
  prompt: string;
  choices: string[];
  answer: number;
  feedback?: string;
};

const learnTitleTerms: Record<string, string> = {
  agent: 'Agent',
  ai: 'AI',
  api: 'API',
  apis: 'APIs',
  css: 'CSS',
  figma: 'Figma',
  github: 'GitHub',
  html: 'HTML',
  javascript: 'JavaScript',
  llm: 'LLM',
  llms: 'LLMs',
  mcp: 'MCP',
  memory: 'Memory',
  nexus: 'Nexus',
  replit: 'Replit',
  reps: 'Reps',
  routine: 'Routine',
  routines: 'Routines',
  seo: 'SEO',
  ui: 'UI',
  vm: 'VM',
  vms: 'VMs',
  workspace: 'Workspace',
  workspaces: 'Workspaces',
};

export function learnDisplayTitle(value: string) {
  const courseLabels: Record<string, string> = {
    'Replit 101': 'Discover Replit',
    'What You Can Do with Replit': 'Welcome to Replit',
    'From Conversation to Outcome': 'Start with a conversation',
    'Build and Publish a Simple App': 'Build your first app',
    'Create a Design and Image': 'Explore design and create an image',
  };
  if (courseLabels[value]) return courseLabels[value];
  // Build is the course name in its welcome page, not the verb.
  if (value === 'Welcome to Build') return value;
  let wordIndex = 0;
  return value.replace(/[A-Za-z][A-Za-z0-9’'-]*/g, (word) => {
    const brandedTerm = learnTitleTerms[word.toLowerCase()];
    const formatted = brandedTerm ?? (wordIndex === 0
      ? `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`
      : word.toLowerCase());
    wordIndex += 1;
    return formatted;
  });
}

export type LearnLesson = {
  module: string;
  title: string;
  duration: string;
  video: string;
  summary: string;
  openingImage?: { src: string; alt: string };
  entryLink?: string;
  promptGate?: boolean;
  introduction?: Array<string | { text: string; items: string[] }>;
  encouragement?: string;
  activity?: 'recipe-build';
  projectTask?: { id: string; label: string; prompt: string };
  testingUnlocked?: boolean;
  practice?: { prompt: string; checks: string[] };
  checkpoint?: { afterSection: number; questions: QuizQuestion[] };
  outcomes?: string[];
  sections: Array<{ heading: string; id?: string; body: string; prompt?: string; afterPrompt?: string; items?: string[]; image?: { src: string; alt: string; caption: string; source: string }; diagram?: 'recipe-architecture' | 'recipe-iteration' }>;
  replitExample: string;
  quiz: QuizQuestion[];
};

export const appFoundationLessons: LearnLesson[] = [
  {
    module: 'App Foundations', title: 'Welcome to Build', duration: '3 min', video: 'Your path from idea to app',
    summary: 'Maybe you’ve been dreaming of an app of your own: a personal project, a business idea, or something useful to share with friends and family. Perhaps you’ve even started, but finding the time to bring all the pieces together has been the tricky part.',
    introduction: [
      'Replit helps you turn that idea into an app using natural language. Describe what you want in your own words, then use Replit to bring it to life. You can build, test, and publish in one place. You bring the direction, try the result, and decide what to improve.',
      'You don’t need to master the underlying infrastructure, the systems that keep an app running, before you begin. This course introduces the building blocks one at a time, then helps you put them to work in an app you can share.',
      'Build is about more than getting your first app on the screen. It’s a path toward becoming a power builder: someone who understands how an app’s building blocks work together and can use that understanding to make better decisions. You’ll practice describing what you need, testing what Replit creates, and improving your app step by step. That understanding helps you tackle more ambitious ideas with confidence.',
      'Already a developer? Some of these concepts will be familiar. Feel free to skim the basics and focus on how the pieces fit together in Replit, and how Replit can support your existing workflow.',
    ],
    outcomes: [
      'Describe what the Build course will help you practice',
      'Explain your role when building with Replit',
      'Choose a small app idea to explore as you learn',
    ],
    sections: [
      { heading: 'What you’ll learn', body: 'Build takes you from understanding an app to creating, sharing, and improving one. The course follows four connected parts:', items: ['App foundations: get to know interfaces, code, data, access, and the connections that make an app work.', 'Build with Replit: describe what you need, make changes, test the result, and publish a working version.', 'Secure and monitor: protect your app and understand what happens when people use it.', 'Grow and scale: learn from feedback, help people find your app, and prepare it for more activity.'] },
      { heading: 'Start with something small enough to try', body: 'Your idea doesn’t need to be a business or a big launch. A family recipe collection, a booking tool, or a small improvement to an existing app is a useful starting point. Choose one thing you want someone to be able to do. You can add more once that first piece works.' },
      { heading: 'Build your understanding as you go', body: 'Read an explanation, try a small change, and look at what happened. You can ask Replit to explain unfamiliar code or an error in plain language. You don’t have to write every line yourself, but you’ll learn enough to ask better questions and check the result. If something doesn’t work the first time, that gives you something specific to investigate.' },
      { heading: 'Make the course fit your starting point', body: 'New to building apps? Follow the lessons in order and take your time with App foundations. Already comfortable with software development? Skim familiar concepts and spend more time on the Replit workflows that are new to you. Discover Replit is available for broader orientation, but you don’t need to finish it before starting Build.' },
      { heading: 'Your first step', body: 'Write down who your app could help and one thing it could help them do. You can change your mind later. This is a starting point, not a commitment. Next, “What is an app?” connects familiar everyday apps to the building blocks you’ll use.' },
    ],
    replitExample: 'When you’re ready to explore your idea, you could ask Replit: “I want to build a simple app for [someone] to [do something]. Help me plan a small first version, and explain any unfamiliar terms.” Review the plan before asking Replit to build it.',
    quiz: [
      { prompt: 'What does the Build course cover?', choices: ['Creating, testing, publishing, and improving an app', 'Only the visual appearance of an app', 'Only the code before it is published'], answer: 0 },
      { prompt: 'What is your role when building with Replit?', choices: ['Accept every change without trying it', 'Provide direction, try the result, and guide improvements', 'Set up every service before asking for help'], answer: 1 },
      { prompt: 'How can an experienced developer use this course?', choices: ['Complete Discover Replit before starting', 'Repeat every familiar concept before continuing', 'Skim familiar concepts and focus on new Replit workflows'], answer: 2 },
    ],
  },
  {
    module: 'App Foundations', title: 'What Is an App?', duration: '5 min', video: 'How an app works',
    activity: 'recipe-build',
    summary: 'You probably use apps every day to message friends, check the weather, or book something in your browser. But what makes something an app? At its simplest, an app is software that helps someone do something.',
    introduction: ['In this lesson, you’ll build a personal recipe app with Replit. You’ll add, edit, and find recipes, then explore the building blocks that make it work.'],
    outcomes: [
      'Explain what an app is',
      'Recognize the different building blocks of an app',
      'Build your first app on Replit',
    ],
    sections: [
      { heading: 'Apps can live on your phone or in your browser', body: 'Think of Spotify for music, WhatsApp for messages, or Google Calendar for planning your week. Each helps you do something different. App is short for application. Some apps are installed on a phone or computer. Others open through a link in a browser, and many offer both options.', image: { src: '/images/spotify-browser-mobile.png', alt: 'Illustration of Spotify showing the same Everyday favorites playlist in a laptop browser and a mobile app.', caption: 'One app, different screens. AI-generated illustration of Spotify, not a product screenshot.', source: '/images/spotify-browser-mobile.png' } },
      { heading: 'Let’s build your first app', id: 'your-app-can-start-with-something-familiar', body: 'Let’s build a little recipe book just for you. You’ll be able to add your favorite recipes, edit the ingredients, and find something to cook. Start simple: no accounts or sharing yet, just a useful app of your own. With Replit, you can describe what you want in plain English or another language you speak. That’s what natural language means: your own words, rather than code. Here’s the request you’ll use:', prompt: 'Create a personal recipe app where I can add, edit, and find my favorite recipes. Include a recipe name, ingredients, and instructions. Keep it simple and save my recipes in this browser. No sign-in needed.', afterPrompt: 'That description is called a prompt. Replit uses it to create the code that makes your app work. You can try the result and ask for changes as you go. Let’s look at what happens behind the scenes.' },
      { heading: 'What did Replit make?', id: 'a-few-building-blocks-make-it-work', body: 'Your prompt describes an experience. Behind the scenes, Replit creates the interface, the logic that responds to your actions, and a way to remember your recipes. For this first version, those pieces can all run in your browser. The frontend is the part you see and interact with. Its user interface, or UI, includes the recipe list, form, and buttons.', items: ['The interface turns “add, edit, and find” into controls you can use, such as a recipe form, an Edit button, and a search field.', 'The app’s logic responds to those controls. When you select Save, it can check that you entered a title, then add the recipe or update an existing one.', 'Browser storage remembers the recipes in this browser on this device, even after you close the page. Clearing that storage can erase them, and they won’t automatically appear on another device.'] },
    ],
    replitExample: 'Try the recipe prompt above in Replit. In Preview, add a recipe, edit an ingredient, and search for it by name. Refresh the page to check that it is still there in the same browser. If something doesn’t work as expected, describe what you tried and what happened to Replit. Each small check helps you turn your idea into an app you can rely on.',
    quiz: [
      { prompt: 'Which description best explains what an app is?', choices: ['A database that stores information', 'Software that helps someone carry out a task', 'A program that must be installed on a phone'], answer: 1 },
      { prompt: 'In the recipe app, which part shows the recipe form and Save button?', choices: ['The backend', 'The database', 'The frontend and user interface'], answer: 2 },
      { prompt: 'When you select Save, what checks the recipe title and adds the recipe to your collection?', choices: ['The app’s logic', 'The color of the Save button', 'The recipe name itself'], answer: 0 },
    ],
  },
  ...recipeFoundationLessons,
];

type LessonBrief = { title: string; concept: string; replit: string; check: string };

const moduleGuidance: Record<string, { purpose: string; fit: string; tryIt: string }> = {
  'Replit 101': {
    purpose: 'It gives you a map of Replit, then turns that map into practical experience. You will see the possible outcomes and try each one without needing to master everything first.',
    fit: 'A conversation is often the front door, but it is not a mandatory sequence. From there, you can continue exploring, create a Routine or Rep, begin a design, or build software depending on the outcome you need.',
    tryIt: 'Choose one real theme—such as planning an event or launching a small service—and reuse it as you explore answers, recurring work, persistent agent loops, designs, slides, and apps.',
  },
  'Work with Agent': {
    purpose: 'It gives you a reusable way to collaborate with Agent across every Replit path. You provide direction and judgment; Agent helps investigate, create, and move the work forward.',
    fit: 'Good Agent work connects a clear outcome to relevant context, sensible constraints, an appropriate mode, and observable checks. The same loop applies to research, automation, design, and software.',
    tryIt: 'Write a small goal using four parts: the outcome, useful context, important constraints, and evidence that would show the result works. Then decide where you want to review Agent’s progress.',
  },
  'AI Foundations': {
    purpose: 'It helps you design AI features with intent instead of treating a model like magic. The aim is a useful, bounded experience that people can understand and trust.',
    fit: 'In a real product, an AI model sits behind a clear interface and a thoughtful workflow. People provide information, the model helps with a defined task, and your app makes the result easy to review or use.',
    tryIt: 'Choose one work task you know well—summarising feedback, drafting a reply, or sorting requests. Describe the input, the helpful output, and one example that would show the result is not good enough yet.',
  },
  'Agent Foundations': {
    purpose: 'It helps you collaborate with an AI system that can take several steps toward an outcome. You stay responsible for the goal and the meaningful tradeoffs; the agent helps move the work forward.',
    fit: 'An agent belongs in a loop with people, project context, and defined tools. It observes, proposes or acts, reports what happened, and gives you a useful place to steer the next step.',
    tryIt: 'Pick a task with a clear finish line, such as improving one screen or investigating one bug. Write the desired outcome, the boundaries the agent should respect, and the point where you want to review its work.',
  },
  'Protect and Share': {
    purpose: 'It introduces the trust decisions that belong in every Replit workflow. You learn to protect sensitive information, choose appropriate access, inspect security signals, and verify an outcome before other people depend on it.',
    fit: 'These habits appear where they matter instead of becoming a separate security course. Build covers application security in depth, while Admin covers organization-wide policy and response.',
    tryIt: 'Before sharing one outcome, identify any sensitive information, decide who should access it, run the available checks, and record the evidence that makes you comfortable sharing it.',
  },
  'Learn and Grow': {
    purpose: 'It helps you treat delivery as the start of a learning loop. Feedback, usage signals, discoverability, performance, and capacity all help you decide what should improve next.',
    fit: 'Discover introduces the questions and signals. Build later covers SEO, monitoring, performance, publishing options, and scaling controls in depth.',
    tryIt: 'Choose one outcome you shared. Name one signal for successful use, one source of feedback, and one technical signal that would tell you the experience needs attention.',
  },
  'Operate with Replit': {
    purpose: 'It helps you use Agent for ongoing work beyond a single app build. You learn how to provide context, connect approved tools, choose the right kind of agent workflow, and review what happens.',
    fit: 'Conversations support exploration and direct work. Integrations bring in relevant context. Routines repeat work on a schedule, while Reps and Nexus support longer-running or coordinated work toward a goal.',
    tryIt: 'Pick a recurring or multi-step task. Identify the context it needs, the systems it may connect to, how often it should run, and the evidence you would review before trusting the result.',
  },
  'Design with Agent': {
    purpose: 'It helps you turn a fuzzy idea into an experience people can use. Agent gives you momentum, while your job is to keep the focus on the person, their task, and the feeling of progress.',
    fit: 'Design comes before and alongside implementation. A clear direction informs the interface, content, states, and interactions that later connect to real logic and data.',
    tryIt: 'Choose one moment in an app. Name the person using it, the action they need to take, and what success should look like on the screen. That is a strong starting brief for a first variation.',
  },
  'Build with Agent': {
    purpose: 'It helps you turn a product decision into a bounded change you can inspect. The fastest path is not asking for everything at once; it is making the next useful slice real and learning from it.',
    fit: 'Building connects design, code, data, and testing. Agent can work across those pieces, but a good workflow keeps the scope, success criteria, preview, and review point visible.',
    tryIt: 'Take one small product idea and write a one-sentence success condition. Then list the smallest interface change, behaviour change, and check that would prove the feature is working.',
  },
  'Secure and Monitor': {
    purpose: 'It helps you care for an app after the exciting first build. Security protects people and their information; monitoring gives you the evidence to respond calmly when real life is messier than a demo.',
    fit: 'These practices cross every part of an app: identity, inputs, data, services, and deployments. They are not a final checklist—they are habits that make change and growth safer.',
    tryIt: 'Pick one valuable thing in an app, such as a customer record or a payment action. Ask who should access it, what could go wrong, and what signal would tell you early that something needs attention.',
  },
  'Grow and Scale': {
    purpose: 'It helps you reach more of the right people without losing the experience that made the app useful in the first place. Growth and technical scale both start with a clear measure of value.',
    fit: 'As an app reaches more people, product learning, performance, capacity, and support become connected. The goal is not growth for its own sake; it is a reliable path from discovery to a successful outcome.',
    tryIt: 'Name the first useful action a new person should complete. Then choose one signal for discovery, one for successful use, and one for reliability. Those are the beginnings of a practical growth view.',
  },
  'Administer Replit': {
    purpose: 'It helps an enterprise administrator enable Replit safely and successfully across an organization. The focus is organization-level configuration, policy, visibility, and rollout rather than building an individual app.',
    fit: 'Administration connects identity, access, publishing policy, shared capabilities, security findings, audit evidence, usage, spend, and ongoing adoption across an enterprise Workspace.',
    tryIt: 'Imagine a small pilot group joining an enterprise Workspace. List the access, publishing, security, support, and monitoring decisions you would make before expanding the rollout.',
  },
};

const moduleReassurance: Record<string, string> = {
  'Replit 101': 'You do not need to choose the perfect path or master everything today. Keep each outcome small, follow your curiosity, and notice what becomes easier after one real attempt.',
  'Work with Agent': 'Working with Agent is a conversation, not a test of who can write the cleverest prompt. Clear direction, useful context, and honest feedback will take you far.',
  'AI Foundations': 'AI can sound mysterious from the outside. You only need one idea at a time here, and every idea connects to something practical you can inspect.',
  'Agent Foundations': 'You are still in charge. Agent can take many steps, but you decide the goal, the boundaries, and when the result is ready.',
  'App Foundations': 'New to software? You are exactly where you should be. You only need a useful map of the parts—not years of coding experience—to follow along.',
  'Protect and Share': 'Security is not about becoming suspicious of everything. A few calm habits help you protect what matters and share your work with confidence.',
  'Learn and Grow': 'A first version does not need to be perfect. Real feedback turns a finished-looking result into the beginning of a useful learning loop.',
  'Operate with Replit': 'Start with one task you already understand. Once that task works well, you can make it repeatable, connected, and increasingly independent.',
  'Design with Agent': 'You do not need to call yourself a designer to make thoughtful design choices. Focus on the person, the task, and the next clear step.',
  'Build with Agent': 'You do not need to hold the entire app in your head. Build one visible slice, check it, and use what you learn to choose the next slice.',
  'Secure and Monitor': 'These topics can feel serious because they are. The good news is that a small, repeatable checklist is much more useful than trying to anticipate everything.',
  'Grow and Scale': 'Growth is not a race to make every number larger. Begin by protecting the useful experience that made someone care about your app.',
  'Administer Replit': 'Enterprise administration carries real responsibility, but you do not have to solve every scenario from memory. Use policy, evidence, and repeatable workflows to make sound decisions.',
};

const chapterDepth: Record<string, string> = {
  'AI Foundations/What Is AI?': 'AI is useful when the task has patterns to recognise, language to work with, or options to explore. It is less useful when a decision needs a guaranteed factual answer without any way to check it. Treat it as a capable collaborator: give it a bounded job, inspect the result, and decide what happens next.',
  'AI Foundations/Models & LLMs': 'A model is the engine, not the whole product. An LLM can draft, explain, classify, and transform language, but your experience still needs an input, a useful output format, and a way for a person to review the result. A great model in a confusing workflow is still a confusing product.',
  'AI Foundations/Inputs & Outputs': 'The quality of an AI feature is shaped by the hand-off. A support assistant might receive a customer question and a short account summary, then return a suggested answer with a confidence note. Defining those edges early makes it easier to protect privacy, test the feature, and explain what it does.',
  'AI Foundations/Prompting': 'A prompt is product design written in words. Instead of asking for “a good answer,” tell the model who it is helping, what it should produce, what to avoid, and how the result should be formatted. Then test the prompt with a few realistic examples—not just the friendliest one.',
  'AI Foundations/Context & Memory': 'Context is the temporary working set for the current request. Memory is information you decide to retain or retrieve later. A project brief may belong in context; a person’s stated preference may be remembered with permission. More information is not always better: select what is relevant and current.',
  'AI Foundations/Choosing a Model': 'Start from the job, then compare a small number of models using examples that resemble real use. A faster, lower-cost model may be perfect for sorting feedback; a more capable model may be worth the wait for a complex planning task. There is no universal “best” model—only a fit for the outcome.',
  'AI Foundations/Evaluating AI': 'An evaluation set is a small collection of examples with an expected standard. Include ordinary cases, tricky cases, and examples where the correct response is to ask for more information. Run the same set whenever you change a model, prompt, or context strategy so improvements are based on evidence.',
  'Agent Foundations/What Is an Agent?': 'An agent is helpful when the work has several connected steps: inspect the situation, decide what to do, use a tool, and check the result. For example, improving an app screen can involve reading the existing project, proposing a plan, changing code, and opening a preview. The goal gives the sequence a direction.',
  'Agent Foundations/Agents vs. LLMs': 'Think of an LLM as the reasoning and language component inside a larger agent workflow. A single response can be useful, but it cannot by itself inspect your project or make a change. An agent combines model output with context, tools, and a feedback loop so it can make progress across steps.',
  'Agent Foundations/Goals, Plans & Actions': 'A goal says where you are trying to go; a plan makes the route visible. Good plans create small checkpoints where you can say “yes, continue,” “try a different approach,” or “stop here.” This is especially useful when an agent is working in a project with existing code or important constraints.',
  'Agent Foundations/Context & Memory': 'Give an agent enough context to make a good local decision, not a giant history it must untangle. A short product requirement, a definition of done, and relevant files are often more helpful than every past conversation. Refresh context when the project or the goal changes.',
  'Agent Foundations/Sandboxes': 'A sandbox makes experimentation safer by limiting where a task can run and what it can reach. It is like giving someone a workshop instead of the whole building. They can test an idea, inspect the result, and make controlled changes without assuming access to unrelated systems or sensitive information.',
  'Agent Foundations/Tool Calls': 'Tool calls are the bridge between an agent’s reasoning and useful work. Reading a file, running a test, or looking up a record are all defined actions with observable results. Good tools have clear inputs, clear permissions, and useful error messages so a person can understand what happened.',
  'Agent Foundations/MCP, Connectors & Skills': 'These are ways to give an agent specialised, approved capabilities. A connector might let it work with another service; a skill might teach a repeatable workflow; MCP can provide a shared protocol for exposing tools. The key question is always the same: what should this capability be allowed to do, and why?',
  'Agent Foundations/Human-in-the-Loop': 'People should stay close to the decisions that matter: goals, access, quality, tradeoffs, and actions that affect others. Being in the loop does not mean doing every keystroke. It means designing moments to review, approve, redirect, or stop the work before a small mistake becomes a larger one.',
  'Design with Agent/Start with an Idea': 'Before asking for a screen, write a tiny product story: “A new manager needs to see which tasks are blocked so they can decide what to unblock first.” That sentence contains an audience, a moment, and an outcome. It gives design work something more useful to optimise for than decoration.',
  'Design with Agent/Design with a Prompt': 'A design prompt works best as a brief, not a wish. Include the person using the experience, their main job, the information they need, and a visual direction. You can also name constraints such as “calm,” “mobile-first,” or “make the next step obvious.” Review the result as a hypothesis, not a verdict.',
  'Design with Agent/Explore Variations': 'Variations let you compare decisions such as a guided flow versus a dashboard, or a compact interface versus a more explanatory one. Keep the underlying task constant while you compare. The best direction is usually the one that makes the important action and its outcome easiest to understand.',
  'Design with Agent/Refine the Experience': 'Refinement happens in the details people feel: a clear label, a reassuring loading state, useful empty-state guidance, and a gentle explanation when something fails. Instead of changing everything at once, choose one friction point, make a focused improvement, and check whether the path feels simpler.',
  'Design with Agent/Design Systems': 'A design system records decisions that should not need to be reinvented on every screen: spacing, typography, colours, components, interaction patterns, and tone. It gives a growing team and an agent shared rules to follow. Consistency matters because people learn how a product behaves as they use it.',
  'Design with Agent/From Design to App': 'A visual mockup shows an ideal moment; an app must also handle loading, missing data, permissions, and changed information. Moving from design to app means preserving the intended hierarchy while connecting every control to real behaviour. Review the happy path and at least one imperfect path together.',
  'Build with Agent/Prototype with Agent': 'A prototype answers “is this worth building further?” It should make the main loop tangible: someone starts with a need, takes an action, and receives a useful outcome. Keep the scope narrow enough that you can react to the experience rather than getting lost in edge cases too early.',
  'Build with Agent/Plan a Feature': 'A good feature plan names the outcome, the affected area, the boundaries, and how you will test success. For example: “Let a person rename a project from its settings page, persist the new name, and show confirmation.” That is much easier to build and review than “improve project settings.”',
  'Build with Agent/Build in the Background': 'Background work is most effective when the task includes a clear deliverable and review point. You might ask an agent to investigate a bug, prepare a small change, and report the files it touched. When you return, you have something concrete to inspect instead of an invisible process to trust blindly.',
  'Build with Agent/Parallel Agents': 'Parallel work helps when tasks are genuinely independent—for example, researching an integration while another task improves a screen. Give each task an owner, a boundary, and a clear output. If two agents edit the same area without coordination, speed can quickly become confusion.',
  'Build with Agent/Preview & Test': 'A preview is where plans meet reality. Walk through the main task as if you had never seen the project before. Then try a missing value, a slow response, or an unexpected input. These small checks often reveal more than a long conversation about what the feature was supposed to do.',
  'Build with Agent/Review & Iterate': 'Review is a conversation with the work. Compare it to the original outcome, inspect important changes, and ask what evidence supports the choice. If something is close but not right, give a focused piece of feedback. Small, deliberate iterations are usually more reliable than a full restart.',
  'Build with Agent/Publish Your App': 'Publishing changes the context: people outside the project can now rely on the result. Before you share it, test the core path, check the words and information that are visible, and make sure the app gives useful feedback when something is unavailable. Treat the first release as the start of learning, not the finish line.',
  'Secure and Monitor/Security Basics': 'Security starts with a simple inventory: what information does the app hold, who should be able to use it, and which actions could cause harm if they go wrong? This helps you make proportional choices. A small private notes app and a payment product have different risks, but both need intentional boundaries.',
  'Secure and Monitor/Secrets & Environment Variables': 'An API key is like a key to another system. If it appears in code sent to the browser or committed to a repository, it can be copied and misused. Store it in a protected environment instead, then let server-side logic use it only where needed. Rotate a secret if you think it was exposed.',
  'Secure and Monitor/Authentication & Permissions': 'Authentication answers “who is this?” Permissions answer “what can they do?” A good access rule is specific and testable: an owner can edit their own project; a viewer can only read a shared project. Test with more than one account so you do not accidentally check permissions only from the most powerful view.',
  'Secure and Monitor/Input & Data Safety': 'Inputs can arrive from forms, files, integrations, URLs, or AI responses. Check their shape and size before acting on them, and decide how to handle missing or surprising values. This is not about distrusting people—it is about giving the system a safe, understandable way to handle the unexpected.',
  'Secure and Monitor/Security Review with Agent': 'Agent can help review a change by looking for places where data, permissions, or secrets might be handled carelessly. Use that as a prompt for investigation, not a blanket approval. The strongest review combines an automated scan, a clear understanding of the product flow, and a human decision about what is acceptable.',
  'Secure and Monitor/Monitoring Basics': 'Monitoring gives you a view of the app after it leaves your laptop. Choose a few signals tied to the experience: are requests succeeding, are important actions completing, are people waiting too long? Start with the things that would make a person say “the app is not working.”',
  'Secure and Monitor/Logs, Errors & Performance': 'When someone reports a problem, logs provide a timeline, errors point to failed paths, and performance measurements reveal delays. Together they help you move from “something feels broken” to a specific question you can investigate. Avoid recording sensitive information in logs just to make debugging easier.',
  'Secure and Monitor/Alerts & Incident Response': 'An alert should notify you about a change that merits attention, not every tiny fluctuation. When an incident occurs, stabilise the experience first, understand who is affected, communicate clearly, and record what you learn. A calm checklist reduces panic and makes future responses faster.',
  'Grow and Scale/Growth Fundamentals': 'Growth is a product question before it is a marketing or infrastructure question. If people do not understand the value or return after trying the app, more traffic will not solve the underlying problem. Start by listening to a focused audience and learning which outcome makes them come back.',
  'Grow and Scale/Discoverability & SEO': 'Search works best when a page clearly explains what it offers and why it is useful. Helpful headings, descriptive titles, readable content, and a fast experience serve people first and search engines second. Do not chase keywords that attract people who will not benefit from the product.',
  'Grow and Scale/User Acquisition': 'Acquisition is an invitation, not a number. Choose a specific group of people, understand where they already look for help, and offer a first experience that delivers on the promise you made. A small channel with a good fit can teach you more than a broad campaign with vague attention.',
  'Grow and Scale/Performance': 'Performance is part of product quality. A slow page makes people hesitate; a delayed response can make them repeat an action and create confusion. Measure a meaningful journey, identify the biggest wait, and improve it before optimising details no one notices.',
  'Grow and Scale/Autoscaling': 'Demand is rarely flat. Autoscaling helps a service respond when a lot of people arrive at once, then use fewer resources when activity drops. It works best alongside sensible limits, monitoring, and a clear understanding of which workflows need to stay responsive during a spike.',
  'Grow and Scale/Reserved VMs': 'Some workloads need a dependable baseline of compute, even when traffic is not dramatic. Reserved capacity can make sense when predictable performance is more valuable than flexible bursts alone. Use real measurements to decide—buying capacity before you understand the workload can be expensive and unnecessary.',
  'Grow and Scale/Capacity Planning': 'Capacity planning is a habit of asking “what happens if this becomes ten times more popular?” Look at traffic patterns, heavy workflows, and resource limits before a big launch. Test assumptions when you can, then make a plan for what you will watch and how you will respond.',
  'Grow and Scale/Serving More Users': 'Serving more users means scaling understanding as well as systems. Support requests reveal confusing parts of the product; usage data reveals the paths people value; monitoring reveals strain. Keep the loop tight: learn from real behaviour, improve the experience, and strengthen the parts carrying the most responsibility.',
};

function guidedLesson(module: string, brief: LessonBrief): LearnLesson {
  const guidance = moduleGuidance[module];
  const depth = chapterDepth[`${module}/${brief.title}`] ?? brief.concept;
  const answerOffset = Array.from(brief.title).reduce((total, character) => total + character.charCodeAt(0), 0) % 3;
  const withAnswer = (correct: string, distractors: [string, string], answer: number): [string, string, string] => {
    const choices = [...distractors];
    choices.splice(answer, 0, correct);
    return choices as [string, string, string];
  };
  return {
    module,
    title: brief.title,
    duration: '5 min',
    video: brief.title,
    summary: brief.concept,
    encouragement: moduleReassurance[module],
    outcomes: [
      `Explain “${learnDisplayTitle(brief.title)}” in plain language`,
      brief.check,
      'Apply the idea to one small, observable Replit outcome',
    ],
    sections: [
      { heading: 'Start with the big idea', body: depth },
      { heading: 'Why this is worth learning', body: `${brief.check} is the practical reason to learn this. ${guidance.purpose} You are not here to memorize a term. You are learning when the idea can make an outcome clearer, safer, or more useful.` },
      { heading: 'Keep the first attempt manageable', body: `Use ${brief.title} to improve one part of a real workflow. Name the need, describe a helpful result, and keep the first attempt small enough to inspect. A focused attempt gives you something concrete to celebrate, question, and improve.` },
      { heading: 'See where it fits', body: guidance.fit },
      { heading: 'Notice the handoff', body: 'Pay attention to what you provide, what the app or Agent does next, and what comes back. Useful feedback should tell you whether the result is ready, incomplete, or needs another pass. These handoffs turn an abstract idea into an experience you can understand and guide.' },
      { heading: 'Try a small version', body: guidance.tryIt },
    ],
    replitExample: brief.replit,
    quiz: [
      { prompt: `What is the main purpose of ${learnDisplayTitle(brief.title)}?`, choices: withAnswer(brief.check, ['To remove the need for human judgment', 'To replace every other part of the experience'], answerOffset), answer: answerOffset },
      { prompt: 'What is the most useful way to begin?', choices: withAnswer('Start with a small outcome you can inspect', ['Add every possible feature before reviewing anything', 'Wait until you understand every technical detail'], (answerOffset + 1) % 3), answer: (answerOffset + 1) % 3 },
      { prompt: 'Which question helps you decide whether the result is ready?', choices: withAnswer('What evidence shows that it meets the goal?', ['Does it use the most complicated approach?', 'Did Agent finish without asking any questions?'], (answerOffset + 2) % 3), answer: (answerOffset + 2) % 3 },
    ],
  };
}

const courseBriefs: Record<string, LessonBrief[]> = {
  'Replit 101': [
    { title: 'What You Can Do with Replit', concept: 'Replit is a place to explore questions, direct agents, automate recurring work, create designs and slides, and build software. This overview shows the landscape before you choose a deeper path.', replit: 'Begin with a goal rather than a feature. Replit can help you research it in a Conversation, automate it with a Routine or Rep, explore it visually in Design, or turn it into working software.', check: 'Recognizing the range of outcomes Replit can help create' },
    { title: 'From Conversation to Outcome', concept: 'A conversation is often the starting point in Replit, but the next step branches according to your goal. You might keep exploring, schedule recurring work, start a persistent agent loop, create a design, or build an app.', replit: 'Use the prompt box to describe an outcome, add useful context, and choose the path that matches the work. The paths are options—not steps everyone must follow in the same order.', check: 'Choosing an appropriate path from a conversation to an outcome' },
    { title: 'Research with a Conversation', concept: 'A Conversation can combine questions, connected context, and source-backed exploration without requiring you to create an app. The useful outcome is a finding you can inspect and use.', replit: 'Research a real question with one connected source. Review the cited material, separate evidence from interpretation, and summarize the useful conclusion.', check: 'Producing and verifying a useful research outcome' },
    { title: 'Create a Routine', concept: 'A Routine schedules repeatable agent work. Foundations covers the full lifecycle: create, schedule, run, inspect, edit, pause, and disable.', replit: 'Create a small Routine tied to a real need, run it once, inspect the result, change one part, then pause or disable it.', check: 'Managing a Routine through its complete lifecycle' },
    { title: 'Supervise a Rep', concept: 'A Rep works continuously toward a defined goal instead of responding once or running only on a fixed schedule. Good supervision keeps the goal, boundaries, progress, and stopping conditions visible.', replit: 'Give a Rep a bounded goal, define the progress evidence you expect, inspect one cycle, and decide whether to continue, redirect, or stop it.', check: 'Supervising a persistent Agent loop toward a bounded goal' },
    { title: 'Create a Design and Image', concept: 'Replit can help you explore an app interface and create supporting visual assets. At foundations depth, the goal is to make a coherent first direction and refine it intentionally.', replit: 'Create one app screen, compare a variation, refine the preferred direction, and generate one image that supports the experience.', check: 'Creating and refining a coherent visual outcome' },
    { title: 'Create Slides', concept: 'A slide deck turns a message into a clear sequence. Agent can help structure the story, create the first version, and refine individual slides while you remain responsible for the argument and audience.', replit: 'Create a short deck with a clear audience and purpose. Review the sequence, evidence, and visual consistency before sharing it.', check: 'Turning a clear message into a reviewable slide deck' },
    { title: 'Build and Publish a Simple App', concept: 'A small app brings interface, behavior, data, and publishing together. Foundations requires a useful end-to-end outcome without requiring you to write code manually or troubleshoot every underlying system.', replit: 'Describe one useful workflow, guide Agent through a small build, preview the main path, add basic data or authentication when appropriate, then publish and test the result.', check: 'Creating and verifying a small published app end to end' },
  ],
  'Work with Agent': [
    { title: 'Direct Agent Effectively', concept: 'Effective Agent work follows a reusable loop: define the outcome, provide relevant context, add constraints, inspect what happens, and refine the next step. This is more durable than memorizing prompt tricks.', replit: 'Describe a small outcome to Agent, include what it should preserve, and state how you will check the result. Review the work and give one focused piece of feedback.', check: 'Using an outcome, context, constraints, inspection, and refinement loop' },
    { title: 'Context and Connections', concept: 'Agent works better when it can reach the right context. Project files, integrations, Memory, Skills, and MCP provide different ways to supply information or approved capabilities.', replit: 'Connect an existing tool when possible, select only the context relevant to the task, and confirm what the connection makes available before relying on the result.', check: 'Providing useful context through an appropriate source or capability' },
    { title: 'Choose a Working Mode', concept: 'Different tasks need different balances of capability, speed, cost, and control. Choose a working mode based on the outcome and risk rather than treating the most powerful option as the automatic choice.', replit: 'Compare a quick exploratory request with a longer multi-step task. Choose an appropriate mode for each and explain the tradeoff.', check: 'Matching Agent capability, speed, cost, and control to the task' },
  ],
  'AI Foundations': [
    { title: 'What Is AI?', concept: 'AI is a broad term for systems that perform tasks associated with perception, language, prediction, or decision-making. In this course, you will focus on AI that works with language and helps people create, analyze, and act.', replit: 'Use Agent in Replit as a practical example: you describe an outcome in language, then collaborate with an AI system that can explore and change a project.', check: 'Understanding what AI can and cannot help with' },
    { title: 'Models & LLMs', concept: 'A model is a trained system that turns inputs into outputs. A large language model, or LLM, is trained to understand and generate language, which makes it useful for conversation, writing, analysis, and code.', replit: 'When you choose an AI capability for a Replit project, the model is the engine behind the experience. Choose based on the task, quality, speed, and cost.', check: 'Choosing an engine that fits a language task' },
    { title: 'Inputs & Outputs', concept: 'AI systems respond to the information you give them. Inputs can include text, images, files, or structured data; outputs can be language, classifications, code, or a suggested next action.', replit: 'In a Replit app, define the input a person provides and the output they need. Clear boundaries make an AI feature easier to test and improve.', check: 'Defining the information going into and out of a model' },
    { title: 'Prompting', concept: 'A prompt is the instruction and context you give a model. Good prompting makes the goal, audience, constraints, and desired format clear without pretending the model is certain when it is not.', replit: 'Ask Agent to help draft a prompt, then test it against real examples in your Replit project. Treat the prompt as product behavior you can refine.', check: 'Giving a model a clear goal and useful constraints' },
    { title: 'Context & Memory', concept: 'Context is the information available for one response. Memory is information that can be retained or retrieved later. Both help an AI experience stay relevant, but both need intentional limits.', replit: 'A Replit app can retrieve a project record, a document, or a preference before making an AI request. Include only what the task needs.', check: 'Providing relevant information without overwhelming the model' },
    { title: 'Choosing a Model', concept: 'Different models make different tradeoffs in quality, latency, cost, modalities, and reasoning ability. The right choice depends on the outcome you need, not on a single benchmark.', replit: 'Prototype a feature in Replit with a small set of representative tasks. Compare useful outputs, response time, and cost before you commit.', check: 'Matching a model to the actual product requirement' },
    { title: 'Evaluating AI', concept: 'Evaluation is the practice of checking whether an AI feature produces useful, safe, and consistent results. It turns “this seems good” into evidence you can improve.', replit: 'Keep a small set of realistic examples in your Replit project. Run them when you change a prompt, model, or context strategy.', check: 'Measuring whether an AI feature works for real examples' },
  ],
  'Agent Foundations': [
    { title: 'What Is an Agent?', concept: 'An agent is an AI system that can work toward a goal over multiple steps. It can interpret a request, make a plan, use available tools, observe results, and adjust with human guidance.', replit: 'Replit Agent is a concrete example: it can explore a project, propose changes, create files, and keep you involved as it works toward an outcome.', check: 'Understanding an agent as a goal-directed, multi-step system' },
    { title: 'Agents vs. LLMs', concept: 'An LLM generates a response from its input. An agent uses a model as part of a broader loop that can include planning, memory, tools, and observation.', replit: 'When you ask Replit Agent to build a feature, the value is not only the generated code. It can inspect the project, make a sequence of changes, and respond to what it finds.', check: 'Recognizing the difference between a response and a workflow' },
    { title: 'Goals, Plans & Actions', concept: 'A useful agent turns a broad goal into smaller actions. A plan is not a promise of perfection; it is a way to make work inspectable, steerable, and easier to recover when conditions change.', replit: 'Give Agent a clear outcome and constraints in Replit, then review its proposed approach before it makes a broad set of changes.', check: 'Breaking an outcome into reviewable steps' },
    { title: 'Context & Memory', concept: 'Agents need context about the goal, project, constraints, and prior work. Memory can help retain useful information, but irrelevant or stale context can make an agent less effective.', replit: 'Keep project instructions and important decisions close to your Replit project so Agent has the right context when you return to a task.', check: 'Giving an agent relevant and current information' },
    { title: 'Sandboxes', concept: 'A sandbox is an isolated environment where software can run with controlled access. It lets an agent test ideas and perform work without assuming unrestricted access to everything around it.', replit: 'A Replit workspace gives Agent a defined project environment. Review permissions and changes so the work stays aligned with your project boundaries.', check: 'Using isolation to make experimentation safer' },
    { title: 'Tool Calls', concept: 'Tool calls let an agent do more than write text. A tool can search, read a file, run code, query data, or take a defined action, then return information for the next step.', replit: 'In Replit, Agent uses project tools to inspect files, make edits, and run checks. A clear tool boundary makes its work easier to understand and review.', check: 'Letting an agent take a defined action and observe the result' },
    { title: 'MCP, Connectors & Skills', concept: 'MCP, connectors, and skills extend an agent with reusable capabilities and access to approved systems. They make specialized work possible without asking the model to guess how every system works.', replit: 'Use approved connections in Replit when a project needs information or actions from another service. Treat every connection as a capability with a clear purpose and boundary.', check: 'Extending an agent with a defined, reusable capability' },
    { title: 'Human-in-the-Loop', concept: 'Human-in-the-loop means people keep judgment over goals, tradeoffs, and consequential actions. Agents can accelerate work, but they should not replace responsibility for decisions.', replit: 'Use Agent to explore and propose in Replit, then review changes, give feedback, and approve the next step. The strongest workflow is collaborative, not hands-off.', check: 'Keeping people responsible for important decisions' },
  ],
  'Protect and Share': [
    { title: 'Protect Sensitive Information', concept: 'Sensitive values and private information need deliberate handling. Keep secrets out of prompts, source code, and browser-visible output, and connect only the context a task needs.', replit: 'Use Secrets for credentials, review what a connected service exposes, and remove unnecessary sensitive information before asking Agent to work with a task.', check: 'Keeping secrets and sensitive context within appropriate boundaries' },
    { title: 'Access, Visibility and Security Checks', concept: 'Authentication establishes identity, permissions control actions, and visibility determines who can reach a shared or published outcome. Security checks help identify issues, but they still require human review and remediation.', replit: 'Choose appropriate access and publishing visibility, then review dependency checks, Agent analysis, and the available pentest level at a high level before sharing an app.', check: 'Choosing access boundaries and interpreting basic security checks' },
    { title: 'Share and Verify an Outcome', concept: 'Delivery means another person can reach and understand the result. Verification checks the outcome against success criteria instead of treating creation itself as proof of quality.', replit: 'Share a project or output with suitable access, invite feedback when useful, and record the link, screenshot, run result, or explanation that demonstrates success.', check: 'Delivering an outcome with appropriate access and observable evidence' },
  ],
  'Learn and Grow': [
    { title: 'Monitor and Learn', concept: 'After you share an outcome, feedback and operational signals reveal what works and what needs attention. Begin with a small set of signals connected to the experience people rely on.', replit: 'Identify one success signal, one error or reliability signal, and one source of feedback. Use them to choose the next improvement.', check: 'Using feedback and observable signals to guide iteration' },
    { title: 'Discoverability and Growth', concept: 'Growth begins when the right people understand and receive value from an outcome. Clear descriptions, useful content, basic analytics, and search-friendly pages help you learn how people discover and use it.', replit: 'Review a published outcome from a new visitor’s perspective. Clarify its title and purpose, identify the first useful action, and choose one measure of successful use.', check: 'Helping the right audience discover and understand an outcome' },
    { title: 'Performance and Scale', concept: 'Performance affects trust, while scaling keeps an experience available as demand changes. At foundations depth, you should recognize slow or unreliable behavior and understand that deployment capacity must fit the workload.', replit: 'Observe how a published app responds, identify its most important workflow, and explain when autoscaling or reserved capacity might become relevant.', check: 'Recognizing when performance or capacity needs attention' },
  ],
  'Operate with Replit': [
    { title: 'Conversations and Context', concept: 'A strong Agent workflow begins with a clear outcome and the context needed to pursue it. Conversations let you explore, refine, and direct the work while keeping meaningful decisions visible.', replit: 'Start a Conversation with the outcome, relevant background, constraints, and success criteria. Add only the context that helps Agent make the next useful decision.', check: 'Directing Agent with a clear outcome and relevant context' },
    { title: 'Integrations', concept: 'Integrations connect Agent to approved information and capabilities in other tools. They make work more relevant, but each connection should have a clear purpose and appropriate access.', replit: 'Connect a tool you already use, bring its context into a Conversation, and verify the source and result before using it in a consequential decision.', check: 'Using connected tools intentionally and verifying their output' },
    { title: 'Routines', concept: 'A Routine turns a repeatable task into scheduled agent work. A useful Routine has a clear trigger, expected result, review point, and lifecycle from creation through pausing or retirement.', replit: 'Create a small Routine, schedule and run it, inspect the result, then edit, pause, or disable it so you understand the complete lifecycle.', check: 'Managing scheduled agent work through its full lifecycle' },
    { title: 'Reps and Nexus', concept: 'Some goals need ongoing progress rather than a one-time response or fixed schedule. Reps provide a persistent loop toward a goal, while Nexus helps you see and coordinate broader agent activity.', replit: 'Define a bounded goal for a Rep, decide what progress evidence matters, and use Nexus to supervise rather than treating autonomous activity as invisible work.', check: 'Supervising persistent and coordinated agent work' },
  ],
  'Design with Agent': [
    { title: 'Start with an Idea', concept: 'A useful design begins with the outcome someone needs, not with a screen full of controls. Describe the audience, their job, and the moment where they should feel progress.', replit: 'Use Replit Design to turn an idea into a first screen, then test whether the most important action is clear.', check: 'Defining the person and outcome before designing a screen' },
    { title: 'Design with a Prompt', concept: 'A design prompt gives AI a goal, audience, visual direction, and constraints. It is a starting brief you can inspect and improve, not a final specification.', replit: 'Ask Replit Design for an initial direction, then use the result to make sharper decisions about hierarchy, tone, and interaction.', check: 'Giving AI a clear design brief' },
    { title: 'Explore Variations', concept: 'Variations help you compare approaches instead of becoming attached to the first answer. Compare them against the same task and choose the one that makes the outcome clearest.', replit: 'Generate and compare design directions in Replit before you invest in a single implementation.', check: 'Comparing alternatives against a shared task' },
    { title: 'Refine the Experience', concept: 'Refinement is the work of making an experience clearer, calmer, and more complete. Look at wording, hierarchy, states, spacing, and what happens when something goes wrong.', replit: 'Use the visual editor and Agent in Replit to make focused refinements instead of restarting an entire screen.', check: 'Improving an experience through focused changes' },
    { title: 'Design Systems', concept: 'A design system is a shared set of visual and interaction decisions. It helps a product stay coherent as more screens, people, and features are added.', replit: 'Capture reusable colors, typography, components, and guidance in a Replit project so Agent can make new work consistent with the existing product.', check: 'Creating consistency through reusable decisions' },
    { title: 'From Design to App', concept: 'A design becomes an app when it is connected to real behavior, data, and states. The goal is not to copy pixels; it is to preserve the experience while making it useful.', replit: 'Hand a selected Replit Design frame to Agent, then review how it becomes an interface that responds to real data and actions.', check: 'Connecting a visual direction to working behavior' },
  ],
  'Build with Agent': [
    { title: 'Prototype with Agent', concept: 'A prototype makes an idea concrete quickly enough to learn from it. It should prove the main workflow before it tries to cover every edge case.', replit: 'Describe the first useful workflow to Replit Agent and ask for a small working version you can open, use, and critique.', check: 'Testing the main idea before building everything' },
    { title: 'Plan a Feature', concept: 'A feature plan turns a desired outcome into a bounded change. It names what will change, what will not change, how success is checked, and where people need to make decisions.', replit: 'Ask Agent to outline a feature plan in your Replit project before it edits a complex area. Review the scope, then steer it.', check: 'Making a change small enough to review and validate' },
    { title: 'Build in the Background', concept: 'Longer tasks work best when the goal, constraints, and review points are clear up front. You can let an agent progress while keeping the ability to check in and redirect.', replit: 'Use Replit Agent for a defined task, then return to its progress, changes, and questions without losing the project context.', check: 'Setting clear boundaries for longer-running work' },
    { title: 'Parallel Agents', concept: 'Parallel agents can speed up independent work, but they need clear ownership to avoid conflicting changes. Split by outcome or area, then bring the work back together deliberately.', replit: 'Use separate Replit tasks for independent investigations or features, and review how their changes fit together before combining them.', check: 'Dividing independent work without creating conflicts' },
    { title: 'Preview & Test', concept: 'A preview lets you experience a feature as a person would. Testing checks expected behavior, unexpected inputs, and the parts of a workflow that are easy to overlook.', replit: 'Use the Replit preview as soon as a feature exists. Try the primary path, an empty state, and one failure case before you call it done.', check: 'Checking behavior from the perspective of the person using it' },
    { title: 'Review & Iterate', concept: 'Review turns generated work into trusted work. Compare the result to the goal, inspect important changes, and make the next improvement based on what you observe.', replit: 'Review Agent changes in Replit, ask questions about a decision, and request a focused revision rather than restarting from scratch.', check: 'Using feedback to make the next version better' },
    { title: 'Publish Your App', concept: 'Publishing makes a project available to other people. Before you publish, check the core workflow, the information people see, and what happens when something is missing or fails.', replit: 'Use Replit publishing when the first useful version is ready to share, then learn from how people actually use it.', check: 'Making a tested version available to others' },
  ],
  'Secure and Monitor': [
    { title: 'Security Basics', concept: 'Security is the practice of protecting people, information, and systems from avoidable harm. Start by knowing what matters, who should access it, and what could go wrong.', replit: 'Use Replit project settings and reviews as part of a simple security habit: understand what your app stores, who can access it, and which services it connects to.', check: 'Protecting what matters before problems occur' },
    { title: 'Secrets & Environment Variables', concept: 'Secrets are sensitive values such as API keys and tokens. Environment variables keep them out of code and let different environments use different values safely.', replit: 'Store service credentials as Replit secrets instead of writing them into a file or sending them to the browser.', check: 'Keeping sensitive values out of source code' },
    { title: 'Authentication & Permissions', concept: 'Authentication verifies identity; permissions limit actions based on that identity. Together, they help people access their own work without exposing everyone else’s.', replit: 'When you add authentication to a Replit app, test the rules from more than one account so you can see what each person is allowed to do.', check: 'Giving people only the access they need' },
    { title: 'Input & Data Safety', concept: 'Anything people or outside systems provide is input. Validate it, handle it carefully, and avoid treating unexpected data as safe simply because it arrived in your app.', replit: 'Ask Agent to review a Replit feature for validation and error handling, then test it with missing, malformed, and surprising inputs.', check: 'Treating external input as something to validate' },
    { title: 'Security Review with Agent', concept: 'An agent can help find issues and explain tradeoffs, but it does not remove the need for review. Use it to create a checklist, inspect changes, and surface questions a person should decide.', replit: 'Use Replit Agent security scans and reviews as starting points, then confirm the findings against how your specific app stores data and grants access.', check: 'Using AI to support—not replace—security judgment' },
    { title: 'Monitoring Basics', concept: 'Monitoring gives you visibility after an app is live. It helps you notice whether the app is available, healthy, and serving people as expected.', replit: 'After publishing in Replit, decide what signals matter for your app: successful requests, failures, slow behavior, or a key business action.', check: 'Choosing signals that show whether an app is healthy' },
    { title: 'Logs, Errors & Performance', concept: 'Logs record what happened, errors reveal failed paths, and performance signals show whether people are waiting too long. Together, they turn a vague problem into something you can investigate.', replit: 'Use Replit logs and project output to trace a problem from a person’s report to the part of the app that needs attention.', check: 'Using evidence to investigate a production problem' },
    { title: 'Alerts & Incident Response', concept: 'Alerts tell you when a meaningful threshold has been crossed. Incident response is the calm, repeatable process of understanding impact, stabilizing the app, communicating, and learning afterward.', replit: 'Set up a simple response habit around Replit deployment signals: check impact, inspect recent changes, communicate clearly, and record what you learned.', check: 'Responding deliberately when something important breaks' },
  ],
  'Grow and Scale': [
    { title: 'Growth Fundamentals', concept: 'Growth means more people receive value from your product. Sustainable growth begins with a clear audience, a useful outcome, and a way to learn why people return or leave.', replit: 'Use your Replit project to keep the product loop visible: who it serves, what they do first, and what outcome tells you the app helped.', check: 'Growing by increasing real value for a clear audience' },
    { title: 'Discoverability & SEO', concept: 'Discoverability helps the right people find your product. Search engine optimization is one way to make public content understandable to search engines and people looking for a solution.', replit: 'Publish clear Replit app pages with useful titles, descriptions, and content that explains the problem your product solves.', check: 'Helping the right people understand and find a product' },
    { title: 'User Acquisition', concept: 'User acquisition is the process of reaching people who may benefit from your product and helping them take the first useful step. Start with a focused audience and a message grounded in value.', replit: 'Use a Replit prototype to test a landing page, onboarding flow, or small campaign before investing in a broader acquisition strategy.', check: 'Connecting a specific audience to a useful first experience' },
    { title: 'Performance', concept: 'Performance is how quickly and smoothly an app responds. It affects trust, accessibility, and whether people complete the task they came to do.', replit: 'Use your Replit preview and production signals to notice slow pages or workflows, then improve the highest-impact part first.', check: 'Improving the experience by reducing unnecessary waiting' },
    { title: 'Autoscaling', concept: 'Autoscaling adjusts available capacity as demand changes. It helps an app handle traffic spikes without making you keep maximum resources running all the time.', replit: 'Choose Replit deployment capacity based on the traffic pattern and reliability needs of your app, not only on the current number of visitors.', check: 'Matching capacity to changing demand' },
    { title: 'Reserved VMs', concept: 'Reserved virtual machines provide predictable capacity for workloads that need a steady amount of compute. They are useful when stability and consistent performance matter more than short bursts alone.', replit: 'Consider reserved capacity in Replit when you understand a workload’s baseline demand and need dependable resources for it.', check: 'Choosing predictable capacity for a steady workload' },
    { title: 'Capacity Planning', concept: 'Capacity planning connects expected demand to the resources an app needs. It is a habit of measuring, forecasting, testing, and deciding before a growth moment becomes an outage.', replit: 'Use deployment behavior and monitoring signals in Replit to identify which workflows need more capacity or a simpler design.', check: 'Preparing for demand before it becomes a problem' },
    { title: 'Serving More Users', concept: 'Serving more people means more than adding infrastructure. It means preserving a useful, reliable, understandable experience as support requests, data, and usage patterns become more complex.', replit: 'Keep iterating in Replit as your app grows: listen to feedback, watch real usage, improve the product loop, and strengthen the systems that carry the most value.', check: 'Preserving a useful experience as usage grows' },
  ],
  'Administer Replit': [
    { title: 'Enterprise Workspaces', concept: 'An enterprise Workspace gives an organization a shared Replit environment with centralized controls. Administrators shape how people join, create, share, and use organizational resources.', replit: 'Review the organization-level settings that affect creators, then connect each policy to the behavior it enables or limits inside a project.', check: 'Understanding the scope and purpose of enterprise administration' },
    { title: 'Identity and Access', concept: 'Identity and access controls determine who can join an organization, which role they receive, what they can reach, and how access changes when they move or leave.', replit: 'Practice a simulated joiner, role-change, and offboarding workflow. Verify the resulting access from the affected person’s perspective.', check: 'Managing access across a person’s organizational lifecycle' },
    { title: 'Security and Governance', concept: 'Organization-wide governance sets safe boundaries for publishing, integrations, shared resources, and security response. Administrators identify and prioritize findings, coordinate or start remediation, and verify the outcome.', replit: 'Use a simulated Workspace Security Center scenario to review dependency findings, prioritize by severity and exposure, start an Agent-assisted fix where appropriate, notify the owner, and confirm remediation.', check: 'Applying organization-level policy and coordinating security response' },
    { title: 'Rollout, Usage and Audit Logs', concept: 'A controlled rollout starts with a pilot, observes adoption and spend, resolves gaps, then expands. Audit logs provide evidence of important administrative and security activity.', replit: 'Use a sandbox scenario to investigate audit events, review usage and cost signals, support a pilot group, and decide what must change before the next rollout stage.', check: 'Using evidence to operate and expand an enterprise Replit environment' },
  ],
};

export const courseLessons: Record<string, LearnLesson[]> = Object.fromEntries(
  Object.entries(courseBriefs).map(([module, briefs]) => [module, module === 'Replit 101' ? discoverLessons : briefs.map((brief) => guidedLesson(module, brief))]),
);
