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

const CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.78)",
  backdropFilter: "blur(24px) saturate(1.4)",
  WebkitBackdropFilter: "blur(24px) saturate(1.4)",
  border: "1px solid rgba(255,255,255,0.65)",
  boxShadow: "0 4px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
  borderRadius: 12,
};

function formatNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function scoreColor(score: number) {
  if (score >= 70) return "#16a34a";
  if (score >= 40) return "#d97706";
  return "#dc2626";
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

  const statusBg =
    post.status === "published" ? "#f0fdf4" : post.status === "draft" ? "#eff6ff" : "#fffbeb";
  const statusColor =
    post.status === "published" ? "#16a34a" : post.status === "draft" ? "#2563eb" : "#d97706";

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <Link href="/" style={{ color: "#71717a", textDecoration: "none", fontSize: 14 }}>← Dashboard</Link>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1,
          padding: "2px 8px",
          borderRadius: 6,
          background: statusBg,
          color: statusColor,
          textTransform: "uppercase",
        }}>
          {post.status}
        </span>
      </div>

      <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700, color: "#18181b" }}>{post.title}</h1>
      <p style={{ margin: "0 0 32px", color: "#71717a", fontSize: 14 }}>
        {PLATFORM_LABELS[post.platform] ?? post.platform}
        {" · "}
        {WEEKDAY_NAMES[post.weekday]}, {publishedDate.toLocaleDateString("de-DE")}
        {" um "}
        {publishedDate.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
      </p>

      {/* Hook Score */}
      <div style={{
        ...CARD,
        background: color + "10",
        backdropFilter: "none",
        WebkitBackdropFilter: "none",
        border: `1px solid ${color}25`,
        boxShadow: `0 4px 16px ${color}12`,
        padding: "20px 24px",
        marginBottom: 24,
        display: "flex",
        alignItems: "center",
        gap: 24,
      }}>
        <div>
          <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Hook Score</div>
          <div style={{ fontSize: 48, fontWeight: 800, color, lineHeight: 1 }}>{post.hookScore}</div>
          <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 4 }}>von 100</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ background: "rgba(0,0,0,0.08)", borderRadius: 8, height: 12, overflow: "hidden" }}>
            <div style={{ width: `${post.hookScore}%`, height: "100%", background: color, borderRadius: 8 }} />
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: "#71717a" }}>
            Engagement Rate: <strong style={{ color: "#18181b" }}>{engPct}%</strong>
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
          <div key={m.label} style={{ ...CARD, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#18181b" }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Inhalt-Details */}
      <div style={{ ...CARD, padding: "20px 24px", marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 14, color: "#a1a1aa", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
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
              <div style={{ fontSize: 11, color: "#a1a1aa", marginBottom: 2 }}>{d.label}</div>
              <div style={{ fontSize: 14, color: "#18181b" }}>{d.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={deletePost}
          disabled={deleting}
          style={{
            background: "#fef2f2",
            border: "1px solid rgba(220,38,38,0.2)",
            color: "#dc2626",
            padding: "10px 20px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {deleting ? "Löschen…" : "Post löschen"}
        </button>
        <Link href="/" style={{
          background: "rgba(255,255,255,0.7)",
          color: "#71717a",
          padding: "10px 20px",
          borderRadius: 8,
          fontSize: 14,
          textDecoration: "none",
          border: "1px solid rgba(0,0,0,0.08)",
        }}>
          Zurück
        </Link>
      </div>
    </div>
  );
}
