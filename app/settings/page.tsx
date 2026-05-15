"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const PLATFORMS = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram_reel", label: "Instagram Reels" },
  { value: "youtube_short", label: "YouTube Shorts" },
  { value: "youtube_long", label: "YouTube (long)" },
];

interface Channel {
  name: string;
  niche: string;
  platform: string;
  targetAudience: string;
  style: string;
  goal: string;
}

const EMPTY: Channel = {
  name: "",
  niche: "",
  platform: "tiktok",
  targetAudience: "",
  style: "",
  goal: "",
};

const CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.78)",
  backdropFilter: "blur(24px) saturate(1.4)",
  WebkitBackdropFilter: "blur(24px) saturate(1.4)",
  border: "1px solid rgba(255,255,255,0.65)",
  boxShadow: "0 4px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
  borderRadius: 12,
  padding: "20px",
};

export default function SettingsPage() {
  const [form, setForm] = useState<Channel>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/channel")
      .then((r) => r.json())
      .then((data) => {
        setForm({
          name: data.name ?? "",
          niche: data.niche ?? "",
          platform: data.platform ?? "tiktok",
          targetAudience: data.targetAudience ?? "",
          style: data.style ?? "",
          goal: data.goal ?? "",
        });
      })
      .catch(() => {});
  }, []);

  const set =
    (field: keyof Channel) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
        <Link href="/" style={{ color: "#71717a", textDecoration: "none", fontSize: 14 }}>
          ← Dashboard
        </Link>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#18181b" }}>Kanal-Einstellungen</h1>
      </div>
      <p style={{ color: "#71717a", fontSize: 14, marginBottom: 32 }}>
        Diese Infos werden genutzt um Content-Ideen und Scripts speziell für deinen Kanal zu generieren.
      </p>

      <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Fieldset legend="Dein Kanal">
          <Field label="Kanal-Name (optional)">
            <input value={form.name} onChange={set("name")} placeholder="z.B. @maxmustermann" />
          </Field>
          <Field label="Haupt-Plattform">
            <select value={form.platform} onChange={set("platform")}>
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
        </Fieldset>

        <Fieldset legend="Content-Strategie">
          <Field label="Nische / Thema *">
            <input
              required
              value={form.niche}
              onChange={set("niche")}
              placeholder="z.B. Online Business, Fitness, Personal Finance, Trading…"
            />
          </Field>
          <Field label="Zielgruppe">
            <input
              value={form.targetAudience}
              onChange={set("targetAudience")}
              placeholder="z.B. Männer 18–28 die online Geld verdienen wollen"
            />
          </Field>
          <Field label="Content-Stil">
            <input
              value={form.style}
              onChange={set("style")}
              placeholder="z.B. Motivierend, direkt, authentisch, humorvoll…"
            />
          </Field>
          <Field label="Dein Hauptziel">
            <input
              value={form.goal}
              onChange={set("goal")}
              placeholder="z.B. Email-Liste aufbauen, Kurs verkaufen, Reichweite wachsen…"
            />
          </Field>
        </Fieldset>

        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid rgba(220,38,38,0.25)",
              borderRadius: 8,
              padding: "12px 16px",
              color: "#dc2626",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              background: "#2563eb",
              color: "#fff",
              padding: "12px 28px",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              opacity: saving ? 0.6 : 1,
              border: "none",
              cursor: saving ? "default" : "pointer",
              boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
            }}
          >
            {saving ? "Speichern…" : "Einstellungen speichern"}
          </button>
          {saved && <span style={{ color: "#16a34a", fontSize: 14, fontWeight: 600 }}>✓ Gespeichert</span>}
        </div>
      </form>
    </div>
  );
}

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset
      style={{
        background: "rgba(255,255,255,0.78)",
        backdropFilter: "blur(24px) saturate(1.4)",
        WebkitBackdropFilter: "blur(24px) saturate(1.4)",
        border: "1px solid rgba(255,255,255,0.65)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
        borderRadius: 10,
        ...CARD,
      }}
    >
      <legend
        style={{
          color: "#a1a1aa",
          fontSize: 12,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 1,
          padding: "0 8px",
        }}
      >
        {legend}
      </legend>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{children}</div>
    </fieldset>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 12,
          color: "#71717a",
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
