import { useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRun } from '../context/run'
import { useSession } from '../context/session'
import { useThreadActions } from '../context/threads'
import {
  createConsent,
  createRun,
  demoScenarios,
  loginSources,
  type DemoScenario,
} from '../lib/api'
import { REPORT_PATH } from '../lib/routes'
import { formatRut, isValidRut, splitRut } from '../lib/rut'

const CONSENT_PURPOSE = 'Elaborar tu diagnóstico tributario y crediticio con el Método ICRED'
const CONSENT_SOURCES = ['F22', 'F29', 'F50', 'BIENES_RAICES', 'ACTIVIDADES']

// ?demo=captcha|mfa|clave|parcial|fallo|error simula cada estado de la captura.
function readScenario(): DemoScenario | null {
  const value = new URLSearchParams(window.location.search).get('demo')
  return demoScenarios.find((item) => item === value) ?? null
}

function rutError(value: string) {
  if (!value.trim()) return 'Ingresa tu RUT.'
  if (!isValidRut(value)) return 'El RUT no es válido. Revisa el número y el dígito verificador.'
  return null
}

function passwordError(value: string) {
  return value ? null : 'Ingresa tu clave tributaria.'
}

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useSession()
  const { startRun, resetRun } = useRun()
  const { clear } = useThreadActions()
  const rutRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const [rut, setRut] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [consent, setConsent] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [touched, setTouched] = useState({ rut: false, password: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rutMessage = touched.rut ? rutError(rut) : null
  const passwordMessage = touched.password ? passwordError(password) : null

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (loading) return
    setTouched({ rut: true, password: true })
    if (rutError(rut)) {
      rutRef.current?.focus()
      return
    }
    if (passwordError(password)) {
      passwordRef.current?.focus()
      return
    }
    setLoading(true)
    setError(null)
    try {
      const identity = splitRut(rut)
      const granted = await createConsent({
        ...identity,
        purpose: CONSENT_PURPOSE,
        sources: CONSENT_SOURCES,
      })
      const { id } = await createRun({
        ...identity,
        password,
        consentId: granted.id,
        sources: CONSENT_SOURCES,
        idempotencyKey: crypto.randomUUID(),
        scenario: readScenario(),
      })
      setPassword('')
      clear()
      signIn('client')
      startRun(id, granted)
      navigate(REPORT_PATH)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo conectar con el SII. Revisa tu conexión e inténtalo de nuevo.',
      )
    } finally {
      setLoading(false)
    }
  }

  function enterAdmin() {
    clear()
    resetRun()
    signIn('admin')
    navigate('/admin')
  }

  return (
    <div className="login">
      <section className="login-hero">
        <div className="brand login-brand">
          <div className="brand-mark" aria-hidden="true">
            C
          </div>
          CEFT
        </div>
        <div className="login-pitch">
          <div className="label-caps">Agente Crediticio, Económico, Financiero y Tributario</div>
          <h1>Conecta tu cuenta del SII y el agente arma tu diagnóstico.</h1>
          <p>
            Al ingresar, el agente lee tus declaraciones, calcula tus indicadores con el Método
            ICRED y te entrega un análisis de apertura en minutos.
          </p>
        </div>
        <ul className="login-sources">
          {loginSources.map((source) => (
            <li key={source.code}>
              <div className="mono login-source-code">{source.code}</div>
              <div>{source.text}</div>
            </li>
          ))}
        </ul>
      </section>

      <main className="login-main">
        <form onSubmit={onSubmit} className="card login-form" noValidate>
          <div className="login-form-head">
            <h2>Ingresa con tu clave tributaria</h2>
            <p className="muted">Usamos las mismas credenciales de sii.cl.</p>
          </div>
          <div className="field">
            <label htmlFor="rut">
              RUT <span aria-hidden="true">*</span>
            </label>
            <input
              id="rut"
              ref={rutRef}
              className="mono"
              placeholder="12.345.678-5"
              autoComplete="username"
              required
              aria-invalid={rutMessage ? true : undefined}
              aria-describedby={rutMessage ? 'rut-error' : undefined}
              value={rut}
              onChange={(event) => setRut(event.target.value)}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, rut: true }))
                if (isValidRut(rut)) setRut(formatRut(rut))
              }}
            />
            {rutMessage && (
              <div id="rut-error" className="field-error">
                {rutMessage}
              </div>
            )}
          </div>
          <div className="field">
            <label htmlFor="clave">
              Clave tributaria <span aria-hidden="true">*</span>
            </label>
            <div className="field-row">
              <input
                id="clave"
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                aria-invalid={passwordMessage ? true : undefined}
                aria-describedby={passwordMessage ? 'clave-error' : undefined}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
              />
              <button
                type="button"
                className="btn"
                aria-pressed={showPassword}
                aria-controls="clave"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            {passwordMessage && (
              <div id="clave-error" className="field-error">
                {passwordMessage}
              </div>
            )}
          </div>
          <div className="consent">
            <input
              id="consent"
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
            />
            <div>
              <label htmlFor="consent">
                Autorizo a CEFT a consultar mis declaraciones y bienes raíces en el SII para
                elaborar mi diagnóstico. <span aria-hidden="true">*</span>
              </label>{' '}
              <button
                type="button"
                className="btn-link"
                aria-expanded={showTerms}
                aria-controls="terminos"
                onClick={() => setShowTerms((prev) => !prev)}
              >
                {showTerms ? 'Ocultar términos' : 'Ver términos'}
              </button>
              {showTerms && (
                <div id="terminos" className="terms">
                  <dl className="terms-list">
                    <dt>Finalidad</dt>
                    <dd>{CONSENT_PURPOSE}.</dd>
                    <dt>Fuentes</dt>
                    <dd>F22, F29, F50, bienes raíces y actividades económicas.</dd>
                    <dt>Vigencia</dt>
                    <dd>Solo esta captura. La clave se usa en una sesión efímera.</dd>
                    <dt>Revocación</dt>
                    <dd>Puedes revocarla en cualquier momento desde el anexo del Diagnóstico Base.</dd>
                  </dl>
                  <p>
                    Prototipo en modo demo: no se envía tu RUT ni tu clave a ningún servidor y no
                    se consulta el SII. Los términos definitivos están pendientes de redacción.
                  </p>
                </div>
              )}
            </div>
          </div>
          {error && (
            <div role="alert" className="form-error">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={!consent || loading}
          >
            {loading ? 'Conectando…' : 'Conectar con el SII'}
          </button>
          <div className="footnote">
            <span aria-hidden="true">*</span> Campos obligatorios. Modo demo: no se envían
            credenciales; se usan datos del caso de ejemplo.
          </div>
          <div className="login-admin">
            <div className="muted">¿Eres del equipo interno?</div>
            <button type="button" className="btn btn-outline" onClick={enterAdmin}>
              Entrar a administración (demo)
            </button>
          </div>
          <div className="login-safe">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--good)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            <div className="muted">La clave se usa solo durante la extracción y no se almacena.</div>
          </div>
        </form>
      </main>
    </div>
  )
}
