import classes from './Loader.module.css';

/** Marca de carga: ficha naranja con engranaje girando. Sirve en servidor y en cliente. */
export function Loader({ label = 'Cargando…', sub }: { label?: string; sub?: string }) {
  return (
    <div className={classes.box} role="status" aria-live="polite">
      <div className={classes.mark} aria-hidden>
        <svg viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="8" fill="#F28C28" />
          <g transform="translate(24 24)" className={classes.gear}>
            <circle r="12" stroke="#0B2748" strokeWidth="4" strokeDasharray="4.6 3.4" />
          </g>
          <circle cx="24" cy="24" r="6.8" fill="#0B2748" />
          <circle cx="24" cy="24" r="2.8" fill="#F28C28" />
        </svg>
      </div>
      <b>{label}</b>
      {sub && <small>{sub}</small>}
      <i className={classes.bar} aria-hidden />
    </div>
  );
}
