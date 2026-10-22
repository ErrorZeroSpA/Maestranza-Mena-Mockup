export interface Evidencia {
  id: string;
  otr: number;
  etapa: string;
  nota: string;
  visibleCliente: boolean;
  fecha: string; // ISO
  autor: string;
  img?: string; // dataURL (mockup: solo en memoria)
}

export const DEMO: Evidencia[] = [
  { id: 'd1', otr: 4122, etapa: 'Armado', nota: 'Módulo 3/10 armado, falta punteo de refuerzos.', visibleCliente: true, fecha: '2026-10-21T09:12:00', autor: 'Felipe Romero' },
  { id: 'd2', otr: 4261, etapa: 'Control', nota: 'Control dimensional OK, tolerancia ±1 mm.', visibleCliente: true, fecha: '2026-10-20T16:40:00', autor: 'Calidad' },
  { id: 'd3', otr: 3505, etapa: 'Ingreso', nota: 'Desgaste en matriz, se adjunta detalle.', visibleCliente: false, fecha: '2026-10-19T11:05:00', autor: 'Felipe Romero' },
  { id: 'd4', otr: 4376, etapa: 'Corte', nota: 'Corte plasma finalizado, rebabas pendientes.', visibleCliente: true, fecha: '2026-10-19T08:30:00', autor: 'Producción' },
];
