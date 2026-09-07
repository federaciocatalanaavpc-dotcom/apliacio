import { api } from './api';

export async function enviarCorreuAssociacions(dades: { titol: string; missatge: string }): Promise<{ ok: boolean; total: number; enviats: number }> {
  const { data } = await api.post('/correu-associacions', dades);
  return data;
}
