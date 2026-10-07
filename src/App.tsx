import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { RequireSession } from './components/RequireSession'
import { RunProvider } from './context/RunProvider'
import { SessionProvider } from './context/SessionProvider'
import { ThreadsProvider } from './context/ThreadsProvider'
import { ANALYSIS_PATH, REPORT_PATH } from './lib/routes'
import { AnalysisPage } from './pages/AnalysisPage'
import { DiagnosticoPage } from './pages/DiagnosticoPage'
import { InsightPage } from './pages/InsightPage'
import { LoginPage } from './pages/LoginPage'

// La consola de administración se carga solo cuando se entra a /admin.
const AdminShell = lazy(() =>
  import('./components/AdminShell').then((m) => ({ default: m.AdminShell })),
)
const AdminClientsPage = lazy(() =>
  import('./pages/admin/AdminClientsPage').then((m) => ({ default: m.AdminClientsPage })),
)
const AdminRadiografiaPage = lazy(() =>
  import('./pages/admin/AdminRadiografiaPage').then((m) => ({
    default: m.AdminRadiografiaPage,
  })),
)
const AdminAgentPage = lazy(() =>
  import('./pages/admin/AdminAgentPage').then((m) => ({ default: m.AdminAgentPage })),
)

// Redirige al Diagnóstico Base conservando el ancla (enlaces antiguos a /numeros#…).
function ToReport() {
  const { hash } = useLocation()
  return <Navigate to={{ pathname: REPORT_PATH, hash }} replace />
}

export default function App() {
  return (
    <SessionProvider>
      <ThreadsProvider>
        <RunProvider>
          <BrowserRouter>
            <Suspense fallback={null}>
              <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route element={<RequireSession />}>
                  <Route element={<AppShell />}>
                    <Route path={REPORT_PATH} element={<DiagnosticoPage />} />
                    <Route path="/numeros" element={<ToReport />} />
                    <Route path={ANALYSIS_PATH} element={<AnalysisPage />} />
                    <Route
                      path={`${ANALYSIS_PATH}/hallazgo/:insightId`}
                      element={<InsightPage />}
                    />
                  </Route>
                </Route>
                <Route element={<RequireSession role="admin" />}>
                  <Route path="/admin" element={<AdminShell />}>
                    <Route index element={<AdminClientsPage />} />
                    <Route path="radiografia" element={<AdminRadiografiaPage />} />
                    <Route path="agente" element={<AdminAgentPage />} />
                  </Route>
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </RunProvider>
      </ThreadsProvider>
    </SessionProvider>
  )
}
