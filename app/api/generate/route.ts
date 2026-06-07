import { GoogleGenerativeAI } from "@google/generative-ai";
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

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    const systemPrompt = buildSystemPrompt();
    let userPrompt: string;
    if (reviewMode && paperToReview) {
      userPrompt = buildReviewPrompt(paperToReview, grade);
    } else {
      userPrompt = buildUserPrompt({
        grade,
        subject,
        examName,
        date,
        duration,
        totalMarks,
        chapters,
      });
    }

    const result = await model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      systemInstruction: { role: "model", parts: [{ text: systemPrompt }] },
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
