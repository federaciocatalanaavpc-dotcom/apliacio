export function dataLocal(iso: string | null): string {
  if (!iso) return '';
  const d=new Date(iso);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);
}
export function duradaHores(inici: string, fi: string): string {
  const n=(new Date(fi).getTime()-new Date(inici).getTime())/3600000;
  return Number.isFinite(n) && n>0 ? n.toLocaleString('ca-ES',{maximumFractionDigits:2})+' h' : '—';
}
export function mostrarData(iso: string | null): string {return iso ? new Date(iso).toLocaleString('ca-ES') : '—';}
