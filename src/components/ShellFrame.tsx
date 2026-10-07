import { Suspense, useEffect, useRef, type ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useSignOut } from '../context/useSignOut'

const BASE_TITLE = 'CEFT · Diagnóstico tributario'

export function ShellFrame({
  navLabel,
  mark,
  name,
  titles,
  footer,
  contained = false,
  children,
}: {
  navLabel: string
  mark: string
  name: string
  titles: Record<string, string>
  footer: ReactNode
  // Limita el ancho del contenido al mismo del Diagnóstico Base.
  contained?: boolean
  children: ReactNode
}) {
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const title = titles[pathname]

  useEffect(() => {
    document.title = title ? `${title} · ${name}` : BASE_TITLE
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname, title, name])

  return (
    <div className="shell">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <nav className="nav" aria-label={navLabel}>
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            {mark}
          </div>
          {name}
        </div>
        {children}
        <div className="nav-foot">
          <div className="nav-user">{footer}</div>
          <SignOutButton />
        </div>
      </nav>
      <main id="contenido" className={contained ? 'main main-contained' : 'main'} ref={mainRef} tabIndex={-1}>
        <Suspense fallback={<p className="muted">Cargando…</p>}>
          <Outlet />
        </Suspense>
      </main>
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
