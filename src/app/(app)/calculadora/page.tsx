'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, NumberInput, Select, SegmentedControl, Slider, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconCopy, IconPlus } from '@tabler/icons-react';
import { PageHead } from '@/components/PageHead';
import { calcular, FORMAS, Forma, MATERIALES } from '@/lib/acero';
import { CLP } from '@/lib/mock';
import { cubStore, logEvent, otrStore, uid } from '@/lib/data';
import classes from './calculadora.module.css';

const fmt = (n: number, d = 2) => n.toLocaleString('es-CL', { minimumFractionDigits: d, maximumFractionDigits: d });

/** Esquema de la sección para que el operador confirme qué está midiendo. */
function Seccion({ forma }: { forma: Forma }) {
  const c = { fill: 'none', stroke: 'currentColor', strokeWidth: 3 } as const;
  return (
    <svg viewBox="0 0 120 80" className={classes.sec} aria-hidden>
      {forma === 'plancha' && <rect x="10" y="30" width="100" height="20" {...c} />}
      {forma === 'pletina' && <rect x="30" y="25" width="60" height="30" {...c} />}
      {forma === 'barra' && <circle cx="60" cy="40" r="26" {...c} />}
      {forma === 'cuadrada' && <rect x="34" y="14" width="52" height="52" {...c} />}
      {forma === 'tuboR' && (<><circle cx="60" cy="40" r="28" {...c} /><circle cx="60" cy="40" r="20" {...c} /></>)}
      {forma === 'tuboC' && (<><rect x="26" y="12" width="68" height="56" {...c} /><rect x="35" y="21" width="50" height="38" {...c} /></>)}
      {forma === 'angulo' && <path d="M30 10 H42 V56 H92 V68 H30 Z" {...c} />}
    </svg>
  );
}

export default function CalculadoraPage() {
  return <Suspense fallback={null}><Inner /></Suspense>;
}

function Inner() {
  const params = useSearchParams();
  const compact = useMediaQuery('(max-width: 62em)');
  const otrs = otrStore.use();
  const [formaId, setFormaId] = useState<Forma>('plancha');
  const forma = FORMAS.find((f) => f.id === formaId)!;
  const [vals, setVals] = useState<Record<string, number>>(() => Object.fromEntries(FORMAS[0].campos.map((c) => [c.k, c.def])));
  const [matId, setMatId] = useState<string>('a36');
  const mat = MATERIALES.find((m) => m.id === matId)!;
  const [precio, setPrecio] = useState<number | string>(mat.precio);
  const [cant, setCant] = useState<number | string>(1);
  const [merma, setMerma] = useState(5);
  const [otrId, setOtrId] = useState<string | null>(params.get('otr'));

  const cambiarForma = (id: Forma) => {
    const f = FORMAS.find((x) => x.id === id)!;
    setFormaId(id);
    setVals(Object.fromEntries(f.campos.map((c) => [c.k, c.def])));
  };
  const cambiarMat = (id: string | null) => {
    const m = MATERIALES.find((x) => x.id === id);
    if (!m) return;
    setMatId(m.id); setPrecio(m.precio);
  };

  const r = useMemo(() => calcular(forma, vals, mat.densidad, Number(cant) || 1, merma, Number(precio) || 0), [forma, vals, mat, cant, merma, precio]);
  const descripcion = `${forma.nombre.toUpperCase()} ${mat.nombre.toUpperCase()} ${r.desc}`;

  const agregar = () => {
    const o = otrs.find((x) => x.id === otrId);
    if (!o) return notifications.show({ message: 'Elige la OTR a la que se agrega.', color: 'orange' });
    cubStore.add({ id: uid('l'), otrId: o.id, codigo: `${forma.id.toUpperCase().slice(0, 4)}-${mat.id.toUpperCase()}`, descripcion, cant: Number(cant) || 1, categoria: forma.id === 'plancha' ? 'Plancha' : 'Perfil', costo: Math.round(r.costoUnit) });
    logEvent(`Cubicación: +${Number(cant) || 1} × ${descripcion} (${fmt(r.conMerma, 1)} kg)`, 'otr', o.id);
    notifications.show({ title: 'Agregado a la cubicación', message: `OTR ${o.otr} · ${descripcion}`, color: 'teal' });
  };
  const copiar = () => {
    navigator.clipboard?.writeText(`${descripcion} · ${Number(cant) || 1} un · ${fmt(r.conMerma, 1)} kg · ${CLP(Math.round(r.costoTotal))}`);
    notifications.show({ message: 'Resultado copiado.', color: 'teal' });
  };

  return (
    <>
      <PageHead title="Calculadora de acero" sub="Peso y costo de material · para cubicar" />
      <div className={classes.layout}>
        <section className={classes.form}>
          {compact
            ? <div className={classes.shapesSel}><Select label="Forma de la pieza" allowDeselect={false} value={formaId} onChange={(v) => v && cambiarForma(v as Forma)} data={FORMAS.map((f) => ({ value: f.id, label: f.nombre }))} /></div>
            : <SegmentedControl fullWidth orientation="vertical" size="sm" className={classes.shapes} value={formaId} onChange={(v) => cambiarForma(v as Forma)} data={FORMAS.map((f) => ({ value: f.id, label: f.nombre }))} />}
          <div className={classes.fields}>
            <div className={classes.row2}>
              <Select label="Material" allowDeselect={false} value={matId} onChange={cambiarMat} data={MATERIALES.map((m) => ({ value: m.id, label: `${m.nombre} (${m.densidad} kg/m³)` }))} />
              <NumberInput label="Precio por kg" prefix="$" thousandSeparator="." decimalSeparator="," min={0} value={precio} onChange={setPrecio} />
            </div>
            <div className={classes.dims}>
              {forma.campos.map((c) => (
                <NumberInput key={c.k} label={c.label} min={0} decimalScale={2} value={vals[c.k]} onChange={(v) => setVals((x) => ({ ...x, [c.k]: Number(v) || 0 }))} />
              ))}
              <NumberInput label="Cantidad" min={1} value={cant} onChange={setCant} />
            </div>
            <div>
              <Text size="sm" fw={500} mb={6}>Merma de corte: <b className="num">{merma}%</b></Text>
              <Slider value={merma} onChange={setMerma} min={0} max={25} step={1} color="forja" marks={[{ value: 0, label: '0' }, { value: 5, label: '5' }, { value: 10, label: '10' }, { value: 25, label: '25' }]} />
            </div>
          </div>
        </section>

        <aside className={classes.result}>
          <div className={classes.top}>
            <Seccion forma={formaId} />
            <div><span className="cap">Pieza</span><p>{descripcion}</p></div>
          </div>
          <div className={classes.big}>
            <span className="cap">Peso con merma</span>
            <b className="num">{fmt(r.conMerma, 1)}<i> kg</i></b>
          </div>
          <dl className={classes.stats}>
            <div><dt>Peso unitario</dt><dd className="num">{fmt(r.pesoUnit, 2)} kg</dd></div>
            <div><dt>Peso × {Number(cant) || 1}</dt><dd className="num">{fmt(r.pesoTotal, 1)} kg</dd></div>
            <div><dt>Costo unitario</dt><dd className="num">{CLP(Math.round(r.costoUnit))}</dd></div>
            <div className={classes.total}><dt>Costo total</dt><dd className="num">{CLP(Math.round(r.costoTotal))}</dd></div>
          </dl>
          <div className={classes.add}>
            <Select placeholder="Agregar a la cubicación de…" searchable clearable value={otrId} onChange={setOtrId} data={otrs.map((o) => ({ value: o.id, label: `${o.otr} · ${o.titulo.slice(0, 34)}` }))} />
            <Button color="forja" leftSection={<IconPlus size={16} />} onClick={agregar}>Agregar a cubicación</Button>
            <Button variant="default" leftSection={<IconCopy size={15} />} onClick={copiar}>Copiar resultado</Button>
          </div>
        </aside>
      </div>
    </>
  );
}
