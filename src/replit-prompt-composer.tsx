import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp, FileText, FolderKanban, LoaderCircle, LogIn, Slash, UserRound, X } from "lucide-react";

export type DocsSlashPage = { label: string; path: string; section: string };
export type AskDocsReference = Pick<DocsSlashPage, "label" | "path">;

type ReplitPromptComposerProps = {
  value: string;
  loading: boolean;
  selectedAppId: string;
  selectedDocs: AskDocsReference[];
  docsPages: DocsSlashPage[];
  layout?: "page" | "panel";
  onChange: (value: string) => void;
  onAppChange: (appId: string) => void;
  onDocsChange: (pages: AskDocsReference[]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

type AuthState = "checking" | "authenticated" | "signed-out";
type AuthChangedEvent = CustomEvent<{ authenticated: boolean }>;
type McpApp = { id: string; title: string };
type McpAppsResponse =
  | { status: "ready"; apps: McpApp[] }
  | { status: "reauth_required" | "temporarily_unavailable" };
type SlashOption =
  | { key: string; type: "project"; app: McpApp }
  | { key: string; type: "docs"; page: DocsSlashPage };

const slashPattern = /(?:^|\s)\/([^\s]*)$/;

/** Replit-style Ask AI composer with slash-driven project and docs context. */
export function ReplitPromptComposer({
  value,
  loading,
  selectedAppId,
  selectedDocs,
  docsPages,
  layout = "page",
  onChange,
  onAppChange,
  onDocsChange,
  onSubmit,
}: ReplitPromptComposerProps) {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [apps, setApps] = useState<McpApp[]>([]);
  const [appsStatus, setAppsStatus] = useState<"idle" | "loading" | "ready" | "reauth_required" | "unavailable">("idle");
  const [editorFocused, setEditorFocused] = useState(false);
  const [activeOption, setActiveOption] = useState(0);
  const slashMatch = value.match(slashPattern);
  const slashQuery = slashMatch?.[1]?.toLocaleLowerCase() ?? "";
  const slashOpen = editorFocused && Boolean(slashMatch);
  const simulatedRecipe = ['localhost', '127.0.0.1'].includes(window.location.hostname) && selectedAppId === 'simulated-recipe-context';
  const selectedApp = simulatedRecipe ? { id: selectedAppId, title: 'Recipe Box · simulation' } : apps.find((app) => app.id === selectedAppId);
  const canSubmit = value.trim().length > 0 && !loading;

  const projectOptions = useMemo(() => apps
    .filter((app) => !slashQuery || app.title.toLocaleLowerCase().includes(slashQuery))
    .slice(0, 6)
    .map((app): SlashOption => ({ key: `project:${app.id}`, type: "project", app })), [apps, slashQuery]);
  const docsOptions = useMemo(() => docsPages
    .filter((page) => {
      if (selectedDocs.some((selected) => selected.path === page.path)) return false;
      const searchable = `${page.label} ${page.path} ${page.section}`.toLocaleLowerCase();
      return !slashQuery || searchable.includes(slashQuery);
    })
    .slice(0, 8)
    .map((page): SlashOption => ({ key: `docs:${page.path}`, type: "docs", page })), [docsPages, selectedDocs, slashQuery]);
  const options = [...projectOptions, ...docsOptions];

  useEffect(() => { setActiveOption(0); }, [slashQuery]);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { credentials: "same-origin", headers: { accept: "application/json" } })
      .then((response) => response.ok ? response.json() as Promise<{ authenticated: boolean }> : Promise.reject())
      .then((session) => { if (active) setAuthState(session.authenticated ? "authenticated" : "signed-out"); })
      .catch(() => { if (active) setAuthState("signed-out"); });
    const handleAuthChanged = (event: Event) => setAuthState((event as AuthChangedEvent).detail.authenticated ? "authenticated" : "signed-out");
    window.addEventListener("replit-auth-changed", handleAuthChanged);
    return () => {
      active = false;
      window.removeEventListener("replit-auth-changed", handleAuthChanged);
    };
  }, []);

  useEffect(() => {
    if (authState === "signed-out") {
      setApps([]);
      setAppsStatus("idle");
      onAppChange("");
      return;
    }
    if (authState === "checking") return;
    let active = true;
    setAppsStatus("loading");
    fetch("/api/mcp/apps", { credentials: "same-origin", headers: { accept: "application/json" } })
      .then((response) => response.json() as Promise<McpAppsResponse>)
      .then((context) => {
        if (!active) return;
        if (context.status === "ready") {
          setApps(context.apps);
          setAppsStatus("ready");
        } else {
          setApps([]);
          setAppsStatus(context.status === "reauth_required" ? "reauth_required" : "unavailable");
          if (!simulatedRecipe) onAppChange("");
        }
      })
      .catch(() => {
        if (!active) return;
        setApps([]);
        setAppsStatus("unavailable");
        if (!simulatedRecipe) onAppChange("");
      });
    return () => { active = false; };
  }, [authState, onAppChange]);

  const signIn = () => {
    const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.assign(`/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  };
  const clearSlashToken = () => onChange(value.replace(/(^|\s)\/[^\s]*$/, "$1"));
  const selectOption = (option: SlashOption) => {
    clearSlashToken();
    if (option.type === "project") onAppChange(option.app.id);
    else onDocsChange([...selectedDocs, { label: option.page.label, path: option.page.path }].slice(-5));
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (slashOpen && options.length > 0) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const direction = event.key === "ArrowDown" ? 1 : -1;
        setActiveOption((current) => (current + direction + options.length) % options.length);
        return;
      }
      if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
        event.preventDefault();
        selectOption(options[activeOption] ?? options[0]);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        clearSlashToken();
        return;
      }
    }
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (canSubmit) event.currentTarget.form?.requestSubmit();
    }
  };

  if (authState !== "authenticated") {
    return <section className="ask-composer replit-prompt-composer replit-prompt-auth-gate" aria-live="polite">
      <div className="replit-prompt-auth-message">
        <span className="replit-prompt-auth-icon" aria-hidden="true">{authState === "checking" ? <LoaderCircle className="replit-prompt-spinner" size={20} /> : <UserRound size={20} strokeWidth={1.7} />}</span>
        <span className="replit-prompt-auth-copy"><strong>{authState === "checking" ? "Checking your Replit session…" : "Sign in to use Ask AI"}</strong><small>{authState === "checking" ? "This should only take a moment." : "Connect Replit so Ask AI can securely work with your apps through MCP."}</small></span>
      </div>
      {authState === "signed-out" && <button className="replit-prompt-auth-button" type="button" onClick={signIn}><LogIn size={16} strokeWidth={1.8} />Sign in with Replit</button>}
    </section>;
  }

  return <form className={`ask-composer replit-prompt-composer ${layout === "panel" ? "replit-prompt-panel" : ""}`} onSubmit={onSubmit}>
    {slashOpen && <div className="replit-slash-menu" id="ask-ai-slash-menu" role="listbox" aria-label="Add context">
      <header><span><Slash size={14} /> Add context</span><small>{slashQuery ? `Results for “${slashQuery}”` : "Projects and lessons"}</small></header>
      {projectOptions.length > 0 && <div className="replit-slash-group"><p>Projects</p>{projectOptions.map((option) => option.type === "project" && <button key={option.key} type="button" role="option" aria-selected={options[activeOption]?.key === option.key} className={options[activeOption]?.key === option.key ? "active" : ""} onMouseDown={(event) => { event.preventDefault(); selectOption(option); }}><span><FolderKanban size={16} /></span><b>{option.app.title}</b><small>Replit project</small></button>)}</div>}
      {appsStatus === "loading" && <div className="replit-slash-status"><LoaderCircle className="replit-prompt-spinner" size={15} /> Loading projects…</div>}
      {appsStatus === "reauth_required" && <div className="replit-slash-status">Reconnect Replit to load projects.</div>}
      {appsStatus === "unavailable" && <div className="replit-slash-status">Projects are temporarily unavailable.</div>}
      {docsOptions.length > 0 && <div className="replit-slash-group"><p>Learn</p>{docsOptions.map((option) => option.type === "docs" && <button key={option.key} type="button" role="option" aria-selected={options[activeOption]?.key === option.key} className={options[activeOption]?.key === option.key ? "active" : ""} onMouseDown={(event) => { event.preventDefault(); selectOption(option); }}><span><FileText size={16} /></span><b>{option.page.label}</b><small>{option.page.section}</small></button>)}</div>}
      {options.length === 0 && appsStatus !== "loading" && <div className="replit-slash-empty">No matching projects or Learn pages.</div>}
      <footer><span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span><span><kbd>↵</kbd> Add</span><span><kbd>esc</kbd> Close</span></footer>
    </div>}

    {(selectedApp || selectedDocs.length > 0) && <div className="replit-context-chips" aria-label="Selected context">
      {selectedApp && <span className="replit-context-chip project"><FolderKanban size={14} /><b>{selectedApp.title}</b><button type="button" onClick={() => onAppChange("")} aria-label={`Remove ${selectedApp.title}`}><X size={13} /></button></span>}
      {selectedDocs.map((page) => <span className="replit-context-chip docs" key={page.path}><FileText size={14} /><b>{page.label}</b><button type="button" onClick={() => onDocsChange(selectedDocs.filter((selected) => selected.path !== page.path))} aria-label={`Remove ${page.label}`}><X size={13} /></button></span>)}
    </div>}

    <label className="replit-prompt-editor"><span className="sr-only">Ask Replit Learn</span><textarea
      aria-label="Ask Replit Learn"
      aria-controls={slashOpen ? "ask-ai-slash-menu" : undefined}
      aria-expanded={slashOpen}
      rows={1}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onFocus={() => setEditorFocused(true)}
      onBlur={() => setEditorFocused(false)}
      onKeyDown={handleKeyDown}
      placeholder={selectedApp ? `Ask about ${selectedApp.title}…` : "Ask Replit Learn, or type / to add context…"}
    /></label>

    <footer className="replit-prompt-footer">
      <span className="replit-prompt-hint">Type / to add a project or Learn page</span>
      <button className="replit-prompt-submit" type="submit" aria-label="Send question" disabled={!canSubmit} title="Send question">{loading ? <LoaderCircle className="replit-prompt-spinner" size={18} /> : <ArrowUp size={20} strokeWidth={1.65} />}</button>
    </footer>
  </form>;
}
