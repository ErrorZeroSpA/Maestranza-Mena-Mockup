'use client';

import { useEffect, useState } from 'react';
import { Button, Modal, NumberInput, Select, TextInput, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Area, AREA_COLOR, Etapa, ETAPAS, Otr, RUTA } from '@/lib/mock';
import { diasHasta, dmyToIso, HOY, isoToDmy, logEvent, otrStore, semaforo, uid } from '@/lib/data';
import { closeOtrForm, useOtrForm } from '@/lib/ui';
import classes from './forms.module.css';

interface Draft { otr: number | string; titulo: string; cliente: string; area: Area; hito: string; etapa: Etapa; avance: number | string; entrega: string; comercial: string }
const AREAS = Object.keys(AREA_COLOR) as Area[];
const blank = (): Draft => ({ otr: '', titulo: '', cliente: '', area: 'Fabricación y Estructuras', hito: RUTA[0], etapa: 'ingreso', avance: 0, entrega: '', comercial: '' });

/** Crear / editar OTR. Se monta una vez en el layout; lo abre `openOtrForm`. */
export function OtrFormModal() {
  const form = useOtrForm();
  const [d, setD] = useState<Draft>(blank());
  const [err, setErr] = useState<Partial<Record<keyof Draft, string>>>({});

  useEffect(() => {
    setErr({});
    if (!form) return;
    if (form.mode === 'new') return setD(blank());
    const o = form.otr;
    setD({ otr: o.otr, titulo: o.titulo, cliente: o.cliente, area: o.area, hito: o.hito, etapa: o.etapa, avance: o.avance, entrega: dmyToIso(o.entrega), comercial: o.comercial ?? '' });
  }, [form]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const editing = form?.mode === 'edit' ? form.otr : null;

  const submit = () => {
    const e: typeof err = {};
    if (!Number(d.otr)) e.otr = 'Número de OTR requerido';
    if (!d.titulo.trim()) e.titulo = 'Describe el trabajo';
    if (!d.cliente.trim()) e.cliente = 'Cliente requerido';
    if (!d.entrega) e.entrega = 'Fecha de entrega requerida';
    setErr(e);
    if (Object.keys(e).length) return;

    const plazoDias = diasHasta(d.entrega);
    const avance = Math.max(0, Math.min(100, Number(d.avance) || 0));
    const base = {
      otr: Number(d.otr), titulo: d.titulo.trim().toUpperCase(), cliente: d.cliente.trim().toUpperCase(), area: d.area, hito: d.hito, etapa: d.etapa,
      avance, plazoDias, entrega: isoToDmy(d.entrega), comercial: d.comercial.trim() || undefined, fin: d.entrega,
    };
    if (editing) {
      otrStore.update(editing.id, { ...base, semaforo: semaforo({ avance, plazoDias }) });
      logEvent(`OTR editada (${base.hito}, ${avance}%)`, 'otr', editing.id);
      notifications.show({ title: 'OTR actualizada', message: `OTR ${base.otr} guardada.`, color: 'teal' });
    } else {
      const o: Otr = { ...base, id: uid('o'), iq: 100, pendientes: ['Packing List', 'Carta Gantt'], semaforo: semaforo({ avance, plazoDias }), inicio: HOY };
      otrStore.add(o);
      logEvent(`OTR ${base.otr} creada: ${base.titulo}`, 'otr', o.id);
      notifications.show({ title: 'OTR creada', message: `OTR ${base.otr} agregada a Seguimiento.`, color: 'teal' });
    }
    closeOtrForm();
  };

  return (
    <Modal opened={!!form} onClose={closeOtrForm} size={620} padding="lg" title={<b className={classes.title}>{editing ? `Editar OTR ${editing.otr}` : 'Nueva orden de trabajo'}</b>} transitionProps={{ transition: 'pop', duration: 160 }}>
      <form className={classes.form} onSubmit={(ev) => { ev.preventDefault(); submit(); }} noValidate>
        <div className={classes.row2}>
          <NumberInput label="N° OTR" hideControls required value={d.otr} onChange={(v) => set('otr', v)} error={err.otr} />
          <TextInput label="Cliente" required value={d.cliente} onChange={(e) => set('cliente', e.currentTarget.value)} error={err.cliente} />
        </div>
        <TextInput label="Trabajo" placeholder="Ej: Reparación cilindro hidráulico" required value={d.titulo} onChange={(e) => set('titulo', e.currentTarget.value)} error={err.titulo} />
        <div className={classes.row2}>
          <Select label="Área" allowDeselect={false} data={AREAS} value={d.area} onChange={(v) => set('area', (v as Area) ?? d.area)} />
          <Select label="Etapa" allowDeselect={false} data={ETAPAS.map((e) => ({ value: e.key, label: e.label }))} value={d.etapa} onChange={(v) => set('etapa', (v as Etapa) ?? d.etapa)} />
        </div>
        <div className={classes.row3}>
          <Select label="Hito actual" allowDeselect={false} data={RUTA} value={d.hito} onChange={(v) => set('hito', v ?? d.hito)} />
          <NumberInput label="Avance %" min={0} max={100} value={d.avance} onChange={(v) => set('avance', v)} />
          <TextInput label="Entrega" type="date" required value={d.entrega} onChange={(e) => set('entrega', e.currentTarget.value)} error={err.entrega} />
        </div>
        <Textarea label="Nota comercial" placeholder="Condiciones, acuerdos, alcance…" autosize minRows={2} value={d.comercial} onChange={(e) => set('comercial', e.currentTarget.value)} />
        <div className={classes.foot}>
          <Button variant="default" onClick={closeOtrForm}>Cancelar</Button>
          <Button type="submit" color="forja">{editing ? 'Guardar cambios' : 'Crear OTR'}</Button>
        </div>
      </form>
    </Modal>
  );
}
