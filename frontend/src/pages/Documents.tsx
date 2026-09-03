import { useEffect, useState } from 'react';
import {
  DocumentAgrupacio,
  TipusDocument,
  eliminarDocument,
  llistarDocuments,
  pujarDocument,
} from '../services/documents';
import { Agrupacio, llistarAgrupacions } from '../services/agrupacions';
import { getUsuariActual, obrirFitxerProtegit } from '../services/api';
import BotoTornar from '../components/BotoTornar';

const PESTANYES: { valor: TipusDocument; etiqueta: string }[] = [
  { valor: 'ESTATUTS', etiqueta: 'Estatuts' },
  { valor: 'ACTA', etiqueta: "Llibre d'actes" },
  { valor: 'ALTRES', etiqueta: 'Altres documents' },
];

export default function Documents() {
  const usuariActual = getUsuariActual();
  const esFederacio = usuariActual?.rol === 'FEDERACIO';
  const [documents, setDocuments] = useState<DocumentAgrupacio[]>([]);
  const [agrupacions, setAgrupacions] = useState<Agrupacio[]>([]);
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState('');
  const [pestanya, setPestanya] = useState<TipusDocument>('ESTATUTS');
  const [mostrarFormulari, setMostrarFormulari] = useState(false);

  const [agrupacioId, setAgrupacioId] = useState('');
  const [titol, setTitol] = useState('');
  const [dataDocument, setDataDocument] = useState('');
  const [pendent, setPendent] = useState(false);
  const [fitxer, setFitxer] = useState<File | null>(null);

  async function carregar() {
    setCarregant(true);
    try {
      const [dades, ags] = await Promise.all([llistarDocuments(), esFederacio ? llistarAgrupacions() : Promise.resolve([])]);
      setDocuments(dades);
      setAgrupacions(ags);
    } catch {
      setError('No s\'han pogut carregar els documents');
    } finally {
      setCarregant(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePujar(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!pendent && !fitxer) {
      setError('Cal seleccionar un fitxer (o marcar-lo com a pendent)');
      return;
    }
    try {
      await pujarDocument({
        agrupacioId: agrupacioId || undefined,
        tipus: pestanya,
        titol,
        dataDocument: dataDocument || undefined,
        pendent,
        fitxer,
      });
      setTitol('');
      setDataDocument('');
      setPendent(false);
      setFitxer(null);
      setMostrarFormulari(false);
      carregar();
    } catch {
      setError('No s\'ha pogut pujar el document');
    }
  }

  async function handleEliminar(id: string) {
    try {
      await eliminarDocument(id);
      carregar();
    } catch {
      setError('No s\'ha pogut eliminar el document');
    }
  }

  if (carregant) return <p className="page text-muted">Carregant documents...</p>;

  const llistaPestanya = documents.filter((d) => d.tipus === pestanya);

  return (
    <div className="page">
      <BotoTornar />
      <h1>Documentació</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {PESTANYES.map((p) => (
          <button
            key={p.valor}
            onClick={() => setPestanya(p.valor)}
            style={p.valor === pestanya ? { background: 'var(--gradient)', color: '#fff', border: 'none' } : {}}
          >
            {p.etiqueta}
          </button>
        ))}
      </div>

      {error && <p className="text-error">{error}</p>}

      {esFederacio && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <button onClick={() => setMostrarFormulari(!mostrarFormulari)}>
            {mostrarFormulari ? 'Cancel·lar' : '+ Pujar document'}
          </button>
        </div>
      )}

      {esFederacio && mostrarFormulari && (
        <form onSubmit={handlePujar} className="card" style={{ marginBottom: 20, maxWidth: 460 }}>
          <div style={{ marginBottom: 10 }}>
            <label>Associació (opcional, buit = comú de la federació)</label>
            <select value={agrupacioId} onChange={(e) => setAgrupacioId(e.target.value)} style={{ width: '100%' }}>
              <option value="">Comú de la federació</option>
              {agrupacions.map((a) => (
                <option key={a.id} value={a.id}>{a.nom}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Títol</label>
            <input
              value={titol}
              onChange={(e) => setTitol(e.target.value)}
              required
              placeholder={pestanya === 'ACTA' ? 'p.ex. Acta assemblea 12/03/2026' : undefined}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Data del document (opcional)</label>
            <input type="date" value={dataDocument} onChange={(e) => setDataDocument(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>
              <input type="checkbox" checked={pendent} onChange={(e) => setPendent(e.target.checked)} style={{ width: 'auto', marginRight: 6 }} />
              Sol·licitud pendent (sense fitxer encara, l'associació el pujarà)
            </label>
          </div>
          {!pendent && (
            <div style={{ marginBottom: 10 }}>
              <label>Fitxer (PDF o imatge)</label>
              <input type="file" onChange={(e) => setFitxer(e.target.files?.[0] || null)} required style={{ width: '100%' }} />
            </div>
          )}
          <button type="submit">{pendent ? 'Crear sol·licitud' : 'Pujar document'}</button>
        </form>
      )}

      {llistaPestanya.length === 0 ? (
        <p className="text-muted">Encara no hi ha cap document en aquesta secció.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {llistaPestanya.map((d) => (
            <div key={d.id} className="card" style={{ maxWidth: 480, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>
                  {d.titol}
                  {d.pendent && <span className="badge" style={{ marginLeft: 8, color: 'var(--c-warning)', background: 'var(--c-warning-bg)' }}>Pendent</span>}
                </p>
                <p className="text-muted" style={{ margin: '4px 0 0', fontSize: 12 }}>
                  {d.agrupacio ? `${d.agrupacio.nom} · ` : 'Comú de la federació · '}
                  {d.dataDocument ? new Date(d.dataDocument).toLocaleDateString('ca-ES') + ' · ' : ''}
                  Creat per {d.pujatPer.nom}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {d.fitxerUrl && (
                  <button onClick={() => obrirFitxerProtegit(d.fitxerUrl!)} style={{ fontSize: 13 }}>
                    Obrir
                  </button>
                )}
                {esFederacio && (
                  <button onClick={() => handleEliminar(d.id)} style={{ fontSize: 12, color: 'var(--c-error)' }}>
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
