import { useEffect, useState } from 'react';
import {
  Voluntari,
  Disponibilitat,
  obtenirVoluntariPropi,
  actualitzarDisponibilitatPropia,
} from '../services/voluntaris';
import { Servei, llistarServeis, confirmarAssistencia, cancelarAssistencia } from '../services/serveis';

const DISPONIBILITAT_LABEL: Record<Disponibilitat, string> = {
  PRESENCIAL: 'Presencial',
  IMMEDIATA: 'Immediata',
  DIFERIDA: 'Diferida',
  NO_DISPONIBLE: 'No disponible',
};

export default function PerfilVoluntari() {
  const [voluntari, setVoluntari] = useState<Voluntari | null>(null);
  const [serveis, setServeis] = useState<Servei[]>([]);
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState('');

  async function carregar() {
    setCarregant(true);
    try {
      const [v, s] = await Promise.all([obtenirVoluntariPropi(), llistarServeis()]);
      setVoluntari(v);
      setServeis(s);
    } catch {
      setError('No s\'han pogut carregar les dades');
    } finally {
      setCarregant(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleDisponibilitat(disponibilitat: Disponibilitat) {
    setError('');
    try {
      const v = await actualitzarDisponibilitatPropia(disponibilitat);
      setVoluntari(v);
      carregar();
    } catch {
      setError('No s\'ha pogut actualitzar la disponibilitat');
    }
  }

  async function handleConfirmar(serveiId: string) {
    setError('');
    try {
      await confirmarAssistencia(serveiId);
      carregar();
    } catch {
      setError('No s\'ha pogut confirmar l\'assistència');
    }
  }

  async function handleCancelar(serveiId: string) {
    setError('');
    try {
      await cancelarAssistencia(serveiId);
      carregar();
    } catch {
      setError('No s\'ha pogut cancel·lar l\'assistència');
    }
  }

  if (carregant) return <p className="text-muted">Carregant...</p>;
  if (!voluntari) return <p className="text-error">No s'ha trobat la teva fitxa de voluntari.</p>;

  const totalHores = serveis.reduce((suma, s) => suma + (s.assistenciaPropia?.horesRealitzades || 0), 0);

  return (
    <div>
      <div className="card" style={{ marginBottom: 16, maxWidth: 460 }}>
        <p style={{ margin: 0, fontWeight: 700 }}>{voluntari.nom} {voluntari.cognoms}</p>
        {voluntari.indicatiu && <p className="text-muted" style={{ fontSize: 13, margin: '4px 0' }}>Indicatiu: {voluntari.indicatiu}</p>}
        <p className="text-muted" style={{ fontSize: 13, margin: '4px 0' }}>Hores acumulades: <strong>{totalHores}</strong></p>
        <div style={{ marginTop: 10 }}>
          <label>La meva disponibilitat</label>
          <select value={voluntari.disponibilitat} onChange={(e) => handleDisponibilitat(e.target.value as Disponibilitat)} style={{ width: '100%' }}>
            {Object.entries(DISPONIBILITAT_LABEL).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>{etiqueta}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-error">{error}</p>}

      <h3 style={{ marginBottom: 8 }}>Serveis</h3>
      {serveis.length === 0 ? (
        <p className="text-muted">No hi ha cap servei obert per a tu ara mateix.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {serveis.map((s) => (
            <div key={s.id} className="card" style={{ maxWidth: 460 }}>
              <p style={{ margin: 0, fontWeight: 600 }}>{s.titol}</p>
              <p className="text-muted" style={{ fontSize: 13, margin: '4px 0' }}>
                {new Date(s.dataInici).toLocaleString('ca-ES')}
                {s.localitat ? ` · ${s.localitat}` : ''}
              </p>
              {s.descripcio && <p className="text-muted" style={{ fontSize: 13, margin: '4px 0' }}>{s.descripcio}</p>}
              <div style={{ marginTop: 8 }}>
                {s.assistenciaPropia?.confirmat ? (
                  <>
                    <span className="badge" style={{ color: 'var(--c-success)', background: 'var(--c-success-bg)', marginRight: 8 }}>
                      Assistència confirmada
                    </span>
                    <button onClick={() => handleCancelar(s.id)} style={{ fontSize: 12 }}>Cancel·lar</button>
                  </>
                ) : (
                  <button onClick={() => handleConfirmar(s.id)} style={{ fontSize: 12 }}>Confirmar assistència</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
