/** "3 uger siden", "1 dag siden", "lige nu" — samme tone som i designet. */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''

  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000))
  if (seconds < 60) return 'lige nu'

  const units: [number, string, string][] = [
    [60, 'minut', 'minutter'],
    [60 * 60, 'time', 'timer'],
    [60 * 60 * 24, 'dag', 'dage'],
    [60 * 60 * 24 * 7, 'uge', 'uger'],
    [60 * 60 * 24 * 30, 'måned', 'måneder'],
    [60 * 60 * 24 * 365, 'år', 'år'],
  ]

  let chosen = units[0]
  for (const unit of units) if (seconds >= unit[0]) chosen = unit

  const amount = Math.floor(seconds / chosen[0])
  return `${amount} ${amount === 1 ? chosen[1] : chosen[2]} siden`
}

export function shortDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })
}
