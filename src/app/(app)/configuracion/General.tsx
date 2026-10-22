'use client';

import { useEffect, useState } from 'react';
import { Button, NumberInput, Switch, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { audit, guardarConfig, useConfig } from '@/lib/data';
import { CLP } from '@/lib/mock';
import classes from './configuracion.module.css';

type Campos = 'nombre' | 'rut' | 'direccion' | 'telefono' | 'correo' | 'horario' | 'iva' | 'tarifaHH' | 'margenObjetivo' | 'dominio' | 'sesionHoras' | 'dobleFactor';
const CAMPOS: Campos[] = ['nombre', 'rut', 'direccion', 'telefono', 'correo', 'horario', 'iva', 'tarifaHH', 'margenObjetivo', 'dominio', 'sesionHoras', 'dobleFactor'];

export function General() {
  const conf = useConfig();
  const [d, setD] = useState(() => Object.fromEntries(CAMPOS.map((k) => [k, conf[k]])) as Pick<typeof conf, Campos>);
  const sucio = CAMPOS.some((k) => d[k] !== conf[k]);
  useEffect(() => { setD(Object.fromEntries(CAMPOS.map((k) => [k, conf[k]])) as Pick<typeof conf, Campos>); }, [conf]);
  const set = <K extends Campos>(k: K, v: (typeof d)[K]) => setD((x) => ({ ...x, [k]: v }));

  const guardar = () => {
    if (!d.nombre.trim()) return notifications.show({ message: 'La empresa necesita un nombre.', color: 'orange' });
    const cambios = CAMPOS.filter((k) => d[k] !== conf[k]).map((k) => k);
    guardarConfig(d);
    audit('config', 'Actualizó la configuración general', cambios.join(', '));
    notifications.show({ title: 'Configuración guardada', message: `${cambios.length} cambio(s) aplicados al sistema.`, color: 'teal' });
  };

  return (
    <div className={classes.stack}>
      <header className={classes.head}><div><h2>General</h2><p>Datos de la empresa y reglas que usan cotizaciones, reportes y accesos.</p></div></header>

      <fieldset className={classes.group}>
        <legend>Empresa</legend>
        <div className={classes.grid2}>
          <TextInput label="Razón social" value={d.nombre} onChange={(e) => set('nombre', e.currentTarget.value)} />
          <TextInput label="RUT" value={d.rut} onChange={(e) => set('rut', e.currentTarget.value)} />
        </div>
        <TextInput label="Dirección" value={d.direccion} onChange={(e) => set('direccion', e.currentTarget.value)} />
        <div className={classes.grid3}>
          <TextInput label="Teléfono" value={d.telefono} onChange={(e) => set('telefono', e.currentTarget.value)} />
          <TextInput label="Correo de contacto" type="email" value={d.correo} onChange={(e) => set('correo', e.currentTarget.value)} />
          <TextInput label="Horario de atención" value={d.horario} onChange={(e) => set('horario', e.currentTarget.value)} />
        </div>
      </fieldset>

      <fieldset className={classes.group}>
        <legend>Parámetros comerciales</legend>
        <div className={classes.grid3}>
          <NumberInput label="IVA (%)" min={0} max={30} value={d.iva} onChange={(v) => set('iva', Number(v) || 0)} description="Se usa en cotizaciones" />
          <NumberInput label="Tarifa hora hombre" min={0} thousandSeparator="." decimalSeparator="," prefix="$" value={d.tarifaHH} onChange={(v) => set('tarifaHH', Number(v) || 0)} description="Valor inicial en cotizaciones" />
          <NumberInput label="Margen objetivo (%)" min={0} max={80} value={d.margenObjetivo} onChange={(v) => set('margenObjetivo', Number(v) || 0)} description="Referencia para el P&L" />
        </div>
        <p className={classes.note}>Ejemplo: una hora a {CLP(d.tarifaHH)} con {d.margenObjetivo}% de margen se vende en {CLP(Math.round(d.tarifaHH / (1 - d.margenObjetivo / 100)))}.</p>
      </fieldset>

      <fieldset className={classes.group}>
        <legend>Seguridad de acceso</legend>
        <div className={classes.grid2}>
          <TextInput label="Dominio permitido (Google)" value={d.dominio} onChange={(e) => set('dominio', e.currentTarget.value)} description="Solo cuentas @este-dominio pueden entrar" leftSection="@" />
          <NumberInput label="Cerrar sesión inactiva a las (horas)" min={1} max={72} value={d.sesionHoras} onChange={(v) => set('sesionHoras', Number(v) || 1)} />
        </div>
        <Switch checked={d.dobleFactor} onChange={(e) => set('dobleFactor', e.currentTarget.checked)} color="forja" label="Exigir verificación en dos pasos" description="Recomendado para Gerencia y Comercial, que ven costos y márgenes" />
      </fieldset>

      <div className={classes.save}>
        <span>{sucio ? 'Hay cambios sin guardar.' : 'Todo guardado.'}</span>
        <Button variant="default" disabled={!sucio} onClick={() => setD(Object.fromEntries(CAMPOS.map((k) => [k, conf[k]])) as Pick<typeof conf, Campos>)}>Descartar</Button>
        <Button color="forja" disabled={!sucio} onClick={guardar}>Guardar cambios</Button>
      </div>
    </div>
  );
}
