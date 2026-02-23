import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Star, Trash2, RefreshCw, Search, ChevronLeft,
  AlertCircle, Inbox, Send, Archive, Loader2, ExternalLink
} from "lucide-react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

// ── Gmail OAuth helper ──────────────────────────────────────
const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

async function getGmailToken() {
  const stored = sessionStorage.getItem("gmail_token");
  const expiry = sessionStorage.getItem("gmail_token_expiry");
  if (stored && expiry && Date.now() < Number(expiry)) return stored;
  // re-auth with gmail scope
  const provider = new GoogleAuthProvider();
  provider.addScope(GMAIL_SCOPE);
  provider.setCustomParameters({ prompt: "consent" });
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential?.accessToken;
  if (!token) throw new Error("Could not get Gmail access token.");
  sessionStorage.setItem("gmail_token", token);
  sessionStorage.setItem("gmail_token_expiry", String(Date.now() + 50 * 60 * 1000)); // 50 min
  return token;
}

async function fetchGmailMessages(token, query = "", maxResults = 30) {
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=${encodeURIComponent(query)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!listRes.ok) throw new Error("Gmail API error: " + listRes.status);
  const listData = await listRes.json();
  if (!listData.messages) return [];

  const messages = await Promise.all(
    listData.messages.map(async (m) => {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const msg = await msgRes.json();
      const headers = msg.payload?.headers || [];
      const get = (name) => headers.find((h) => h.name === name)?.value || "";
      return {
        id: m.id,
        threadId: msg.threadId,
        subject: get("Subject") || "(no subject)",
        from: get("From"),
        to: get("To"),
        date: get("Date"),
        snippet: msg.snippet || "",
        labelIds: msg.labelIds || [],
        isRead: !msg.labelIds?.includes("UNREAD"),
        isStarred: msg.labelIds?.includes("STARRED"),
        isImportant: msg.labelIds?.includes("IMPORTANT"),
      };
    })
  );
  return messages;
}

// ── Parse "From" header into display name + email ──────────
function parseFrom(from) {
  const match = from.match(/^(.*?)\s*<(.+?)>$/);
  if (match) return { name: match[1].replace(/"/g, "").trim(), email: match[2] };
  return { name: from, email: from };
}

function formatRelativeDate(dateStr) {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 24 * 60 * 60 * 1000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diff < 7 * 24 * 60 * 60 * 1000) return d.toLocaleDateString([], { weekday: "short" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch { return dateStr; }
}

// ── Mail Row ────────────────────────────────────────────────
function MailRow({ mail, selected, onClick }) {
  const sender = parseFrom(mail.from);
  return (
    <motion.div
      onClick={onClick}
      className="flex items-start gap-3 cursor-pointer transition-all"
      style={{
        padding: "12px 16px",
        borderBottom: "1px solid var(--border)",
        background: selected
          ? "rgba(73,89,208,0.12)"
          : mail.isRead
          ? "transparent"
          : "rgba(73,89,208,0.05)",
        borderLeft: selected ? "3px solid #4959D0" : "3px solid transparent",
      }}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ background: "rgba(73,89,208,0.08)" }}
      transition={{ duration: 0.18 }}
    >
      {/* Avatar */}
      <div
        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
        style={{ background: "linear-gradient(135deg, #4959D0, #6366f1)", color: "white" }}
      >
        {(sender.name || sender.email || "?")[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p
            className="text-sm truncate"
            style={{ color: "var(--text-primary)", fontWeight: mail.isRead ? 400 : 700 }}
          >
            {sender.name || sender.email}
          </p>
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            {mail.isStarred && <Star size={12} fill="#fbbf24" stroke="#fbbf24" />}
            {!mail.isRead && (
              <div className="w-2 h-2 rounded-full bg-[#4959D0]" />
            )}
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              {formatRelativeDate(mail.date)}
            </span>
          </div>
        </div>
        <p
          className="text-xs truncate"
          style={{ color: mail.isRead ? "var(--text-muted)" : "var(--text-primary)", fontWeight: mail.isRead ? 400 : 600 }}
        >
          {mail.subject}
        </p>
        <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
          {mail.snippet}
        </p>
      </div>
    </motion.div>
  );
}

// ── Mail Detail Panel ───────────────────────────────────────
function MailDetail({ mail, onBack }) {
  const sender = parseFrom(mail.from);
  const gmailUrl = `https://mail.google.com/mail/u/0/#inbox/${mail.id}`;

  return (
    <motion.div
      className="h-full flex flex-col"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between flex-shrink-0"
        style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)" }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm cursor-pointer rounded-lg px-3 py-1.5 transition-all"
          style={{ color: "var(--text-secondary)", background: "var(--bg-secondary)" }}
        >
          <ChevronLeft size={16} /> Back
        </button>
        <a
          href={gmailUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
          style={{ color: "#4959D0", background: "rgba(73,89,208,0.1)", border: "1px solid rgba(73,89,208,0.2)" }}
        >
          Open in Gmail <ExternalLink size={12} />
        </a>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "24px 32px" }}>
        {/* Subject */}
        <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
          {mail.subject}
        </h2>

        {/* Sender info */}
        <div
          className="flex items-center gap-3 rounded-2xl mb-6"
          style={{ padding: "14px 18px", background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #4959D0, #6366f1)", color: "white" }}
          >
            {(sender.name || "?")[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{sender.name}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{sender.email}</p>
          </div>
          <p className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>
            {formatRelativeDate(mail.date)}
          </p>
        </div>

        {/* Snippet (preview body) */}
        <div
          className="rounded-2xl"
          style={{ padding: "20px 24px", background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
        >
          <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
            {mail.snippet}
          </p>
          <a
            href={gmailUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg transition-all"
            style={{ background: "#4959D0", color: "white" }}
          >
            Read full email in Gmail <ExternalLink size={12} />
          </a>
        </div>

        {/* Labels */}
        {mail.labelIds.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {mail.labelIds.filter((l) => !["UNREAD","INBOX"].includes(l)).map((l) => (
              <span
                key={l}
                className="text-[11px] px-2 py-0.5 rounded-full"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
              >
                {l}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Connect Gmail Screen ────────────────────────────────────
function ConnectGmailPrompt({ onConnect, connecting, error }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center" style={{ padding: "40px" }}>
      <motion.div
        className="text-center max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.div
          className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #1a2a6c, #4959D0)", boxShadow: "0 8px 32px rgba(73,89,208,0.4)" }}
          animate={{ boxShadow: ["0 8px 32px rgba(73,89,208,0.3)", "0 8px 48px rgba(73,89,208,0.6)", "0 8px 32px rgba(73,89,208,0.3)"] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <Mail size={36} color="white" />
        </motion.div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Connect Your Gmail
        </h2>
        <p className="text-sm mb-8" style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
          Sign in with Google to read your Gmail inbox directly inside Task Manager. We only request read access — we never send or delete emails.
        </p>

        {error && (
          <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl text-sm text-red-400 bg-red-500/10 border border-red-500/20">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <motion.button
          onClick={onConnect}
          disabled={connecting}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-semibold text-sm text-white cursor-pointer relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #3a47b8, #4959D0)", boxShadow: "0 4px 20px rgba(73,89,208,0.4)" }}
          whileHover={{ scale: 1.02, boxShadow: "0 8px 32px rgba(73,89,208,0.6)" }}
          whileTap={{ scale: 0.98 }}
        >
          {connecting ? (
            <><Loader2 size={18} className="animate-spin" /> Connecting…</>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="rgba(255,255,255,0.7)" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="rgba(255,255,255,0.5)" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="rgba(255,255,255,0.9)" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Connect Gmail
            </>
          )}
        </motion.button>
        <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
          Read-only access • Your data stays private
        </p>
      </motion.div>
    </div>
  );
}

// ── Main Mail Page ──────────────────────────────────────────
export default function MailPage() {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [token, setToken] = useState(null);
  const [mails, setMails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filter, setFilter] = useState("INBOX");

  const FILTERS = [
    { label: "Inbox", value: "INBOX", icon: Inbox },
    { label: "Starred", value: "STARRED", icon: Star },
    { label: "Sent", value: "SENT", icon: Send },
    { label: "Archive", value: "ARCHIVE", icon: Archive },
  ];

  const loadEmails = useCallback(async (tok, q, label) => {
    setLoading(true);
    setError("");
    try {
      let query = q || "";
      if (label === "INBOX") query = `in:inbox ${query}`.trim();
      else if (label === "STARRED") query = `is:starred ${query}`.trim();
      else if (label === "SENT") query = `in:sent ${query}`.trim();
      else if (label === "ARCHIVE") query = `in:archive ${query}`.trim();
      const msgs = await fetchGmailMessages(tok, query, 30);
      setMails(msgs);
    } catch (e) {
      setError(e.message || "Failed to load emails.");
      if (e.message?.includes("401") || e.message?.includes("token")) {
        sessionStorage.removeItem("gmail_token");
        setConnected(false);
        setToken(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Restore token from session
  useEffect(() => {
    const saved = sessionStorage.getItem("gmail_token");
    const expiry = sessionStorage.getItem("gmail_token_expiry");
    if (saved && expiry && Date.now() < Number(expiry)) {
      setToken(saved);
      setConnected(true);
    }
  }, []);

  // Load emails whenever token / filter changes
  useEffect(() => {
    if (token && connected) loadEmails(token, search, filter);
  }, [token, connected, filter, search]);

  const handleConnect = async () => {
    setConnecting(true);
    setError("");
    try {
      const tok = await getGmailToken();
      setToken(tok);
      setConnected(true);
    } catch (e) {
      setError(e.message?.replace("Firebase:", "").trim() || "Connection failed.");
    } finally {
      setConnecting(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  if (!connected) {
    return (
      <div className="flex flex-col">
        <div className="flex items-center justify-between flex-shrink-0 px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Mail</h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Connect Gmail to read your emails</p>
          </div>
        </div>
        <ConnectGmailPrompt onConnect={handleConnect} connecting={connecting} error={error} />
      </div>
    );
  }

  return (
    <div className="flex">
      {/* ── Left: List panel ── */}
      <div
        className="flex flex-col flex-shrink-0"
        style={{ width: selected ? "340px" : "100%", maxWidth: "520px", borderRight: selected ? "1px solid var(--border)" : "none", transition: "width 0.3s ease" }}
      >
        {/* Header */}
        <div className="flex-shrink-0" style={{ padding: "16px 16px 0" }}>
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Mail</h1>
            <button
              onClick={() => loadEmails(token, search, filter)}
              disabled={loading}
              className="p-2 rounded-xl cursor-pointer transition-all"
              style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
            <input
              className="w-full rounded-xl text-sm outline-none"
              style={{ background: "var(--bg-secondary)", border: "1.5px solid var(--border)", color: "var(--text-primary)", padding: "8px 12px 8px 32px", height: "38px", transition: "border-color 0.2s" }}
              onFocus={(e) => { e.target.style.borderColor = "#4959D0"; }}
              onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
              placeholder="Search emails…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>

          {/* Filter tabs */}
          <div className="flex gap-1 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {FILTERS.map(({ label, value, icon: Icon }) => (
              <button
                key={value}
                onClick={() => { setFilter(value); setSelected(null); }}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all"
                style={{
                  background: filter === value ? "#4959D0" : "var(--bg-secondary)",
                  color: filter === value ? "white" : "var(--text-muted)",
                  border: filter === value ? "none" : "1px solid var(--border)",
                }}
              >
                <Icon size={12} />{label}
              </button>
            ))}
          </div>
        </div>

        {/* Email list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <Loader2 size={24} className="animate-spin" style={{ color: "#4959D0" }} />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Loading emails…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 px-6 text-center">
              <AlertCircle size={22} color="#ef4444" />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{error}</p>
              <button onClick={() => loadEmails(token, search, filter)} className="text-xs px-3 py-1.5 rounded-lg cursor-pointer" style={{ background: "#4959D0", color: "white" }}>Retry</button>
            </div>
          ) : mails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <Inbox size={28} style={{ color: "var(--text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No emails found</p>
            </div>
          ) : (
            <AnimatePresence>
              {mails.map((mail) => (
                <MailRow
                  key={mail.id}
                  mail={mail}
                  selected={selected?.id === mail.id}
                  onClick={() => setSelected(mail)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* ── Right: Detail panel ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="flex-1 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <MailDetail mail={selected} onBack={() => setSelected(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
