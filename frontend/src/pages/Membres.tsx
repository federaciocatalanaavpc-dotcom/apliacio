import { useEffect, useState } from 'react';
import {
  Membre,
  TipusDocMembre,
  crearDocumentMembre,
  crearMembre,
  editarMembre,
  eliminarDocumentMembre,
  eliminarMembre,
  llistarMembres,
} from '../services/membres';
import { Agrupacio, llistarAgrupacions } from '../services/agrupacions';
import { getUsuariActual, obrirFitxerProtegit } from '../services/api';
import BotoTornar from '../components/BotoTornar';

const TIPUS_DOC_LABEL: Record<TipusDocMembre, string> = {
  DNI: 'DNI',
  CARNET_CONDUIR: 'Carnet de conduir',
  CERTIFICAT_MEDIC: 'Certificat mèdic',
  ASSEGURANCA: 'Assegurança',
  ALTRES: 'Altres',
};

const ESTAT_DOC_COLOR: Record<string, string> = {
  PENDENT: 'var(--c-warning)',
  REBUT: 'var(--c-success)',
  CADUCAT: 'var(--c-error)',
};

const buit = {
  agrupacioId: '',
  nom: '',
  cognoms: '',
  dni: '',
  dataNaixement: '',
  telefon: '',
  email: '',
  notes: '',
};

export default function Membres() {
  const usuariActual = getUsuariActual();
  const esFederacio = usuariActual?.rol === 'FEDERACIO';
  const [membres, setMembres] = useState<Membre[]>([]);
  const [agrupacions, setAgrupacions] = useState<Agrupacio[]>([]);
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState('');
  const [mostrarFormulari, setMostrarFormulari] = useState(false);
  const [form, setForm] = useState(buit);
  const [obertId, setObertId] = useState<string | null>(null);

  const [nouDocTipus, setNouDocTipus] = useState<TipusDocMembre>('DNI');
  const [nouDocCaducitat, setNouDocCaducitat] = useState('');
  const [nouDocFitxer, setNouDocFitxer] = useState<File | null>(null);

  async function carregar() {
    setCarregant(true);
    try {
      const [dades, ags] = await Promise.all([llistarMembres(), esFederacio ? llistarAgrupacions() : Promise.resolve([])]);
      setMembres(dades);
      setAgrupacions(ags);
    } catch {
      setError('No s\'han pogut carregar els membres');
    } finally {
      setCarregant(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await crearMembre({
        agrupacioId: esFederacio ? form.agrupacioId : undefined,
        nom: form.nom,
        cognoms: form.cognoms,
        dni: form.dni || undefined,
        dataNaixement: form.dataNaixement || undefined,
        telefon: form.telefon || undefined,
        email: form.email || undefined,
        notes: form.notes || undefined,
      });
      setForm(buit);
      setMostrarFormulari(false);
      carregar();
    } catch {
      setError('No s\'ha pogut crear el membre');
    }
  }

  async function handleBaixa(m: Membre) {
    try {
      await editarMembre(m.id, { actiu: !m.actiu, dataBaixa: m.actiu ? new Date().toISOString() : null } as any);
      carregar();
    } catch {
      setError('No s\'ha pogut actualitzar el membre');
    }
  }

  async function handleEliminar(id: string) {
    try {
      await eliminarMembre(id);
      carregar();
    } catch {
      setError('No s\'ha pogut eliminar el membre');
    }
  }

  async function handleAfegirDocument(membreId: string, e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await crearDocumentMembre(membreId, {
        tipus: nouDocTipus,
        dataCaducitat: nouDocCaducitat || undefined,
        fitxer: nouDocFitxer,
      });
      setNouDocCaducitat('');
      setNouDocFitxer(null);
      carregar();
    } catch {
      setError('No s\'ha pogut desar el document');
    }
  }

  async function handleEliminarDocument(id: string) {
    try {
      await eliminarDocumentMembre(id);
      carregar();
    } catch {
      setError('No s\'ha pogut eliminar el document');
    }
  }

  if (carregant) return <p className="page text-muted">Carregant membres...</p>;

  return (
    <div className="page">
      <BotoTornar />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Membres</h1>
        <button onClick={() => setMostrarFormulari(!mostrarFormulari)}>
          {mostrarFormulari ? 'Cancel·lar' : '+ Nou membre'}
        </button>
      </div>

      {error && <p className="text-error">{error}</p>}

      {mostrarFormulari && (
        <form onSubmit={handleCrear} className="card" style={{ marginBottom: 20, maxWidth: 460 }}>
          {esFederacio && (
            <div style={{ marginBottom: 10 }}>
              <label>Agrupació</label>
              <select value={form.agrupacioId} onChange={(e) => setForm({ ...form, agrupacioId: e.target.value })} required style={{ width: '100%' }}>
                <option value="">Selecciona una agrupació...</option>
                {agrupacions.map((a) => (
                  <option key={a.id} value={a.id}>{a.nom} ({a.municipi})</option>
                ))}
              </select>
            </div>
          )}
          <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Nom</label>
              <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Cognoms</label>
              <input value={form.cognoms} onChange={(e) => setForm({ ...form, cognoms: e.target.value })} required style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label>DNI (opcional)</label>
              <input value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Data naixement (opcional)</label>
              <input type="date" value={form.dataNaixement} onChange={(e) => setForm({ ...form, dataNaixement: e.target.value })} style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Telèfon (opcional)</label>
              <input value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Email (opcional)</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ width: '100%' }} />
            </div>
          </div>
          <button type="submit">Crear membre</button>
        </form>
      )}

      {membres.length === 0 ? (
        <p className="text-muted">Encara no hi ha cap membre registrat.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {membres.map((m) => {
            const pendents = m.documents.filter((d) => d.estat !== 'REBUT').length;
            return (
              <div key={m.id} className="card" style={{ maxWidth: 560 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong>{m.nom} {m.cognoms}</strong>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {pendents > 0 && (
                      <span className="badge" style={{ color: 'var(--c-warning)', background: 'var(--c-warning-bg)' }}>
                        {pendents} pendent{pendents > 1 ? 's' : ''}
                      </span>
                    )}
                    {!m.actiu && <span className="badge" style={{ color: 'var(--c-error)', background: 'var(--c-error-bg)' }}>Baixa</span>}
                  </div>
                </div>
                {esFederacio && m.agrupacio && (
                  <p className="text-muted" style={{ fontSize: 12, margin: '2px 0' }}>{m.agrupacio.nom}</p>
                )}
                <p className="text-muted" style={{ fontSize: 13, margin: '4px 0' }}>
                  {[m.dni, m.telefon, m.email].filter(Boolean).join(' · ') || 'Sense dades de contacte'}
                </p>

                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button onClick={() => setObertId(obertId === m.id ? null : m.id)} style={{ fontSize: 12 }}>
                    {obertId === m.id ? 'Amagar documentació' : 'Documentació'}
                  </button>
                  <button onClick={() => handleBaixa(m)} style={{ fontSize: 12 }}>
                    {m.actiu ? 'Donar de baixa' : 'Reactivar'}
                  </button>
                  <button onClick={() => handleEliminar(m.id)} style={{ fontSize: 12, color: 'var(--c-error)' }}>
                    Eliminar
                  </button>
                </div>

                {obertId === m.id && (
                  <div style={{ borderTop: '1px solid var(--c-border)', marginTop: 10, paddingTop: 10 }}>
                    {m.documents.length === 0 ? (
                      <p className="text-muted" style={{ fontSize: 13 }}>Encara no hi ha cap document registrat.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                        {m.documents.map((d) => (
                          <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                            <span>
                              {TIPUS_DOC_LABEL[d.tipus]}{' '}
                              <span style={{ color: ESTAT_DOC_COLOR[d.estat], fontWeight: 600 }}>({d.estat.toLowerCase()})</span>
                              {d.dataCaducitat && ` · caduca ${new Date(d.dataCaducitat).toLocaleDateString('ca-ES')}`}
                              {d.fitxerUrl && (
                                <>
                                  {' · '}
                                  <a href="#" onClick={(e) => { e.preventDefault(); obrirFitxerProtegit(d.fitxerUrl!); }}>
                                    fitxer
                                  </a>
                                </>
                              )}
                            </span>
                            <button onClick={() => handleEliminarDocument(d.id)} style={{ fontSize: 11, color: 'var(--c-error)' }}>
                              Eliminar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <form onSubmit={(e) => handleAfegirDocument(m.id, e)} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                      <div>
                        <label>Tipus</label>
                        <select value={nouDocTipus} onChange={(e) => setNouDocTipus(e.target.value as TipusDocMembre)}>
                          {Object.entries(TIPUS_DOC_LABEL).map(([valor, etiqueta]) => (
                            <option key={valor} value={valor}>{etiqueta}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label>Caducitat (opcional)</label>
                        <input type="date" value={nouDocCaducitat} onChange={(e) => setNouDocCaducitat(e.target.value)} />
                      </div>
                      <div>
                        <label>Fitxer (opcional)</label>
                        <input type="file" onChange={(e) => setNouDocFitxer(e.target.files?.[0] || null)} />
                      </div>
                      <button type="submit">Afegir</button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
