import { PageHeader } from '@/components/layout/PageHeader';
import { ButtonLink } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <>
      <PageHeader eyebrow="Error 404" title="Página no encontrada" description="La dirección no corresponde a ningún módulo de GraphLab." />
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <ButtonLink to="/">Volver al inicio</ButtonLink>
      </div>
    </>
  );
}
