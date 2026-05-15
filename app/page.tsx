import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { computePatterns, computeOptimalSlots, nextSlotLabel } from "@/lib/scoring";
import { Post } from "@prisma/client";

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  instagram_reel: "IG Reel",
  youtube_short: "YT Short",
  youtube_long: "YT Long",
};

const WEEKDAY_NAMES = [
  "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag",
];

function scoreColor(score: number) {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#eab308";
  return "#ef4444";
}

function formatNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function ScoreBadge({ score }: { score: number }) {
  const s = Math.round(score);
  return (
    <span
      style={{
        background: scoreColor(s) + "20",
        color: scoreColor(s),
        border: `1px solid ${scoreColor(s)}40`,
        borderRadius: 6,
        padding: "2px 10px",
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {s}
    </span>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span
      style={{
        background: "#1a1a24",
        border: "1px solid #2a2a38",
        borderRadius: 6,
        padding: "2px 8px",
        fontSize: 12,
        color: "#a0a0b8",
      }}
    >
      {label}
    </span>
  );
}

export default async function Dashboard() {
  const [posts, channel] = await Promise.all([
    prisma.post.findMany({ orderBy: { publishedAt: "desc" } }),
    prisma.channel.findUnique({ where: { id: "default" } }),
  ]);

  const published = posts.filter((p) => p.status === "published");
  const drafts = posts.filter((p) => p.status === "draft");
  const ranked = [...published].sort((a, b) => b.hookScore - a.hookScore);
  const patterns = computePatterns(posts);
  const slots = computeOptimalSlots(published);
  const topSlot = slots[0] ?? null;
  const topPattern = patterns.repeat[0] ?? null;
  const topDraft = drafts[0] ?? null;
  const postsNeeded = Math.max(0, 15 - published.length);
  const isEmpty = posts.length === 0;
  const hasChannel = !!channel?.niche;

  // Next Action logic
  let actionTitle = "Ersten Post erfassen";
  let actionReason = "Erfasse deinen ersten Post und beginne Daten zu sammeln.";
  let actionDraftId: string | null = null;
  let actionType: "match" | "mismatch" | "suggest" | "empty" = "empty";

  if (!isEmpty) {
    if (topDraft && topPattern && topDraft.hookType === topPattern.value) {
      actionType = "match";
      actionTitle = topDraft.title;
      actionReason = `"${topDraft.hookType}"-Hooks performen gerade stark — Ø Score ${topPattern.avg_hook_score}`;
      actionDraftId = topDraft.id;
    } else if (topDraft) {
      actionType = "mismatch";
      actionTitle = topDraft.title;
      actionReason = topPattern
        ? `Dein stärkstes Muster ist "${topPattern.value}" (${topPattern.dimension.replace("_", " ")}), nicht "${topDraft.hookType}"`
        : "Noch keine Muster erkannt — mehr Posts erfassen";
      actionDraftId = topDraft.id;
    } else if (topPattern) {
      const bestTopic = ranked[0]?.topicCategory ?? "dein bestes Thema";
      actionType = "suggest";
      actionTitle = `${topPattern.value}-Hook + ${bestTopic}`;
      actionReason = `"${topPattern.value}" ist dein stärkstes Muster mit Ø Score ${topPattern.avg_hook_score}`;
    }
  }

  // Analytics
  const totalViews = published.reduce((s, p) => s + p.views, 0);
  const avgEng =
    published.length > 0
      ? ((published.reduce((s, p) => s + p.engagementRate, 0) / published.length) * 100).toFixed(2)
      : "0.00";
  const totalPurchases = published.reduce((s, p) => s + (p.purchases ?? 0), 0);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Creator Dashboard</h1>
          <p style={{ margin: "4px 0 0", color: "#6b6b80", fontSize: 14 }}>
            {hasChannel ? (
              <>
                {channel.niche}
                {channel.platform ? ` · ${PLATFORM_LABELS[channel.platform] ?? channel.platform}` : ""}
                {" · "}
              </>
            ) : null}
            {published.length} Posts · {drafts.length} Drafts
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            href="/settings"
            style={{
              background: "#1a1a24",
              color: "#6b6b80",
              padding: "10px 16px",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 14,
              border: "1px solid #2a2a38",
            }}
          >
            ⚙ Kanal
          </Link>
          <Link
            href="/content-lab"
            style={{
              background: "#8b5cf620",
              color: "#8b5cf6",
              padding: "10px 16px",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 600,
              border: "1px solid #8b5cf640",
            }}
          >
            🧪 Content Lab
          </Link>
          <Link
            href="/posts/new"
            style={{
              background: "#3b82f6",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            + Post
          </Link>
        </div>
      </div>

      {/* ONBOARDING — only when truly empty */}
      {isEmpty && (
        <div
          style={{
            background: "#0d1117",
            border: "1px solid #2a2a38",
            borderRadius: 16,
            padding: "40px 32px",
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
          <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700 }}>
            Willkommen im Creator Dashboard
          </h2>
          <p style={{ margin: "0 0 32px", color: "#6b6b80", fontSize: 15, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
            Erfasse deine Posts, und das Dashboard zeigt dir automatisch welche Hooks, Themen und
            Posting-Zeiten bei dir am besten performen.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
              maxWidth: 600,
              margin: "0 auto 32px",
            }}
          >
            <SetupStep
              number="1"
              title="Kanal einrichten"
              desc="Nische und Plattform einstellen"
              href="/settings"
              done={hasChannel}
            />
            <SetupStep
              number="2"
              title="Posts erfassen"
              desc="Videos hochladen oder manuell eintragen"
              href="/content-lab"
              done={published.length > 0}
            />
            <SetupStep
              number="3"
              title="Muster erkennen"
              desc="Nach 15 Posts siehst du was funktioniert"
              href="#"
              done={published.length >= 15}
            />
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            {!hasChannel && (
              <Link
                href="/settings"
                style={{
                  background: "#3b82f6",
                  color: "#fff",
                  padding: "12px 24px",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Kanal einrichten →
              </Link>
            )}
            <Link
              href="/content-lab"
              style={{
                background: hasChannel ? "#3b82f6" : "#1a1a24",
                color: hasChannel ? "#fff" : "#9ca3af",
                padding: "12px 24px",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 600,
                border: hasChannel ? "none" : "1px solid #2a2a38",
              }}
            >
              Ersten Post erfassen →
            </Link>
          </div>
        </div>
      )}

      {/* ZONE 1 — Next Action (nur wenn Posts vorhanden) */}
      {!isEmpty && (
        <section
          style={{
            border: `2px solid ${actionType === "match" ? "#22c55e" : actionType === "mismatch" ? "#eab308" : "#3b82f6"}`,
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
            background:
              actionType === "match"
                ? "#0f1f0f"
                : actionType === "mismatch"
                ? "#1a1500"
                : "#0a0f1f",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1,
                color:
                  actionType === "match"
                    ? "#22c55e"
                    : actionType === "mismatch"
                    ? "#eab308"
                    : "#3b82f6",
                textTransform: "uppercase",
              }}
            >
              Nächste Aktion
            </span>
            {topSlot && (
              <span style={{ fontSize: 12, color: "#6b6b80", marginLeft: "auto" }}>
                Optimaler Slot: {nextSlotLabel(topSlot)}
              </span>
            )}
          </div>
          <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700 }}>{actionTitle}</h2>
          <p style={{ margin: "0 0 20px", color: "#9ca3af", fontSize: 14 }}>{actionReason}</p>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link
              href={actionDraftId ? `/posts/${actionDraftId}` : "/posts/new"}
              style={{
                background: actionType === "match" ? "#22c55e" : "#3b82f6",
                color: "#fff",
                padding: "8px 18px",
                borderRadius: 8,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {actionDraftId ? "Draft öffnen →" : "Draft erstellen →"}
            </Link>
            {topSlot && (
              <span style={{ color: "#6b6b80", fontSize: 13 }}>
                {WEEKDAY_NAMES[topSlot.weekday]},{" "}
                {String(topSlot.hour).padStart(2, "0")}:00 Uhr · {topSlot.sample_size} Posts als Basis
              </span>
            )}
          </div>
        </section>
      )}

      {/* ZONE 2 — Pattern Intelligence */}
      <section
        style={{
          background: "#111118",
          border: "1px solid #2a2a38",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1,
            color: "#6b6b80",
            textTransform: "uppercase",
          }}
        >
          Muster-Intelligence
        </span>

        {published.length < 15 ? (
          <div style={{ marginTop: 20 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <span style={{ fontSize: 14, color: "#9ca3af" }}>
                {published.length === 0
                  ? "Noch keine Posts — erfasse deine ersten Videos."
                  : `${published.length} von 15 Posts — noch ${postsNeeded} bis zu deinen ersten Mustern.`}
              </span>
              <span style={{ fontSize: 13, color: "#6b6b80" }}>
                {published.length}/15
              </span>
            </div>
            <div
              style={{
                background: "#0a0a0f",
                borderRadius: 6,
                height: 8,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${(published.length / 15) * 100}%`,
                  height: "100%",
                  background: "#3b82f6",
                  borderRadius: 6,
                  transition: "width 0.3s",
                }}
              />
            </div>
          </div>
        ) : (
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}
          >
            <div>
              <h3
                style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600, color: "#22c55e" }}
              >
                ✅ Wiederhole das
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {patterns.repeat.length > 0 ? (
                  patterns.repeat.map((p, i) => (
                    <PatternCard key={i} pattern={p} positive />
                  ))
                ) : (
                  <p style={{ color: "#6b6b80", fontSize: 13 }}>Noch nicht genug Daten</p>
                )}
              </div>
            </div>
            <div>
              <h3
                style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600, color: "#ef4444" }}
              >
                ❌ Vermeide das
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {patterns.avoid.length > 0 ? (
                  patterns.avoid.map((p, i) => (
                    <PatternCard key={i} pattern={p} positive={false} />
                  ))
                ) : (
                  <p style={{ color: "#6b6b80", fontSize: 13 }}>Noch nicht genug Daten</p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ZONE 3 — Post Ranking */}
      <section
        style={{
          background: "#111118",
          border: "1px solid #2a2a38",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              color: "#6b6b80",
              textTransform: "uppercase",
            }}
          >
            Post-Ranking (Top 10)
          </span>
          {ranked.length > 0 && (
            <span style={{ fontSize: 12, color: "#6b6b80" }}>sortiert nach Hook Score</span>
          )}
        </div>

        {ranked.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#6b6b80" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
            <p style={{ margin: "0 0 12px" }}>Noch keine Posts vorhanden.</p>
            <Link
              href="/content-lab"
              style={{ color: "#3b82f6", fontSize: 14, textDecoration: "none" }}
            >
              Ersten Post im Content Lab erfassen →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ranked.slice(0, 10).map((post, i) => (
              <RankingRow
                key={post.id}
                post={post}
                rank={i + 1}
                isTop={i < 3}
                isBottom={i >= ranked.length - 3 && ranked.length > 3}
              />
            ))}
          </div>
        )}
      </section>

      {/* ZONE 4 — Analytics */}
      <section
        style={{
          background: "#111118",
          border: "1px solid #2a2a38",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1,
            color: "#6b6b80",
            textTransform: "uppercase",
          }}
        >
          Analytics
        </span>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginTop: 20,
          }}
        >
          <AnalyticCard
            label="Gesamt Views"
            value={formatNum(totalViews)}
            context={`${published.length} Posts`}
          />
          <AnalyticCard
            label="Ø Engagement"
            value={`${avgEng}%`}
            context="Likes + Kommentare + Shares / Views"
          />
          <AnalyticCard
            label="Verkäufe"
            value={String(totalPurchases)}
            context="Summe über alle Posts"
          />
          <AnalyticCard
            label="Opt. Slots"
            value={String(slots.length)}
            context={topSlot ? nextSlotLabel(topSlot) : "—"}
          />
        </div>

        {slots.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <p
              style={{
                margin: "0 0 12px",
                fontSize: 13,
                color: "#6b6b80",
                fontWeight: 600,
              }}
            >
              Optimale Posting-Zeiten
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {slots.slice(0, 5).map((slot, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#1a1a24",
                    borderRadius: 8,
                    padding: "10px 14px",
                  }}
                >
                  <span style={{ fontSize: 14 }}>
                    #{i + 1} {nextSlotLabel(slot)}
                  </span>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#6b6b80" }}>
                      {slot.sample_size} Posts
                    </span>
                    <ScoreBadge score={slot.avg_score} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function SetupStep({
  number,
  title,
  desc,
  href,
  done,
}: {
  number: string;
  title: string;
  desc: string;
  href: string;
  done: boolean;
}) {
  return (
    <Link
      href={href}
      style={{ textDecoration: "none" }}
    >
      <div
        style={{
          background: done ? "#0d1f0d" : "#1a1a24",
          border: `1px solid ${done ? "#22c55e40" : "#2a2a38"}`,
          borderRadius: 10,
          padding: "16px",
          textAlign: "left",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: done ? "#22c55e" : "#2a2a38",
            color: done ? "#000" : "#6b6b80",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 13,
            marginBottom: 10,
          }}
        >
          {done ? "✓" : number}
        </div>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: "#e8e8f0" }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: "#6b6b80" }}>{desc}</div>
      </div>
    </Link>
  );
}

function PatternCard({
  pattern,
  positive,
}: {
  pattern: ReturnType<typeof computePatterns>["repeat"][0];
  positive: boolean;
}) {
  const color = positive ? "#22c55e" : "#ef4444";
  const pct = Math.min(100, (pattern.avg_hook_score / 100) * 100);

  const dimLabel: Record<string, string> = {
    hook_type: "Hook-Typ",
    topic_category: "Thema",
    weekday: "Wochentag",
    platform: "Plattform",
    duration: "Länge",
  };

  return (
    <div
      style={{
        background: "#1a1a24",
        borderRadius: 8,
        padding: "12px 14px",
        border: `1px solid ${color}30`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <div>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{pattern.value}</span>
          <span style={{ color: "#6b6b80", fontSize: 12, marginLeft: 8 }}>
            {dimLabel[pattern.dimension] ?? pattern.dimension}
          </span>
        </div>
        <span style={{ color, fontWeight: 700, fontSize: 13 }}>Ø {pattern.avg_hook_score}</span>
      </div>
      <div
        style={{ background: "#0a0a0f", borderRadius: 4, height: 4, overflow: "hidden" }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: 4,
          }}
        />
      </div>
      <div
        style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}
      >
        <span style={{ fontSize: 11, color: "#6b6b80" }}>{pattern.post_count}x genutzt</span>
        <span
          style={{
            fontSize: 11,
            color: "#6b6b80",
            maxWidth: 180,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          z.B. &quot;{pattern.sample_post_title}&quot;
        </span>
      </div>
    </div>
  );
}

function RankingRow({
  post,
  rank,
  isTop,
  isBottom,
}: {
  post: Post;
  rank: number;
  isTop: boolean;
  isBottom: boolean;
}) {
  const rankColor = isTop ? "#22c55e" : isBottom ? "#ef4444" : "#6b6b80";
  return (
    <Link href={`/posts/${post.id}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "#1a1a24",
          borderRadius: 8,
          padding: "12px 14px",
          border: isTop
            ? "1px solid #22c55e30"
            : isBottom
            ? "1px solid #ef444430"
            : "1px solid transparent",
        }}
      >
        <span
          style={{
            fontWeight: 700,
            color: rankColor,
            width: 28,
            flexShrink: 0,
            fontSize: 15,
          }}
        >
          #{rank}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {post.title}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
            <Tag label={PLATFORM_LABELS[post.platform] ?? post.platform} />
            <Tag label={post.hookType} />
            <Tag label={post.topicCategory} />
          </div>
        </div>
        <div
          style={{ display: "flex", gap: 16, alignItems: "center", flexShrink: 0 }}
        >
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{formatNum(post.views)}</div>
            <div style={{ fontSize: 11, color: "#6b6b80" }}>Views</div>
          </div>
          <ScoreBadge score={post.hookScore} />
        </div>
      </div>
    </Link>
  );
}

function AnalyticCard({
  label,
  value,
  context,
}: {
  label: string;
  value: string;
  context: string;
}) {
  return (
    <div style={{ background: "#1a1a24", borderRadius: 8, padding: "16px 14px" }}>
      <div style={{ fontSize: 12, color: "#6b6b80", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#6b6b80", marginTop: 4 }}>{context}</div>
    </div>
  );
}
