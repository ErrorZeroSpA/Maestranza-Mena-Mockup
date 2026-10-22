import type { Otr } from './mock';
import type { Evidencia } from './evidencia';

const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

/** Abre una hoja imprimible (Guardar como PDF desde el diálogo de impresión). */
export function imprimirInforme(o: Otr, fotos: Evidencia[]) {
  const w = window.open('', '_blank');
  if (!w) return;
  const items = fotos.map((f) => `
    <figure>${f.img ? `<img src="${f.img}" />` : '<div class="ph"></div>'}
      <figcaption><b>${esc(f.etapa || 'Registro')}</b> · ${esc(f.fecha.slice(0, 10))}<br/>${esc(f.nota)}<br/><small>${esc(f.autor)}</small></figcaption></figure>`).join('');
  w.document.write(`<!doctype html><html lang="es"><meta charset="utf-8"><title>Informe OTR ${o.otr}</title>
  <style>body{font:14px system-ui,sans-serif;margin:32px;color:#16181d}h1{margin:0 0 4px;font-size:24px}header{border-bottom:3px solid #f5821f;padding-bottom:12px;margin-bottom:18px}
  .meta{color:#555}dl{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:14px 0 22px}dt{font:10px monospace;text-transform:uppercase;color:#777}dd{margin:0;font-weight:700}
  .g{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}figure{margin:0;break-inside:avoid}img,.ph{width:100%;aspect-ratio:4/3;object-fit:cover;background:#ddd;display:block}figcaption{margin-top:6px;font-size:12px}
  footer{margin-top:28px;font-size:11px;color:#777;border-top:1px solid #ccc;padding-top:8px}</style>
  <header><h1>Informe fotográfico · OTR ${o.otr}</h1><div class="meta">${esc(o.titulo)} — ${esc(o.cliente)}</div></header>
  <dl><div><dt>Área</dt><dd>${esc(o.area)}</dd></div><div><dt>Hito</dt><dd>${esc(o.hito)}</dd></div><div><dt>Avance</dt><dd>${o.avance}%</dd></div><div><dt>Entrega</dt><dd>${esc(o.entrega)}</dd></div></dl>
  <div class="g">${items || '<p>Sin evidencia registrada.</p>'}</div>
  <footer>Maestranza Mena · Panamericana Norte Km 107, Hijuelas · Generado desde SGO</footer>
  <script>setTimeout(()=>window.print(),300)</script></html>`);
  w.document.close();
}
