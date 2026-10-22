import { Area, AREA_COLOR, RUTA, Semaforo } from '@/lib/mock';
import classes from './primitives.module.css';

/** Placa de OTR: número grabado sobre chapa oscura. */
export function OtrPlate({ n, size = 'md' }: { n: number; size?: 'md' | 'lg' }) {
  return (
    <span className={classes.plate} data-size={size}>
      <span className={classes.plateLabel}>OTR</span>
      <span className="num">{n}</span>
    </span>
  );
}

/** Avance como cordón de soldadura: 20 segmentos. */
export function SegBar({ value, tone = 'ok' }: { value: number; tone?: Semaforo }) {
  const total = 20;
  const filled = Math.round((value / 100) * total);
  return (
    <div className={classes.seg} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} data-tone={tone}>
      {Array.from({ length: total }, (_, i) => (
        <i key={i} data-on={i < filled || undefined} />
      ))}
    </div>
  );
}

/** Ruta de producción: estaciones del taller, la actual resaltada. */
export function RouteRibbon({ current }: { current: number }) {
  return (
    <div>
      <ol className={classes.route}>
        {RUTA.map((r, i) => (
          <li key={r} title={r} data-state={i < current ? 'done' : i === current ? 'now' : 'next'}><i /></li>
        ))}
      </ol>
      <p className={classes.routeCap}>
        <b className="num">{String(current + 1).padStart(2, '0')}/{String(RUTA.length).padStart(2, '0')}</b> {RUTA[current]}
        {current < RUTA.length - 1 && <em> → {RUTA[current + 1]}</em>}
      </p>
    </div>
  );
}

export function AreaTag({ area }: { area: Area }) {
  return (
    <span className={classes.area} style={{ ['--c' as string]: AREA_COLOR[area] }}>
      {area}
    </span>
  );
}

export function Dots({ values }: { values: [Semaforo, Semaforo] }) {
  const lbl: Record<Semaforo, string> = { ok: 'al día', warn: 'alerta', crit: 'crítico' };
  return (
    <span className={classes.dots} aria-label={`Avance ${lbl[values[0]]}, plazo ${lbl[values[1]]}`} title={`Avance: ${lbl[values[0]]} · Plazo: ${lbl[values[1]]}`}>
      {values.map((v, i) => (
        <i key={i} data-tone={v} />
      ))}
    </span>
  );
}
