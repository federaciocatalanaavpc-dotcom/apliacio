import { api } from './api';

export async function enviarNotificacioAssociacions(dades: { titol: string; missatge: string }): Promise<{ ok: boolean; notificats: number }> {
  const { data } = await api.post('/notificacio-associacions', dades);
  return data;
}
