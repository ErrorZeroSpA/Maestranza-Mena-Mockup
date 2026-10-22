'use client';

import { useState } from 'react';
import { ActionIcon, Badge, Button, Menu, Modal, SegmentedControl, Select, Text, TextInput, Textarea } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconDotsVertical, IconPencil, IconPlus, IconShieldCheck, IconTrash } from '@tabler/icons-react';
import { PageHead } from '@/components/PageHead';
import { EmptyState } from '@/components/EmptyState';
import { OtrPlate } from '@/components/primitives';
import formClasses from '@/components/forms.module.css';
import { NC } from '@/lib/mock';
import { usePerm } from '@/lib/roles';
import { toastUndo } from '@/lib/undo';
import { HOY, isoToDmy, logEvent, ncStore, otrStore, uid } from '@/lib/data';
import classes from './calidad.module.css';

type Draft = { titulo: string; detalle: string; severidad: NC['severidad']; estado: NC['estado']; responsable: string; otrId: string | null; accion: string };
const blank: Draft = { titulo: '', detalle: '', severidad: 'Menor', estado: 'Abierta', responsable: 'Calidad', otrId: null, accion: '' };
const SEV = { Menor: 'gray', Mayor: 'orange', Crítica: 'red' } as const;
const EST = { Abierta: 'red', 'En análisis': 'yellow', Cerrada: 'teal' } as const;

export default function CalidadPage() {
  const can = usePerm();
  const edita = can('nc.edit');
  const ncs = ncStore.use();
  const otrs = otrStore.use();
  const [filtro, setFiltro] = useState('abiertas');
  const [form, setForm] = useState<{ id?: string } | null>(null);
  const [d, setD] = useState<Draft>(blank);
  const [err, setErr] = useState('');

  const rows = ncs.filter((n) => (filtro === 'todas' ? true : filtro === 'abiertas' ? n.estado !== 'Cerrada' : n.estado === 'Cerrada')).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const abiertas = ncs.filter((n) => n.estado !== 'Cerrada');
  const openNew = () => { setD(blank); setErr(''); setForm({}); };
  const openEdit = (n: NC) => { setD({ titulo: n.titulo, detalle: n.detalle, severidad: n.severidad, estado: n.estado, responsable: n.responsable, otrId: n.otrId ?? null, accion: n.accion }); setErr(''); setForm({ id: n.id }); };
  const otrOf = (id?: string) => otrs.find((o) => o.id === id);

  const save = () => {
    if (!d.titulo.trim()) return setErr('Describe brevemente la no conformidad.');
    const data = { titulo: d.titulo.trim(), detalle: d.detalle.trim(), severidad: d.severidad, estado: d.estado, responsable: d.responsable.trim() || 'Calidad', otrId: d.otrId ?? undefined, accion: d.accion.trim() };
    if (form?.id) ncStore.update(form.id, data);
    else { ncStore.add({ id: uid('n'), fecha: HOY, ...data }); logEvent(`NC ${data.severidad.toLowerCase()} reportada: ${data.titulo}`, 'calidad', data.otrId); }
    notifications.show({ title: form?.id ? 'No conformidad actualizada' : 'No conformidad reportada', message: data.titulo, color: 'teal' });
    setForm(null);
  };
  const setEstado = (n: NC, estado: NC['estado']) => {
    ncStore.update(n.id, { estado });
    logEvent(`NC «${n.titulo}» → ${estado.toLowerCase()}`, 'calidad', n.otrId);
  };
  const remove = (n: NC) => modals.openConfirmModal({ title: 'Eliminar no conformidad', children: <Text size="sm">«{n.titulo}» se eliminará del registro de calidad.</Text>, labels: { confirm: 'Eliminar', cancel: 'Cancelar' }, confirmProps: { color: 'red' }, onConfirm: () => { const snap = ncStore.get(); ncStore.remove(n.id); toastUndo('NC eliminada', n.titulo, () => ncStore.restore(snap)); } });

  return (
    <>
      <PageHead
        title="Calidad"
        sub="Registro de no conformidades · ISO 9001"
        right={<Button color="forja" leftSection={<IconPlus size={16} />} onClick={openNew}>Reportar no conformidad</Button>}
      />
      <div className={classes.stats}>
        <div><span className="cap">Abiertas</span><b className="num">{abiertas.length}</b></div>
        <div data-hot><span className="cap">Críticas</span><b className="num">{abiertas.filter((n) => n.severidad === 'Crítica').length}</b></div>
        <div><span className="cap">En análisis</span><b className="num">{ncs.filter((n) => n.estado === 'En análisis').length}</b></div>
        <div><span className="cap">Cerradas</span><b className="num">{ncs.filter((n) => n.estado === 'Cerrada').length}</b></div>
        <SegmentedControl className={classes.seg} value={filtro} onChange={setFiltro} data={[{ value: 'abiertas', label: 'Abiertas' }, { value: 'cerradas', label: 'Cerradas' }, { value: 'todas', label: 'Todas' }]} />
      </div>

      <ul className={classes.list}>
        {rows.map((n) => {
          const o = otrOf(n.otrId);
          return (
            <li key={n.id} className={classes.item} data-sev={n.severidad}>
              <div className={classes.main}>
                <div className={classes.top}>
                  <Badge color={SEV[n.severidad]} variant="filled" radius="xs">{n.severidad}</Badge>
                  <Badge color={EST[n.estado]} variant="light" radius="xs">{n.estado}</Badge>
                  {o && <OtrPlate n={o.otr} />}
                  <span className="cap">{isoToDmy(n.fecha)} · {n.responsable}</span>
                </div>
                <h3>{n.titulo}</h3>
                {n.detalle && <p>{n.detalle}</p>}
                {n.accion && <p className={classes.accion}><b>Acción correctiva</b>{n.accion}</p>}
              </div>
              <div className={classes.ops}>
                {edita && n.estado !== 'Cerrada' && (
                  <Button size="compact-sm" variant="default" leftSection={<IconCheck size={14} />} onClick={() => setEstado(n, n.estado === 'Abierta' ? 'En análisis' : 'Cerrada')}>
                    {n.estado === 'Abierta' ? 'Iniciar análisis' : 'Cerrar'}
                  </Button>
                )}
                {edita && <Menu position="bottom-end" withinPortal>
                  <Menu.Target><ActionIcon variant="subtle" color="gray" aria-label="Más acciones"><IconDotsVertical size={16} /></ActionIcon></Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item leftSection={<IconPencil size={14} />} onClick={() => openEdit(n)}>Editar</Menu.Item>
                    {n.estado === 'Cerrada' && <Menu.Item onClick={() => setEstado(n, 'Abierta')}>Reabrir</Menu.Item>}
                    <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => remove(n)}>Eliminar</Menu.Item>
                  </Menu.Dropdown>
                </Menu>}
              </div>
            </li>
          );
        })}
        {rows.length === 0 && <li><EmptyState icon={<IconShieldCheck size={32} stroke={1.4} />} title="Sin no conformidades aquí" text="Un registro vacío es buena señal. Si algo se sale de especificación, repórtalo para dejar trazabilidad ISO 9001." /></li>}
      </ul>

      <Modal opened={!!form} onClose={() => setForm(null)} size={600} padding="lg" title={<b>{form?.id ? 'Editar no conformidad' : 'Reportar no conformidad'}</b>}>
        <form className={formClasses.form} noValidate onSubmit={(e) => { e.preventDefault(); save(); }}>
          <TextInput label="Título" required autoFocus value={d.titulo} onChange={(e) => setD({ ...d, titulo: e.currentTarget.value })} error={err} />
          <Textarea label="Detalle" autosize minRows={2} value={d.detalle} onChange={(e) => setD({ ...d, detalle: e.currentTarget.value })} />
          <div className={formClasses.row3}>
            <Select label="Severidad" allowDeselect={false} data={['Menor', 'Mayor', 'Crítica']} value={d.severidad} onChange={(v) => setD({ ...d, severidad: (v as NC['severidad']) ?? 'Menor' })} />
            <Select label="Estado" allowDeselect={false} data={['Abierta', 'En análisis', 'Cerrada']} value={d.estado} onChange={(v) => setD({ ...d, estado: (v as NC['estado']) ?? 'Abierta' })} />
            <TextInput label="Responsable" value={d.responsable} onChange={(e) => setD({ ...d, responsable: e.currentTarget.value })} />
          </div>
          <Select label="OTR asociada" clearable searchable placeholder="Opcional" value={d.otrId} onChange={(v) => setD({ ...d, otrId: v })} data={otrs.map((o) => ({ value: o.id, label: `${o.otr} · ${o.titulo.slice(0, 36)}` }))} />
          <Textarea label="Acción correctiva" autosize minRows={2} value={d.accion} onChange={(e) => setD({ ...d, accion: e.currentTarget.value })} />
          <div className={formClasses.foot}>
            <Button variant="default" onClick={() => setForm(null)}>Cancelar</Button>
            <Button type="submit" color="forja">{form?.id ? 'Guardar' : 'Reportar'}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
