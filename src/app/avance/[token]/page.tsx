'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button, Modal, Select, Textarea, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconCamera, IconCheck, IconCloudOff, IconNote, IconRefresh, IconWifiOff } from '@tabler/icons-react';
import { Logo } from '@/components/Logo';
import { OtrPlate, RouteRibbon } from '@/components/primitives';
import { AREA_COLOR, estacion, RUTA } from '@/lib/mock';
import { entregar, HOY, irAEstacion, logEvent, ncStore, otrStore, uid } from '@/lib/data';
import { otrFromToken } from '@/lib/share';
import { cargarCola, encolar, setSinConexionSimulada, useCola, useOnline, vaciarCola } from '@/lib/offline';
import classes from './avance.module.css';

/** Pantalla de piso: se abre al escanear el QR de la hoja de ruta. Pensada para guantes y sol. */
export default function AvancePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const seed = otrFromToken(token);
  const otrs = otrStore.use();
  const o = otrs.find((x) => x.id === seed?.id);
  const online = useOnline();
  const cola = useCola();
  const antes = useRef(true);
  const [nota, setNota] = useState('');
  useEffect(() => { cargarCola(); }, []);
  // al recuperar la señal se sincroniza lo pendiente
  useEffect(() => {
    if (online && !antes.current && cola.length) { const n = vaciarCola(); notifications.show({ title: 'Sincronizado', message: `${n} cambio(s) enviados al servidor.`, color: 'teal' }); }
    antes.current = online;
  }, [online, cola.length]);
  /** Aplica el cambio en pantalla y, sin señal, lo deja en cola para sincronizar. */
  const hacer = (texto: string, fn: () => void) => { fn(); if (!online) encolar(texto); };
  const [problema, setProblema] = useState<{ titulo: string; sev: string | null } | null>(null);

  if (!seed || !o) {
    return <div className={classes.page}><div className={classes.card}><h1>Enlace no válido</h1><p>Este código QR no corresponde a una orden activa.</p></div></div>;
  }
  const k = estacion(o);
  const terminada = o.avance >= 100;

  const reportar = () => {
    if (!problema?.titulo.trim()) return;
    hacer('Problema reportado', () => ncStore.add({ id: uid('n'), otrId: o.id, titulo: problema.titulo.trim(), detalle: `Reportado desde piso en estación ${RUTA[k]}.`, severidad: (problema.sev as 'Menor' | 'Mayor' | 'Crítica') ?? 'Menor', estado: 'Abierta', responsable: 'Calidad', fecha: HOY, accion: '' }));
    logEvent(`NC reportada desde piso: ${problema.titulo.trim()}`, 'calidad', o.id, 'Operador (QR)');
    notifications.show({ title: 'Problema reportado', message: 'Calidad fue notificada.', color: 'orange' });
    setProblema(null);
  };

  return (
    <div className={classes.page} style={{ ['--area' as string]: AREA_COLOR[o.area] }}>
      <header className={classes.top}><Logo size={28} /><span><b>Registro de avance</b><small>Maestranza Mena · piso</small></span></header>
      {!online && <div className={classes.offline} role="status"><IconWifiOff size={18} /><span><b>Sin conexión</b>{cola.length ? ` · ${cola.length} cambio(s) pendientes de enviar` : ' · puedes seguir trabajando'}</span></div>}
      {online && cola.length > 0 && <div className={classes.offline} role="status"><IconRefresh size={18} /><span><b>Sincronizando</b> · {cola.length} pendiente(s)</span></div>}
      <main className={classes.main}>
        <section className={classes.card}>
          <OtrPlate n={o.otr} size="lg" />
          <h1>{o.titulo}</h1>
          <p>{o.cliente} · entrega {o.entrega}</p>
          <RouteRibbon current={k} />
          <div className={classes.pct}><b className="num">{o.avance}%</b><span className="cap">completado</span></div>
        </section>

        {terminada ? (
          <div className={classes.done}><IconCheck size={32} /> Orden entregada</div>
        ) : k < RUTA.length - 1 ? (
          <button className={classes.go} onClick={() => { hacer(`Avance: ${RUTA[k + 1]}`, () => irAEstacion(o, k + 1)); notifications.show({ title: online ? 'Avance registrado' : 'Guardado sin conexión', message: online ? `Ahora en ${RUTA[k + 1]}` : 'Se enviará al volver la señal.', color: online ? 'teal' : 'orange' }); }}>
            <small>Terminé</small><b>{RUTA[k]}</b><span>Pasar a {RUTA[k + 1]} →</span>
          </button>
        ) : (
          <button className={classes.go} onClick={() => { hacer('Orden entregada', () => entregar(o)); notifications.show({ title: online ? 'Orden entregada' : 'Guardado sin conexión', message: `OTR ${o.otr}`, color: online ? 'teal' : 'orange' }); }}>
            <small>Última estación</small><b>{RUTA[k]}</b><span>Marcar como entregada ✓</span>
          </button>
        )}

        <div className={classes.row}>
          <Button component={Link} href="/evidencia/nueva" size="lg" variant="default" leftSection={<IconCamera size={20} />}>Foto</Button>
          <Button size="lg" variant="default" color="red" leftSection={<IconAlertTriangle size={20} />} onClick={() => setProblema({ titulo: '', sev: 'Menor' })}>Problema</Button>
        </div>

        <section className={classes.card}>
          <Textarea label="Nota rápida" placeholder="Ej: falta electrodo 7018" autosize minRows={2} value={nota} onChange={(e) => setNota(e.currentTarget.value)} />
          <Button leftSection={<IconNote size={16} />} disabled={!nota.trim()} onClick={() => { hacer('Nota de piso', () => logEvent(`Nota de piso: ${nota.trim()}`, 'otr', o.id, 'Operador (QR)')); setNota(''); notifications.show({ message: 'Nota guardada en la bitácora.', color: 'teal' }); }}>Guardar nota</Button>
        </section>

        <button className={classes.sim} onClick={() => setSinConexionSimulada(online)} aria-pressed={!online}><IconCloudOff size={14} /> {online ? 'Simular corte de señal' : 'Volver a conectar'}</button>

        <details className={classes.pick}>
          <summary>Corregir estación manualmente</summary>
          <div>{RUTA.map((r, i) => <button key={r} data-on={i === k || undefined} onClick={() => irAEstacion(o, i)}>{i + 1}. {r}</button>)}</div>
        </details>
      </main>

      <Modal opened={!!problema} onClose={() => setProblema(null)} padding="lg" title={<b>Reportar problema</b>} fullScreen={false}>
        {problema && (
          <div style={{ display: 'grid', gap: 12 }}>
            <TextInput label="¿Qué pasó?" size="md" autoFocus value={problema.titulo} onChange={(e) => setProblema({ ...problema, titulo: e.currentTarget.value })} />
            <Select label="Gravedad" size="md" allowDeselect={false} data={['Menor', 'Mayor', 'Crítica']} value={problema.sev} onChange={(v) => setProblema({ ...problema, sev: v })} />
            <Button color="red" size="md" onClick={reportar} disabled={!problema.titulo.trim()}>Enviar a Calidad</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
