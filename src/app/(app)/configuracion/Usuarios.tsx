'use client';

import { useMemo, useState } from 'react';
import { ActionIcon, Badge, Button, Menu, Modal, Select, Text, TextInput } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconDotsVertical, IconMail, IconPencil, IconPlayerPause, IconPlayerPlay, IconSearch, IconSend, IconTrash, IconUserPlus } from '@tabler/icons-react';
import { EmptyState } from '@/components/EmptyState';
import formClasses from '@/components/forms.module.css';
import { audit, relFecha, uid, useConfig, usuarioStore } from '@/lib/data';
import { rolDef, rolesStore } from '@/lib/roles';
import { EstadoUsuario, Usuario } from '@/lib/mock';
import { toastUndo } from '@/lib/undo';
import classes from './configuracion.module.css';

const TONO: Record<EstadoUsuario, string> = { Activo: 'teal', Invitado: 'yellow', Suspendido: 'red' };
const iniciales = (n: string) => n.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
const blank = (): Usuario => ({ id: uid('u'), nombre: '', email: '', rol: 'produccion', estado: 'Invitado', creado: new Date().toISOString().slice(0, 10) });

export function Usuarios() {
  const usuarios = usuarioStore.use();
  const roles = rolesStore.use();
  const conf = useConfig();
  const [q, setQ] = useState('');
  const [fRol, setFRol] = useState<string>('todos');
  const [ed, setEd] = useState<{ u: Usuario; nuevo: boolean } | null>(null);
  const [err, setErr] = useState('');

  const filas = useMemo(() => usuarios.filter((u) => (fRol === 'todos' || u.rol === fRol) && `${u.nombre} ${u.email}`.toLowerCase().includes(q.toLowerCase())), [usuarios, fRol, q]);
  const conteo = (e: EstadoUsuario) => usuarios.filter((u) => u.estado === e).length;
  const nombreRol = (id: string) => roles.find((r) => r.id === id)?.nombre ?? id;

  /** Quedaría al menos un administrador activo si este usuario cambia de rol, se suspende o se elimina? */
  const quedaAdmin = (excluir: string, nuevoRol?: string) =>
    usuarios.some((u) => u.estado === 'Activo' && u.id !== excluir && !!rolDef(u.rol)?.perms.includes('config.admin')) || (!!nuevoRol && !!rolDef(nuevoRol)?.perms.includes('config.admin'));
  const bloqueo = () => notifications.show({ title: 'No se puede', message: 'Debe quedar al menos un administrador activo.', color: 'orange' });

  const cambiarRol = (u: Usuario, rol: string) => {
    if (rol === u.rol) return;
    if (!quedaAdmin(u.id, rol) && !!rolDef(u.rol)?.perms.includes('config.admin')) return bloqueo();
    const snap = usuarioStore.get();
    usuarioStore.update(u.id, { rol });
    audit('usuario', 'Cambió el rol de un usuario', `${u.email}: ${nombreRol(u.rol)} → ${nombreRol(rol)}`);
    toastUndo('Rol actualizado', `${u.nombre} ahora es ${nombreRol(rol)}`, () => usuarioStore.restore(snap));
  };
  const cambiarEstado = (u: Usuario, estado: EstadoUsuario) => {
    if (estado === 'Suspendido' && !quedaAdmin(u.id) && !!rolDef(u.rol)?.perms.includes('config.admin')) return bloqueo();
    const snap = usuarioStore.get();
    usuarioStore.update(u.id, { estado });
    audit('usuario', estado === 'Suspendido' ? 'Suspendió a un usuario' : 'Reactivó a un usuario', u.email);
    toastUndo(estado === 'Suspendido' ? 'Usuario suspendido' : 'Usuario reactivado', u.nombre, () => usuarioStore.restore(snap));
  };
  const eliminar = (u: Usuario) => {
    if (!quedaAdmin(u.id) && !!rolDef(u.rol)?.perms.includes('config.admin')) return bloqueo();
    modals.openConfirmModal({ title: 'Eliminar usuario', children: <Text size="sm">{u.nombre} perderá el acceso de inmediato. Su historial de acciones se conserva en la auditoría.</Text>, labels: { confirm: 'Eliminar', cancel: 'Cancelar' }, confirmProps: { color: 'red' }, onConfirm: () => { const snap = usuarioStore.get(); usuarioStore.remove(u.id); audit('usuario', 'Eliminó a un usuario', u.email); toastUndo('Usuario eliminado', u.nombre, () => usuarioStore.restore(snap)); } });
  };
  const guardar = () => {
    if (!ed) return;
    const { u, nuevo } = ed;
    if (!u.nombre.trim()) return setErr('Escribe el nombre.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(u.email)) return setErr('Escribe un correo válido.');
    if (nuevo && usuarios.some((x) => x.email.toLowerCase() === u.email.toLowerCase())) return setErr('Ese correo ya está registrado.');
    if (!nuevo && !quedaAdmin(u.id, u.rol) && !!rolDef(usuarios.find((x) => x.id === u.id)?.rol ?? '')?.perms.includes('config.admin')) return bloqueo();
    if (nuevo) { usuarioStore.add(u); audit('usuario', 'Invitó a un usuario', `${u.email} como ${nombreRol(u.rol)}`); notifications.show({ title: 'Invitación enviada', message: `${u.email} recibirá un correo para entrar con Google.`, color: 'teal' }); }
    else { usuarioStore.update(u.id, u); audit('usuario', 'Editó a un usuario', u.email); notifications.show({ message: 'Usuario actualizado.', color: 'teal' }); }
    setEd(null); setErr('');
  };
  const fueraDominio = ed && ed.u.email.includes('@') && !ed.u.email.toLowerCase().endsWith('@' + conf.dominio.toLowerCase());

  return (
    <div className={classes.stack}>
      <header className={classes.head}>
        <div><h2>Usuarios</h2><p>{conteo('Activo')} activos · {conteo('Invitado')} con invitación pendiente · {conteo('Suspendido')} suspendidos</p></div>
        <Button color="forja" leftSection={<IconUserPlus size={16} />} onClick={() => { setErr(''); setEd({ u: blank(), nuevo: true }); }}>Invitar usuario</Button>
      </header>
      <div className={classes.tools}>
        <TextInput size="xs" w={260} placeholder="Buscar nombre o correo" aria-label="Buscar usuarios" leftSection={<IconSearch size={14} />} value={q} onChange={(e) => setQ(e.currentTarget.value)} />
        <div className={classes.chipsRow} role="tablist" aria-label="Filtrar por rol">
          {[{ id: 'todos', nombre: 'Todos' }, ...roles].map((r) => <button key={r.id} role="tab" aria-selected={fRol === r.id} data-on={fRol === r.id || undefined} onClick={() => setFRol(r.id)}>{'corto' in r ? r.corto : r.nombre}</button>)}
        </div>
      </div>

      {filas.length === 0 ? <EmptyState icon={<IconSearch size={30} stroke={1.4} />} title="Ningún usuario coincide" text="Prueba con otro nombre o rol." /> : (
        <div className={classes.table}>
          <div className={classes.th} style={{ gridTemplateColumns: 'minmax(220px,1.4fr) 200px 120px 130px 40px' }}><span>Usuario</span><span>Rol</span><span>Estado</span><span>Último acceso</span><span /></div>
          {filas.map((u) => (
            <div key={u.id} className={classes.row} style={{ gridTemplateColumns: 'minmax(220px,1.4fr) 200px 120px 130px 40px' }} data-off={u.estado === 'Suspendido' || undefined}>
              <span className={classes.user}><i aria-hidden>{iniciales(u.nombre)}</i><span><b>{u.nombre}</b><small>{u.email}</small></span></span>
              <Select size="xs" aria-label={`Rol de ${u.nombre}`} allowDeselect={false} value={u.rol} onChange={(v) => v && cambiarRol(u, v)} data={roles.map((r) => ({ value: r.id, label: r.nombre }))} />
              <span><Badge color={TONO[u.estado]} variant="light" radius="xs">{u.estado}</Badge></span>
              <span className="mono num">{u.ultimoAcceso ? relFecha(u.ultimoAcceso) : 'Nunca'}</span>
              <Menu position="bottom-end" withinPortal>
                <Menu.Target><ActionIcon variant="subtle" color="gray" aria-label={`Acciones de ${u.nombre}`}><IconDotsVertical size={16} /></ActionIcon></Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item leftSection={<IconPencil size={14} />} onClick={() => { setErr(''); setEd({ u, nuevo: false }); }}>Editar</Menu.Item>
                  {u.estado === 'Invitado' && <Menu.Item leftSection={<IconSend size={14} />} onClick={() => { audit('usuario', 'Reenvió una invitación', u.email); notifications.show({ message: `Invitación reenviada a ${u.email}.`, color: 'teal' }); }}>Reenviar invitación</Menu.Item>}
                  {u.estado === 'Suspendido' ? <Menu.Item leftSection={<IconPlayerPlay size={14} />} onClick={() => cambiarEstado(u, 'Activo')}>Reactivar</Menu.Item> : <Menu.Item leftSection={<IconPlayerPause size={14} />} onClick={() => cambiarEstado(u, 'Suspendido')}>Suspender acceso</Menu.Item>}
                  <Menu.Divider />
                  <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => eliminar(u)}>Eliminar</Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </div>
          ))}
        </div>
      )}

      <Modal opened={!!ed} onClose={() => setEd(null)} size={520} padding="lg" title={<b>{ed?.nuevo ? 'Invitar usuario' : 'Editar usuario'}</b>}>
        {ed && (
          <div className={formClasses.form}>
            <TextInput label="Nombre completo" required autoFocus value={ed.u.nombre} onChange={(e) => setEd({ ...ed, u: { ...ed.u, nombre: e.currentTarget.value } })} />
            <TextInput label="Correo de Google" required type="email" value={ed.u.email} disabled={!ed.nuevo} onChange={(e) => setEd({ ...ed, u: { ...ed.u, email: e.currentTarget.value } })} error={err || undefined} leftSection={<IconMail size={15} />} />
            {fueraDominio && <Text size="xs" c="orange">Este correo no es @{conf.dominio}. Solo podrá entrar si agregas su dominio en General.</Text>}
            <Select label="Rol" allowDeselect={false} value={ed.u.rol} onChange={(v) => v && setEd({ ...ed, u: { ...ed.u, rol: v } })} data={roles.map((r) => ({ value: r.id, label: `${r.nombre} — ${r.desc}` }))} />
            {ed.nuevo && <Text size="xs" c="dimmed">Recibirá un correo con el enlace para entrar con su cuenta de Google. Mientras no acepte, queda como «Invitado».</Text>}
            <div className={formClasses.foot}><Button variant="default" onClick={() => setEd(null)}>Cancelar</Button><Button color="forja" onClick={guardar}>{ed.nuevo ? 'Enviar invitación' : 'Guardar'}</Button></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
