'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { IconDeviceDesktop, IconDeviceMobile, IconDeviceTablet, IconX } from '@tabler/icons-react';
import classes from './DeviceSwitcher.module.css';

type Mode = 'desktop' | 'tablet' | 'mobile';
const DEVICES: Record<Exclude<Mode, 'desktop'>, { w: number; h: number; label: string; top: number }> = {
  tablet: { w: 820, h: 1180, label: 'Tablet · 820 × 1180', top: 12 },
  mobile: { w: 390, h: 844, label: 'Móvil · 390 × 844', top: 38 }, // el notch vive en el bisel, no sobre la app
};

/**
 * Selector flotante para previsualizar la app en tablet o móvil.
 * Carga la misma ruta en un iframe con el ancho real del dispositivo, de modo que los
 * media queries respondan como en el aparato. El iframe tiene su propio estado en memoria.
 */
export function DeviceSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [mode, setMode] = useState<Mode>('desktop');
  const [embedded, setEmbedded] = useState(true); // true hasta confirmar en cliente: evita parpadeo
  const [src, setSrc] = useState('/inicio');
  const [scale, setScale] = useState(1);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => { setEmbedded(window.self !== window.top); }, []);

  const fit = useCallback((m: Mode) => {
    if (m === 'desktop') return;
    const d = DEVICES[m];
    setScale(Math.min(1, (window.innerHeight - 120) / (d.h + d.top + 12), (window.innerWidth - 48) / (d.w + 24)));
  }, []);
  useEffect(() => {
    const on = () => fit(mode);
    on();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [mode, fit]);

  // vuelve a escritorio en la misma ruta donde quedó el iframe
  const pick = (next: Mode) => {
    if (next === 'desktop' && mode !== 'desktop') {
      try {
        const l = frame.current?.contentWindow?.location;
        const there = l ? l.pathname + l.search : null;
        if (there && there !== pathname) router.push(there);
      } catch { /* iframe en otro origen: no aplica */ }
    }
    if (next !== 'desktop' && mode === 'desktop') setSrc(window.location.pathname + window.location.search);
    setMode(next);
  };

  if (embedded) return null;
  const d = mode === 'desktop' ? null : DEVICES[mode];

  return (
    <>
      {d && (
        <div className={classes.stage} role="dialog" aria-label={`Vista previa ${d.label}`}>
          <div className={classes.label}>{d.label}<button onClick={() => pick('desktop')}><IconX size={14} /> Volver a escritorio</button></div>
          <div className={classes.outer} style={{ width: (d.w + 24) * scale, height: (d.h + d.top + 12) * scale }}>
            <div className={classes.device} data-kind={mode} style={{ width: d.w + 24, height: d.h + d.top + 12, paddingTop: d.top, transform: `scale(${scale})` }}>
              <iframe ref={frame} title={`Vista ${mode}`} src={src} style={{ width: d.w, height: d.h }} />
            </div>
          </div>
        </div>
      )}

      <div className={classes.pill} role="group" aria-label="Vista previa de dispositivo">
        {([['desktop', IconDeviceDesktop, 'Escritorio'], ['tablet', IconDeviceTablet, 'Tablet'], ['mobile', IconDeviceMobile, 'Móvil']] as const).map(([m, I, t]) => (
          <button key={m} data-on={mode === m || undefined} onClick={() => pick(m)} aria-label={t} title={t}><I size={18} stroke={1.6} /></button>
        ))}
      </div>
    </>
  );
}
