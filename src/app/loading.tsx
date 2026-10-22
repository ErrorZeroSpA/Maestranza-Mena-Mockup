import { Loader } from '@/components/Loader';

/** Se muestra mientras un segmento dinámico (por ejemplo /avance o /estado) llega desde el servidor. */
export default function Loading() {
  return <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: 'var(--mm-canvas)' }}><Loader label="Cargando…" sub="Maestranza Mena · SGO" /></div>;
}
