import type { LearnLesson } from './learn-content';

// Keep the existing module slug so saved course links continue to work.
const base = { module: 'Replit 101', duration: '4 min', video: '', replitExample: '' };

export const discoverLessons: LearnLesson[] = [
  {
    ...base, title: 'What You Can Do with Replit',
    summary: 'Welcome! Whether you’re new to Replit or have built a few projects with it, this is a place to discover what you can do. Replit helps you explore information, get work done, and turn your ideas into apps.',
    introduction: [
      { text: 'For example, you can:', items: ['Research an idea, compare options, and check sources.', 'Summarize notes or find information in tools you choose to connect.', 'Schedule recurring tasks, such as a weekly update.', 'Turn an idea into a web app you can try and improve.', 'Explore different designs and create visual assets, such as images.'] },
      'The good news is that you don’t need technical or coding experience to get started. You describe what you want, review the result, and ask Replit for improvements.',
      { text: 'Throughout this course, you’ll plan a child’s birthday party. Step by step, you’ll:', items: ['Brainstorm ideas and explore party themes.', 'Create a shopping list of things to buy.', 'Build a website where guests can RSVP.', 'Design invitations and create supporting images.'] },
      'You can use fictional details while practicing. Let’s get started!',
    ],
    sections: [],
    quiz: [
      { prompt: 'Which of these can you do with Replit? Choose the answer that includes every possibility.', choices: ['Explore information and research ideas', 'Get work done with information from connected tools', 'Create Routines for recurring tasks', 'Build applications', 'Explore designs and create images', 'All of the above'], answer: 5, feedback: 'All five are possible. You can start with a conversation, then choose the kind of help or result you need.' },
    ],
  },
  {
    ...base, title: 'From Conversation to Outcome', duration: '4 min',
    summary: 'When you open Replit’s home screen, you’ll see a large composer, also called the prompt box.',
    openingImage: { src: '/images/replit-home-anonymized.png', alt: 'Replit home screen with the large prompt box below the greeting. Names, avatars, and project titles are fictional.' },
    entryLink: 'https://replit.com/~',
    introduction: ['It’s one of the main ways you interact with Replit. Everything starts with a conversation where you explain what you want to achieve.', 'In this lesson, you’ll brainstorm birthday-party themes, choose one, and ask for a picture. Keep the same conversation open so you can build on your ideas.', 'Use fictional details for this exercise. You don’t need to share a child’s name, photo, or exact location.'],
    promptGate: true,
    outcomes: ['Write a prompt to brainstorm party themes', 'Choose a theme with a follow-up', 'Ask for an image to visualize your idea'],
    sections: [
      { heading: 'Tell Replit what you have in mind', body: 'Write your request in the prompt box. That request is a prompt. Start with the goal and a few helpful details. You’re just asking for ideas for now. You’ll ask for the website later.', prompt: 'I’m planning a birthday party for a six-year-old, with ten children in a park. Help me brainstorm four themes with simple activities.', afterPrompt: 'Send the prompt in Replit and read the suggestions. Notice how your details give the ideas a direction. The answer may differ from someone else’s, and that’s fine.' },
      { heading: 'Let’s choose a theme together', body: 'Read Replit’s suggestions and pick a theme you like. Reply in the same conversation so you can build on those ideas. Replace the bracketed text with your choice.', prompt: 'Let’s go with [your chosen theme]. Suggest three simple activities that fit it.', afterPrompt: 'Read the activities and ask for a simpler option if you need one. You can keep the theme while refining the details.' },
      { heading: 'Picture the party', body: 'Now ask for a picture of the theme you chose. You don’t need to repeat the whole plan in the same conversation.', prompt: 'Create an image of what this birthday party could look like, with decorations and a picnic table in a park, using our chosen theme.', afterPrompt: 'Look at the picture. Does it fit your idea? You can ask for one change, such as different colors or simpler decorations. That’s a conversation: describe, review, and refine.' },
    ],
    quiz: [
      { prompt: 'What does the generated party image show?', choices: ['Proof that every decoration is in stock', 'A visual idea to review and refine', 'A confirmed order from a store'], answer: 1 },
      { prompt: 'How do you refine a theme you like?', choices: ['Accept everything without reviewing it', 'Publish a website first', 'Ask a follow-up in the same conversation'], answer: 2 },
      { prompt: 'What helps Replit suggest relevant ideas?', choices: ['Your goal and helpful details', 'Leaving out what you want', 'Using technical vocabulary instead of a goal'], answer: 0 },
    ],
  },
  {
    ...base, title: 'Connect your tools',
    summary: 'Useful information isn’t always on the web. Your plans might be in a document, an email, or a calendar. Integrations let Replit work with information from tools you choose to connect.',
    outcomes: ['Explain why a connected tool can help', 'Review access before connecting an account', 'Check an answer against its original information'],
    sections: [
      { heading: 'Bring your own context', body: 'For the gathering, your notes might contain a budget and a list of possible activities. Replit can use those details to give a more relevant answer. A calendar could help with availability; email could hold an attachment. What is available depends on the connector and its permissions.' },
      { heading: 'Connect deliberately', body: 'Open Integrations in your Replit Workspace. Find the service you want, check the account and requested permissions, and connect only if you’re comfortable with that access. Then add the integration to your conversation and say which information to use. Connecting a tool does not describe the task for you.' },
      { heading: 'Try reading before changing', body: 'Start with a summary of a non-sensitive document you own. Compare the answer with the original. Asking for a draft is different from sending a message, and reading a calendar is different from creating an event. Be explicit about the actions you want.' },
      { heading: 'No account to connect? You can still practice', body: 'Use these sample notes instead: 12 guests, a budget of 120, an indoor room available, and no confirmed date. Paste those notes into the conversation and ask the same question. This practices using context without granting access to an account.' },
    ],
    practice: { prompt: 'Using only my gathering notes, summarize the budget, guest count, and open decisions. Tell me where each detail comes from. Don’t change files, send messages, or create calendar events.', checks: ['I chose a permitted source or pasted the sample notes.', 'I asked a read-only question and checked the answer against the source.'] },
    quiz: [
      { prompt: 'What does an integration add to this exercise?', choices: ['A guarantee that every answer is right', 'Access to every account automatically', 'Access to an approved source of relevant information'], answer: 2 },
      { prompt: 'What should you check before connecting a tool?', choices: ['The account and the access you are granting', 'Only the color of its icon', 'Whether you have already published an app'], answer: 0 },
      { prompt: 'You want an email draft, not a sent email. What should you request?', choices: ['Handle everything with no further details', 'Draft it for review and do not send it', 'Send it first so you can inspect it later'], answer: 1 },
    ],
  },
  {
    ...base, title: 'Work effectively with Replit',
    summary: 'You get more useful help when Replit knows your goal, the relevant details, and what a good result looks like. You can build those habits without learning how AI works behind the scenes.',
    outcomes: ['Add helpful context to a request', 'Describe a result you can check', 'Improve one part without losing what already works'],
    sections: [
      { heading: 'Give your request three useful ingredients', body: 'Think of asking someone to help plan your gathering. “Help with my event” leaves a lot open. A goal, some context, and a desired result give the work direction.', items: ['Goal: plan a relaxed gathering for neighbors.', 'Context: 12 people, a small budget, and an indoor room.', 'Result: a short plan with activities, materials, and questions to resolve.'] },
      { heading: 'Ask before assuming', body: 'If the date or budget is missing, ask Replit to flag the gap rather than invent an answer. You can also ask it to explain a suggestion in plain language. Asking questions is part of the work, not a sign that you’re doing it wrong.' },
      { heading: 'Keep what works and change one thing', body: 'Read the plan. Pick one improvement, such as making an activity accessible to more people. Say what to preserve and what to change. Review the new version before asking for another improvement.', prompt: 'Keep the budget and guest count. Replace the outdoor activity with an indoor option, and explain what materials it needs.' },
    ],
    practice: { prompt: 'Plan a relaxed indoor gathering for 12 neighbors with a budget of 120. Return a short activity plan and materials list. Flag missing information instead of guessing, and don’t make bookings or send invitations.', checks: ['I reviewed the plan against its goal and constraints.', 'I requested one specific improvement and checked what changed.'] },
    quiz: [
      { prompt: 'Which details help Replit make a useful plan?', choices: ['Your goal, relevant context, and desired result', 'As many unrelated documents as possible', 'Only the word “plan”'], answer: 0 },
      { prompt: 'A date is missing from your notes. What is useful behavior?', choices: ['Treating a guessed date as confirmed', 'Flagging the gap or asking you', 'Ignoring the rest of your request'], answer: 1 },
      { prompt: 'How can you improve a plan without losing the good parts?', choices: ['Ask for everything to change at once', 'Stop reviewing after the first attempt', 'Say what to keep and request one specific change'], answer: 2 },
    ],
  },
  {
    ...base, title: 'Create a Routine',
    summary: 'Some questions are worth asking again. A Routine is a way to have Replit repeat a task on a schedule, such as checking local event information each week.',
    outcomes: ['Recognize a task worth repeating', 'Review a schedule and budget before enabling it', 'Find and check the result of a Routine'],
    sections: [
      { heading: 'Start with a task you already understand', body: 'Your gathering research was useful once. If you’re still planning, a weekly update could help you notice new activities. Keep the first Routine narrow: a few relevant updates, with sources, returned to your conversation.' },
      { heading: 'Decide before you schedule', body: 'A recurring task needs more than a topic. Choose when it runs, your time zone, what information it checks, and where you want the result. Review the per-run budget too. Repeated work can use paid capacity.' },
      { heading: 'Review the proposal first', body: 'Routines belong to a conversation, not a project. Use Power or Max when creating one. Ask for a proposal, then review the schedule, scope, and budget before confirming. You can finish this lesson by reviewing a proposal without enabling recurring work.' },
      { heading: 'Know where the result goes', body: 'An enabled Routine returns results to its conversation. Open Routines to inspect its schedule and activity. After a run, check one source just as you did with your first research answer. Turn off a test Routine when you no longer need it.' },
    ],
    practice: { prompt: 'Help me prepare a weekly Routine to find three affordable local activities for my neighborhood gathering. Return source links in this conversation. Ask me for the location, schedule, time zone, and budget. Show the proposal for review; don’t activate it yet.', checks: ['I reviewed a proposal, or wrote down the task, schedule, time zone, and budget I would choose.', 'I know where to check the results and that activation is a separate decision.'] },
    quiz: [
      { prompt: 'Which task fits a Routine?', choices: ['A one-time change to a page heading', 'Checking relevant local events every week', 'Publishing automatically without review'], answer: 1 },
      { prompt: 'What should you review before activating one?', choices: ['Only its title', 'Only the first sentence of the request', 'Its task, schedule, time zone, and per-run budget'], answer: 2 },
      { prompt: 'Where do you review a Routine’s results?', choices: ['In the conversation it belongs to', 'Only inside an app’s code files', 'They are never available after a run'], answer: 0 },
    ],
  },
  {
    ...base, title: 'Build and Publish a Simple App', duration: '6 min',
    summary: 'Your conversation has helped you make a plan. Now you can turn part of that plan into something you can use: a small app for organizing gathering activities.',
    outcomes: ['Describe one manageable first version', 'Try the app in Preview', 'Request and test one improvement'],
    sections: [
      { heading: 'Choose one thing the app should do', body: 'Start with an activity list. You should be able to add an idea and mark it as chosen. Leave invitations, accounts, and payments for later. A smaller first version gives you something concrete to try sooner.' },
      { heading: 'Ask Replit to build it', body: 'Open a new conversation or continue your planning conversation. Say explicitly that you want a web app. Replit creates a project for the work and writes the files that make the app function. Building can take a few minutes; keep the conversation open and respond if it needs clarification.' },
      { heading: 'Try the first version', body: 'When the app is available, open Preview. Add an activity, mark it as chosen, and check that the list changes. A message saying the app is ready is your cue to test, not proof that every detail is right.' },
      { heading: 'Make one improvement', body: 'Ask for an improvement you can see and test. Keep the existing functionality so you can tell whether the change helped.', prompt: 'Keep adding activities and marking them as chosen. Add a filter that shows only chosen activities. Don’t add accounts or publish the app.', afterPrompt: 'Try the filter with both chosen and unchosen activities. If it doesn’t work as expected, describe what you did, what happened, and what you wanted instead.' },
      { heading: 'Sharing is a separate decision', body: 'You don’t need to publish to finish this lesson. Before sharing, review access and remove private information. A development preview is not the same as a finished release, and you should not assume its link is private. The Build course goes deeper into the app’s parts, testing, and publishing.' },
    ],
    practice: { prompt: 'Build a simple web app for planning a neighborhood gathering. Let me add an activity and mark it as chosen. Use sample information and store the list only in this browser. No accounts, invitations, or payments. Don’t publish it.', checks: ['I opened the app in Preview and tried adding and choosing an activity.', 'I requested one improvement and tested the changed behavior.'] },
    quiz: [
      { prompt: 'What belongs in a manageable first version?', choices: ['Every future feature', 'Payments and accounts before anything else', 'One useful activity-list workflow you can test'], answer: 2 },
      { prompt: 'Replit says the app is ready. What comes next?', choices: ['Try its main actions in Preview', 'Assume every feature works', 'Share private information in it immediately'], answer: 0 },
      { prompt: 'Do you have to publish to finish this exercise?', choices: ['Yes, testing only works after publishing', 'No, try and improve the app before deciding to share it', 'Yes, every conversation publishes automatically'], answer: 1 },
    ],
  },
  {
    ...base, title: 'Create a Design and Image',
    summary: 'Your app can work and still not feel quite how you imagined. Design helps you explore how it looks and how people find their way around it.',
    outcomes: ['Describe a visual direction in everyday language', 'Review a design against its purpose', 'Create an image and refine one detail'],
    sections: [
      { heading: 'Describe a feeling and a purpose', body: 'For your gathering, you might want a friendly, welcoming page with clear activity cards. You can describe colors, spacing, and the mood without knowing design terminology. Say who will use it and which action should be easy to find.' },
      { heading: 'Explore before changing the app', body: 'Ask Replit for a design direction. Make it clear whether you want to explore an idea or apply it to your existing app. Compare readability, the main action, and how the page fits your audience. Looking good is only part of a useful design.' },
      { heading: 'Create a supporting image', body: 'An image can make the idea feel more real. Describe its subject, style, and where it will appear. Use an original illustration rather than copying a brand or someone else’s artwork.', prompt: 'Create an original, warm illustration of neighbors gathering around a shared table. Use a simple style and soft colors, with no text or logos. It will be a wide header image for a gathering planner.', afterPrompt: 'Inspect the result. Does it fit the page? Is there room for the heading? Ask for one change, such as a quieter background, and compare the versions.' },
      { heading: 'Keep exploring at your own pace', body: 'You’ve moved from a question to useful context, a plan, a recurring-task proposal, an app, and a visual direction. These are options you can combine, not a checklist for every project. Choose the next step that helps your idea. More in-depth lessons are coming soon.' },
    ],
    practice: { prompt: 'Explore a design for my neighborhood gathering planner. Make it warm and welcoming, with readable activity cards and an obvious Add activity button. Show a first direction without changing or publishing my existing app.', checks: ['I reviewed a design for readability and its main action.', 'I requested an original image and reviewed one refinement.'] },
    quiz: [
      { prompt: 'What makes a useful design request?', choices: ['The audience, purpose, and visual direction you want', 'Only “make it better”', 'A requirement to use technical design terms'], answer: 0 },
      { prompt: 'What should you check besides appearance?', choices: ['How many colors are available', 'Whether people can read the content and find the main action', 'Whether every element is animated'], answer: 1 },
      { prompt: 'What is a useful next step after the first image?', choices: ['Accept it without looking', 'Change the whole project automatically', 'Review it in context and request one specific refinement'], answer: 2 },
    ],
  },
];
