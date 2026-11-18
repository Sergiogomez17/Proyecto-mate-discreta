/** Navegación principal, en el orden definido: Inicio → Laboratorio → Simulaciones. */
export const NAV_ITEMS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/laboratorio', label: 'Laboratorio', end: false },
  { to: '/simulaciones', label: 'Simulaciones', end: false },
  { to: '/ayuda', label: 'Ayuda', end: false },
] as const;
