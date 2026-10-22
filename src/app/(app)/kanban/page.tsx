'use client';

import { useEffect, useState } from 'react';
import { ActionIcon, Menu, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconDotsVertical, IconPencil, IconTrash, IconArrowRight, IconGripVertical, IconSearch } from '@tabler/icons-react';
import { PageHead } from '@/components/PageHead';
import { Dots, OtrPlate, SegBar } from '@/components/primitives';
import { AREA_COLOR, Area, Etapa, ETAPAS } from '@/lib/mock';
import { logEvent, otrStore } from '@/lib/data';
import { openOtrForm } from '@/lib/ui';
import { usePerm } from '@/lib/roles';
import { toastUndo } from '@/lib/undo';
import { confirmDeleteOtr } from '@/components/otrActions';
import classes from './kanban.module.css';

const AREAS = Object.keys(AREA_COLOR) as Area[];

/** Matriz área × etapa: dónde está cada trabajo y dónde se acumula. */
export default function TableroPage() {
  const OTRS = otrStore.use();
  const can = usePerm();
  const [over, setOver] = useState<string | null>(null);
  const [aviso, setAviso] = useState('');
  const [focoId, setFocoId] = useState<string | null>(null);
  useEffect(() => { if (focoId) { document.querySelector<HTMLElement>(`[data-card="${focoId}"]`)?.focus(); setFocoId(null); } }, [focoId, OTRS]);
  const [q, setQ] = useState('');
  const [solo, setSolo] = useState(false);
  const visibles = OTRS.filter((o) => (!solo || o.semaforo[1] === 'crit') && `${o.otr} ${o.titulo} ${o.cliente}`.toLowerCase().includes(q.toLowerCase()));
  const mover = (id: string, n: number, etapa: Etapa) => { const snap = otrStore.get(); otrStore.update(id, { etapa }); toastUndo('OTR movida', `OTR ${n} → ${ETAPAS.find((e) => e.key === etapa)?.label}`, () => otrStore.restore(snap)); logEvent(`OTR ${n} movida a «${ETAPAS.find((e) => e.key === etapa)?.label}»`, 'otr', id); };
  return (
    <>
      <PageHead title="Tablero de planta" sub="Área × etapa · arrastra una ficha, o enfócala y usa Shift + ← →" />
      <div className={classes.bar}>
        <TextInput size="xs" w={240} placeholder="Buscar OTR, trabajo o cliente" aria-label="Buscar en el tablero" leftSection={<IconSearch size={14} />} value={q} onChange={(e) => setQ(e.currentTarget.value)} />
        <button className={classes.toggle} data-on={solo || undefined} aria-pressed={solo} onClick={() => setSolo((v) => !v)}>Solo críticas<em className="num">{OTRS.filter((o) => o.semaforo[1] === 'crit').length}</em></button>
        <ul className={classes.legend}>
          <li><i data-t="ok" />Al día</li>
          <li><i data-t="warn" />Alerta 48 h</li>
          <li><i data-t="crit" />Crítico</li>
          <li className={classes.hint}>Punto izquierdo = avance · derecho = plazo</li>
        </ul>
      </div>

      <p id="kb-ayuda" className="sr-only">Con la ficha enfocada, Shift y flecha izquierda o derecha la mueve de etapa.</p>
      <div role="status" aria-live="polite" className="sr-only">{aviso}</div>
      <div className={classes.matrix}>
        <div className={classes.corner} />
        {ETAPAS.map((e) => {
          const n = visibles.filter((o) => o.etapa === e.key).length;
          return (
            <div key={e.key} className={classes.colHead}>
              <span>{e.label}</span><b className="num">{n}</b>
            </div>
          );
        })}

        {AREAS.map((a) => (
          <div key={a} className={classes.lane}>
            <div className={classes.laneHead} style={{ ['--c' as string]: AREA_COLOR[a] }}>
              <span><i />{a}</span>
              <b className="num">{visibles.filter((o) => o.area === a).length}</b>
            </div>
            {ETAPAS.map((e) => {
              const items = visibles.filter((o) => o.area === a && o.etapa === e.key);
              return (
                <div
                  key={e.key}
                  className={classes.cell}
                  data-empty={items.length === 0 || undefined}
                  data-over={over === `${a}|${e.key}` || undefined}
                  onDragOver={(ev) => { ev.preventDefault(); setOver(`${a}|${e.key}`); }}
                  onDragLeave={() => setOver(null)}
                  onDrop={(ev) => {
                    ev.preventDefault(); setOver(null);
                    if (!can('otr.move')) return notifications.show({ message: 'Tu rol no puede mover OTR.', color: 'orange' });
                    const o = OTRS.find((x) => x.id === ev.dataTransfer.getData('text/plain'));
                    if (!o) return;
                    if (o.area !== a) return notifications.show({ message: `Esa OTR es de ${o.area}: solo puede moverse dentro de su fila.`, color: 'orange' });
                    if (o.etapa !== e.key) mover(o.id, o.otr, e.key);
                  }}
                >
                  {items.map((o) => (
                    <article key={o.id} className={classes.card} data-card={o.id} tabIndex={0} aria-describedby="kb-ayuda" onKeyDown={(ev) => {
                      if (!ev.shiftKey || !can('otr.move') || (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft')) return;
                      ev.preventDefault();
                      const i = ETAPAS.findIndex((x) => x.key === o.etapa);
                      const dest = ETAPAS[i + (ev.key === 'ArrowRight' ? 1 : -1)];
                      if (!dest) return setAviso(`OTR ${o.otr} ya está en el extremo del tablero.`);
                      mover(o.id, o.otr, dest.key); setAviso(`OTR ${o.otr} movida a ${dest.label}.`); setFocoId(o.id);
                    }} draggable={can('otr.move')} onDragStart={(ev) => ev.dataTransfer.setData('text/plain', o.id)} style={{ ['--c' as string]: AREA_COLOR[a] }}>
                      <div className={classes.top}>
                        <span className={classes.grip}><IconGripVertical size={14} /><OtrPlate n={o.otr} /></span>
                        <span className={classes.topR}>
                          <Dots values={o.semaforo} />
                          <Menu position="bottom-end" width={200} withinPortal>
                            <Menu.Target><ActionIcon variant="subtle" color="gray" size={24} aria-label="Acciones de OTR"><IconDotsVertical size={15} /></ActionIcon></Menu.Target>
                            <Menu.Dropdown>
                              {can('otr.move') && <Menu.Label>Mover a etapa</Menu.Label>}
                              {can('otr.move') && ETAPAS.filter((x) => x.key !== o.etapa).map((x) => (
                                <Menu.Item key={x.key} leftSection={<IconArrowRight size={14} />} onClick={() => mover(o.id, o.otr, x.key)}>{x.label}</Menu.Item>
                              ))}
                              {can('otr.edit') && <Menu.Divider />}
                              {can('otr.edit') && <Menu.Item leftSection={<IconPencil size={14} />} onClick={() => openOtrForm(o)}>Editar</Menu.Item>}
                              {can('otr.edit') && <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => confirmDeleteOtr(o)}>Eliminar</Menu.Item>}
                            </Menu.Dropdown>
                          </Menu>
                        </span>
                      </div>
                      <h4>{o.titulo}</h4>
                      <SegBar value={o.avance} tone={o.semaforo[1]} />
                      <div className={classes.foot}><span>{o.hito}</span><b className="num">{o.avance}%</b></div>
                    </article>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}
