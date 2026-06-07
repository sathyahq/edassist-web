const STRING_FIELDS = new Set([
  "q", "ans", "pt", "clue", "reason", "odd", "items", "bloom", "title",
  "diagramLabel", "sourcePassage",
]);

function deepCoerceStrings(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(deepCoerceStrings);
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (STRING_FIELDS.has(key) && Array.isArray(value)) {
      result[key] = value.filter((v) => v != null).join(". ");
    } else {
      result[key] = deepCoerceStrings(value);
    }
  }
  return result;
}

function ensureArray(val: unknown): unknown[] {
  if (Array.isArray(val)) return val;
  if (val == null) return [];
  return [val];
}

function normalizeFib(fib: unknown): [string, string] {
  if (Array.isArray(fib) && fib.length >= 2) {
    return [String(fib[0]), String(fib[1])];
  }
  if (fib && typeof fib === "object") {
    const f = fib as Record<string, unknown>;
    const sentence = String(f.sentence || f.q || f.text || f[0] || "");
    const answer = String(f.answer || f.ans || f[1] || "");
    return [sentence, answer];
  }
  return ["", ""];
}

export function normalizeGeminiOutput(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") {
    throw new Error("AI returned non-object response");
  }

  const data = deepCoerceStrings(raw) as Record<string, unknown>;

  if (data.fibs) {
    data.fibs = ensureArray(data.fibs).map(normalizeFib);
  }

  const arrayFields = [
    "mcqs", "whoAmI", "nameFollowing", "giveExamples",
    "oddOnes", "reasons", "shortAnswers", "thinkAnswers",
    "diagramQs", "sourceQs", "mapQs", "mapAns",
  ];
  for (const field of arrayFields) {
    if (data[field] !== undefined && !Array.isArray(data[field])) {
      data[field] = data[field] == null ? undefined : [data[field]];
    }
  }

  if (data.mcqs && Array.isArray(data.mcqs)) {
    data.mcqs = (data.mcqs as Record<string, unknown>[]).map((mcq) => {
      if (mcq.opts && !Array.isArray(mcq.opts)) {
        mcq.opts = Object.values(mcq.opts as Record<string, unknown>);
      }
      if (mcq.ans && typeof mcq.ans === "string") {
        mcq.ans = mcq.ans.toLowerCase().trim().charAt(0);
      }
      return mcq;
    });
  }

  return data;
}
