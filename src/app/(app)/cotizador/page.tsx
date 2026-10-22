'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ActionIcon, Badge, Button, Drawer, Menu, NumberInput, Select, Text, TextInput } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconCalculator, IconCopy, IconDotsVertical, IconFileInvoice, IconPlus, IconPrinter, IconRocket, IconTrash } from '@tabler/icons-react';
import { PageHead } from '@/components/PageHead';
import { EmptyState } from '@/components/EmptyState';
import { RowsSkeleton } from '@/components/Skeletons';
import { CLP, CotLinea, Cotizacion, EstadoCot, RUTA } from '@/lib/mock';
import { cfg, useConfig, clienteStore, cotStore, cubStore, HOY, logEvent, otrStore, semaforo, uid } from '@/lib/data';
import { imprimirCotizacion, totales } from '@/lib/cotizar';
import { usePerm } from '@/lib/roles';
import { useReady } from '@/lib/ready';
import { toastUndo } from '@/lib/undo';
import classes from './cotizador.module.css';

const ESTADOS: EstadoCot[] = ['Borrador', 'Enviada', 'Aprobada', 'Rechazada'];
const TONO: Record<EstadoCot, string> = { Borrador: 'gray', Enviada: 'blue', Aprobada: 'teal', Rechazada: 'red' };
const nueva = (n: number, clienteId: string): Cotizacion => ({ id: uid('k'), numero: `COT-2026-${n}`, clienteId, titulo: '', estado: 'Borrador', fecha: HOY, plazoDias: 30, lineas: [], horas: 40, tarifa: cfg().tarifaHH, indirectos: 10, margen: cfg().margenObjetivo });

export default function CotizadorPage() {
  const can = usePerm();
  const conf = useConfig();
  const ready = useReady(380);
  const cots = cotStore.use();
  const clientes = clienteStore.use();
  const otrs = otrStore.use();
  const [ed, setEd] = useState<Cotizacion | null>(null);
  const [nuevaL, setNuevaL] = useState({ descripcion: '', cant: 1 as number | string, costo: 0 as number | string });
  const edita = can('cotiza.edit');
  const cli = (id: string) => clientes.find((c) => c.id === id);

  const kpi = useMemo(() => {
    const v = (e: EstadoCot) => cots.filter((c) => c.estado === e).reduce((a, c) => a + totales(c).venta, 0);
    const cerradas = cots.filter((c) => c.estado === 'Aprobada' || c.estado === 'Rechazada').length;
    return { env: v('Enviada'), apr: v('Aprobada'), tasa: cerradas ? Math.round((cots.filter((c) => c.estado === 'Aprobada').length / cerradas) * 100) : 0, borr: cots.filter((c) => c.estado === 'Borrador').length };
  }, [cots]);

  const guardar = () => {
    if (!ed) return;
    if (!ed.titulo.trim() || !ed.clienteId) return notifications.show({ message: 'Indica cliente y título.', color: 'orange' });
    const existe = cotStore.get().some((c) => c.id === ed.id);
    if (existe) cotStore.update(ed.id, ed); else { cotStore.add(ed); logEvent(`Cotización ${ed.numero} creada`, 'cliente'); }
    notifications.show({ title: 'Cotización guardada', message: `${ed.numero} · ${CLP(totales(ed).venta)}`, color: 'teal' });
    setEd(null);
  };
  const duplicar = (c: Cotizacion) => { const n = cots.length + 118; cotStore.add({ ...c, id: uid('k'), numero: `COT-2026-${n}`, estado: 'Borrador', fecha: HOY, otrId: undefined, lineas: c.lineas.map((l) => ({ ...l, id: uid('kl') })) }); notifications.show({ message: 'Cotización duplicada como borrador.', color: 'teal' }); };
  const borrar = (c: Cotizacion) => modals.openConfirmModal({ title: 'Eliminar cotización', children: <Text size="sm">Se eliminará {c.numero}.</Text>, labels: { confirm: 'Eliminar', cancel: 'Cancelar' }, confirmProps: { color: 'red' }, onConfirm: () => { const snap = cotStore.get(); cotStore.remove(c.id); toastUndo('Cotización eliminada', c.numero, () => cotStore.restore(snap)); } });

  /** Cotización aprobada → OTR con su cubicación inicial, venta y horas/materiales estimados. */
  const aOtr = (c: Cotizacion) => {
    const t = totales(c);
    const numero = Math.max(...otrs.map((o) => o.otr), 4500) + 1;
    const dias = c.plazoDias;
    const fin = new Date(new Date(HOY + 'T12:00:00Z').getTime() + dias * 86400000).toISOString().slice(0, 10);
    const id = uid('o');
    otrStore.add({ id, otr: numero, titulo: c.titulo.toUpperCase(), cliente: (cli(c.clienteId)?.nombre ?? 'CLIENTE').toUpperCase(), area: 'Fabricación y Estructuras', hito: RUTA[0], etapa: 'ingreso', avance: 0, iq: 100, plazoDias: dias, entrega: fin.split('-').reverse().join('-'), pendientes: ['Packing List', 'Carta Gantt'], semaforo: semaforo({ avance: 0, plazoDias: dias }), inicio: HOY, fin, venta: t.venta, hhEst: c.horas, matEst: t.mat, cubPaso: 0 });
    c.lineas.forEach((l) => cubStore.add({ id: uid('l'), otrId: id, codigo: '', descripcion: l.descripcion, cant: l.cant, categoria: 'Otro', costo: l.costo }));
    cotStore.update(c.id, { otrId: id });
    logEvent(`Cotización ${c.numero} aprobada → OTR ${numero}`, 'otr', id);
    notifications.show({ title: 'OTR creada desde la cotización', message: `OTR ${numero} · ${CLP(t.venta)}. Revísala en Seguimiento.`, color: 'teal' });
  };

  const t = ed ? totales(ed) : null;
  const setL = (id: string, patch: Partial<CotLinea>) => ed && setEd({ ...ed, lineas: ed.lineas.map((l) => (l.id === id ? { ...l, ...patch } : l)) });

  return (
    <>
      <PageHead title="Cotizador" sub={`${cots.length} cotizaciones · de la cotización a la OTR`} right={edita ? <Button color="forja" leftSection={<IconPlus size={16} />} onClick={() => setEd(nueva(cots.length + 118, clientes[0]?.id ?? ''))}>Nueva cotización</Button> : undefined} />
      <div className={classes.kpis}>
        <div><span className="cap">Por responder</span><b className="num">{CLP(kpi.env)}</b></div>
        <div><span className="cap">Aprobado</span><b className="num">{CLP(kpi.apr)}</b></div>
        <div><span className="cap">Tasa de aprobación</span><b className="num">{kpi.tasa}%</b></div>
        <div><span className="cap">Borradores</span><b className="num">{kpi.borr}</b></div>
      </div>

      {!ready ? <RowsSkeleton rows={5} cols={5} /> : cots.length === 0 ? (
        <EmptyState icon={<IconFileInvoice size={32} stroke={1.4} />} title="Aún no hay cotizaciones" text="Cotiza con materiales, horas y margen. Cuando el cliente aprueba, se convierte en OTR con un clic." action={edita ? <Button color="forja" onClick={() => setEd(nueva(118, clientes[0]?.id ?? ''))}>Crear la primera cotización</Button> : undefined} />
      ) : (
        <div className={classes.table}>
          <div className={classes.th}><span>N°</span><span>Trabajo</span><span>Estado</span><span>Venta neta</span><span>Margen</span><span /></div>
          {cots.map((c) => {
            const tt = totales(c);
            return (
              <div key={c.id} className={classes.row}>
                <span className="mono num">{c.numero}</span>
                <button className={classes.name} onClick={() => edita && setEd(c)} disabled={!edita}>
                  <b>{c.titulo}</b><small>{cli(c.clienteId)?.nombre ?? '—'} · {c.fecha.split('-').reverse().join('-')} · {c.plazoDias} d</small>
                </button>
                <span><Badge color={TONO[c.estado]} variant="light" radius="xs">{c.estado}</Badge>{c.otrId && <Link className={classes.otr} href={`/seguimiento?otr=${c.otrId}`}>OTR →</Link>}</span>
                <span className="num">{CLP(tt.venta)}</span>
                <span className="num">{c.margen}%</span>
                <Menu position="bottom-end" withinPortal>
                  <Menu.Target><ActionIcon variant="subtle" color="gray" aria-label={`Acciones de ${c.numero}`}><IconDotsVertical size={16} /></ActionIcon></Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item leftSection={<IconPrinter size={14} />} onClick={() => imprimirCotizacion(c, cli(c.clienteId))}>Imprimir / PDF</Menu.Item>
                    {edita && <Menu.Item leftSection={<IconCopy size={14} />} onClick={() => duplicar(c)}>Duplicar</Menu.Item>}
                    {edita && c.estado === 'Aprobada' && !c.otrId && <Menu.Item leftSection={<IconRocket size={14} />} onClick={() => aOtr(c)}>Convertir en OTR</Menu.Item>}
                    {edita && <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => borrar(c)}>Eliminar</Menu.Item>}
                  </Menu.Dropdown>
                </Menu>
              </div>
            );
          })}
        </div>
      )}

      <Drawer opened={!!ed} onClose={() => setEd(null)} position="right" size="min(980px, 100vw)" padding="xl" title={<b style={{ fontSize: 18 }}>{ed?.numero}</b>}>
        {ed && t && (
          <div className={classes.editor}>
            <div className={classes.form}>
              <div className={classes.row2}>
                <Select label="Cliente" searchable allowDeselect={false} value={ed.clienteId} onChange={(v) => v && setEd({ ...ed, clienteId: v })} data={clientes.map((c) => ({ value: c.id, label: c.nombre }))} />
                <Select label="Estado" allowDeselect={false} value={ed.estado} onChange={(v) => v && setEd({ ...ed, estado: v as EstadoCot })} data={ESTADOS} />
              </div>
              <TextInput label="Trabajo" required value={ed.titulo} onChange={(e) => setEd({ ...ed, titulo: e.currentTarget.value })} />

              <div>
                <div className={classes.sec}><b>Materiales y servicios</b><Link href="/calculadora" className={classes.calc}><IconCalculator size={14} /> Calcular kg de acero</Link></div>
                <table className={classes.lines}>
                  <thead><tr><th>Descripción</th><th>Cant.</th><th>Costo unit.</th><th>Subtotal</th><th /></tr></thead>
                  <tbody>
                    {ed.lineas.map((l) => (
                      <tr key={l.id}>
                        <td><TextInput size="xs" aria-label="Descripción" value={l.descripcion} onChange={(e) => setL(l.id, { descripcion: e.currentTarget.value })} /></td>
                        <td><NumberInput size="xs" w={70} min={1} aria-label="Cantidad" value={l.cant} onChange={(v) => setL(l.id, { cant: Number(v) || 1 })} /></td>
                        <td><NumberInput size="xs" w={120} min={0} hideControls prefix="$" thousandSeparator="." decimalSeparator="," aria-label="Costo unitario" value={l.costo} onChange={(v) => setL(l.id, { costo: Number(v) || 0 })} /></td>
                        <td className="num">{CLP(l.cant * l.costo)}</td>
                        <td><ActionIcon variant="subtle" color="red" size="sm" aria-label="Quitar línea" onClick={() => setEd({ ...ed, lineas: ed.lineas.filter((x) => x.id !== l.id) })}><IconTrash size={14} /></ActionIcon></td>
                      </tr>
                    ))}
                    {ed.lineas.length === 0 && <tr><td colSpan={5} className={classes.none}>Sin líneas todavía.</td></tr>}
                  </tbody>
                </table>
                <div className={classes.addL}>
                  <TextInput size="xs" placeholder="Descripción de la línea" aria-label="Nueva línea" value={nuevaL.descripcion} onChange={(e) => setNuevaL({ ...nuevaL, descripcion: e.currentTarget.value })} />
                  <NumberInput size="xs" w={70} min={1} aria-label="Cantidad nueva" value={nuevaL.cant} onChange={(v) => setNuevaL({ ...nuevaL, cant: v })} />
                  <NumberInput size="xs" w={120} min={0} hideControls prefix="$" thousandSeparator="." decimalSeparator="," aria-label="Costo nuevo" value={nuevaL.costo} onChange={(v) => setNuevaL({ ...nuevaL, costo: v })} />
                  <Button size="xs" variant="default" leftSection={<IconPlus size={14} />} onClick={() => { if (!nuevaL.descripcion.trim()) return; setEd({ ...ed, lineas: [...ed.lineas, { id: uid('kl'), descripcion: nuevaL.descripcion.trim(), cant: Number(nuevaL.cant) || 1, costo: Number(nuevaL.costo) || 0 }] }); setNuevaL({ descripcion: '', cant: 1, costo: 0 }); }}>Agregar</Button>
                </div>
              </div>

              <div className={classes.grid4}>
                <NumberInput label="Horas hombre" min={0} value={ed.horas} onChange={(v) => setEd({ ...ed, horas: Number(v) || 0 })} />
                <NumberInput label="$ por hora" min={0} thousandSeparator="." decimalSeparator="," value={ed.tarifa} onChange={(v) => setEd({ ...ed, tarifa: Number(v) || 0 })} />
                <NumberInput label="Indirectos %" min={0} max={60} value={ed.indirectos} onChange={(v) => setEd({ ...ed, indirectos: Number(v) || 0 })} />
                <NumberInput label="Margen %" min={0} max={80} value={ed.margen} onChange={(v) => setEd({ ...ed, margen: Number(v) || 0 })} />
              </div>
              <NumberInput label="Plazo de entrega (días)" min={1} w={200} value={ed.plazoDias} onChange={(v) => setEd({ ...ed, plazoDias: Number(v) || 1 })} />
            </div>

            <aside className={classes.sum}>
              <span className="cap">Precio de venta (neto)</span>
              <b className="num">{CLP(t.venta)}</b>
              <dl>
                <div><dt>Materiales</dt><dd className="num">{CLP(t.mat)}</dd></div>
                <div><dt>Mano de obra</dt><dd className="num">{CLP(t.mo)}</dd></div>
                <div><dt>Indirectos ({ed.indirectos}%)</dt><dd className="num">{CLP(Math.round(t.indir))}</dd></div>
                <div><dt>Costo total</dt><dd className="num">{CLP(Math.round(t.costo))}</dd></div>
                <div className={classes.util}><dt>Utilidad ({ed.margen}%)</dt><dd className="num">{CLP(t.utilidad)}</dd></div>
                <div><dt>Total con IVA ({conf.iva}%)</dt><dd className="num">{CLP(Math.round(t.venta * (1 + conf.iva / 100)))}</dd></div>
              </dl>
              <Button color="forja" onClick={guardar}>Guardar cotización</Button>
              <Button variant="default" leftSection={<IconPrinter size={15} />} onClick={() => imprimirCotizacion(ed, cli(ed.clienteId))}>Vista del cliente (PDF)</Button>
            </aside>
          </div>
        )}
      </Drawer>
    </>
  );
}
