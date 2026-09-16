# Idébanken

Et offentligt idéboard: folk sender idéer ind uden at oprette sig, og kan følge
dem hele vejen fra forslag til udgivelse.

- **`app/`** — selve applikationen. React + TypeScript + Vite i frontend,
  Supabase (Postgres, Auth, Realtime) i backend. Start i
  [`app/README.md`](app/README.md) — den beskriver opsætning, hvordan
  databasen er skruet sammen, og hvorfor.
- **`project/`** og **`chats/`** — designmaterialet fra Claude Design som
  applikationen er bygget efter. `project/Idé Board v2.dc.html` er den
  prototype skrivebordsvisningen matcher 1:1; er du i tvivl om en farve eller
  et mål, står originalen der. `chats/` er samtalen designet blev til i.

## Kort fortalt

Brættet har syv statuskolonner (Nye idéer → Under vurdering → Godkendt →
I udvikling → Under test → Udgivet → Afslået). Besøgende kan søge, filtrere på
område, stemme og kommentere — alt sammen anonymt. Nye indsendelser lander i en
kø og kommer først på brættet når de er godkendt.

`/admin` er adgangsbegrænset og er der, idéerne administreres: træk kort mellem
kolonner, godkend eller afvis, flet dubletter, skriv officielle svar og modérer
kommentarer.

## Sikkerhed

Anonyme brugere kan hverken indsætte, ændre eller slette direkte i nogen tabel.
Alt hvad de sender går gennem tre databasefunktioner, der validerer, tjekker
honeypot og rate limiter. Hvad offentligheden må se, er håndhævet i RLS — ikke
i browseren. `app/supabase/tests/` kører de grænser igennem mod en lokal
Postgres.

At kunne logge ind giver ikke adgang til admin: e-mailen skal stå på en
allowlist i databasen.
