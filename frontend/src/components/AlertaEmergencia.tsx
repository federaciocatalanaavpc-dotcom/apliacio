import { useCallback, useEffect, useState } from 'react';
import { AlertaRebuda, Resposta, llistarAlertesMeves, marcarAlertaLlegida, respondreAlerta } from '../services/alertes';
import { getUsuariActual } from '../services/api';
import './AlertaEmergencia.css';

const REFRESC_MS = 30_000;
const FINESTRA_MS = 12 * 3600_000;

// Finestra d'emergència que surt sobre qualsevol pantalla a voluntaris i
// administradors AVPC mentre tinguin una alerta amb resposta pendent, perquè
// confirmin "vaig" / "no puc" tan bon punt obren l'app.
export default function AlertaEmergencia() {
  const rol = getUsuariActual()?.rol;
  const aplica = rol === 'VOLUNTARI' || rol === 'ADMIN_AVPC';
  const [pendents, setPendents] = useState<AlertaRebuda[]>([]);
  const [enviant, setEnviant] = useState(false);
  const [error, setError] = useState('');

  const carregar = useCallback(async () => {
    if (!aplica) return;
    try {
      const alertes = await llistarAlertesMeves();
      const limit = Date.now() - FINESTRA_MS;
      const nous = alertes.filter(
        (a) => a.demanaResposta && !a.lectura?.resposta && new Date(a.dataEnviament).getTime() >= limit
      );
      setPendents(nous);
      nous.filter((a) => !a.lectura).forEach((a) => marcarAlertaLlegida(a.id).catch(() => {}));
    } catch {
      // sense connexió o sessió caducada: no es mostra res
    }
  }, [aplica]);

  useEffect(() => {
    if (!aplica) return;
    carregar();
    const interval = setInterval(carregar, REFRESC_MS);
    const alTornar = () => document.visibilityState === 'visible' && carregar();
    document.addEventListener('visibilitychange', alTornar);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', alTornar);
    };
  }, [aplica, carregar]);

  async function respondre(alerta: AlertaRebuda, resposta: Resposta) {
    setEnviant(true);
    setError('');
    try {
      await respondreAlerta(alerta.id, resposta);
      setPendents((p) => p.filter((x) => x.id !== alerta.id));
    } catch {
      setError("No s'ha pogut enviar la resposta. Torna-ho a provar.");
    } finally {
      setEnviant(false);
    }
  }

  const alerta = pendents[0];
  if (!aplica || !alerta) return null;

  return (
    <div className="alerta-emergencia" role="alertdialog" aria-modal="true" aria-labelledby="alerta-emergencia-titol">
      <div className="alerta-emergencia__caixa">
        <div className="alerta-emergencia__icona" aria-hidden="true">🚨</div>
        <h2 id="alerta-emergencia-titol">{alerta.titol}</h2>
        <p className="alerta-emergencia__hora">{new Date(alerta.dataEnviament).toLocaleString('ca-ES')}</p>
        <p className="alerta-emergencia__cos">{alerta.cos}</p>
        {error && <p className="text-error">{error}</p>}
        <div className="alerta-emergencia__accions">
          <button className="alerta-emergencia__vaig" onClick={() => respondre(alerta, 'VAIG')} disabled={enviant}>
            ✅ Vaig
          </button>
          <button className="alerta-emergencia__nopuc" onClick={() => respondre(alerta, 'NO_PUC')} disabled={enviant}>
            ❌ No puc
          </button>
        </div>
        {pendents.length > 1 && <small>Tens {pendents.length - 1} alerta(es) més pendent(s) de resposta.</small>}
      </div>
    </div>
  );
}
