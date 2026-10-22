'use client';

import { useMemo, useState } from 'react';
import { Button, SegmentedControl, TextInput } from '@mantine/core';
import { IconDownload, IconSearch } from '@tabler/icons-react';
import { auditStore, relFecha } from '@/lib/data';
import { EmptyState } from '@/components/EmptyState';
import classes from './configuracion.module.css';

const TIPOS = [['todos', 'Todo'], ['usuario', 'Usuarios'], ['rol', 'Roles'], ['config', 'Parámetros'], ['acceso', 'Accesos']] as const;

export function Auditoria() {
  const log = auditStore.use();
  const [tipo, setTipo] = useState<string>('todos');
  const [q, setQ] = useState('');
  const filas = useMemo(() => log.filter((a) => (tipo === 'todos' || a.tipo === tipo) && `${a.actor} ${a.accion} ${a.detalle}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.fecha.localeCompare(a.fecha)), [log, tipo, q]);
  const exportar = () => {
    const csv = ['Fecha;Actor;Tipo;Acción;Detalle', ...filas.map((a) => [a.fecha, a.actor, a.tipo, a.accion, a.detalle].map((v) => `"${v.replace(/"/g, '""')}"`).join(';'))].join('\r\n');
    const l = document.createElement('a'); l.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })); l.download = 'auditoria.csv'; l.click(); URL.revokeObjectURL(l.href);
  };
  return (
    <div className={classes.stack}>
      <header className={classes.head}><div><h2>Auditoría</h2><p>Quién cambió usuarios, roles y parámetros, y cuándo. Útil para ISO 9001 y para revisar permisos.</p></div></header>
      <div className={classes.tools}>
        <SegmentedControl size="xs" value={tipo} onChange={setTipo} data={TIPOS.map(([v, l]) => ({ value: v, label: l }))} />
        <TextInput size="xs" w={240} placeholder="Buscar persona o acción" aria-label="Buscar en auditoría" leftSection={<IconSearch size={14} />} value={q} onChange={(e) => setQ(e.currentTarget.value)} />
        <Button size="xs" variant="default" leftSection={<IconDownload size={14} />} onClick={exportar} ml="auto">Exportar CSV</Button>
      </div>
      {filas.length === 0 ? <EmptyState icon={<IconSearch size={30} stroke={1.4} />} title="Sin registros" text="Ningún evento coincide con este filtro." /> : (
        <ul className={classes.audit}>
          {filas.map((a) => (
            <li key={a.id} data-t={a.tipo}>
              <span className={classes.tag}>{a.tipo}</span>
              <span className={classes.atext}><b>{a.accion}</b><small>{a.detalle}</small></span>
              <span className={classes.who}>{a.actor}<small className="mono">{relFecha(a.fecha)}</small></span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
