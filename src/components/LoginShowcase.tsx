'use client';

import { useEffect, useRef, useState } from 'react';
import { IconCamera, IconChartBar, IconLayoutKanban, IconListDetails, IconShare3, IconShieldCheck } from '@tabler/icons-react';
import { Logo } from './Logo';
import { RUTA } from '@/lib/mock';
import classes from './LoginShowcase.module.css';

const FEATURES = [
  { icon: IconListDetails, t: 'Seguimiento en vivo', d: 'Cada OTR con su avance, hito y plazo, del ingreso al despacho.' },
  { icon: IconLayoutKanban, t: 'Tablero de planta', d: 'Área × etapa: ve dónde se acumula el trabajo y arrastra para mover.' },
  { icon: IconCamera, t: 'Evidencia desde el celular', d: 'Foto, marca el defecto y asócialo a la orden en segundos.' },
  { icon: IconShare3, t: 'Estado para clientes', d: 'Un enlace de solo lectura con avance y fotos aprobadas.' },
  { icon: IconShieldCheck, t: 'Calidad ISO 9001', d: 'No conformidades, acciones correctivas y trazabilidad.' },
  { icon: IconChartBar, t: 'Reportes e indicadores', d: 'Plazos, horas hombre, rentabilidad e inventario, exportables.' },
];

const STATS: [number, string, string][] = [[25, '+', 'años de experiencia'], [500, '+', 'proyectos entregados'], [9001, '', 'certificación ISO']];

function CountUp({ to, suffix }: { to: number; suffix: string }) {
  const [v, setV] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(to); return; }
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 1400);
      setV(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [to]);
  return <b className="num">{v}{suffix}</b>;
}

/** Panel izquierdo del login: marca, ruta animada, características y cifras de la empresa. */
export function LoginShowcase() {
  const [on, setOn] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setOn((i) => (i + 1) % FEATURES.length), 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <aside className={classes.side}>
      <svg className={classes.gear} viewBox="0 0 200 200" aria-hidden>
        <g fill="none" stroke="currentColor" strokeWidth="14" strokeDasharray="14 11"><circle cx="100" cy="100" r="82" /></g>
        <circle cx="100" cy="100" r="56" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle cx="100" cy="100" r="22" fill="currentColor" />
      </svg>

      <header className={classes.brand} style={{ ['--i' as string]: 0 }}>
        <Logo size={40} />
        <span><b>Maestranza Mena</b><small>Ingeniería y fabricación · Hijuelas, Chile</small></span>
      </header>

      <div className={classes.hero} style={{ ['--i' as string]: 1 }}>
        <span className={classes.kicker}>Sistema de Gestión de Operaciones</span>
        <h2>Cada orden de trabajo,<br /><em>del ingreso al despacho.</em></h2>
        <p>Una sola plataforma para planta, bodega, calidad y comercial. Menos planillas, más fierro saliendo a tiempo.</p>
      </div>

      {/* Ruta animada: una OTR recorre las estaciones del taller */}
      <div className={classes.route} style={{ ['--i' as string]: 2 }} aria-hidden>
        <div className={classes.track}>
          {RUTA.map((r, i) => (<i key={r} style={{ ['--d' as string]: `${i * 0.9}s` }} />))}
          <span className={classes.plate}><s>OTR</s> 4261</span>
        </div>
        <ol>{RUTA.map((r) => <li key={r}>{r}</li>)}</ol>
      </div>

      <ul className={classes.features} style={{ ['--i' as string]: 3 }}>
        {FEATURES.map((f, i) => (
          <li key={f.t} data-on={i === on || undefined} onMouseEnter={() => setOn(i)}>
            <span className={classes.ico}><f.icon size={20} stroke={1.5} /></span>
            <span><b>{f.t}</b><small>{f.d}</small></span>
          </li>
        ))}
      </ul>

      <footer className={classes.stats} style={{ ['--i' as string]: 4 }}>
        {STATS.map(([n, s, l]) => (
          <div key={l}><CountUp to={n} suffix={s} /><span>{l}</span></div>
        ))}
      </footer>
    </aside>
  );
}
