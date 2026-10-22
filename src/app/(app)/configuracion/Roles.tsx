'use client';

import { useState } from 'react';
import { Button, Modal, Select, Switch, Text, TextInput, Tooltip } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconCopy, IconLock, IconPlus, IconRestore, IconTrash } from '@tabler/icons-react';
import formClasses from '@/components/forms.module.css';
import { audit, uid, usuarioStore } from '@/lib/data';
import { Perm, PERM_CATALOG, RolDef, ROLES_SEED, rolDef, rolesStore, RUTA_CATALOG } from '@/lib/roles';
import { toastUndo } from '@/lib/undo';
import classes from './configuracion.module.css';

const agrupar = <T extends { grupo: string }>(xs: T[]) => xs.reduce<Record<string, T[]>>((m, x) => ((m[x.grupo] ??= []).push(x), m), {});

export function Roles() {
  const roles = rolesStore.use();
  const usuarios = usuarioStore.use();
  const [selId, setSelId] = useState('gerencia');
  const [nuevo, setNuevo] = useState<{ nombre: string; copiar: string } | null>(null);
  const r = roles.find((x) => x.id === selId) ?? roles[0];
  const usuariosDe = (id: string) => usuarios.filter((u) => u.rol === id);
  const bloqueado = r.id === 'gerencia';

  /** ¿Seguiría habiendo un administrador activo tras el cambio? */
  const quedaAdmin = (rolId: string, perms: Perm[]) => usuarios.some((u) => u.estado === 'Activo' && (u.rol === rolId ? perms : rolDef(u.rol)?.perms ?? []).includes('config.admin'));

  const setPerm = (p: Perm, on: boolean) => {
    const perms = on ? [...r.perms, p] : r.perms.filter((x) => x !== p);
    if (p === 'config.admin' && !on && !quedaAdmin(r.id, perms)) return notifications.show({ title: 'No se puede', message: 'Debe existir al menos un rol de administración con usuarios activos.', color: 'orange' });
    rolesStore.update(r.id, { perms });
    audit('rol', 'Cambió permisos', `${r.nombre}: ${on ? '+' : '−'} ${PERM_CATALOG.find((x) => x.id === p)?.label}`);
  };
  const setGrupo = (ids: Perm[], on: boolean) => {
    if (!on && ids.includes('config.admin') && !quedaAdmin(r.id, r.perms.filter((x) => !ids.includes(x)))) return notifications.show({ message: 'Debe quedar un administrador activo.', color: 'orange' });
    const perms = on ? [...new Set([...r.perms, ...ids])] : r.perms.filter((x) => !ids.includes(x));
    rolesStore.update(r.id, { perms });
    audit('rol', 'Cambió permisos en bloque', `${r.nombre}: ${on ? 'activó' : 'quitó'} ${ids.length} acciones`);
  };
  const setRuta = (path: string, on: boolean) => {
    if (path === '/configuracion' && !on && r.perms.includes('config.admin')) return notifications.show({ message: 'Un rol con permiso de administración necesita ver Configuración.', color: 'orange' });
    rolesStore.update(r.id, { rutas: on ? [...r.rutas, path] : r.rutas.filter((x) => x !== path) });
    audit('rol', 'Cambió pantallas visibles', `${r.nombre}: ${on ? '+' : '−'} ${RUTA_CATALOG.find((x) => x.path === path)?.label}`);
  };
  const crear = () => {
    if (!nuevo?.nombre.trim()) return;
    const base = rolDef(nuevo.copiar);
    const def: RolDef = { id: `rol-${uid('').slice(-5)}`, nombre: nuevo.nombre.trim(), corto: nuevo.nombre.trim().slice(0, 12), desc: 'Rol personalizado', foco: 'Define aquí qué debe lograr este rol.', perms: (base?.perms ?? []).filter((p) => p !== 'config.admin'), rutas: (base?.rutas ?? ['/inicio', '/tareas']).filter((x) => x !== '/configuracion') };
    rolesStore.add(def);
    audit('rol', 'Creó un rol', `${def.nombre} (copiado de ${base?.nombre ?? 'vacío'})`);
    setSelId(def.id); setNuevo(null);
    notifications.show({ title: 'Rol creado', message: `${def.nombre}: ajusta sus permisos a la derecha.`, color: 'teal' });
  };
  const restablecer = () => {
    const seed = ROLES_SEED.find((x) => x.id === r.id); if (!seed) return;
    if (!quedaAdmin(r.id, seed.perms)) return notifications.show({ message: 'Debe quedar un administrador activo.', color: 'orange' });
    const snap = rolesStore.get();
    rolesStore.update(r.id, { perms: seed.perms, rutas: seed.rutas });
    audit('rol', 'Restableció un rol', `${r.nombre} volvió a sus valores originales`);
    toastUndo('Rol restablecido', r.nombre, () => rolesStore.restore(snap));
  };
  const eliminar = () => {
    if (r.sistema || ROLES_SEED.some((s) => s.id === r.id)) return;
    if (usuariosDe(r.id).length) return notifications.show({ title: 'No se puede eliminar', message: `Tiene ${usuariosDe(r.id).length} usuario(s). Cámbialos de rol primero.`, color: 'orange' });
    modals.openConfirmModal({ title: 'Eliminar rol', children: <Text size="sm">Se eliminará «{r.nombre}».</Text>, labels: { confirm: 'Eliminar', cancel: 'Cancelar' }, confirmProps: { color: 'red' }, onConfirm: () => { const snap = rolesStore.get(); rolesStore.remove(r.id); setSelId('gerencia'); audit('rol', 'Eliminó un rol', r.nombre); toastUndo('Rol eliminado', r.nombre, () => rolesStore.restore(snap)); } });
  };

  const grupos = agrupar(PERM_CATALOG);
  const rutas = agrupar(RUTA_CATALOG);
  const esBase = ROLES_SEED.some((s) => s.id === r.id);

  return (
    <div className={classes.stack}>
      <header className={classes.head}>
        <div><h2>Roles y permisos</h2><p>Los cambios se aplican de inmediato a quienes tengan el rol. Gerencia siempre conserva todo.</p></div>
        <Button color="forja" leftSection={<IconPlus size={16} />} onClick={() => setNuevo({ nombre: '', copiar: 'produccion' })}>Nuevo rol</Button>
      </header>

      <div className={classes.rolesLayout}>
        <ul className={classes.rolesList} aria-label="Roles">
          {roles.map((x) => (
            <li key={x.id}>
              <button data-on={x.id === r.id || undefined} onClick={() => setSelId(x.id)}>
                <b>{x.nombre}{x.id === 'gerencia' && <IconLock size={12} aria-label="Bloqueado" />}</b>
                <small>{usuariosDe(x.id).length} {usuariosDe(x.id).length === 1 ? 'usuario' : 'usuarios'} · {x.perms.length} acciones</small>
              </button>
            </li>
          ))}
        </ul>

        <div className={classes.roleEditor}>
          <div className={classes.roleHead}>
            <TextInput aria-label="Nombre del rol" value={r.nombre} disabled={bloqueado} onChange={(e) => rolesStore.update(r.id, { nombre: e.currentTarget.value, corto: e.currentTarget.value.slice(0, 12) })} onBlur={() => audit('rol', 'Renombró un rol', r.nombre)} />
            <TextInput aria-label="Descripción del rol" placeholder="Descripción corta" value={r.desc} disabled={bloqueado} onChange={(e) => rolesStore.update(r.id, { desc: e.currentTarget.value })} />
            <div className={classes.roleBtns}>
              {esBase && !bloqueado && <Button size="xs" variant="default" leftSection={<IconRestore size={14} />} onClick={restablecer}>Restablecer</Button>}
              <Button size="xs" variant="default" leftSection={<IconCopy size={14} />} onClick={() => setNuevo({ nombre: `${r.nombre} (copia)`, copiar: r.id })}>Duplicar</Button>
              {!esBase && <Button size="xs" color="red" variant="light" leftSection={<IconTrash size={14} />} onClick={eliminar}>Eliminar</Button>}
            </div>
          </div>
          {bloqueado && <p className={classes.lock}><IconLock size={14} /> Gerencia tiene todos los permisos y pantallas, y no se puede restringir.</p>}

          <h3>Qué puede hacer <small className="num">{r.perms.length} de {PERM_CATALOG.length}</small></h3>
          <div className={classes.permGrid}>
            {Object.entries(grupos).map(([g, ps]) => {
              const ids = ps.map((p) => p.id);
              const todas = ids.every((i) => r.perms.includes(i));
              return (
                <section key={g} className={classes.permCard}>
                  <header><b>{g}</b><Tooltip label={todas ? 'Quitar todas' : 'Dar todas'}><span><Switch size="xs" color="forja" aria-label={`Todas las acciones de ${g}`} disabled={bloqueado} checked={todas} onChange={(e) => setGrupo(ids, e.currentTarget.checked)} /></span></Tooltip></header>
                  {ps.map((p) => (
                    <label key={p.id}><span>{p.label}</span><Switch size="xs" color="forja" aria-label={p.label} disabled={bloqueado} checked={r.perms.includes(p.id)} onChange={(e) => setPerm(p.id, e.currentTarget.checked)} /></label>
                  ))}
                </section>
              );
            })}
          </div>

          <h3>Qué pantallas ve <small className="num">{r.rutas.length} de {RUTA_CATALOG.length}</small></h3>
          <div className={classes.permGrid}>
            {Object.entries(rutas).map(([g, ps]) => (
              <section key={g} className={classes.permCard}>
                <header><b>{g}</b></header>
                {ps.map((p) => (
                  <label key={p.path}><span>{p.label}</span><Switch size="xs" color="forja" aria-label={`Pantalla ${p.label}`} disabled={bloqueado} checked={r.rutas.includes(p.path)} onChange={(e) => setRuta(p.path, e.currentTarget.checked)} /></label>
                ))}
              </section>
            ))}
          </div>
        </div>
      </div>

      <Modal opened={!!nuevo} onClose={() => setNuevo(null)} size={480} padding="lg" title={<b>Nuevo rol</b>}>
        {nuevo && (
          <div className={formClasses.form}>
            <TextInput label="Nombre del rol" required autoFocus placeholder="Ej: Supervisor de turno" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.currentTarget.value })} />
            <Select label="Empezar copiando los permisos de" allowDeselect={false} value={nuevo.copiar} onChange={(v) => v && setNuevo({ ...nuevo, copiar: v })} data={roles.map((x) => ({ value: x.id, label: x.nombre }))} />
            <Text size="xs" c="dimmed">El rol nuevo nunca incluye permisos de administración; los puedes ajustar después.</Text>
            <div className={formClasses.foot}><Button variant="default" onClick={() => setNuevo(null)}>Cancelar</Button><Button color="forja" onClick={crear} disabled={!nuevo.nombre.trim()}>Crear rol</Button></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
