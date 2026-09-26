import { useEffect, useState } from 'react';
import BotoTornar from '../components/BotoTornar';
import NotificacionsCard from '../components/NotificacionsCard';
import { AlertaRebuda, Resposta, llistarAlertesMeves, marcarAlertaLlegida, respondreAlerta } from '../services/alertes';

const ETIQUETA: Record<Resposta, string> = { VAIG: '✅ Vaig', NO_PUC: '❌ No puc' };

export default function AlertesVoluntari() {
  const [alertes, setAlertes] = useState<AlertaRebuda[]>([]);
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState('');

  async function carregar() {
    try {
      const llista = await llistarAlertesMeves();
      setAlertes(llista);
      llista.filter((a) => !a.lectura).forEach((a) => marcarAlertaLlegida(a.id).catch(() => {}));
    } catch {
      setError("No s'han pogut carregar les alertes");
    } finally {
      setCarregant(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function respondre(id: string, resposta: Resposta) {
    setError('');
    try {
      await respondreAlerta(id, resposta);
      await carregar();
    } catch {
      setError("No s'ha pogut enviar la resposta");
    }
  }

  return (
    <div className="page">
      <BotoTornar />
      <h1>Alertes</h1>
      <p className="text-muted" style={{ fontSize: 13 }}>
        Activa les notificacions per assabentar-te de seguida quan hi hagi un servei nou o una emergència.
      </p>
      <NotificacionsCard />

      <h2 style={{ fontSize: 17 }}>Alertes dels últims 30 dies</h2>
      {error && <p className="text-error">{error}</p>}
      {carregant ? (
        <p className="text-muted">Carregant...</p>
      ) : alertes.length === 0 ? (
        <p className="text-muted">No has rebut cap alerta.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {alertes.map((a) => (
            <div key={a.id} className="card" style={{ maxWidth: 520 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                <strong>{a.titol}</strong>
                {a.lectura?.resposta && (
                  <span className="badge" style={{ color: a.lectura.resposta === 'VAIG' ? 'var(--c-success)' : 'var(--c-text-muted)' }}>
                    {ETIQUETA[a.lectura.resposta]}
                  </span>
                )}
              </div>
              <p style={{ margin: '6px 0', whiteSpace: 'pre-line', fontSize: 14 }}>{a.cos}</p>
              <p className="text-muted" style={{ margin: '4px 0', fontSize: 12 }}>
                {new Date(a.dataEnviament).toLocaleString('ca-ES')}
              </p>
              {a.demanaResposta && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  {(['VAIG', 'NO_PUC'] as Resposta[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => respondre(a.id, r)}
                      disabled={a.lectura?.resposta === r}
                      style={{ flex: 1, fontWeight: 700 }}
                    >
                      {ETIQUETA[r]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
