import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let channel = await prisma.channel.findUnique({ where: { id: "default" } });
  if (!channel) {
    channel = await prisma.channel.create({
      data: { id: "default" },
    });
  }
  return NextResponse.json(channel);
}

export async function POST(req: Request) {
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
}
