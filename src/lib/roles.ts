import { useSyncExternalStore } from 'react';
import { createStore } from './store';

export type Rol = string;

export type Perm =
  | 'otr.create' | 'otr.edit' | 'otr.move' | 'share'
  | 'cub.edit' | 'cub.cost' | 'cub.approve' | 'hh.edit' | 'cambio.request' | 'cambio.approve' | 'pl.view'
  | 'stock.edit' | 'compras.edit' | 'cliente.edit' | 'cotiza.edit'
  | 'maq.edit' | 'plan.edit' | 'nc.edit' | 'cert.edit' | 'config.admin';

/** Catálogo de acciones, agrupadas como se muestran en la matriz de permisos. */
export const PERM_CATALOG: { id: Perm; label: string; grupo: string }[] = [
  { id: 'otr.create', label: 'Crear órdenes de trabajo', grupo: 'Órdenes' },
  { id: 'otr.edit', label: 'Editar y eliminar órdenes', grupo: 'Órdenes' },
  { id: 'otr.move', label: 'Mover órdenes entre etapas', grupo: 'Órdenes' },
  { id: 'share', label: 'Compartir estado con clientes', grupo: 'Órdenes' },
  { id: 'cub.edit', label: 'Armar la cubicación', grupo: 'Costos y materiales' },
  { id: 'cub.cost', label: 'Costear la cubicación', grupo: 'Costos y materiales' },
  { id: 'cub.approve', label: 'Aprobar la cubicación', grupo: 'Costos y materiales' },
  { id: 'hh.edit', label: 'Registrar horas hombre', grupo: 'Costos y materiales' },
  { id: 'cambio.request', label: 'Solicitar cambios de alcance', grupo: 'Costos y materiales' },
  { id: 'cambio.approve', label: 'Aprobar cambios de alcance', grupo: 'Costos y materiales' },
  { id: 'pl.view', label: 'Ver el resultado de la OTR (P&L)', grupo: 'Costos y materiales' },
  { id: 'stock.edit', label: 'Editar y despachar inventario', grupo: 'Abastecimiento' },
  { id: 'compras.edit', label: 'Gestionar compras y proveedores', grupo: 'Abastecimiento' },
  { id: 'cliente.edit', label: 'Editar clientes', grupo: 'Comercial' },
  { id: 'cotiza.edit', label: 'Crear y editar cotizaciones', grupo: 'Comercial' },
  { id: 'maq.edit', label: 'Operar máquinas y registrar paradas', grupo: 'Planta y calidad' },
  { id: 'plan.edit', label: 'Replanificar en el Gantt', grupo: 'Planta y calidad' },
  { id: 'nc.edit', label: 'Gestionar no conformidades', grupo: 'Planta y calidad' },
  { id: 'cert.edit', label: 'Adjuntar y firmar certificados', grupo: 'Planta y calidad' },
  { id: 'config.admin', label: 'Administrar configuración, usuarios y roles', grupo: 'Administración' },
];

/** Pantallas que un rol puede abrir. */
export const RUTA_CATALOG: { path: string; label: string; grupo: string }[] = [
  { path: '/inicio', label: 'Inicio', grupo: 'Operación' },
  { path: '/seguimiento', label: 'Seguimiento', grupo: 'Operación' },
  { path: '/kanban', label: 'Tablero', grupo: 'Operación' },
  { path: '/gantt', label: 'Gantt', grupo: 'Operación' },
  { path: '/capacidad', label: 'Capacidad', grupo: 'Operación' },
  { path: '/maquinas', label: 'Máquinas', grupo: 'Operación' },
  { path: '/evidencia', label: 'Evidencia', grupo: 'Calidad' },
  { path: '/calidad', label: 'No conformidades', grupo: 'Calidad' },
  { path: '/cotizador', label: 'Cotizador', grupo: 'Comercial' },
  { path: '/clientes', label: 'Clientes', grupo: 'Comercial' },
  { path: '/inventario', label: 'Inventario', grupo: 'Abastecimiento' },
  { path: '/compras', label: 'Compras', grupo: 'Abastecimiento' },
  { path: '/calculadora', label: 'Calculadora de acero', grupo: 'Abastecimiento' },
  { path: '/tareas', label: 'Tareas', grupo: 'Equipo' },
  { path: '/reportes', label: 'Reportes', grupo: 'Equipo' },
  { path: '/configuracion', label: 'Configuración', grupo: 'Administración' },
];

export interface RolDef { id: string; nombre: string; corto: string; desc: string; foco: string; perms: Perm[]; rutas: string[]; sistema?: boolean }

const todasRutas = RUTA_CATALOG.map((r) => r.path);
const sinConfig = todasRutas.filter((p) => p !== '/configuracion');
const comunes = ['/inicio', '/seguimiento', '/kanban', '/gantt', '/evidencia', '/tareas'];

export const ROLES_SEED: RolDef[] = [
  { id: 'gerencia', nombre: 'Gerencia', corto: 'Gerencia', desc: 'Ve y decide todo.', foco: 'Cartera, márgenes, plazos y riesgos.', sistema: true, perms: PERM_CATALOG.map((p) => p.id), rutas: todasRutas },
  { id: 'comercial', nombre: 'Comercial', corto: 'Comercial', desc: 'Clientes, cotizaciones y OTR.', foco: 'Cotizar, aprobar cambios y avisar al cliente.', perms: ['otr.create', 'otr.edit', 'otr.move', 'share', 'cub.edit', 'cub.approve', 'cambio.request', 'cambio.approve', 'pl.view', 'cliente.edit', 'cotiza.edit', 'plan.edit'], rutas: [...comunes, '/cotizador', '/clientes', '/calculadora', '/reportes'] },
  { id: 'produccion', nombre: 'Producción', corto: 'Producción', desc: 'Planta, máquinas y avance.', foco: 'Mover el trabajo por la ruta y registrar horas.', perms: ['otr.move', 'cub.edit', 'hh.edit', 'cambio.request', 'maq.edit', 'plan.edit'], rutas: [...comunes, '/maquinas', '/capacidad', '/calidad', '/inventario', '/calculadora'] },
  { id: 'bodega', nombre: 'Bodega y Adquisiciones', corto: 'Bodega', desc: 'Stock, despachos y compras.', foco: 'Que no falte material cuando una OTR lo necesita.', perms: ['cub.cost', 'stock.edit', 'compras.edit'], rutas: [...comunes, '/inventario', '/compras', '/calculadora'] },
  { id: 'calidad', nombre: 'Calidad', corto: 'Calidad', desc: 'No conformidades y certificados.', foco: 'Trazabilidad ISO 9001 de cada orden.', perms: ['nc.edit', 'cert.edit'], rutas: [...comunes, '/calidad', '/reportes'] },
];

export const rolesStore = createStore(ROLES_SEED);
export const rolDef = (id: Rol): RolDef | undefined => rolesStore.get().find((r) => r.id === id);

export const puede = (rol: Rol, p: Perm) => !!rolDef(rol)?.perms.includes(p);
export const puedeVerRuta = (rol: Rol, path: string) => {
  const k = RUTA_CATALOG.find((r) => path === r.path || path.startsWith(r.path + '/'));
  if (!k) return true;
  return !!rolDef(rol)?.rutas.includes(k.path);
};

/* ---- rol actual (mockup: «ver la app como…», se elige en la barra superior) ---- */
let rol: Rol = 'gerencia';
const subs = new Set<() => void>();
export const setRol = (r: Rol) => {
  rol = r;
  try { localStorage.setItem('sgo-rol', r); } catch { /* sin storage */ }
  subs.forEach((s) => s());
};
export const loadRolPref = () => {
  try { const r = localStorage.getItem('sgo-rol'); if (r && rolDef(r)) { rol = r; subs.forEach((s) => s()); } } catch { /* sin storage */ }
};
/** Rol activo. Se vuelve a renderizar también si cambian los permisos de los roles. */
export const useRol = () => {
  rolesStore.use();
  const r = useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, () => rol, () => 'gerencia' as Rol);
  return rolDef(r) ? r : 'gerencia';
};
export const useRolDef = () => { const r = useRol(); return rolDef(r) ?? ROLES_SEED[0]; };
/** `const can = usePerm(); can('otr.edit')` */
export const usePerm = () => { const r = useRol(); return (p: Perm) => puede(r, p); };
export const NEGADO = 'Tu rol no tiene permiso para esta acción.';
