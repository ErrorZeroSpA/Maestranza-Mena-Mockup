'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Select, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowDown, IconArrowUp, IconDownload, IconPrinter, IconSearch } from '@tabler/icons-react';
import { PageHead } from '@/components/PageHead';
import { AREA_COLOR, Area } from '@/lib/mock';
import { cambioStore, clienteStore, cubStore, hhStore, matStore, ncStore, otrStore } from '@/lib/data';
import { build, descargarCSV, imprimirReporte, REPORTES, ReporteId } from '@/lib/reportes';
import classes from './reportes.module.css';

const ESTADO_TONO: Record<string, string> = { Crítico: 'crit', Crítica: 'crit', Abierta: 'crit', Alerta: 'warn', Mayor: 'warn', 'En análisis': 'warn', 'Al día': 'ok', Cerrada: 'ok', Menor: 'neutral' };

export default function ReportesPage() {
  return <Suspense fallback={null}><Inner /></Suspense>;
}

function Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const id = (REPORTES.find((r) => r.id === params.get('r'))?.id ?? 'avance') as ReporteId;
  const [area, setArea] = useState<string | null>('todas');
  const [cliente, setCliente] = useState<string | null>('todos');

  const otrs = otrStore.use(); const hh = hhStore.use(); const cub = cubStore.use(); const cambios = cambioStore.use();
  const mats = matStore.use(); const ncs = ncStore.use(); const clientes = clienteStore.use();
  const meta = REPORTES.find((r) => r.id === id)!;
  const rep = useMemo(() => build(id, { otrs, hh, cub, cambios, mats, ncs, clientes }, { area: area ?? 'todas', cliente: cliente ?? 'todos' }), [id, otrs, hh, cub, cambios, mats, ncs, clientes, area, cliente]);
  const max = Math.max(1, ...rep.bars.map((b) => b.value));
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<{ col: number; dir: 1 | -1 } | null>(null);
  const filas = useMemo(() => {
    let r = rep.rows.filter((row) => row.join(' ').toLowerCase().includes(q.toLowerCase()));
    if (sort) {
      const num = (v: string | number) => (typeof v === 'number' ? v : Number(String(v).replace(/[^0-9,-]/g, '').replace(',', '.')));
      r = [...r].sort((a, b) => {
        const x = a[sort.col], y = b[sort.col];
        const nx = num(x), ny = num(y);
        return (Number.isFinite(nx) && Number.isFinite(ny) && String(x).match(/\d/) ? nx - ny : String(x).localeCompare(String(y), 'es')) * sort.dir;
      });
    }
    return r;
  }, [rep.rows, q, sort]);
  const pick = (c: number) => setSort((s) => (s?.col === c ? (s.dir === 1 ? { col: c, dir: -1 } : null) : { col: c, dir: 1 }));

  return (
    <>
      <PageHead title="Reportes" sub="Indicadores de planta · exporta o imprime" />
      <div className={classes.layout}>
        <nav className={classes.menu} aria-label="Tipos de reporte">
          {REPORTES.map((r) => (
            <button key={r.id} data-on={r.id === id || undefined} onClick={() => router.replace(`/reportes?r=${r.id}`)}>
              <b>{r.nombre}</b><small>{r.corto}</small>
            </button>
          ))}
        </nav>

        <section className={classes.sheet}>
          <header className={classes.head}>
            <div><h2>{rep.titulo}</h2><p>{rep.desc}</p></div>
            <div className={classes.btns}>
              <Button variant="default" size="sm" leftSection={<IconDownload size={15} />} onClick={() => { descargarCSV(rep); notifications.show({ title: 'CSV descargado', message: rep.titulo, color: 'teal' }); }}>CSV</Button>
              <Button color="acero" size="sm" leftSection={<IconPrinter size={15} />} onClick={() => imprimirReporte(rep)}>Imprimir / PDF</Button>
            </div>
          </header>

          {meta.usaFiltros && (
            <div className={classes.filters}>
              <Select size="xs" label="Área" w={220} allowDeselect={false} value={area} onChange={setArea} data={[{ value: 'todas', label: 'Todas las áreas' }, ...(Object.keys(AREA_COLOR) as Area[]).map((a) => ({ value: a, label: a }))]} />
              <Select size="xs" label="Cliente" w={180} allowDeselect={false} value={cliente} onChange={setCliente} data={[{ value: 'todos', label: 'Todos' }, ...clientes.map((c) => ({ value: c.nombre, label: c.nombre }))]} />
            </div>
          )}

          <div className={classes.kpis}>
            {rep.kpis.map(([l, v]) => (<div key={l}><span className="cap">{l}</span><b className="num">{v}</b></div>))}
          </div>

          <div className={classes.chart}>
            <span className="cap">{rep.chartTitle}</span>
            {rep.bars.length === 0 && <p className={classes.none}>Sin datos para estos filtros.</p>}
            {rep.bars.map((b, i) => (
              <div key={`${b.label}-${i}`} className={classes.bar}>
                <span>{b.label}</span>
                <div className={classes.track}><i style={{ width: `${(b.value / max) * 100}%`, background: b.color ?? 'var(--mm-ink)' }} /></div>
                <b className="num">{b.text ?? b.value}</b>
              </div>
            ))}
          </div>

          <div className={classes.tableBar}>
            <TextInput size="xs" w={260} placeholder="Buscar en la tabla" aria-label="Buscar en la tabla" leftSection={<IconSearch size={14} />} value={q} onChange={(e) => { setQ(e.currentTarget.value); }} />
            <span className="cap">{filas.length} de {rep.rows.length} filas</span>
          </div>
          <div className={classes.tableWrap}>
            <table className={classes.table}>
              <thead>
                <tr>
                  {rep.columns.map((c, i) => (
                    <th key={c} data-r={rep.align?.[i] === 'r' || undefined} aria-sort={sort?.col === i ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
                      <button onClick={() => pick(i)}>{c}{sort?.col === i && (sort.dir === 1 ? <IconArrowUp size={11} /> : <IconArrowDown size={11} />)}</button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map((row, i) => (
                  <tr key={i}>
                    {row.map((c, j) => {
                      const col = rep.columns[j];
                      const tone = ESTADO_TONO[String(c)];
                      return (
                        <td key={j} data-r={rep.align?.[j] === 'r' || undefined} className={j === 0 && typeof c === 'number' ? 'mono' : undefined}>
                          {tone && ['Plazo', 'Estado', 'Severidad'].includes(col) ? <span className={classes.chip} data-tone={tone}>{c}</span> : c}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {filas.length === 0 && <tr><td colSpan={rep.columns.length} className={classes.none}>Sin filas.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
