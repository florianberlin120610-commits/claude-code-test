"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const PLATFORMS = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram_reel", label: "Instagram Reels" },
  { value: "youtube_short", label: "YouTube Shorts" },
  { value: "youtube_long", label: "YouTube" },
];

interface Channel {
  name: string;
  niche: string;
  platform: string;
  targetAudience: string;
  style: string;
  goal: string;
}

export default function SettingsPage() {
  const [form, setForm] = useState<Channel>({
    name: "",
    niche: "",
    platform: "tiktok",
    targetAudience: "",
    style: "",
    goal: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      });
  }, []);

  const set = (field: keyof Channel) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/channel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px", color: "#6b6b80" }}>
        Lade...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <Link href="/" style={{ color: "#6b6b80", textDecoration: "none", fontSize: 14 }}>
          ← Dashboard
        </Link>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Kanal-Einstellungen</h1>
      </div>

      <p style={{ color: "#6b6b80", fontSize: 14, marginBottom: 32, marginTop: -16 }}>
        Diese Infos werden genutzt um personalisierte Content-Ideen und Scripts zu generieren.
      </p>

      <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <fieldset style={{ border: "1px solid #2a2a38", borderRadius: 10, padding: "20px" }}>
          <legend
            style={{
              color: "#6b6b80",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1,
              padding: "0 8px",
            }}
          >
            Dein Kanal
          </legend>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Kanal-Name">
              <input
                value={form.name}
                onChange={set("name")}
                placeholder="z.B. @maxmustermann"
              />
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
          </div>
        </fieldset>

        <fieldset style={{ border: "1px solid #2a2a38", borderRadius: 10, padding: "20px" }}>
          <legend
            style={{
              color: "#6b6b80",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1,
              padding: "0 8px",
            }}
          >
            Content-Strategie
          </legend>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Nische / Thema *">
              <input
                required
                value={form.niche}
                onChange={set("niche")}
                placeholder="z.B. Online Business, Fitness, Personal Finance..."
              />
            </Field>
            <Field label="Zielgruppe">
              <input
                value={form.targetAudience}
                onChange={set("targetAudience")}
                placeholder="z.B. Junge Männer 18-28 die online Geld verdienen wollen"
              />
            </Field>
            <Field label="Content-Stil">
              <input
                value={form.style}
                onChange={set("style")}
                placeholder="z.B. Motivierend, direkt, authentisch, humorvoll..."
              />
            </Field>
            <Field label="Hauptziel">
              <input
                value={form.goal}
                onChange={set("goal")}
                placeholder="z.B. Email-Liste aufbauen, Kurs verkaufen, Reichweite..."
              />
            </Field>
          </div>
        </fieldset>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
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
              opacity: saving ? 0.6 : 1,
              border: "none",
              cursor: "pointer",
            }}
          >
            {saving ? "Speichern…" : "Einstellungen speichern"}
          </button>
          {saved && (
            <span style={{ color: "#22c55e", fontSize: 14 }}>✓ Gespeichert</span>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
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
