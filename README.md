<p align="center"><img src="logo-full.svg" alt="Bonjourly" width="360"></p>

# Bonjourly

**Bonjour Today. Fluent Tomorrow.** Canadian French from zero to B2 in about 6 months, for learners anywhere in Canada.

Bonjourly is a free, non-profit project: no ads, no fees, no data collection. **Use it at https://ahmrishad167.github.io/bonjourly/**

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

Without online accounts, profiles and progress live in the learner's browser (guests: for the browser session only), with backup and restore under Progress → Settings.

Online accounts use [Supabase](https://supabase.com) (free tier) for sign-up, sign-in (email and password, Google) and syncing progress across devices:

1. Create a Supabase project (region Canada (Central)) and run [`supabase/schema.sql`](supabase/schema.sql) in its SQL Editor.
2. Authentication → URL Configuration: Site URL `https://ahmrishad167.github.io/bonjourly/`, redirect URLs `https://ahmrishad167.github.io/bonjourly/**` and `http://localhost:8000/**`.
3. Optional Google sign-in: create an OAuth web client in Google Cloud and add its ID and secret under Authentication → Providers → Google.
4. Put the Project URL and the **anon** key in [`config.js`](config.js) (never the service_role key), then commit.

Every table uses row-level security, so learners can only read and change their own profile and progress. The Profile page offers data download and account deletion; the privacy policy is at `#privacy`.
