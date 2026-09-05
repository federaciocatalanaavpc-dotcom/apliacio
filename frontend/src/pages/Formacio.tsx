import { useEffect, useState } from 'react';
import { RecursFormacio, crearRecursFormacio, eliminarRecursFormacio, llistarRecursosFormacio } from '../services/formacio';
import { getUsuariActual, obrirFitxerProtegit } from '../services/api';
import BotoTornar from '../components/BotoTornar';

export default function FormacioPage() {
  const usuariActual = getUsuariActual();
  const esFederacio = usuariActual?.rol === 'FEDERACIO';
  const [recursos, setRecursos] = useState<RecursFormacio[]>([]);
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState('');
  const [mostrarFormulari, setMostrarFormulari] = useState(false);

  const [titol, setTitol] = useState('');
  const [url, setUrl] = useState('');
  const [fitxer, setFitxer] = useState<File | null>(null);

  async function carregar() {
    setCarregant(true);
    try {
      setRecursos(await llistarRecursosFormacio());
    } catch {
      setError('No s\'han pogut carregar els recursos de formació');
    } finally {
      setCarregant(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!url.trim() && !fitxer) {
      setError('Cal indicar un enllaç o adjuntar un fitxer');
      return;
    }
    try {
      await crearRecursFormacio({ titol, url: url.trim() || undefined, fitxer });
      setTitol('');
      setUrl('');
      setFitxer(null);
      setMostrarFormulari(false);
      carregar();
    } catch {
      setError('No s\'ha pogut afegir el recurs');
    }
  }

  async function handleEliminar(id: string) {
    try {
      await eliminarRecursFormacio(id);
      carregar();
    } catch {
      setError('No s\'ha pogut eliminar el recurs');
    }
  }

  if (carregant) return <p className="page text-muted">Carregant formació...</p>;

  return (
    <div className="page">
      <BotoTornar />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Formació</h1>
        {esFederacio && (
          <button onClick={() => setMostrarFormulari(!mostrarFormulari)}>
            {mostrarFormulari ? 'Cancel·lar' : '+ Afegir recurs'}
          </button>
        )}
      </div>
      <p className="text-muted" style={{ fontSize: 13 }}>
        Documents (PDF) i enllaços d'informació i formació per a les associacions.
      </p>

      {error && <p className="text-error">{error}</p>}

      {esFederacio && mostrarFormulari && (
        <form onSubmit={handleCrear} className="card" style={{ marginBottom: 20, maxWidth: 460 }}>
          <div style={{ marginBottom: 10 }}>
            <label>Títol</label>
            <input value={titol} onChange={(e) => setTitol(e.target.value)} required style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Enllaç (opcional)</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Fitxer PDF (opcional)</label>
            <input type="file" accept="application/pdf" onChange={(e) => setFitxer(e.target.files?.[0] || null)} style={{ width: '100%' }} />
          </div>
          <button type="submit">Afegir recurs</button>
        </form>
      )}

      {recursos.length === 0 ? (
        <p className="text-muted">Encara no hi ha cap recurs de formació.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {recursos.map((r) => (
            <div key={r.id} className="card" style={{ maxWidth: 480, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>{r.titol}</p>
                <p className="text-muted" style={{ margin: '4px 0 0', fontSize: 12 }}>
                  Afegit per {r.pujatPer.nom}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {r.fitxerUrl && (
                  <button onClick={() => obrirFitxerProtegit(r.fitxerUrl!)} style={{ fontSize: 13 }}>
                    Obrir PDF
                  </button>
                )}
                {r.url && (
                  <a href={r.url} target="_blank" rel="noreferrer">
                    <button type="button" style={{ fontSize: 13 }}>Obrir enllaç</button>
                  </a>
                )}
                {esFederacio && (
                  <button onClick={() => handleEliminar(r.id)} style={{ fontSize: 12, color: 'var(--c-error)' }}>
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
