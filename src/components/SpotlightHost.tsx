'use client';

import { useRouter } from 'next/navigation';
import { Spotlight } from '@mantine/spotlight';
import { IconBoxSeam, IconBuilding, IconCamera, IconPlus, IconSearch, IconShieldCheck } from '@tabler/icons-react';
import { clienteStore, matStore, otrStore } from '@/lib/data';
import { openOtrForm } from '@/lib/ui';

const PAGES = [
  ['Inicio', '/inicio'], ['Seguimiento', '/seguimiento'], ['Tablero de planta', '/kanban'], ['Cronograma', '/gantt'],
  ['Evidencia', '/evidencia'], ['Calidad', '/calidad'], ['Reportes', '/reportes'], ['Calculadora de acero', '/calculadora'], ['Máquinas', '/maquinas'], ['Capacidad', '/capacidad'], ['Cotizador', '/cotizador'], ['Compras', '/compras'], ['Configuración', '/configuracion'], ['Inventario', '/inventario'], ['Clientes', '/clientes'], ['Tareas', '/tareas'],
] as const;

/** Paleta de comandos (Ctrl K): busca OTR, materiales, clientes y atajos. */
export function SpotlightHost() {
  const router = useRouter();
  const otrs = otrStore.use();
  const mats = matStore.use();
  const clientes = clienteStore.use();
  const go = (href: string) => () => router.push(href);

  return (
    <Spotlight
      shortcut={['mod + K', '/']}
      nothingFound="Sin resultados"
      searchProps={{ placeholder: 'Buscar OTR, material, cliente o ir a…', leftSection: <IconSearch size={18} /> }}
      highlightQuery
      limit={14}
      scrollable
      maxHeight={440}
      actions={[
        { group: 'Acciones', actions: [
          { id: 'a-otr', label: 'Nueva OTR', description: 'Crear una orden de trabajo', leftSection: <IconPlus size={18} />, onClick: () => openOtrForm() },
          { id: 'a-ev', label: 'Capturar evidencia', description: 'Foto con anotación', leftSection: <IconCamera size={18} />, onClick: go('/evidencia/nueva') },
          { id: 'a-nc', label: 'Reportar no conformidad', description: 'Registro de calidad', leftSection: <IconShieldCheck size={18} />, onClick: go('/calidad') },
        ] },
        { group: 'Ir a', actions: PAGES.map(([label, href]) => ({ id: `p-${href}`, label, onClick: go(href) })) },
        { group: 'Órdenes de trabajo', actions: otrs.map((o) => ({ id: `o-${o.id}`, label: `${o.otr} · ${o.titulo}`, description: `${o.cliente} · ${o.hito} · ${o.avance}%`, onClick: go(`/seguimiento?otr=${o.id}`) })) },
        { group: 'Materiales', actions: mats.map((m) => ({ id: `m-${m.id}`, label: m.descripcion, description: `${m.tipo} · stock ${m.stock}`, leftSection: <IconBoxSeam size={18} />, onClick: go('/inventario') })) },
        { group: 'Clientes', actions: clientes.map((c) => ({ id: `c-${c.id}`, label: c.nombre, description: c.contacto, leftSection: <IconBuilding size={18} />, onClick: go('/clientes') })) },
      ]}
    />
  );
}
