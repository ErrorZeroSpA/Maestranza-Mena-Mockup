'use client';

import { useState } from 'react';
import { ActionIcon, Button, Checkbox, Modal, SegmentedControl, Select, Text, TextInput } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconChecklist, IconFlag, IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import { PageHead } from '@/components/PageHead';
import { OtrPlate } from '@/components/primitives';
import formClasses from '@/components/forms.module.css';
import { Tarea } from '@/lib/mock';
import Link from 'next/link';
import { toastUndo } from '@/lib/undo';
import { useReady } from '@/lib/ready';
import { EmptyState } from '@/components/EmptyState';
import { RowsSkeleton } from '@/components/Skeletons';
import { diasHasta, dmyToIso, isoToDmy, logEvent, otrStore, tareaStore } from '@/lib/data';
import classes from './tareas.module.css';

type Draft = { titulo: string; otr: string | null; responsable: string; vence: string; prioridad: Tarea['prioridad'] };
const GRUPOS = ['Vencidas', 'Hoy', 'Esta semana', 'Más adelante', 'Sin fecha', 'Hechas'] as const;
type Grupo = (typeof GRUPOS)[number];
function grupoDe(t: Tarea): Grupo {
  if (t.estado === 'Hecha') return 'Hechas';
  if (t.vence === '—') return 'Sin fecha';
  const d = diasHasta(dmyToIso(t.vence));
  return d < 0 ? 'Vencidas' : d === 0 ? 'Hoy' : d <= 7 ? 'Esta semana' : 'Más adelante';
}
function relVence(t: Tarea) {
  if (t.vence === '—') return 'Sin fecha';
  const d = diasHasta(dmyToIso(t.vence));
  return d < 0 ? `Vencida hace ${-d} d` : d === 0 ? 'Hoy' : d === 1 ? 'Mañana' : `En ${d} d`;
}

const blank: Draft = { titulo: '', otr: null, responsable: 'Felipe Romero', vence: '', prioridad: 'Media' };

export default function TareasPage() {
  const ready = useReady(300);
  const TAREAS = tareaStore.use();
  const OTRS = otrStore.use();
  const [filtro, setFiltro] = useState('todas');
  const [form, setForm] = useState<{ id?: number } | null>(null);
  const [d, setD] = useState<Draft>(blank);
  const [err, setErr] = useState('');
  const [rapida, setRapida] = useState('');
  const [cerrados, setCerrados] = useState<Record<string, boolean>>({ Hechas: true });

  const rows = TAREAS.filter((t) => filtro === 'todas' || (filtro === 'mias' ? t.responsable === 'Felipe Romero' : t.estado !== 'Hecha'));
  const openNew = () => { setD(blank); setErr(''); setForm({}); };
  const openEdit = (t: Tarea) => { setD({ titulo: t.titulo, otr: t.otr ? String(t.otr) : null, responsable: t.responsable, vence: dmyToIso(t.vence), prioridad: t.prioridad }); setErr(''); setForm({ id: t.id }); };

  const save = () => {
    if (!d.titulo.trim()) return setErr('Escribe qué hay que hacer.');
    const data = { titulo: d.titulo.trim(), otr: d.otr ? Number(d.otr) : undefined, responsable: d.responsable.trim() || 'Sin asignar', vence: d.vence ? isoToDmy(d.vence) : '—', prioridad: d.prioridad };
    if (form?.id) tareaStore.update(form.id, data);
    else { tareaStore.add({ id: Date.now(), estado: 'Pendiente', ...data }); logEvent(`Tarea creada: ${data.titulo}`, 'tarea'); }
    notifications.show({ title: form?.id ? 'Tarea actualizada' : 'Tarea creada', message: data.titulo, color: 'teal' });
    setForm(null);
  };

  const remove = (t: Tarea) =>
    modals.openConfirmModal({
      title: 'Eliminar tarea', children: <Text size="sm">«{t.titulo}» se eliminará definitivamente.</Text>,
      labels: { confirm: 'Eliminar', cancel: 'Cancelar' }, confirmProps: { color: 'red' },
      onConfirm: () => { const snap = tareaStore.get(); tareaStore.remove(t.id); toastUndo('Tarea eliminada', t.titulo, () => tareaStore.restore(snap)); },
    });

  return (
    <>
      <PageHead
        title="Tareas"
        sub={`${TAREAS.filter((t) => t.estado !== 'Hecha').length} pendientes`}
        right={
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <SegmentedControl value={filtro} onChange={setFiltro} data={[{ value: 'todas', label: 'Todas' }, { value: 'mias', label: 'Mías' }, { value: 'pend', label: 'Pendientes' }]} />
            <Button color="forja" leftSection={<IconPlus size={16} />} onClick={openNew}>Nueva tarea</Button>
          </div>
        }
      />
      <form className={classes.quick} onSubmit={(e) => { e.preventDefault(); const t = rapida.trim(); if (!t) return; tareaStore.add({ id: Date.now(), titulo: t, responsable: 'Felipe Romero', vence: '—', prioridad: 'Media', estado: 'Pendiente' }); logEvent(`Tarea creada: ${t}`, 'tarea'); setRapida(''); }}>
        <IconPlus size={16} />
        <input value={rapida} onChange={(e) => setRapida(e.target.value)} placeholder="Escribe una tarea y presiona Enter…" aria-label="Agregar tarea rápida" />
        <kbd>Enter</kbd>
      </form>

      {!ready && <RowsSkeleton rows={5} />}
      {ready && GRUPOS.map((g) => {
        const items = rows.filter((t) => grupoDe(t) === g);
        if (!items.length) return null;
        const cerrado = cerrados[g];
        return (
          <section key={g} className={classes.section} data-g={g}>
            <button className={classes.sectionHead} aria-expanded={!cerrado} onClick={() => setCerrados((c) => ({ ...c, [g]: !c[g] }))}>
              {g}<em className="num">{items.length}</em>
            </button>
            {!cerrado && (
              <ul className={classes.list}>
                {items.map((t) => {
                  const hecha = t.estado === 'Hecha';
                  const o = t.otr ? OTRS.find((x) => x.otr === t.otr) : undefined;
                  return (
                    <li key={t.id} className={classes.row} data-done={hecha || undefined}>
                      <Checkbox checked={hecha} onChange={(e) => tareaStore.update(t.id, { estado: e.currentTarget.checked ? 'Hecha' : 'Pendiente' })} aria-label={t.titulo} color="forja" />
                      <div className={classes.main}>
                        <span className={classes.title}>{t.titulo}</span>
                        <span className={classes.meta}>{t.responsable}{o && <> · <Link href={`/seguimiento?otr=${o.id}`}>OTR {o.otr}</Link></>}</span>
                      </div>
                      <span className={classes.prio} data-p={t.prioridad}><IconFlag size={12} />{t.prioridad}</span>
                      <span className={`${classes.due} num`} data-late={g === 'Vencidas' || undefined}>{hecha ? t.vence : relVence(t)}</span>
                      <span className={classes.ops}>
                        <ActionIcon variant="subtle" color="gray" aria-label="Editar" onClick={() => openEdit(t)}><IconPencil size={15} /></ActionIcon>
                        <ActionIcon variant="subtle" color="red" aria-label="Eliminar" onClick={() => remove(t)}><IconTrash size={15} /></ActionIcon>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
      {ready && rows.length === 0 && <EmptyState icon={<IconChecklist size={32} stroke={1.4} />} title={TAREAS.length ? 'Nada en esta vista' : 'Sin tareas pendientes'} text={TAREAS.length ? 'Prueba con otro filtro.' : 'Anota lo que hay que hacer arriba y presiona Enter.'} />}

      <Modal opened={!!form} onClose={() => setForm(null)} size={520} padding="lg" title={<b>{form?.id ? 'Editar tarea' : 'Nueva tarea'}</b>}>
        <form className={formClasses.form} noValidate onSubmit={(e) => { e.preventDefault(); save(); }}>
          <TextInput label="Tarea" required autoFocus value={d.titulo} onChange={(e) => setD({ ...d, titulo: e.currentTarget.value })} error={err} />
          <Select label="OTR asociada" clearable searchable placeholder="Opcional" value={d.otr} onChange={(v) => setD({ ...d, otr: v })}
            data={OTRS.filter((o, i, a) => a.findIndex((x) => x.otr === o.otr) === i).map((o) => ({ value: String(o.otr), label: `${o.otr} · ${o.titulo.slice(0, 36)}` }))} />
          <div className={formClasses.row3}>
            <TextInput label="Responsable" value={d.responsable} onChange={(e) => setD({ ...d, responsable: e.currentTarget.value })} />
            <Select label="Prioridad" allowDeselect={false} data={['Alta', 'Media', 'Baja']} value={d.prioridad} onChange={(v) => setD({ ...d, prioridad: (v as Tarea['prioridad']) ?? 'Media' })} />
            <TextInput label="Vence" type="date" value={d.vence} onChange={(e) => setD({ ...d, vence: e.currentTarget.value })} />
          </div>
          <div className={formClasses.foot}>
            <Button variant="default" onClick={() => setForm(null)}>Cancelar</Button>
            <Button type="submit" color="forja">{form?.id ? 'Guardar' : 'Crear tarea'}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
