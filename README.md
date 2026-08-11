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

Live at https://croftycode.github.io/number-forge/

Pushing to `main` builds and publishes automatically via
`.github/workflows/deploy.yml`. Nothing to run by hand.

Asset paths are all relative (`base: './'` in the Vite config), so the
build works under a sub-path like `/number-forge/` as well as at a
domain root. If you ever move it to a host that serves from the root,
it will still work unchanged.

To host it somewhere else instead, build command `npm run build`,
output directory `dist`, and set these two environment variables:

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
