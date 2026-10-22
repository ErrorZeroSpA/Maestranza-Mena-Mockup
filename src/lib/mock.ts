export type Area = 'Ingeniería' | 'Fabricación y Estructuras' | 'Mantenimiento y Reparación' | 'Mecanizado CNC' | 'Terminaciones';
export type Semaforo = 'ok' | 'warn' | 'crit';
export type Etapa = 'ingreso' | 'proceso' | 'validacion' | 'despacho';

export interface Otr {
  id: string;
  otr: number;
  titulo: string;
  cliente: string;
  area: Area;
  hito: string;
  etapa: Etapa;
  avance: number; // 0-100
  iq: number;
  plazoDias: number;
  entrega: string; // dd-mm-aaaa
  comercial?: string;
  lote?: string;
  pendientes: string[];
  semaforo: [Semaforo, Semaforo];
  piezas?: string;
  venta?: number; // precio de venta (CLP)
  hhEst?: number; // horas hombre estimadas (cotización)
  matEst?: number; // costo de materiales estimado (cotización)
  cubPaso?: number; // 0 Creación · 1 Costeo · 2 Aprobación · 3 Consumo
  cubConsumida?: boolean; // materiales ya descontados de bodega
  inicio: string; // ISO
  fin: string; // ISO
}

export const AREA_COLOR: Record<Area, string> = {
  'Fabricación y Estructuras': 'var(--mm-area-estructura)',
  'Mantenimiento y Reparación': 'var(--mm-area-mecanica)',
  'Mecanizado CNC': 'var(--mm-area-mecanizado)',
  Ingeniería: 'var(--mm-area-ing)',
  'Terminaciones': 'var(--mm-area-olla)',
};

const RAW: Omit<Otr, 'id'>[] = [
  { otr: 3505, titulo: 'REP. MÁQUINA PUNZONADORA N4', cliente: 'CHAGRES', area: 'Mantenimiento y Reparación', hito: 'Decisión: Reparar o Entregar', etapa: 'proceso', avance: 30, iq: 100, plazoDias: 391, entrega: '01-02-2027', comercial: 'Esta máquina debe repararse.', pendientes: ['Packing List', 'Carta Gantt'], semaforo: ['crit', 'crit'], piezas: '1/2', inicio: '2026-08-12', fin: '2026-09-26' },
  { otr: 4122, titulo: 'MÓDULOS ESCALERA PROYECTO BHP ECS 2026 / Tipo 1: Bodegas (6/10)', cliente: 'BHP', area: 'Fabricación y Estructuras', hito: 'Dimensionado', etapa: 'ingreso', avance: 12, iq: 94, plazoDias: 38, entrega: '16-10-2026', lote: 'FABRICACIÓN CÁMARAS RADIANTES', pendientes: ['Packing List', 'Carta Gantt'], semaforo: ['crit', 'crit'], piezas: '16/10', inicio: '2026-08-11', fin: '2026-09-18' },
  { otr: 4122, titulo: 'MÓDULOS ESCALERA PROYECTO BHP ECS 2026 / Tipo 1: Bodegas (5/10)', cliente: 'BHP', area: 'Fabricación y Estructuras', hito: 'Dimensionado', etapa: 'ingreso', avance: 14, iq: 94, plazoDias: 38, entrega: '16-10-2026', pendientes: ['Packing List'], semaforo: ['crit', 'crit'], piezas: '16/10', inicio: '2026-08-11', fin: '2026-09-18' },
  { otr: 4122, titulo: 'MÓDULOS ESCALERA PROYECTO BHP ECS 2026 / Tipo 1: Bodegas (3/10)', cliente: 'BHP', area: 'Fabricación y Estructuras', hito: 'Armado', etapa: 'proceso', avance: 46, iq: 94, plazoDias: 38, entrega: '25-09-2026', pendientes: ['Carta Gantt'], semaforo: ['crit', 'crit'], piezas: '25/9', inicio: '2026-08-11', fin: '2026-09-18' },
  { otr: 3952, titulo: 'VÁLVULA NELES 20" C / ACTUADOR NEUMÁTICO', cliente: 'ESCONDIDA', area: 'Mantenimiento y Reparación', hito: 'Decisión: Reparar o Entregar', etapa: 'proceso', avance: 100, iq: 100, plazoDias: 120, entrega: '30-11-2026', pendientes: ['Packing List', 'Carta Gantt'], semaforo: ['crit', 'ok'], piezas: '2/2', inicio: '2026-08-01', fin: '2026-09-10' },
  { otr: 4376, titulo: 'CTTO 32400081 — CUÑA ESCORIAL N8', cliente: 'CODELCO', area: 'Fabricación y Estructuras', hito: 'Corte', etapa: 'proceso', avance: 58, iq: 97, plazoDias: 62, entrega: '04-12-2026', pendientes: ['Carta Gantt'], semaforo: ['warn', 'crit'], piezas: '3/5', inicio: '2026-08-19', fin: '2026-09-26' },
  { otr: 4364, titulo: 'CTTO 32400081 — BOTE RECHAZADO ÁNODOS', cliente: 'CODELCO', area: 'Fabricación y Estructuras', hito: 'Habilitado', etapa: 'ingreso', avance: 20, iq: 99, plazoDias: 70, entrega: '10-12-2026', pendientes: [], semaforo: ['ok', 'warn'], inicio: '2026-08-24', fin: '2026-09-26' },
  { otr: 4403, titulo: 'REPARACIÓN CILINDRO HIDRÁULICO', cliente: 'ANTUCOYA', area: 'Mantenimiento y Reparación', hito: 'Desarme', etapa: 'ingreso', avance: 8, iq: 100, plazoDias: 40, entrega: '12-11-2026', pendientes: ['Packing List'], semaforo: ['warn', 'ok'], inicio: '2026-09-02', fin: '2026-09-26' },
  { otr: 4301, titulo: 'MTTO ENROLLADOR', cliente: 'CAROLA', area: 'Mantenimiento y Reparación', hito: 'Inspección', etapa: 'ingreso', avance: 5, iq: 100, plazoDias: 45, entrega: '20-11-2026', pendientes: [], semaforo: ['ok', 'ok'], inicio: '2026-08-31', fin: '2026-09-26' },
  { otr: 4362, titulo: 'CONECTORES GALVANIZADOS MINERÍA P5', cliente: 'ZALDÍVAR', area: 'Fabricación y Estructuras', hito: 'Galvanizado', etapa: 'proceso', avance: 72, iq: 98, plazoDias: 30, entrega: '05-10-2026', pendientes: [], semaforo: ['ok', 'ok'], inicio: '2026-08-11', fin: '2026-09-24' },
  { otr: 4334, titulo: 'CONECTOR MD CIPERF 18MM 80X60X5X16MM GA', cliente: 'ZALDÍVAR', area: 'Mecanizado CNC', hito: 'Mecanizado CNC', etapa: 'proceso', avance: 64, iq: 96, plazoDias: 33, entrega: '09-10-2026', pendientes: [], semaforo: ['ok', 'warn'], inicio: '2026-08-11', fin: '2026-09-26' },
  { otr: 4261, titulo: 'MODIFICACIONES TESTERAS GENNER', cliente: 'GENNER', area: 'Mantenimiento y Reparación', hito: 'Paletizado', etapa: 'despacho', avance: 90, iq: 100, plazoDias: 14, entrega: '28-09-2026', pendientes: ['Packing List', 'Carta Gantt'], semaforo: ['crit', 'crit'], piezas: '1/10', inicio: '2026-08-11', fin: '2026-09-19' },
];

const addDays = (iso: string, d: number) => new Date(new Date(iso + 'T12:00:00Z').getTime() + d * 86400000).toISOString().slice(0, 10);
// Fechas de ejemplo corridas para que el cronograma envuelva la fecha "hoy" del mockup (21-oct-2026)
const HH_EST = [40, 210, 210, 210, 60, 90, 70, 36, 24, 80, 52, 30];
const MAT_EST = [2600000, 3200000, 3200000, 3200000, 900000, 2800000, 1900000, 700000, 400000, 2400000, 1300000, 900000];
const VENTAS = [18500000, 9800000, 9800000, 9800000, 6400000, 12600000, 7300000, 3900000, 2200000, 8100000, 5600000, 4700000];
export const OTRS: Otr[] = RAW.map((o, i) => ({ ...o, id: `o${i + 1}`, venta: VENTAS[i], cubPaso: i % 4, hhEst: HH_EST[i], matEst: MAT_EST[i], inicio: addDays(o.inicio, 52), fin: addDays(o.fin, 52) }));

export const ETAPAS: { key: Etapa; label: string }[] = [
  { key: 'ingreso', label: 'Ingreso / Prep' },
  { key: 'proceso', label: 'En proceso' },
  { key: 'validacion', label: 'Validación / Control' },
  { key: 'despacho', label: 'Terminado / Despacho' },
];

export interface MaterialRow { id: string; tipo: string; descripcion: string; precio: number; stock: number; unidad: string }
const MAT_RAW: Omit<MaterialRow, 'id'>[] = [
  { tipo: 'ACOPLE', descripcion: 'STORZ 2" -2" HI BSP ALUMINIO', precio: 17800, stock: 0, unidad: 'UNID' },
  { tipo: 'ÁNGULO', descripcion: 'LAMINADO 80X80X6X6MM', precio: 40700, stock: 14, unidad: 'UNID' },
  { tipo: 'ÁNGULO', descripcion: 'LAMINADO 100X100X8MM', precio: 62300, stock: 3, unidad: 'UNID' },
  { tipo: 'CANAL', descripcion: '150 X 75 X 6 MM', precio: 70330, stock: 0, unidad: 'UNID' },
  { tipo: 'COM-CAUCHO', descripcion: 'MANGA VÁLVULA PINCH 12X750mm', precio: 2998908, stock: 0, unidad: 'UNID' },
  { tipo: 'PLANCHA', descripcion: 'ACERO A36 10X1500X3000MM', precio: 412000, stock: 22, unidad: 'UNID' },
  { tipo: 'PLANCHA', descripcion: 'ACERO INOX 304 6X1220X2440MM', precio: 538900, stock: 2, unidad: 'UNID' },
  { tipo: 'FILTRO REGULADOR', descripcion: 'FRL 1/2" NPT CON MANÓMETRO', precio: 68500, stock: 5, unidad: 'UNID' },
];

export const MATERIALES: MaterialRow[] = MAT_RAW.map((m, i) => ({ ...m, id: `m${i + 1}` }));

export interface Tarea { id: number; titulo: string; otr?: number; responsable: string; vence: string; prioridad: 'Alta' | 'Media' | 'Baja'; estado: 'Pendiente' | 'En curso' | 'Hecha'; }
export const TAREAS: Tarea[] = [
  { id: 1, titulo: 'Cotizar manga válvula pinch con 2 proveedores', otr: 3505, responsable: 'Felipe Romero', vence: '23-10-2026', prioridad: 'Alta', estado: 'En curso' },
  { id: 2, titulo: 'Confirmar fecha de galvanizado con planta', otr: 4362, responsable: 'Felipe Romero', vence: '22-10-2026', prioridad: 'Alta', estado: 'Pendiente' },
  { id: 3, titulo: 'Emitir packing list lote Bodegas 5/10', otr: 4122, responsable: 'Bodega', vence: '26-10-2026', prioridad: 'Media', estado: 'Pendiente' },
  { id: 4, titulo: 'Subir carta Gantt versión 2 al cliente', otr: 4376, responsable: 'Planificación', vence: '27-10-2026', prioridad: 'Media', estado: 'Pendiente' },
  { id: 5, titulo: 'Recepcionar plancha A36 10mm (OC 8841)', responsable: 'Bodega', vence: '21-10-2026', prioridad: 'Baja', estado: 'Hecha' },
  { id: 6, titulo: 'Revisión de HH acumuladas mes septiembre', responsable: 'Gerencia', vence: '30-10-2026', prioridad: 'Baja', estado: 'En curso' },
];

export const CLP = (n: number) => '$' + n.toLocaleString('es-CL');

export const RUTA = ['Ingeniería', 'Corte CNC', 'Armado', 'Soldadura', 'Mecanizado', 'Granallado y pintura', 'Control ISO', 'Despacho'];
/** Estación actual de la ruta según el avance */
export const estacion = (o: { avance: number }) => Math.min(RUTA.length - 1, Math.floor((o.avance / 100) * RUTA.length));

// ---- Datos de apoyo (ejemplos) ----
export interface Cliente { id: string; nombre: string; rut: string; contacto: string; email: string; telefono: string; industria: string }
export const CLIENTES: Cliente[] = [
  { id: 'c1', nombre: 'BHP', rut: '79.800.600-2', contacto: 'Camila Fuentes', email: 'camila.fuentes@bhp.example', telefono: '+56 9 5555 0101', industria: 'Minería' },
  { id: 'c2', nombre: 'CODELCO', rut: '61.704.000-K', contacto: 'Rodrigo Pizarro', email: 'rpizarro@codelco.example', telefono: '+56 9 5555 0102', industria: 'Minería' },
  { id: 'c3', nombre: 'ZALDÍVAR', rut: '96.801.450-1', contacto: 'Paula Aranda', email: 'paranda@zaldivar.example', telefono: '+56 9 5555 0103', industria: 'Minería' },
  { id: 'c4', nombre: 'CHAGRES', rut: '96.708.730-2', contacto: 'Iván Soto', email: 'isoto@chagres.example', telefono: '+56 9 5555 0104', industria: 'Fundición' },
  { id: 'c5', nombre: 'GENNER', rut: '76.123.456-7', contacto: 'Marcela Rojas', email: 'mrojas@genner.example', telefono: '+56 9 5555 0105', industria: 'Industrial' },
  { id: 'c6', nombre: 'ESCONDIDA', rut: '79.587.210-8', contacto: 'Tomás Vega', email: 'tvega@escondida.example', telefono: '+56 9 5555 0106', industria: 'Minería' },
];

export interface HH { id: string; otrId: string; persona: string; fecha: string; horas: number; tarea: string; tarifa: number }
export const HH_SEED: HH[] = [
  { id: 'h1', otrId: 'o1', persona: 'J. Muñoz', fecha: '2026-10-19', horas: 8, tarea: 'Desarme matriz', tarifa: 14500 },
  { id: 'h2', otrId: 'o1', persona: 'M. Araya', fecha: '2026-10-20', horas: 6, tarea: 'Medición y diagnóstico', tarifa: 16000 },
  { id: 'h3', otrId: 'o4', persona: 'P. Díaz', fecha: '2026-10-20', horas: 9, tarea: 'Armado módulo 3/10', tarifa: 15000 },
];

export interface Cambio { id: string; otrId: string; descripcion: string; costo: number; dias: number; estado: 'Solicitado' | 'Aprobado' | 'Rechazado'; fecha: string }
export const CAMBIOS_SEED: Cambio[] = [
  { id: 'x1', otrId: 'o6', descripcion: 'Refuerzo adicional en cuña (plancha 12 mm).', costo: 640000, dias: 3, estado: 'Aprobado', fecha: '2026-10-19' },
];

export interface CubLinea { id: string; otrId: string; matId?: string; codigo: string; descripcion: string; cant: number; categoria: string; costo: number }
export const CUB_SEED: CubLinea[] = [
  { id: 'l1', otrId: 'o1', matId: 'm6', codigo: 'PL-A36-10', descripcion: 'Plancha A36 10×1500×3000', cant: 4, categoria: 'Plancha', costo: 412000 },
  { id: 'l2', otrId: 'o1', matId: 'm2', codigo: 'ANG-80', descripcion: 'Ángulo laminado 80×80×6', cant: 12, categoria: 'Perfil', costo: 40700 },
  { id: 'l3', otrId: 'o1', codigo: 'PRN-M20', descripcion: 'Perno M20×80 galv. 8.8', cant: 60, categoria: 'Pernería', costo: 1600 },
  { id: 'l4', otrId: 'o4', matId: 'm4', codigo: 'CNL-150', descripcion: 'Canal 150×75×6', cant: 8, categoria: 'Perfil', costo: 70330 },
];

export interface NC { id: string; otrId?: string; titulo: string; detalle: string; severidad: 'Menor' | 'Mayor' | 'Crítica'; estado: 'Abierta' | 'En análisis' | 'Cerrada'; responsable: string; fecha: string; accion: string }
export const NC_SEED: NC[] = [
  { id: 'n1', otrId: 'o4', titulo: 'Desviación de escuadra en módulo 3/10', detalle: 'Diagonales con 4 mm de diferencia sobre tolerancia ±2 mm.', severidad: 'Mayor', estado: 'En análisis', responsable: 'Calidad', fecha: '2026-10-20', accion: 'Reproceso de armado y re-medición con laser tracker.' },
  { id: 'n2', otrId: 'o10', titulo: 'Espesor de galvanizado bajo especificación', detalle: 'Medición 68 µm vs mínimo 85 µm en 3 piezas.', severidad: 'Crítica', estado: 'Abierta', responsable: 'Calidad', fecha: '2026-10-21', accion: '' },
  { id: 'n3', titulo: 'Certificado de materiales sin firma', detalle: 'Certificado de colada plancha A36 sin firma del proveedor.', severidad: 'Menor', estado: 'Cerrada', responsable: 'Bodega', fecha: '2026-10-15', accion: 'Se solicitó certificado firmado y se archivó.' },
];

export interface Evento { id: string; fecha: string; texto: string; autor: string; otrId?: string; tipo: 'otr' | 'stock' | 'calidad' | 'cliente' | 'tarea' | 'evidencia' }
export const LOG_SEED: Evento[] = [
  { id: 'e1', fecha: '2026-10-21T09:40:00', texto: 'Paletizado completado, pasa a Despacho', autor: 'Bodega', otrId: 'o12', tipo: 'otr' },
  { id: 'e2', fecha: '2026-10-20T16:12:00', texto: 'Cubicación enviada a costeo', autor: 'Felipe Romero', otrId: 'o1', tipo: 'otr' },
  { id: 'e3', fecha: '2026-10-20T11:03:00', texto: 'Se registran 9 HH en armado módulo 3/10', autor: 'Producción', otrId: 'o4', tipo: 'otr' },
  { id: 'e4', fecha: '2026-10-19T15:20:00', texto: 'Cambio de alcance aprobado: refuerzo en cuña', autor: 'Comercial', otrId: 'o6', tipo: 'otr' },
  { id: 'e5', fecha: '2026-10-19T10:00:00', texto: 'Ingreso de plancha A36 10 mm (OC 8841)', autor: 'Bodega', tipo: 'stock' },
];

export type EstadoMaq = 'Operando' | 'Detenida' | 'Mantención';
export interface Maquina { id: string; nombre: string; area: Area; estado: EstadoMaq; otrId?: string; operador: string; desde?: string; causa?: string; uso: number }
export const MAQ_SEED: Maquina[] = [
  { id: 'q1', nombre: 'Plasma CNC 1', area: 'Fabricación y Estructuras', estado: 'Operando', otrId: 'o6', operador: 'J. Muñoz', uso: 82 },
  { id: 'q2', nombre: 'Plasma CNC 2', area: 'Fabricación y Estructuras', estado: 'Detenida', operador: 'M. Araya', desde: '2026-10-21T08:20:00', causa: 'Falta de material', uso: 61 },
  { id: 'q3', nombre: 'Torno CNC', area: 'Mecanizado CNC', estado: 'Operando', otrId: 'o11', operador: 'P. Díaz', uso: 88 },
  { id: 'q4', nombre: 'Centro de mecanizado', area: 'Mecanizado CNC', estado: 'Mantención', operador: 'R. Soto', desde: '2026-10-21T07:30:00', causa: 'Mantenimiento preventivo', uso: 54 },
  { id: 'q5', nombre: 'Prensa plegadora', area: 'Fabricación y Estructuras', estado: 'Operando', otrId: 'o4', operador: 'L. Vera', uso: 73 },
  { id: 'q6', nombre: 'Soldadura MIG 1', area: 'Fabricación y Estructuras', estado: 'Operando', otrId: 'o2', operador: 'C. Rojas', uso: 79 },
  { id: 'q7', nombre: 'Granalladora', area: 'Terminaciones', estado: 'Operando', otrId: 'o10', operador: 'H. Pizarro', uso: 66 },
  { id: 'q8', nombre: 'Cabina de pintura', area: 'Terminaciones', estado: 'Detenida', operador: 'S. Núñez', desde: '2026-10-21T09:05:00', causa: 'Espera de aprobación', uso: 58 },
];
export const CAUSAS_PARADA = ['Falla mecánica', 'Falla eléctrica', 'Falta de material', 'Cambio de herramienta', 'Sin operador', 'Espera de aprobación', 'Mantenimiento preventivo', 'Ajuste / puesta a punto'];
export interface Parada { id: string; maqId: string; fecha: string; minutos: number; causa: string; nota: string }
export const PARADAS_SEED: Parada[] = [
  { id: 'p1', maqId: 'q1', fecha: '2026-10-15', minutos: 95, causa: 'Cambio de herramienta', nota: 'Cambio de boquilla y electrodo' },
  { id: 'p2', maqId: 'q2', fecha: '2026-10-16', minutos: 210, causa: 'Falla mecánica', nota: 'Rodamiento eje Y' },
  { id: 'p3', maqId: 'q3', fecha: '2026-10-16', minutos: 60, causa: 'Ajuste / puesta a punto', nota: '' },
  { id: 'p4', maqId: 'q5', fecha: '2026-10-17', minutos: 120, causa: 'Falta de material', nota: 'Espera de plancha 8 mm' },
  { id: 'p5', maqId: 'q6', fecha: '2026-10-19', minutos: 45, causa: 'Sin operador', nota: '' },
  { id: 'p6', maqId: 'q2', fecha: '2026-10-19', minutos: 150, causa: 'Falta de material', nota: '' },
  { id: 'p7', maqId: 'q7', fecha: '2026-10-20', minutos: 75, causa: 'Falla eléctrica', nota: 'Variador de turbina' },
  { id: 'p8', maqId: 'q4', fecha: '2026-10-20', minutos: 180, causa: 'Mantenimiento preventivo', nota: 'Plan 500 h' },
  { id: 'p9', maqId: 'q8', fecha: '2026-10-20', minutos: 90, causa: 'Espera de aprobación', nota: 'Esquema de pintura pendiente' },
  { id: 'p10', maqId: 'q1', fecha: '2026-10-21', minutos: 40, causa: 'Falla mecánica', nota: '' },
];

// ---- Cotizaciones ----
export interface CotLinea { id: string; descripcion: string; cant: number; costo: number }
export type EstadoCot = 'Borrador' | 'Enviada' | 'Aprobada' | 'Rechazada';
export interface Cotizacion { id: string; numero: string; clienteId: string; titulo: string; estado: EstadoCot; fecha: string; plazoDias: number; lineas: CotLinea[]; horas: number; tarifa: number; indirectos: number; margen: number; otrId?: string }
export const COT_SEED: Cotizacion[] = [
  { id: 'k1', numero: 'COT-2026-118', clienteId: 'c2', titulo: 'Bote rechazado ánodos · lote 2', estado: 'Enviada', fecha: '2026-10-14', plazoDias: 45, horas: 140, tarifa: 15500, indirectos: 12, margen: 28, lineas: [
    { id: 'kl1', descripcion: 'Plancha A36 10×1500×3000', cant: 6, costo: 412000 }, { id: 'kl2', descripcion: 'Ángulo laminado 80×80×6', cant: 18, costo: 40700 }, { id: 'kl3', descripcion: 'Granallado y pintura (global)', cant: 1, costo: 980000 }] },
  { id: 'k2', numero: 'COT-2026-121', clienteId: 'c1', titulo: 'Plataforma de acceso Bodega 7', estado: 'Aprobada', fecha: '2026-10-09', plazoDias: 38, horas: 96, tarifa: 15000, indirectos: 10, margen: 26, lineas: [
    { id: 'kl4', descripcion: 'Canal 150×75×6', cant: 14, costo: 70330 }, { id: 'kl5', descripcion: 'Pernería M20 galv.', cant: 120, costo: 1600 }] },
  { id: 'k3', numero: 'COT-2026-124', clienteId: 'c5', titulo: 'Reparación testeras (repetición)', estado: 'Borrador', fecha: '2026-10-20', plazoDias: 21, horas: 44, tarifa: 16000, indirectos: 8, margen: 30, lineas: [{ id: 'kl6', descripcion: 'Plancha inox 304 6 mm', cant: 2, costo: 538900 }] },
  { id: 'k4', numero: 'COT-2026-109', clienteId: 'c3', titulo: 'Conectores galvanizados P6', estado: 'Rechazada', fecha: '2026-09-28', plazoDias: 30, horas: 60, tarifa: 15000, indirectos: 10, margen: 32, lineas: [{ id: 'kl7', descripcion: 'Plancha galvanizada 10 mm', cant: 8, costo: 455000 }] },
];

// ---- Compras ----
export interface Proveedor { id: string; nombre: string; rut: string; contacto: string; email: string; telefono: string; rubro: string; plazoDias: number }
export const PROV_SEED: Proveedor[] = [
  { id: 'p1', nombre: 'Aceros del Pacífico', rut: '76.440.120-3', contacto: 'Daniela Mora', email: 'ventas@acerospacifico.example', telefono: '+56 32 555 0188', rubro: 'Planchas y perfiles', plazoDias: 3 },
  { id: 'p2', nombre: 'Ferretería Industrial Aconcagua', rut: '77.120.980-K', contacto: 'Hugo Salinas', email: 'hsalinas@fiaconcagua.example', telefono: '+56 33 555 0144', rubro: 'Pernería y consumibles', plazoDias: 2 },
  { id: 'p3', nombre: 'Hidráulica Andes', rut: '79.330.410-5', contacto: 'Carla Pinto', email: 'cpinto@hidraulicaandes.example', telefono: '+56 2 555 0121', rubro: 'Mangueras, acoples y válvulas', plazoDias: 7 },
  { id: 'p4', nombre: 'Gases y Soldaduras Norte', rut: '96.510.230-1', contacto: 'Pablo Ríos', email: 'prios@gasnorte.example', telefono: '+56 33 555 0177', rubro: 'Gases, electrodos y alambre', plazoDias: 1 },
];
export type EstadoOC = 'Borrador' | 'Enviada' | 'Recibida parcial' | 'Recibida';
export interface OCLinea { id: string; matId?: string; descripcion: string; cant: number; recibida: number; precio: number }
export interface OC { id: string; numero: string; proveedorId: string; estado: EstadoOC; fecha: string; otrId?: string; lineas: OCLinea[] }
export const OC_SEED: OC[] = [
  { id: 'oc1', numero: 'OC-8841', proveedorId: 'p1', estado: 'Recibida', fecha: '2026-10-19', lineas: [{ id: 'ol1', matId: 'm6', descripcion: 'ACERO A36 10X1500X3000MM', cant: 10, recibida: 10, precio: 412000 }] },
  { id: 'oc2', numero: 'OC-8852', proveedorId: 'p3', estado: 'Enviada', fecha: '2026-10-20', lineas: [{ id: 'ol2', matId: 'm5', descripcion: 'MANGA VÁLVULA PINCH 12X750mm', cant: 1, recibida: 0, precio: 2998908 }, { id: 'ol3', matId: 'm1', descripcion: 'STORZ 2" -2" HI BSP ALUMINIO', cant: 6, recibida: 0, precio: 17800 }] },
  { id: 'oc3', numero: 'OC-8856', proveedorId: 'p1', estado: 'Borrador', fecha: '2026-10-21', lineas: [{ id: 'ol4', matId: 'm4', descripcion: '150 X 75 X 6 MM', cant: 12, recibida: 0, precio: 70330 }] },
];

// ---- Certificados / dossier de calidad ----
export const TIPOS_CERT = ['Certificado de material', 'Informe dimensional', 'Protocolo de soldadura', 'Certificado de galvanizado / pintura', 'Informe de ensayo no destructivo'] as const;
export type TipoCert = (typeof TIPOS_CERT)[number];
export interface Cert { id: string; otrId: string; tipo: TipoCert; archivo: string; fecha: string; firma: 'Pendiente' | 'Firmado'; firmante?: string }
export const CERT_SEED: Cert[] = [
  { id: 'cf1', otrId: 'o4', tipo: 'Certificado de material', archivo: 'colada-A36-88412.pdf', fecha: '2026-10-12', firma: 'Firmado', firmante: 'Calidad' },
  { id: 'cf2', otrId: 'o10', tipo: 'Certificado de galvanizado / pintura', archivo: 'galv-lote-31.pdf', fecha: '2026-10-21', firma: 'Pendiente' },
  { id: 'cf3', otrId: 'o12', tipo: 'Informe dimensional', archivo: 'dim-testeras.pdf', fecha: '2026-10-20', firma: 'Firmado', firmante: 'Calidad' },
  { id: 'cf4', otrId: 'o12', tipo: 'Certificado de material', archivo: 'colada-A36-90211.pdf', fecha: '2026-10-08', firma: 'Firmado', firmante: 'Calidad' },
];
/** Documentos exigidos por área para cerrar el dossier ISO. */
export const REQUERIDOS: Record<Area, TipoCert[]> = {
  Ingeniería: [],
  'Fabricación y Estructuras': ['Certificado de material', 'Informe dimensional', 'Protocolo de soldadura'],
  'Mantenimiento y Reparación': ['Informe dimensional'],
  'Mecanizado CNC': ['Certificado de material', 'Informe dimensional'],
  Terminaciones: ['Certificado de galvanizado / pintura'],
};

// ---- Configuración, usuarios y auditoría ----
export type EstadoUsuario = 'Activo' | 'Invitado' | 'Suspendido';
export interface Usuario { id: string; nombre: string; email: string; rol: string; estado: EstadoUsuario; ultimoAcceso?: string; creado: string }
export const USUARIOS_SEED: Usuario[] = [
  { id: 'u1', nombre: 'Gonzalo Mena', email: 'gonzalo.mena@maestranzamena.com', rol: 'gerencia', estado: 'Activo', ultimoAcceso: '2026-10-21T08:12:00', creado: '2024-03-01' },
  { id: 'u2', nombre: 'Felipe Romero', email: 'felipe.romero@maestranzamena.com', rol: 'bodega', estado: 'Activo', ultimoAcceso: '2026-10-21T09:40:00', creado: '2025-01-15' },
  { id: 'u3', nombre: 'Valentina Rojas', email: 'valentina.rojas@maestranzamena.com', rol: 'comercial', estado: 'Activo', ultimoAcceso: '2026-10-20T17:05:00', creado: '2025-02-10' },
  { id: 'u4', nombre: 'Juan Muñoz', email: 'juan.munoz@maestranzamena.com', rol: 'produccion', estado: 'Activo', ultimoAcceso: '2026-10-21T07:31:00', creado: '2024-06-18' },
  { id: 'u5', nombre: 'Marcela Araya', email: 'marcela.araya@maestranzamena.com', rol: 'produccion', estado: 'Activo', ultimoAcceso: '2026-10-21T07:58:00', creado: '2024-06-18' },
  { id: 'u6', nombre: 'Pedro Díaz', email: 'pedro.diaz@maestranzamena.com', rol: 'calidad', estado: 'Activo', ultimoAcceso: '2026-10-20T16:42:00', creado: '2025-04-02' },
  { id: 'u7', nombre: 'Rodrigo Soto', email: 'rodrigo.soto@maestranzamena.com', rol: 'bodega', estado: 'Suspendido', ultimoAcceso: '2026-09-02T12:00:00', creado: '2024-11-05' },
  { id: 'u8', nombre: 'Andrea Vera', email: 'andrea.vera@maestranzamena.com', rol: 'calidad', estado: 'Invitado', creado: '2026-10-19' },
];

export interface CanalNotif { app: boolean; correo: boolean; whatsapp: boolean }
export interface ConfigEmpresa {
  id: 'cfg';
  nombre: string; rut: string; direccion: string; telefono: string; correo: string; horario: string;
  iva: number; tarifaHH: number; margenObjetivo: number;
  dominio: string; sesionHoras: number; dobleFactor: boolean;
  horasSemana: number; disponibilidad: number; stockMin: number; plazoCritico: number; plazoAlerta: number;
  notif: Record<'otr' | 'stock' | 'calidad' | 'cliente' | 'tarea' | 'evidencia', CanalNotif>;
  resumenDiario: boolean;
}
export const CONFIG_SEED: ConfigEmpresa[] = [{
  id: 'cfg',
  nombre: 'Maestranza Mena', rut: '76.543.210-K', direccion: 'Panamericana Norte Km 107, Hijuelas, Chile', telefono: '+56 33 255 0107', correo: 'contacto@maestranzamena.com',
  horario: 'Lun–Vie 08:00–18:00 · Sáb 09:00–13:00',
  iva: 19, tarifaHH: 15500, margenObjetivo: 28,
  dominio: 'maestranzamena.com', sesionHoras: 12, dobleFactor: false,
  horasSemana: 45, disponibilidad: 85, stockMin: 5, plazoCritico: 14, plazoAlerta: 30,
  notif: {
    otr: { app: true, correo: false, whatsapp: false }, stock: { app: true, correo: true, whatsapp: false }, calidad: { app: true, correo: true, whatsapp: true },
    cliente: { app: true, correo: false, whatsapp: false }, tarea: { app: true, correo: false, whatsapp: false }, evidencia: { app: false, correo: false, whatsapp: false },
  },
  resumenDiario: true,
}];

export type TipoAuditoria = 'usuario' | 'rol' | 'config' | 'acceso';
export interface Auditoria { id: string; fecha: string; actor: string; tipo: TipoAuditoria; accion: string; detalle: string }
export const AUDIT_SEED: Auditoria[] = [
  { id: 'a1', fecha: '2026-10-21T09:41:00', actor: 'Felipe Romero', tipo: 'acceso', accion: 'Inicio de sesión', detalle: 'Google · Chrome en Windows' },
  { id: 'a2', fecha: '2026-10-20T11:20:00', actor: 'Gonzalo Mena', tipo: 'usuario', accion: 'Invitó a un usuario', detalle: 'andrea.vera@maestranzamena.com como Calidad' },
  { id: 'a3', fecha: '2026-10-19T15:02:00', actor: 'Gonzalo Mena', tipo: 'rol', accion: 'Cambió permisos', detalle: 'Bodega y Adquisiciones: + Costear la cubicación' },
  { id: 'a4', fecha: '2026-09-02T12:05:00', actor: 'Gonzalo Mena', tipo: 'usuario', accion: 'Suspendió a un usuario', detalle: 'rodrigo.soto@maestranzamena.com' },
  { id: 'a5', fecha: '2026-08-28T10:00:00', actor: 'Gonzalo Mena', tipo: 'config', accion: 'Actualizó parámetros', detalle: 'Margen objetivo 25% → 28%' },
];
