"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const PLATFORMS = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram_reel", label: "Instagram Reel" },
  { value: "youtube_short", label: "YouTube Short" },
  { value: "youtube_long", label: "YouTube Long" },
];

const HOOK_TYPES = [
  { value: "number", label: "Number (z.B. \"5 Fehler...\")" },
  { value: "pov", label: "POV" },
  { value: "question", label: "Frage" },
  { value: "shock", label: "Shock" },
  { value: "promise", label: "Promise" },
  { value: "other", label: "Anderes" },
];

const TOPICS = ["money", "skills", "mindset", "algorithm", "lifestyle", "fitness", "business", "other"];
const STATUSES = [
  { value: "published", label: "Veröffentlicht" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Geplant" },
];

type Tab = "analyze" | "ideas" | "script";

interface Idea {
  title: string;
  hookType: string;
  hookText: string;
  topicCategory: string;
  platform: string;
  whyViral: string;
  hasCta: boolean;
}

export default function ContentLabPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("analyze");

  // Video analysis state
  const fileRef = useRef<HTMLInputElement>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisNote, setAnalysisNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [form, setForm] = useState({
    title: "",
    platform: "tiktok",
    publishedAt: new Date().toISOString().slice(0, 16),
    durationSeconds: "",
    hookType: "number",
    hookText: "",
    topicCategory: "money",
    hasCta: false,
    isSeries: false,
    seriesName: "",
    views: "",
    likes: "",
    comments: "",
    shares: "",
    linkClicks: "",
    purchases: "",
    status: "published",
    transcript: "",
    aiAnalysis: "",
  });

  // Ideas state
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [generatingIdeas, setGeneratingIdeas] = useState(false);
  const [ideasError, setIdeasError] = useState("");
  const [ideaCount, setIdeaCount] = useState(5);

  // Script state
  const [scriptTitle, setScriptTitle] = useState("");
  const [scriptHookType, setScriptHookType] = useState("number");
  const [scriptHookText, setScriptHookText] = useState("");
  const [scriptTopic, setScriptTopic] = useState("money");
  const [scriptPlatform, setScriptPlatform] = useState("tiktok");
  const [scriptDuration, setScriptDuration] = useState("");
  const [generatingScript, setGeneratingScript] = useState(false);
  const [script, setScript] = useState("");
  const [scriptError, setScriptError] = useState("");

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) =>
    setForm((f) => ({
      ...f,
      [field]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value,
    }));

  function onVideoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setVideoFile(file);
    if (file) {
      // Extract duration via browser
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.src = url;
      video.onloadedmetadata = () => {
        setForm((f) => ({ ...f, durationSeconds: String(Math.round(video.duration)) }));
        URL.revokeObjectURL(url);
      };
      // Use filename as default title if empty
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      setForm((f) => ({ ...f, title: f.title || nameWithoutExt }));
    }
  }

  async function analyzeVideo() {
    setAnalyzing(true);
    setAnalysisNote("");
    setSaveError("");
    try {
      const fd = new FormData();
      if (videoFile) fd.append("video", videoFile);
      fd.append("durationSeconds", form.durationSeconds);
      fd.append("title", form.title);

      const res = await fetch("/api/analyze-video", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      const a = data.analysis ?? {};
      setForm((f) => ({
        ...f,
        hookType: a.hookType || f.hookType,
        hookText: a.hookText || f.hookText,
        topicCategory: a.topicCategory || f.topicCategory,
        hasCta: a.hasCta ?? f.hasCta,
        isSeries: a.isSeries ?? f.isSeries,
        platform: a.platform || f.platform,
        title: a.title && !f.title ? a.title : f.title,
        transcript: data.transcript || "",
        aiAnalysis: a.analysis || "",
      }));
      setAnalysisNote(a.analysis || "Analyse abgeschlossen.");
    } catch (err: unknown) {
      setAnalysisNote("Fehler: " + (err instanceof Error ? err.message : "Unbekannter Fehler"));
    } finally {
      setAnalyzing(false);
    }
  }

  async function savePost(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          durationSeconds: Number(form.durationSeconds) || 0,
          views: Number(form.views) || 0,
          likes: Number(form.likes) || 0,
          comments: Number(form.comments) || 0,
          shares: Number(form.shares) || 0,
          linkClicks: form.linkClicks ? Number(form.linkClicks) : null,
          purchases: form.purchases ? Number(form.purchases) : null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  }

  async function generateIdeas() {
    setGeneratingIdeas(true);
    setIdeasError("");
    try {
      const res = await fetch("/api/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: ideaCount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setIdeas(data.ideas ?? []);
    } catch (err: unknown) {
      setIdeasError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setGeneratingIdeas(false);
    }
  }

  async function generateScript() {
    setGeneratingScript(true);
    setScriptError("");
    setScript("");
    try {
      const res = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: scriptTitle,
          hookType: scriptHookType,
          hookText: scriptHookText,
          topicCategory: scriptTopic,
          platform: scriptPlatform,
          durationSeconds: scriptDuration ? Number(scriptDuration) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setScript(data.script ?? "");
    } catch (err: unknown) {
      setScriptError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setGeneratingScript(false);
    }
  }

  function useIdeaForScript(idea: Idea) {
    setScriptTitle(idea.title);
    setScriptHookType(idea.hookType);
    setScriptHookText(idea.hookText);
    setScriptTopic(idea.topicCategory);
    setScriptPlatform(idea.platform);
    setTab("script");
  }

  function useIdeaForPost(idea: Idea) {
    setForm((f) => ({
      ...f,
      title: idea.title,
      hookType: idea.hookType,
      hookText: idea.hookText,
      topicCategory: idea.topicCategory,
      platform: idea.platform,
      hasCta: idea.hasCta,
    }));
    setTab("analyze");
  }

  const tabStyle = (t: Tab) => ({
    padding: "10px 20px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    background: tab === t ? "#3b82f6" : "#1a1a24",
    color: tab === t ? "#fff" : "#6b6b80",
  } as React.CSSProperties);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <Link href="/" style={{ color: "#6b6b80", textDecoration: "none", fontSize: 14 }}>
          ← Dashboard
        </Link>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Content Lab</h1>
      </div>

      {/* Tab navigation */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        <button style={tabStyle("analyze")} onClick={() => setTab("analyze")}>
          🎬 Video analysieren
        </button>
        <button style={tabStyle("ideas")} onClick={() => setTab("ideas")}>
          💡 Ideen generieren
        </button>
        <button style={tabStyle("script")} onClick={() => setTab("script")}>
          📝 Script schreiben
        </button>
      </div>

      {/* TAB: Analyze */}
      {tab === "analyze" && (
        <div>
          {/* Video upload */}
          <div
            style={{
              border: "2px dashed #2a2a38",
              borderRadius: 12,
              padding: "32px",
              textAlign: "center",
              marginBottom: 24,
              cursor: "pointer",
            }}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept="video/*,audio/*" style={{ display: "none" }} onChange={onVideoSelect} />
            {videoFile ? (
              <div>
                <div style={{ fontSize: 18, marginBottom: 8 }}>🎬 {videoFile.name}</div>
                <div style={{ color: "#6b6b80", fontSize: 13 }}>
                  {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                  {form.durationSeconds ? ` · ${form.durationSeconds}s` : ""}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    analyzeVideo();
                  }}
                  disabled={analyzing}
                  style={{
                    marginTop: 16,
                    background: "#8b5cf6",
                    color: "#fff",
                    padding: "10px 24px",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                    opacity: analyzing ? 0.6 : 1,
                  }}
                >
                  {analyzing ? "KI analysiert…" : "Mit KI analysieren"}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                <div style={{ color: "#9ca3af", fontSize: 14 }}>
                  Video oder Audio hochladen
                </div>
                <div style={{ color: "#6b6b80", fontSize: 12, marginTop: 4 }}>
                  KI analysiert Hook, Thema und Kategorie automatisch
                </div>
              </div>
            )}
          </div>

          {analysisNote && (
            <div
              style={{
                background: "#111118",
                border: "1px solid #2a2a38",
                borderRadius: 8,
                padding: "12px 16px",
                marginBottom: 20,
                color: "#9ca3af",
                fontSize: 13,
              }}
            >
              <strong style={{ color: "#e8e8f0" }}>KI-Analyse:</strong> {analysisNote}
            </div>
          )}

          {/* Post form */}
          <form onSubmit={savePost} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <fieldset style={{ border: "1px solid #2a2a38", borderRadius: 10, padding: "20px" }}>
              <legend style={legendStyle}>Basisdaten</legend>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <FormField label="Titel *">
                  <input required value={form.title} onChange={set("title")} placeholder="Post-Titel" />
                </FormField>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <FormField label="Plattform">
                    <select value={form.platform} onChange={set("platform")}>
                      {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Status">
                    <select value={form.status} onChange={set("status")}>
                      {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </FormField>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <FormField label="Datum & Uhrzeit">
                    <input type="datetime-local" value={form.publishedAt} onChange={set("publishedAt")} />
                  </FormField>
                  <FormField label="Dauer (Sekunden)">
                    <input type="number" value={form.durationSeconds} onChange={set("durationSeconds")} placeholder="z.B. 45" min={0} />
                  </FormField>
                </div>
              </div>
            </fieldset>

            <fieldset style={{ border: "1px solid #2a2a38", borderRadius: 10, padding: "20px" }}>
              <legend style={legendStyle}>Hook</legend>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <FormField label="Hook-Typ">
                    <select value={form.hookType} onChange={set("hookType")}>
                      {HOOK_TYPES.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Thema">
                    <select value={form.topicCategory} onChange={set("topicCategory")}>
                      {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </FormField>
                </div>
                <FormField label="Hook-Text (erste 5–7 Wörter)">
                  <input value={form.hookText} onChange={set("hookText")} placeholder="z.B. 5 Fehler die dich arm..." maxLength={100} />
                </FormField>
              </div>
            </fieldset>

            <fieldset style={{ border: "1px solid #2a2a38", borderRadius: 10, padding: "20px" }}>
              <legend style={legendStyle}>Metriken</legend>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                  { field: "views", label: "Views" },
                  { field: "likes", label: "Likes" },
                  { field: "comments", label: "Kommentare" },
                  { field: "shares", label: "Shares" },
                  { field: "linkClicks", label: "Link Clicks" },
                  { field: "purchases", label: "Käufe" },
                ].map((m) => (
                  <FormField key={m.field} label={m.label}>
                    <input type="number" value={(form as Record<string, unknown>)[m.field] as string} onChange={set(m.field)} placeholder="0" min={0} />
                  </FormField>
                ))}
              </div>
            </fieldset>

            {saveError && (
              <div style={{ background: "#1f0a0a", border: "1px solid #ef4444", borderRadius: 8, padding: "12px 16px", color: "#ef4444", fontSize: 14 }}>
                {saveError}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={saving}
                style={{
                  background: "#3b82f6",
                  color: "#fff",
                  padding: "12px 28px",
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? "Speichern…" : "Post speichern"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB: Ideas */}
      {tab === "ideas" && (
        <div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 12, color: "#6b6b80", marginBottom: 6 }}>
                Anzahl Ideen
              </label>
              <select
                value={ideaCount}
                onChange={(e) => setIdeaCount(Number(e.target.value))}
                style={{ width: "auto", padding: "8px 12px" }}
              >
                {[3, 5, 7, 10].map((n) => (
                  <option key={n} value={n}>{n} Ideen</option>
                ))}
              </select>
            </div>
            <button
              onClick={generateIdeas}
              disabled={generatingIdeas}
              style={{
                background: "#8b5cf6",
                color: "#fff",
                padding: "12px 24px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                opacity: generatingIdeas ? 0.6 : 1,
                alignSelf: "flex-end",
              }}
            >
              {generatingIdeas ? "KI denkt…" : "💡 Ideen generieren"}
            </button>
          </div>

          <p style={{ color: "#6b6b80", fontSize: 13, marginBottom: 20, marginTop: -8 }}>
            Basiert auf deinen Kanal-Einstellungen und deinen Top-Posts.{" "}
            <Link href="/settings" style={{ color: "#3b82f6" }}>Kanal konfigurieren →</Link>
          </p>

          {ideasError && (
            <div style={{ background: "#1f0a0a", border: "1px solid #ef4444", borderRadius: 8, padding: "12px 16px", color: "#ef4444", fontSize: 14, marginBottom: 16 }}>
              {ideasError}
            </div>
          )}

          {ideas.length === 0 && !generatingIdeas && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#6b6b80" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💡</div>
              <div>Klick auf &quot;Ideen generieren&quot; um virale Content-Ideen zu erhalten</div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {ideas.map((idea, i) => (
              <div
                key={i}
                style={{
                  background: "#111118",
                  border: "1px solid #2a2a38",
                  borderRadius: 12,
                  padding: "16px 20px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{idea.title}</div>
                    <div style={{ fontSize: 13, color: "#6b6b80", marginBottom: 6 }}>
                      Hook: &quot;{idea.hookText}&quot; · {idea.hookType} · {idea.topicCategory} · {idea.platform}
                    </div>
                    <div style={{ fontSize: 12, color: "#22c55e" }}>↑ {idea.whyViral}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => useIdeaForPost(idea)}
                      style={{
                        background: "#1a1a24",
                        color: "#9ca3af",
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: "1px solid #2a2a38",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      + Post
                    </button>
                    <button
                      onClick={() => useIdeaForScript(idea)}
                      style={{
                        background: "#8b5cf620",
                        color: "#8b5cf6",
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: "1px solid #8b5cf640",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      Script →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: Script */}
      {tab === "script" && (
        <div>
          <div style={{ background: "#111118", border: "1px solid #2a2a38", borderRadius: 12, padding: "20px 24px", marginBottom: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <FormField label="Titel / Thema *">
                <input
                  required
                  value={scriptTitle}
                  onChange={(e) => setScriptTitle(e.target.value)}
                  placeholder="z.B. 5 Fehler die dich arm halten"
                />
              </FormField>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <FormField label="Plattform">
                  <select value={scriptPlatform} onChange={(e) => setScriptPlatform(e.target.value)}>
                    {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </FormField>
                <FormField label="Hook-Typ">
                  <select value={scriptHookType} onChange={(e) => setScriptHookType(e.target.value)}>
                    {HOOK_TYPES.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                  </select>
                </FormField>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <FormField label="Thema">
                  <select value={scriptTopic} onChange={(e) => setScriptTopic(e.target.value)}>
                    {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </FormField>
                <FormField label="Dauer (Sekunden, optional)">
                  <input
                    type="number"
                    value={scriptDuration}
                    onChange={(e) => setScriptDuration(e.target.value)}
                    placeholder="z.B. 60"
                    min={0}
                  />
                </FormField>
              </div>
              <FormField label="Hook-Text (optional)">
                <input
                  value={scriptHookText}
                  onChange={(e) => setScriptHookText(e.target.value)}
                  placeholder="z.B. Die meisten Menschen wissen nicht..."
                />
              </FormField>
            </div>
          </div>

          <button
            onClick={generateScript}
            disabled={generatingScript || !scriptTitle}
            style={{
              background: "#8b5cf6",
              color: "#fff",
              padding: "12px 28px",
              borderRadius: 8,
              border: "none",
              cursor: scriptTitle ? "pointer" : "not-allowed",
              fontWeight: 600,
              fontSize: 15,
              marginBottom: 24,
              opacity: (generatingScript || !scriptTitle) ? 0.6 : 1,
            }}
          >
            {generatingScript ? "KI schreibt Script…" : "📝 Script generieren"}
          </button>

          {scriptError && (
            <div style={{ background: "#1f0a0a", border: "1px solid #ef4444", borderRadius: 8, padding: "12px 16px", color: "#ef4444", fontSize: 14, marginBottom: 16 }}>
              {scriptError}
            </div>
          )}

          {script && (
            <div style={{ background: "#111118", border: "1px solid #2a2a38", borderRadius: 12, padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 14, color: "#6b6b80", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
                  Generiertes Script
                </h3>
                <button
                  onClick={() => navigator.clipboard.writeText(script)}
                  style={{
                    background: "#1a1a24",
                    color: "#9ca3af",
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "1px solid #2a2a38",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  Kopieren
                </button>
              </div>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  fontFamily: "inherit",
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "#e8e8f0",
                  margin: 0,
                }}
              >
                {script}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const legendStyle: React.CSSProperties = {
  color: "#6b6b80",
  fontSize: 12,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 1,
  padding: "0 8px",
};

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 12,
          color: "#9ca3af",
          marginBottom: 6,
          fontWeight: 500,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
