import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcEngagementRate, calcHookScore, getWeekday } from "@/lib/scoring";

export async function GET() {
  const posts = await prisma.post.findMany({ orderBy: { publishedAt: "desc" } });
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const publishedAt = new Date(body.publishedAt);
  const weekday = getWeekday(publishedAt);

  const avg30 = await prisma.post.aggregate({
    where: {
      status: "published",
      publishedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    _avg: { views: true },
  });
  const avgViews30d = avg30._avg.views ?? 0;

  const views = Number(body.views ?? 0);
  const likes = Number(body.likes ?? 0);
  const comments = Number(body.comments ?? 0);
  const shares = Number(body.shares ?? 0);
  const purchases = body.purchases != null ? Number(body.purchases) : null;

  const engagementRate = calcEngagementRate({ views, likes, comments, shares });
  const hookScore = calcHookScore({ views, likes, comments, shares, purchases }, avgViews30d);

  const post = await prisma.post.create({
    data: {
      title: body.title,
      platform: body.platform,
      publishedAt,
      weekday,
      durationSeconds: Number(body.durationSeconds ?? 0),
      hookType: body.hookType,
      hookText: body.hookText ?? "",
      topicCategory: body.topicCategory,
      hasCta: Boolean(body.hasCta),
      isSeries: Boolean(body.isSeries),
      seriesName: body.seriesName ?? null,
      views,
      likes,
      comments,
      shares,
      linkClicks: body.linkClicks != null ? Number(body.linkClicks) : null,
      purchases,
      hookScore,
      engagementRate,
      status: body.status ?? "published",
    },
  });

  return NextResponse.json(post, { status: 201 });
}
