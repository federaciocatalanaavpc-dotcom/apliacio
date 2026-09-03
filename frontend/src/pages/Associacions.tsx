import { useEffect, useState } from 'react';
import {
  Agrupacio,
  crearAgrupacio,
  editarAgrupacio,
  eliminarAgrupacio,
  llistarAgrupacions,
} from '../services/agrupacions';
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
import { getUsuariActual } from '../services/api';
import { Provincia, llistarProvincies } from '../services/provincies';
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
  nom: '',
  provincia: '',
  municipi: '',
  comarca: '',
  adreca: '',
  telefon: '',
  email: '',
  president: '',
  dataFundacio: '',
};

const buitMembre = {
  nom: '',
  cognoms: '',
  dni: '',
  dataNaixement: '',
  telefon: '',
  email: '',
};

export default function Associacions() {
  const usuariActual = getUsuariActual();
  const esFederacio = usuariActual?.rol === 'FEDERACIO';

  const [agrupacions, setAgrupacions] = useState<Agrupacio[]>([]);
  const [membres, setMembres] = useState<Membre[]>([]);
  const [provincies, setProvincies] = useState<Provincia[]>([]);
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState('');

  const [mostrarFormulari, setMostrarFormulari] = useState(false);
  const [form, setForm] = useState(buit);
  const [editantId, setEditantId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(buit);

  const [membresObertsId, setMembresObertsId] = useState<string | null>(null);
  const [mostrarNouMembre, setMostrarNouMembre] = useState(false);
  const [formMembre, setFormMembre] = useState(buitMembre);
  const [docObertId, setDocObertId] = useState<string | null>(null);
  const [nouDocTipus, setNouDocTipus] = useState<TipusDocMembre>('DNI');
  const [nouDocCaducitat, setNouDocCaducitat] = useState('');
  const [nouDocFitxer, setNouDocFitxer] = useState<File | null>(null);

  async function carregar() {
    setCarregant(true);
    try {
      const [ags, mem, provs] = await Promise.all([llistarAgrupacions(), llistarMembres(), llistarProvincies()]);
      setAgrupacions(esFederacio ? ags : ags.filter((a) => a.id === usuariActual?.agrupacioId));
      setMembres(mem);
      setProvincies(provs);
    } catch {
      setError('No s\'han pogut carregar les associacions');
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
      await crearAgrupacio({
        nom: form.nom,
        provincia: form.provincia || undefined,
        municipi: form.municipi || undefined,
        comarca: form.comarca || undefined,
        adreca: form.adreca || undefined,
        telefon: form.telefon || undefined,
        email: form.email || undefined,
        president: form.president || undefined,
        dataFundacio: form.dataFundacio || undefined,
      });
      setForm(buit);
      setMostrarFormulari(false);
      carregar();
    } catch {
      setError('No s\'ha pogut crear l\'associació');
    }
  }

  function obrirEdicio(a: Agrupacio) {
    setEditantId(editantId === a.id ? null : a.id);
    setEditForm({
      nom: a.nom,
      provincia: a.provincia || '',
      municipi: a.municipi || '',
      comarca: a.comarca || '',
      adreca: a.adreca || '',
      telefon: a.telefon || '',
      email: a.email || '',
      president: a.president || '',
      dataFundacio: a.dataFundacio ? a.dataFundacio.slice(0, 10) : '',
    });
  }

  async function handleGuardarEdicio(e: React.FormEvent) {
    e.preventDefault();
    if (!editantId) return;
    setError('');
    try {
      await editarAgrupacio(editantId, {
        nom: editForm.nom,
        provincia: editForm.provincia || undefined,
        municipi: editForm.municipi || undefined,
        comarca: editForm.comarca || undefined,
        adreca: editForm.adreca || undefined,
        telefon: editForm.telefon || undefined,
        email: editForm.email || undefined,
        president: editForm.president || undefined,
        dataFundacio: editForm.dataFundacio || undefined,
      } as any);
      setEditantId(null);
      carregar();
    } catch {
      setError('No s\'han pogut desar els canvis');
    }
  }

  async function handleEliminarAssociacio(id: string) {
    try {
      await eliminarAgrupacio(id);
      carregar();
    } catch {
      setError('No s\'ha pogut eliminar l\'associació (desactiva-la si té dades associades)');
    }
  }

  async function handleCrearMembre(agrupacioId: string, e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await crearMembre({
        agrupacioId,
        nom: formMembre.nom,
        cognoms: formMembre.cognoms,
        dni: formMembre.dni || undefined,
        dataNaixement: formMembre.dataNaixement || undefined,
        telefon: formMembre.telefon || undefined,
        email: formMembre.email || undefined,
      });
      setFormMembre(buitMembre);
      setMostrarNouMembre(false);
      carregar();
    } catch {
      setError('No s\'ha pogut crear el membre');
    }
  }

  async function handleBaixaMembre(m: Membre) {
    try {
      await editarMembre(m.id, { actiu: !m.actiu, dataBaixa: m.actiu ? new Date().toISOString() : null } as any);
      carregar();
    } catch {
      setError('No s\'ha pogut actualitzar el membre');
    }
  }

  async function handleEliminarMembre(id: string) {
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

  if (carregant) return <p className="page text-muted">Carregant associacions...</p>;

  return (
    <div className="page">
      <BotoTornar />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Associacions</h1>
        {esFederacio && (
          <button onClick={() => setMostrarFormulari(!mostrarFormulari)}>
            {mostrarFormulari ? 'Cancel·lar' : '+ Nova associació'}
          </button>
        )}
      </div>

      {error && <p className="text-error">{error}</p>}

      {mostrarFormulari && (
        <form onSubmit={handleCrear} className="card" style={{ marginBottom: 20, maxWidth: 460 }}>
          <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Nom de l'associació</label>
              <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Província (opcional)</label>
              <select value={form.provincia} onChange={(e) => setForm({ ...form, provincia: e.target.value })} style={{ width: '100%' }}>
                <option value="">Sense especificar</option>
                {provincies.map((p) => (
                  <option key={p.id} value={p.nom}>{p.nom}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Municipi (opcional)</label>
              <input value={form.municipi} onChange={(e) => setForm({ ...form, municipi: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Comarca (opcional)</label>
              <input value={form.comarca} onChange={(e) => setForm({ ...form, comarca: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>President/a (opcional)</label>
              <input value={form.president} onChange={(e) => setForm({ ...form, president: e.target.value })} style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Adreça (opcional)</label>
            <input value={form.adreca} onChange={(e) => setForm({ ...form, adreca: e.target.value })} style={{ width: '100%' }} />
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
          <div style={{ marginBottom: 10 }}>
            <label>Data de fundació (opcional)</label>
            <input type="date" value={form.dataFundacio} onChange={(e) => setForm({ ...form, dataFundacio: e.target.value })} style={{ width: '100%' }} />
          </div>
          <button type="submit">Crear associació</button>
        </form>
      )}

      {agrupacions.length === 0 ? (
        <p className="text-muted">Encara no hi ha cap associació registrada.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {agrupacions.map((a) => {
            const membresAssociacio = membres.filter((m) => m.agrupacioId === a.id);
            const pendentsTotal = membresAssociacio.reduce((acc, m) => acc + m.documents.filter((d) => d.estat !== 'REBUT').length, 0);
            return (
              <div key={a.id} className="card" style={{ maxWidth: 620 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong>{a.nom}</strong>
                  {!a.actiu && <span className="badge" style={{ color: 'var(--c-error)', background: 'var(--c-error-bg)' }}>Inactiva</span>}
                </div>
                {(a.provincia || a.municipi || a.comarca) && (
                  <p className="text-muted" style={{ fontSize: 13, margin: '4px 0' }}>
                    {[a.provincia, a.municipi, a.comarca].filter(Boolean).join(' · ')}
                  </p>
                )}
                {a.president && <p style={{ fontSize: 13, margin: '4px 0' }}>President/a: {a.president}</p>}
                {(a.telefon || a.email) && (
                  <p className="text-muted" style={{ fontSize: 12, margin: '4px 0' }}>
                    {[a.telefon, a.email].filter(Boolean).join(' · ')}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => setMembresObertsId(membresObertsId === a.id ? null : a.id)} style={{ fontSize: 12 }}>
                    {membresObertsId === a.id ? 'Amagar membres' : `Membres (${membresAssociacio.length})`}
                  </button>
                  {pendentsTotal > 0 && (
                    <span className="badge" style={{ color: 'var(--c-warning)', background: 'var(--c-warning-bg)', alignSelf: 'center' }}>
                      {pendentsTotal} document{pendentsTotal > 1 ? 's' : ''} pendent{pendentsTotal > 1 ? 's' : ''}
                    </span>
                  )}
                  {esFederacio && (
                    <>
                      <button onClick={() => obrirEdicio(a)} style={{ fontSize: 12 }}>
                        {editantId === a.id ? 'Cancel·lar edició' : 'Editar'}
                      </button>
                      <button onClick={() => handleEliminarAssociacio(a.id)} style={{ fontSize: 12, color: 'var(--c-error)' }}>
                        Eliminar
                      </button>
                    </>
                  )}
                </div>

                {editantId === a.id && (
                  <form onSubmit={handleGuardarEdicio} style={{ borderTop: '1px solid var(--c-border)', marginTop: 10, paddingTop: 10 }}>
                    <div style={{ marginBottom: 8, display: 'flex', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <label>Nom</label>
                        <input value={editForm.nom} onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })} required style={{ width: '100%' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label>Província</label>
                        <select value={editForm.provincia} onChange={(e) => setEditForm({ ...editForm, provincia: e.target.value })} style={{ width: '100%' }}>
                          <option value="">Sense especificar</option>
                          {provincies.map((p) => (
                            <option key={p.id} value={p.nom}>{p.nom}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div style={{ marginBottom: 8, display: 'flex', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <label>Municipi</label>
                        <input value={editForm.municipi} onChange={(e) => setEditForm({ ...editForm, municipi: e.target.value })} style={{ width: '100%' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label>Comarca</label>
                        <input value={editForm.comarca} onChange={(e) => setEditForm({ ...editForm, comarca: e.target.value })} style={{ width: '100%' }} />
                      </div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label>President/a</label>
                      <input value={editForm.president} onChange={(e) => setEditForm({ ...editForm, president: e.target.value })} style={{ width: '100%' }} />
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label>Adreça</label>
                      <input value={editForm.adreca} onChange={(e) => setEditForm({ ...editForm, adreca: e.target.value })} style={{ width: '100%' }} />
                    </div>
                    <div style={{ marginBottom: 8, display: 'flex', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <label>Telèfon</label>
                        <input value={editForm.telefon} onChange={(e) => setEditForm({ ...editForm, telefon: e.target.value })} style={{ width: '100%' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label>Email</label>
                        <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} style={{ width: '100%' }} />
                      </div>
                    </div>
                    <button type="submit">Desar canvis</button>
                  </form>
                )}

                {membresObertsId === a.id && (
                  <div style={{ borderTop: '1px solid var(--c-border)', marginTop: 10, paddingTop: 10 }}>
                    {membresAssociacio.length === 0 ? (
                      <p className="text-muted" style={{ fontSize: 13 }}>Encara no hi ha cap membre registrat.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
                        {membresAssociacio.map((m) => {
                          const pendents = m.documents.filter((d) => d.estat !== 'REBUT').length;
                          return (
                            <div key={m.id} style={{ border: '1px solid var(--c-border)', borderRadius: 'var(--radius-sm)', padding: 10 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <strong style={{ fontSize: 14 }}>{m.nom} {m.cognoms}</strong>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  {pendents > 0 && (
                                    <span className="badge" style={{ color: 'var(--c-warning)', background: 'var(--c-warning-bg)' }}>
                                      {pendents} pendent{pendents > 1 ? 's' : ''}
                                    </span>
                                  )}
                                  {!m.actiu && <span className="badge" style={{ color: 'var(--c-error)', background: 'var(--c-error-bg)' }}>Baixa</span>}
                                </div>
                              </div>
                              <p className="text-muted" style={{ fontSize: 12, margin: '4px 0' }}>
                                {[m.dni, m.telefon, m.email].filter(Boolean).join(' · ') || 'Sense dades de contacte'}
                              </p>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => setDocObertId(docObertId === m.id ? null : m.id)} style={{ fontSize: 11 }}>
                                  {docObertId === m.id ? 'Amagar documentació' : 'Documentació'}
                                </button>
                                <button onClick={() => handleBaixaMembre(m)} style={{ fontSize: 11 }}>
                                  {m.actiu ? 'Donar de baixa' : 'Reactivar'}
                                </button>
                                <button onClick={() => handleEliminarMembre(m.id)} style={{ fontSize: 11, color: 'var(--c-error)' }}>
                                  Eliminar
                                </button>
                              </div>

                              {docObertId === m.id && (
                                <div style={{ borderTop: '1px solid var(--c-border)', marginTop: 8, paddingTop: 8 }}>
                                  {m.documents.length === 0 ? (
                                    <p className="text-muted" style={{ fontSize: 12 }}>Encara no hi ha cap document registrat.</p>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                                      {m.documents.map((d) => (
                                        <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                                          <span>
                                            {TIPUS_DOC_LABEL[d.tipus]}{' '}
                                            <span style={{ color: ESTAT_DOC_COLOR[d.estat], fontWeight: 600 }}>({d.estat.toLowerCase()})</span>
                                            {d.dataCaducitat && ` · caduca ${new Date(d.dataCaducitat).toLocaleDateString('ca-ES')}`}
                                          </span>
                                          <button onClick={() => handleEliminarDocument(d.id)} style={{ fontSize: 10, color: 'var(--c-error)' }}>
                                            Eliminar
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <form onSubmit={(e) => handleAfegirDocument(m.id, e)} style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                    <div>
                                      <label style={{ fontSize: 11 }}>Tipus</label>
                                      <select value={nouDocTipus} onChange={(e) => setNouDocTipus(e.target.value as TipusDocMembre)}>
                                        {Object.entries(TIPUS_DOC_LABEL).map(([valor, etiqueta]) => (
                                          <option key={valor} value={valor}>{etiqueta}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label style={{ fontSize: 11 }}>Caducitat</label>
                                      <input type="date" value={nouDocCaducitat} onChange={(e) => setNouDocCaducitat(e.target.value)} />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: 11 }}>Fitxer</label>
                                      <input type="file" onChange={(e) => setNouDocFitxer(e.target.files?.[0] || null)} />
                                    </div>
                                    <button type="submit" style={{ fontSize: 12 }}>Afegir</button>
                                  </form>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <button onClick={() => setMostrarNouMembre(mostrarNouMembre === true ? false : true)} style={{ fontSize: 12 }}>
                      {mostrarNouMembre ? 'Cancel·lar' : '+ Nou membre'}
                    </button>

                    {mostrarNouMembre && (
                      <form onSubmit={(e) => handleCrearMembre(a.id, e)} className="card" style={{ marginTop: 10 }}>
                        <div style={{ marginBottom: 8, display: 'flex', gap: 10 }}>
                          <div style={{ flex: 1 }}>
                            <label>Nom</label>
                            <input value={formMembre.nom} onChange={(e) => setFormMembre({ ...formMembre, nom: e.target.value })} required style={{ width: '100%' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label>Cognoms</label>
                            <input value={formMembre.cognoms} onChange={(e) => setFormMembre({ ...formMembre, cognoms: e.target.value })} required style={{ width: '100%' }} />
                          </div>
                        </div>
                        <div style={{ marginBottom: 8, display: 'flex', gap: 10 }}>
                          <div style={{ flex: 1 }}>
                            <label>DNI (opcional)</label>
                            <input value={formMembre.dni} onChange={(e) => setFormMembre({ ...formMembre, dni: e.target.value })} style={{ width: '100%' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label>Data naixement (opcional)</label>
                            <input type="date" value={formMembre.dataNaixement} onChange={(e) => setFormMembre({ ...formMembre, dataNaixement: e.target.value })} style={{ width: '100%' }} />
                          </div>
                        </div>
                        <div style={{ marginBottom: 8, display: 'flex', gap: 10 }}>
                          <div style={{ flex: 1 }}>
                            <label>Telèfon (opcional)</label>
                            <input value={formMembre.telefon} onChange={(e) => setFormMembre({ ...formMembre, telefon: e.target.value })} style={{ width: '100%' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label>Email (opcional)</label>
                            <input type="email" value={formMembre.email} onChange={(e) => setFormMembre({ ...formMembre, email: e.target.value })} style={{ width: '100%' }} />
                          </div>
                        </div>
                        <button type="submit">Crear membre</button>
                      </form>
                    )}
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
