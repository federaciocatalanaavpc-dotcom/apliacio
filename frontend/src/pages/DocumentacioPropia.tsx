import { useEffect, useState } from 'react';
import { DocumentAgrupacio, TipusDocument, llistarDocuments, pujarDocuments, resoldrePendent } from '../services/documents';
import { Agrupacio, llistarAgrupacions } from '../services/agrupacions';
import { getUsuariActual, obrirFitxerProtegit } from '../services/api';
import BotoTornar from '../components/BotoTornar';

const TIPUS_LABEL: Record<string, string> = {
  ESTATUTS: 'Estatuts',
  ACTA: "Llibre d'actes",
  ALTRES: 'Altres',
};

export default function DocumentacioPropia() {
  const usuariActual = getUsuariActual();
  const esFederacio = usuariActual?.rol === 'FEDERACIO';
  const [documents, setDocuments] = useState<DocumentAgrupacio[]>([]);
  const [agrupacions, setAgrupacions] = useState<Agrupacio[]>([]);
  const [agrupacioSeleccionada, setAgrupacioSeleccionada] = useState('');
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState('');
  const [fitxerPerPendent, setFitxerPerPendent] = useState<Record<string, File | null>>({});

  const [mostrarFormulari, setMostrarFormulari] = useState(false);
  const [tipus, setTipus] = useState<TipusDocument>('ALTRES');
  const [titol, setTitol] = useState('');
  const [dataDocument, setDataDocument] = useState('');
  const [pendent, setPendent] = useState(false);
  const [fitxers, setFitxers] = useState<File[]>([]);

  const agrupacioId = esFederacio ? agrupacioSeleccionada : usuariActual?.agrupacioId || '';

  async function carregar() {
    setCarregant(true);
    try {
      const [dades, ags] = await Promise.all([llistarDocuments(), esFederacio ? llistarAgrupacions() : Promise.resolve([])]);
      setDocuments(dades);
      setAgrupacions(ags);
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

  async function handlePujar(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!pendent && fitxers.length === 0) {
      setError('Cal seleccionar almenys un fitxer (o marcar-lo com a pendent)');
      return;
    }
    try {
      await pujarDocuments({
        agrupacioId,
        tipus,
        titol,
        dataDocument: dataDocument || undefined,
        pendent,
        fitxers,
      });
      setTitol('');
      setDataDocument('');
      setPendent(false);
      setFitxers([]);
      setMostrarFormulari(false);
      carregar();
    } catch {
      setError('No s\'ha pogut pujar el document');
    }
  }

  if (!esFederacio && !usuariActual?.agrupacioId) {
    return (
      <div className="page">
        <BotoTornar />
        <h1>Documentació pròpia</h1>
        <p className="text-muted">Aquesta secció només és per a usuaris d'una associació.</p>
      </div>
    );
  }

  if (carregant) return <p className="page text-muted">Carregant documentació...</p>;

  const documentsAssociacio = agrupacioId ? documents.filter((d) => d.agrupacioId === agrupacioId) : [];
  const pendents = documentsAssociacio.filter((d) => d.pendent);
  const rebuts = documentsAssociacio.filter((d) => !d.pendent);

  return (
    <div className="page">
      <BotoTornar />
      <h1>Documentació pròpia</h1>
      <p className="text-muted" style={{ fontSize: 13 }}>
        {esFederacio
          ? "Documents propis d'una associació concreta (a més dels comuns, que es gestionen a Documentació)."
          : 'Documents de la teva associació pujats per la federació.'}
      </p>

      {error && <p className="text-error">{error}</p>}

      {esFederacio && (
        <div className="card" style={{ marginBottom: 20, maxWidth: 460 }}>
          <label>Associació</label>
          <select value={agrupacioSeleccionada} onChange={(e) => setAgrupacioSeleccionada(e.target.value)} style={{ width: '100%' }}>
            <option value="">Selecciona una associació...</option>
            {agrupacions.map((a) => (
              <option key={a.id} value={a.id}>{a.nom}</option>
            ))}
          </select>
        </div>
      )}

      {agrupacioId && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button onClick={() => setMostrarFormulari(!mostrarFormulari)}>
              {mostrarFormulari ? 'Cancel·lar' : '+ Afegir document'}
            </button>
          </div>

          {mostrarFormulari && (
            <form onSubmit={handlePujar} className="card" style={{ marginBottom: 20, maxWidth: 460 }}>
              <div style={{ marginBottom: 10 }}>
                <label>Tipus</label>
                <select value={tipus} onChange={(e) => setTipus(e.target.value as TipusDocument)} style={{ width: '100%' }}>
                  <option value="ESTATUTS">Estatuts</option>
                  <option value="ACTA">Llibre d'actes</option>
                  <option value="ALTRES">Altres</option>
                </select>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label>Títol {fitxers.length > 1 ? '(opcional, prefix per a cada fitxer)' : ''}</label>
                <input
                  value={titol}
                  onChange={(e) => setTitol(e.target.value)}
                  required={pendent || fitxers.length === 0}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label>Data del document (opcional)</label>
                <input type="date" value={dataDocument} onChange={(e) => setDataDocument(e.target.value)} style={{ width: '100%' }} />
              </div>
              {esFederacio && (
                <div style={{ marginBottom: 10 }}>
                  <label>
                    <input type="checkbox" checked={pendent} onChange={(e) => setPendent(e.target.checked)} style={{ width: 'auto', marginRight: 6 }} />
                    Sol·licitud pendent (sense fitxer encara, l'associació el pujarà)
                  </label>
                </div>
              )}
              {!pendent && (
                <div style={{ marginBottom: 10 }}>
                  <label>Fitxer(s) (PDF o imatge, es poden seleccionar diversos)</label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setFitxers(Array.from(e.target.files || []))}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
              )}
              <button type="submit">{pendent ? 'Crear sol·licitud' : fitxers.length > 1 ? `Pujar ${fitxers.length} documents` : 'Pujar document'}</button>
            </form>
          )}

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
        </>
      )}
    </div>
  );
}
