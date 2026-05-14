"use client";

import { Post } from "@prisma/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  instagram_reel: "Instagram Reel",
  youtube_short: "YouTube Short",
  youtube_long: "YouTube Long",
};

const WEEKDAY_NAMES = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

function formatNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function scoreColor(score: number) {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#eab308";
  return "#ef4444";
}

export default function PostDetailClient({ post }: { post: Post }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function deletePost() {
    if (!confirm("Post wirklich löschen?")) return;
    setDeleting(true);
    await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  const color = scoreColor(post.hookScore);
  const engPct = (post.engagementRate * 100).toFixed(2);
  const publishedDate = new Date(post.publishedAt);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <Link href="/" style={{ color: "#6b6b80", textDecoration: "none", fontSize: 14 }}>← Dashboard</Link>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1,
          padding: "2px 8px",
          borderRadius: 6,
          background: post.status === "published" ? "#22c55e20" : post.status === "draft" ? "#3b82f620" : "#eab30820",
          color: post.status === "published" ? "#22c55e" : post.status === "draft" ? "#3b82f6" : "#eab308",
          textTransform: "uppercase",
        }}>
          {post.status}
        </span>
      </div>

      <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700 }}>{post.title}</h1>
      <p style={{ margin: "0 0 32px", color: "#6b6b80", fontSize: 14 }}>
        {PLATFORM_LABELS[post.platform] ?? post.platform}
        {" · "}
        {WEEKDAY_NAMES[post.weekday]}, {publishedDate.toLocaleDateString("de-DE")}
        {" um "}
        {publishedDate.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
      </p>

      {/* Hook Score */}
      <div style={{
        background: color + "15",
        border: `1px solid ${color}40`,
        borderRadius: 12,
        padding: "20px 24px",
        marginBottom: 24,
        display: "flex",
        alignItems: "center",
        gap: 24,
      }}>
        <div>
          <div style={{ fontSize: 11, color: "#6b6b80", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Hook Score</div>
          <div style={{ fontSize: 48, fontWeight: 800, color, lineHeight: 1 }}>{post.hookScore}</div>
          <div style={{ fontSize: 12, color: "#6b6b80", marginTop: 4 }}>von 100</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ background: "#0a0a0f", borderRadius: 8, height: 12, overflow: "hidden" }}>
            <div style={{ width: `${post.hookScore}%`, height: "100%", background: color, borderRadius: 8 }} />
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: "#9ca3af" }}>
            Engagement Rate: <strong style={{ color: "#e8e8f0" }}>{engPct}%</strong>
          </div>
        </div>
      </div>

      {/* Metriken */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Views", value: formatNum(post.views) },
          { label: "Likes", value: formatNum(post.likes) },
          { label: "Kommentare", value: formatNum(post.comments) },
          { label: "Shares", value: formatNum(post.shares) },
          { label: "Link Clicks", value: post.linkClicks != null ? formatNum(post.linkClicks) : "—" },
          { label: "Käufe", value: post.purchases != null ? String(post.purchases) : "—" },
        ].map((m) => (
          <div key={m.label} style={{ background: "#111118", border: "1px solid #2a2a38", borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#6b6b80", marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Inhalt-Details */}
      <div style={{ background: "#111118", border: "1px solid #2a2a38", borderRadius: 12, padding: "20px 24px", marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 14, color: "#6b6b80", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
          Inhalt
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "Hook-Typ", value: post.hookType },
            { label: "Thema", value: post.topicCategory },
            { label: "Hook-Text", value: post.hookText || "—" },
            { label: "Dauer", value: post.durationSeconds ? `${post.durationSeconds}s` : "—" },
            { label: "Hat CTA", value: post.hasCta ? "Ja" : "Nein" },
            { label: "Serie", value: post.isSeries ? (post.seriesName || "Ja") : "Nein" },
          ].map((d) => (
            <div key={d.label}>
              <div style={{ fontSize: 11, color: "#6b6b80", marginBottom: 2 }}>{d.label}</div>
              <div style={{ fontSize: 14 }}>{d.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={deletePost}
          disabled={deleting}
          style={{ background: "#1f0a0a", border: "1px solid #ef444440", color: "#ef4444", padding: "10px 20px", borderRadius: 8 }}
        >
          {deleting ? "Löschen…" : "Post löschen"}
        </button>
        <Link href="/" style={{
          background: "#1a1a24",
          color: "#6b6b80",
          padding: "10px 20px",
          borderRadius: 8,
          fontSize: 14,
          textDecoration: "none",
        }}>
          Zurück
        </Link>
      </div>
    </div>
  );
}
