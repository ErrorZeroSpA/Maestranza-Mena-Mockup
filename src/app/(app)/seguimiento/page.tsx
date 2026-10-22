'use client';

import { Suspense, useMemo, useState } from 'react';
import { ActionIcon, Button, Checkbox, Drawer, Select, SegmentedControl, Tabs, TextInput, Timeline, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconSearch, IconPackage, IconClockHour4, IconArrowsExchange, IconReportMoney, IconAlertTriangle, IconCamera, IconShare3, IconPencil, IconTrash, IconDownload, IconQrcode, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import Link from 'next/link';
import { PageHead } from '@/components/PageHead';
import { toastUndo } from '@/lib/undo';
import { ETAPAS, Etapa } from '@/lib/mock';
import { modals } from '@mantine/modals';
import { logEvent } from '@/lib/data';
import { AreaTag, Dots, OtrPlate, RouteRibbon, SegBar } from '@/components/primitives';
import { CubicacionModal } from '@/components/CubicacionModal';
import { ShareModal } from '@/components/ShareModal';
import { AREA_COLOR, estacion, Otr } from '@/lib/mock';
import { cubStore, evStore, logStore, otrStore, relFecha } from '@/lib/data';
import { CambioModal, HHModal, PLModal } from '@/components/OtrDialogs';
import { CLP } from '@/lib/mock';
import { useSearchParams } from 'next/navigation';
import { openOtrForm } from '@/lib/ui';
import { confirmDeleteOtr } from '@/components/otrActions';
import { imprimirInforme } from '@/lib/informe';
import { imprimirHojaRuta } from '@/lib/traveler';
import { usePerm } from '@/lib/roles';
import { CalidadTab } from '@/components/CalidadTab';
import { useReady } from '@/lib/ready';
import { EmptyState } from '@/components/EmptyState';
import { PanelSkeleton, RowsSkeleton } from '@/components/Skeletons';
import { linkAvance } from '@/lib/share';
import classes from './seguimiento.module.css';

const tone = (o: Otr) => o.semaforo[1];
const CHIPS = {
  todas: { label: 'Todas', tone: 'neutral', test: () => true },
  criticas: { label: 'Críticas', tone: 'crit', test: (o: Otr) => o.semaforo[1] === 'crit' },
  vencer: { label: 'Entrega ≤ 30 d', tone: 'warn', test: (o: Otr) => o.plazoDias <= 30 },
  pend: { label: 'Con pendientes', tone: 'neutral', test: (o: Otr) => o.pendientes.length > 0 },
} as const;

function Detalle({ o, onCubicar, onShare, flat }: { o: Otr; onCubicar: (o: Otr) => void; onShare: (o: Otr) => void; flat?: boolean }) {
  const can = usePerm();
  const [dlg, setDlg] = useState<'hh' | 'cambio' | 'pl' | null>(null);
  const lineas = cubStore.use().filter((l) => l.otrId === o.id);
  const fotos = evStore.use().filter((e) => e.otr === o.otr);
  const bitacora = logStore.use().filter((e) => e.otrId === o.id).sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 8);
  const close = () => setDlg(null);
  return (
    <aside className={classes.detail} data-flat={flat || undefined}>
      <header className={classes.dHead}>
        <div className={classes.dTop}>
          <OtrPlate n={o.otr} size="lg" />
          {can('otr.edit') && (
            <span className={classes.dIcons}>
              <ActionIcon variant="default" size={32} aria-label="Editar OTR" onClick={() => openOtrForm(o)}><IconPencil size={16} /></ActionIcon>
              <ActionIcon variant="default" size={32} color="red" aria-label="Eliminar OTR" onClick={() => confirmDeleteOtr(o)}><IconTrash size={16} /></ActionIcon>
            </span>
          )}
        </div>
        <h2>{o.titulo}</h2>
        <div className={classes.dSub}><AreaTag area={o.area} /><Dots values={o.semaforo} /></div>
      </header>

      <dl className={classes.block}>
        <div><dt>Cliente</dt><dd>{o.cliente}</dd></div>
        <div><dt>Hito actual</dt><dd>{o.hito}</dd></div>
        <div><dt>Entrega</dt><dd className="num">{o.entrega}</dd></div>
        <div><dt>Plazo</dt><dd className="num">{o.plazoDias} d</dd></div>
        <div><dt>Avance</dt><dd className="num">{o.avance}%</dd></div>
        <div><dt>IQ</dt><dd className="num">{o.iq.toFixed(1)}%</dd></div>
      </dl>

      <section className={classes.sec}>
        <span className="cap">Ruta de producción</span>
        <RouteRibbon current={estacion(o)} />
      </section>

      {o.comercial && <p className={classes.note}><b>Comercial</b>{o.comercial}</p>}

      <div className={classes.dActions}>
        <Button size="xs" color="acero" leftSection={<IconPackage size={14} />} onClick={() => onCubicar(o)}>Cubicación</Button>
        <Button size="xs" variant="default" leftSection={<IconClockHour4 size={14} />} onClick={() => setDlg('hh')}>HH</Button>
        <Button size="xs" variant="default" leftSection={<IconArrowsExchange size={14} />} onClick={() => setDlg('cambio')}>Cambio</Button>
        {can('pl.view') && <Button size="xs" variant="default" leftSection={<IconReportMoney size={14} />} onClick={() => setDlg('pl')}>P&amp;L</Button>}
        <Button size="xs" variant="default" leftSection={<IconQrcode size={14} />} onClick={() => imprimirHojaRuta(o, linkAvance(o.otr), lineas)}>Hoja de ruta (QR)</Button>
        {can('share') && <Button size="xs" color="forja" leftSection={<IconShare3 size={14} />} onClick={() => onShare(o)}>Compartir con cliente</Button>}
      </div>

      <Tabs defaultValue="mat" variant="unstyled" classNames={{ list: classes.tabList, tab: classes.tab, panel: classes.panel }}>
        <Tabs.List>
          <Tabs.Tab value="mat">Materiales</Tabs.Tab>
          <Tabs.Tab value="ev">Evidencia <em>{fotos.length}</em></Tabs.Tab>
          <Tabs.Tab value="cal">Calidad</Tabs.Tab>
          <Tabs.Tab value="bit">Bitácora</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="mat">
          <table className={classes.mat}>
            <tbody>
              {lineas.slice(0, 5).map((l) => (
                <tr key={l.id}><td className="mono">{l.codigo || '—'}</td><td>{l.descripcion}</td><td className="num">{l.cant} un</td><td className="num">{CLP(l.cant * l.costo)}</td></tr>
              ))}
              {lineas.length === 0 && <tr><td colSpan={4} style={{ color: 'var(--mm-ink-3)' }}>Aún no se han cubicado materiales.</td></tr>}
            </tbody>
          </table>
          <div className={classes.evActions}>
            <button className={classes.link} onClick={() => onCubicar(o)}>{lineas.length ? 'Abrir cubicación completa →' : 'Crear la cubicación →'}</button>
            {!lineas.length && <Link href={`/calculadora?otr=${o.id}`} className={classes.link}>Calcular kg de acero</Link>}
          </div>
        </Tabs.Panel>
        <Tabs.Panel value="ev">
          <div className={classes.photos}>
            {fotos.map((f, i) => (
              <figure key={f.id}>
                {f.img ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={f.img} alt={f.nota} className={classes.ph} style={{ objectFit: 'cover', width: '100%' }} /> : <div className={classes.ph} data-i={i % 3} />}
                <figcaption>{f.etapa || f.nota.slice(0, 24)}</figcaption>
              </figure>
            ))}
            {fotos.length === 0 && <p style={{ gridColumn: '1 / -1', color: 'var(--mm-ink-3)', fontSize: 13, margin: 0 }}>Todavía no hay fotos de esta orden. La primera deja constancia del estado de ingreso.</p>}
          </div>
          <div className={classes.evActions}><Button component={Link} href="/evidencia/nueva" size="xs" color="forja" leftSection={<IconCamera size={14} />}>Capturar foto</Button><button className={classes.link} onClick={() => imprimirInforme(o, fotos)}>Informe fotográfico (PDF)</button></div>
        </Tabs.Panel>
        <Tabs.Panel value="cal"><CalidadTab o={o} /></Tabs.Panel>
        <Tabs.Panel value="bit">
          <ul className={classes.log}>
            {bitacora.map((e) => <li key={e.id}><span className="mono">{relFecha(e.fecha)}</span>{e.texto}</li>)}
            {bitacora.length === 0 && <li style={{ gridTemplateColumns: '1fr', color: 'var(--mm-ink-3)' }}>Sin movimientos registrados.</li>}
          </ul>
        </Tabs.Panel>
      </Tabs>
      {dlg === 'hh' && <HHModal otr={o} onClose={close} />}
      {dlg === 'cambio' && <CambioModal otr={o} onClose={close} />}
      {dlg === 'pl' && <PLModal otr={o} onClose={close} />}
    </aside>
  );
}

function Listado({ onCubicar, onShare }: { onCubicar: (o: Otr) => void; onShare: (o: Otr) => void }) {
  const OTRS = otrStore.use();
  const compact = useMediaQuery('(max-width: 80em)');
  const ready = useReady();
  const can = usePerm();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [orden, setOrden] = useState<string | null>('entrega');
  const [chip, setChip] = useState<'todas' | 'criticas' | 'vencer' | 'pend'>('todas');
  const [sel, setSel] = useState(0);
  const [marc, setMarc] = useState<Record<string, boolean>>({});
  const params = useSearchParams();
  const want = params.get('otr');
  const rows = useMemo(() => {
    const f = OTRS.filter((o) => `${o.otr} ${o.cliente} ${o.titulo}`.toLowerCase().includes(q.toLowerCase()) && CHIPS[chip].test(o));
    return [...f].sort((a, b) =>
      orden === 'avance' ? b.avance - a.avance : orden === 'entrega' ? a.plazoDias - b.plazoDias : a.inicio.localeCompare(b.inicio),
    );
  }, [OTRS, q, orden, chip]);
  const wantIdx = want ? rows.findIndex((r) => r.id === want) : -1;
  const idx = wantIdx >= 0 && sel === 0 ? wantIdx : sel;
  const active = rows[Math.min(idx, rows.length - 1)];
  const marcadas = rows.filter((r) => marc[r.id]);
  const todas = rows.length > 0 && marcadas.length === rows.length;
  const exportar = () => {
    const csv = ['OTR;Trabajo;Cliente;Área;Hito;Avance;Entrega', ...marcadas.map((o) => [o.otr, o.titulo, o.cliente, o.area, o.hito, o.avance, o.entrega].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';'))].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })); a.download = 'ordenes-seleccionadas.csv'; a.click(); URL.revokeObjectURL(a.href);
  };
  const moverTodas = (etapa: Etapa) => { const snap = otrStore.get(); marcadas.forEach((o) => otrStore.update(o.id, { etapa })); logEvent(`${marcadas.length} OTR movidas a «${ETAPAS.find((e) => e.key === etapa)?.label}»`, 'otr'); toastUndo('OTR movidas', `${marcadas.length} órdenes → ${ETAPAS.find((e) => e.key === etapa)?.label}`, () => otrStore.restore(snap)); setMarc({}); };
  const eliminarTodas = () => modals.openConfirmModal({ title: `Eliminar ${marcadas.length} OTR`, children: <Text size="sm">Se quitarán del seguimiento, el tablero y el cronograma.</Text>, labels: { confirm: 'Eliminar', cancel: 'Cancelar' }, confirmProps: { color: 'red' }, onConfirm: () => { const snap = otrStore.get(); marcadas.forEach((o) => otrStore.remove(o.id)); logEvent(`${marcadas.length} OTR eliminadas`, 'otr'); toastUndo('OTR eliminadas', `${marcadas.length} órdenes`, () => otrStore.restore(snap)); setMarc({}); } });
  const move = (d: number) => setSel((i) => Math.max(0, Math.min(rows.length - 1, (wantIdx >= 0 && i === 0 ? wantIdx : i) + d)));

  if (!ready) return <div className={classes.split}><RowsSkeleton rows={9} cols={4} />{!compact && <PanelSkeleton />}</div>;
  return (
    <div className={classes.split}>
      <div className={classes.master}>
        <div className={classes.chips} role="tablist" aria-label="Filtrar órdenes">
          {(Object.keys(CHIPS) as (keyof typeof CHIPS)[]).map((k) => (
            <button key={k} role="tab" aria-selected={chip === k} data-on={chip === k || undefined} data-tone={CHIPS[k].tone} onClick={() => { setChip(k); setSel(0); }}>
              {CHIPS[k].label}<em className="num">{OTRS.filter(CHIPS[k].test).length}</em>
            </button>
          ))}
        </div>
        <div className={classes.toolbar}>
          <TextInput
            size="xs" w={260} placeholder="Filtrar por OTR o cliente" aria-label="Filtrar"
            leftSection={<IconSearch size={14} stroke={1.8} />} value={q} onChange={(e) => { setQ(e.currentTarget.value); setSel(0); }}
          />
          <SegmentedControl
            size="xs" value={orden ?? 'entrega'} onChange={setOrden}
            data={[{ value: 'entrega', label: 'Más urgentes' }, { value: 'avance', label: 'Mayor avance' }, { value: 'antiguedad', label: 'Más antiguas' }]}
          />
        </div>
        <div className={classes.thead}><label className={classes.selAll}><Checkbox size="xs" color="forja" aria-label="Seleccionar todas" checked={todas} indeterminate={marcadas.length > 0 && !todas} onChange={(e) => setMarc(e.currentTarget.checked ? Object.fromEntries(rows.map((r) => [r.id, true])) : {})} /></label><span>OTR</span><span>Trabajo</span><span>Avance</span><span>Entrega</span><span /></div>
        <ul className={classes.rows} onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); move(1); } if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); } }}>
          {rows.map((o, i) => (
            <li key={o.id} className={classes.li} data-marc={marc[o.id] || undefined} data-sel={i === idx || undefined}>
              <label className={classes.sel}><Checkbox size="xs" color="forja" aria-label={`Seleccionar OTR ${o.otr}`} checked={!!marc[o.id]} onChange={(e) => setMarc({ ...marc, [o.id]: e.currentTarget.checked })} /></label>
              <button className={classes.row} data-on={i === idx || undefined} aria-current={i === idx || undefined} onClick={() => { setSel(i); setOpen(true); }} style={{ ['--area' as string]: AREA_COLOR[o.area] }}>
                <span className={`${classes.rOtr} mono num`}><i title={o.area} />{o.otr}</span>
                <span className={classes.rMain}>
                  <b>{o.titulo}</b>
                  <small>{o.cliente} · {o.hito}{o.pendientes.length > 0 && <i><IconAlertTriangle size={11} /> {o.pendientes.length} pend.</i>}</small>
                </span>
                <span className={classes.rBar}><SegBar value={o.avance} tone={tone(o)} /><em className="num">{o.avance}%</em></span>
                <span className={`${classes.rDate} mono num`}>{o.entrega.slice(0, 5)}</span>
                <Dots values={o.semaforo} />
              </button>
            </li>
          ))}
          {rows.length === 0 && (
            <li>
              {OTRS.length === 0
                ? <EmptyState icon={<IconPackage size={32} stroke={1.4} />} title="Aún no hay órdenes de trabajo" text="Cada OTR sigue un trabajo desde el ingreso hasta el despacho. Crea la primera para ver el avance, el tablero y el cronograma." action={can('otr.create') ? <Button color="forja" onClick={() => openOtrForm()}>Crear la primera OTR</Button> : undefined} />
                : <EmptyState icon={<IconSearch size={32} stroke={1.4} />} title="Ninguna OTR coincide" text={q ? `No hay resultados para «${q}» con este filtro.` : 'Ninguna orden cumple este filtro.'} action={<Button variant="default" onClick={() => { setQ(''); setChip('todas'); }}>Limpiar filtros</Button>} />}
            </li>
          )}
        </ul>
        {marcadas.length > 0 && (
          <div className={classes.bulk} role="region" aria-label="Acciones sobre la selección">
            <b className="num">{marcadas.length} seleccionadas</b>
            {can('otr.move') && <Select size="xs" w={190} placeholder="Mover a etapa…" aria-label="Mover a etapa" value={null} onChange={(v) => v && moverTodas(v as Etapa)} data={ETAPAS.map((e) => ({ value: e.key, label: e.label }))} />}
            <Button size="xs" variant="default" leftSection={<IconDownload size={14} />} onClick={exportar}>Exportar CSV</Button>
            {can('otr.edit') && <Button size="xs" color="red" variant="light" leftSection={<IconTrash size={14} />} onClick={eliminarTodas}>Eliminar</Button>}
            <Button size="xs" variant="subtle" onClick={() => setMarc({})}>Limpiar</Button>
          </div>
        )}
      </div>
      {active && !compact && <Detalle key={active.id} o={active} onCubicar={onCubicar} onShare={onShare} />}
      {active && compact && (
        <Drawer opened={open} onClose={() => setOpen(false)} position="bottom" size="92%" padding={0} withCloseButton transitionProps={{ transition: 'slide-up', duration: 220 }} title={<span className="cap">Ficha de OTR</span>}>
          <Detalle o={active} onCubicar={(o) => { setOpen(false); onCubicar(o); }} onShare={(o) => { setOpen(false); onShare(o); }} flat />
        </Drawer>
      )}
    </div>
  );
}

function Kpis() {
  const OTRS = otrStore.use();
  const total = OTRS.length;
  const criticas = OTRS.filter((o) => tone(o) === 'crit').length;
  const prom = Math.round(OTRS.reduce((a, o) => a + o.avance, 0) / total);
  const porArea = Object.entries(
    OTRS.reduce<Record<string, number>>((m, o) => ((m[o.area] = (m[o.area] ?? 0) + 1), m), {}),
  ).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...porArea.map(([, n]) => n));
  return (
    <div className={classes.kpiGrid}>
      <section className={classes.hero}>
        <label>OTR críticas</label>
        <div className={classes.heroNum}><span className="num">{criticas}</span><small>de {total} activas</small></div>
        <p>Sin avance o con entrega comprometida. Requieren acción esta semana.</p>
        <SegBar value={(criticas / total) * 100} tone="crit" />
      </section>
      <section className={classes.kpi}><label>Avance promedio</label><b className="num">{prom}%</b><SegBar value={prom} /></section>
      <section className={classes.kpi}><label>IQ promedio</label><b className="num">{(OTRS.reduce((a, o) => a + o.iq, 0) / total).toFixed(1)}%</b><span className={classes.hint}>Índice de calidad</span></section>
      <section className={classes.kpi}><label>Entregas &lt; 30 días</label><b className="num">{OTRS.filter((o) => o.plazoDias < 30).length}</b><span className={classes.hint}>Próximas a vencer</span></section>
      <section className={classes.areaCard}>
        <label>OTR por área</label>
        {porArea.map(([a, n]) => (
          <div key={a} className={classes.areaRow}>
            <span>{a}</span>
            <div className={classes.track}><i style={{ width: `${(n / max) * 100}%`, background: AREA_COLOR[a as keyof typeof AREA_COLOR] }} /></div>
            <b className="num">{n}</b>
          </div>
        ))}
      </section>
    </div>
  );
}

const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
function Calendario() {
  const OTRS = otrStore.use();
  const [ym, setYm] = useState({ y: 2026, m: 9 }); // m: 0-11 (octubre = 9)
  const [pick, setPick] = useState<number | null>(null);
  const first = new Date(ym.y, ym.m, 1);
  const offset = (first.getDay() + 6) % 7; // semana parte en lunes
  const n = new Date(ym.y, ym.m + 1, 0).getDate();
  const entregas: Record<number, Otr[]> = {};
  OTRS.forEach((o) => {
    const [d, m, y] = o.entrega.split('-').map(Number);
    if (m === ym.m + 1 && y === ym.y) (entregas[d] ??= []).push(o);
  });
  const go = (dm: number) => { setPick(null); setYm(({ y, m }) => { const t = new Date(y, m + dm, 1); return { y: t.getFullYear(), m: t.getMonth() }; }); };
  const esHoy = (d: number) => ym.y === 2026 && ym.m === 9 && d === 21;
  const sel = pick ? entregas[pick] ?? [] : [];
  return (
    <div className={classes.cal}>
      <div className={classes.calHead}>
        <h3 style={{ textTransform: 'capitalize' }}>{first.toLocaleDateString('es-CL', { month: 'long' })} {ym.y}</h3>
        <Text size="sm" c="dimmed">Entregas comprometidas</Text>
        <span className={classes.calNav}>
          <ActionIcon variant="default" aria-label="Mes anterior" onClick={() => go(-1)}><IconChevronLeft size={16} /></ActionIcon>
          <Button size="compact-sm" variant="default" onClick={() => { setPick(null); setYm({ y: 2026, m: 9 }); }}>Hoy</Button>
          <ActionIcon variant="default" aria-label="Mes siguiente" onClick={() => go(1)}><IconChevronRight size={16} /></ActionIcon>
        </span>
      </div>
      <div className={classes.calGrid}>
        {DIAS.map((d, i) => <div key={i} className={classes.dow}>{d}</div>)}
        {Array.from({ length: offset }, (_, i) => <div key={`e${i}`} className={classes.day} data-void />)}
        {Array.from({ length: n }, (_, i) => i + 1).map((d) => (
          <button key={d} className={classes.day} data-today={esHoy(d) || undefined} data-pick={pick === d || undefined} onClick={() => setPick(entregas[d] ? d : null)}>
            <span className="num">{d}</span>
            {(entregas[d] ?? []).slice(0, 2).map((o) => <em key={o.id} style={{ ['--c' as string]: AREA_COLOR[o.area] }}>{o.otr} · {o.cliente}</em>)}
            {(entregas[d]?.length ?? 0) > 2 && <small>+{entregas[d].length - 2} más</small>}
          </button>
        ))}
      </div>
      {pick && (
        <div className={classes.calPick}>
          <b>{pick} de {first.toLocaleDateString('es-CL', { month: 'long' })}</b>
          {sel.map((o) => <Link key={o.id} href={`/seguimiento?otr=${o.id}`}><OtrPlate n={o.otr} /> {o.titulo} <i>{o.cliente}</i></Link>)}
        </div>
      )}
    </div>
  );
}

function Historial() {
  const log = logStore.use().slice().sort((a, b) => b.fecha.localeCompare(a.fecha));
  const OTRS = otrStore.use();
  return (
    <div className={classes.hist}>
      <Timeline active={0} bulletSize={14} lineWidth={2} color="forja">
        {log.map((e) => {
          const o = OTRS.find((x) => x.id === e.otrId);
          return (
            <Timeline.Item key={e.id} title={<span>{o && <Link href={`/seguimiento?otr=${o.id}`} className="mono num" style={{ fontWeight: 600, color: 'inherit' }}>OTR {o.otr}</Link>}{o && ' · '}{e.texto}</span>}>
              <Text size="xs" c="dimmed" mt={2}>{relFecha(e.fecha)} · {e.autor}</Text>
            </Timeline.Item>
          );
        })}
      </Timeline>
    </div>
  );
}

export default function SeguimientoPage() {
  return <Suspense fallback={null}><SeguimientoInner /></Suspense>;
}

function SeguimientoInner() {
  const OTRS = otrStore.use();
  const [tab, setTab] = useState('listado');
  const [cub, setCub] = useState<Otr | null>(null);
  const [share, setShare] = useState<Otr | null>(null);
  const prom = OTRS.length ? Math.round(OTRS.reduce((a, o) => a + o.avance, 0) / OTRS.length) : 0;
  return (
    <>
      <PageHead title="Seguimiento de trabajos" sub={`${OTRS.length} órdenes en planta · avance promedio ${prom}% · actualizado hace 4 min`} />
      <nav className={classes.tabs} aria-label="Vistas">
        {[['listado', 'Listado'], ['kpis', 'Indicadores'], ['calendario', 'Calendario'], ['historial', 'Historial']].map(([v, l]) => (
          <button key={v} data-on={tab === v || undefined} onClick={() => setTab(v)}>{l}</button>
        ))}
      </nav>
      {tab === 'listado' && <Listado onCubicar={setCub} onShare={setShare} />}
      {tab === 'kpis' && <Kpis />}
      {tab === 'calendario' && <Calendario />}
      {tab === 'historial' && <Historial />}
      <CubicacionModal otr={cub} onClose={() => setCub(null)} />
      <ShareModal otr={share} onClose={() => setShare(null)} />
    </>
  );
}
