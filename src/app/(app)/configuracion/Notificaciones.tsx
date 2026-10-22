'use client';

import { Switch } from '@mantine/core';
import { audit, guardarConfig, useConfig } from '@/lib/data';
import classes from './configuracion.module.css';

const TIPOS = [
  { k: 'otr', t: 'Órdenes de trabajo', d: 'Avances, cambios de alcance, cubicaciones y entregas.' },
  { k: 'stock', t: 'Inventario y compras', d: 'Despachos, recepciones, faltantes y reposición.' },
  { k: 'calidad', t: 'Calidad', d: 'No conformidades, certificados y firmas.' },
  { k: 'cliente', t: 'Clientes y cotizaciones', d: 'Enlaces compartidos, aprobaciones y rechazos.' },
  { k: 'tarea', t: 'Tareas', d: 'Nuevas tareas, vencimientos y menciones.' },
  { k: 'evidencia', t: 'Evidencia fotográfica', d: 'Fotos nuevas y cambios de visibilidad.' },
] as const;
const CANALES = [['app', 'En la app'], ['correo', 'Correo'], ['whatsapp', 'WhatsApp']] as const;

export function Notificaciones() {
  const conf = useConfig();
  const toggle = (tipo: (typeof TIPOS)[number]['k'], canal: (typeof CANALES)[number][0], v: boolean) => {
    guardarConfig({ notif: { ...conf.notif, [tipo]: { ...conf.notif[tipo], [canal]: v } } });
    audit('config', 'Cambió una preferencia de notificación', `${tipo} · ${canal} → ${v ? 'activado' : 'desactivado'}`);
  };
  return (
    <div className={classes.stack}>
      <header className={classes.head}><div><h2>Notificaciones</h2><p>Define qué eventos avisan y por qué canal. Los cambios se aplican de inmediato a la campana.</p></div></header>
      <div className={classes.matrix}>
        <div className={classes.mhead}><span>Evento</span>{CANALES.map(([, l]) => <span key={l}>{l}</span>)}</div>
        {TIPOS.map((t) => (
          <div key={t.k} className={classes.mrow}>
            <span className={classes.mname}><b>{t.t}</b><small>{t.d}</small></span>
            {CANALES.map(([c, l]) => (
              <span key={c} className={classes.mcell}><Switch color="forja" aria-label={`${t.t} por ${l}`} checked={conf.notif[t.k][c]} onChange={(e) => toggle(t.k, c, e.currentTarget.checked)} /></span>
            ))}
          </div>
        ))}
      </div>
      <fieldset className={classes.group}>
        <legend>Resumen</legend>
        <Switch color="forja" checked={conf.resumenDiario} onChange={(e) => { guardarConfig({ resumenDiario: e.currentTarget.checked }); audit('config', 'Resumen diario', e.currentTarget.checked ? 'activado' : 'desactivado'); }} label="Enviar un resumen diario por correo a las 07:30" description="OTR críticas, entregas del día, faltantes y no conformidades abiertas" />
      </fieldset>
    </div>
  );
}
