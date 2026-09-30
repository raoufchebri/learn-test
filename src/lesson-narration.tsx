import { useEffect, useRef, useState } from "react";

type TimedBlock = { text: string; words: { start: number; end: number }[] };

export function useLessonNarration(timingsUrl?: string) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [blocks, setBlocks] = useState<TimedBlock[]>([]);
  const [time, setTime] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [timingError, setTimingError] = useState(false);
  useEffect(() => {
    setBlocks([]); setTime(-1); setPlaying(false); setTimingError(false);
    if (!timingsUrl) return;
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
  }, [timingsUrl]);
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = () => {
      setTime(audioRef.current?.currentTime ?? -1);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);
  const renderText = (text: string) => {
    const block = blocks.find(item => item.text.toLowerCase() === text.toLowerCase());
    if (!block) return text;
    let wordIndex = 0;
    return text.split(/(\s+)/).map((part, index) => {
      if (!part || /^\s+$/.test(part)) return part;
      const word = block.words[wordIndex++];
      const active = word && time >= word.start && time < word.end;
      return <span key={index} className={active ? "narration-word is-speaking" : "narration-word"}>{part}</span>;
    });
  };
  return {
    audioRef, renderText, timingError,
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