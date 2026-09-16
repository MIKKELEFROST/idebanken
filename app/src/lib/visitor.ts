const KEY = 'ideboard.visitor'

/**
 * Et tilfældigt id pr. browser. Det er ikke et login og siger intet om hvem
 * man er — det er kun det der gør "én stemme pr. besøgende" muligt uden at
 * bede nogen om at oprette sig.
 */
export function visitorKey(): string {
  try {
    const existing = localStorage.getItem(KEY)
    if (existing) return existing
    const fresh = crypto.randomUUID()
    localStorage.setItem(KEY, fresh)
    return fresh
  } catch {
    // Privat vindue eller blokeret storage: stemmer virker for denne
    // sidevisning, men huskes ikke.
    return crypto.randomUUID()
  }
}
