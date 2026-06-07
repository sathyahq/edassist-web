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
  const alt = data.matching || data.matchTheFollowing || data.match_the_following;

  // If input already has `match` as a valid match set, use it directly
  if (data.match && isMatchSet(data.match)) {
    const normalized = normalizeMatchSet(data.match);
    if (normalized) {
      data.match = ensureMatchNums(normalized);
    }
    // Clean up legacy fields
    delete data.matchA;
    delete data.matchB;
    return;
  }

  // If input has matchA + matchB, merge into single match
  if (data.matchA && isMatchSet(data.matchA)) {
    const mA = normalizeMatchSet(data.matchA)!;
    const colA = ensureArray(mA.colA) as string[];
    const colB = ensureArray(mA.colB) as string[];
    const answers = (mA.answers && typeof mA.answers === "object" && !Array.isArray(mA.answers))
      ? { ...(mA.answers as Record<string, string>) }
      : {} as Record<string, string>;

    if (data.matchB && isMatchSet(data.matchB)) {
      const mB = normalizeMatchSet(data.matchB)!;
      colA.push(...(ensureArray(mB.colA) as string[]));
      colB.push(...(ensureArray(mB.colB) as string[]));
      if (mB.answers && typeof mB.answers === "object" && !Array.isArray(mB.answers)) {
        Object.assign(answers, mB.answers as Record<string, string>);
      }
    }

    data.match = ensureMatchNums({
      title: String(mA.title || "Match the following").replace(/ \(Set [AB]\)$/, ""),
      colA,
      colB,
      nums: colA.map((_: unknown, i: number) => String(i + 1)),
      answers,
    });
    delete data.matchA;
    delete data.matchB;
    return;
  }

  // If input has matchA only (no matchB), use as match
  if (data.matchA && isMatchSet(data.matchA)) {
    const normalized = normalizeMatchSet(data.matchA);
    if (normalized) {
      data.match = ensureMatchNums(normalized);
    }
    delete data.matchA;
    delete data.matchB;
    return;
  }

  // If input has alternative field names (matching, matchTheFollowing, etc.)
  if (alt && isMatchSet(alt)) {
    const normalized = normalizeMatchSet(alt);
    if (normalized) {
      data.match = ensureMatchNums(normalized);
    }
    delete data.matching;
    delete data.matchTheFollowing;
    delete data.match_the_following;
    delete data.matchA;
    delete data.matchB;
    return;
  }

  // No match data found — set to null
  if (!data.match) {
    data.match = null;
  }
}

function ensureMatchNums(match: Record<string, unknown>): Record<string, unknown> {
  const colA = ensureArray(match.colA);
  if (!match.nums || !(match.nums as unknown[]).length) {
    match.nums = colA.map((_: unknown, i: number) => String(i + 1));
  }
  // Default to 5-item nums if missing
  if ((match.nums as unknown[]).length < colA.length) {
    match.nums = colA.map((_: unknown, i: number) => String(i + 1));
  }
  return match;
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
