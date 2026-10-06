export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function scrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? 'auto' : 'smooth'
}

export function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
}
