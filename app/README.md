# Idébanken

Det offentlige idéboard fra Claude Design-designet `Idé Board v2`, bygget som en
rigtig app: React + TypeScript + Vite i frontend, Supabase (Postgres, Auth,
Realtime) i backend.

To dele:

- **`/`** — brættet som en besøgende ser det. Ingen login. Man kan søge, filtrere
  på område, sortere, stemme, kommentere og indsende nye idéer.
- **`/admin`** — kun dig. Træk kort mellem kolonner, godkend eller afvis nye
  indsendelser, flet dubletter, rediger tekst, skriv officielle svar, modérer
  kommentarer, se statistik og slå reglerne til og fra.

## Kom i gang

```bash
npm install
cp .env.example .env.local     # udfyld med værdierne fra Supabase
npm run dev
```

### 1. Databasen

**Er allerede kørt** på projektet `IdeBanken`
(`vijrgeoqukkwnjanhwcm`, eu-west-1): alle migrationer i `supabase/migrations/`
plus `supabase/seed.sql` med de 14 eksempelidéer fra prototypen.

Skal du sætte et nyt miljø op, kør filerne i `supabase/migrations/` i
rækkefølge i SQL Editor, eller med CLI'en:

```bash
supabase link --project-ref <ref>
supabase db push
```

Eksempelindholdet er prototypens idéer med opdigtede stemmetal. Ryd det med:

```sql
delete from public.ideas where id < 100;
```

### 2. Din admin-bruger

1. Supabase → **Authentication → Users → Add user** → opret dig med e-mail og
   kodeord (sæt "Auto Confirm User").
2. Skriv e-mailen på allowlisten:

   ```sql
   insert into public.admins (email) values ('din@mail.dk');
   ```

At kunne logge ind er ikke nok — e-mailen skal stå i `admins`, ellers får man
ingen adgang til admin-delen. Luk desuden for selvbetjent oprettelse under
**Authentication → Sign In / Providers → Email → Allow new users to sign up**,
så ingen andre kan lave sig en konto.

### 3. Nøglerne

`.env.local` (ligger allerede lokalt, men er gitignored — sæt de samme to hos
hosten når du deployer):

```
VITE_SUPABASE_URL=https://vijrgeoqukkwnjanhwcm.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_2_n8WPgdpzanUkyXU3V9sg_gZg_o0tj
```

Begge er offentlige og hører til i browseren. `service_role`-nøglen må aldrig
ligge i frontend-koden.

## Sådan er det skruet sammen

### Tre felter styrer hvor en idé er

| Felt           | Betydning                                                            |
| -------------- | -------------------------------------------------------------------- |
| `review_state` | `pending` → `approved` / `discarded`. Moderationen.                   |
| `status`       | Hvilken kolonne på brættet (`nye`, `vurdering`, … `afvist`).          |
| `hidden`       | Godkendt, men taget af brættet igen.                                  |

Offentligheden ser kun `review_state = 'approved' and hidden = false`. Det er
håndhævet i RLS, ikke i frontend.

### Anonyme brugere kan ikke skrive direkte i tabellerne

Alt hvad en besøgende sender, går gennem tre `security definer`-funktioner —
`submit_idea`, `cast_vote` og `add_comment`. De validerer længder, tjekker
honeypot-feltet og rate limiter (5 idéer/time og 10 kommentarer/10 min. pr.
besøgende). `anon` har hverken `insert`, `update` eller `delete` nogen steder.

### "Én stemme pr. besøgende" uden login

Browseren får et tilfældigt `visitor_key` i `localStorage`. Det er ikke et
login og siger intet om hvem man er — det er kun det, der gør det muligt at
stemme uden at oprette sig. Det er aldrig læsbart for offentligheden:
kolonnen er bevidst udeladt af `grant select` på `ideas` og `comments`.

Det kan omgås af den, der rydder sin browser. Det er en bevidst afvejning:
alternativet er at kræve login, og anonymitet var hele pointen.

### Tællere

`up_count`, `down_count` og `comment_count` vedligeholdes af triggers, så
brættet kan hentes med ét kald. Eksempelindholdets stemmetal ligger i
`base_up`/`base_down`, så rigtige stemmer lægger sig oven på dem i stedet for
at nulstille dem. For alt indsendt gennem sitet er de 0.

### Realtime

Brættet lytter på ændringer i `ideas`. Flytter du et kort i admin, rykker det
hos alle med siden åben — uden at nogen skal hente den igen.

## Kommandoer

| Kommando                | Gør                                   |
| ----------------------- | ------------------------------------- |
| `npm run dev`           | Udviklingsserver                      |
| `npm run build`         | Typetjek + produktionsbuild i `dist/`  |
| `npm run lint`          | oxlint                                |
| `supabase/tests/run.sh` | Kører databasetestene (se nedenfor)   |

## Databasetestene

`supabase/tests/` kører migrationer, seed og 38 assertions mod en **lokal**
Postgres — aldrig mod det rigtige projekt. De tjekker det, man ikke kan se på
skærmen: at `visitor_key` ikke kan læses udefra, at `anon` ikke kan skrive
direkte i nogen tabel, at rate limits og honeypot afviser, at en stemme kan
tages tilbage og skiftes, at skjulte kommentarer ikke tælles med, og at
admin-adgang kræver en e-mail på allowlisten — ikke bare et gyldigt login.

```bash
PGHOST=/var/run/postgresql supabase/tests/run.sh
```

`00_supabase_shim.sql` efterligner det, Supabase selv leverer (`auth.jwt()`,
rollerne `anon`/`authenticated`, realtime-publikationen), så migrationerne kan
køre lokalt.

## Deploy

Statisk build — `dist/` kan ligge hvor som helst. Da det er en SPA med
client-side routing, skal hosten sende alle ruter til `index.html`, ellers
giver et direkte hit på `/admin` en 404. `vercel.json` og `public/_redirects`
er med for henholdsvis Vercel og Netlify.

Ligger på Vercel som projektet `idebanken` (personlig konto, intet team).

**Miljøvariabler:** `VITE_SUPABASE_URL` og `VITE_SUPABASE_ANON_KEY` bages ind
i buildet og skal derfor være sat *når der bygges*. Den første deploy blev
lavet med en `.env.production` i selve upload'en. Kobler du projektet til git
i stedet, så sæt de to under Vercel → Project → Settings → Environment
Variables — ellers kaster `src/lib/supabase.ts` ved indlæsning, og siden
bliver hvid.

## Designet

Skinnet er taget direkte fra `../project/Idé Board v2.dc.html`: grøn gradient-
topbar, cremebaggrund, blå panelheaders, Verdana, orange primærknap. Er du i
tvivl om et tal, står originalen i den fil. Admin-delen er bygget i samme
formsprog — den fandtes ikke i v2-designet, hvor admin bevidst var pillet ud.
