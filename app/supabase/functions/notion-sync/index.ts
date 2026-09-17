// Afstemmer idéerne i Supabase med Notion-databasen "Idébanken", begge veje.
//
// Køres hvert minut af pg_cron. Den er med vilje bygget til at kunne køres igen
// uden bivirkninger: forskellen regnes ud fra tidsstempler ved hvert kald, så et
// kald der fejler halvvejs bliver samlet op af det næste.
//
// Konfliktregel: sidste ændring vinder. Rørte nogen ved rækken i Notion senere
// end idéen blev ændret i Supabase, vinder Notion for de felter der må redigeres
// der. Ellers vinder Supabase.

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const NOTION_TOKEN = Deno.env.get("NOTION_TOKEN")
const DATA_SOURCE_ID = "6a020583-723b-49bc-895b-1efe182988b4"
const NOTION_VERSION = "2022-06-28"
const BOARD_URL = "https://idebanken-mikkel-9021s-projects.vercel.app"

// Statusværdien i databasen over for etiketten i Notion.
const STATUS_TIL_NOTION: Record<string, string> = {
  nye: "Nye idéer",
  vurdering: "Under vurdering",
  planlagt: "Godkendt",
  udvikling: "I udvikling",
  test: "Under test",
  udgivet: "Udgivet",
  afvist: "Afslået",
}
const STATUS_FRA_NOTION: Record<string, string> = Object.fromEntries(
  Object.entries(STATUS_TIL_NOTION).map(([k, v]) => [v, k]),
)

// Notion tillader ikke kommaer i select-værdier, så ét område staves anderledes.
const OMRAADE_MED_KOMMA = "Spilleregenskaber, værdier og vurderinger"
const OMRAADE_UDEN_KOMMA = "Spilleregenskaber – værdier og vurderinger"
const omraadeTilNotion = (v: string) => (v === OMRAADE_MED_KOMMA ? OMRAADE_UDEN_KOMMA : v)
const omraadeFraNotion = (v: string) => (v === OMRAADE_UDEN_KOMMA ? OMRAADE_MED_KOMMA : v)

async function notion(path: string, init: RequestInit = {}) {
  const res = await fetch(`https://api.notion.com/v1/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) {
    throw new Error(`Notion ${path}: ${res.status} ${await res.text()}`)
  }
  return await res.json()
}

type Idea = {
  id: number
  title: string
  body: string
  category: string
  importance: string
  author: string
  status: string
  hidden: boolean
  official_reply: string
  up_count: number
  down_count: number
  comment_count: number
  created_at: string
  updated_at: string
  notion_page_id: string | null
  notion_synced_at: string | null
}

const tekst = (v: string) => ({ rich_text: [{ text: { content: (v ?? "").slice(0, 2000) } }] })
const valg = (v: string | null) => ({ select: v ? { name: v } : null })

function egenskaberFra(idea: Idea) {
  return {
    "Titel": { title: [{ text: { content: idea.title.slice(0, 2000) } }] },
    "Idé-nr": { number: idea.id },
    "Status": valg(STATUS_TIL_NOTION[idea.status] ?? null),
    "Område": valg(omraadeTilNotion(idea.category)),
    "Vigtighed": valg(idea.importance),
    "Score": { number: idea.up_count - idea.down_count },
    "For": { number: idea.up_count },
    "Imod": { number: idea.down_count },
    "Kommentarer": { number: idea.comment_count },
    "Indsender": tekst(idea.author),
    "Beskrivelse": tekst(idea.body),
    "Officielt svar": tekst(idea.official_reply),
    "Vis på brættet": { checkbox: !idea.hidden },
    "Indsendt": { date: { start: idea.created_at } },
    "Synkroniseret": { date: { start: new Date().toISOString() } },
  }
}

Deno.serve(async () => {
  const startet = new Date().toISOString()

  if (!NOTION_TOKEN) {
    return new Response(
      JSON.stringify({
        ok: false,
        fejl: "NOTION_TOKEN mangler. Sæt den under Edge Functions → Secrets.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    )
  }

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )

  let udTilNotion = 0
  let indFraNotion = 0

  try {
    const { data: state } = await db
      .from("sync_state").select("last_run").eq("id", 1).single()
    const sidst = state?.last_run ?? "1970-01-01T00:00:00Z"

    // ---------------------------------------------- Supabase -> Notion
    // Alt der er godkendt og ændret siden sidst, eller endnu ikke har en række.
    const { data: ideer, error } = await db
      .from("ideas")
      .select("*")
      .eq("review_state", "approved")
      .order("id")
    if (error) throw new Error(`Supabase læsning: ${error.message}`)

    for (const idea of (ideer ?? []) as Idea[]) {
      const skalUd =
        !idea.notion_page_id ||
        !idea.notion_synced_at ||
        new Date(idea.updated_at) > new Date(idea.notion_synced_at)
      if (!skalUd) continue

      if (idea.notion_page_id) {
        await notion(`pages/${idea.notion_page_id}`, {
          method: "PATCH",
          body: JSON.stringify({ properties: egenskaberFra(idea) }),
        })
      } else {
        const side = await notion("pages", {
          method: "POST",
          body: JSON.stringify({
            parent: { type: "data_source_id", data_source_id: DATA_SOURCE_ID },
            properties: egenskaberFra(idea),
            children: [
              {
                object: "block",
                type: "paragraph",
                paragraph: {
                  rich_text: [{ text: { content: idea.body.slice(0, 2000) } }],
                },
              },
              {
                object: "block",
                type: "bookmark",
                bookmark: { url: BOARD_URL },
              },
            ],
          }),
        })
        await db.from("ideas").update({ notion_page_id: side.id }).eq("id", idea.id)
        idea.notion_page_id = side.id
      }

      // Sættes råt, så updated_at-triggeren ikke starter en ny runde.
      await db.rpc("marker_notion_synkroniseret", { p_id: idea.id })
      udTilNotion++
    }

    // ---------------------------------------------- Notion -> Supabase
    // Kun rækker der er rørt siden sidste kørsel.
    const svar = await notion(`data_sources/${DATA_SOURCE_ID}/query`, {
      method: "POST",
      body: JSON.stringify({
        filter: { timestamp: "last_edited_time", last_edited_time: { after: sidst } },
        page_size: 100,
      }),
    })

    for (const side of svar.results ?? []) {
      const p = side.properties ?? {}
      const nr = p["Idé-nr"]?.number
      if (!nr) continue

      const { data: idea } = await db
        .from("ideas").select("id,updated_at,notion_page_id").eq("id", nr).single()
      if (!idea) continue

      // Sidste ændring vinder: er idéen ændret i Supabase efter Notion-rækken,
      // lader vi den være — næste runde skubber Supabase-versionen ud i stedet.
      if (new Date(idea.updated_at) > new Date(side.last_edited_time)) continue

      const status = STATUS_FRA_NOTION[p["Status"]?.select?.name ?? ""]
      const omraade = p["Område"]?.select?.name
      const titel = p["Titel"]?.title?.[0]?.plain_text
      const beskrivelse = p["Beskrivelse"]?.rich_text?.[0]?.plain_text
      const svarTekst = p["Officielt svar"]?.rich_text?.[0]?.plain_text ?? ""
      const vis = p["Vis på brættet"]?.checkbox

      const ændringer: Record<string, unknown> = {}
      if (status) ændringer.status = status
      if (omraade) ændringer.category = omraadeFraNotion(omraade)
      if (titel && titel.trim().length >= 3) ændringer.title = titel.trim()
      if (beskrivelse && beskrivelse.trim().length >= 20) ændringer.body = beskrivelse.trim()
      ændringer.official_reply = svarTekst
      if (typeof vis === "boolean") ændringer.hidden = !vis
      if (!idea.notion_page_id) ændringer.notion_page_id = side.id

      const { error: opdErr } = await db.from("ideas").update(ændringer).eq("id", nr)
      if (opdErr) throw new Error(`Supabase skrivning #${nr}: ${opdErr.message}`)
      await db.rpc("marker_notion_synkroniseret", { p_id: nr })
      indFraNotion++
    }

    await db.from("sync_state").update({
      last_run: startet,
      last_ok: new Date().toISOString(),
      last_error: null,
      ud_til_notion: udTilNotion,
      ind_fra_notion: indFraNotion,
    }).eq("id", 1)

    return new Response(
      JSON.stringify({ ok: true, ud_til_notion: udTilNotion, ind_fra_notion: indFraNotion }),
      { headers: { "Content-Type": "application/json" } },
    )
  } catch (e) {
    const besked = e instanceof Error ? e.message : String(e)
    await db.from("sync_state").update({ last_error: besked }).eq("id", 1)
    return new Response(JSON.stringify({ ok: false, fejl: besked }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
