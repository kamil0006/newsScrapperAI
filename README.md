# newsScrapperAI

A personal AI/tech/gaming news reader that finds, scores, and organizes content for you — less scrolling, more signal.

## How it works

1. **Collection** — Hacker News (official API) plus a dozen+ RSS feeds (Ars Technica, TechCrunch, PC Gamer, IGN, and others).
2. **AI classification** — each news item gets a category, a priority (1-5), a short summary, a reliability score, and a flag for "is this sponsored/promo". For promising AI news, the full article is fetched and scored in more detail.
3. **Organization** — duplicate detection across sources (boosting priority when several independent outlets cover the same story), grouping into threads for developing stories, and filtering out sponsored/promo content and foreign languages.
4. **Reading** — a list sorted by what's worth reading, with saving, read history, search, an AI chat that answers from your own article database, and a "catch up" mode after being away for a while.

Access is account-based (email + password) — each user has their own saved/read/dismissed state, while the news database is shared. Sign-up is currently open (no email confirmation — that needs a custom domain), so keep the app link only with people you want to have access.

## Stack

Next.js (App Router) · TypeScript · Prisma + SQLite · OpenAI API · Tailwind CSS · Vitest

## Running it

```bash
npm install
cp .env.example .env   # fill in OPENAI_API_KEY and SESSION_SECRET (openssl rand -base64 32)
npx prisma migrate dev
npm run dev
```

The app starts at `http://localhost:3000`. Click "Fetch new news" in the sidebar to pull and classify the first batch.

## Tests

```bash
npm run test
```
