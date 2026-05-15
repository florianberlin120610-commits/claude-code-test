import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const channel = await prisma.channel.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" },
    });
    return NextResponse.json(channel);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "DB error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const channel = await prisma.channel.upsert({
      where: { id: "default" },
      update: {
        name: body.name ?? "",
        niche: body.niche ?? "",
        platform: body.platform ?? "tiktok",
        targetAudience: body.targetAudience ?? "",
        style: body.style ?? "",
        goal: body.goal ?? "",
      },
      create: {
        id: "default",
        name: body.name ?? "",
        niche: body.niche ?? "",
        platform: body.platform ?? "tiktok",
        targetAudience: body.targetAudience ?? "",
        style: body.style ?? "",
        goal: body.goal ?? "",
      },
    });
    return NextResponse.json(channel);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "DB error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
