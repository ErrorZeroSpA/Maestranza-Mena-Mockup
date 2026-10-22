import { createStore } from './store';
import { AUDIT_SEED, CONFIG_SEED, USUARIOS_SEED, CERT_SEED, OC_SEED, PROV_SEED, COT_SEED, MAQ_SEED, PARADAS_SEED, CAMBIOS_SEED, CLIENTES, CUB_SEED, HH_SEED, LOG_SEED, MATERIALES, NC_SEED, Otr, OTRS, Semaforo, TAREAS } from './mock';
import { DEMO } from './evidencia';
import { RUTA, type Evento } from './mock';

export const otrStore = createStore(OTRS);
export const matStore = createStore(MATERIALES);
export const tareaStore = createStore(TAREAS);
export const evStore = createStore(DEMO);
export const clienteStore = createStore(CLIENTES);
export const hhStore = createStore(HH_SEED);
export const cambioStore = createStore(CAMBIOS_SEED);
export const cubStore = createStore(CUB_SEED);
export const ncStore = createStore(NC_SEED);
export const logStore = createStore(LOG_SEED);
export const cotStore = createStore(COT_SEED);
export const provStore = createStore(PROV_SEED);
export const ocStore = createStore(OC_SEED);
export const certStore = createStore(CERT_SEED);
export const usuarioStore = createStore(USUARIOS_SEED);
export const configStore = createStore(CONFIG_SEED);
export const auditStore = createStore(AUDIT_SEED);

/** Parámetros de la empresa (siempre existe un único documento). */
export const cfg = () => configStore.get()[0];
export const useConfig = () => configStore.use()[0];
export const guardarConfig = (patch: Partial<Omit<typeof CONFIG_SEED[number], 'id'>>) => configStore.update('cfg', patch);

/** Registra un cambio administrativo (usuarios, roles, parámetros, accesos). */
export const audit = (tipo: 'usuario' | 'rol' | 'config' | 'acceso', accion: string, detalle: string, actor = 'Felipe Romero') =>
  auditStore.add({ id: uid('a'), fecha: new Date().toISOString().slice(0, 19), actor, tipo, accion, detalle });
export const maqStore = createStore(MAQ_SEED);
export const paradaStore = createStore(PARADAS_SEED);

/** Registra un evento en la bitácora global (aparece en Historial, Inicio y la ficha de la OTR). */
export const logEvent = (texto: string, tipo: Evento['tipo'], otrId?: string, autor = 'Felipe Romero') =>
  logStore.add({ id: uid('e'), fecha: new Date().toISOString().slice(0, 19), texto, autor, otrId, tipo });

export const HOY = '2026-10-21'; // fecha del mockup

export const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export const isoToDmy = (iso: string) => iso.split('-').reverse().join('-');
export const dmyToIso = (dmy: string) => dmy.split('-').reverse().join('-');
export const diasHasta = (iso: string) => Math.round((new Date(iso + 'T12:00:00Z').getTime() - new Date(HOY + 'T12:00:00Z').getTime()) / 86400000);

/** Semáforo de avance y de plazo a partir de datos simples. */
export function semaforo(o: Pick<Otr, 'avance' | 'plazoDias'>): [Semaforo, Semaforo] {
  const c = cfg();
  const plazo: Semaforo = o.plazoDias < 0 ? 'crit' : o.plazoDias <= c.plazoCritico && o.avance < 70 ? 'crit' : o.plazoDias <= c.plazoAlerta && o.avance < 50 ? 'warn' : 'ok';
  const av: Semaforo = o.avance === 0 ? 'crit' : o.avance < 25 && o.plazoDias < 60 ? 'warn' : 'ok';
  return [av, plazo];
}

/** "Hoy 09:40", "Ayer 16:12" o "19-10-2026" */
export function relFecha(iso: string) {
  const d = iso.slice(0, 10);
  const hm = iso.length > 10 ? ` ${iso.slice(11, 16)}` : '';
  if (d === HOY) return `Hoy${hm}`;
  if (diasHasta(d) === -1) return `Ayer${hm}`;
  return isoToDmy(d);
}

/** Mueve una OTR a la estación k de la ruta (0–7) y sincroniza avance, hito, etapa y semáforo. */
export function irAEstacion(o: Otr, k: number, autor = 'Operador (QR)') {
  const total = RUTA.length;
  const est = Math.max(0, Math.min(total - 1, k));
  const avance = est === 0 ? 0 : Math.min(99, Math.ceil((est * 100) / total));
  const etapa = est <= 1 ? 'ingreso' : est <= 5 ? 'proceso' : est === 6 ? 'validacion' : 'despacho';
  otrStore.update(o.id, { avance, hito: RUTA[est], etapa, semaforo: semaforo({ avance, plazoDias: o.plazoDias }) });
  logEvent(`Avance: ${RUTA[est]} (${avance}%)`, 'otr', o.id, autor);
}
export function entregar(o: Otr, autor = 'Operador (QR)') {
  otrStore.update(o.id, { avance: 100, hito: 'Entregada', etapa: 'despacho', semaforo: ['ok', 'ok'] });
  logEvent('OTR entregada al cliente (100%)', 'otr', o.id, autor);
}
