'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ActionIcon, Badge, Button, Drawer, NumberInput, Select, Stepper, Table, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowRight, IconCheck, IconPlus, IconTrash } from '@tabler/icons-react';
import { CLP, Otr } from '@/lib/mock';
import { cubStore, logEvent, matStore, otrStore, uid } from '@/lib/data';
import { comprometido } from '@/lib/stock';
import { OtrPlate } from './primitives';
import { usePerm } from '@/lib/roles';

const STEPS = ['Creación (OT)', 'Costeo (Adq)', 'Aprobación (Com. / Ger.)', 'Consumo (Bod)'];
const NEXT = ['Enviar a costeo', 'Enviar a aprobación', 'Aprobar cubicación', 'Cubicación cerrada'];
const CATEGORIAS = ['Plancha', 'Perfil', 'Pernería', 'Consumible', 'Hidráulica', 'Otro'];

export function CubicacionModal({ otr, onClose }: { otr: Otr | null; onClose: () => void }) {
  const can = usePerm();
  const all = cubStore.use();
  const live = otrStore.use().find((o) => o.id === otr?.id) ?? otr;
  const lines = all.filter((l) => l.otrId === live?.id);
  const paso = live?.cubPaso ?? 0;
  const otrsAll = otrStore.use();
  const cubAll = cubStore.use();
  const total = lines.reduce((a, l) => a + l.cant * l.costo, 0);
  const editable = paso < 2 && can('cub.edit');
  const costeable = paso === 1 && can('cub.cost');
  const puedeAvanzar = paso === 0 ? can('cub.edit') : paso === 1 ? can('cub.cost') : paso === 2 ? can('cub.approve') : false;
  const mats = matStore.use();
  const [d, setD] = useState({ matId: null as string | null, codigo: '', descripcion: '', cant: 1 as number | string, categoria: 'Plancha', costo: 0 as number | string });

  const add = () => {
    if (!live || !d.descripcion.trim()) return;
    cubStore.add({ id: uid('l'), otrId: live.id, matId: d.matId ?? undefined, codigo: d.codigo, descripcion: d.descripcion.trim(), cant: Number(d.cant) || 1, categoria: d.categoria, costo: Number(d.costo) || 0 });
    setD({ ...d, matId: null, codigo: '', descripcion: '', cant: 1, costo: 0 });
  };
  const consumir = () => {
    if (!live) return;
    let faltan = 0;
    lines.forEach((l) => {
      const m = l.matId ? matStore.get().find((x) => x.id === l.matId) : undefined;
      if (!m) return;
      const sale = Math.min(m.stock, l.cant);
      faltan += l.cant - sale;
      matStore.update(m.id, { stock: m.stock - sale });
    });
    otrStore.update(live.id, { cubConsumida: true });
    logEvent(`Consumo de materiales registrado en bodega${faltan ? ` (${faltan} un sin stock)` : ''}`, 'stock', live.id);
    notifications.show({ title: 'Consumo registrado', message: faltan ? `Se descontó el stock disponible; faltaron ${faltan} unidades. Ver Compras.` : 'Stock de bodega actualizado.', color: faltan ? 'orange' : 'teal' });
  };
  const avanzar = () => {
    if (!live) return;
    if (paso === 0 && lines.length === 0) return notifications.show({ title: 'Faltan ítems', message: 'Agrega al menos un material antes de enviar a costeo.', color: 'orange' });
    otrStore.update(live.id, { cubPaso: Math.min(3, paso + 1) });
    logEvent(`Cubicación: ${NEXT[paso].toLowerCase()} (${CLP(total)})`, 'otr', live.id);
    notifications.show({ title: paso === 2 ? 'Cubicación aprobada' : 'Cubicación actualizada', message: STEPS[Math.min(3, paso + 1)], color: 'teal' });
  };

  return (
    <Drawer
      opened={!!otr}
      onClose={onClose}
      position="right"
      size="min(900px, 100vw)"
      padding="xl"
      transitionProps={{ transition: 'slide-left', duration: 220 }}
      title={
        <div>
          <Text fw={700} size="lg" style={{ letterSpacing: '-0.01em' }}>Cubicación de materiales</Text>
          {live && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <OtrPlate n={live.otr} />
              <Text size="sm" c="dimmed">{live.titulo}</Text>
            </div>
          )}
        </div>
      }
    >
      <Stepper active={paso} size="xs" color="forja" mb="lg">
        {STEPS.map((s) => <Stepper.Step key={s} label={s} />)}
      </Stepper>

      <div style={{ border: '1px solid var(--mm-line-strong)', overflow: 'hidden' }}>
        <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover>
          <Table.Thead style={{ background: 'var(--mm-sunken)' }}>
            <Table.Tr>
              {['Código', 'Descripción', 'Cant.', 'Categoría', 'Costo unit.', 'Subtotal'].map((h) => (
                <Table.Th key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mm-ink-3)', fontWeight: 500 }}>{h}</Table.Th>
              ))}
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {lines.length === 0 && (
              <Table.Tr><Table.Td colSpan={7} ta="center" py={28}><Text size="sm" c="dimmed">Sin ítems todavía. Agrega el primero abajo.</Text></Table.Td></Table.Tr>
            )}
            {lines.map((l) => (
              <Table.Tr key={l.id}>
                <Table.Td ff="monospace" fz={12}>{l.codigo || '—'}</Table.Td>
                <Table.Td>{l.descripcion}{l.matId && (() => { const m = mats.find((x) => x.id === l.matId); if (!m) return null; const falta = comprometido(m.id, cubAll, otrsAll) - m.stock; return <Text size="xs" c={falta > 0 ? 'red' : 'dimmed'} fw={falta > 0 ? 700 : 400}>{falta > 0 ? `Faltan ${falta} en bodega` : `En bodega: ${m.stock}`}</Text>; })()}</Table.Td>
                <Table.Td className="num">{l.cant}</Table.Td>
                <Table.Td>{l.categoria}</Table.Td>
                <Table.Td className="num">
                  {costeable
                    ? <NumberInput size="xs" w={110} hideControls prefix="$" thousandSeparator="." decimalSeparator="," value={l.costo} onChange={(v) => cubStore.update(l.id, { costo: Number(v) || 0 })} aria-label="Costo unitario" />
                    : CLP(l.costo)}
                </Table.Td>
                <Table.Td className="num" fw={600}>{CLP(l.cant * l.costo)}</Table.Td>
                <Table.Td>
                  {editable && <ActionIcon variant="subtle" color="red" aria-label="Quitar ítem" onClick={() => cubStore.remove(l.id)}><IconTrash size={16} /></ActionIcon>}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline', gap: 12, padding: '12px 16px', background: 'var(--mm-sunken)', borderTop: '1px solid var(--mm-line)' }}>
          <Text size="xs" fw={600} c="dimmed" style={{ letterSpacing: '0.08em' }}>TOTAL ESTIMADO</Text>
          <Text fw={800} fz={24} className="num">{CLP(total)}</Text>
        </div>
      </div>

      {editable && (
        <Select mt="md" size="sm" searchable clearable label="Tomar de inventario (opcional)" placeholder="Busca un material de bodega para completar la línea" value={d.matId}
          onChange={(v) => { const m = mats.find((x) => x.id === v); setD(m ? { ...d, matId: v, codigo: m.tipo.slice(0, 4) + '-' + m.id.toUpperCase(), descripcion: m.descripcion, costo: m.precio, categoria: /PLANCHA/.test(m.tipo) ? 'Plancha' : /ANGULO|ÁNGULO|CANAL|PERFIL/.test(m.tipo) ? 'Perfil' : 'Otro' } : { ...d, matId: null }); }}
          data={mats.map((m) => ({ value: m.id, label: `${m.descripcion} · stock ${m.stock}` }))} />
      )}
      {editable && (
        <div style={{ display: 'grid', gridTemplateColumns: '110px minmax(160px, 1.6fr) 80px 140px 140px auto', gap: 10, marginTop: 16, alignItems: 'end' }}>
          <TextInput label="Código" size="sm" value={d.codigo} onChange={(e) => setD({ ...d, codigo: e.target.value })} />
          <TextInput label="Descripción" size="sm" value={d.descripcion} onChange={(e) => setD({ ...d, descripcion: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && add()} />
          <NumberInput label="Cant." size="sm" min={1} value={d.cant} onChange={(v) => setD({ ...d, cant: v })} />
          <Select label="Categoría" size="sm" data={CATEGORIAS} value={d.categoria} onChange={(v) => setD({ ...d, categoria: v ?? 'Otro' })} allowDeselect={false} />
          <NumberInput label="Costo unit." size="sm" min={0} prefix="$" thousandSeparator="." decimalSeparator="," value={d.costo} onChange={(v) => setD({ ...d, costo: v })} />
          <Button leftSection={<IconPlus size={16} />} color="forja" onClick={add}>Añadir</Button>
        </div>
      )}
      {editable && live && <Text size="sm" mt="sm"><Link href={`/calculadora?otr=${live.id}`} style={{ color: 'inherit', fontWeight: 700 }}>¿Cuántos kg son? Calcular con la calculadora de acero →</Link></Text>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--mm-line)' }}>
        <Text size="sm" c="dimmed">Etapa actual: <b style={{ color: 'var(--mm-ink)' }}>{STEPS[paso]}</b></Text>
        {paso < 3
          ? <Button color="acero" rightSection={<IconArrowRight size={16} />} onClick={avanzar} disabled={!puedeAvanzar} title={puedeAvanzar ? undefined : 'Este paso lo hace otro rol'}>{NEXT[paso]}</Button>
          : live?.cubConsumida
            ? <Badge color="teal" size="lg" leftSection={<IconCheck size={14} />}>Consumo registrado</Badge>
            : <Button color="forja" disabled={!can('stock.edit')} title={can('stock.edit') ? undefined : 'Lo registra Bodega'} onClick={consumir}>Registrar consumo en bodega</Button>}
      </div>
    </Drawer>
  );
}
