/**
 * Marca propia de GraphLab: un árbol de tres vértices.
 * No reproduce ni imita el logotipo oficial de la universidad.
 */
export function BrandMark({ className = 'size-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} aria-hidden focusable="false">
      <rect width="36" height="36" rx="8" fill="#0B2257" />
      <path d="M10 25 18 10l8 15M10 25h16" fill="none" stroke="#22D3EE" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="18" cy="10" r="3.6" fill="#7C3AED" stroke="#061438" strokeWidth="1.2" />
      <circle cx="10" cy="25" r="3.6" fill="#00E5FF" stroke="#061438" strokeWidth="1.2" />
      <circle cx="26" cy="25" r="3.6" fill="#00E5FF" stroke="#061438" strokeWidth="1.2" />
    </svg>
  );
}
