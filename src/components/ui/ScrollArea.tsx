import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface ScrollAreaProps {
  /** Nombre accesible de la zona (por ejemplo, «Tabla de distancias»). */
  label: string;
  className?: string;
  children: ReactNode;
}

/**
 * Contenedor con desplazamiento horizontal para tablas y dibujos anchos. Es enfocable para que,
 * en pantallas angostas, también se pueda desplazar con el teclado (flechas) y no solo con el ratón.
 */
export function ScrollArea({ label, className, children }: ScrollAreaProps) {
  return (
    <div role="region" aria-label={label} tabIndex={0} className={cn('overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-strong', className)}>
      {children}
    </div>
  );
}
