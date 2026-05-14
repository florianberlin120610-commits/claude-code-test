import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcEngagementRate, calcHookScore, getWeekday } from "@/lib/scoring";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const publishedAt = body.publishedAt ? new Date(body.publishedAt) : existing.publishedAt;
  const weekday = getWeekday(publishedAt);

  const avg30 = await prisma.post.aggregate({
    where: {
      status: "published",
      publishedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      NOT: { id },
    },
    _avg: { views: true },
  });
  const avgViews30d = avg30._avg.views ?? 0;

  const views = Number(body.views ?? existing.views);
  const likes = Number(body.likes ?? existing.likes);
  const comments = Number(body.comments ?? existing.comments);
  const shares = Number(body.shares ?? existing.shares);
  const purchases = body.purchases != null ? Number(body.purchases) : existing.purchases;

  const engagementRate = calcEngagementRate({ views, likes, comments, shares });
  const hookScore = calcHookScore({ views, likes, comments, shares, purchases }, avgViews30d);

  const post = await prisma.post.update({
    where: { id },
    data: {
      ...body,
      publishedAt,
      weekday,
      views,
      likes,
      comments,
      shares,
      purchases,
      engagementRate,
      hookScore,
    },
  });

  return NextResponse.json(post);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
