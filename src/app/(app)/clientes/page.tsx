'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ActionIcon, Button, Drawer, Modal, Text, TextInput } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconMail, IconPencil, IconPhone, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react';
import { PageHead } from '@/components/PageHead';
import { OtrPlate, SegBar } from '@/components/primitives';
import formClasses from '@/components/forms.module.css';
import { CLP, Cliente } from '@/lib/mock';
import { usePerm } from '@/lib/roles';
import { toastUndo } from '@/lib/undo';
import { useReady } from '@/lib/ready';
import { EmptyState } from '@/components/EmptyState';
import { RowsSkeleton } from '@/components/Skeletons';
import { clienteStore, logEvent, otrStore, uid } from '@/lib/data';
import classes from './clientes.module.css';

type Draft = Omit<Cliente, 'id'>;
const blank: Draft = { nombre: '', rut: '', contacto: '', email: '', telefono: '', industria: '' };

export default function ClientesPage() {
  const can = usePerm();
  const ready = useReady(350);
  const edita = can('cliente.edit');
  const clientes = clienteStore.use();
  const otrs = otrStore.use();
  const [q, setQ] = useState('');
  const [form, setForm] = useState<{ id?: string } | null>(null);
  const [d, setD] = useState<Draft>(blank);
  const [err, setErr] = useState('');
  const [sel, setSel] = useState<string | null>(null);
  const [ind, setInd] = useState('todas');
  const industrias = [...new Set(clientes.map((c) => c.industria).filter(Boolean))];

  const rows = clientes.filter((c) => (ind === 'todas' || c.industria === ind) && `${c.nombre} ${c.contacto} ${c.industria}`.toLowerCase().includes(q.toLowerCase()));
  const delCliente = clientes.find((c) => c.id === sel);
  const otrsDe = (nombre: string) => otrs.filter((o) => o.cliente === nombre);

  const openNew = () => { setD(blank); setErr(''); setForm({}); };
  const openEdit = (c: Cliente) => { const { id, ...rest } = c; void id; setD(rest); setErr(''); setForm({ id: c.id }); };
  const save = () => {
    if (!d.nombre.trim()) return setErr('El nombre es obligatorio.');
    const data = { ...d, nombre: d.nombre.trim().toUpperCase() };
    if (form?.id) clienteStore.update(form.id, data);
    else { clienteStore.add({ id: uid('c'), ...data }); logEvent(`Cliente creado: ${data.nombre}`, 'cliente'); }
    notifications.show({ title: form?.id ? 'Cliente actualizado' : 'Cliente creado', message: data.nombre, color: 'teal' });
    setForm(null);
  };
  const remove = (c: Cliente) => {
    if (otrsDe(c.nombre).length) return notifications.show({ title: 'No se puede eliminar', message: `${c.nombre} tiene ${otrsDe(c.nombre).length} OTR asociadas.`, color: 'orange' });
    modals.openConfirmModal({ title: 'Eliminar cliente', children: <Text size="sm">Se eliminará «{c.nombre}» del registro.</Text>, labels: { confirm: 'Eliminar', cancel: 'Cancelar' }, confirmProps: { color: 'red' }, onConfirm: () => { const snap = clienteStore.get(); clienteStore.remove(c.id); setSel(null); toastUndo('Cliente eliminado', c.nombre, () => clienteStore.restore(snap)); } });
  };

  return (
    <>
      <PageHead title="Clientes" sub={`${clientes.length} clientes · ${otrs.length} OTR en curso`} right={edita ? <Button color="forja" leftSection={<IconPlus size={16} />} onClick={openNew}>Nuevo cliente</Button> : undefined} />
      <div className={classes.bar}>
        <div className={classes.chips} role="tablist" aria-label="Filtrar por industria">
          {['todas', ...industrias].map((i) => (
            <button key={i} role="tab" aria-selected={ind === i} data-on={ind === i || undefined} onClick={() => setInd(i)}>{i === 'todas' ? 'Todas' : i}</button>
          ))}
        </div>
        <TextInput className={classes.search} size="sm" placeholder="Buscar cliente o contacto" leftSection={<IconSearch size={15} />} value={q} onChange={(e) => setQ(e.currentTarget.value)} aria-label="Buscar clientes" />
      </div>

      {!ready ? <RowsSkeleton rows={6} cols={5} /> : (
      <div className={classes.table}>
        <div className={classes.th}><span>Cliente</span><span>Contacto</span><span>OTR</span><span>Avance</span><span>Cartera</span></div>
        {rows.map((c) => {
          const os = otrsDe(c.nombre);
          const prom = os.length ? Math.round(os.reduce((a, o) => a + o.avance, 0) / os.length) : 0;
          const cartera = os.reduce((a, o) => a + (o.venta ?? 0), 0);
          return (
            <button key={c.id} className={classes.row} onClick={() => setSel(c.id)}>
              <span className={classes.name}>
                <i aria-hidden>{c.nombre.slice(0, 2)}</i>
                <span><b>{c.nombre}</b><small>{c.industria || '—'}</small></span>
              </span>
              <span className={classes.contact}><b>{c.contacto || 'Sin contacto'}</b><small>{c.email}</small></span>
              <span className={`${classes.n} num`}>{os.length}</span>
              <span className={classes.prog}><SegBar value={prom} /><em className="num">{prom}%</em></span>
              <span className={`${classes.money} num`}>{cartera ? CLP(cartera) : '—'}</span>
            </button>
          );
        })}
        {rows.length === 0 && <EmptyState icon={<IconSearch size={32} stroke={1.4} />} title={clientes.length ? 'Ningún cliente coincide' : 'Aún no hay clientes'} text={clientes.length ? 'Prueba con otra búsqueda o industria.' : 'Registra a tu primer cliente para asociarle órdenes y cotizaciones.'} action={edita && !clientes.length ? <Button color="forja" onClick={openNew}>Nuevo cliente</Button> : undefined} />}
      </div>
      )}

      <Drawer opened={!!delCliente} onClose={() => setSel(null)} position="right" size="min(480px, 100vw)" padding="lg" title={<b>{delCliente?.nombre}</b>}>
        {delCliente && (
          <div className={classes.detail}>
            <dl>
              <div><dt>RUT</dt><dd className="mono">{delCliente.rut || '—'}</dd></div>
              <div><dt>Industria</dt><dd>{delCliente.industria || '—'}</dd></div>
              <div><dt>Contacto</dt><dd>{delCliente.contacto || '—'}</dd></div>
            </dl>
            <div className={classes.links}>
              {delCliente.email && <Button component="a" href={`mailto:${delCliente.email}`} size="xs" variant="default" leftSection={<IconMail size={14} />}>{delCliente.email}</Button>}
              {delCliente.telefono && <Button component="a" href={`tel:${delCliente.telefono.replace(/\s/g, '')}`} size="xs" variant="default" leftSection={<IconPhone size={14} />}>{delCliente.telefono}</Button>}
            </div>
            <h4>Órdenes de trabajo</h4>
            <ul className={classes.otrs}>
              {otrsDe(delCliente.nombre).map((o) => (
                <li key={o.id}><Link href={`/seguimiento?otr=${o.id}`}><OtrPlate n={o.otr} /><span>{o.titulo}</span><b className="num">{o.avance}%</b></Link></li>
              ))}
              {otrsDe(delCliente.nombre).length === 0 && <li className={classes.empty}>Sin OTR activas.</li>}
            </ul>
            {edita && <div className={classes.actions}>
              <Button variant="default" leftSection={<IconPencil size={15} />} onClick={() => { openEdit(delCliente); setSel(null); }}>Editar</Button>
              <ActionIcon variant="light" color="red" size={36} aria-label="Eliminar cliente" onClick={() => remove(delCliente)}><IconTrash size={16} /></ActionIcon>
            </div>}
          </div>
        )}
      </Drawer>

      <Modal opened={!!form} onClose={() => setForm(null)} size={560} padding="lg" title={<b>{form?.id ? 'Editar cliente' : 'Nuevo cliente'}</b>}>
        <form className={formClasses.form} noValidate onSubmit={(e) => { e.preventDefault(); save(); }}>
          <div className={formClasses.row2}>
            <TextInput label="Nombre" required autoFocus value={d.nombre} onChange={(e) => setD({ ...d, nombre: e.currentTarget.value })} error={err} />
            <TextInput label="RUT" placeholder="76.123.456-7" value={d.rut} onChange={(e) => setD({ ...d, rut: e.currentTarget.value })} />
          </div>
          <div className={formClasses.row2}>
            <TextInput label="Contacto" value={d.contacto} onChange={(e) => setD({ ...d, contacto: e.currentTarget.value })} />
            <TextInput label="Industria" value={d.industria} onChange={(e) => setD({ ...d, industria: e.currentTarget.value })} />
          </div>
          <div className={formClasses.row2}>
            <TextInput label="Correo" type="email" value={d.email} onChange={(e) => setD({ ...d, email: e.currentTarget.value })} />
            <TextInput label="Teléfono" value={d.telefono} onChange={(e) => setD({ ...d, telefono: e.currentTarget.value })} />
          </div>
          <div className={formClasses.foot}>
            <Button variant="default" onClick={() => setForm(null)}>Cancelar</Button>
            <Button type="submit" color="forja">{form?.id ? 'Guardar' : 'Crear cliente'}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
