'use client';

import { useMemo, useState } from 'react';
import { ActionIcon, Button, Modal, NumberInput, Select, Text, TextInput, Tooltip } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconBoxSeam, IconChevronDown, IconMinus, IconPencil, IconPlus, IconSearch, IconSend, IconTrash } from '@tabler/icons-react';
import { PageHead } from '@/components/PageHead';
import formClasses from '@/components/forms.module.css';
import { CLP, MaterialRow } from '@/lib/mock';
import { usePerm } from '@/lib/roles';
import { toastUndo } from '@/lib/undo';
import { comprometido } from '@/lib/stock';
import { cubStore } from '@/lib/data';
import { useReady } from '@/lib/ready';
import { EmptyState } from '@/components/EmptyState';
import { RowsSkeleton } from '@/components/Skeletons';
import { cfg, useConfig, logEvent, matStore, otrStore, uid } from '@/lib/data';
import classes from './inventario.module.css';

const FILTROS = {
  todos: { label: 'Todos', tone: 'neutral', test: () => true },
  con: { label: 'Con stock', tone: 'neutral', test: (m: MaterialRow) => m.stock > 0 },
  bajo: { label: 'Stock bajo', tone: 'warn', test: (m: MaterialRow) => m.stock > 0 && m.stock < cfg().stockMin },
  sin: { label: 'Sin stock', tone: 'crit', test: (m: MaterialRow) => m.stock === 0 },
} as const;

type Draft = { tipo: string; descripcion: string; precio: number | string; stock: number | string; unidad: string };
const blank: Draft = { tipo: '', descripcion: '', precio: '', stock: 1, unidad: 'UNID' };

export default function InventarioPage() {
  const can = usePerm();
  useConfig();
  const ready = useReady(380);
  const edita = can('stock.edit');
  const MATERIALES = matStore.use();
  const OTRS = otrStore.use();
  const CUB = cubStore.use();
  const [filtro, setFiltro] = useState<string | null>('todos');
  const [q, setQ] = useState('');
  const [cerrados, setCerrados] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState<{ id?: string } | null>(null);
  const [d, setD] = useState<Draft>(blank);
  const [err, setErr] = useState<string>('');
  const [desp, setDesp] = useState<MaterialRow | null>(null);
  const [dOtr, setDOtr] = useState<string | null>(null);
  const [dQty, setDQty] = useState<number | string>(1);

  const grupos = useMemo(() => {
    const f = MATERIALES.filter((m) => FILTROS[(filtro ?? 'todos') as keyof typeof FILTROS].test(m) && `${m.tipo} ${m.descripcion}`.toLowerCase().includes(q.toLowerCase()));
    return f.reduce<Record<string, MaterialRow[]>>((acc, m) => ((acc[m.tipo] ??= []).push(m), acc), {});
  }, [MATERIALES, filtro, q]);
  const tipos = [...new Set(MATERIALES.map((m) => m.tipo))];
  const sinStock = MATERIALES.filter((m) => m.stock === 0).length;

  const openNew = () => { setD(blank); setErr(''); setForm({}); };
  const openEdit = (m: MaterialRow) => { setD({ tipo: m.tipo, descripcion: m.descripcion, precio: m.precio, stock: m.stock, unidad: m.unidad }); setErr(''); setForm({ id: m.id }); };

  const save = () => {
    if (!d.tipo.trim() || !d.descripcion.trim()) return setErr('Tipo y descripción son obligatorios.');
    const data = { tipo: d.tipo.trim().toUpperCase(), descripcion: d.descripcion.trim().toUpperCase(), precio: Number(d.precio) || 0, stock: Math.max(0, Number(d.stock) || 0), unidad: d.unidad || 'UNID' };
    if (form?.id) {
      matStore.update(form.id, data);
      notifications.show({ title: 'Material actualizado', message: data.descripcion, color: 'teal' });
    } else {
      const dup = MATERIALES.find((m) => m.descripcion === data.descripcion && m.tipo === data.tipo);
      if (dup) {
        matStore.update(dup.id, { stock: dup.stock + data.stock, precio: data.precio || dup.precio });
        logEvent(`Compra ingresada: +${data.stock} ${dup.descripcion}`, 'stock');
        notifications.show({ title: 'Compra ingresada', message: `+${data.stock} a ${dup.descripcion}`, color: 'teal' });
      } else {
        matStore.add({ id: uid('m'), ...data });
        logEvent(`Material nuevo: ${data.descripcion} (${data.stock})`, 'stock');
        notifications.show({ title: 'Material creado', message: data.descripcion, color: 'teal' });
      }
    }
    setForm(null);
  };

  const remove = (m: MaterialRow) =>
    modals.openConfirmModal({
      title: 'Eliminar material',
      children: <Text size="sm">Se eliminará «{m.descripcion}» del inventario junto con su stock ({m.stock}).</Text>,
      labels: { confirm: 'Eliminar', cancel: 'Cancelar' }, confirmProps: { color: 'red' },
      onConfirm: () => { const snap = matStore.get(); matStore.remove(m.id); toastUndo('Material eliminado', m.descripcion, () => matStore.restore(snap)); },
    });

  const despachar = () => {
    if (!desp || !dOtr) return;
    const q = Math.min(desp.stock, Math.max(1, Number(dQty) || 1));
    const snap = matStore.get();
    matStore.update(desp.id, { stock: desp.stock - q });
    logEvent(`Despacho de ${q} × ${desp.descripcion} a OTR ${dOtr}`, 'stock', OTRS.find((o) => String(o.otr) === dOtr)?.id);
    toastUndo('Despacho registrado', `${q} × ${desp.descripcion} → OTR ${dOtr}`, () => matStore.restore(snap));
    setDesp(null);
  };

  return (
    <>
      <PageHead
        title="Inventario"
        sub={`${MATERIALES.length} referencias · valor en bodega ${CLP(MATERIALES.reduce((a, m) => a + m.stock * m.precio, 0))} · ${sinStock} sin stock`}
        right={edita ? <Button color="forja" leftSection={<IconPlus size={16} />} onClick={openNew}>Ingresar compra</Button> : undefined}
      />
      <div className={classes.toolbar}>
        <div className={classes.chips} role="tablist" aria-label="Filtrar por estado">
          {(Object.keys(FILTROS) as (keyof typeof FILTROS)[]).map((k) => (
            <button key={k} role="tab" aria-selected={filtro === k} data-on={filtro === k || undefined} data-tone={FILTROS[k].tone} onClick={() => setFiltro(k)}>
              {FILTROS[k].label}<em className="num">{MATERIALES.filter(FILTROS[k].test).length}</em>
            </button>
          ))}
        </div>
        <TextInput className={classes.search} size="sm" placeholder="Buscar material…" aria-label="Buscar material" leftSection={<IconSearch size={15} />} value={q} onChange={(e) => setQ(e.currentTarget.value)} />
        <Button size="sm" variant="default" onClick={() => setCerrados(Object.fromEntries(Object.keys(grupos).map((k) => [k, true])))}>Contraer todo</Button>
        <Button size="sm" variant="default" onClick={() => setCerrados({})}>Expandir todo</Button>
      </div>

      {!ready ? <RowsSkeleton rows={8} cols={5} /> : (
      <div className={classes.table}>
        <div className={classes.th}><span>Descripción</span><span>Cantidad</span><span>Valor</span><span>Estado</span><span>Acciones</span></div>
        {Object.entries(grupos).map(([tipo, items]) => (
          <section key={tipo}>
            <button className={classes.group} onClick={() => setCerrados((c) => ({ ...c, [tipo]: !c[tipo] }))} aria-expanded={!cerrados[tipo]}>
              <IconChevronDown size={14} data-closed={cerrados[tipo] || undefined} />
              {tipo}<b className="num">{items.length}</b><span className="num">{CLP(items.reduce((a, m) => a + m.stock * m.precio, 0))}</span>
            </button>
            {!cerrados[tipo] && items.map((m) => (
              <div key={m.id} className={classes.row}>
                <div>
                  <div className={classes.desc}>{m.descripcion}</div>
                  <Text size="xs" c="dimmed" className="num">Precio unit. {CLP(m.precio)}{(() => { const c = comprometido(m.id, CUB, OTRS); return c ? ` · comprometido ${c}` : ''; })()}</Text>
                </div>
                <div className={classes.qty}>
                  <b className="num">{m.stock}</b><small>{m.unidad}</small>
                  <span className={classes.stock} data-low={(m.stock > 0 && m.stock < cfg().stockMin) || undefined} data-out={m.stock === 0 || undefined}><i style={{ width: `${Math.min(100, (m.stock / 20) * 100)}%` }} /></span>
                </div>
                <div className={`${classes.val} num`}>{CLP(m.stock * m.precio)}</div>
                <div><span className={classes.state} data-s={m.stock === 0 || comprometido(m.id, CUB, OTRS) > m.stock ? 'out' : m.stock < cfg().stockMin ? 'low' : 'ok'}><i />{m.stock === 0 ? 'Sin stock' : comprometido(m.id, CUB, OTRS) > m.stock ? 'Faltante' : m.stock < cfg().stockMin ? 'Stock bajo' : 'Disponible'}</span></div>
                {edita ? <div className={classes.actions}>
                  <ActionIcon.Group>
                    <ActionIcon variant="default" size={30} aria-label="Restar 1" disabled={m.stock === 0} onClick={() => matStore.update(m.id, { stock: m.stock - 1 })}><IconMinus size={14} /></ActionIcon>
                    <ActionIcon variant="default" size={30} aria-label="Sumar 1" onClick={() => matStore.update(m.id, { stock: m.stock + 1 })}><IconPlus size={14} /></ActionIcon>
                  </ActionIcon.Group>
                  <Button size="compact-sm" color="forja" leftSection={<IconSend size={14} />} disabled={m.stock === 0} onClick={() => { setDesp(m); setDOtr(null); setDQty(1); }}>Despachar a OTR</Button>
                  <Tooltip label="Editar"><ActionIcon variant="subtle" color="gray" aria-label="Editar" onClick={() => openEdit(m)}><IconPencil size={15} /></ActionIcon></Tooltip>
                  <Tooltip label="Eliminar"><ActionIcon variant="subtle" color="red" aria-label="Eliminar" onClick={() => remove(m)}><IconTrash size={15} /></ActionIcon></Tooltip>
                </div> : <div className={classes.actions}><span className="cap">Solo lectura</span></div>}
              </div>
            ))}
          </section>
        ))}
        {Object.keys(grupos).length === 0 && <EmptyState icon={<IconBoxSeam size={32} stroke={1.4} />} title={MATERIALES.length ? 'Ningún material coincide' : 'La bodega está vacía'} text={MATERIALES.length ? 'Cambia el filtro o la búsqueda.' : 'Ingresa la primera compra para empezar a controlar stock.'} action={edita && !MATERIALES.length ? <Button color="forja" onClick={openNew}>Ingresar compra</Button> : undefined} />}
      </div>
      )}

      <Modal opened={!!form} onClose={() => setForm(null)} size={520} padding="lg" title={<b>{form?.id ? 'Editar material' : 'Ingresar compra / nuevo material'}</b>}>
        <form className={formClasses.form} noValidate onSubmit={(e) => { e.preventDefault(); save(); }}>
          <div className={formClasses.row2}>
            <TextInput label="Tipo" placeholder="PLANCHA, ÁNGULO…" list="tipos" required value={d.tipo} onChange={(e) => setD({ ...d, tipo: e.currentTarget.value })} />
            <datalist id="tipos">{tipos.map((t) => <option key={t} value={t} />)}</datalist>
            <TextInput label="Unidad" value={d.unidad} onChange={(e) => setD({ ...d, unidad: e.currentTarget.value })} />
          </div>
          <TextInput label="Descripción" required value={d.descripcion} onChange={(e) => setD({ ...d, descripcion: e.currentTarget.value })} />
          <div className={formClasses.row2}>
            <NumberInput label={form?.id ? 'Stock' : 'Cantidad comprada'} min={0} value={d.stock} onChange={(v) => setD({ ...d, stock: v })} />
            <NumberInput label="Precio unitario" prefix="$" thousandSeparator="." decimalSeparator="," min={0} value={d.precio} onChange={(v) => setD({ ...d, precio: v })} />
          </div>
          {!form?.id && <Text size="xs" c="dimmed">Si el material ya existe (mismo tipo y descripción), se suma al stock actual.</Text>}
          {err && <Text size="sm" c="red">{err}</Text>}
          <div className={formClasses.foot}>
            <Button variant="default" onClick={() => setForm(null)}>Cancelar</Button>
            <Button type="submit" color="forja">{form?.id ? 'Guardar' : 'Ingresar'}</Button>
          </div>
        </form>
      </Modal>

      <Modal opened={!!desp} onClose={() => setDesp(null)} size={460} padding="lg" title={<b>Despachar a OTR</b>}>
        {desp && (
          <div className={formClasses.form}>
            <Text size="sm"><b>{desp.descripcion}</b> · disponible {desp.stock} {desp.unidad}</Text>
            <Select label="Orden de trabajo" searchable placeholder="Selecciona OTR" value={dOtr} onChange={setDOtr}
              data={OTRS.filter((o, i, a) => a.findIndex((x) => x.otr === o.otr) === i).map((o) => ({ value: String(o.otr), label: `${o.otr} · ${o.titulo.slice(0, 36)}` }))} />
            <NumberInput label="Cantidad" min={1} max={desp.stock} value={dQty} onChange={setDQty} />
            <div className={formClasses.foot}>
              <Button variant="default" onClick={() => setDesp(null)}>Cancelar</Button>
              <Button color="forja" disabled={!dOtr} onClick={despachar}>Registrar despacho</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
