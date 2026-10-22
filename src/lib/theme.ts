import { createTheme, MantineColorsTuple } from '@mantine/core';

// Grafito de taller (hollín + acero). El índice 6 es el color de acción.
const acero: MantineColorsTuple = [
  '#eef2f8', '#dbe4f0', '#b6c6dc', '#8aa2c2', '#5f7fa8',
  '#2f5183', '#0b2748', '#091f3a', '#07192e', '#041020',
];
// Superficies del modo oscuro (azul noche)
const dark: MantineColorsTuple = [
  '#d5dcea', '#b8c2d3', '#8593aa', '#5f6e86', '#3a4d70',
  '#22345a', '#16263f', '#101c30', '#0d1727', '#0a1220',
];
// Naranja de forja: acento único.
const forja: MantineColorsTuple = [
  '#fff3e4', '#ffe2c2', '#fdc98c', '#fbab54', '#f8942e',
  '#f5821f', '#e0701a', '#bd5b12', '#94460d', '#6b3209',
];

export const theme = createTheme({
  primaryColor: 'acero',
  autoContrast: true,
  primaryShade: { light: 6, dark: 4 },
  colors: { acero, forja, dark },
  fontFamily: 'var(--font-sans), system-ui, sans-serif',
  fontFamilyMonospace: 'var(--font-mono), ui-monospace, monospace',
  headings: { fontFamily: 'var(--font-sans), system-ui, sans-serif', fontWeight: '700' },
  defaultRadius: 'md',
  radius: { xs: '6px', sm: '8px', md: '12px', lg: '16px', xl: '24px' },
  black: '#0f1b2d',
  components: {
    Button: { defaultProps: { fw: 600 } },
    Badge: { defaultProps: { radius: 'xl', fw: 600 } },
    Tooltip: { defaultProps: { openDelay: 150 } },
  },
});
