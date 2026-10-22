'use client';

import { useEffect, useState } from 'react';
import { Button, NumberInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { audit, guardarConfig, useConfig } from '@/lib/data';
import { AREA_COLOR, Area, RUTA } from '@/lib/mock';
import classes from './configuracion.module.css';

const K = ['horasSemana', 'disponibilidad', 'stockMin', 'plazoCritico', 'plazoAlerta'] as const;

export function Planta() {
  const conf = useConfig();
  const [d, setD] = useState(() => Object.fromEntries(K.map((k) => [k, conf[k]])) as Record<(typeof K)[number], number>);
  useEffect(() => { setD(Object.fromEntries(K.map((k) => [k, conf[k]])) as Record<(typeof K)[number], number>); }, [conf]);
  const sucio = K.some((k) => d[k] !== conf[k]);
  const set = (k: (typeof K)[number], v: number | string) => setD((x) => ({ ...x, [k]: Number(v) || 0 }));
  const guardar = () => {
    if (d.plazoAlerta < d.plazoCritico) return notifications.show({ message: 'El plazo de alerta debe ser mayor o igual al crítico.', color: 'orange' });
    const cambios = K.filter((k) => d[k] !== conf[k]);
    guardarConfig(d);
    audit('config', 'Actualizó parámetros de planta', cambios.map((k) => `${k}: ${conf[k]} → ${d[k]}`).join(' · '));
    notifications.show({ title: 'Parámetros de planta guardados', message: 'Capacidad, stock y semáforos ya usan los nuevos valores.', color: 'teal' });
  };
  return (
    <div className={classes.stack}>
      <header className={classes.head}><div><h2>Planta</h2><p>Estos valores mueven la grilla de Capacidad, las alertas de stock y los semáforos de plazo.</p></div></header>

      <fieldset className={classes.group}>
        <legend>Capacidad</legend>
        <div className={classes.grid2}>
          <NumberInput label="Horas por semana y máquina" min={10} max={168} value={d.horasSemana} onChange={(v) => set('horasSemana', v)} description="Turno de trabajo real de cada equipo" />
          <NumberInput label="Disponibilidad esperada (%)" min={30} max={100} value={d.disponibilidad} onChange={(v) => set('disponibilidad', v)} description="Descuenta mantenciones y esperas" />
        </div>
      </fieldset>

      <fieldset className={classes.group}>
        <legend>Alertas</legend>
        <div className={classes.grid3}>
          <NumberInput label="Stock mínimo (unidades)" min={0} value={d.stockMin} onChange={(v) => set('stockMin', v)} description="Bajo esto, el material se marca «Stock bajo»" />
          <NumberInput label="Plazo crítico (días)" min={1} value={d.plazoCritico} onChange={(v) => set('plazoCritico', v)} description="Con poco avance, el semáforo se pone rojo" />
          <NumberInput label="Plazo de alerta (días)" min={1} value={d.plazoAlerta} onChange={(v) => set('plazoAlerta', v)} description="Con avance bajo, el semáforo se pone amarillo" />
        </div>
      </fieldset>

      <fieldset className={classes.group}>
        <legend>Estructura de la planta <small>(solo lectura)</small></legend>
        <p className={classes.note}>Las áreas y la ruta de producción definen todo el sistema. Se cambian con soporte para no romper órdenes en curso.</p>
        <div className={classes.chips}>{(Object.keys(AREA_COLOR) as Area[]).map((a) => <span key={a} style={{ ['--c' as string]: AREA_COLOR[a] }}><i />{a}</span>)}</div>
        <ol className={classes.route}>{RUTA.map((r, i) => <li key={r}><b className="num">{i + 1}</b>{r}</li>)}</ol>
      </fieldset>

      <div className={classes.save}>
        <span>{sucio ? 'Hay cambios sin guardar.' : 'Todo guardado.'}</span>
        <Button variant="default" disabled={!sucio} onClick={() => setD(Object.fromEntries(K.map((k) => [k, conf[k]])) as Record<(typeof K)[number], number>)}>Descartar</Button>
        <Button color="forja" disabled={!sucio} onClick={guardar}>Guardar cambios</Button>
      </div>
    </div>
  );
}
