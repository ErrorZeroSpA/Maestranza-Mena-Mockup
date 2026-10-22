/** Cálculo de peso de piezas de metal. Dimensiones en mm; resultado en kg. */
export type Forma = 'plancha' | 'pletina' | 'barra' | 'cuadrada' | 'tuboR' | 'tuboC' | 'angulo';

export const MATERIALES = [
  { id: 'a36', nombre: 'Acero A36', densidad: 7850, precio: 1250 },
  { id: 'inox304', nombre: 'Acero inox 304', densidad: 7930, precio: 4900 },
  { id: 'galv', nombre: 'Acero galvanizado', densidad: 7850, precio: 1650 },
  { id: 'alu', nombre: 'Aluminio 6061', densidad: 2700, precio: 3800 },
  { id: 'cobre', nombre: 'Cobre', densidad: 8960, precio: 9800 },
  { id: 'laton', nombre: 'Latón', densidad: 8500, precio: 7200 },
] as const;

export interface CampoDef { k: string; label: string; def: number }
export interface FormaDef { id: Forma; nombre: string; campos: CampoDef[]; /** área de sección en mm² (o área de la plancha) */ area: (v: Record<string, number>) => number; largoKey: string; desc: (v: Record<string, number>) => string }

const L: CampoDef = { k: 'largo', label: 'Largo (mm)', def: 6000 };

export const FORMAS: FormaDef[] = [
  { id: 'plancha', nombre: 'Plancha', campos: [{ k: 'esp', label: 'Espesor (mm)', def: 10 }, { k: 'ancho', label: 'Ancho (mm)', def: 1500 }, { k: 'largo', label: 'Largo (mm)', def: 3000 }], area: (v) => v.esp * v.ancho, largoKey: 'largo', desc: (v) => `${v.esp}×${v.ancho}×${v.largo}` },
  { id: 'pletina', nombre: 'Pletina', campos: [{ k: 'ancho', label: 'Ancho (mm)', def: 50 }, { k: 'esp', label: 'Espesor (mm)', def: 6 }, L], area: (v) => v.ancho * v.esp, largoKey: 'largo', desc: (v) => `${v.ancho}×${v.esp}×${v.largo}` },
  { id: 'barra', nombre: 'Barra redonda', campos: [{ k: 'd', label: 'Diámetro (mm)', def: 25 }, L], area: (v) => Math.PI * (v.d / 2) ** 2, largoKey: 'largo', desc: (v) => `Ø${v.d}×${v.largo}` },
  { id: 'cuadrada', nombre: 'Barra cuadrada', campos: [{ k: 'lado', label: 'Lado (mm)', def: 25 }, L], area: (v) => v.lado ** 2, largoKey: 'largo', desc: (v) => `${v.lado}×${v.lado}×${v.largo}` },
  { id: 'tuboR', nombre: 'Tubo redondo', campos: [{ k: 'd', label: 'Diámetro ext. (mm)', def: 60.3 }, { k: 'esp', label: 'Espesor (mm)', def: 3.9 }, L], area: (v) => Math.PI * (v.d / 2) ** 2 - Math.PI * (v.d / 2 - v.esp) ** 2, largoKey: 'largo', desc: (v) => `Ø${v.d}×${v.esp}×${v.largo}` },
  { id: 'tuboC', nombre: 'Tubo cuadrado / rect.', campos: [{ k: 'a', label: 'Ancho (mm)', def: 50 }, { k: 'b', label: 'Alto (mm)', def: 50 }, { k: 'esp', label: 'Espesor (mm)', def: 3 }, L], area: (v) => v.a * v.b - (v.a - 2 * v.esp) * (v.b - 2 * v.esp), largoKey: 'largo', desc: (v) => `${v.a}×${v.b}×${v.esp}×${v.largo}` },
  { id: 'angulo', nombre: 'Ángulo (L)', campos: [{ k: 'a', label: 'Ala A (mm)', def: 80 }, { k: 'b', label: 'Ala B (mm)', def: 80 }, { k: 'esp', label: 'Espesor (mm)', def: 6 }, L], area: (v) => (v.a + v.b - v.esp) * v.esp, largoKey: 'largo', desc: (v) => `${v.a}×${v.b}×${v.esp}×${v.largo}` },
];

export interface Resultado { pesoUnit: number; pesoTotal: number; conMerma: number; costoUnit: number; costoTotal: number; desc: string }

export function calcular(forma: FormaDef, v: Record<string, number>, densidad: number, cant: number, mermaPct: number, precioKg: number): Resultado {
  // mm³ → m³ (×1e-9); sección × largo
  const volumen = forma.area(v) * (forma.id === 'plancha' ? v.largo : v[forma.largoKey]) * 1e-9;
  const pesoUnit = Math.max(0, volumen * densidad);
  const pesoTotal = pesoUnit * cant;
  const conMerma = pesoTotal * (1 + mermaPct / 100);
  return { pesoUnit, pesoTotal, conMerma, costoUnit: pesoUnit * (1 + mermaPct / 100) * precioKg, costoTotal: conMerma * precioKg, desc: forma.desc(v) };
}
