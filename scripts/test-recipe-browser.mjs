import assert from "node:assert/strict";
import { build } from "esbuild";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
const content = await build({ entryPoints: ["src/learn-content.ts"], bundle: true, write: false, format: "esm" });
const { appFoundationLessons, learnDisplayTitle } = await import(`data:text/javascript;base64,${Buffer.from(content.outputFiles[0].text).toString("base64")}`);
const lessons = appFoundationLessons.slice(1, 4);
assert.equal(lessons.length, 3);
assert.equal(appFoundationLessons.some(lesson => lesson.title === "App Architecture"), false);
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 }, reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  let saved = { status: "idle" };
  let creates = 0;
  let asks = 0;
  let failNextAsk = true;
  const requests = [];
  // All app calls are mocked. This test never creates an app or uses credits.
  await page.route("**/*", async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.hostname !== "localhost") return route.abort();
    if (url.pathname === '/api/activities/recipe/iterate') return route.fulfill({ json: { accepted: true } });
    if (url.pathname === "/api/activities/recipe") {
      if (request.method() === "POST") {
        creates++;
        await new Promise(resolve => setTimeout(resolve, 1500));
        saved = { status: "creating", replId: "fixture", replUrl: "https://replit.com/@fixture/recipe" };
      }
      return route.fulfill({ json: { build: saved, canCreate: true } });
    }
    if (url.pathname === "/api/activities/recipe/events") {
      saved = { ...saved, status: "complete", previewUrl: "https://fixture.replit.dev" };
      return route.fulfill({ contentType: "text/event-stream", body: 'data: {"status":"complete"}\n\n' });
    }
    if (url.pathname === "/api/ask") {
      asks++;
      requests.push(request.postDataJSON());
      if (failNextAsk) { failNextAsk = false; return route.fulfill({ status: 503, json: { error: "ask_temporarily_unavailable" } }); }
      return route.fulfill({ contentType: "application/x-ndjson", body: [
        JSON.stringify({ type: "meta", kind: "project", sources: [] }),
        JSON.stringify({ type: "delta", text: "Inspected the recipe project. Its form is in src/App.tsx. This fixture represents a real project response." }),
        JSON.stringify({ type: "done" }),
      ].join("\n") + "\n" });
    }
    if (url.pathname === "/api/mcp/apps") return route.fulfill({ json: { status: "ready", apps: [] } });
    if (url.pathname.startsWith("/api/")) return route.fulfill({ json: { authenticated: true, user: { username: "test" } } });
    return route.continue();
  });
  await page.goto("http://localhost:4173/learn/app-foundations/projects-code-and-files");
  await page.waitForURL('**/what-is-an-app');
  await page.goto("http://localhost:4173/learn/app-foundations/what-is-an-app");
  await page.waitForURL("**/what-is-an-app");
  const create = page.getByRole("button", { name: "Click here to create the app", exact: true });
  await create.waitFor();
  assert.equal(await page.locator(".lesson-quiz").count(), 0);
  await create.click();
  await page.getByText("Sending your request to Replit", { exact: true }).first().waitFor();
  assert.equal(saved.status, "idle", "Chat opens before the creation response");
  assert.equal(await page.locator('section.lesson-quiz').count(), 0, 'Submission alone does not unlock content');
  await page.getByText("Your first version is ready to try", { exact: true }).waitFor();
  assert.equal(creates, 1);
  assert.equal(await page.locator(".recipe-build-status progress").count(), 0);
  await page.getByRole("link", { name: "Try the app preview ↗" }).waitFor();
  for (let index = 0; index < lessons.length; index++) {
    const lesson = lessons[index];
    const slug = lesson.title.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    await page.waitForURL(`**/app-foundations/${slug}`);
    await page.getByRole('heading', { name: learnDisplayTitle(lesson.title), exact: true }).waitFor();
    if (lesson.projectTask) {
      const action = page.getByRole("button", { name: lesson.projectTask.label, exact: true });
      await action.waitFor();
      assert.equal(await page.locator(".lesson-quiz").count(), lesson.testingUnlocked ? 1 : 0);
      const chatBefore = await page.locator(".ask-conversation-question").count();
      await action.click();
      if (lesson.projectTask.id === 'project-files') {
        await page.getByRole("alert").filter({ hasText: "inspection could not finish" }).waitFor();
        assert.equal(await page.locator(".lesson-quiz").count(), lesson.testingUnlocked ? 1 : 0, "Only testing access bypasses the inspection gate");
        await action.click();
      }
      await page.getByRole("button", { name: "Project explored", exact: true }).waitFor();
      assert.ok(await page.locator(".ask-conversation-question").count() > chatBefore);
      assert.equal(requests.at(-1).appId, "fixture");
      assert.deepEqual(requests.at(-1).docs, []);
      assert.equal(requests.at(-1).question, lesson.projectTask.prompt);
    }
    if (lesson.title === 'What Is Replit Building?') {
      const checkpoint = page.locator('[aria-label="Lesson checkpoint"] .quiz-question');
      await checkpoint.nth(0).getByRole('button').nth(0).click();
      await checkpoint.nth(1).getByRole('button').nth(1).click();
      await page.getByRole('button', { name: 'Continue the lesson', exact: true }).click();
      await page.getByRole('button', { name: 'Ask Replit to make this change', exact: true }).click();
    }
    const quiz = page.locator(".lesson-quiz:not([aria-label]) .quiz-question");
    await quiz.first().waitFor();
    assert.equal(await quiz.count(), 3);
    const next = page.locator('section.lesson-quiz .recipe-create-button');
    assert.equal(await next.isDisabled(), true, `${lesson.title} starts with the next lesson locked`);
    for (let q = 0; q < 3; q++) await quiz.nth(q).getByRole("button").nth(lesson.quiz[q].answer).click();
    await page.waitForFunction(() => document.querySelector('section.lesson-quiz .recipe-create-button')?.disabled === false);
    const chatCount = await page.locator(".ask-conversation-question").count();
    if (index < lessons.length - 1) {
      await next.click();
      assert.equal(await page.locator(".ask-conversation-question").count(), chatCount, "Conversation survives lesson navigation");
    }
  }
  assert.equal(asks, 2, "Project inspection and one deliberate retry");
  assert.equal(creates, 1, "Only one creation through the entire course");
  assert.equal(await page.locator(".course-nav").getByText("App architecture", { exact: true }).count(), 0);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: "/tmp/learn-foundations-mobile.png" });
  await page.setViewportSize({ width: 1500, height: 1000 });
  await page.screenshot({ path: "/tmp/learn-foundations-desktop.png" });
  await page.reload();
  await page.waitForURL("**/what-is-an-app");
  assert.equal(creates, 1, "Refresh never recreates a saved app");
  await page.goto("http://localhost:4173/");
  assert.equal(await page.locator(".course-nav").count(), 0);
  assert.deepEqual(errors, []);
  console.log("Passed: three lessons, live-path fixtures, inspection retry, checkpoint and iteration gates, chat continuity, preview, responsive layout. No live app calls.");
} finally { await browser.close(); }
