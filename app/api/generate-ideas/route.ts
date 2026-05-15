import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const count = body.count ?? 5;

    const channel = await prisma.channel.findUnique({ where: { id: "default" } });

    // Get top performing posts for context
    const topPosts = await prisma.post.findMany({
      where: { status: "published" },
      orderBy: { hookScore: "desc" },
      take: 10,
      select: {
        title: true,
        hookType: true,
        hookText: true,
        topicCategory: true,
        platform: true,
        views: true,
        hookScore: true,
      },
    });

    const channelContext = channel
      ? `Kanal: ${channel.name || "Unbekannt"}
Nische: ${channel.niche || "Allgemein"}
Plattform: ${channel.platform}
Zielgruppe: ${channel.targetAudience || "Allgemein"}
Stil: ${channel.style || "Nicht definiert"}
Ziel: ${channel.goal || "Reichweite aufbauen"}`
      : "Kein Kanal konfiguriert – generische Content-Ideen";

    const topPostsContext =
      topPosts.length > 0
        ? `\nTop-performende Posts (nach Hook Score):\n${topPosts
            .map(
              (p) =>
                `- "${p.title}" | Hook: ${p.hookType} | Thema: ${p.topicCategory} | Views: ${p.views} | Score: ${p.hookScore.toFixed(0)}`
            )
            .join("\n")}`
        : "\nNoch keine Post-Daten vorhanden.";

    const message = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Du bist ein viraler Social Media Stratege. Generiere ${count} Content-Ideen für diesen Creator.

${channelContext}${topPostsContext}

Basiere die Ideen auf bewährten Viralitäts-Mustern und den bisher gut performenden Posts.

Antworte NUR mit validem JSON-Array (kein Markdown):
[
  {
    "title": "Konkreter Post-Titel",
    "hookType": "number|pov|question|shock|promise|other",
    "hookText": "Erster Satz / Hook (5-7 Wörter)",
    "topicCategory": "money|skills|mindset|algorithm|lifestyle|fitness|business|other",
    "platform": "tiktok|instagram_reel|youtube_short|youtube_long",
    "whyViral": "Warum dieser Post viral gehen könnte (1 Satz)",
    "hasCta": true|false
  }
]`,
        },
      ],
    });

    const rawText = message.content[0].type === "text" ? message.content[0].text : "[]";
    let ideas: unknown[] = [];
    try {
      ideas = JSON.parse(rawText);
    } catch {
      const match = rawText.match(/\[[\s\S]*\]/);
      if (match) ideas = JSON.parse(match[0]);
    }

    return NextResponse.json({ ideas });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Fehler beim Generieren";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
