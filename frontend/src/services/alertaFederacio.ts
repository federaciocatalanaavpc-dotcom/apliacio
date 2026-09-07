import { api } from './api';

export async function enviarAlertaFederacio(dades: { titol: string; missatge: string }): Promise<{ ok: boolean; notificats: number }> {
  const { data } = await api.post('/alerta-federacio', dades);
  return data;
}
