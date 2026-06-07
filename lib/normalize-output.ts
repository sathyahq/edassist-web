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
    if (STRING_FIELDS.has(key)) {
      if (Array.isArray(value)) {
        result[key] = value.filter((v) => v != null).join(". ");
      } else if (value != null && typeof value !== "string") {
        result[key] = String(value);
      } else {
        result[key] = value;
      }
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

function isMatchSet(val: unknown): val is Record<string, unknown> {
  if (!val || typeof val !== "object" || Array.isArray(val)) return false;
  const obj = val as Record<string, unknown>;
  return !!(obj.colA || obj.colB || obj.col_a || obj.col_b || obj.columnA || obj.columnB);
}

function normalizeMatchSet(val: unknown): Record<string, unknown> | undefined {
  if (!isMatchSet(val)) return undefined;
  const obj = val as Record<string, unknown>;
  return {
    title: String(obj.title || "Match the following"),
    colA: ensureArray(obj.colA || obj.col_a || obj.columnA || obj.column_a),
    colB: ensureArray(obj.colB || obj.col_b || obj.columnB || obj.column_b),
    nums: ensureArray(obj.nums || obj.numbers),
    answers: (obj.answers && typeof obj.answers === "object" && !Array.isArray(obj.answers))
      ? obj.answers
      : {},
  };
}

function normalizeMatchFields(data: Record<string, unknown>): void {
  const alt = data.match || data.matching || data.matchTheFollowing || data.match_the_following;

  if (!data.matchA && alt && isMatchSet(alt)) {
    const m = alt as Record<string, unknown>;
    const colA = ensureArray(m.colA || m.col_a || m.columnA) as string[];
    const colB = ensureArray(m.colB || m.col_b || m.columnB) as string[];
    const nums = ensureArray(m.nums || m.numbers) as string[];
    const answers = (m.answers && typeof m.answers === "object" && !Array.isArray(m.answers))
      ? m.answers as Record<string, string>
      : {} as Record<string, string>;

    if (colA.length >= 3) {
      data.matchA = {
        title: String(m.title || "Match the following") + " (Set A)",
        colA: colA.slice(0, 3),
        colB: colB.slice(0, 3),
        nums: nums.length >= 3 ? nums.slice(0, 3) : ["1", "2", "3"],
        answers: Object.fromEntries(Object.entries(answers).slice(0, 3)),
      };
      if (colA.length >= 5) {
        data.matchB = {
          title: String(m.title || "Match the following") + " (Set B)",
          colA: colA.slice(3, 5),
          colB: colB.slice(3, 5),
          nums: nums.length >= 5 ? nums.slice(3, 5) : ["4", "5"],
          answers: Object.fromEntries(Object.entries(answers).slice(3, 5)),
        };
      }
    } else {
      data.matchA = normalizeMatchSet(alt);
    }
  }

  if (data.matchA && !isMatchSet(data.matchA)) {
    data.matchA = normalizeMatchSet(data.matchA);
  }
  if (data.matchB && !isMatchSet(data.matchB)) {
    data.matchB = normalizeMatchSet(data.matchB);
  }

  if (data.matchA) {
    const ma = data.matchA as Record<string, unknown>;
    if (!ma.nums || !(ma.nums as unknown[]).length) {
      const colA = ensureArray(ma.colA);
      ma.nums = colA.map((_: unknown, i: number) => String(i + 1));
    }
  }
  if (data.matchB) {
    const mb = data.matchB as Record<string, unknown>;
    if (!mb.nums || !(mb.nums as unknown[]).length) {
      const colA = ensureArray(mb.colA);
      const offset = data.matchA ? (ensureArray((data.matchA as Record<string, unknown>).colA)).length : 0;
      mb.nums = colA.map((_: unknown, i: number) => String(offset + i + 1));
    }
  }
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
      if (mcq.options && !mcq.opts) {
        mcq.opts = Array.isArray(mcq.options)
          ? mcq.options
          : Object.values(mcq.options as Record<string, unknown>);
        delete mcq.options;
      }
      if (mcq.ans && typeof mcq.ans === "string") {
        mcq.ans = mcq.ans.toLowerCase().trim().charAt(0);
      }
      if (!mcq.bloom) mcq.bloom = "Understand";
      return mcq;
    });
  }

  normalizeMatchFields(data);

  return data;
}
