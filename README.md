# newsScrapperAI

Osobisty czytnik newsów z AI/tech/gier, który sam wyszukuje, ocenia i porządkuje treści — mniej scrollowania, więcej sygnału.

## Jak to działa

1. **Zbieranie** — Hacker News (oficjalne API) + kilkanaście feedów RSS (Ars Technica, TechCrunch, PC Gamer, IGN i inne).
2. **Klasyfikacja AI** — każdy news dostaje kategorię, priorytet (1-5), krótkie streszczenie, ocenę rzetelności i flagę "czy to sponsorowane/promo". Dla obiecujących newsów AI pobiera pełną treść artykułu i ocenia dokładniej.
3. **Porządkowanie** — wykrywanie duplikatów między źródłami (z podbiciem priorytetu, gdy kilka niezależnych portali pisze o tym samym), łączenie w wątki tematyczne rozwijających się historii, filtr sponsorowanych/promo treści i obcych języków.
4. **Czytanie** — lista posortowana wg tego, co warto przeczytać, z zapisywaniem, historią przeczytanych, wyszukiwarką, czatem AI odpowiadającym na podstawie Twojej bazy, oraz trybem "dogoń się" po dłuższej nieobecności.

Dostęp przez konto (email + hasło) — każdy użytkownik ma własne zapisane/przeczytane/odrzucone, baza newsów jest wspólna. Rejestracja jest obecnie otwarta (bez potwierdzania maila — to wymaga własnej domeny), więc link do apki warto trzymać tylko dla osób, którym chcesz dać dostęp.

## Stack

Next.js (App Router) · TypeScript · Prisma + SQLite · OpenAI API · Tailwind CSS · Vitest

## Uruchomienie

```bash
npm install
cp .env.example .env   # uzupełnij OPENAI_API_KEY i SESSION_SECRET (openssl rand -base64 32)
npx prisma migrate dev
npm run dev
```

Aplikacja wystartuje na `http://localhost:3000`. Kliknij "Pobierz nowe newsy" w panelu bocznym, żeby zaciągnąć i sklasyfikować pierwszą partię.

## Testy

```bash
npm run test
```
