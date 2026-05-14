import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computePatterns, computeOptimalSlots } from "@/lib/scoring";

export async function GET() {
  const posts = await prisma.post.findMany({ orderBy: { hookScore: "desc" } });

  const published = posts.filter((p) => p.status === "published");
  const ranked = [...published].sort((a, b) => b.hookScore - a.hookScore);
  const drafts = posts.filter((p) => p.status === "draft");
  const patterns = computePatterns(posts);
  const slots = computeOptimalSlots(published);

  const topPattern = patterns.repeat[0] ?? null;
  const topSlot = slots[0] ?? null;
  const topDraft = drafts[0] ?? null;

  let nextAction: {
    type: "draft_match" | "draft_mismatch" | "suggest";
    title: string;
    reason: string;
    draftId?: string;
  };

  if (topDraft && topPattern && topDraft.hookType === topPattern.value) {
    nextAction = {
      type: "draft_match",
      title: topDraft.title,
      reason: `"${topDraft.hookType}" Hooks performen gerade mit Ø Score ${topPattern.avg_hook_score}`,
      draftId: topDraft.id,
    };
  } else if (topDraft) {
    nextAction = {
      type: "draft_mismatch",
      title: topDraft.title,
      reason: topPattern
        ? `Dein stärkstes Muster ist gerade "${topPattern.value}" (${topPattern.dimension}), nicht "${topDraft.hookType}"`
        : "Noch keine Muster-Daten — füge mehr Posts hinzu",
      draftId: topDraft.id,
    };
  } else {
    nextAction = {
      type: "suggest",
      title: topPattern
        ? `Nächster Post: ${topPattern.value} + ${posts.find((p) => p.hookScore === Math.max(...published.map((x) => x.hookScore)))?.topicCategory ?? "dein bestes Thema"}`
        : "Ersten Post erfassen",
      reason: topPattern
        ? `"${topPattern.value}" ist dein stärkstes Muster mit Ø Score ${topPattern.avg_hook_score}`
        : "Füge deinen ersten Post hinzu, um Empfehlungen zu erhalten.",
    };
  }

  const totalViews = published.reduce((s, p) => s + p.views, 0);
  const avgEngagement =
    published.length > 0
      ? published.reduce((s, p) => s + p.engagementRate, 0) / published.length
      : 0;
  const totalPurchases = published.reduce((s, p) => s + (p.purchases ?? 0), 0);

  return NextResponse.json({
    ranked: ranked.slice(0, 10),
    patterns,
    slots,
    nextAction,
    topSlot,
    postCount: posts.length,
    publishedCount: published.length,
    draftCount: drafts.length,
    analytics: {
      totalViews,
      avgEngagement: Math.round(avgEngagement * 10000) / 100,
      totalPurchases,
    },
  });
}
