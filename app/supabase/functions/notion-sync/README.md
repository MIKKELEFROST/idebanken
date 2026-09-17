# notion-sync

Afstemmer idéerne i Supabase med Notion-databasen "Idébanken", begge veje.
Køres hvert minut af pg_cron (se migrationen `20260917070000_notion_sync.sql`).

## Kræver

Én hemmelighed, sat under **Supabase → Edge Functions → Secrets**:

| Navn | Værdi |
| --- | --- |
| `NOTION_TOKEN` | Den interne integrations-token fra Notion (starter med `ntn_`) |

Notion-databasen skal desuden være delt med den samme integration
(databasen → ••• → Connections).

Uden nøglen svarer funktionen `503` med en forklarende besked og rører intet.

## Hvad synkroniseres

Fra Supabase til Notion: alt. Titel, beskrivelse, status, område, vigtighed,
stemmetal, antal kommentarer, indsender, officielt svar og om idéen er synlig.

Fra Notion tilbage til Supabase: kun det der giver mening at redigere der —
status, område, titel, beskrivelse, officielt svar og synlighed. Stemmer og
kommentarer kommer fra besøgende og skrives aldrig tilbage.

## Konflikter

Sidste ændring vinder. Er Notion-rækken rørt senere end idéen blev ændret i
Supabase, vinder Notion for de redigerbare felter. Ellers vinder Supabase, og
næste kørsel skubber Supabase-versionen ud i stedet.

## Hvorfor hvert minut i stedet for triggere

Funktionen kan køres igen uden bivirkninger — den regner forskellen ud fra
tidsstempler ved hvert kald. Et kald der fejler halvvejs bliver samlet op af
det næste, og der er ingen kø at holde styr på. Prisen er op til et minuts
forsinkelse fra Notion ud til brættet. Den anden vej, fra Supabase til selve
idéboardet, er stadig øjeblikkelig — den kører på Supabase Realtime.
