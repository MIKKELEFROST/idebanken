import { useEffect, type ReactNode } from 'react'

type Props = {
  onClose: () => void
  /** 'blue' er idé-dialogen, 'green' er indsendelsesformularen. */
  tone?: 'blue' | 'green'
  head: ReactNode
  children: ReactNode
  foot?: ReactNode
  labelledBy?: string
}

export function Modal({ onClose, tone = 'blue', head, children, foot, labelledBy }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    // Baggrunden må ikke rulle med mens dialogen er åben.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  return (
    <>
      <button className="overlay" aria-label="Luk" onClick={onClose} />
      <div className="modal-layer">
        <div
          className={`modal${tone === 'green' ? ' is-form' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
        >
          <div className={`modal-head${tone === 'green' ? ' is-green' : ''}`}>
            {head}
            <button className="modal-close" onClick={onClose} aria-label="Luk">
              ✕
            </button>
          </div>
          <div className="modal-body">{children}</div>
          {foot}
        </div>
      </div>
    </>
  )
}
