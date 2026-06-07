import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompts/build-prompt";
import { buildReviewPrompt } from "@/lib/prompts/review-prompt";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { grade, subject, examName, date, duration, totalMarks, chapters, reviewMode, paperToReview } = body;

    if (!reviewMode && (!chapters?.length || !grade || !subject)) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "API key not configured" }, { status: 500 });
    }

    const systemPrompt = buildSystemPrompt();
    let userPrompt: string;
    if (reviewMode && paperToReview) {
      userPrompt = buildReviewPrompt(paperToReview, grade);
    } else {
      userPrompt = buildUserPrompt({ grade, subject, examName, date, duration, totalMarks, chapters });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.4,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      return Response.json(
        { error: `Gemini API error (${geminiResponse.status}): ${errText.slice(0, 300)}` },
        { status: 502 }
      );
    }

    const reader = geminiResponse.body?.getReader();
    if (!reader) {
      return Response.json({ error: "No response stream from Gemini" }, { status: 502 });
    }

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let buffer = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (!data || data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  controller.enqueue(encoder.encode(text));
                }
              } catch {
                // skip malformed SSE chunks
              }
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
