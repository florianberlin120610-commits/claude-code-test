import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("video") as File | null;
    const durationSeconds = Number(formData.get("durationSeconds") || 0);
    const title = (formData.get("title") as string) || "";

    let transcript = "";

    if (file && file.size > 0) {
      // Transcribe with Whisper
      const audioBuffer = await file.arrayBuffer();
      const audioFile = new File([audioBuffer], file.name, { type: file.type });

      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: "de",
      });
      transcript = transcription.text;
    }

    const contextText = [
      title ? `Titel: ${title}` : "",
      durationSeconds ? `Dauer: ${durationSeconds} Sekunden` : "",
      transcript ? `Transkript:\n${transcript}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    if (!contextText) {
      return NextResponse.json({ error: "Kein Inhalt zum Analysieren" }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Du bist ein Social Media Content Analyst. Analysiere diesen Video-Content und gib eine strukturierte JSON-Antwort zurück.

${contextText}

Antworte NUR mit validem JSON (kein Markdown, kein Text davor/danach) in diesem Format:
{
  "hookType": "number|pov|question|shock|promise|other",
  "hookText": "Die ersten 5-7 Wörter des Hooks",
  "topicCategory": "money|skills|mindset|algorithm|lifestyle|fitness|business|other",
  "hasCta": true|false,
  "isSeries": false,
  "platform": "tiktok|instagram_reel|youtube_short|youtube_long",
  "title": "Vorgeschlagener Titel falls keiner gegeben",
  "analysis": "Kurze Analyse warum dieser Hook gut/schlecht ist (max 2 Sätze)"
}`,
        },
      ],
    });

    const rawText = message.content[0].type === "text" ? message.content[0].text : "";
    let analysis: Record<string, unknown> = {};
    try {
      analysis = JSON.parse(rawText);
    } catch {
      // Try to extract JSON from text
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) analysis = JSON.parse(match[0]);
    }

    return NextResponse.json({
      transcript,
      analysis,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Analysefehler";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
