import QRCode from 'qrcode';
import type { Otr, CubLinea } from './mock';
import { RUTA } from './mock';

const esc = (t: string | number) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

/** Hoja de ruta imprimible con QR: el operador escanea y registra avance desde el celular. */
export async function imprimirHojaRuta(o: Otr, url: string, lineas: CubLinea[]) {
  const w = window.open('', '_blank');
  if (!w) return;
  const qr = await QRCode.toDataURL(url, { margin: 1, width: 240, color: { dark: '#0b2748', light: '#ffffff' } });
  w.document.write(`<!doctype html><html lang="es"><meta charset="utf-8"><title>Hoja de ruta OTR ${o.otr}</title>
  <style>*{box-sizing:border-box}body{font:13px system-ui,sans-serif;margin:24px;color:#0f1b2d}
  header{display:grid;grid-template-columns:1fr 150px;gap:18px;border:2px solid #0f1b2d;border-top:8px solid #f28c28;padding:14px 16px}
  .otr{font:700 12px monospace;letter-spacing:.14em;color:#f28c28}h1{margin:2px 0 4px;font-size:26px;line-height:1.1}.m{color:#555}
  dl{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin:12px 0 0;border-top:1px solid #0f1b2d}dl div{padding:6px 8px 6px 0}dt{font:9px monospace;text-transform:uppercase;color:#777;letter-spacing:.1em}dd{margin:2px 0 0;font-weight:700}
  .qr{text-align:center}.qr img{width:140px;height:140px}.qr small{display:block;font:9px monospace;color:#555;margin-top:2px}
  table{width:100%;border-collapse:collapse;margin-top:16px}th{text-align:left;font:10px monospace;text-transform:uppercase;letter-spacing:.1em;background:#0b2748;color:#fff;padding:6px 8px}
  td{border-bottom:1px solid #bbb;padding:10px 8px}td.n{width:34px;font:700 14px monospace}td.b{width:110px}td.f{width:90px}.box{display:inline-block;width:16px;height:16px;border:2px solid #0f1b2d}
  h2{font-size:14px;margin:20px 0 4px}footer{margin-top:18px;font-size:11px;color:#666;border-top:1px solid #ccc;padding-top:8px}
  @media print{body{margin:10mm}}</style>
  <header><div><div class="otr">OTR ${o.otr}</div><h1>${esc(o.titulo)}</h1><div class="m">${esc(o.cliente)} · ${esc(o.area)}</div>
  <dl><div><dt>Entrega</dt><dd>${esc(o.entrega)}</dd></div><div><dt>Hito actual</dt><dd>${esc(o.hito)}</dd></div><div><dt>Avance</dt><dd>${o.avance}%</dd></div><div><dt>Plazo</dt><dd>${o.plazoDias} d</dd></div></dl></div>
  <div class="qr"><img src="${qr}" /><small>Escanea para registrar avance</small></div></header>
  <table><thead><tr><th>#</th><th>Estación</th><th>Fecha</th><th>Operador</th><th>Visto bueno</th><th>OK</th></tr></thead><tbody>
  ${RUTA.map((r, i) => `<tr><td class="n">${String(i + 1).padStart(2, '0')}</td><td><b>${esc(r)}</b></td><td class="b"></td><td class="b"></td><td class="f"></td><td><span class="box"></span></td></tr>`).join('')}
  </tbody></table>
  ${lineas.length ? `<h2>Materiales cubicados</h2><table><thead><tr><th>Código</th><th>Descripción</th><th>Cant.</th></tr></thead><tbody>${lineas.map((l) => `<tr><td>${esc(l.codigo || '—')}</td><td>${esc(l.descripcion)}</td><td>${l.cant}</td></tr>`).join('')}</tbody></table>` : ''}
  <footer>Maestranza Mena · ISO 9001 · Hoja de ruta generada desde SGO</footer><script>setTimeout(()=>window.print(),400)</script></html>`);
  w.document.close();
}
