import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type Experiment = {
  id: string
  name: string
  src: string
}

const EXPERIMENTS: Experiment[] = [
  { id: 'wfc', name: 'Wave function collapse', src: '/previews/wfc.html' },
  { id: 'ast', name: 'Navigating the code universe', src: '/previews/ast.html' },
  { id: 'glyph', name: 'Morphing glyph', src: '/previews/glyph.html' },
  { id: 'snake', name: 'Snake playing itself', src: '/previews/snake.html' },
  { id: 'pacman', name: 'Pac-Man playing itself', src: '/previews/pacman.html' },
]

const LAST_KEY = 'noventis-labs-last'

function pickExperiment(): Experiment {
  if (typeof window === 'undefined') return EXPERIMENTS[0]
  let last: string | null = null
  try {
    last = sessionStorage.getItem(LAST_KEY)
  } catch {
    // sessionStorage may be unavailable
  }
  const pool = last ? EXPERIMENTS.filter((e) => e.id !== last) : EXPERIMENTS
  const choices = pool.length > 0 ? pool : EXPERIMENTS
  const chosen = choices[Math.floor(Math.random() * choices.length)]
  try {
    sessionStorage.setItem(LAST_KEY, chosen.id)
  } catch {
    // noop
  }
  return chosen
}

export function LabsPage() {
  const [pick] = useState<Experiment>(pickExperiment)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return
      if (e.key === 'r' || e.key === 'R') {
        window.location.reload()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const index = EXPERIMENTS.findIndex((e) => e.id === pick.id) + 1

  return (
    <div className="labs-stage">
      <iframe
        className="labs-frame"
        src={pick.src}
        title={`Noventis Labs experiment - ${pick.name}`}
      />

      <Link className="labs-brand" to="/">
        Noventis
      </Link>

      <div className="labs-panel">
        <p className="eyebrow">
          Labs &middot; experiment <span className="labs-counter">{index} / {EXPERIMENTS.length}</span>
        </p>
        <h1 className="labs-title">{pick.name}</h1>
        <div className="labs-actions">
          <button
            type="button"
            className="primary-button labs-refresh"
            onClick={() => window.location.reload()}
          >
            Refresh for another &rarr;
          </button>
          <Link className="ghost-button" to="/">
            &larr; Home
          </Link>
        </div>
        <p className="labs-hint">
          or press <kbd>R</kbd>
        </p>
      </div>
    </div>
  )
}
