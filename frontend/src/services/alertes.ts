import { api } from './api';

export type Resposta = 'VAIG' | 'NO_PUC';

export interface AlertaRebuda {
  id: string;
  titol: string;
  cos: string;
  dataEnviament: string;
  demanaResposta: boolean;
  lectura: { llegitEl: string; resposta: Resposta | null; respostaEl: string | null } | null;
}

export async function llistarAlertesMeves(): Promise<AlertaRebuda[]> {
  const { data } = await api.get('/alertes/meves');
  return data;
}

export async function marcarAlertaLlegida(id: string) {
  await api.post(`/alertes/${id}/llegit`);
}

export async function respondreAlerta(id: string, resposta: Resposta) {
  const { data } = await api.post(`/alertes/${id}/resposta`, { resposta });
  return data;
}
