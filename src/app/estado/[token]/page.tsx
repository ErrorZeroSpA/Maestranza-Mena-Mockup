import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Logo } from '@/components/Logo';
import { AREA_COLOR, estacion, RUTA } from '@/lib/mock';
import { otrFromToken } from '@/lib/share';
import classes from './estado.module.css';

export const metadata: Metadata = { title: 'Estado de tu trabajo · Maestranza Mena', robots: { index: false, follow: false } };

const FOTOS = ['Recepción de pieza', 'Marcado y corte', 'Armado', 'Soldadura', 'Control dimensional', 'Pre-despacho'];
const FECHAS = ['11 ago', '14 ago', '21 ago', '02 sep', '09 sep', '16 sep', '23 sep', '28 sep'];

export default async function EstadoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const o = otrFromToken(token);
  if (!o) notFound();
  const cur = estacion(o);
  const fotosVisibles = FOTOS.slice(0, Math.max(2, cur));

  return (
    <div className={classes.page} style={{ ['--area' as string]: AREA_COLOR[o.area] }}>
      <header className={classes.top}>
        <Logo size={30} />
        <span><b>Maestranza Mena</b><small>Seguimiento de trabajos</small></span>
        <em>Enlace de solo lectura</em>
      </header>

      <main className={classes.main}>
        <section className={classes.hero}>
          <span className="cap">Orden de trabajo</span>
          <h1>{o.titulo}</h1>
          <p>Cliente <b>{o.cliente}</b> · OTR <b className="mono">{o.otr}</b></p>

          <div className={classes.status}>
            <div>
              <span className="cap">Estado actual</span>
              <strong>{RUTA[cur]}</strong>
              <small>Hito: {o.hito}</small>
            </div>
            <div className={classes.pct}>
              <b className="num">{o.avance}<i>%</i></b>
              <span className="cap">completado</span>
            </div>
          </div>

          <div className={classes.bar} role="progressbar" aria-valuenow={o.avance}><i style={{ width: `${o.avance}%` }} /></div>

          <dl className={classes.dates}>
            <div><dt>Entrega comprometida</dt><dd className="num">{o.entrega}</dd></div>
            <div><dt>Plazo restante</dt><dd className="num">{o.plazoDias} días</dd></div>
            <div><dt>Actualizado</dt><dd>Hoy 09:40</dd></div>
          </dl>
        </section>

        <section className={classes.card}>
          <h2>Etapas del trabajo</h2>
          <ol className={classes.steps}>
            {RUTA.map((r, i) => (
              <li key={r} data-state={i < cur ? 'done' : i === cur ? 'now' : 'next'}>
                <i />
                <div><b>{r}</b><small>{i < cur ? `Completada · ${FECHAS[i]}` : i === cur ? 'En curso ahora' : `Prevista · ${FECHAS[i]}`}</small></div>
              </li>
            ))}
          </ol>
        </section>

        <section className={classes.card}>
          <h2>Evidencia fotográfica <span>{fotosVisibles.length}</span></h2>
          <div className={classes.photos}>
            {fotosVisibles.map((f, i) => (
              <figure key={f}><div className={classes.ph} data-i={i % 3} /><figcaption>{f}<small>{FECHAS[i]} · Planta</small></figcaption></figure>
            ))}
          </div>
        </section>

        <section className={classes.contact}>
          <div><b>¿Dudas sobre tu trabajo?</b><small>Responde tu ejecutivo comercial de Maestranza Mena.</small></div>
          <a href="mailto:contacto@maestranzamena.com">Escribir al equipo</a>
        </section>
      </main>
      <footer className={classes.foot}>Este enlace es privado. Solo muestra la información que Maestranza Mena decidió compartir.</footer>
    </div>
  );
}
