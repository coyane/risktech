import { Suspense, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useSignOut } from '../context/useSignOut'

export const BRAND = 'Innovacred'
const BASE_TITLE = `${BRAND} · Diagnóstico tributario`

// Marco de la aplicación: menú lateral en una tarjeta y el contenido al lado.
// Bajo 1024 px el menú se abre como hoja desde un botón; la página puede agregar
// una barra inferior propia (mobileBar) que también abre ese menú.
export function ShellFrame({
  navLabel,
  titles,
  footer,
  agent,
  bare = false,
  contained = false,
  mobileBar,
  children,
}: {
  navLabel: string
  titles: Record<string, string>
  footer: ReactNode
  // Tarjeta fija al pie del menú (la sección del agente).
  agent?: ReactNode
  // La página dibuja sus propias tarjetas: el contenido va sin fondo.
  bare?: boolean
  // Limita el ancho del contenido.
  contained?: boolean
  mobileBar?: (openMenu: () => void) => ReactNode
  children: ReactNode
}) {
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuId = useId()
  const title = titles[pathname]

  useEffect(() => {
    document.title = title ? `${title} · ${BRAND}` : BASE_TITLE
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname, title])

  // El menú se cierra al elegir un enlace y con Escape.
  useEffect(() => {
    if (!menuOpen) return
    menuRef.current?.querySelector<HTMLElement>('a, button')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setMenuOpen(false)
      toggleRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const navContent = (
    <>
      <nav className="nav" aria-label={navLabel}>
        {children}
      </nav>
      {agent}
      <div className="nav-foot">
        <div className="nav-user">{footer}</div>
        <SignOutButton />
      </div>
    </>
  )

  return (
    <div className="shell">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <aside className="side" aria-label="Menú">
        <Brand />
        {navContent}
      </aside>

      <header className="mtop">
        <Brand />
        <button
          ref={toggleRef}
          type="button"
          className="mtop-menu"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          onClick={() => setMenuOpen((value) => !value)}
        >
          <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
            <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Menú
        </button>
      </header>
      <div className="msheet-scrim" hidden={!menuOpen} onClick={() => setMenuOpen(false)} />
      <div
        id={menuId}
        ref={menuRef}
        className="msheet"
        hidden={!menuOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
        onClick={(event) => {
          if ((event.target as HTMLElement).closest('a')) setMenuOpen(false)
        }}
      >
        {navContent}
      </div>

      <main
        id="contenido"
        className={`main${bare ? ' main-bare' : ''}${contained ? ' main-contained' : ''}`}
        ref={mainRef}
        tabIndex={-1}
      >
        <Suspense fallback={<p className="muted">Cargando…</p>}>
          <Outlet />
        </Suspense>
      </main>
      {mobileBar?.(() => setMenuOpen(true))}
    </div>
  )
}

function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark" aria-hidden="true">
        I
      </span>
      {BRAND}
    </div>
  )
}

function SignOutButton() {
  const signOut = useSignOut()

  return (
    <button type="button" className="nav-signout" onClick={signOut}>
      Cerrar sesión
    </button>
  )
}
