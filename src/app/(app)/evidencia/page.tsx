'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ActionIcon, Button, Select, Text, Tooltip } from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconCamera, IconEye, IconEyeOff, IconFileTypePdf, IconTrash } from '@tabler/icons-react';
import { PageHead } from '@/components/PageHead';
import { EmptyState } from '@/components/EmptyState';
import { OtrPlate } from '@/components/primitives';
import { Evidencia } from '@/lib/evidencia';
import { evStore, otrStore } from '@/lib/data';
import { imprimirInforme } from '@/lib/informe';
import { toastUndo } from '@/lib/undo';
import classes from './evidencia.module.css';

const fmt = (iso: string) => new Date(iso).toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function EvidenciaPage() {
  const items = evStore.use().slice().sort((a, b) => b.fecha.localeCompare(a.fecha));
  const [otr, setOtr] = useState<string | null>('todas');
  const borrar = (e: Evidencia) => modals.openConfirmModal({ title: 'Eliminar evidencia', children: <Text size="sm">Se quitará de la galería y del enlace del cliente.</Text>, labels: { confirm: 'Eliminar', cancel: 'Cancelar' }, confirmProps: { color: 'red' }, onConfirm: () => { const snap = evStore.get(); evStore.remove(e.id); toastUndo('Evidencia eliminada', e.nota.slice(0, 40) || 'Foto', () => evStore.restore(snap)); } });
  const otrs = useMemo(() => [...new Set(items.map((e) => e.otr))], [items]);
  const rows = items.filter((e) => otr === 'todas' || String(e.otr) === otr);

  return (
    <>
      <PageHead
        title="Evidencia"
        sub={`${items.length} registros · ${items.filter((e) => e.visibleCliente).length} visibles al cliente`}
        right={
          <div className={classes.head}>
            <Select size="sm" w={170} allowDeselect={false} value={otr} onChange={setOtr} aria-label="Filtrar por OTR" data={[{ value: 'todas', label: 'Todas las OTR' }, ...otrs.map((n) => ({ value: String(n), label: `OTR ${n}` }))]} />
            <Button variant="default" size="sm" leftSection={<IconFileTypePdf size={16} />} disabled={otr === 'todas'} title={otr === 'todas' ? 'Elige una OTR para generar su informe' : 'Informe fotográfico de la OTR'} onClick={() => { const o = otrStore.get().find((x) => String(x.otr) === otr); if (o) imprimirInforme(o, rows.filter((e) => e.img || true)); }}>Informe PDF</Button>
            <Button component={Link} href="/evidencia/nueva" color="forja" size="sm" leftSection={<IconCamera size={16} />}>Nueva captura</Button>
          </div>
        }
      />
      <div className={classes.grid}>
        {rows.map((e, i) => (
          <article key={e.id} className={classes.card}>
            {e.img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={e.img} alt={e.nota || 'Evidencia'} className={classes.img} />
            ) : (
              <div className={classes.ph} data-i={i % 3} />
            )}
            <div className={classes.meta}>
              <div className={classes.row}><OtrPlate n={e.otr} />{e.etapa && <span className="cap">{e.etapa}</span>}
                <Tooltip label={e.visibleCliente ? 'Visible para el cliente (clic para ocultar)' : 'Solo interno (clic para mostrar)'}>
                  <button className={classes.vis} data-on={e.visibleCliente || undefined} aria-label="Cambiar visibilidad" onClick={() => evStore.update(e.id, { visibleCliente: !e.visibleCliente })}>
                    {e.visibleCliente ? <IconEye size={14} /> : <IconEyeOff size={14} />}
                  </button>
                </Tooltip>
                <ActionIcon variant="subtle" color="red" size={24} aria-label="Eliminar evidencia" onClick={() => borrar(e)}><IconTrash size={14} /></ActionIcon>
              </div>
              <p>{e.nota || 'Sin nota'}</p>
              <small>{e.autor} · {fmt(e.fecha)}</small>
            </div>
          </article>
        ))}
        {rows.length === 0 && <div style={{ gridColumn: '1 / -1' }}><EmptyState icon={<IconCamera size={32} stroke={1.4} />} title="Sin evidencia todavía" text="Las fotos con marcas respaldan cada etapa y se pueden compartir con el cliente." action={<Button component={Link} href="/evidencia/nueva" color="forja">Capturar la primera foto</Button>} /></div>}
      </div>
    </>
  );
}
