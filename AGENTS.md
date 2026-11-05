# AGENTS.md

Done! är en delad todolist: React-frontend, Express-backend och Postgres hos Supabase i ett projekt. Planen med steg, API och tabeller finns i [PLAN.md](PLAN.md). Läs den först.

## Arbetssätt

- Ett steg i PLAN.md per session. Varje steg görs på en egen branch (namnet står i steget) och avslutas med en pull request som öppnas med `gh pr create`.
- Kör `npm test` och se till att alla tester går igenom innan pull requesten öppnas.
- Bocka av steget i PLAN.md (`[x]`) i samma pull request.
- Committa aldrig direkt på `main`.

## Hemligheter

- `.env` får aldrig in i Git. Läs den inte och skriv aldrig ut värden.
- Be aldrig användaren klistra in nyckeln i chatten. Användaren lägger in den själv i `.env`.
- Nya miljövariabler läggs till i `.env.example` utan värden.

## Kodregler

- JavaScript (ES-moduler), ingen TypeScript. Node 20 eller senare.
- Allt som syns för användaren, inklusive felmeddelanden från API:et, ska vara på svenska.
- Backenden validerar all indata och svarar `400` med `{ "fel": "<tydlig svensk text>" }`.
- Frontenden pratar bara med vårt eget API under `/api`, aldrig direkt med Supabase.
- En enda server på port 3000 skickar både sidor och API. `npm run dev` kör Vite i middleware-läge i Express.
- Databasändringar görs som nya filer i `supabase/migrations/` och skickas med `supabase db push`. Alla tabeller har Row Level Security på.
- Tester använder `node --test` och byter ut databasen mot `server/repo/memory.js`. De ska aldrig kräva `.env` eller prata med Supabase.
- Håll ändringarna inom det aktuella steget.
