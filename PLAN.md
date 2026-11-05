# Plan: Done!

En delad todolist som ser likadan ut på dator och telefon. Appen heter **Done!** och har en stiliserad ibockad ruta framför namnet. Repot heter `done`.

## Beslut

- **Innehåll:** enskilda punkter och projekt med underpunkter (en nivå). Allt går att kryssa i.
- **Ordning:** nyast först överallt, både på översta nivån och bland underpunkter. Ikryssade punkter hamnar längst ner (i sitt projekt, eller längst ner i listan för enskilda punkter) och blir svagare grå.
- **Redigering:** skapa, kryssa i, byta namn och ta bort. Dessutom "Ta bort alla ikryssade" i ett projekt.
- **Projekt och underpunkter hänger ihop:** när alla underpunkter är klara markeras projektet som klart. Kryssar man projektet blir alla underpunkter klara. Kryssar man ur en underpunkt blir projektet ogjort igen. Ett projekt utan underpunkter går att kryssa själv. Logiken ligger i backenden.
- **Åtkomst:** ett delat lösenord. Du skriver det en gång per enhet och får en inloggningskaka. Lösenordet ligger i `.env`.
- **Hosting:** bara lokalt först (`http://localhost:3000`). Driftsättning är inte med i den här planen.
- **Språk:** svenska i gränssnitt och felmeddelanden. Typsnitt: Outfit. Glad design med varma färger, mobilanpassad.

## Teknik

- Node.js + Express, REST-API under `/api`. En enda server på port 3000.
- Utveckling: Express kör Vite i middleware-läge. Produktion: Express skickar ut `dist/`.
- React (JavaScript, ingen TypeScript).
- Postgres hos Supabase via `@supabase/supabase-js` med den hemliga nyckeln. Frontenden pratar bara med vår egen backend.
- Migrationer i `supabase/migrations/`, skickas med `supabase db push`. Row Level Security är på för alla tabeller.
- Backenden skapas med `createApp({ repo, config })`, så att testerna kan skicka in en låtsasdatabas (`repo` i minnet) utan Supabase eller nyckel.
- Tester: `node --test`. GitHub Actions kör dem på varje pull request.

### Miljövariabler (`.env`, aldrig i Git)

| Namn | Vad |
| --- | --- |
| `SUPABASE_URL` | Projektets adress |
| `SUPABASE_SECRET_KEY` | Hemliga nyckeln. Maria klistrar in den själv. Be aldrig om den i chatten. |
| `APP_PASSWORD` | Det delade lösenordet |
| `SESSION_SECRET` | Slumpsträng för att signera inloggningskakan |
| `PORT` | Valfri, standard 3000 |

`.env.example` listar namnen utan värden och checkas in.

## Databas

RLS är på, men inga policyer skapas. Då släpper Supabase inte in anon-nyckeln alls. Backenden använder den hemliga nyckeln, som går förbi RLS.

### Tabell `todos`

Både punkter och projekt ligger i samma tabell. Underpunkter pekar på sitt projekt.

| Kolumn | Typ | Regler |
| --- | --- | --- |
| `id` | `uuid` | Primärnyckel, `default gen_random_uuid()` |
| `kind` | `text` | `not null`, `check (kind in ('item','project'))` |
| `title` | `text` | `not null`, `check (char_length(btrim(title)) between 1 and 200)` |
| `parent_id` | `uuid` | Null eller `references todos(id) on delete cascade`. Bara tillåtet när `kind = 'item'`. |
| `done` | `boolean` | `not null default false` |
| `done_at` | `timestamptz` | Null tills punkten kryssas i |
| `created_at` | `timestamptz` | `not null default now()` |

- Check: `kind = 'project'` kräver `parent_id is null`.
- Backenden kontrollerar dessutom att `parent_id` pekar på ett projekt.
- Index på `(parent_id, created_at desc)`.
- Ta bort ett projekt tar bort alla dess underpunkter (`on delete cascade`).

## API

Alla adresser utom `/api/health` och `/api/login` kräver inloggning och svarar annars `401`. Fel i indata ger `400` med JSON `{ "fel": "<svensk text>" }`. Alla svar är JSON utom `204`.

| Metod | Adress | Vad den gör | Statuskoder |
| --- | --- | --- | --- |
| GET | `/api/health` | Visar att servern lever | 200 |
| POST | `/api/login` | Tar `{ lösenord }`, sätter inloggningskaka | 200, 400, 401 |
| POST | `/api/logout` | Rensar kakan | 204 |
| GET | `/api/session` | Visar om man är inloggad | 200, 401 |
| GET | `/api/todos` | Hela listan: nyast först, projekt med `children`, ikryssade sist | 200, 401, 500 |
| POST | `/api/todos` | Skapar punkt eller projekt: `{ title, kind, parent_id? }` | 201, 400, 401, 404 (projektet finns inte), 500 |
| PATCH | `/api/todos/:id` | Ändrar `title` och/eller `done` | 200, 400, 401, 404, 500 |
| DELETE | `/api/todos/:id` | Tar bort punkten (projekt tas bort med underpunkter) | 204, 400, 401, 404, 500 |
| DELETE | `/api/todos/:id/done` | Tar bort alla ikryssade underpunkter i projektet | 200 (`{ borttagna: n }`), 400, 401, 404, 500 |

Validering (alltid 400 med tydligt svenskt meddelande, till exempel "Titeln får inte vara tom."):

- `title`: sträng, efter trim 1–200 tecken.
- `kind`: `item` eller `project`.
- `parent_id`: giltigt uuid, bara med `kind = 'item'`.
- `done`: boolean.
- `:id`: giltigt uuid.
- Okända fält och ogiltig JSON avvisas. Ett tomt PATCH-anrop avvisas.
- Ett projekt kan inte ha ett projekt som förälder.

## Steg

Varje steg görs i en egen session på en egen branch och blir en egen pull request. Bocka av steget här när PR:en är öppnad och testerna går igenom.

### [x] Steg 1: Grund, server och CI

Branch: `steg-1-grund`

- `package.json` (ES-moduler), `.env.example`, `.gitignore` kompletteras.
- `server/app.js` med `createApp({ repo, config })` och `GET /api/health`. `server/index.js` startar på port 3000.
- Vite i middleware-läge vid utveckling, `dist/` vid produktion. En minimal React-sida så att Vite har något att bygga.
- Scripts: `dev`, `build`, `start`, `test`.
- Ett första test för `/api/health`.
- `.github/workflows/test.yml` kör `npm ci` och `npm test` på pull requests.

**Klart när:** `npm run dev` visar en sida på http://localhost:3000, `/api/health` svarar 200, `npm test` går igenom utan `.env` och workflowet är grönt på PR:en.

### [x] Steg 2: Databas och repo-lager

Branch: `steg-2-databas`

- `supabase init`, koppla till projektet med `supabase link`.
- Migration i `supabase/migrations/` som skapar `todos` enligt tabellen ovan och slår på RLS.
- `server/repo/supabase.js` och `server/repo/memory.js` med samma gränssnitt: `list`, `create`, `get`, `update`, `remove`, `removeDoneChildren`.
- Gemensamma tester som körs mot minnesversionen.

**Klart när:** `supabase db push` går igenom, tabellen syns i Supabase med RLS på, och repo-testerna går igenom utan nyckel.

### [ ] Steg 3: Todo-API med validering

Branch: `steg-3-todo-api`

- Alla `/api/todos`-adresser enligt tabellen, inklusive logiken som håller projekt och underpunkter i synk.
- Validering med svenska felmeddelanden, enhetlig felhantering och `404` för okända `/api`-adresser.
- Tester med `node --test` mot minnesdatabasen: lyckade fall, varje felkod, sortering (nyast först, ikryssade sist), projektlogiken och cascade-borttagning.

**Klart när:** `npm test` går igenom utan `.env` och en handtestad `curl` mot `npm run dev` skapar, listar, kryssar och tar bort data i Supabase, och datan finns kvar efter omstart.

### [ ] Steg 4: Delat lösenord

Branch: `steg-4-losenord`

- `/api/login`, `/api/logout`, `/api/session` och en middleware som kräver inloggning på övriga `/api`-adresser.
- Signerad `httpOnly`-kaka med `SameSite=Lax`, giltig länge (till exempel 90 dagar). Jämförelse av lösenordet i konstant tid. Enkel begränsning av antal inloggningsförsök.
- Tester: rätt och fel lösenord, saknad kaka ger 401 på alla skyddade adresser, utloggning.

**Klart när:** testerna går igenom, anrop utan inloggning får 401 och med rätt lösenord går allt igenom.

### [ ] Steg 5: Frontend, utseende och lista

Branch: `steg-5-frontend-lista`

- Outfit via Google Fonts, varma färger (till exempel korall, honungsgul, krämvit), rundade former. Logotyp: stiliserad ibockad ruta + "Done!".
- Inloggningsvy på svenska.
- Listvy som hämtar `/api/todos`: projekt med underpunkter, enskilda punkter, ikryssade längst ner och svagare grå. Tomt läge och laddningsläge.
- Mobil först, fungerar från cirka 360 px till dator.

**Klart när:** man loggar in på http://localhost:3000, ser listan från databasen och den ser rätt ut både i smalt mobilfönster och på bred skärm.

### [ ] Steg 6: Frontend, redigering

Branch: `steg-6-frontend-redigering`

- Lägg till punkt, projekt och underpunkt. Kryssa i och ur. Byt namn. Ta bort (med bekräftelse för projekt). "Ta bort alla ikryssade" i ett projekt.
- Felmeddelanden från API:et visas på svenska. Listan uppdateras direkt och synkas mot servern.
- Läsa om listan när fliken blir aktiv, så att dator och telefon hänger ihop.

**Klart när:** alla åtgärder fungerar i webbläsaren, en ändring på datorn syns på telefonen (eller i ett andra fönster) efter omladdning eller när fliken blir aktiv, och listan finns kvar efter att servern startats om.

### [ ] Steg 7: Produktionsbygge och avslut

Branch: `steg-7-produktion`

- `npm run build` + `npm start` skickar ut färdiga filer och API på samma adress (port 3000).
- Titel, favicon och `manifest` (så att man kan lägga appen på hemskärmen), fel-, tom- och offlinelägen.
- `README.md` på svenska: installera, `.env`, `supabase db push`, köra och testa.
- Genomgång mot alla krav ovan.

**Klart när:** `npm run build && npm start` fungerar på http://localhost:3000, telefonen når appen via datorns lokala adress, och README räcker för att starta projektet från noll.
