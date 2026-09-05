import { Fragment, useEffect, useState } from 'react';
import {
  Voluntari,
  Disponibilitat,
  crearVoluntari,
  editarVoluntari,
  eliminarVoluntari,
  llistarVoluntaris,
} from '../services/voluntaris';
import { Agrupacio, llistarAgrupacions } from '../services/agrupacions';
import { Provincia, llistarProvincies } from '../services/provincies';
import { getUsuariActual } from '../services/api';

const DISPONIBILITAT_LABEL: Record<Disponibilitat, string> = {
  PRESENCIAL: 'Presencial',
  IMMEDIATA: 'Immediata',
  DIFERIDA: 'Diferida',
  NO_DISPONIBLE: 'No disponible',
};

const DISPONIBILITAT_COLOR: Record<Disponibilitat, string> = {
  PRESENCIAL: 'var(--c-success)',
  IMMEDIATA: 'var(--c-warning)',
  DIFERIDA: 'var(--c-warning)',
  NO_DISPONIBLE: 'var(--c-error)',
};

const buit = {
  nom: '',
  cognoms: '',
  telefon: '',
  dni: '',
  genere: '',
  dataNaixement: '',
  provincia: '',
  localitat: '',
  adreca: '',
  codiPostal: '',
  dataIngres: '',
  numeroIdentificacio: '',
  indicatiu: '',
  carrec: '',
  altresEmails: '',
  altresAgrupacions: '',
  disponibilitat: 'NO_DISPONIBLE' as Disponibilitat,
  emailAcces: '',
  contrasenyaAcces: '',
};

export default function VoluntarisPage({ embedded = false }: { embedded?: boolean } = {}) {
  const usuariActual = getUsuariActual();
  const esFederacio = usuariActual?.rol === 'FEDERACIO';
  const [voluntaris, setVoluntaris] = useState<Voluntari[]>([]);
  const [agrupacions, setAgrupacions] = useState<Agrupacio[]>([]);
  const [provincies, setProvincies] = useState<Provincia[]>([]);
  const [agrupacioSeleccionada, setAgrupacioSeleccionada] = useState('');
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState('');
  const [mostrarFormulari, setMostrarFormulari] = useState(false);
  const [form, setForm] = useState(buit);
  const [editantId, setEditantId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(buit);

  async function carregar() {
    setCarregant(true);
    try {
      const [ags, provs] = await Promise.all([
        esFederacio ? llistarAgrupacions() : Promise.resolve([]),
        llistarProvincies(),
      ]);
      setAgrupacions(ags);
      setProvincies(provs);
      const v = await llistarVoluntaris(esFederacio ? agrupacioSeleccionada || undefined : undefined);
      setVoluntaris(v);
    } catch {
      setError('No s\'han pogut carregar els voluntaris');
    } finally {
      setCarregant(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agrupacioSeleccionada]);

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (esFederacio && !agrupacioSeleccionada) {
      setError('Selecciona primer una associació');
      return;
    }
    try {
      await crearVoluntari({
        agrupacioId: esFederacio ? agrupacioSeleccionada : undefined,
        nom: form.nom,
        cognoms: form.cognoms,
        telefon: form.telefon || undefined,
        dni: form.dni || undefined,
        genere: form.genere || undefined,
        dataNaixement: form.dataNaixement || undefined,
        provincia: form.provincia || undefined,
        localitat: form.localitat || undefined,
        adreca: form.adreca || undefined,
        codiPostal: form.codiPostal || undefined,
        dataIngres: form.dataIngres || undefined,
        numeroIdentificacio: form.numeroIdentificacio || undefined,
        indicatiu: form.indicatiu || undefined,
        carrec: form.carrec || undefined,
        altresEmails: form.altresEmails || undefined,
        altresAgrupacions: form.altresAgrupacions || undefined,
        disponibilitat: form.disponibilitat,
        emailAcces: form.emailAcces || undefined,
        contrasenyaAcces: form.contrasenyaAcces || undefined,
      });
      setForm(buit);
      setMostrarFormulari(false);
      carregar();
    } catch {
      setError('No s\'ha pogut crear el voluntari');
    }
  }

  function obrirEdicio(v: Voluntari) {
    setEditantId(editantId === v.id ? null : v.id);
    setEditForm({
      nom: v.nom,
      cognoms: v.cognoms,
      telefon: v.telefon || '',
      dni: v.dni || '',
      genere: v.genere || '',
      dataNaixement: v.dataNaixement ? v.dataNaixement.slice(0, 10) : '',
      provincia: v.provincia || '',
      localitat: v.localitat || '',
      adreca: v.adreca || '',
      codiPostal: v.codiPostal || '',
      dataIngres: v.dataIngres ? v.dataIngres.slice(0, 10) : '',
      numeroIdentificacio: v.numeroIdentificacio || '',
      indicatiu: v.indicatiu || '',
      carrec: v.carrec || '',
      altresEmails: v.altresEmails || '',
      altresAgrupacions: v.altresAgrupacions || '',
      disponibilitat: v.disponibilitat,
      emailAcces: '',
      contrasenyaAcces: '',
    });
  }

  async function handleGuardarEdicio(e: React.FormEvent) {
    e.preventDefault();
    if (!editantId) return;
    setError('');
    try {
      await editarVoluntari(editantId, {
        nom: editForm.nom,
        cognoms: editForm.cognoms,
        telefon: editForm.telefon || undefined,
        dni: editForm.dni || undefined,
        genere: editForm.genere || undefined,
        dataNaixement: editForm.dataNaixement || undefined,
        provincia: editForm.provincia || undefined,
        localitat: editForm.localitat || undefined,
        adreca: editForm.adreca || undefined,
        codiPostal: editForm.codiPostal || undefined,
        dataIngres: editForm.dataIngres || undefined,
        numeroIdentificacio: editForm.numeroIdentificacio || undefined,
        indicatiu: editForm.indicatiu || undefined,
        carrec: editForm.carrec || undefined,
        altresEmails: editForm.altresEmails || undefined,
        altresAgrupacions: editForm.altresAgrupacions || undefined,
        disponibilitat: editForm.disponibilitat,
      });
      setEditantId(null);
      carregar();
    } catch {
      setError('No s\'han pogut desar els canvis');
    }
  }

  async function handleEliminar(id: string) {
    try {
      await eliminarVoluntari(id);
      carregar();
    } catch {
      setError('No s\'ha pogut eliminar el voluntari');
    }
  }

  const actius = voluntaris.filter((v) => v.actiu);
  const baixes = voluntaris.filter((v) => !v.actiu);

  return (
    <div className={embedded ? undefined : 'page'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {!embedded && <h1>Voluntaris</h1>}
        <button onClick={() => setMostrarFormulari(!mostrarFormulari)}>
          {mostrarFormulari ? 'Cancel·lar' : '+ Nou voluntari'}
        </button>
      </div>

      {esFederacio && (
        <div style={{ marginBottom: 14, maxWidth: 320 }}>
          <label>Associació</label>
          <select value={agrupacioSeleccionada} onChange={(e) => setAgrupacioSeleccionada(e.target.value)} style={{ width: '100%' }}>
            <option value="">Selecciona una associació...</option>
            {agrupacions.map((a) => (
              <option key={a.id} value={a.id}>{a.nom}</option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="text-error">{error}</p>}

      {mostrarFormulari && (
        <form onSubmit={handleCrear} className="card" style={{ marginBottom: 20, maxWidth: 520 }}>
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
              <label>Telèfon</label>
              <input value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>DNI/NIE</label>
              <input value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Gènere</label>
              <select value={form.genere} onChange={(e) => setForm({ ...form, genere: e.target.value })} style={{ width: '100%' }}>
                <option value="">Sense especificar</option>
                <option value="Home">Home</option>
                <option value="Dona">Dona</option>
                <option value="Altre">Altre</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label>Data de naixement</label>
              <input type="date" value={form.dataNaixement} onChange={(e) => setForm({ ...form, dataNaixement: e.target.value })} style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Província</label>
              <select value={form.provincia} onChange={(e) => setForm({ ...form, provincia: e.target.value })} style={{ width: '100%' }}>
                <option value="">Sense especificar</option>
                {provincies.map((p) => (
                  <option key={p.id} value={p.nom}>{p.nom}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label>Localitat</label>
              <input value={form.localitat} onChange={(e) => setForm({ ...form, localitat: e.target.value })} style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
            <div style={{ flex: 2 }}>
              <label>Adreça</label>
              <input value={form.adreca} onChange={(e) => setForm({ ...form, adreca: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Codi postal</label>
              <input value={form.codiPostal} onChange={(e) => setForm({ ...form, codiPostal: e.target.value })} style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Data d'ingrés</label>
              <input type="date" value={form.dataIngres} onChange={(e) => setForm({ ...form, dataIngres: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Nº identificació</label>
              <input value={form.numeroIdentificacio} onChange={(e) => setForm({ ...form, numeroIdentificacio: e.target.value })} style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Indicatiu</label>
              <input value={form.indicatiu} onChange={(e) => setForm({ ...form, indicatiu: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Càrrec/Rang</label>
              <input value={form.carrec} onChange={(e) => setForm({ ...form, carrec: e.target.value })} style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Disponibilitat</label>
            <select value={form.disponibilitat} onChange={(e) => setForm({ ...form, disponibilitat: e.target.value as Disponibilitat })} style={{ width: '100%' }}>
              {Object.entries(DISPONIBILITAT_LABEL).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>{etiqueta}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Altres emails (opcional)</label>
            <textarea value={form.altresEmails} onChange={(e) => setForm({ ...form, altresEmails: e.target.value })} rows={2} style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Altres agrupacions a les que pertany (opcional)</label>
            <textarea value={form.altresAgrupacions} onChange={(e) => setForm({ ...form, altresAgrupacions: e.target.value })} rows={2} style={{ width: '100%' }} />
          </div>

          <div style={{ borderTop: '1px solid var(--c-border)', marginTop: 6, paddingTop: 12 }}>
            <p style={{ fontWeight: 600, margin: '0 0 4px' }}>Accés a l'app (opcional)</p>
            <p className="text-muted" style={{ fontSize: 12, margin: '0 0 10px' }}>
              Si li dones un email i contrasenya, el voluntari podrà connectar-se ell mateix per confirmar
              assistència als serveis. Si ho deixes en blanc, l'associació gestionarà els seus serveis directament.
            </p>
            <div style={{ marginBottom: 10 }}>
              <label>Email d'accés</label>
              <input type="email" value={form.emailAcces} onChange={(e) => setForm({ ...form, emailAcces: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label>Contrasenya</label>
              <input type="password" value={form.contrasenyaAcces} onChange={(e) => setForm({ ...form, contrasenyaAcces: e.target.value })} style={{ width: '100%' }} />
            </div>
          </div>
          <button type="submit">Crear voluntari</button>
        </form>
      )}

      {carregant ? (
        <p className="text-muted">Carregant voluntaris...</p>
      ) : voluntaris.length === 0 ? (
        <p className="text-muted">{esFederacio && !agrupacioSeleccionada ? 'Selecciona una associació per veure els seus voluntaris.' : 'Encara no hi ha cap voluntari registrat.'}</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Indicatiu</th>
                <th>Nom</th>
                <th>DNI</th>
                <th>Telèfon</th>
                <th>Disponibilitat</th>
                <th>Accés app</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[...actius, ...baixes].map((v) => (
                <Fragment key={v.id}>
                  <tr>
                    <td>{v.indicatiu || '—'}</td>
                    <td>{v.nom} {v.cognoms}{!v.actiu && <span className="badge" style={{ marginLeft: 6, color: 'var(--c-error)', background: 'var(--c-error-bg)' }}>Baixa</span>}</td>
                    <td className="text-muted">{v.dni || '—'}</td>
                    <td className="text-muted">{v.telefon || '—'}</td>
                    <td><span style={{ color: DISPONIBILITAT_COLOR[v.disponibilitat], fontWeight: 600 }}>{DISPONIBILITAT_LABEL[v.disponibilitat]}</span></td>
                    <td className="text-muted">{v.usuari ? 'Sí' : 'No'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => obrirEdicio(v)} style={{ fontSize: 12 }}>
                          {editantId === v.id ? 'Cancel·lar' : 'Editar'}
                        </button>
                        <button onClick={() => handleEliminar(v.id)} style={{ fontSize: 12, color: 'var(--c-error)' }}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editantId === v.id && (
                    <tr>
                      <td colSpan={7}>
                        <form onSubmit={handleGuardarEdicio} style={{ padding: '10px 0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                          <div>
                            <label>Nom</label>
                            <input value={editForm.nom} onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })} required />
                          </div>
                          <div>
                            <label>Cognoms</label>
                            <input value={editForm.cognoms} onChange={(e) => setEditForm({ ...editForm, cognoms: e.target.value })} required />
                          </div>
                          <div>
                            <label>Telèfon</label>
                            <input value={editForm.telefon} onChange={(e) => setEditForm({ ...editForm, telefon: e.target.value })} />
                          </div>
                          <div>
                            <label>DNI/NIE</label>
                            <input value={editForm.dni} onChange={(e) => setEditForm({ ...editForm, dni: e.target.value })} />
                          </div>
                          <div>
                            <label>Indicatiu</label>
                            <input value={editForm.indicatiu} onChange={(e) => setEditForm({ ...editForm, indicatiu: e.target.value })} style={{ width: 90 }} />
                          </div>
                          <div>
                            <label>Càrrec</label>
                            <input value={editForm.carrec} onChange={(e) => setEditForm({ ...editForm, carrec: e.target.value })} />
                          </div>
                          <div>
                            <label>Disponibilitat</label>
                            <select value={editForm.disponibilitat} onChange={(e) => setEditForm({ ...editForm, disponibilitat: e.target.value as Disponibilitat })}>
                              {Object.entries(DISPONIBILITAT_LABEL).map(([valor, etiqueta]) => (
                                <option key={valor} value={valor}>{etiqueta}</option>
                              ))}
                            </select>
                          </div>
                          <button type="submit">Desar</button>
                        </form>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
