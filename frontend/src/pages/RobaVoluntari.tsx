import { useEffect, useState } from 'react';
import { AssignacioEquipament, llistarLesMevesAssignacions } from '../services/equipament';
import BotoTornar from '../components/BotoTornar';

const TIPUS_LABEL: Record<string, string> = { ROBA: 'Roba', EPI: 'EPI' };

export default function RobaVoluntari() {
  const [assignacions, setAssignacions] = useState<AssignacioEquipament[]>([]);
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    llistarLesMevesAssignacions()
      .then(setAssignacions)
      .catch(() => setError('No s\'ha pogut carregar la teva roba assignada'))
      .finally(() => setCarregant(false));
  }, []);

  return (
    <div className="page">
      <BotoTornar />
      <h1>La meva roba</h1>
      <p className="text-muted" style={{ fontSize: 13 }}>
        Roba i EPI que tens assignats ara mateix.
      </p>

      {error && <p className="text-error">{error}</p>}

      {carregant ? (
        <p className="text-muted">Carregant...</p>
      ) : assignacions.length === 0 ? (
        <p className="text-muted">No tens cap article assignat ara mateix.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {assignacions.map((a) => (
            <div key={a.id} className="card" style={{ maxWidth: 460 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong>{a.article?.nom}{a.article?.talla ? ` (${a.article.talla})` : ''}</strong>
                <span className="badge badge--role">{a.article ? TIPUS_LABEL[a.article.tipus] : ''}</span>
              </div>
              <p className="text-muted" style={{ fontSize: 13, margin: '4px 0' }}>
                Quantitat: {a.quantitat} · Des del {new Date(a.dataAssignacio).toLocaleDateString('ca-ES')}
              </p>
              {a.notes && <p className="text-muted" style={{ fontSize: 13, margin: '4px 0' }}>{a.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
