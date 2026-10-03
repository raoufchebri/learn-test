import { useEffect, useRef, useState } from "react";
import type { TimedBlock } from "./lesson-transcript";

/**
 * Drives transcript highlighting. Uses real audio timings when a lesson has
 * narration; otherwise runs a silent preview clock over estimated timings.
 */
export function useLessonNarration(timingsUrl?: string, estimatedBlocks?: TimedBlock[]) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [blocks, setBlocks] = useState<TimedBlock[]>([]);
  const [time, setTime] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [timingError, setTimingError] = useState(false);
  const [followNarration, setFollowNarration] = useState(true);
  const lastScroll = useRef(0);
  const timeRef = useRef(-1);
  timeRef.current = time;
  const duration = blocks.at(-1)?.words.at(-1)?.end ?? 0;
  const estimated = !timingsUrl && blocks.length > 0;
  const activeWord = blocks.flatMap((block, blockIndex) =>
    block.words.map((word, wordIndex) => ({ ...word, id: `${blockIndex}:${wordIndex}` }))
  ).find(word => time >= word.start && time < word.end)?.id;
  useEffect(() => {
    if (!playing || !followNarration || !activeWord) return;
    const lesson = audioRef.current?.closest("article") ?? document.querySelector("article.lesson-content");
    const word = lesson?.querySelector<HTMLElement>(".narration-word.is-speaking");
    if (!word) return;
    if (word.closest(".lesson-sticky-header")) return;
    const rect = word.getBoundingClientRect();
    const headerBottom = lesson?.querySelector(".lesson-sticky-header")?.getBoundingClientRect().bottom ?? 0;
    let top = Math.max(48, headerBottom + 24);
    let bottom = window.innerHeight - 96;
    // Honor the lesson pane as well as the browser viewport on split layouts.
    for (let parent = word.parentElement; parent; parent = parent.parentElement) {
      if (/(auto|scroll|hidden)/.test(getComputedStyle(parent).overflowY)) {
        const bounds = parent.getBoundingClientRect();
        top = Math.max(top, bounds.top + 32);
        bottom = Math.min(bottom, bounds.bottom - 48);
      }
    }
    if (rect.top >= top && rect.bottom <= bottom) return;
    if (performance.now() - lastScroll.current < 1000) return;
    lastScroll.current = performance.now();
    word.style.scrollMarginTop = `${top + 24}px`;
    word.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      block: "start", inline: "nearest",
    });
  }, [activeWord, playing, followNarration]);
  useEffect(() => {
    setBlocks([]); setTime(-1); setPlaying(false); setTimingError(false);
    if (!timingsUrl) {
      if (estimatedBlocks?.length) setBlocks(estimatedBlocks);
      return;
    }
    const controller = new AbortController();
    fetch(timingsUrl, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(data => {
        if (!Array.isArray(data.blocks) || !data.blocks.every((block: TimedBlock) =>
          typeof block.text === "string" && Array.isArray(block.words) &&
          block.words.length === block.text.match(/\S+/g)?.length &&
          block.words.every(word => Number.isFinite(word.start) && Number.isFinite(word.end) && word.end >= word.start))) throw new Error();
        if (!controller.signal.aborted) setBlocks(data.blocks);
      })
      .catch(() => { if (!controller.signal.aborted) setTimingError(true); });
    return () => controller.abort();
  }, [timingsUrl, estimatedBlocks]);
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      if (audioRef.current) setTime(audioRef.current.currentTime);
      else {
        const next = Math.max(0, timeRef.current) + (now - last) / 1000;
        if (next >= duration) { setPlaying(false); setTime(-1); return; }
        setTime(next);
      }
      last = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, duration]);
  const blockFor = (text: string) => blocks.find(item => item.text.toLowerCase() === text.trim().toLowerCase());
  const renderText = (text: string) => {
    const block = blockFor(text);
    if (!block) return text;
    let wordIndex = 0;
    return text.split(/(\s+)/).map((part, index) => {
      if (!part || /^\s+$/.test(part)) return part;
      const word = block.words[wordIndex++];
      const active = word && time >= word.start && time < word.end;
      return <span key={index} className={active ? "narration-word is-speaking" : "narration-word"}>{part}</span>;
    });
  };
  const timeFor = (text: string) => {
    const block = blockFor(text);
    const start = block?.words[0]?.start;
    if (start === undefined) return undefined;
    return { start, end: block!.words.at(-1)!.end };
  };
  return {
    audioRef, renderText, timeFor, timingError, followNarration, setFollowNarration, blocks, time, playing, estimated,
    seek: (seconds: number) => {
      if (audioRef.current) audioRef.current.currentTime = seconds;
      setTime(seconds);
    },
    pause: () => { if (audioRef.current) audioRef.current.pause(); else setPlaying(false); },
    togglePreview: () => setPlaying(current => !current),
    audioEvents: {
      onPlay: () => setPlaying(true),
      onPause: () => { setPlaying(false); setTime(audioRef.current?.currentTime ?? -1); },
      onTimeUpdate: () => setTime(audioRef.current?.currentTime ?? -1),
      onSeeked: () => setTime(audioRef.current?.currentTime ?? -1),
      onEnded: () => { setPlaying(false); setTime(-1); },
      onEmptied: () => { setPlaying(false); setTime(-1); },
    },
  };
}
