import { ReactNode } from 'react';
import classes from './EmptyState.module.css';

/** Estado vacío: dice qué falta, por qué importa y qué hacer ahora. */
export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className={classes.box}>
      <span className={classes.ico}>{icon}</span>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}
