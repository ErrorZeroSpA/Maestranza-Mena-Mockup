'use client';

import Link from 'next/link';
import { Button } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';
import { useRolDef } from '@/lib/roles';
import classes from './EmptyState.module.css';

export function NoAccess() {
  const def = useRolDef();
  return (
    <div className={classes.box} role="status">
      <IconLock size={34} stroke={1.4} />
      <h2>Esta pantalla no está en tu rol</h2>
      <p>Con el rol <b>{def.nombre}</b> no ves este módulo. Cambia de rol arriba a la derecha para probar otro punto de vista.</p>
      <Button component={Link} href="/inicio" color="acero">Volver a Inicio</Button>
    </div>
  );
}
