import type { Cert, NC, Otr } from './mock';
import type { Evidencia } from './evidencia';
import { REQUERIDOS } from './mock';

const esc = (t: string | number) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

/** Dossier de calidad de la OTR: lo que se entrega al cliente junto con el trabajo (ISO 9001). */
export function imprimirDossier(o: Otr, certs: Cert[], ncs: NC[], fotos: Evidencia[]) {
  const w = window.open('', '_blank');
  if (!w) return;
  const req = REQUERIDOS[o.area];
  const filas = req.map((t) => { const c = certs.find((x) => x.tipo === t); return `<tr><td>${esc(t)}</td><td>${c ? esc(c.archivo) : '—'}</td><td>${c ? (c.firma === 'Firmado' ? `Firmado · ${esc(c.firmante ?? '')}` : 'Pendiente de firma') : 'No adjunto'}</td></tr>`; }).join('');
  const extra = certs.filter((c) => !req.includes(c.tipo)).map((c) => `<tr><td>${esc(c.tipo)}</td><td>${esc(c.archivo)}</td><td>${c.firma}</td></tr>`).join('');
  const completo = req.every((t) => certs.some((c) => c.tipo === t && c.firma === 'Firmado')) && ncs.every((n) => n.estado === 'Cerrada');
  w.document.write(`<!doctype html><html lang="es"><meta charset="utf-8"><title>Dossier OTR ${o.otr}</title>
  <style>body{font:13px system-ui,sans-serif;margin:30px;color:#0f1b2d}header{border:2px solid #0f1b2d;border-top:8px solid #f28c28;padding:16px 18px;margin-bottom:18px}.n{font:700 12px monospace;letter-spacing:.14em;color:#f28c28}h1{margin:3px 0;font-size:26px}h2{font-size:14px;margin:22px 0 6px;border-bottom:2px solid #0f1b2d;padding-bottom:3px}
  table{width:100%;border-collapse:collapse}th{text-align:left;background:#0b2748;color:#fff;font:10px monospace;text-transform:uppercase;padding:6px}td{padding:7px 6px;border-bottom:1px solid #ccc}.estado{display:inline-block;padding:3px 10px;font-weight:800;margin-top:6px;background:${completo ? '#e3f3ea' : '#fbe8e4'};color:${completo ? '#1f7a4d' : '#c23a29'}}
  .g{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}figure{margin:0;break-inside:avoid}img,.ph{width:100%;aspect-ratio:4/3;object-fit:cover;background:#ddd;display:block}figcaption{font-size:11px;margin-top:3px}
  .firmas{display:grid;grid-template-columns:repeat(3,1fr);gap:30px;margin-top:50px}.firmas div{border-top:1px solid #0f1b2d;padding-top:6px;font-size:11px;color:#555}footer{margin-top:22px;font-size:11px;color:#777}</style>
  <header><div class="n">DOSSIER DE CALIDAD · OTR ${o.otr}</div><h1>${esc(o.titulo)}</h1><div>${esc(o.cliente)} · ${esc(o.area)} · Entrega ${esc(o.entrega)}</div><div class="estado">${completo ? 'Dossier completo' : 'Dossier con pendientes'}</div></header>
  <h2>Documentación de calidad</h2><table><thead><tr><th>Documento</th><th>Archivo</th><th>Estado</th></tr></thead><tbody>${filas}${extra}</tbody></table>
  <h2>No conformidades</h2>${ncs.length ? `<table><thead><tr><th>Fecha</th><th>Descripción</th><th>Severidad</th><th>Estado</th></tr></thead><tbody>${ncs.map((n) => `<tr><td>${esc(n.fecha)}</td><td>${esc(n.titulo)}</td><td>${n.severidad}</td><td>${n.estado}</td></tr>`).join('')}</tbody></table>` : '<p>Sin no conformidades registradas.</p>'}
  <h2>Registro fotográfico</h2>${fotos.length ? `<div class="g">${fotos.map((f) => `<figure>${f.img ? `<img src="${f.img}"/>` : '<div class="ph"></div>'}<figcaption><b>${esc(f.etapa || 'Registro')}</b> · ${esc(f.fecha.slice(0, 10))}<br/>${esc(f.nota)}</figcaption></figure>`).join('')}</div>` : '<p>Sin evidencia fotográfica.</p>'}
  <div class="firmas"><div>Jefe de producción</div><div>Control de calidad</div><div>Recepción del cliente</div></div>
  <footer>Maestranza Mena · ISO 9001 · Generado desde SGO</footer><script>setTimeout(()=>window.print(),400)</script></html>`);
  w.document.close();
}
