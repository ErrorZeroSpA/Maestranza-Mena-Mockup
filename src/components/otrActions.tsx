'use client';

import { Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { Otr } from '@/lib/mock';
import { logEvent, otrStore } from '@/lib/data';
import { toastUndo } from '@/lib/undo';

export function confirmDeleteOtr(o: Otr) {
  modals.openConfirmModal({
    title: `Eliminar OTR ${o.otr}`,
    children: <Text size="sm">Se quitará «{o.titulo}» del seguimiento, del tablero y del cronograma. Esta acción no se puede deshacer.</Text>,
    labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
    confirmProps: { color: 'red' },
    onConfirm: () => { const snap = otrStore.get(); otrStore.remove(o.id); logEvent(`OTR ${o.otr} eliminada`, 'otr'); toastUndo('OTR eliminada', `OTR ${o.otr} eliminada.`, () => otrStore.restore(snap)); },
  });
}
