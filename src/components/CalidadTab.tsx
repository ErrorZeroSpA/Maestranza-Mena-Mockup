'use client';

import { useRef, useState } from 'react';
import { ActionIcon, Button, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck, IconFileCertificate, IconPaperclip, IconTrash } from '@tabler/icons-react';
import { Cert, Otr, REQUERIDOS, TIPOS_CERT, TipoCert } from '@/lib/mock';
import { certStore, evStore, HOY, logEvent, ncStore, uid } from '@/lib/data';
import { imprimirDossier } from '@/lib/dossier';
import { usePerm } from '@/lib/roles';
import { toastUndo } from '@/lib/undo';
import classes from './CalidadTab.module.css';

/** Pestaña «Calidad» de la OTR: documentos exigidos, firmas y dossier ISO 9001. */
export function CalidadTab({ o }: { o: Otr }) {
  const can = usePerm();
  const certs = certStore.use().filter((c) => c.otrId === o.id);
  const ncs = ncStore.use().filter((n) => n.otrId === o.id);
  const fotos = evStore.use().filter((e) => e.otr === o.otr && e.visibleCliente);
  const req = REQUERIDOS[o.area];
  const [tipo, setTipo] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const edita = can('cert.edit');

  const adjuntar = (f?: File) => {
    if (!f || !tipo) return;
    certStore.add({ id: uid('cf'), otrId: o.id, tipo: tipo as TipoCert, archivo: f.name, fecha: HOY, firma: 'Pendiente' });
    logEvent(`Documento adjunto: ${tipo}`, 'calidad', o.id);
    notifications.show({ message: `${f.name} adjuntado. Falta la firma de Calidad.`, color: 'teal' });
    setTipo(null);
    if (file.current) file.current.value = '';
  };
  const firmar = (c: Cert) => { certStore.update(c.id, { firma: 'Firmado', firmante: 'Calidad' }); logEvent(`Firmado: ${c.tipo}`, 'calidad', o.id, 'Calidad'); };
  const quitar = (c: Cert) => { const snap = certStore.get(); certStore.remove(c.id); toastUndo('Documento quitado', c.archivo, () => certStore.restore(snap)); };

  const estado = (t: TipoCert) => { const c = certs.find((x) => x.tipo === t); return c ? (c.firma === 'Firmado' ? 'ok' : 'pend') : 'falta'; };
  const completos = req.filter((t) => estado(t) === 'ok').length;
  const ncAbiertas = ncs.filter((n) => n.estado !== 'Cerrada').length;
  const listo = req.length > 0 && completos === req.length && ncAbiertas === 0;

  return (
    <div className={classes.box}>
      <div className={classes.summary} data-ok={listo || undefined}>
        <IconFileCertificate size={20} stroke={1.5} />
        <span><b>{req.length === 0 ? 'Esta área no exige certificados' : `${completos} de ${req.length} documentos firmados`}</b><small>{ncAbiertas ? `${ncAbiertas} no conformidad(es) abierta(s) bloquean el cierre` : listo ? 'Listo para entregar el dossier' : 'Completa los pendientes para cerrar'}</small></span>
      </div>

      <ul className={classes.list}>
        {req.map((t) => {
          const c = certs.find((x) => x.tipo === t);
          const e = estado(t);
          return (
            <li key={t} data-e={e}>
              <span className={classes.mark}>{e === 'ok' ? <IconCheck size={14} /> : e === 'pend' ? <IconPaperclip size={14} /> : <IconAlertTriangle size={14} />}</span>
              <span className={classes.t}><b>{t}</b><small>{c ? `${c.archivo}${c.firma === 'Firmado' ? ` · firmado por ${c.firmante}` : ' · pendiente de firma'}` : 'Falta adjuntar'}</small></span>
              {c && c.firma === 'Pendiente' && edita && <Button size="compact-xs" color="forja" onClick={() => firmar(c)}>Firmar</Button>}
              {c && edita && <ActionIcon variant="subtle" color="red" size="sm" aria-label={`Quitar ${t}`} onClick={() => quitar(c)}><IconTrash size={13} /></ActionIcon>}
            </li>
          );
        })}
        {certs.filter((c) => !req.includes(c.tipo)).map((c) => (
          <li key={c.id} data-e={c.firma === 'Firmado' ? 'ok' : 'pend'}>
            <span className={classes.mark}><IconPaperclip size={14} /></span>
            <span className={classes.t}><b>{c.tipo}</b><small>{c.archivo} · {c.firma === 'Firmado' ? 'firmado' : 'pendiente'}</small></span>
            {c.firma === 'Pendiente' && edita && <Button size="compact-xs" color="forja" onClick={() => firmar(c)}>Firmar</Button>}
          </li>
        ))}
      </ul>

      {edita && (
        <div className={classes.add}>
          <Select size="xs" placeholder="Tipo de documento" aria-label="Tipo de documento" data={[...TIPOS_CERT]} value={tipo} onChange={setTipo} />
          <input ref={file} type="file" hidden onChange={(e) => adjuntar(e.target.files?.[0])} />
          <Button size="xs" variant="default" leftSection={<IconPaperclip size={14} />} disabled={!tipo} onClick={() => file.current?.click()}>Adjuntar archivo</Button>
        </div>
      )}
      <Button fullWidth color="acero" leftSection={<IconFileCertificate size={15} />} onClick={() => imprimirDossier(o, certs, ncs, fotos)}>Generar dossier de calidad (PDF)</Button>
    </div>
  );
}
