<p align="center"><img src="logo-full.svg" alt="Bonjourly" width="360"></p>

# Bonjourly

**Bonjour Today. Fluent Tomorrow.** Canadian French from zero to B2 in about 6 months, for learners anywhere in Canada.

Bonjourly is a free, non-profit project: no ads, no fees, no data collection. **Use it at https://truxai2115.github.io/bonjourly/**

- **168 lessons, A1 to B2.** One lesson a day finishes in about 6 months; learners can also go at their own pace.
- **Six steps per lesson**: Learn, Drill, Vocabulary, Listen, Speak & Write, Quiz. Each step ends with an evaluation that unlocks the next step.
- **A Canadian French layer in every lesson**: standard French first, then what you'll hear across French Canada.
- **Extras**: 40 graded stories (A1–B2), 80 verb tables, pronunciation and ear training, TEF Canada practice, spaced-repetition review, placement test, badges and phase certificates.
- **Free week**: guests can try lessons 1–7. A free profile unlocks everything and saves progress.

## Run locally

```bash
python FrenchLearningApp.py
```

This rebuilds the content bundles and opens `http://localhost:8000`. Serving from localhost lets Chrome and Edge use the microphone for speaking practice. Opening `index.html` directly also works, without the microphone.

## Project layout

| Path | What it is |
|---|---|
| `index.html`, `styles.css` | App shell and styles |
| `core.js` | State, progress, locks, speech, exercise engine, flashcards |
| `views.js`, `views-extra.js` | Pages and router |
| `content/roadmap.js` | The 168-lesson syllabus |
| `content/weeks/wNNN.json` | One file per lesson (schema: `content/SCHEMA.md`) |
| `content/extra/*.json` | Stories, verbs, TEF Canada, pronunciation (schema: `content/SCHEMA-EXTRA.md`) |
| `build.py` | Validates content and bundles it into `content/weeks.js` and `content/extra.js` |

After editing any JSON content, run `python build.py` and commit the regenerated bundles.

## Accounts and progress

Profiles and progress are stored in the learner's browser (`localStorage`); guests' progress lasts for the browser session only. Progress → Settings has backup and restore. Real accounts with cloud sync need a backend and are planned for the hosted version.
