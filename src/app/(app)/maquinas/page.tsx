'use client';

import { useMemo, useState } from 'react';
import { Button, Menu, Modal, NumberInput, Select, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconDotsVertical, IconPlayerPause, IconPlayerPlay, IconPlus, IconTool } from '@tabler/icons-react';
import { PageHead } from '@/components/PageHead';
import { OtrPlate } from '@/components/primitives';
import formClasses from '@/components/forms.module.css';
import { AREA_COLOR, CAUSAS_PARADA, EstadoMaq, Maquina } from '@/lib/mock';
import { usePerm } from '@/lib/roles';
import { HOY, logEvent, maqStore, otrStore, paradaStore, uid } from '@/lib/data';
import classes from './maquinas.module.css';

const ESTADOS: Record<EstadoMaq, string> = { Operando: 'ok', Detenida: 'crit', Mantención: 'warn' };
const hm = (min: number) => (min >= 60 ? `${Math.floor(min / 60)} h ${min % 60 ? `${min % 60} min` : ''}` : `${min} min`);
const AHORA = () => new Date().toISOString().slice(0, 19);

export default function MaquinasPage() {
  const can = usePerm();
  const edita = can('maq.edit');
  const maqs = maqStore.use();
  const paradas = paradaStore.use();
  const otrs = otrStore.use();
  const [stop, setStop] = useState<Maquina | null>(null);
  const [causa, setCausa] = useState<string | null>(CAUSAS_PARADA[0]);
  const [estadoNuevo, setEstadoNuevo] = useState<EstadoMaq>('Detenida');
  const [man, setMan] = useState<{ maqId: string | null; minutos: number | string; causa: string | null; nota: string } | null>(null);
  const [asig, setAsig] = useState<Maquina | null>(null);
  const [asigOtr, setAsigOtr] = useState<string | null>(null);

  const operando = maqs.filter((m) => m.estado === 'Operando').length;
  const disp = maqs.length ? Math.round((operando / maqs.length) * 100) : 0;
  const uso = maqs.length ? Math.round(maqs.reduce((a, m) => a + m.uso, 0) / maqs.length) : 0;
  const minTotal = paradas.reduce((a, p) => a + p.minutos, 0);

  // Pareto: causas ordenadas por minutos perdidos + % acumulado
  const pareto = useMemo(() => {
    const m = new Map<string, number>();
    paradas.forEach((p) => m.set(p.causa, (m.get(p.causa) ?? 0) + p.minutos));
    const arr = [...m.entries()].sort((a, b) => b[1] - a[1]);
    const total = arr.reduce((a, [, v]) => a + v, 0) || 1;
    let acc = 0;
    return arr.map(([c, v]) => ({ causa: c, min: v, acum: Math.round(((acc += v) / total) * 100) }));
  }, [paradas]);
  const max = Math.max(1, ...pareto.map((p) => p.min));
  const otrTxt = (id?: string) => otrs.find((o) => o.id === id);

  const detener = () => {
    if (!stop || !causa) return;
    maqStore.update(stop.id, { estado: estadoNuevo, desde: AHORA(), causa });
    logEvent(`${stop.nombre}: ${estadoNuevo.toLowerCase()} (${causa})`, 'otr');
    notifications.show({ title: `${stop.nombre} ${estadoNuevo.toLowerCase()}`, message: causa, color: 'orange' });
    setStop(null);
  };
  const reanudar = (m: Maquina) => {
    if (m.desde && m.causa) {
      const minutos = Math.max(1, Math.round((Date.now() - new Date(m.desde).getTime()) / 60000));
      paradaStore.add({ id: uid('p'), maqId: m.id, fecha: HOY, minutos: Math.min(minutos, 600), causa: m.causa, nota: 'Registrada al reanudar' });
    }
    maqStore.update(m.id, { estado: 'Operando', desde: undefined, causa: undefined });
    logEvent(`${m.nombre}: reanudada`, 'otr');
    notifications.show({ title: `${m.nombre} operando`, message: 'Parada registrada en el Pareto.', color: 'teal' });
  };
  const guardarManual = () => {
    if (!man?.maqId || !man.causa) return;
    paradaStore.add({ id: uid('p'), maqId: man.maqId, fecha: HOY, minutos: Number(man.minutos) || 0, causa: man.causa, nota: man.nota });
    notifications.show({ title: 'Parada registrada', message: `${hm(Number(man.minutos) || 0)} · ${man.causa}`, color: 'teal' });
    setMan(null);
  };

  return (
    <>
      <PageHead
        title="Máquinas"
        sub="Estado de planta · paradas y causas"
        right={edita ? <Button color="forja" leftSection={<IconPlus size={16} />} onClick={() => setMan({ maqId: null, minutos: 30, causa: CAUSAS_PARADA[0], nota: '' })}>Registrar parada</Button> : undefined}
      />
      <div className={classes.kpis}>
        <div><span className="cap">Disponibilidad ahora</span><b className="num">{disp}%</b><small>{operando} de {maqs.length} operando</small></div>
        <div><span className="cap">Utilización promedio</span><b className="num">{uso}%</b><small>horas productivas / disponibles</small></div>
        <div data-hot><span className="cap">Minutos perdidos (7 d)</span><b className="num">{minTotal}</b><small>{hm(minTotal)} en {paradas.length} paradas</small></div>
        <div><span className="cap">Causa principal</span><b>{pareto[0]?.causa ?? '—'}</b><small>{pareto[0] ? `${Math.round((pareto[0].min / minTotal) * 100)}% del tiempo perdido` : ''}</small></div>
      </div>

      <div className={classes.layout}>
        <section className={classes.grid}>
          {maqs.map((m) => {
            const o = otrTxt(m.otrId);
            const tone = ESTADOS[m.estado];
            return (
              <article key={m.id} className={classes.card} data-tone={tone} style={{ ['--c' as string]: AREA_COLOR[m.area] }}>
                <header>
                  <div><h3>{m.nombre}</h3><span className="cap">{m.area}</span></div>
                  {edita && <Menu position="bottom-end" withinPortal>
                    <Menu.Target><button className={classes.dots} aria-label={`Acciones de ${m.nombre}`}><IconDotsVertical size={16} /></button></Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item leftSection={<IconTool size={14} />} onClick={() => { setAsig(m); setAsigOtr(m.otrId ?? null); }}>Asignar OTR</Menu.Item>
                      {m.estado === 'Operando'
                        ? <><Menu.Item leftSection={<IconPlayerPause size={14} />} onClick={() => { setStop(m); setEstadoNuevo('Detenida'); setCausa(CAUSAS_PARADA[0]); }}>Detener…</Menu.Item>
                          <Menu.Item onClick={() => { setStop(m); setEstadoNuevo('Mantención'); setCausa('Mantenimiento preventivo'); }}>Enviar a mantención…</Menu.Item></>
                        : <Menu.Item leftSection={<IconPlayerPlay size={14} />} onClick={() => reanudar(m)}>Reanudar</Menu.Item>}
                    </Menu.Dropdown>
                  </Menu>}
                </header>
                <div className={classes.state}><i />{m.estado}{m.causa && m.estado !== 'Operando' && <small> · {m.causa}</small>}</div>
                <div className={classes.job}>
                  {m.estado === 'Operando' && o ? <><OtrPlate n={o.otr} /><span>{o.titulo}</span></> : <span className={classes.idle}>{m.estado === 'Operando' ? 'Sin OTR asignada' : m.desde ? `Detenida desde ${m.desde.slice(11, 16)}` : ''}</span>}
                </div>
                <footer>
                  <span>{m.operador}</span>
                  <div className={classes.uso}><i style={{ width: `${m.uso}%` }} /></div>
                  <b className="num">{m.uso}%</b>
                </footer>
              </article>
            );
          })}
        </section>

        <aside className={classes.pareto}>
          <h2>Pareto de paradas</h2>
          <p className="cap">Causas por minutos perdidos · línea = % acumulado</p>
          <ul>
            {pareto.map((p) => (
              <li key={p.causa}>
                <div><span>{p.causa}</span><b className="num">{hm(p.min)}</b></div>
                <div className={classes.track}><i style={{ width: `${(p.min / max) * 100}%` }} /><s style={{ left: `${p.acum}%` }} title={`${p.acum}% acumulado`} /></div>
                <small className="num">{p.acum}% acumulado</small>
              </li>
            ))}
            {pareto.length === 0 && <li className={classes.none}>Sin paradas registradas.</li>}
          </ul>
        </aside>
      </div>

      <Modal opened={!!stop} onClose={() => setStop(null)} size={440} padding="lg" title={<b>{estadoNuevo === 'Detenida' ? 'Detener' : 'Enviar a mantención'} · {stop?.nombre}</b>}>
        <div className={formClasses.form}>
          <Select label="Causa" allowDeselect={false} data={CAUSAS_PARADA} value={causa} onChange={setCausa} />
          <Text size="xs" c="dimmed">El reloj parte ahora. Al reanudar, los minutos se suman al Pareto.</Text>
          <div className={formClasses.foot}>
            <Button variant="default" onClick={() => setStop(null)}>Cancelar</Button>
            <Button color="forja" onClick={detener}>Confirmar</Button>
          </div>
        </div>
      </Modal>

      <Modal opened={!!man} onClose={() => setMan(null)} size={460} padding="lg" title={<b>Registrar parada</b>}>
        {man && (
          <div className={formClasses.form}>
            <Select label="Máquina" searchable placeholder="Selecciona" data={maqs.map((m) => ({ value: m.id, label: m.nombre }))} value={man.maqId} onChange={(v) => setMan({ ...man, maqId: v })} />
            <div className={formClasses.row2}>
              <Select label="Causa" allowDeselect={false} data={CAUSAS_PARADA} value={man.causa} onChange={(v) => setMan({ ...man, causa: v })} />
              <NumberInput label="Minutos" min={1} value={man.minutos} onChange={(v) => setMan({ ...man, minutos: v })} />
            </div>
            <TextInput label="Nota" value={man.nota} onChange={(e) => setMan({ ...man, nota: e.currentTarget.value })} />
            <div className={formClasses.foot}>
              <Button variant="default" onClick={() => setMan(null)}>Cancelar</Button>
              <Button color="forja" disabled={!man.maqId} onClick={guardarManual}>Guardar</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal opened={!!asig} onClose={() => setAsig(null)} size={440} padding="lg" title={<b>Asignar OTR · {asig?.nombre}</b>}>
        <div className={formClasses.form}>
          <Select label="Orden de trabajo" clearable searchable placeholder="Sin asignar" value={asigOtr} onChange={setAsigOtr} data={otrs.map((o) => ({ value: o.id, label: `${o.otr} · ${o.titulo.slice(0, 36)}` }))} />
          <div className={formClasses.foot}>
            <Button variant="default" onClick={() => setAsig(null)}>Cancelar</Button>
            <Button color="forja" onClick={() => { if (asig) maqStore.update(asig.id, { otrId: asigOtr ?? undefined }); setAsig(null); }}>Asignar</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
