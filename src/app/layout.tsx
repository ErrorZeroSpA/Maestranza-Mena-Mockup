import type { Metadata, Viewport } from 'next';
import { Archivo, JetBrains_Mono } from 'next/font/google';
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';
import { theme } from '@/lib/theme';
import { Providers } from '@/components/Providers';
import { DeviceSwitcher } from '@/components/DeviceSwitcher';
import { ServiceWorker } from '@/components/ServiceWorker';
import { RouteLoader } from '@/components/RouteLoader';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/spotlight/styles.css';
import './globals.css';

const sans = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-sans' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'SGO · Maestranza Mena',
  description: 'Sistema de Gestión de Operaciones — Maestranza Mena',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#14161b' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" {...mantineHtmlProps} className={`${sans.variable} ${mono.variable}`}>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="light">
          <Providers>{children}</Providers>
          <DeviceSwitcher />
          <ServiceWorker />
          <RouteLoader />
        </MantineProvider>
      </body>
    </html>
  );
}
