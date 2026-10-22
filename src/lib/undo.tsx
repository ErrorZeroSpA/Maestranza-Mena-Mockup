import { notifications } from '@mantine/notifications';

/** Aviso con botón «Deshacer». `snapshot` = estado previo del store; `undo` lo restaura. */
export function toastUndo(title: string, message: string, undo: () => void) {
  const id = `undo-${Date.now()}`;
  notifications.show({
    id,
    title,
    autoClose: 9000,
    color: 'gray',
    message: (
      <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <span>{message}</span>
        <button
          onClick={() => { undo(); notifications.hide(id); notifications.show({ message: 'Cambio revertido.', color: 'teal', autoClose: 2500 }); }}
          style={{ font: 'inherit', fontWeight: 700, background: 'none', border: 0, padding: 0, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, textDecorationColor: 'var(--mm-forge)', textDecorationThickness: 2, color: 'inherit', whiteSpace: 'nowrap' }}
        >
          Deshacer
        </button>
      </span>
    ),
  });
}
