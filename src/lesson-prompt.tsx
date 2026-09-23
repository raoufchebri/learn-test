import { useState } from "react";

export function LessonPrompt({ prompt, copyable = false }: { prompt: string; copyable?: boolean }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  return <>
    <blockquote className="lesson-example-prompt"><p>{prompt}</p></blockquote>
    {copyable && <div className="practice-actions">
      <button type="button" onClick={async () => {
        try { await navigator.clipboard.writeText(prompt); setStatus("copied"); }
        catch { setStatus("failed"); }
      }}>{status === "copied" ? "Copied" : "Copy prompt"}</button>
      <span role="status">{status === "failed" ? "Select the prompt above and copy it manually." : "Paste it into Replit and send it there."}</span>
    </div>}
  </>;
}