# Number Forge

Year 6 consolidation plus the first half of Year 7, built as a daily
training game. Teaches each concept first, then adapts difficulty to
how he is actually doing.

## Run it locally

```bash
npm install
npm run dev
```

## Deploy

Push this folder to a GitHub repo, then import it into Vercel or
Netlify. Build command `npm run build`, output directory `dist`.

Set these two environment variables in the host:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_KEY`

Both are already filled in for you in `.env.example`. The publishable
key is safe to expose, because row level security on the database is
what actually protects the data.

## First run

Choose "Set up a new smith", pick a name and a four digit PIN. The
first session is a warm up that spreads questions across topics to
work out where he actually is, then it starts teaching.

## Adding topics

Curriculum rows already live in Supabase (35 Year 6, 22 Year 7).
The app only shows a topic once teaching content for it exists in
`src/content/topics.js`, so adding a topic means adding one entry
there. Nothing else needs changing.
