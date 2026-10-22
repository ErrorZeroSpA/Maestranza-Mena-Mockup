import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SGO · Maestranza Mena',
    short_name: 'SGO',
    description: 'Sistema de Gestión de Operaciones',
    start_url: '/inicio',
    display: 'standalone',
    background_color: '#14161b',
    theme_color: '#14161b',
    icons: [{ src: '/logo.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
