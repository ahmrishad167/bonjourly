# Week content schema

One file per week: `content/weeks/wNNN.json` (zero-padded, e.g. `w004.json`), UTF-8, strict JSON.
`python build.py` validates every file and bundles them into `content/weeks.js`.

The learner is an English speaker living in Quebec. Standard (international) French is always taught
first; the Quebec layer is taught as "what you will hear / say casually". Mark informal forms clearly.
Audience level must match the phase (A1 weeks use simple sentences and lots of English support;
B2 weeks can be richer). All French must be correct, natural, with proper accents and typographic
apostrophes written as plain `'`.

```jsonc
{
  "w": 4,                                   // week number (int)
  "title": "Silent letters and liaison",    // = roadmap topic
  "goal": "By the end of this week you can …",   // one sentence, English

  // DAY 1 — LEARN: 3–5 short teaching sections
  "learn": [
    {
      "h": "Section heading",
      "body": ["Short paragraph in English. French words go in *asterisks* for emphasis.", "..."],
      "table": { "head": ["Col 1", "Col 2"], "rows": [["…", "…"]] },   // optional
      "tip": "Optional one-line memory trick"                          // optional
    }
  ],

  // EXAMPLES: 12–16 example sentences that show the topic in use
  "examples": [
    { "fr": "Je suis content.", "en": "I am happy.", "note": "optional: why this example matters" }
  ],

  // QUEBEC LAYER: standard vs Quebec spoken form, 4–6 items
  "quebec": {
    "intro": "1–2 sentences on the Quebec point of the week (from the roadmap's Quebec layer).",
    "items": [
      { "std": "Je suis fatigué.", "qc": "Chu fatigué.", "en": "I'm tired.", "note": "informal speech only" }
    ]
  },

  // DAY 2 — DRILL: 10–14 exercises, mix all four types
  "drills": [
    { "t": "mcq", "q": "Question (may contain French)", "options": ["a", "b", "c", "d"], "a": 0, "why": "explanation" },
    { "t": "fill", "q": "Je ___ fatigué. (être)", "a": ["suis"], "en": "I am tired.", "why": "…" },
    { "t": "build", "en": "I am not tired.", "a": "Je ne suis pas fatigué." },
    { "t": "translate", "en": "We are at home.", "a": ["Nous sommes à la maison.", "On est à la maison."], "why": "…" }
  ],
  //  - mcq: 3–4 options, "a" = index of the correct option
  //  - fill: exactly one "___" in q; "a" = list of accepted answers for the blank
  //  - build: the app splits "a" on spaces and shuffles the words; keep it 3–10 words
  //  - translate: list every reasonable accepted answer (keep sentences short so matching works)

  // DAY 3 — VOCABULARY: 12–16 words/phrases tied to the topic
  "vocab": [
    { "fr": "la maison", "en": "house, home", "g": "f", "ex": "Je suis à la maison.", "qc": false }
  ],
  //  - "g": "m" | "f" for nouns, omit otherwise
  //  - "qc": true when the item is Quebec-specific usage

  // DAY 4 — LISTEN & PRONOUNCE
  "listen": {
    "pron": [ { "fr": "petit", "tip": "Final t is silent: [pə-ti]" } ],          // 5–8 items
    "title": "Au dépanneur",                                                     // dialogue title
    "dialogue": [ { "s": "A", "fr": "Bonjour!", "en": "Hello!" } ],              // 6–12 lines, speakers A/B
    "questions": [ { "q": "…", "options": ["…"], "a": 1 } ]                       // 3 comprehension mcqs (English)
  },

  // DAY 5 — SPEAK & WRITE
  "speak": [ { "prompt": "Introduce yourself in 3 sentences.", "model": "Bonjour, je m'appelle …" } ],  // 3–4
  "write": { "prompt": "Write 4–6 sentences about …", "model": "Model answer in French" },

  // DAY 6 — QUIZ: 8–10 mcqs covering the whole week (no repeats of the drills)
  "quiz": [ { "q": "…", "options": ["…"], "a": 2, "why": "…" } ]
}
```

Review / checkpoint / milestone weeks: same schema. "learn" summarises the block being reviewed
(the previous ~10 weeks, listed in content/roadmap.js), examples/drills/quiz mix those topics, and
"speak"/"write" carry the roadmap's task (e.g. the two-minute self-introduction).
Skill weeks (listening, writing, speaking, media, debate) put the weight on that skill but still fill
every field.
