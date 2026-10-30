import { formatRut, rutMessage } from '../lib/rut'

/**
 * Formulario de la autorización. No hay backend: no se envía ni se guarda nada (ni en la URL,
 * ni en localStorage, ni en sessionStorage). Al conectar se borra la clave del campo y se va a la
 * app del diagnóstico (PUBLIC_APP_URL), sin pasarle el RUT ni la clave.
 */
export function initIngreso(): void {
  const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null
  const form = $<HTMLFormElement>('autorizacion')
  const dock = $<HTMLAnchorElement>('dock')
  const rut = $<HTMLInputElement>('rut')
  const clave = $<HTMLInputElement>('clave')
  const consent = $<HTMLInputElement>('consent')
  const submit = $<HTMLButtonElement>('submit')
  const hint = $<HTMLParagraphElement>('hint')
  const status = $<HTMLDivElement>('status')
  const show = $<HTMLButtonElement>('show')
  const rutErr = $<HTMLParagraphElement>('rut-err')
  const claveErr = $<HTMLParagraphElement>('clave-err')
  if (!form || !dock || !rut || !clave || !consent || !submit || !hint || !status || !show || !rutErr || !claveErr) return

  const appUrl = form.dataset.appUrl ?? '/'
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches

  // En pantallas angostas, un botón fijo abajo lleva a la autorización; se oculta cuando la hoja está a la vista.
  new IntersectionObserver(([e]) => dock.classList.toggle('off', e.isIntersecting), { threshold: 0.05 }).observe(form)
  dock.addEventListener('click', (e) => {
    e.preventDefault()
    form.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'start' })
    window.setTimeout(() => rut.focus({ preventScroll: true }), 400)
  })

  const setErr = (input: HTMLInputElement, el: HTMLElement, msg: string) => {
    el.textContent = msg
    el.hidden = !msg
    input.setAttribute('aria-invalid', msg ? 'true' : 'false')
  }
  const claveMsg = () => (clave.value ? '' : 'Ingresa tu clave tributaria.')

  rut.addEventListener('blur', () => {
    const m = rutMessage(rut.value)
    setErr(rut, rutErr, m)
    if (!m) rut.value = formatRut(rut.value)
  })
  clave.addEventListener('blur', () => setErr(clave, claveErr, claveMsg()))
  show.addEventListener('click', () => {
    const on = clave.type === 'password'
    clave.type = on ? 'text' : 'password'
    show.setAttribute('aria-pressed', String(on))
    show.textContent = on ? 'Ocultar' : 'Mostrar'
  })
  const syncConsent = () => {
    submit.disabled = !consent.checked
    hint.hidden = consent.checked
  }
  consent.addEventListener('change', syncConsent)
  syncConsent()

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const rm = rutMessage(rut.value)
    const cm = claveMsg()
    setErr(rut, rutErr, rm)
    setErr(clave, claveErr, cm)
    if (rm) return rut.focus()
    if (cm) return clave.focus()
    // La clave no sale de esta página: se borra antes de seguir.
    clave.value = ''
    clave.type = 'password'
    submit.disabled = true
    submit.innerHTML = '<span class="spin" aria-hidden="true"></span>Conectando…'
    status.innerHTML = '<div class="status"><b>Modo demo: no se envió tu RUT ni tu clave.</b>Te llevamos a la app del diagnóstico.</div>'
    window.setTimeout(() => window.location.assign(appUrl), 1400)
  })

  // Si se vuelve con el botón atrás (caché de página), el formulario queda como recién abierto.
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return
    clave.value = ''
    submit.textContent = 'Conectar con el SII'
    status.innerHTML = ''
    syncConsent()
  })
}
