export const MASTER_PROMPT = `
# Question Paper Generation — Master Prompt
## Dr. Dasarathan International School | ICSE | Grades 1–5

> **Status:** Authoritative. All rules in this file override any earlier or conflicting instructions.
> **Scope:** Content generation rules for all Science and Social Science question papers.

---

## School Constants (Fixed — Do Not Change)

| Field | Value |
|-------|-------|
| School | Dr. Dasarathan International School, Coimbatore – 17 |
| Affiliation | Council for the Indian School Certificate Examinations, New Delhi |
| Font | Comic Sans MS throughout |
| Line spacing | 1.5 (360 twips AUTO) |
| Page | A4, 1-inch margins all sides |
| Logo | \`inputs/DIS School logo 1.jpeg\` |
| Total marks | 50 (all papers) |
| Header label | **Grade** (not "Class") — info box must read \`Grade : II –\` etc. |

---

## Blueprint (11 Sections — 50 Marks)

| Section | Social Science | Science | Marks |
|---------|---------------|---------|-------|
| I | MCQ (scenario-based) | MCQ (scenario-based) | 10 × ½ = 5 |
| II | Fill in the Blanks | Fill in the Blanks | 10 × ½ = 5 |
| III | Who Am I | Who Am I | 5 × 1 = 5 |
| IV | Name the Following | Name the Following | 5 × 1 = 5 |
| V | Give Examples | Give Examples | 5 × 1 = 5 |
| VI | Match the Following | Match the Following | 5 × ½ = 2½ |
| VII | Odd One Out | Odd One Out | 5 × ½ = 2½ |
| VIII | Give Reasons | Give Reasons | 4 × 1 = 4 |
| IX | Short Answer | Short Answer | 5 × 2 = 10 |
| X | Source-Based | Think & Answer | 1 × 3 = 3 |
| XI | Map Work | *(see §9 for grade-based title)* | 1 × 3 = 3 |
| **Total** | | | **50** |

---

## Rule 1 — Grade-Calibrated Language Control

Apply automatically based on the grade of the paper being generated.

| Grade | Words/sentence | Max sentences | Cognitive level |
|-------|---------------|---------------|-----------------|
| 1 | 5–8 | 1–2 (max 3) | Recognition only |
| 2 | 6–10 | 2 (max 3) | Simple context |
| 3 | 8–15 | 3 | Basic reasoning |
| 4 | 10–18 | 3 | Simple cause–effect |
| 5 | 12–22 | 3 | Light inference |

**Across all grades:**
- No storytelling or narrative prose
- No decorative adjectives
- No long descriptive passages
- Language must be concrete and direct
- Grade 1–2: recognition level questions take priority over analytical demands

---

## Rule 2 — MCQ Design Standards (Mandatory for All Grades and All Subjects)

> **Critical rule.** Generic factual-recall MCQs (e.g. "Trees are ___ plants") are **prohibited** for all grades.

### 2A — Scenario Requirement

All 10 MCQs must:
- Present a short real-life situation, observation, or concrete context
- Then ask the student to identify, select, or apply knowledge
- Use exactly 4 options (a, b, c, d)

**Scenario constraints per grade:**

| Grade | Scenario length | Option format |
|-------|----------------|---------------|
| 1–2 | 1–2 sentences (max 3) | Single word or short phrase |
| 3 | 2–3 sentences | Short phrase or single sentence |
| 4–5 | 2–3 sentences | Full sentences (all 4 options plausibly explain the scenario) |

**Grade 4–5 additional requirements:**
- Bloom's level must be stated in code comment: Analyse / Application / Cause-Effect / Understand
- At least 6 of 10 MCQs must be at Analyse or Application level

**Prohibited in all grades:**
- Standalone definition questions with no context
- Blank-fill questions with no situational setup
- Questions answered purely by vocabulary recall

### 2B — Option Quality Standards

For every MCQ across all grades and subjects:

1. All options must belong to the **same conceptual category** — do not mix categories (e.g. do not mix object names, classification labels, and part names in the same question)
2. Include **conceptually similar distractors** — options should be close alternatives, not obviously unrelated terms
3. Test **actual understanding** — the correct answer must not be identifiable by surface-level elimination
4. **Avoid obviously wrong or unrelated options** — every option must require thought to evaluate
5. **Avoid options that differ clearly in length, grammar, or structure** — do not give away the answer through formatting
6. **Avoid grammatical clues** — stems must not grammatically favour one option (e.g. "an ___" cluing a vowel-initial answer)

### 2C — Distractor Quality Rules

Each MCQ must satisfy all three:

- **Misconception distractor:** At least one option must reflect a documented or predictable student misconception — not a random wrong term
- **Non-obvious correct answer:** The correct answer must not be instantly recognisable without applying conceptual knowledge
- **Conceptual reasoning required:** A student who has only memorised vocabulary must not be able to answer correctly — the question must demand understanding

### 2D — Uniform Category Enforcement

All four options in every MCQ must:

- Be of the **same classification level** (e.g. all types, all functions, all names — not a mix)
- Be **grammatically parallel** — same part of speech, same sentence structure
- Be **similar in length and format** — avoid one option being significantly longer or shorter
- **Not mix unrelated terms** (e.g. "climber" vs "creeper" is acceptable; "climber" vs "photosynthesis" is not)

### 2E — MCQ Validation (Mandatory Before Output)

Before finalising the paper, confirm for every MCQ:

- [ ] All four options belong to the same conceptual category
- [ ] At least one distractor reflects a common misconception
- [ ] No option is trivially eliminable by a student who does not know the topic
- [ ] Options are grammatically and structurally parallel
- [ ] No grammatical or length clue reveals the correct answer
- [ ] Regenerate any MCQ that fails any check above

---

## Rule 3 — Scenario-Based Questions (General)

Applies to all question types that use a scenario/clue/situation (MCQ, Think & Answer, Source-Based):

- Maximum 3 sentences per scenario
- Prefer 1–2 sentences
- Under 45 words total
- No narration or emotional tone
- Only essential context clues
- Must match grade reading level (see Rule 1)

Simplify once internally before finalising.

---

## Rule 4 — Section III: "Who Am I?" Questions

| Grade | Max sentences | Word range | Clue style |
|-------|--------------|------------|------------|
| 1–2 | 2 | 15–25 words | Concrete, direct, single-level |
| 3–5 | 3–5 | 25–50 words | Multi-sentence, descriptive, chapter-accurate |

**Grade 3–5 clues must include:**
- What the subject does
- Where it is found or a specific fact
- Effect of its absence or presence
- Must NOT name the subject directly

**Prohibited in all grades:**
- Layered or abstract hints
- Storytelling or emotional narration

---

## Rule 5 — Section VI: Match the Following

Generate **exactly ONE Match-the-Following question** per paper.

- Exactly **5 items** in Column A
- Exactly **5 items** in Column B
- Column B **must be shuffled**: verify that no item is in its positional matching position (1 ≠ a, 2 ≠ b, 3 ≠ c, 4 ≠ d, 5 ≠ e)
- All pairings must be logically correct

**Shuffle verification step (mandatory before output):**
List all 5 pairings and confirm each Column A number does NOT correspond to the same letter position.

---

## Rule 6 — One-Mark = One-Response

If a question carries **1 mark**, it must require **exactly one answer**.

- Prohibited: "Name three...", "List two...", "State the following..." for 1-mark questions
- Prohibited: Combined multi-part questions within a single 1-mark allocation
- Required: If multiple answers are expected → marks must increase proportionately (2 answers = 2 marks)

---

## Rule 7 — Mark-to-Answer Alignment

| Required responses | Required marks |
|-------------------|---------------|
| 1 answer | 1 mark |
| 2 answers | 2 marks |
| 3 answers | 3 marks |
| 5 answers | 5 marks |

No mismatch permitted. Every question must be validated against this rule before output.

---

## Rule 8 — Answer Space Intelligence

Answer lines in the question paper must exactly match the number of required responses:

**Single-response questions:**
\`\`\`
Answer: ______________________________________
\`\`\`

**Multi-response questions (e.g. 2-mark "Name two..." questions):**
\`\`\`
(i)  __________________________________________
(ii) __________________________________________
\`\`\`

**Never compress multiple responses into one line.**
**Never provide more lines than required responses.**

---

## Rule 9 — Section XI: Diagram / Picture Section

### 9A — Diagram Quality Standards

| Criterion | Requirement |
|-----------|-------------|
| Clarity | Parts must be clearly visible with bold lines |
| Relevance | Only grade-relevant parts shown — no excess detail |
| Style | Line art preferred; no colour fills; no photographs |
| Labels | Grade 1–3: blank label boxes (students identify); Grade 4–5: labelled parts with function questions |
| Size | 20–150 KB source file; portrait orientation preferred |
| Copyright | Bottom 15% must be cropped to remove any watermark or attribution text |

### 9B — Section Title (Grade-Sensitive — Mandatory)

| Grade | Section XI Title |
|-------|-----------------|
| 1–2 | Look at the Picture and Answer. |
| 3 | Look at the Plant / Animal and Answer. *(match subject)* |
| 4–5 | Study the Diagram and Answer. |

> The title "Diagram-Based Question" is **deprecated** and must not be used for any grade.

### 9C — Diagram Questions Format

| Grade | Question style |
|-------|---------------|
| 1–2 | Provide a functional clue in the question, then ask for the name of the part |
| 3 | Ask to identify the part AND state one function |
| 4–5 | (a) identify + function, (b) name + explain + compare, (c) apply to real-world scenario |

Each sub-question is worth 1 mark. Total = 3 marks.

---

## Rule 10 — Final Validation (Internal — Before Output)

Run this check mentally before producing the final paper. If any item fails → regenerate that section.

| Check | Rule |
|-------|------|
| Grade-appropriate language | Words/sentence and cognitive level match grade |
| Sentence limits respected | Per Rule 1 limits enforced |
| MCQs are scenario-based | No standalone recall questions in Section I |
| MCQ options are same conceptual category | Per Rule 2B–2D |
| At least one distractor per MCQ reflects a misconception | Per Rule 2C |
| No MCQ option is trivially eliminable | Per Rule 2B–2C |
| MCQ options are grammatically and structurally parallel | Per Rule 2D |
| Scenario ≤ 3 sentences, ≤ 45 words | Per Rule 3 |
| Who Am I ≤ 2 sentences (Grade 1–2) | Per Rule 4 |
| Exactly ONE Match-the-Following | Per Rule 5 |
| Exactly 5×5 match structure | Per Rule 5 |
| Column B shuffle valid (no positional match) | Per Rule 5 |
| 1 mark = 1 response | Per Rule 6 |
| Marks match answer count | Per Rule 7 |
| Answer space lines = required responses | Per Rule 8 |
| Diagram is clean and grade-appropriate | Per Rule 9A |
| Section XI title matches grade | Per Rule 9B |
| No question repeated across sections | Content integrity |
| No concept tested more than once across the whole paper | Per Rule 12 |
| Concepts clustered and verified for duplicates before output | Per Rule 12 |
| All chapters represented — no chapter left without questions | Per Rule 12 |
| Content sourced only from provided chapter text | No external facts introduced |

---

## Rule 11 — Common Mistakes Checklist
### Internal Use Only — Do Not Print on Paper

The following mistakes have occurred in past generations. Check specifically for these before finalising.

**A. Language & Grade Control**
- [ ] Info box says "Class" instead of "Grade" → change to "Grade  :  " in the generator
- [ ] MCQ scenario is longer than 3 sentences → trim
- [ ] Who Am I clue exceeds 2 sentences for Grade 1–2 → trim
- [ ] Sentence word count exceeds grade limit → simplify
- [ ] Decorative or emotional language included → remove

**B. MCQ Design Standards Enforcement**
- [ ] Any MCQ has no scenario context (pure recall) → rewrite with scenario
- [ ] MCQ options belong to different conceptual categories (e.g. object vs category vs part mixed) → rewrite so all four belong to the same level
- [ ] No distractor reflects a student misconception — all wrong options are obviously wrong → replace at least one with a misconception-based distractor
- [ ] Correct answer is instantly obvious without understanding the concept → redesign question or distractors
- [ ] Options differ significantly in length or grammatical structure → normalise to parallel form
- [ ] Grammatical clue in the stem reveals the correct answer → rewrite stem as neutral
- [ ] Grade 4–5 MCQ options are not full sentences → expand
- [ ] Grade 1–2 MCQ options are full sentences when single words suffice → simplify

**C. Mark Alignment**
- [ ] A 1-mark question asks for 2+ answers → split or reduce
- [ ] A question asks to "list" or "name three" for 1 mark → rewrite for 1 mark or raise marks
- [ ] Section IX short-answer has 2-mark question but only 1 answer line → add second line

**D. Answer Space**
- [ ] Multi-response answer crammed into one line → separate with (i), (ii)
- [ ] Single-answer question given multiple lines → reduce to one line
- [ ] Section XI sub-questions given more than 1 answer line (Grade 1–2) → correct

**E. Match-the-Following**
- [ ] Two separate match sets generated instead of one 5×5 → consolidate
- [ ] Column B has fewer than 5 items → add
- [ ] Positional alignment: answer for item 1 is "a", 2 is "b" etc. → reshuffle
- [ ] Answer key shuffle not verified → verify all 5 pairs

**F. Diagram Section**
- [ ] Section title says "Diagram-Based Question" → rename per Rule 9B
- [ ] Diagram source image has visible copyright text not cropped → re-crop
- [ ] Diagram has labels visible for Grade 1–2 (defeats purpose) → use blank-label version
- [ ] Diagram questions ask to "name" parts whose names are visible as labels → rewrite as function questions
- [ ] Image is a coloring worksheet with activity instructions visible → use cleaner source

**G. Structural Quality**
- [ ] Same keyword appears in more than 2 questions → replace synonyms
- [ ] Fill-in-the-blank positioned in the middle of the sentence → move blank to end
- [ ] Reasons section uses \`pts[]\` (multi-point) format instead of \`pt\` (single-point) → fix
- [ ] Short answers for Grade 1–2 ask for 3–4 sentences → reduce to 1–2 responses

**H. Concept Non-Repetition (Per Rule 12)**
- [ ] Two questions test the same concept (e.g. "factory smoke → air pollution" appearing in both MCQ and FIB) → remove one; replace with a different concept
- [ ] Same fact tested in different formats (e.g. stethoscope in FIB and also in Name the Following) → keep only one; use the freed slot for a new concept
- [ ] A chapter concept appears in 3+ questions across sections → reduce to 1–2 and spread coverage to other chapters
- [ ] One chapter dominates the paper while another has only 1 question → redistribute questions for balanced chapter coverage
- [ ] Cluster all 55+ questions mentally by concept before output — any cluster with 2+ items = repetition to eliminate

---

## Section-Specific Quality Standards

### Section II — Fill in the Blanks
- Blank must always appear **at the end** of the sentence
- Answer must be a specific fact (number, proper noun, technical term)
- Not generic — chapter-accurate facts only

### Section III — Who Am I (Grade 3–5 extended standard)
- 3–5 sentences of descriptive clues
- Include: what it does, where it is found, a specific fact, effect of absence
- Must NOT name the subject directly anywhere in the clues

### Section VII — Odd One Out
- Each reason must explain:
  - WHY the odd item does not belong, AND
  - WHY the other three items belong together
- One-line explanations are insufficient (Grade 3–5)
- Grade 1–2: 2–3 short sentences (5–8 words each) per reason

### Section VIII — Give Reasons
- Each reason uses \`pt\` (single string, 1 mark) — not a multi-point format
- Answer is one complete, direct sentence (Grade 1–2) or 2–3 sentences (Grade 3–5)

### Section IX — Short Answers
- **Grade 1–2:** "Name two..." format — 2 numbered answer lines — 1 mark per item
- **Grade 3:** 2–3 sentence answer — structured around fact + example
- **Grade 4–5:** 4–6 sentence model answer — (i) define, (ii) example with detail, (iii) conclusion or comparison

### Section X — Think & Answer / Source-Based
- **Think & Answer (Science):** Must require applying 2+ concepts together. Cannot be solved by recalling a single definition. Grade 1–2 exception: 3 recognition-level sub-questions with a connecting scenario.
- **Source-Based (Social Science):** Passage sourced from chapter content. 3 questions: literal → inferential → evaluative.

---

## Diagram Sourcing Workflow (Science Sections)

Follow this order without shortcuts:

1. **WebSearch** for candidate image URLs
2. **Content check** before any HTTP test:
   - Filename must contain: \`diagram\`, \`anatomy\`, \`worksheet\`, \`labeled\`, \`chart\`, or \`parts\`
   - Filename must NOT contain: \`featured\`, \`thumbnail\`, \`cover\`, \`rev\`, brand names, author names
   - WordPress blog cover images: reject unless filename confirms it is a diagram
3. **HTTP GET test** — verify HTTP 200 and check \`content-length\` header
   - Diagrams: 20–150 KB (above 200 KB = likely a photo → reject)
4. **Write or update** \`download_diagram_g<n>.js\` with verified URL
5. **Run** download script — confirm file saved successfully
6. **Regenerate** paper only after diagram confirmed

**Copyright removal (mandatory):**
After greyscaling, crop bottom 15%:
\`\`\`javascript
img.crop({ x: 0, y: 0, w: width, h: Math.floor(height * 0.85) });
\`\`\`

**Orientation settings:**
- Portrait (taller): \`scaleToFit { w: 300, h: 460 }\` → \`ImageRun { width: 260, height: 400 }\`
- Landscape (wider): \`scaleToFit { w: 380, h: 480 }\` → \`ImageRun { width: 400, height: 300 }\`

Adjust \`ImageRun\` dimensions to match actual final pixel dimensions after \`scaleToFit\`.

---

---

## Rule 12 — Concept Non-Repetition (Mandatory for All Papers)

> **Critical rule.** Concept-level repetition across sections is **prohibited**.

### Definition

Concept-level repetition occurs when two or more questions test the **same underlying idea, fact, principle, or learning outcome** — even if the question format differs.

**Examples of prohibited repetition:**
- "factory smoke → air pollution" tested in MCQ *and* in Name the Following
- "stethoscope" appearing as a FIB answer *and* as a Name the Following answer
- "aeroplane = air transport" in FIB, Give Examples, *and* Short Answers

**Changing the format does NOT create a new concept.** A recall question and a scenario question on the same fact = repetition.

### Mandatory Rules

1. **Each core concept must be tested only once** in the entire paper — across all 11 sections.
2. Before finalising the paper, **cluster all questions mentally by concept** and identify any cluster with 2 or more items — those are repetitions to eliminate.
3. If a concept is already tested in one section, the freed slot in another section must be used to test a **different concept** from the chapter.
4. **Prioritise breadth of syllabus coverage** over repeated reinforcement of the same idea.
5. The final paper must demonstrate **concept diversity** and **full chapter representation** — no chapter should be left with fewer than 2 questions, and no concept should dominate.
6. **Sequential check (before output):** List every question's core concept, scan the list top-to-bottom for duplicates, and replace any duplicate before producing the paper.

### Permitted Exceptions

The following do not count as repetition, provided the cognitive task is genuinely different:
- Match the Following — pairing a concept (as label) to its definition/characteristic, where the same concept appears as a scenario answer elsewhere (e.g. Heart → identified in Who Am I; Heart ↔ pumps blood in Match). Permitted only if no more than **two** sections mention the same concept.
- Think & Answer — scenario questions that *apply* multiple concepts. A concept may be *applied* in Think & Answer even if it was *identified* in one other section, provided the Think question demands application, not recall.

---

*Last updated: March 2026 — Covers Grades 1–5, Science and Social Science, Third Trimester 2026*
*Rule 2 updated: MCQ Design Standards expanded with option quality, distractor quality, and uniform category enforcement rules.*
*Rule 12 added: Concept Non-Repetition — mandatory across all grades and subjects.*
`;
