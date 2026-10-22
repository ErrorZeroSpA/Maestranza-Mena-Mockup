'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ActionIcon, Badge, Button, Checkbox, Drawer, Menu, Modal, NumberInput, Select, Text, TextInput } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconDotsVertical, IconPackageImport, IconPencil, IconPlus, IconPrinter, IconSend, IconShoppingCart, IconTrash, IconTruck } from '@tabler/icons-react';
import { PageHead } from '@/components/PageHead';
import { EmptyState } from '@/components/EmptyState';
import formClasses from '@/components/forms.module.css';
import { CLP, OC, OCLinea, Proveedor } from '@/lib/mock';
import { cfg, useConfig, cubStore, logEvent, matStore, ocStore, otrStore, provStore, uid, HOY } from '@/lib/data';
import { faltantes } from '@/lib/stock';
import { usePerm } from '@/lib/roles';
import { toastUndo } from '@/lib/undo';
import classes from './compras.module.css';

const TONO: Record<OC['estado'], string> = { Borrador: 'gray', Enviada: 'blue', 'Recibida parcial': 'yellow', Recibida: 'teal' };
const totalOC = (o: OC) => o.lineas.reduce((a, l) => a + l.cant * l.precio, 0);
const esc = (t: string | number) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

function imprimirOC(o: OC, p?: Proveedor) {
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<!doctype html><html lang="es"><meta charset="utf-8"><title>${esc(o.numero)}</title><style>body{font:13px system-ui,sans-serif;margin:30px;color:#0f1b2d}header{border-bottom:4px solid #f28c28;padding-bottom:10px;margin-bottom:16px}h1{margin:0;font-size:22px}table{width:100%;border-collapse:collapse}th{text-align:left;background:#0b2748;color:#fff;font:10px monospace;text-transform:uppercase;padding:7px}td{padding:8px 7px;border-bottom:1px solid #ccc}.r{text-align:right}</style>
  <header><h1>Orden de compra ${esc(o.numero)}</h1><div>Maestranza Mena · ${esc(o.fecha.split('-').reverse().join('-'))}</div></header>
  <p><b>Proveedor:</b> ${esc(p?.nombre ?? '—')} · ${esc(p?.contacto ?? '')} · ${esc(p?.email ?? '')}</p>
  <table><thead><tr><th>Descripción</th><th class="r">Cant.</th><th class="r">P. unit.</th><th class="r">Total</th></tr></thead><tbody>${o.lineas.map((l) => `<tr><td>${esc(l.descripcion)}</td><td class="r">${l.cant}</td><td class="r">${esc(CLP(l.precio))}</td><td class="r">${esc(CLP(l.cant * l.precio))}</td></tr>`).join('')}</tbody></table>
  <p class="r"><b>Total neto: ${esc(CLP(totalOC(o)))}</b></p><script>setTimeout(()=>window.print(),300)</script></html>`);
  w.document.close();
}

export default function ComprasPage() {
  return <Suspense fallback={null}><Inner /></Suspense>;
}

function Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const tab = params.get('t') ?? 'reposicion';
  const can = usePerm();
  useConfig();
  const edita = can('compras.edit');
  const mats = matStore.use(); const cub = cubStore.use(); const otrs = otrStore.use();
  const ocs = ocStore.use(); const provs = provStore.use();
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const [ocEd, setOcEd] = useState<OC | null>(null);
  const [recibir, setRecibir] = useState<OC | null>(null);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [provEd, setProvEd] = useState<{ p: Proveedor; nuevo: boolean } | null>(null);

  const falt = useMemo(() => faltantes(mats, cub, otrs), [mats, cub, otrs]);
  // sugerencias: sin stock, stock bajo o faltante por cubicación; menos lo que ya viene en una OC abierta
  const enCamino = (matId: string) => ocs.filter((o) => o.estado === 'Enviada' || o.estado === 'Recibida parcial' || o.estado === 'Borrador').flatMap((o) => o.lineas).filter((l) => l.matId === matId).reduce((a, l) => a + (l.cant - l.recibida), 0);
  const sugerencias = useMemo(() => mats.map((m) => {
    const f = falt.find((x) => x.m.id === m.id);
    const necesidad = f ? f.falta : m.stock < cfg().stockMin ? cfg().stockMin * 2 - m.stock : 0;
    const pedir = Math.max(0, necesidad - enCamino(m.id));
    return { m, motivo: f ? 'Faltante por cubicación' : m.stock === 0 ? 'Sin stock' : 'Stock bajo', necesidad, pedir, camino: enCamino(m.id) };
  }).filter((x) => x.necesidad > 0), [mats, falt, ocs]); // eslint-disable-line react-hooks/exhaustive-deps

  const elegidas = sugerencias.filter((s) => sel[s.m.id] && s.pedir > 0);
  const crearOC = () => {
    if (!elegidas.length) return;
    setOcEd({ id: uid('oc'), numero: `OC-${8857 + ocs.length}`, proveedorId: provs[0]?.id ?? '', estado: 'Borrador', fecha: HOY, lineas: elegidas.map((s) => ({ id: uid('ol'), matId: s.m.id, descripcion: s.m.descripcion, cant: s.pedir, recibida: 0, precio: s.m.precio })) });
  };
  const guardarOC = () => {
    if (!ocEd || !ocEd.proveedorId || !ocEd.lineas.length) return notifications.show({ message: 'Elige proveedor y al menos una línea.', color: 'orange' });
    if (ocs.some((o) => o.id === ocEd.id)) ocStore.update(ocEd.id, ocEd); else { ocStore.add(ocEd); logEvent(`${ocEd.numero} creada (${CLP(totalOC(ocEd))})`, 'stock'); }
    notifications.show({ title: 'Orden de compra guardada', message: `${ocEd.numero} · ${CLP(totalOC(ocEd))}`, color: 'teal' });
    setOcEd(null); setSel({}); router.replace('/compras?t=ordenes');
  };
  const registrarRecepcion = () => {
    if (!recibir) return;
    const snapOC = ocStore.get(); const snapM = matStore.get();
    const lineas = recibir.lineas.map((l) => ({ ...l, recibida: Math.min(l.cant, l.recibida + (qty[l.id] ?? 0)) }));
    lineas.forEach((l, i) => { const add = l.recibida - recibir.lineas[i].recibida; const m = l.matId ? matStore.get().find((x) => x.id === l.matId) : undefined; if (m && add > 0) matStore.update(m.id, { stock: m.stock + add }); });
    const todo = lineas.every((l) => l.recibida >= l.cant);
    const algo = lineas.some((l) => l.recibida > 0);
    ocStore.update(recibir.id, { lineas, estado: todo ? 'Recibida' : algo ? 'Recibida parcial' : recibir.estado });
    logEvent(`Recepción ${recibir.numero}: stock actualizado${todo ? '' : ' (parcial)'}`, 'stock');
    toastUndo('Recepción registrada', `${recibir.numero} · stock sumado en bodega`, () => { ocStore.restore(snapOC); matStore.restore(snapM); });
    setRecibir(null); setQty({});
  };
  const borrarOC = (o: OC) => modals.openConfirmModal({ title: 'Eliminar orden de compra', children: <Text size="sm">Se eliminará {o.numero}.</Text>, labels: { confirm: 'Eliminar', cancel: 'Cancelar' }, confirmProps: { color: 'red' }, onConfirm: () => { const snap = ocStore.get(); ocStore.remove(o.id); toastUndo('OC eliminada', o.numero, () => ocStore.restore(snap)); } });
  const guardarProv = () => {
    if (!provEd?.p.nombre.trim()) return;
    if (provEd.nuevo) provStore.add(provEd.p); else provStore.update(provEd.p.id, provEd.p);
    notifications.show({ message: 'Proveedor guardado.', color: 'teal' }); setProvEd(null);
  };
  const setLinea = (id: string, patch: Partial<OCLinea>) => ocEd && setOcEd({ ...ocEd, lineas: ocEd.lineas.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  const go = (t: string) => router.replace(`/compras?t=${t}`);

  return (
    <>
      <PageHead title="Compras" sub={`${sugerencias.length} materiales por reponer · ${ocs.filter((o) => o.estado === 'Enviada' || o.estado === 'Recibida parcial').length} órdenes en camino`} />
      <nav className={classes.tabs} aria-label="Secciones de compras">
        {[['reposicion', `Reposición (${sugerencias.length})`], ['ordenes', `Órdenes de compra (${ocs.length})`], ['proveedores', `Proveedores (${provs.length})`]].map(([k, l]) => (
          <button key={k} data-on={tab === k || undefined} onClick={() => go(k)}>{l}</button>
        ))}
      </nav>

      {tab === 'reposicion' && (sugerencias.length === 0 ? (
        <EmptyState icon={<IconShoppingCart size={32} stroke={1.4} />} title="Nada que reponer" text="Ningún material está bajo el mínimo ni falta para una cubicación aprobada." />
      ) : (
        <>
          <div className={classes.table}>
            <div className={classes.th}><span /><span>Material</span><span>Motivo</span><span>En bodega</span><span>En camino</span><span>Pedir</span></div>
            {sugerencias.map((s) => (
              <label key={s.m.id} className={classes.row} data-off={s.pedir === 0 || undefined}>
                <Checkbox aria-label={`Elegir ${s.m.descripcion}`} disabled={!edita || s.pedir === 0} checked={!!sel[s.m.id]} onChange={(e) => setSel({ ...sel, [s.m.id]: e.currentTarget.checked })} color="forja" />
                <span className={classes.nm}><b>{s.m.descripcion}</b><small>{s.m.tipo} · {CLP(s.m.precio)} c/u</small></span>
                <span><Badge color={s.motivo === 'Sin stock' || s.motivo.startsWith('Falt') ? 'red' : 'yellow'} variant="light" radius="xs">{s.motivo}</Badge></span>
                <span className="num">{s.m.stock}</span>
                <span className="num">{s.camino || '—'}</span>
                <span className="num"><b>{s.pedir || 'Cubierto'}</b></span>
              </label>
            ))}
          </div>
          {edita && <div className={classes.bar}><span>{elegidas.length} seleccionados</span><Button color="forja" leftSection={<IconShoppingCart size={16} />} disabled={!elegidas.length} onClick={crearOC}>Crear orden de compra</Button></div>}
        </>
      ))}

      {tab === 'ordenes' && (ocs.length === 0 ? (
        <EmptyState icon={<IconTruck size={32} stroke={1.4} />} title="Sin órdenes de compra" text="Crea una desde la pestaña Reposición." />
      ) : (
        <div className={classes.table}>
          <div className={classes.th} style={{ gridTemplateColumns: '110px 1fr 150px 130px 40px' }}><span>N°</span><span>Proveedor</span><span>Estado</span><span>Total neto</span><span /></div>
          {ocs.map((o) => {
            const pv = provs.find((p) => p.id === o.proveedorId);
            return (
              <div key={o.id} className={classes.row} style={{ gridTemplateColumns: '110px 1fr 150px 130px 40px' }}>
                <span className="mono num">{o.numero}</span>
                <span className={classes.nm}><b>{pv?.nombre ?? '—'}</b><small>{o.lineas.length} líneas · {o.fecha.split('-').reverse().join('-')}</small></span>
                <span><Badge color={TONO[o.estado]} variant="light" radius="xs">{o.estado}</Badge></span>
                <span className="num">{CLP(totalOC(o))}</span>
                <Menu position="bottom-end" withinPortal>
                  <Menu.Target><ActionIcon variant="subtle" color="gray" aria-label={`Acciones de ${o.numero}`}><IconDotsVertical size={16} /></ActionIcon></Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item leftSection={<IconPrinter size={14} />} onClick={() => imprimirOC(o, pv)}>Imprimir / PDF</Menu.Item>
                    {edita && o.estado === 'Borrador' && <Menu.Item leftSection={<IconPencil size={14} />} onClick={() => setOcEd(o)}>Editar</Menu.Item>}
                    {edita && o.estado === 'Borrador' && <Menu.Item leftSection={<IconSend size={14} />} onClick={() => { ocStore.update(o.id, { estado: 'Enviada' }); logEvent(`${o.numero} enviada a ${pv?.nombre}`, 'stock'); notifications.show({ message: `${o.numero} enviada.`, color: 'teal' }); }}>Marcar como enviada</Menu.Item>}
                    {edita && (o.estado === 'Enviada' || o.estado === 'Recibida parcial') && <Menu.Item leftSection={<IconPackageImport size={14} />} onClick={() => { setRecibir(o); setQty(Object.fromEntries(o.lineas.map((l) => [l.id, l.cant - l.recibida]))); }}>Registrar recepción</Menu.Item>}
                    {edita && o.estado !== 'Recibida' && <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => borrarOC(o)}>Eliminar</Menu.Item>}
                  </Menu.Dropdown>
                </Menu>
              </div>
            );
          })}
        </div>
      ))}

      {tab === 'proveedores' && (
        <>
          {edita && <div className={classes.bar}><span /><Button color="forja" leftSection={<IconPlus size={16} />} onClick={() => setProvEd({ nuevo: true, p: { id: uid('p'), nombre: '', rut: '', contacto: '', email: '', telefono: '', rubro: '', plazoDias: 3 } })}>Nuevo proveedor</Button></div>}
          <div className={classes.cards}>
            {provs.map((p) => (
              <article key={p.id} className={classes.prov}>
                <h3>{p.nombre}</h3>
                <span className="cap">{p.rubro || 'Sin rubro'}</span>
                <p><b>{p.contacto}</b><br />{p.email}<br />{p.telefono}</p>
                <footer><span>Entrega en <b className="num">{p.plazoDias} d</b></span>{edita && <span><ActionIcon variant="subtle" color="gray" aria-label="Editar proveedor" onClick={() => setProvEd({ nuevo: false, p })}><IconPencil size={15} /></ActionIcon><ActionIcon variant="subtle" color="red" aria-label="Eliminar proveedor" onClick={() => { const snap = provStore.get(); provStore.remove(p.id); toastUndo('Proveedor eliminado', p.nombre, () => provStore.restore(snap)); }}><IconTrash size={15} /></ActionIcon></span>}</footer>
              </article>
            ))}
          </div>
        </>
      )}

      <Drawer opened={!!ocEd} onClose={() => setOcEd(null)} position="right" size="min(720px, 100vw)" padding="xl" title={<b style={{ fontSize: 18 }}>{ocEd?.numero}</b>}>
        {ocEd && (
          <div className={formClasses.form}>
            <Select label="Proveedor" searchable allowDeselect={false} value={ocEd.proveedorId} onChange={(v) => v && setOcEd({ ...ocEd, proveedorId: v })} data={provs.map((p) => ({ value: p.id, label: `${p.nombre} · ${p.plazoDias} d` }))} />
            <Select label="Para la OTR (opcional)" clearable searchable value={ocEd.otrId ?? null} onChange={(v) => setOcEd({ ...ocEd, otrId: v ?? undefined })} data={otrs.map((o) => ({ value: o.id, label: `${o.otr} · ${o.titulo.slice(0, 34)}` }))} />
            <table className={classes.lines}>
              <thead><tr><th>Descripción</th><th>Cant.</th><th>Precio unit.</th><th>Total</th><th /></tr></thead>
              <tbody>
                {ocEd.lineas.map((l) => (
                  <tr key={l.id}>
                    <td>{l.descripcion}</td>
                    <td><NumberInput size="xs" w={70} min={1} aria-label="Cantidad" value={l.cant} onChange={(v) => setLinea(l.id, { cant: Number(v) || 1 })} /></td>
                    <td><NumberInput size="xs" w={120} min={0} hideControls prefix="$" thousandSeparator="." decimalSeparator="," aria-label="Precio" value={l.precio} onChange={(v) => setLinea(l.id, { precio: Number(v) || 0 })} /></td>
                    <td className="num">{CLP(l.cant * l.precio)}</td>
                    <td><ActionIcon variant="subtle" color="red" size="sm" aria-label="Quitar" onClick={() => setOcEd({ ...ocEd, lineas: ocEd.lineas.filter((x) => x.id !== l.id) })}><IconTrash size={14} /></ActionIcon></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Text fw={800} size="lg" ta="right" className="num">Total neto: {CLP(totalOC(ocEd))}</Text>
            <div className={formClasses.foot}><Button variant="default" onClick={() => setOcEd(null)}>Cancelar</Button><Button color="forja" onClick={guardarOC}>Guardar orden</Button></div>
          </div>
        )}
      </Drawer>

      <Modal opened={!!recibir} onClose={() => setRecibir(null)} size={560} padding="lg" title={<b>Recepción {recibir?.numero}</b>}>
        {recibir && (
          <div className={formClasses.form}>
            <Text size="sm" c="dimmed">Indica cuánto llegó de cada línea. El stock de bodega se actualiza al confirmar.</Text>
            {recibir.lineas.map((l) => (
              <div key={l.id} className={classes.recv}>
                <span><b>{l.descripcion}</b><small>Pedido {l.cant} · recibido {l.recibida}</small></span>
                <NumberInput size="xs" w={90} min={0} max={l.cant - l.recibida} aria-label={`Recibido ${l.descripcion}`} value={qty[l.id] ?? 0} onChange={(v) => setQty({ ...qty, [l.id]: Number(v) || 0 })} />
              </div>
            ))}
            <div className={formClasses.foot}><Button variant="default" onClick={() => setRecibir(null)}>Cancelar</Button><Button color="forja" onClick={registrarRecepcion}>Confirmar recepción</Button></div>
          </div>
        )}
      </Modal>

      <Modal opened={!!provEd} onClose={() => setProvEd(null)} size={540} padding="lg" title={<b>{provEd?.nuevo ? 'Nuevo proveedor' : 'Editar proveedor'}</b>}>
        {provEd && (
          <div className={formClasses.form}>
            <div className={formClasses.row2}><TextInput label="Nombre" required value={provEd.p.nombre} onChange={(e) => setProvEd({ ...provEd, p: { ...provEd.p, nombre: e.currentTarget.value } })} /><TextInput label="RUT" value={provEd.p.rut} onChange={(e) => setProvEd({ ...provEd, p: { ...provEd.p, rut: e.currentTarget.value } })} /></div>
            <TextInput label="Rubro" value={provEd.p.rubro} onChange={(e) => setProvEd({ ...provEd, p: { ...provEd.p, rubro: e.currentTarget.value } })} />
            <div className={formClasses.row2}><TextInput label="Contacto" value={provEd.p.contacto} onChange={(e) => setProvEd({ ...provEd, p: { ...provEd.p, contacto: e.currentTarget.value } })} /><TextInput label="Teléfono" value={provEd.p.telefono} onChange={(e) => setProvEd({ ...provEd, p: { ...provEd.p, telefono: e.currentTarget.value } })} /></div>
            <div className={formClasses.row2}><TextInput label="Correo" type="email" value={provEd.p.email} onChange={(e) => setProvEd({ ...provEd, p: { ...provEd.p, email: e.currentTarget.value } })} /><NumberInput label="Plazo de entrega (días)" min={0} value={provEd.p.plazoDias} onChange={(v) => setProvEd({ ...provEd, p: { ...provEd.p, plazoDias: Number(v) || 0 } })} /></div>
            <div className={formClasses.foot}><Button variant="default" onClick={() => setProvEd(null)}>Cancelar</Button><Button color="forja" onClick={guardarProv}>Guardar</Button></div>
          </div>
        )}
      </Modal>
    </>
  );
}
