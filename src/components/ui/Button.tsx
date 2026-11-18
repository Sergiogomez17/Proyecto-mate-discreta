import type { ComponentPropsWithRef, ReactNode } from 'react';
import { Link } from 'react-router';
import type { LinkProps } from 'react-router';
import { buttonClasses } from './buttonClasses';
import type { ButtonSize, ButtonVariant } from './buttonClasses';

/** En React 19 `ref` es una prop: se reenvía al <button> junto con el resto. */
interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', icon, className, children, type = 'button', ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClasses(variant, size, className)} {...rest}>
      {icon}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

/** Enlace de navegación con apariencia de botón. */
export function ButtonLink({ variant = 'primary', size = 'md', icon, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, size, typeof className === 'string' ? className : undefined)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}
