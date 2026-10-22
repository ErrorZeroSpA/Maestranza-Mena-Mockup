'use client';

import { useState } from 'react';
import { ActionIcon, Badge, Button, Modal, NumberInput, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconPlus, IconTrash, IconX } from '@tabler/icons-react';
import { CLP, Otr } from '@/lib/mock';
import { cambioStore, cubStore, hhStore, HOY, logEvent, otrStore, uid } from '@/lib/data';
import { OtrPlate } from './primitives';
import { usePerm } from '@/lib/roles';
import { toastUndo } from '@/lib/undo';
import classes from './OtrDialogs.module.css';

const Title = ({ t, o }: { t: string; o: Otr }) => (
  <div className={classes.title}><b>{t}</b><OtrPlate n={o.otr} /></div>
);

/* ---------------- Horas hombre ---------------- */
export function HHModal({ otr, onClose }: { otr: Otr | null; onClose: () => void }) {
  const can = usePerm();
  const all = hhStore.use();
  const [d, setD] = useState({ persona: '', fecha: HOY, horas: 8 as number | string, tarea: '', tarifa: 15000 as number | string });
  if (!otr) return null;
  const rows = all.filter((h) => h.otrId === otr.id);
  const horas = rows.reduce((a, h) => a + h.horas, 0);
  const costo = rows.reduce((a, h) => a + h.horas * h.tarifa, 0);
  const add = () => {
    if (!d.persona.trim() || !d.tarea.trim()) return notifications.show({ message: 'Indica persona y tarea.', color: 'orange' });
    hhStore.add({ id: uid('h'), otrId: otr.id, persona: d.persona.trim(), fecha: d.fecha, horas: Number(d.horas) || 0, tarea: d.tarea.trim(), tarifa: Number(d.tarifa) || 0 });
    logEvent(`Se registran ${Number(d.horas) || 0} HH: ${d.tarea.trim()}`, 'otr', otr.id);
    setD({ ...d, persona: '', tarea: '' });
  };
  return (
    <Modal opened onClose={onClose} size={680} padding="lg" title={<Title t="Horas hombre" o={otr} />}>
      <div className={classes.kpis}>
        <div><span className="cap">Horas</span><b className="num">{horas}</b></div>
        <div><span className="cap">Costo HH</span><b className="num">{CLP(costo)}</b></div>
        <div><span className="cap">Registros</span><b className="num">{rows.length}</b></div>
      </div>
      <table className={classes.tbl}>
        <thead><tr><th>Fecha</th><th>Persona</th><th>Tarea</th><th>Horas</th><th>Costo</th><th /></tr></thead>
        <tbody>
          {rows.map((h) => (
            <tr key={h.id}><td className="mono num">{h.fecha.slice(5).split('-').reverse().join('-')}</td><td>{h.persona}</td><td>{h.tarea}</td><td className="num">{h.horas}</td><td className="num">{CLP(h.horas * h.tarifa)}</td>
              <td>{can('hh.edit') && <ActionIcon variant="subtle" color="red" size="sm" aria-label="Quitar registro" onClick={() => hhStore.remove(h.id)}><IconTrash size={14} /></ActionIcon>}</td></tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={6} className={classes.empty}>Aún no hay horas registradas.</td></tr>}
        </tbody>
      </table>
      {can('hh.edit') ? <div className={classes.add}>
        <TextInput label="Persona" size="xs" value={d.persona} onChange={(e) => setD({ ...d, persona: e.currentTarget.value })} />
        <TextInput label="Tarea" size="xs" value={d.tarea} onChange={(e) => setD({ ...d, tarea: e.currentTarget.value })} />
        <TextInput label="Fecha" type="date" size="xs" value={d.fecha} onChange={(e) => setD({ ...d, fecha: e.currentTarget.value })} />
        <NumberInput label="Horas" size="xs" min={0.5} step={0.5} value={d.horas} onChange={(v) => setD({ ...d, horas: v })} />
        <NumberInput label="$/hora" size="xs" min={0} thousandSeparator="." decimalSeparator="," value={d.tarifa} onChange={(v) => setD({ ...d, tarifa: v })} />
        <Button size="xs" color="forja" leftSection={<IconPlus size={14} />} onClick={add}>Registrar</Button>
      </div> : <p className={classes.ro}>Tu rol puede ver las horas, pero no registrarlas.</p>}
    </Modal>
  );
}

/* ---------------- Solicitudes de cambio ---------------- */
export function CambioModal({ otr, onClose }: { otr: Otr | null; onClose: () => void }) {
  const can = usePerm();
  const all = cambioStore.use();
  const [d, setD] = useState({ descripcion: '', costo: 0 as number | string, dias: 0 as number | string });
  if (!otr) return null;
  const rows = all.filter((c) => c.otrId === otr.id);
  const tone = { Solicitado: 'yellow', Aprobado: 'teal', Rechazado: 'red' } as const;
  const add = () => {
    if (!d.descripcion.trim()) return;
    cambioStore.add({ id: uid('x'), otrId: otr.id, descripcion: d.descripcion.trim(), costo: Number(d.costo) || 0, dias: Number(d.dias) || 0, estado: 'Solicitado', fecha: HOY });
    logEvent(`Solicitud de cambio: ${d.descripcion.trim()}`, 'otr', otr.id);
    setD({ descripcion: '', costo: 0, dias: 0 });
  };
  const resolver = (id: string, estado: 'Aprobado' | 'Rechazado', dias: number, texto: string) => {
    const snapC = cambioStore.get();
    const snapO = otrStore.get();
    cambioStore.update(id, { estado });
    if (estado === 'Aprobado' && dias) otrStore.update(otr.id, { plazoDias: otr.plazoDias + dias });
    logEvent(`Cambio ${estado.toLowerCase()}: ${texto}`, 'otr', otr.id);
    toastUndo(`Cambio ${estado.toLowerCase()}`, estado === 'Aprobado' && dias ? `Plazo +${dias} días` : texto, () => { cambioStore.restore(snapC); otrStore.restore(snapO); });
  };
  return (
    <Modal opened onClose={onClose} size={640} padding="lg" title={<Title t="Cambios de alcance" o={otr} />}>
      <ul className={classes.list}>
        {rows.map((c) => (
          <li key={c.id}>
            <div className={classes.cMain}>
              <p>{c.descripcion}</p>
              <small className="num">{CLP(c.costo)} · {c.dias > 0 ? `+${c.dias} días` : 'sin impacto en plazo'} · {c.fecha}</small>
            </div>
            <Badge color={tone[c.estado]} variant="light">{c.estado}</Badge>
            {c.estado === 'Solicitado' && can('cambio.approve') ? (
              <span className={classes.cAct}>
                <ActionIcon color="teal" variant="light" aria-label="Aprobar" onClick={() => resolver(c.id, 'Aprobado', c.dias, c.descripcion)}><IconCheck size={16} /></ActionIcon>
                <ActionIcon color="red" variant="light" aria-label="Rechazar" onClick={() => resolver(c.id, 'Rechazado', c.dias, c.descripcion)}><IconX size={16} /></ActionIcon>
              </span>
            ) : c.estado === 'Solicitado' ? <span /> : <ActionIcon variant="subtle" color="gray" size="sm" aria-label="Quitar" onClick={() => cambioStore.remove(c.id)}><IconTrash size={14} /></ActionIcon>}
          </li>
        ))}
        {rows.length === 0 && <li className={classes.empty}>Sin solicitudes de cambio.</li>}
      </ul>
      {can('cambio.request') ? <div className={classes.add2}>
        <TextInput label="Descripción del cambio" size="xs" value={d.descripcion} onChange={(e) => setD({ ...d, descripcion: e.currentTarget.value })} />
        <NumberInput label="Impacto costo" size="xs" prefix="$" thousandSeparator="." decimalSeparator="," min={0} value={d.costo} onChange={(v) => setD({ ...d, costo: v })} />
        <NumberInput label="Días extra" size="xs" min={0} value={d.dias} onChange={(v) => setD({ ...d, dias: v })} />
        <Button size="xs" color="forja" leftSection={<IconPlus size={14} />} onClick={add}>Solicitar</Button>
      </div> : <p className={classes.ro}>Tu rol puede ver los cambios, pero no solicitarlos.</p>}
    </Modal>
  );
}

/* ---------------- P&L ---------------- */
export function PLModal({ otr, onClose }: { otr: Otr | null; onClose: () => void }) {
  const cub = cubStore.use();
  const hh = hhStore.use();
  const cambios = cambioStore.use();
  const live = otrStore.use().find((o) => o.id === otr?.id);
  if (!otr || !live) return null;
  const mat = cub.filter((l) => l.otrId === live.id).reduce((a, l) => a + l.cant * l.costo, 0);
  const mo = hh.filter((h) => h.otrId === live.id).reduce((a, h) => a + h.horas * h.tarifa, 0);
  const camb = cambios.filter((c) => c.otrId === live.id && c.estado === 'Aprobado').reduce((a, c) => a + c.costo, 0);
  const venta = (live.venta ?? 0) + camb;
  const costo = mat + mo;
  const margen = venta - costo;
  const pct = venta ? Math.round((margen / venta) * 100) : 0;
  const tone = pct >= 25 ? 'ok' : pct >= 10 ? 'warn' : 'crit';
  const horasReal = hh.filter((h) => h.otrId === live.id).reduce((a, h) => a + h.horas, 0);
  const cmp: [string, number, number, boolean][] = [['Horas hombre', live.hhEst ?? 0, horasReal, false], ['Materiales ($)', live.matEst ?? 0, mat, true]];
  const rows: [string, number, boolean?][] = [['Venta contratada', live.venta ?? 0], ['Cambios aprobados', camb], ['Materiales (cubicación)', -mat], ['Mano de obra (HH)', -mo]];
  return (
    <Modal opened onClose={onClose} size={520} padding="lg" title={<Title t="Resultado de la OTR (P&L)" o={otr} />}>
      <NumberInput label="Precio de venta" size="sm" prefix="$" thousandSeparator="." decimalSeparator="," min={0} value={live.venta ?? 0} onChange={(v) => otrStore.update(live.id, { venta: Number(v) || 0 })} mb="md" />
      <table className={classes.tbl}>
        <tbody>
          {rows.map(([l, v]) => <tr key={l}><td>{l}</td><td className="num" style={{ textAlign: 'right', color: v < 0 ? 'var(--mm-crit)' : undefined }}>{CLP(v)}</td></tr>)}
          <tr className={classes.sum}><td>Margen</td><td className="num" style={{ textAlign: 'right' }}>{CLP(margen)}</td></tr>
        </tbody>
      </table>
      <table className={classes.tbl} style={{ marginTop: 16 }}>
        <thead><tr><th>Estimado vs real</th><th style={{ textAlign: 'right' }}>Cotizado</th><th style={{ textAlign: 'right' }}>Real</th><th style={{ textAlign: 'right' }}>Desvío</th></tr></thead>
        <tbody>
          {cmp.map(([l, est, real, money]) => {
            const dv = est ? Math.round(((real - est) / est) * 100) : 0;
            return <tr key={l}><td>{l}</td><td className="num" style={{ textAlign: 'right' }}>{money ? CLP(est) : est}</td><td className="num" style={{ textAlign: 'right' }}>{money ? CLP(real) : real}</td><td className="num" style={{ textAlign: 'right', fontWeight: 700, color: dv > 10 ? 'var(--mm-crit)' : dv > 0 ? 'var(--mm-warn)' : 'var(--mm-ok)' }}>{est ? `${dv > 0 ? '+' : ''}${dv}%` : '—'}</td></tr>;
          })}
        </tbody>
      </table>
      <div className={classes.margin} data-tone={tone}>
        <span className="cap">Margen sobre venta</span>
        <b className="num">{pct}%</b>
        <div className={classes.mbar}><i style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} /></div>
        <Text size="xs" c="dimmed">Meta de referencia: 25 %. Costos indirectos y overhead no incluidos.</Text>
      </div>
    </Modal>
  );
}
