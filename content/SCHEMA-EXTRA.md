# Extra content schemas

All files are strict UTF-8 JSON in `content/extra/`. `python build.py` validates and bundles them into
`content/extra.js`. Learner: English speaker in Quebec, zero to B2. Standard French first; Quebec
spoken forms marked as informal. All French must be correct with proper accents.

## stories-a.json / stories-b.json — graded short stories

`stories-a.json` = 20 stories for A1–A2, `stories-b.json` = 20 stories for B1–B2. Set in Quebec
(Montréal, Québec, Gatineau, Saguenay, Gaspésie, Laurentides, Sherbrooke…), everyday life of newcomers
and locals: dépanneur, hockey, déménagement le 1er juillet, cabane à sucre, tempête de neige, CLSC,
job interview, Fête nationale, chalet, métro, bureau, etc.

```jsonc
[
  {
    "id": "a01",                       // a01…a20, b01…b20
    "title": "Au dépanneur",
    "level": "A1",                     // A1 | A2 | B1 | B2
    "week": 12,                        // unlocks after this roadmap week; only use grammar taught by then (see content/roadmap.js)
    "place": "Montréal",
    "summary": "One English sentence",
    "text": ["Paragraph 1 in French", "Paragraph 2", "…"],   // A1: 80–150 words; A2: 150–250; B1: 250–400; B2: 350–550
    "dialogue_ok": true,               // optional; true if the text includes direct speech
    "glossary": [ { "fr": "le dépanneur", "en": "corner store", "qc": true } ],   // 8–15 items
    "questions": [ { "q": "English or French question", "options": ["…"], "a": 0, "why": "…" } ],  // 5 mcqs
    "quebec_note": "One or two sentences on a Quebec word, custom or accent feature in the story."
  }
]
```
Spread "week" values evenly across the phase (A1 weeks 8–40, A2 41–84, B1 85–128, B2 129–168).

## verbs.json — essential verb reference

80 verbs: être, avoir, aller, faire, dire, pouvoir, vouloir, savoir, venir, devoir, prendre, mettre,
voir, parler, manger, finir, choisir, partir, sortir, dormir, connaître, croire, boire, lire, écrire,
vivre, ouvrir, recevoir, tenir, courir, mourir, naître, rester, arriver, entrer, tomber, devenir,
revenir, comprendre, apprendre, attendre, entendre, répondre, vendre, perdre, rendre, acheter, appeler,
jeter, payer, envoyer, essayer, commencer, préférer, espérer, se lever, s'appeler, s'habiller,
se souvenir, s'asseoir, falloir, pleuvoir, plaire, suivre, conduire, produire, craindre, peindre,
mettre, permettre, promettre, offrir, souffrir, valoir, s'en aller, magasiner, jaser, niaiser, checker,
pogner (the last five are Quebec informal verbs; include them with "qc": true).
(If a name repeats, replace it with another very common verb.)

```jsonc
[
  {
    "inf": "aller", "en": "to go", "group": 3,            // 1 | 2 | 3
    "aux": "être", "pp": "allé", "ppr": "allant",
    "qc": false,                                           // true for Quebec-informal verbs
    "week": 11,                                            // roadmap week where it is first taught (best guess)
    "t": {
      "present":          ["je vais", "tu vas", "il/elle/on va", "nous allons", "vous allez", "ils/elles vont"],
      "passe_compose":    ["je suis allé(e)", "…6 forms"],
      "imparfait":        ["…6"],
      "futur":            ["…6"],
      "conditionnel":     ["…6"],
      "subjonctif":       ["que j'aille", "…6"],
      "plus_que_parfait": ["…6"],
      "imperatif":        ["va", "allons", "allez"]        // 3 forms; for impersonal verbs (falloir, pleuvoir) use [] 
    },
    // impersonal verbs: use the il form in all 6 slots? NO — give a 1-item list for each tense, e.g. ["il faut"].
    "spoken_qc": "Quebec speech: \"j'vas\" or \"m'as\" for je vais (informal).",   // optional
    "examples": [ { "fr": "On va au chalet en fin de semaine.", "en": "We're going to the cottage this weekend." } ]  // 2–3
  }
]
```

## exam.json — TEF Canada preparation

Verify the current TEF Canada format (sections, timing, number of questions, scoring to NCLC) with a
web search before writing; state the source month in "format_checked".

```jsonc
{
  "format_checked": "2026-10",
  "intro": ["Paragraph on what TEF Canada is and why it matters (immigration, citizenship, Quebec)…"],
  "nclc": { "head": ["NCLC", "CO", "CE", "EE", "EO"], "rows": [["…"]] },     // score-to-NCLC table, if available
  "sections": [
    {
      "code": "CO", "name": "Compréhension orale", "en": "Listening",
      "format": "Duration, number of questions, what the tasks look like",
      "tips": ["…5–8 strategy tips"],
      "phrases": [],                                     // useful phrases (mainly for EE/EO), may be empty
      "sets": [                                          // 3 practice sets per section
        {
          "title": "Set 1: Annonces et messages",
          "level": "B1",
          // CO: "items" with an audio script (read by text-to-speech) and 1–2 mcqs each
          // CE: "items" with a written text and 1–3 mcqs each
          // EE/EO: "tasks" instead of items
          "items": [ { "script": "French text (for CO) or passage (for CE)", "questions": [ { "q": "…", "options": ["…"], "a": 0, "why": "…" } ] } ],
          "tasks": [ { "prompt": "Task instructions in French + English gloss", "time": "60 min", "words": "80–120 mots", "model": "Full model answer in French", "checklist": ["What graders look for…"] } ]
        }
      ]
    }
  ]
}
```
CO and CE sets: 5–6 items each. EE and EO sets: 2 tasks each (matching the real sections, e.g. EE
section A fait divers / section B lettre d'opinion; EO section A obtenir des informations / section B
convaincre). Use Quebec and Canadian contexts.

## pronunciation.json — sounds guide

```jsonc
{
  "sounds": [   // 30–40 entries covering vowels, nasal vowels, semi-vowels, tricky consonants (r, u vs ou, é/è, liaison, enchaînement, e muet)
    { "id": "u", "label": "u as in tu", "ipa": "y", "how": "How to make the sound, English comparison", "words": ["tu", "rue", "vu", "sûr"], "pairs": [["tu", "tout"], ["rue", "roue"]], "sentence": "Tu as vu la rue?" }
  ],
  "quebec": [   // 12–16 Quebec accent features
    { "id": "affrication", "label": "t and d before i/u", "how": "…", "std": "petit, dur", "qc": "p'tsi, dzur", "examples": ["Tu dis toujours oui.", "…"] }
  ],
  "twisters": [ { "fr": "Les chaussettes de l'archiduchesse sont-elles sèches?", "en": "…", "focus": "s vs ch" } ],   // 15–20
  "minimal_pairs": [ { "a": "dessus", "b": "dessous", "focus": "u vs ou" } ]   // 30–40, used for a listening game
}
```
