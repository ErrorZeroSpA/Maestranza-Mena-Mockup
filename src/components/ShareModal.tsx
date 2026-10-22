'use client';

import { useState } from 'react';
import { Button, CopyButton, Modal, Select, Switch, Text, Textarea } from '@mantine/core';
import { IconBrandWhatsapp, IconCheck, IconCopy, IconExternalLink, IconMail } from '@tabler/icons-react';
import { Otr } from '@/lib/mock';
import { linkFor, tokenFor } from '@/lib/share';
import { logEvent } from '@/lib/data';
import { OtrPlate } from './primitives';
import classes from './ShareModal.module.css';

export function ShareModal({ otr, onClose }: { otr: Otr | null; onClose: () => void }) {
  const [fotos, setFotos] = useState(true);
  const [fechas, setFechas] = useState(true);
  const [coment, setComent] = useState(false);
  const [vence, setVence] = useState<string | null>('30');
  const [msg, setMsg] = useState('Hola, te comparto el estado actualizado de tu trabajo. Puedes verlo en este enlace sin iniciar sesión:');

  if (!otr) return <Modal opened={false} onClose={onClose}><span /></Modal>;
  const url = linkFor(otr.otr);
  const texto = `${msg}\n${url}`;

  return (
    <Modal
      opened
      onClose={onClose}
      size={520}
      padding="lg"
      title={<div className={classes.title}><b>Compartir estado con cliente</b><OtrPlate n={otr.otr} /></div>}
      transitionProps={{ transition: 'pop', duration: 160 }}
    >
      <p className={classes.lead}>El cliente verá el avance en vivo, sin cuenta. Tú decides qué se muestra.</p>

      <div className={classes.linkRow}>
        <code>{url}</code>
        <CopyButton value={url} timeout={1800}>
          {({ copied, copy }) => (
            <Button size="xs" color={copied ? 'teal' : 'acero'} leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />} onClick={() => { copy(); logEvent('Enlace de estado compartido con el cliente', 'cliente', otr.id); }}>
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
          )}
        </CopyButton>
      </div>

      <div className={classes.opts}>
        <Switch checked={fotos} onChange={(e) => setFotos(e.currentTarget.checked)} label="Mostrar evidencia fotográfica" description="Solo fotos marcadas como visibles al cliente" color="forja" />
        <Switch checked={fechas} onChange={(e) => setFechas(e.currentTarget.checked)} label="Mostrar fecha de entrega y plazo" color="forja" />
        <Switch checked={coment} onChange={(e) => setComent(e.currentTarget.checked)} label="Permitir comentarios del cliente" description="Llegan a la bitácora de la OTR" color="forja" />
        <Select label="El enlace caduca en" size="xs" allowDeselect={false} value={vence} onChange={setVence} data={[{ value: '7', label: '7 días' }, { value: '30', label: '30 días' }, { value: '90', label: '90 días' }, { value: '0', label: 'Nunca (solo lectura)' }]} />
      </div>

      <Textarea label="Mensaje" size="xs" autosize minRows={2} value={msg} onChange={(e) => setMsg(e.currentTarget.value)} />

      <div className={classes.actions}>
        <Button component="a" target="_blank" href={`https://wa.me/?text=${encodeURIComponent(texto)}`} color="teal" leftSection={<IconBrandWhatsapp size={16} />}>WhatsApp</Button>
        <Button component="a" href={`mailto:?subject=${encodeURIComponent(`Estado OTR ${otr.otr} · Maestranza Mena`)}&body=${encodeURIComponent(texto)}`} variant="default" leftSection={<IconMail size={16} />}>Correo</Button>
        <Button component="a" target="_blank" href={`/estado/${tokenFor(otr.otr)}`} variant="subtle" ml="auto" rightSection={<IconExternalLink size={14} />}>Vista del cliente</Button>
      </div>
      <Text size="xs" c="dimmed" mt="sm">Mockup: el enlace apunta a una vista de ejemplo. En producción el token se guarda en BD y se puede revocar.</Text>
    </Modal>
  );
}
