import { OTRS } from './mock';

const SALT = 'mm';
const sig = (n: number) => {
  let h = 7;
  for (const c of `${SALT}${n}`) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h.toString(36).padStart(6, '0').slice(-6);
};

/** Token de enlace público. En producción: token aleatorio guardado en BD con expiración. */
export const tokenFor = (otr: number) => `${otr}-${sig(otr)}`;

export function otrFromToken(token: string) {
  const [n, s] = token.split('-');
  const num = Number(n);
  if (!num || sig(num) !== s) return null;
  return OTRS.find((o) => o.otr === num) ?? null;
}

export const ORIGIN = 'https://sgo.maestranzamena.com';
export const linkAvance = (otr: number) => `${typeof window !== 'undefined' ? window.location.origin : ORIGIN}/avance/${tokenFor(otr)}`;
export const linkFor = (otr: number) => `${ORIGIN}/estado/${tokenFor(otr)}`;
