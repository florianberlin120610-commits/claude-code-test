"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

const CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.78)",
  backdropFilter: "blur(24px) saturate(1.4)",
  WebkitBackdropFilter: "blur(24px) saturate(1.4)",
  border: "1px solid rgba(255,255,255,0.65)",
  boxShadow: "0 4px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
  borderRadius: 10,
  padding: "20px",
};

const LEGEND: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: 12,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 1,
  padding: "0 8px",
};

export default function NewPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
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
      setError(err instanceof Error ? err.message : "Fehler beim Speichern");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <Link href="/" style={{ color: "#71717a", textDecoration: "none", fontSize: 14 }}>← Dashboard</Link>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#18181b" }}>Neuer Post</h1>
      </div>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        <fieldset style={CARD}>
          <legend style={LEGEND}>Basisdaten</legend>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Titel *">
              <input required value={form.title} onChange={set("title")} placeholder="z.B. 5 Fehler die dich arm halten" />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Plattform *">
                <select value={form.platform} onChange={set("platform")}>
                  {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </Field>
              <Field label="Status *">
                <select value={form.status} onChange={set("status")}>
                  {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Datum & Uhrzeit *">
                <input type="datetime-local" value={form.publishedAt} onChange={set("publishedAt")} />
              </Field>
              <Field label="Dauer (Sekunden)">
                <input type="number" value={form.durationSeconds} onChange={set("durationSeconds")} placeholder="z.B. 45" min={0} />
              </Field>
            </div>
          </div>
        </fieldset>

        <fieldset style={CARD}>
          <legend style={LEGEND}>Hook</legend>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Hook-Typ *">
                <select value={form.hookType} onChange={set("hookType")}>
                  {HOOK_TYPES.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                </select>
              </Field>
              <Field label="Thema *">
                <select value={form.topicCategory} onChange={set("topicCategory")}>
                  {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Hook-Text (erste 5–7 Wörter)">
              <input value={form.hookText} onChange={set("hookText")} placeholder="z.B. 5 Fehler die dich arm..." maxLength={100} />
            </Field>
          </div>
        </fieldset>

        <fieldset style={CARD}>
          <legend style={LEGEND}>Metriken</legend>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Views">
              <input type="number" value={form.views} onChange={set("views")} placeholder="0" min={0} />
            </Field>
            <Field label="Likes">
              <input type="number" value={form.likes} onChange={set("likes")} placeholder="0" min={0} />
            </Field>
            <Field label="Kommentare">
              <input type="number" value={form.comments} onChange={set("comments")} placeholder="0" min={0} />
            </Field>
            <Field label="Shares">
              <input type="number" value={form.shares} onChange={set("shares")} placeholder="0" min={0} />
            </Field>
            <Field label="Link Clicks">
              <input type="number" value={form.linkClicks} onChange={set("linkClicks")} placeholder="optional" min={0} />
            </Field>
            <Field label="Käufe / Conversions">
              <input type="number" value={form.purchases} onChange={set("purchases")} placeholder="optional" min={0} />
            </Field>
          </div>
        </fieldset>

        <fieldset style={CARD}>
          <legend style={LEGEND}>Extras</legend>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 24 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "#18181b", fontSize: 14 }}>
                <input type="checkbox" checked={form.hasCta} onChange={set("hasCta")} />
                Hat CTA
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "#18181b", fontSize: 14 }}>
                <input type="checkbox" checked={form.isSeries} onChange={set("isSeries")} />
                Teil einer Serie
              </label>
            </div>
            {form.isSeries && (
              <Field label="Serienname">
                <input value={form.seriesName} onChange={set("seriesName")} placeholder="z.B. Creator Habits" />
              </Field>
            )}
          </div>
        </fieldset>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid rgba(220,38,38,0.25)", borderRadius: 8, padding: "12px 16px", color: "#dc2626", fontSize: 14 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          <button type="submit" disabled={loading} style={{
            background: "#2563eb",
            color: "#fff",
            padding: "12px 28px",
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            opacity: loading ? 0.6 : 1,
            boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
          }}>
            {loading ? "Speichern…" : "Post speichern"}
          </button>
          <Link href="/" style={{
            background: "rgba(255,255,255,0.7)",
            color: "#71717a",
            padding: "12px 20px",
            borderRadius: 8,
            fontSize: 15,
            textDecoration: "none",
            border: "1px solid rgba(0,0,0,0.08)",
          }}>
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, color: "#71717a", marginBottom: 6, fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}
