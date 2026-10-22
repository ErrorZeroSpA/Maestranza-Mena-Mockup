'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Button, Select, Switch, Textarea } from '@mantine/core';
import { IconCamera, IconCheck, IconPhotoPlus } from '@tabler/icons-react';
import { AnnotateCanvas, AnnotateHandle } from '@/components/AnnotateCanvas';
import { PageHead } from '@/components/PageHead';
import { RUTA } from '@/lib/mock';
import { evStore, logEvent, otrStore, uid } from '@/lib/data';
import classes from './nueva.module.css';

const optsOf = (OTRS: ReturnType<typeof otrStore.get>) => OTRS.filter((o, i, a) => a.findIndex((x) => x.otr === o.otr) === i).map((o) => ({ value: String(o.otr), label: `${o.otr} · ${o.titulo.slice(0, 40)}` }));

export default function NuevaEvidencia() {
  const OTR_OPTS = optsOf(otrStore.use());
  const [src, setSrc] = useState<string | null>(null);
  const [otr, setOtr] = useState<string | null>(null);
  const [etapa, setEtapa] = useState<string | null>(null);
  const [nota, setNota] = useState('');
  const [visible, setVisible] = useState(true);
  const [saved, setSaved] = useState(false);
  const cvRef = useRef<AnnotateHandle>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = (f?: File) => {
    if (!f) return;
    if (src) URL.revokeObjectURL(src);
    setSrc(URL.createObjectURL(f)); setSaved(false);
  };
  const reset = () => { setSrc(null); setNota(''); setSaved(false); if (fileRef.current) fileRef.current.value = ''; };
  const guardar = () => {
    evStore.add({ id: uid('e'), otr: Number(otr), etapa: etapa ?? '', nota, visibleCliente: visible, fecha: new Date().toISOString(), autor: 'Felipe Romero', img: cvRef.current?.toDataURL(640) });
    logEvent(`Evidencia fotográfica agregada${etapa ? ` (${etapa})` : ''}`, 'evidencia', otrStore.get().find((o) => String(o.otr) === otr)?.id);
    setSaved(true);
  };

  return (
    <>
      <PageHead title="Capturar evidencia" sub="Foto · marcar · asociar a OTR" />
      <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => pick(e.target.files?.[0])} />

      {saved ? (
        <div className={classes.done}>
          <IconCheck size={36} stroke={2.2} />
          <h2>Evidencia guardada en la OTR {otr}</h2>
          <p>{visible ? 'Ya es visible en el enlace del cliente.' : 'Queda solo para uso interno.'}</p>
          <div>
            <Button color="forja" leftSection={<IconCamera size={16} />} onClick={() => { reset(); fileRef.current?.click(); }}>Capturar otra</Button>
            <Button component={Link} href="/evidencia" variant="default">Ver galería</Button>
          </div>
        </div>
      ) : !src ? (
        <div className={classes.start}>
        <button className={classes.drop} onClick={() => fileRef.current?.click()}>
          <IconCamera size={44} stroke={1.4} />
          <b>Tomar foto o elegir imagen</b>
          <small>En el celular abre la cámara trasera. En escritorio abre el selector de archivos.</small>
          <span><IconPhotoPlus size={14} /> JPG o PNG</span>
        </button>
        <ol className={classes.tips}>
          <li><b>1</b><span><strong>Encuadra la pieza</strong>Incluye una referencia de tamaño o el número de OTR si se puede.</span></li>
          <li><b>2</b><span><strong>Marca el punto</strong>Dibuja sobre el defecto o la soldadura que quieres mostrar.</span></li>
          <li><b>3</b><span><strong>Asocia y decide</strong>Elige la OTR, la etapa y si el cliente puede verla.</span></li>
        </ol>
        </div>
      ) : (
        <div className={classes.grid}>
          <AnnotateCanvas ref={cvRef} src={src} />
          <form className={classes.form} onSubmit={(e) => { e.preventDefault(); guardar(); }}>
            <Select label="Orden de trabajo" placeholder="Selecciona OTR" searchable required data={OTR_OPTS} value={otr} onChange={setOtr} />
            <Select label="Etapa" placeholder="¿En qué etapa está?" data={RUTA} value={etapa} onChange={setEtapa} />
            <Textarea label="Nota" placeholder="Qué se ve, qué falta, qué hay que revisar…" autosize minRows={3} value={nota} onChange={(e) => setNota(e.currentTarget.value)} />
            <Switch checked={visible} onChange={(e) => setVisible(e.currentTarget.checked)} color="forja" label="Visible para el cliente" description="Aparece en su enlace de estado" />
            <div className={classes.btns}>
              <Button type="submit" color="forja" size="md" disabled={!otr} flex={1}>Guardar evidencia</Button>
              <Button variant="default" size="md" onClick={reset}>Descartar</Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
