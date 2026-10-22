'use client';

import { ActionIcon, Tooltip, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { IconMoon, IconSun } from '@tabler/icons-react';

export function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const scheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const dark = scheme === 'dark';
  return (
    <Tooltip label={dark ? 'Modo claro' : 'Modo oscuro'}>
      <ActionIcon variant="default" size={34} aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'} onClick={() => setColorScheme(dark ? 'light' : 'dark')}>
        {dark ? <IconSun size={17} stroke={1.7} /> : <IconMoon size={17} stroke={1.7} />}
      </ActionIcon>
    </Tooltip>
  );
}
