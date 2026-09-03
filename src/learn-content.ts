export type QuizQuestion = {
  prompt: string;
  choices: [string, string, string];
  answer: number;
};

export type LearnLesson = {
  module: string;
  title: string;
  duration: string;
  video: string;
  summary: string;
  outcomes?: string[];
  sections: Array<{ heading: string; body: string; items?: string[] }>;
  replitExample: string;
  quiz: [QuizQuestion, QuizQuestion, QuizQuestion];
};

export const appFoundationLessons: LearnLesson[] = [
  {
    module: 'App Foundations', title: 'What Is an App?', duration: '5 min', video: 'How an app works',
    summary: 'An app is a tool or service that helps someone get something done. It can help a person organise work, make a decision, create something, or help a business serve its customers.',
    outcomes: [
      'Explain what an app does in plain language',
      'Name the core parts that make an app work',
      'Describe how those parts work together',
    ],
    sections: [
      { heading: 'An app helps someone do something', body: 'Apps exist to provide a useful service. A calendar app helps people plan time. A shop helps people find and buy something. A project tool helps a team organise work. Some apps are for one person, while others help a business serve many people. What matters is that the app has a purpose and helps someone make progress.' },
      { heading: 'Most apps use a few core parts', body: 'You do not need to know how to build every part yet. For now, it helps to know what each part is responsible for.', items: ['Frontend and UI: the screens, buttons, forms, and messages that people see and use.', 'Backend and logic: the behind-the-scenes work, including rules, decisions, and actions.', 'Data: the information an app remembers, such as accounts, projects, messages, settings, or orders.'] },
      { heading: 'Some apps need more pieces', body: 'As an app becomes more useful, it may also need file storage for images or documents, sign-in for personal accounts, payments, or connections to other services. These are useful additions, not requirements for every first version.' },
      { heading: 'The parts work together', body: 'When someone takes an action, the frontend collects it and shows the result. The backend performs the work that should happen behind the scenes. Data helps the app remember what happened. The diagram below shows that simple path.' },
      { heading: 'You can start small', body: 'You do not need to understand every part before you begin. Start with one useful idea, build a small version, and add the pieces your app needs as you learn. The next chapters introduce each building block one at a time.' },
    ],
    replitExample: 'In Replit, you can begin with a plain-language description of the service you want to provide. Agent can help turn that idea into a working project, and you can inspect the screens, code, data, and published result in one place.',
    quiz: [
      { prompt: 'What is the main purpose of an app?', choices: ['To help someone get something done', 'To use as many technologies as possible', 'To have a large number of screens'], answer: 0 },
      { prompt: 'Which part of an app shows screens, buttons, and messages?', choices: ['Data', 'Frontend and UI', 'Backend and logic'], answer: 1 },
      { prompt: 'What is a sensible way to begin building an app?', choices: ['Learn every technical detail first', 'Build every possible feature at once', 'Start with one useful idea and add pieces as needed'], answer: 2 },
    ],
  },
  {
    module: 'App Foundations', title: 'Projects, Code & Files', duration: '5 min', video: 'How an app is organised',
    summary: 'An app begins as instructions written in code. A project keeps those instructions in files, so the different parts of an app can stay organised and work together.',
    outcomes: [
      'Explain the relationship between code, files, and a project',
      'Recognise why an app uses more than one file',
      'Describe how a framework helps organise an app',
    ],
    sections: [
      { heading: 'Code is a set of instructions', body: 'Code tells an app what to show, what to do when someone takes an action, and how to work with information. You do not need to read or write every line to understand the basic idea: code is the written set of instructions behind an app.' },
      { heading: 'A project keeps the work together', body: 'A project is the home for an app and the work that supports it. It holds the code, files, settings, and other resources needed to build, run, and improve that app. Keeping related work together makes a project easier to understand and change over time.' },
      { heading: 'Files organise work by responsibility', body: 'Most apps use many files because one large file becomes difficult to follow. Files can be organised around a screen, a reusable part of the interface, backend logic, a connection to data, or a setting. The exact structure differs between projects, but the purpose is always the same: give each piece of work a clear home.', items: ['A UI component file might describe a button, form, or screen.', 'A backend file might handle a request or apply a business rule.', 'A data file might describe how the app reads or saves information.', 'A configuration file might tell the project how to run or publish.'] },
      { heading: 'Frameworks provide a shared structure', body: 'A framework is a set of helpful conventions and tools for building an app. It gives a project a predictable way to organise screens, routes, shared components, and other common needs. This means builders do not have to invent the structure from scratch every time.' },
      { heading: 'You only need the map for now', body: 'At this stage, you do not need to memorise a project’s files. It is enough to recognise that an app is organised work: instructions live in files, files live in a project, and the project brings the pieces together into something people can use. Later, you will explore how AI agents can work with this same project structure.' },
    ],
    replitExample: 'A Replit project gives you one place to see the files behind an app, run it, and preview the result. As you explore a project, notice that the file tree is an organised map of the work—not a list you need to understand all at once.',
    quiz: [
      { prompt: 'What is code in the context of an app?', choices: ['A set of written instructions', 'A type of database record', 'Only the colours on a screen'], answer: 0 },
      { prompt: 'Why do apps usually use multiple files?', choices: ['To make a project harder to read', 'To organise work by responsibility', 'Because every file must be a screen'], answer: 1 },
      { prompt: 'What does a framework provide?', choices: ['A predictable structure and useful conventions', 'A replacement for every project file', 'A way to avoid thinking about the app’s purpose'], answer: 0 },
    ],
  },
  {
    module: 'App Foundations', title: 'Frontend & UI', duration: '5 min', video: 'The experience people use',
    summary: 'The frontend is the part of an app that people see and use. It turns an app’s purpose into screens, controls, information, and feedback that help someone get something done.',
    outcomes: [
      'Explain what the frontend and UI are',
      'Recognise the roles of HTML, CSS, and JavaScript',
      'Identify the key states a helpful interface should show',
    ],
    sections: [
      { heading: 'The frontend is the part people use', body: 'When someone opens an app, reads a message, fills in a form, or taps a button, they are using the frontend. The frontend gives people a way to take action and see the result. It is the part of the app that makes the service feel clear and usable.' },
      { heading: 'The UI guides someone through a task', body: 'UI means user interface. It includes the screens, buttons, forms, labels, menus, and messages that appear in an app. A good UI makes the next step easy to find. It explains what someone can do, what is happening now, and what happened after they acted.' },
      { heading: 'Frontend code has a few familiar jobs', body: 'You do not need to write this code yet. It is enough to know the role each part usually plays.', items: ['HTML gives a screen its structure, such as headings, text, forms, and buttons.', 'CSS controls how the screen looks, including layout, spacing, colours, and typography.', 'JavaScript makes the screen respond to actions, such as opening a menu, checking a form, or showing new information.'] },
      { heading: 'Helpful interfaces show their state', body: 'An app changes as someone uses it. It may have no information yet, be waiting for something to load, show a result, confirm success, or explain a problem. Showing those states helps people understand the app instead of leaving them to guess.' },
      { heading: 'Feedback is part of the experience', body: 'Feedback is not decoration. A loading message tells someone the app is working. A confirmation tells them their action succeeded. A clear error message helps them recover. Small signals like these make an app feel calm, trustworthy, and easier to use.' },
      { heading: 'Start with one clear task', body: 'You do not need a perfect interface before you begin. Pick one action the app should help someone complete, make that action easy to find, and show a useful result. You can improve the details as you learn from real use.' },
    ],
    replitExample: 'Use Replit Design to explore a screen before you commit to code. You can ask Agent to create a first version, compare variations, and refine the experience. Then use Preview to try the task as a builder would, including loading, empty, and error states.',
    quiz: [
      { prompt: 'What is the frontend?', choices: ['The part of an app people see and use', 'Only the database', 'A place to store passwords'], answer: 0 },
      { prompt: 'What does CSS usually control?', choices: ['How a screen looks and is laid out', 'The app’s stored records', 'A person’s account permissions'], answer: 0 },
      { prompt: 'Why should an interface show a loading state?', choices: ['To make people wait longer', 'To show that the app is working on their request', 'To replace the final result'], answer: 1 },
    ],
  },
  {
    module: 'App Foundations', title: 'Backend & Logic', duration: '6 min', video: 'Where app decisions happen',
    summary: 'The backend handles work that should not happen only in the browser, including rules, workflows, and communication with data or outside services.',
    sections: [
      { heading: 'Put decisions in the right place', body: 'The backend checks what is allowed, decides what happens next, and protects work that should not be controlled by the interface alone. This can include processing a payment, deciding who can edit a project, or sending an email.' },
      { heading: 'APIs are contracts', body: 'An API is a structured agreement for exchanging information. Your frontend asks for something in a predictable way; the backend returns a predictable response. Clear contracts make a system easier to change and debug.' },
      { heading: 'Build one workflow at a time', body: 'Start with a single request from beginning to end. Once it works, you can add validation, errors, permissions, and more complex behavior without losing the thread.' },
    ],
    replitExample: 'When you ask Agent to add a feature in Replit, it can work across the interface and server code together. Review the changes as one workflow rather than treating the frontend and backend as unrelated projects.',
    quiz: [
      { prompt: 'What is a backend responsible for?', choices: ['Only colors and layout', 'Rules, workflows, and protected work', 'Replacing every UI interaction'], answer: 1 },
      { prompt: 'What is an API?', choices: ['A visual style guide', 'A structured agreement for systems to exchange information', 'A type of database'], answer: 1 },
      { prompt: 'What is a good first backend milestone?', choices: ['Every feature at once', 'One complete workflow', 'A production-scale architecture'], answer: 1 },
    ],
  },
  {
    module: 'App Foundations', title: 'Databases', duration: '6 min', video: 'Remembering structured information',
    summary: 'Databases help apps remember structured information that needs to be searched, updated, and connected to other records.',
    sections: [
      { heading: 'Model what matters', body: 'Begin by naming the things your app needs to remember: people, projects, messages, orders, or preferences. Then identify how those records relate. This is a product decision before it becomes a technical one.' },
      { heading: 'Use a database for records', body: 'Databases are for information you need to search, filter, update, and connect. A project table, for example, can link a project to its creator and its tasks.' },
    ],
    replitExample: 'Replit Database gives you a place to add persistent records as an idea becomes a useful product. Agent can help you sketch the model, but you should still decide what the app needs to remember.',
    quiz: [
      { prompt: 'What belongs in a database?', choices: ['A searchable project record', 'A large video file', 'A button color'], answer: 0 },
      { prompt: 'What should you decide before modeling data?', choices: ['What the app needs to remember', 'Which SQL keyword to use', 'How many servers to reserve'], answer: 0 },
      { prompt: 'Why use a database?', choices: ['To search, update, and connect records', 'To design a button', 'To replace an API'], answer: 0 },
    ],
  },
  {
    module: 'App Foundations', title: 'File Storage', duration: '5 min', video: 'Working with files',
    summary: 'File storage gives an app a durable home for images, documents, audio, video, and other larger files that do not fit naturally into a database record.',
    sections: [
      { heading: 'Files are different from records', body: 'A profile picture, invoice, or uploaded video is useful information, but it is not the same as a name, date, or status. Files can be large, varied, and expensive to move, so apps store them differently from structured records.' },
      { heading: 'Connect files to your data', body: 'A database record can keep a reference to a file in storage. That lets the app answer useful questions: who uploaded it, which project it belongs to, whether it is public, and when it should appear.' },
      { heading: 'Decide what people can access', body: 'Before adding uploads, decide who can add, view, replace, or remove a file. This keeps storage aligned with the identity and permissions model of your app.' },
    ],
    replitExample: 'Use Replit Object Storage when your project needs to keep files such as images or documents. Pair it with Replit Database to store the references and metadata that make those files useful in your app.',
    quiz: [
      { prompt: 'What is file storage best for?', choices: ['An uploaded image', 'A project status field', 'A navigation route'], answer: 0 },
      { prompt: 'Why keep a file reference in a database?', choices: ['To connect it to the person or project it belongs to', 'To make the file smaller', 'To avoid permissions'], answer: 0 },
      { prompt: 'What should you decide before adding uploads?', choices: ['Who can access and manage the files', 'Which font the app uses', 'How many pages the app has'], answer: 0 },
    ],
  },
  {
    module: 'App Foundations', title: 'Users & Access', duration: '5 min', video: 'Identity and permissions',
    summary: 'Identity lets an app know who someone is. Authentication verifies that identity, while permissions decide what that person can see or do.',
    sections: [
      { heading: 'Identity creates ownership', body: 'Accounts let people return to saved work, collaborate, and trust that their information belongs to them. Even a simple app often needs a clear answer to: who is this person?' },
      { heading: 'Authentication and authorization differ', body: 'Authentication answers “are you who you say you are?” Authorization answers “are you allowed to do this?” Keeping those questions separate makes it easier to reason about access.' },
      { heading: 'Start with the smallest useful role model', body: 'A product may only need an owner and a collaborator at first. Add more roles only when they represent a real difference in responsibility or access.' },
    ],
    replitExample: 'Replit can help you add an authentication flow as part of a project. Later, in Secure and Monitor, you will learn how to protect secrets and review permissions more deeply.',
    quiz: [
      { prompt: 'What does authentication verify?', choices: ['Who someone is', 'How fast the app is', 'Where a file is stored'], answer: 0 },
      { prompt: 'What does authorization decide?', choices: ['Whether someone can take an action', 'What their password is', 'Which model to use'], answer: 0 },
      { prompt: 'What is a good first role model?', choices: ['Every role you can imagine', 'The smallest set that matches real responsibilities', 'No roles at all'], answer: 1 },
    ],
  },
  {
    module: 'App Foundations', title: 'Integrations', duration: '5 min', video: 'Connecting useful services',
    summary: 'Integrations let an app use capabilities such as payments, email, maps, analytics, and AI without rebuilding those systems from scratch.',
    sections: [
      { heading: 'Extend the core experience', body: 'Choose integrations that directly support the job your app helps someone do. A calendar connection may be essential to a scheduling product, while payments may be unnecessary until someone is ready to buy.' },
      { heading: 'Plan for the outside world', body: 'External services can be slow, unavailable, or return unexpected results. A resilient app explains what happened, keeps important work recoverable, and does not assume every request will succeed.' },
      { heading: 'Keep boundaries clear', body: 'Use the backend to manage credentials and communicate with sensitive services. This helps you protect secrets and gives your product one dependable place to handle errors.' },
    ],
    replitExample: 'In Replit, Agent can help connect an external service to your project, but you still decide the product flow: when the connection is needed, what data moves, and what the app should do if it fails.',
    quiz: [
      { prompt: 'Why use an integration?', choices: ['To add a useful capability without rebuilding it', 'To avoid designing a product flow', 'To remove the need for a backend'], answer: 0 },
      { prompt: 'Where should sensitive service credentials live?', choices: ['In frontend code', 'In a protected backend environment', 'In a public README'], answer: 1 },
      { prompt: 'What should an app do when a service fails?', choices: ['Assume it cannot happen', 'Give useful feedback and keep work recoverable', 'Delete the person’s data'], answer: 1 },
    ],
  },
  {
    module: 'App Foundations', title: 'App Architecture', duration: '6 min', video: 'Seeing the whole system',
    summary: 'App architecture is the way the interface, logic, data, identity, and integrations work together to deliver a reliable experience.',
    sections: [
      { heading: 'Trace a single journey', body: 'Pick one meaningful action, such as creating a project or sending a message. Follow it from the screen, through the backend, into data or services, and back to the person. This reveals how your app is actually organized.' },
      { heading: 'Make the boundaries visible', body: 'Clear boundaries help you change an app safely. Keep interface concerns, business rules, data access, and external connections understandable rather than hiding everything in one place.' },
      { heading: 'Grow through iteration', body: 'You do not need a perfect architecture before you begin. Build a simple, complete workflow, learn from real use, then improve the pieces that need to carry more responsibility.' },
    ],
    replitExample: 'Replit keeps your project, preview, code, services, and publishing workflow close together. That makes it easier to trace one journey and decide where a new capability belongs before you ask Agent to build it.',
    quiz: [
      { prompt: 'What is a practical way to understand an app architecture?', choices: ['Trace one complete action through the system', 'Start with every possible diagram', 'Ignore data and services'], answer: 0 },
      { prompt: 'Why do clear boundaries help?', choices: ['They make safe changes easier', 'They remove the need for testing', 'They prevent people from using the app'], answer: 0 },
      { prompt: 'What should come before a complex architecture?', choices: ['A simple, complete workflow', 'A reserved VM', 'An extensive role hierarchy'], answer: 0 },
    ],
  },
];

type LessonBrief = { title: string; concept: string; replit: string; check: string };

const moduleGuidance: Record<string, { purpose: string; fit: string; tryIt: string }> = {
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
  const depth = chapterDepth[`${module}/${brief.title}`];
  return {
    module,
    title: brief.title,
    duration: '5 min',
    video: brief.title,
    summary: brief.concept,
    sections: [
      { heading: 'What it is', body: brief.concept },
      { heading: 'Why it matters', body: `${brief.check} is the practical reason to learn this. ${guidance.purpose} The point is not to memorise a term. It is to recognise when this idea can make a task clearer, safer, or more useful for the person doing the work.` },
      { heading: 'What it is for', body: `Use ${brief.title} to make one part of a workflow more intentional. Begin with a real need, state what a helpful result looks like, and keep the first version small enough to inspect. A focused first attempt gives you something concrete to improve instead of a vague feeling that the work should be “more advanced.”` },
      { heading: 'Where it fits', body: guidance.fit },
      { heading: 'In practice', body: depth },
      { heading: 'What to notice', body: `Pay attention to the hand-off between a person and the system. What do they provide? What does the app or agent do next? What feedback tells them that the result is ready, incomplete, or needs a different approach? Those moments are where a concept becomes a usable experience.` },
      { heading: 'Give it a try', body: guidance.tryIt },
    ],
    replitExample: brief.replit,
    quiz: [
      { prompt: `What is the main purpose of ${brief.title}?`, choices: [brief.check, 'To remove the need for human judgment', 'To replace every other part of an app'], answer: 0 },
      { prompt: 'What is the best way to begin using this idea?', choices: ['Start with a small, observable outcome', 'Add every possible feature first', 'Skip testing until launch'], answer: 0 },
      { prompt: 'Which question keeps the concept practical?', choices: ['What problem does this solve?', 'Which term sounds most technical?', 'How can we make it more abstract?'], answer: 0 },
    ],
  };
}

const courseBriefs: Record<string, LessonBrief[]> = {
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
};

export const courseLessons: Record<string, LearnLesson[]> = Object.fromEntries(
  Object.entries(courseBriefs).map(([module, briefs]) => [module, briefs.map((brief) => guidedLesson(module, brief))]),
);
