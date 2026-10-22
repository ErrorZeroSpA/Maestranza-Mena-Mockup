'use client';

import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ModalsProvider modalProps={{ centered: true, transitionProps: { transition: 'pop', duration: 160 } }}>
      <Notifications position="bottom-right" zIndex={1000} />
      {children}
    </ModalsProvider>
  );
}
