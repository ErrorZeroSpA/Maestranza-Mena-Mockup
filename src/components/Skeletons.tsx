import classes from './Skeletons.module.css';

export function RowsSkeleton({ rows = 8, cols = 1 }: { rows?: number; cols?: number }) {
  return (
    <div className={classes.rows} role="status" aria-label="Cargando">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={classes.row} style={{ gridTemplateColumns: cols > 1 ? `56px repeat(${cols - 1}, 1fr)` : '1fr', ['--d' as string]: `${i * 60}ms` }}>
          {Array.from({ length: cols }, (_, j) => <i key={j} style={{ width: j === 0 ? '100%' : `${55 + ((i * 17 + j * 23) % 40)}%` }} />)}
        </div>
      ))}
    </div>
  );
}

export function PanelSkeleton() {
  return (
    <div className={classes.panel} role="status" aria-label="Cargando">
      <i style={{ width: 96, height: 34 }} /><i style={{ width: '80%', height: 24 }} /><i style={{ width: '45%' }} />
      <div className={classes.grid3}>{Array.from({ length: 6 }, (_, k) => <i key={k} style={{ height: 44 }} />)}</div>
      <i style={{ width: '100%', height: 10 }} />
    </div>
  );
}
