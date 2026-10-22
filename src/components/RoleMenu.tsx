'use client';

import { useEffect } from 'react';
import { Menu, UnstyledButton } from '@mantine/core';
import { IconCheck, IconChevronDown, IconHelpCircle, IconUserShield } from '@tabler/icons-react';
import { abrirGuia } from '@/lib/ui';
import { loadRolPref, rolesStore, setRol, useRol, useRolDef } from '@/lib/roles';
import classes from './RoleMenu.module.css';

/** Selector de rol para el mockup: cambia pantallas visibles y acciones permitidas. */
export function RoleMenu() {
  const rol = useRol();
  const def = useRolDef();
  const roles = rolesStore.use();
  useEffect(() => { loadRolPref(); }, []);
  return (
    <Menu position="bottom-end" width={290} transitionProps={{ transition: 'pop-top-right', duration: 140 }}>
      <Menu.Target>
        <UnstyledButton className={classes.btn} aria-label={`Rol actual: ${def.nombre}. Cambiar rol`}>
          <IconUserShield size={16} stroke={1.7} />
          <span className={classes.txt}><small>Rol</small><b>{def.corto}</b></span>
          <IconChevronDown size={14} />
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Ver la app como…</Menu.Label>
        {roles.map((r) => (
          <Menu.Item key={r.id} onClick={() => setRol(r.id)} rightSection={r.id === rol ? <IconCheck size={14} /> : null}>
            <div className={classes.item}><b>{r.nombre}</b><small>{r.desc}</small></div>
          </Menu.Item>
        ))}
        <Menu.Divider />
        <Menu.Item leftSection={<IconHelpCircle size={15} />} onClick={abrirGuia}>Ver la guía de este rol</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
