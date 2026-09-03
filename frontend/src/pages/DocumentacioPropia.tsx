import { useEffect, useState } from 'react';
import { DocumentAgrupacio, llistarDocuments, resoldrePendent } from '../services/documents';
import { getUsuariActual, obrirFitxerProtegit } from '../services/api';
import BotoTornar from '../components/BotoTornar';

const TIPUS_LABEL: Record<string, string> = {
  ESTATUTS: 'Estatuts',
  ACTA: "Llibre d'actes",
  ALTRES: 'Altres',
};

export default function DocumentacioPropia() {
  const usuariActual = getUsuariActual();
  const [documents, setDocuments] = useState<DocumentAgrupacio[]>([]);
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState('');
  const [fitxerPerPendent, setFitxerPerPendent] = useState<Record<string, File | null>>({});

  async function carregar() {
    setCarregant(true);
    try {
      const dades = await llistarDocuments();
      setDocuments(dades.filter((d) => d.agrupacioId === usuariActual?.agrupacioId));
    } catch {
      setError('No s\'ha pogut carregar la documentació');
    } finally {
      setCarregant(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleResoldre(id: string) {
    const fitxer = fitxerPerPendent[id];
    if (!fitxer) {
      setError('Selecciona primer el fitxer a pujar');
      return;
    }
    setError('');
    try {
      await resoldrePendent(id, fitxer);
      setFitxerPerPendent((prev) => ({ ...prev, [id]: null }));
      carregar();
    } catch {
      setError('No s\'ha pogut pujar el fitxer');
    }
  }

  if (!usuariActual?.agrupacioId) {
    return (
      <div className="page">
        <BotoTornar />
        <h1>Documentació pròpia</h1>
        <p className="text-muted">Aquesta secció només és per a usuaris d'una associació.</p>
      </div>
    );
  }

  if (carregant) return <p className="page text-muted">Carregant documentació...</p>;

  const pendents = documents.filter((d) => d.pendent);
  const rebuts = documents.filter((d) => !d.pendent);

  return (
    <div className="page">
      <BotoTornar />
      <h1>Documentació pròpia</h1>
      <p className="text-muted" style={{ fontSize: 13 }}>
        Documents de la teva associació pujats per la federació.
      </p>

      {error && <p className="text-error">{error}</p>}

      {pendents.length > 0 && (
        <div className="card card--warning" style={{ marginBottom: 20, maxWidth: 480 }}>
          <p style={{ margin: '0 0 10px', fontWeight: 700 }}>📁 Documentació pendent</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendents.map((d) => (
              <div key={d.id} style={{ borderTop: '1px solid var(--c-warning-border)', paddingTop: 10 }}>
                <p style={{ margin: '0 0 6px' }}>
                  <strong>{d.titol}</strong> <span className="text-muted">({TIPUS_LABEL[d.tipus]})</span>
                </p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="file"
                    onChange={(e) => setFitxerPerPendent((prev) => ({ ...prev, [d.id]: e.target.files?.[0] || null }))}
                    style={{ fontSize: 12 }}
                  />
                  <button onClick={() => handleResoldre(d.id)} style={{ fontSize: 12 }}>
                    Pujar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {rebuts.length === 0 ? (
        <p className="text-muted">Encara no hi ha cap document propi.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rebuts.map((d) => (
            <div key={d.id} className="card" style={{ maxWidth: 480, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>{d.titol}</p>
                <p className="text-muted" style={{ margin: '4px 0 0', fontSize: 12 }}>
                  {TIPUS_LABEL[d.tipus]}
                  {d.dataDocument ? ` · ${new Date(d.dataDocument).toLocaleDateString('ca-ES')}` : ''}
                </p>
              </div>
              {d.fitxerUrl && (
                <button onClick={() => obrirFitxerProtegit(d.fitxerUrl!)} style={{ fontSize: 13 }}>
                  Obrir
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
