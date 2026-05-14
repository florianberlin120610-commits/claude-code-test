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
        <Link href="/" style={{ color: "#6b6b80", textDecoration: "none", fontSize: 14 }}>← Dashboard</Link>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Neuer Post</h1>
      </div>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Basisdaten */}
        <fieldset style={{ border: "1px solid #2a2a38", borderRadius: 10, padding: "20px" }}>
          <legend style={{ color: "#6b6b80", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, padding: "0 8px" }}>
            Basisdaten
          </legend>
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

        {/* Hook */}
        <fieldset style={{ border: "1px solid #2a2a38", borderRadius: 10, padding: "20px" }}>
          <legend style={{ color: "#6b6b80", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, padding: "0 8px" }}>
            Hook
          </legend>
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

        {/* Metriken */}
        <fieldset style={{ border: "1px solid #2a2a38", borderRadius: 10, padding: "20px" }}>
          <legend style={{ color: "#6b6b80", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, padding: "0 8px" }}>
            Metriken
          </legend>
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

        {/* Extras */}
        <fieldset style={{ border: "1px solid #2a2a38", borderRadius: 10, padding: "20px" }}>
          <legend style={{ color: "#6b6b80", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, padding: "0 8px" }}>
            Extras
          </legend>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 24 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "#e8e8f0" }}>
                <input type="checkbox" checked={form.hasCta} onChange={set("hasCta")} />
                Hat CTA
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "#e8e8f0" }}>
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
          <div style={{ background: "#1f0a0a", border: "1px solid #ef4444", borderRadius: 8, padding: "12px 16px", color: "#ef4444", fontSize: 14 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          <button type="submit" disabled={loading} style={{
            background: "#3b82f6",
            color: "#fff",
            padding: "12px 28px",
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            opacity: loading ? 0.6 : 1,
          }}>
            {loading ? "Speichern…" : "Post speichern"}
          </button>
          <Link href="/" style={{
            background: "#1a1a24",
            color: "#6b6b80",
            padding: "12px 20px",
            borderRadius: 8,
            fontSize: 15,
            textDecoration: "none",
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
      <label>{label}</label>
      {children}
    </div>
  );
}
