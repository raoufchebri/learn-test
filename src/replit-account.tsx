import { useEffect, useRef, useState } from "react";
import { BadgeCheck, ChevronDown, ExternalLink, FolderKanban, LoaderCircle, LogOut, RefreshCw, UserRound, Mail } from "lucide-react";

type ReplitUser = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  emailVerified: boolean;
  profileImageUrl?: string;
};

type AuthSession =
  | { authenticated: false }
  | {
      authenticated: true;
      user: ReplitUser;
    };

type McpAppsContext =
  | { status: "reauth_required" }
  | { status: "temporarily_unavailable" }
  | {
      status: "ready";
      apps: Array<{ id: string; title: string; url?: string; updatedAt?: string }>;
    };

function displayName(user: ReplitUser): string {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username;
}

function initials(user: ReplitUser): string {
  const name = displayName(user);
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "R";
}

function announceAuth(authenticated: boolean) {
  window.dispatchEvent(new CustomEvent("replit-auth-changed", { detail: { authenticated } }));
}

export function ReplitAccount() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [mcpApps, setMcpApps] = useState<McpAppsContext | null>(null);
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { credentials: "same-origin", headers: { accept: "application/json" } })
      .then((response) => response.ok ? response.json() as Promise<AuthSession> : Promise.reject())
      .then((value) => {
        if (!active) return;
        setSession(value);
        announceAuth(value.authenticated);
      })
      .catch(() => {
        if (!active) return;
        setSession({ authenticated: false });
        announceAuth(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!session?.authenticated) {
      setMcpApps(null);
      return;
    }
    let active = true;
    fetch("/api/mcp/apps", { credentials: "same-origin", headers: { accept: "application/json" } })
      .then((response) => response.json() as Promise<McpAppsContext>)
      .then((value) => { if (active) setMcpApps(value); })
      .catch(() => { if (active) setMcpApps({ status: "temporarily_unavailable" }); });
    return () => { active = false; };
  }, [session]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (panel.current && !panel.current.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const signIn = () => {
    const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.assign(`/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  };

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    setSession({ authenticated: false });
    announceAuth(false);
    setOpen(false);
  };

  const reconnect = () => {
    const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.assign(`/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  };

  if (session === null) {
    return <button className="account-trigger account-loading" aria-label="Checking Replit session" disabled><LoaderCircle size={16} /></button>;
  }

  if (!session.authenticated) {
    return <button className="replit-sign-in" onClick={signIn}><UserRound size={16} /> Sign in</button>;
  }

  const { user } = session;
  return <div className="replit-account" ref={panel}>
    <button className="account-trigger" onClick={() => setOpen((value) => !value)} aria-haspopup="menu" aria-expanded={open}>
      {user.profileImageUrl ? <img src={user.profileImageUrl} alt="" referrerPolicy="no-referrer" /> : <span>{initials(user)}</span>}
      <strong>{user.username}</strong>
      <ChevronDown size={14} />
    </button>
    {open && <div className="account-panel" role="menu">
      <header>
        {user.profileImageUrl ? <img src={user.profileImageUrl} alt="" referrerPolicy="no-referrer" /> : <span>{initials(user)}</span>}
        <div><strong>{displayName(user)}</strong><small>@{user.username}</small></div>
      </header>
      {user.email && <section className="account-identity" aria-label="Replit account details">
        <p>Replit account</p>
        <div className="account-email">
          <Mail size={15} aria-hidden="true" />
          <span><strong>{user.email}</strong><small>{user.emailVerified ? "Verified email" : "Email not verified"}</small></span>
          {user.emailVerified && <BadgeCheck className="account-verified" size={16} aria-label="Verified email" />}
        </div>
      </section>}
      <section className="account-context" aria-label="Replit MCP app access">
        <p>Replit MCP</p>
        {mcpApps === null && <div className="account-context-message"><LoaderCircle className="account-context-spinner" size={15} /><span>Loading your Replit apps…</span></div>}
        {mcpApps?.status === "reauth_required" && <div className="account-context-message account-context-action">
          <RefreshCw size={15} />
          <span><strong>Connect Ask AI to Replit</strong><small>Sign in to grant read-only access to the apps you can edit.</small></span>
          <button onClick={reconnect}>Connect</button>
        </div>}
        {mcpApps?.status === "temporarily_unavailable" && <div className="account-context-message">
          <span><strong>Replit apps are unavailable</strong><small>Your Learn sign-in is still active. Try again later.</small></span>
        </div>}
        {mcpApps?.status === "ready" && <>
          <div className="account-projects">
            <div><FolderKanban size={15} aria-hidden="true" /><strong>Recent apps</strong></div>
            {mcpApps.apps.length === 0
              ? <small>No editable apps found.</small>
              : <ul>{mcpApps.apps.slice(0, 5).map((app) => <li key={app.id}>
                {app.url
                  ? <a href={app.url} target="_blank" rel="noreferrer"><span>{app.title}</span><ExternalLink size={12} /></a>
                  : <span>{app.title}</span>}
              </li>)}</ul>}
          </div>
        </>}
      </section>
      <footer>
        <small>Signed in securely with Replit</small>
        <button onClick={signOut} role="menuitem"><LogOut size={14} /> Sign out of Learn</button>
      </footer>
    </div>}
  </div>;
}
