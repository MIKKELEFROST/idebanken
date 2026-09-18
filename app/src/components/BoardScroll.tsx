import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react'

const MINDSTE_GREB = 40

type Greb = { synlig: boolean; bredde: number; venstre: number }
const SKJULT: Greb = { synlig: false, bredde: 0, venstre: 0 }

/**
 * Brættet ruller vandret, og browserens egen rullebjælke sidder i bunden af
 * kolonnerne. Er en kolonne lang, havner den langt under skærmkanten, og så er
 * der ingen der opdager at der er flere kolonner til højre.
 *
 * Derfor en bjælke over brættet i stedet. Den er tegnet i hånden og ikke en
 * rigtig rullebjælke: flere browsere lægger bjælken oven på indholdet og lader
 * den fylde nul, og så ville den være lige så usynlig som den vi flyttede.
 * Brættet ruller stadig ganske almindeligt med hjul, pegefelt og finger.
 */
export function BoardScroll({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  const braet = useRef<HTMLDivElement>(null)
  const spor = useRef<HTMLDivElement>(null)
  const [greb, setGreb] = useState<Greb>(SKJULT)

  const maal = useCallback(() => {
    const el = braet.current
    if (!el) return

    // Sporet er lige så bredt som brættet — de er søskende i samme spalte. Vi
    // måler på brættet, fordi sporet er skjult og nul bredt, når der ikke er
    // noget at rulle i, og så ville det aldrig komme frem igen.
    const sporBredde = el.clientWidth
    if (sporBredde === 0 || el.scrollWidth <= el.clientWidth + 1) {
      setGreb((f) => (f.synlig ? SKJULT : f))
      return
    }

    const bredde = Math.max(MINDSTE_GREB, (sporBredde * el.clientWidth) / el.scrollWidth)
    const andel = el.scrollLeft / (el.scrollWidth - el.clientWidth)
    const venstre = (sporBredde - bredde) * Math.min(1, Math.max(0, andel))

    setGreb((f) =>
      f.synlig && Math.abs(f.bredde - bredde) < 0.5 && Math.abs(f.venstre - venstre) < 0.5
        ? f
        : { synlig: true, bredde, venstre },
    )
  }, [])

  // Efter hver tegning, så et skift af filter eller af antal kolonner fanges.
  useLayoutEffect(maal)

  useEffect(() => {
    const el = braet.current
    if (!el) return
    const ro = new ResizeObserver(maal)
    ro.observe(el)
    return () => ro.disconnect()
  }, [maal])

  // ---------------------------------------------------------------- træk

  const traek = useRef<{ x: number; fra: number } | null>(null)

  const rulTil = (x: number) => {
    const el = braet.current
    if (!el) return
    const rest = el.clientWidth - greb.bredde
    if (rest <= 0) return
    el.scrollLeft = ((x - greb.bredde / 2) / rest) * (el.scrollWidth - el.clientWidth)
  }

  const grebNed = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = braet.current
    if (!el) return
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    traek.current = { x: e.clientX, fra: el.scrollLeft }
  }

  const grebFlyt = (e: ReactPointerEvent<HTMLDivElement>) => {
    const t = traek.current
    const el = braet.current
    if (!t || !el) return
    const rest = el.clientWidth - greb.bredde
    if (rest <= 0) return
    el.scrollLeft = t.fra + ((e.clientX - t.x) / rest) * (el.scrollWidth - el.clientWidth)
  }

  const grebOp = (e: ReactPointerEvent<HTMLDivElement>) => {
    traek.current = null
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  // Klik ved siden af grebet flytter det derhen.
  const sporNed = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!spor.current) return
    rulTil(e.clientX - spor.current.getBoundingClientRect().left)
  }

  return (
    <>
      <div
        className="board-rail"
        ref={spor}
        hidden={!greb.synlig}
        aria-hidden="true"
        onPointerDown={sporNed}
      >
        <div
          className="board-rail-grip"
          style={{ width: greb.bredde, transform: `translateX(${greb.venstre}px)` }}
          onPointerDown={grebNed}
          onPointerMove={grebFlyt}
          onPointerUp={grebOp}
          onPointerCancel={grebOp}
        />
      </div>

      <div className="board" ref={braet} style={style} onScroll={maal}>
        {children}
      </div>
    </>
  )
}
