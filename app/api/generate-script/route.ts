import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, hookType, hookText, topicCategory, platform, durationSeconds } = body;

    if (!title) {
      return NextResponse.json({ error: "Titel erforderlich" }, { status: 400 });
    }

    const channel = await prisma.channel.findUnique({ where: { id: "default" } });

    const durationHint = durationSeconds
      ? `Ziel-Dauer: ${durationSeconds} Sekunden (ca. ${Math.round(durationSeconds * 2.5)} Wörter gesprochen)`
      : platform === "youtube_long"
      ? "Ziel-Dauer: 8-12 Minuten"
      : "Ziel-Dauer: 30-60 Sekunden";

    const channelContext = channel?.niche
      ? `Kanal-Nische: ${channel.niche}\nZielgruppe: ${channel.targetAudience || "Allgemein"}\nStil: ${channel.style || "Authentisch"}`
      : "";

    const message = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 3000,
      thinking: { type: "adaptive" },
      messages: [
        {
          role: "user",
          content: `Du bist ein professioneller Script-Writer für viral Social Media Content. Schreibe ein vollständiges Script.

Titel: ${title}
Hook-Typ: ${hookType || "number"}
Hook-Text: ${hookText || ""}
Thema: ${topicCategory || ""}
Plattform: ${platform || "tiktok"}
${durationHint}
${channelContext}

Schreibe ein vollständiges, virales Script mit:
1. [HOOK] - Erster Satz der sofort Aufmerksamkeit zieht
2. [PROBLEM/SETUP] - Problem oder Kontext etablieren
3. [INHALT] - Hauptinhalt mit konkreten Tipps/Infos
4. [CTA] - Call to Action am Ende

Formatiere das Script so dass es direkt vorgelesen werden kann. Nutze natürliche Sprache, keine Aufzählungszeichen im Script selbst. Schreibe auf Deutsch.`,
        },
      ],
    });

    const scriptContent = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    return NextResponse.json({ script: scriptContent });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Fehler beim Generieren";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
