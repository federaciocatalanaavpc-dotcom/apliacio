import { useEffect, useState } from 'react';
import { Voluntari, Disponibilitat, obtenirVoluntariPropi, actualitzarDisponibilitatPropia } from '../services/voluntaris';
import BotoTornar from '../components/BotoTornar';
import SelectorDisponibilitat, { DISPONIBILITAT_LABEL } from '../components/SelectorDisponibilitat';

export default function DisponibilitatVoluntari() {
  const [voluntari, setVoluntari] = useState<Voluntari | null>(null);
  const [carregant, setCarregant] = useState(true);
  const [actualitzant, setActualitzant] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenirVoluntariPropi()
      .then(setVoluntari)
      .catch(() => setError('No s\'ha pogut carregar la teva fitxa'))
      .finally(() => setCarregant(false));
  }, []);

  async function handleCanviar(disponibilitat: Disponibilitat) {
    if (voluntari?.disponibilitat === disponibilitat) return;
    setError('');
    setActualitzant(true);
    try {
      const v = await actualitzarDisponibilitatPropia(disponibilitat);
      setVoluntari(v);
    } catch {
      setError('No s\'ha pogut actualitzar la disponibilitat');
    } finally {
      setActualitzant(false);
    }
  }

  return (
    <div className="page">
      <BotoTornar />
      <h1>Disponibilitat</h1>
      <p className="text-muted" style={{ fontSize: 13 }}>
        Indica si estàs disponible per a serveis ara mateix. Es pot canviar sempre que calgui.
      </p>

      {error && <p className="text-error">{error}</p>}

      {carregant || !voluntari ? (
        <p className="text-muted">Carregant...</p>
      ) : (
        <div className="card" style={{ maxWidth: 460 }}>
          <p style={{ margin: '0 0 12px', fontSize: 14 }}>
            Estat actual: <strong>{DISPONIBILITAT_LABEL[voluntari.disponibilitat]}</strong>
          </p>
          <SelectorDisponibilitat valor={voluntari.disponibilitat} onCanviar={handleCanviar} desactivat={actualitzant} />
        </div>
      )}
    </div>
  );
}
