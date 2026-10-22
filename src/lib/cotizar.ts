import type { Cliente, Cotizacion } from './mock';
import { CLP } from './mock';
import { cfg } from './data';

export function totales(c: Pick<Cotizacion, 'lineas' | 'horas' | 'tarifa' | 'indirectos' | 'margen'>) {
  const mat = c.lineas.reduce((a, l) => a + l.cant * l.costo, 0);
  const mo = c.horas * c.tarifa;
  const base = mat + mo;
  const indir = base * (c.indirectos / 100);
  const costo = base + indir;
  const venta = c.margen >= 100 ? costo : costo / (1 - c.margen / 100);
  return { mat, mo, indir, costo, venta: Math.round(venta), utilidad: Math.round(venta - costo) };
}

const esc = (t: string | number) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

/** Cotización imprimible para enviar al cliente (no muestra costos internos ni margen). */
export function imprimirCotizacion(c: Cotizacion, cli?: Cliente) {
  const w = window.open('', '_blank');
  if (!w) return;
  const t = totales(c);
  const k = t.venta / (t.mat + t.mo || 1);
  const items = [...c.lineas.map((l) => [l.descripcion, l.cant, Math.round(l.costo * k)] as const), ['Mano de obra y fabricación', 1, Math.round(t.mo * k)] as const];
  const neto = items.reduce((a, [, q, u]) => a + q * u, 0);
  const iva = Math.round(neto * (cfg().iva / 100));
  w.document.write(`<!doctype html><html lang="es"><meta charset="utf-8"><title>${esc(c.numero)}</title>
  <style>body{font:13px system-ui,sans-serif;margin:30px;color:#0f1b2d}header{display:flex;justify-content:space-between;border-bottom:4px solid #f28c28;padding-bottom:12px;margin-bottom:18px}
  h1{margin:0;font-size:24px}.n{font:700 12px monospace;letter-spacing:.14em;color:#f28c28}dl{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:0 0 18px}dt{font:9px monospace;text-transform:uppercase;color:#777;letter-spacing:.1em}dd{margin:2px 0 0;font-weight:700}
  table{width:100%;border-collapse:collapse}th{text-align:left;background:#0b2748;color:#fff;font:10px monospace;text-transform:uppercase;letter-spacing:.1em;padding:7px}td{padding:8px 7px;border-bottom:1px solid #ccc}td.r,th.r{text-align:right}
  .tot{margin:14px 0 0 auto;width:300px}.tot div{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #ddd}.tot .g{font-size:17px;font-weight:800;border-bottom:0;border-top:2px solid #0f1b2d;padding-top:8px}
  h2{font-size:13px;margin:22px 0 4px}ul{margin:4px 0;padding-left:18px;color:#444}footer{margin-top:24px;font-size:11px;color:#777;border-top:1px solid #ccc;padding-top:8px}</style>
  <header><div><div class="n">COTIZACIÓN ${esc(c.numero)}</div><h1>${esc(c.titulo)}</h1></div><div style="text-align:right"><b>Maestranza Mena</b><br/>Panamericana Norte Km 107, Hijuelas<br/>ISO 9001</div></header>
  <dl><div><dt>Cliente</dt><dd>${esc(cli?.nombre ?? '—')}</dd></div><div><dt>Fecha</dt><dd>${esc(c.fecha.split('-').reverse().join('-'))}</dd></div><div><dt>Plazo de entrega</dt><dd>${c.plazoDias} días corridos</dd></div></dl>
  <table><thead><tr><th>Descripción</th><th class="r">Cant.</th><th class="r">P. unitario</th><th class="r">Total</th></tr></thead><tbody>
  ${items.map(([d, q, u]) => `<tr><td>${esc(d)}</td><td class="r">${q}</td><td class="r">${esc(CLP(u))}</td><td class="r">${esc(CLP(q * u))}</td></tr>`).join('')}</tbody></table>
  <div class="tot"><div><span>Neto</span><b>${esc(CLP(neto))}</b></div><div><span>IVA ${cfg().iva}%</span><b>${esc(CLP(iva))}</b></div><div class="g"><span>Total</span><span>${esc(CLP(neto + iva))}</span></div></div>
  <h2>Condiciones</h2><ul><li>Validez de la oferta: 15 días.</li><li>Forma de pago: 50% anticipo, 50% contra entrega.</li><li>Fabricación bajo sistema de gestión de calidad ISO 9001.</li></ul>
  <footer>Documento generado desde SGO · Maestranza Mena</footer><script>setTimeout(()=>window.print(),300)</script></html>`);
  w.document.close();
}
