import type { LearnLesson } from "./learn-content";

export type TimedWord = { start: number; end: number };
export type TimedBlock = { text: string; words: TimedWord[] };

// Placeholder pacing until each lesson has a recorded video with real timings.
const SECONDS_PER_WORD = 60 / 155;
const BLOCK_PAUSE = 0.45;
const HEADING_PAUSE = 0.9;

/** Builds an estimated, reading-order transcript from a lesson's own copy. */
export function buildEstimatedTranscript(lesson: LearnLesson, displayTitle: string): TimedBlock[] {
  const blocks: TimedBlock[] = [];
  const seen = new Set<string>();
  let clock = 0;
  const add = (text: string | undefined, pauseBefore = BLOCK_PAUSE) => {
    const clean = text?.trim();
    if (!clean) return;
    const key = clean.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    if (blocks.length > 0) clock += pauseBefore;
    const words = (clean.match(/\S+/g) ?? []).map(() => {
      const word = { start: clock, end: clock + SECONDS_PER_WORD * 0.9 };
      clock += SECONDS_PER_WORD;
      return word;
    });
    blocks.push({ text: clean, words });
  };

  add(displayTitle);
  add(lesson.summary);
  for (const paragraph of lesson.introduction ?? []) {
    if (typeof paragraph === "string") add(paragraph);
    else { add(paragraph.text); paragraph.items.forEach(item => add(item)); }
  }
  add(lesson.encouragement);
  for (const section of lesson.sections) {
    add(section.heading, HEADING_PAUSE);
    add(section.body);
    if (lesson.activity !== "recipe-build") add(section.afterPrompt);
    section.items?.forEach(item => add(item));
  }
  return blocks;
}

export function formatTimestamp(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}
