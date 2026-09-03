import { useEffect, useState } from 'react';
import { Usuari, crearUsuari, crearUsuariNovaAssociacio, editarUsuari, eliminarUsuari, llistarUsuaris } from '../services/usuaris';
import { Agrupacio, llistarAgrupacions } from '../services/agrupacions';
import { Provincia, crearProvincia, editarProvincia, eliminarProvincia, llistarProvincies } from '../services/provincies';
import BotoTornar from '../components/BotoTornar';

const buit = {
  rol: 'AGRUPACIO' as 'FEDERACIO' | 'AGRUPACIO',
  mode: 'nova' as 'nova' | 'existent',
  // usuari de federació, o usuari d'una associació ja existent
  nom: '',
  usuari: '',
  // alta ràpida: associació nova + usuari + membre (president) en un sol pas
  nomAssociacio: '',
  president: '',
  provincia: '',
  agrupacioId: '',
  contrasenya: '',
};

export default function GestioUsuaris() {
  const [usuaris, setUsuaris] = useState<Usuari[]>([]);
  const [agrupacions, setAgrupacions] = useState<Agrupacio[]>([]);
  const [provincies, setProvincies] = useState<Provincia[]>([]);
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState('');
  const [ultimLogin, setUltimLogin] = useState<{ associacio: string; login: string } | null>(null);

  const [mostrarFormulari, setMostrarFormulari] = useState(false);
  const [form, setForm] = useState(buit);

  const [mostrarProvincies, setMostrarProvincies] = useState(false);
  const [novaProvincia, setNovaProvincia] = useState('');
  const [editantProvinciaId, setEditantProvinciaId] = useState<string | null>(null);
  const [editProvinciaNom, setEditProvinciaNom] = useState('');

  const [editantId, setEditantId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nom: '', rol: 'AGRUPACIO' as 'FEDERACIO' | 'AGRUPACIO', agrupacioId: '', actiu: true, contrasenya: '' });

  async function carregar() {
    setCarregant(true);
    try {
      const [u, a, p] = await Promise.all([llistarUsuaris(), llistarAgrupacions(), llistarProvincies()]);
      setUsuaris(u);
      setAgrupacions(a);
      setProvincies(p);
    } catch {
      setError('No s\'han pogut carregar els usuaris');
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
    setUltimLogin(null);
    try {
      if (form.rol === 'FEDERACIO') {
        await crearUsuari({
          nom: form.nom,
          usuari: form.usuari.toLowerCase(),
          contrasenya: form.contrasenya,
          rol: 'FEDERACIO',
        });
      } else if (form.mode === 'nova') {
        const resultat = await crearUsuariNovaAssociacio({
          nomAssociacio: form.nomAssociacio,
          president: form.president,
          provincia: form.provincia || undefined,
          contrasenya: form.contrasenya,
        });
        setUltimLogin({ associacio: resultat.agrupacio.nom, login: resultat.usuari.usuari });
      } else {
        await crearUsuari({
          nom: form.nom,
          usuari: form.usuari.toLowerCase(),
          contrasenya: form.contrasenya,
          rol: 'AGRUPACIO',
          agrupacioId: form.agrupacioId,
        });
      }
      setForm(buit);
      setMostrarFormulari(false);
      carregar();
    } catch (err: any) {
      setError(err?.response?.data?.error || "No s'ha pogut crear l'usuari");
    }
  }

  function obrirEdicio(u: Usuari) {
    setEditantId(editantId === u.id ? null : u.id);
    setEditForm({ nom: u.nom, rol: u.rol, agrupacioId: u.agrupacioId || '', actiu: u.actiu, contrasenya: '' });
  }

  async function handleGuardarEdicio(e: React.FormEvent) {
    e.preventDefault();
    if (!editantId) return;
    setError('');
    try {
      await editarUsuari(editantId, {
        nom: editForm.nom,
        rol: editForm.rol,
        agrupacioId: editForm.rol === 'AGRUPACIO' ? editForm.agrupacioId : undefined,
        actiu: editForm.actiu,
        contrasenya: editForm.contrasenya || undefined,
      });
      setEditantId(null);
      carregar();
    } catch {
      setError('No s\'han pogut desar els canvis');
    }
  }

  async function handleEliminar(id: string) {
    try {
      await eliminarUsuari(id);
      carregar();
    } catch {
      setError('No s\'ha pogut eliminar l\'usuari (prova de desactivar-lo)');
    }
  }

  async function handleAfegirProvincia(e: React.FormEvent) {
    e.preventDefault();
    if (!novaProvincia.trim()) return;
    try {
      await crearProvincia(novaProvincia.trim());
      setNovaProvincia('');
      carregar();
    } catch {
      setError('No s\'ha pogut afegir la província (potser ja existeix)');
    }
  }

  async function handleGuardarProvincia(id: string) {
    try {
      await editarProvincia(id, editProvinciaNom);
      setEditantProvinciaId(null);
      carregar();
    } catch {
      setError('No s\'ha pogut desar la província');
    }
  }

  async function handleEliminarProvincia(id: string) {
    try {
      await eliminarProvincia(id);
      carregar();
    } catch {
      setError('No s\'ha pogut eliminar la província');
    }
  }

  if (carregant) return <p className="page text-muted">Carregant usuaris...</p>;

  return (
    <div className="page">
      <BotoTornar />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Usuaris</h1>
        <button onClick={() => setMostrarFormulari(!mostrarFormulari)}>
          {mostrarFormulari ? 'Cancel·lar' : '+ Nou usuari'}
        </button>
      </div>

      {error && <p className="text-error">{error}</p>}

      {ultimLogin && (
        <div className="card card--warning" style={{ marginBottom: 20, maxWidth: 420 }}>
          <p style={{ margin: 0 }}>
            Associació <strong>{ultimLogin.associacio}</strong> creada. Nom d'usuari per entrar:{' '}
            <strong>{ultimLogin.login}</strong>
          </p>
          <p className="text-muted" style={{ fontSize: 12, margin: '6px 0 0' }}>
            Apunta aquest nom d'usuari (també el pots consultar a sota, a la fitxa de l'usuari).
          </p>
        </div>
      )}

      {mostrarFormulari && (
        <form onSubmit={handleCrear} className="card" style={{ marginBottom: 20, maxWidth: 420 }}>
          <div style={{ marginBottom: 10 }}>
            <label>Rol</label>
            <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value as any })} style={{ width: '100%' }}>
              <option value="AGRUPACIO">Associació</option>
              <option value="FEDERACIO">Federació</option>
            </select>
          </div>

          {form.rol === 'FEDERACIO' && (
            <>
              <div style={{ marginBottom: 10 }}>
                <label>Nom</label>
                <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required style={{ width: '100%' }} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label>Nom d'usuari</label>
                <input value={form.usuari} onChange={(e) => setForm({ ...form, usuari: e.target.value })} required style={{ width: '100%' }} />
              </div>
            </>
          )}

          {form.rol === 'AGRUPACIO' && (
            <>
              <div style={{ marginBottom: 10, display: 'flex', gap: 14 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 0 }}>
                  <input type="radio" name="mode" checked={form.mode === 'nova'} onChange={() => setForm({ ...form, mode: 'nova' })} style={{ width: 'auto' }} />
                  Associació nova
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 0 }}>
                  <input type="radio" name="mode" checked={form.mode === 'existent'} onChange={() => setForm({ ...form, mode: 'existent' })} style={{ width: 'auto' }} />
                  Associació existent
                </label>
              </div>

              {form.mode === 'nova' ? (
                <>
                  <div style={{ marginBottom: 10 }}>
                    <label>Nom de l'associació</label>
                    <input value={form.nomAssociacio} onChange={(e) => setForm({ ...form, nomAssociacio: e.target.value })} required style={{ width: '100%' }} />
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label>President/a</label>
                    <input value={form.president} onChange={(e) => setForm({ ...form, president: e.target.value })} required style={{ width: '100%' }} />
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <label>Província</label>
                    <select value={form.provincia} onChange={(e) => setForm({ ...form, provincia: e.target.value })} style={{ width: '100%' }}>
                      <option value="">Sense especificar</option>
                      {provincies.map((p) => (
                        <option key={p.id} value={p.nom}>{p.nom}</option>
                      ))}
                    </select>
                  </div>
                  <button type="button" onClick={() => setMostrarProvincies(!mostrarProvincies)} style={{ fontSize: 12, marginBottom: 10 }}>
                    {mostrarProvincies ? 'Amagar gestió de províncies' : 'Gestionar províncies'}
                  </button>

                  {mostrarProvincies && (
                    <div className="card" style={{ marginBottom: 10, background: 'var(--c-surface-alt)' }}>
                      {provincies.length === 0 && <p className="text-muted" style={{ fontSize: 12 }}>Encara no hi ha cap província.</p>}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                        {provincies.map((p) => (
                          <div key={p.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            {editantProvinciaId === p.id ? (
                              <>
                                <input value={editProvinciaNom} onChange={(e) => setEditProvinciaNom(e.target.value)} style={{ flex: 1, fontSize: 13 }} />
                                <button type="button" onClick={() => handleGuardarProvincia(p.id)} style={{ fontSize: 11 }}>Desar</button>
                              </>
                            ) : (
                              <>
                                <span style={{ flex: 1, fontSize: 13 }}>{p.nom}</span>
                                <button type="button" onClick={() => { setEditantProvinciaId(p.id); setEditProvinciaNom(p.nom); }} style={{ fontSize: 11 }}>Editar</button>
                              </>
                            )}
                            <button type="button" onClick={() => handleEliminarProvincia(p.id)} style={{ fontSize: 11, color: 'var(--c-error)' }}>Eliminar</button>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input value={novaProvincia} onChange={(e) => setNovaProvincia(e.target.value)} placeholder="Nova província" style={{ flex: 1, fontSize: 13 }} />
                        <button type="button" onClick={handleAfegirProvincia} style={{ fontSize: 12 }}>Afegir</button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ marginBottom: 10 }}>
                    <label>Nom</label>
                    <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required style={{ width: '100%' }} />
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label>Nom d'usuari</label>
                    <input value={form.usuari} onChange={(e) => setForm({ ...form, usuari: e.target.value })} required style={{ width: '100%' }} />
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label>Associació</label>
                    <select value={form.agrupacioId} onChange={(e) => setForm({ ...form, agrupacioId: e.target.value })} required style={{ width: '100%' }}>
                      <option value="">Selecciona una associació...</option>
                      {agrupacions.map((a) => (
                        <option key={a.id} value={a.id}>{a.nom}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </>
          )}

          <div style={{ marginBottom: 10 }}>
            <label>Contrasenya</label>
            <input type="password" value={form.contrasenya} onChange={(e) => setForm({ ...form, contrasenya: e.target.value })} required minLength={6} style={{ width: '100%' }} />
          </div>
          <button type="submit">Crear usuari</button>
        </form>
      )}

      {usuaris.length === 0 ? (
        <p className="text-muted">Encara no hi ha cap usuari registrat.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {usuaris.map((u) => (
            <div key={u.id} className="card" style={{ maxWidth: 460 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong>{u.nom}</strong>
                <span className="badge badge--role">{u.rol === 'FEDERACIO' ? 'Federació' : u.agrupacio?.nom || 'Associació'}</span>
              </div>
              <p className="text-muted" style={{ fontSize: 13, margin: '4px 0' }}>
                @{u.usuari} {!u.actiu && '· Desactivat'}
              </p>

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => obrirEdicio(u)} style={{ fontSize: 12 }}>
                  {editantId === u.id ? 'Cancel·lar' : 'Editar'}
                </button>
                <button onClick={() => handleEliminar(u.id)} style={{ fontSize: 12, color: 'var(--c-error)' }}>
                  Eliminar
                </button>
              </div>

              {editantId === u.id && (
                <form onSubmit={handleGuardarEdicio} style={{ borderTop: '1px solid var(--c-border)', marginTop: 10, paddingTop: 10 }}>
                  <div style={{ marginBottom: 8 }}>
                    <label>Nom</label>
                    <input value={editForm.nom} onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })} required style={{ width: '100%' }} />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label>Rol</label>
                    <select value={editForm.rol} onChange={(e) => setEditForm({ ...editForm, rol: e.target.value as any })} style={{ width: '100%' }}>
                      <option value="AGRUPACIO">Associació</option>
                      <option value="FEDERACIO">Federació</option>
                    </select>
                  </div>
                  {editForm.rol === 'AGRUPACIO' && (
                    <div style={{ marginBottom: 8 }}>
                      <label>Associació</label>
                      <select value={editForm.agrupacioId} onChange={(e) => setEditForm({ ...editForm, agrupacioId: e.target.value })} required style={{ width: '100%' }}>
                        <option value="">Selecciona una associació...</option>
                        {agrupacions.map((a) => (
                          <option key={a.id} value={a.id}>{a.nom}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div style={{ marginBottom: 8 }}>
                    <label>
                      <input type="checkbox" checked={editForm.actiu} onChange={(e) => setEditForm({ ...editForm, actiu: e.target.checked })} style={{ width: 'auto', marginRight: 6 }} />
                      Actiu
                    </label>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label>Restableix la contrasenya (opcional)</label>
                    <input type="password" value={editForm.contrasenya} onChange={(e) => setEditForm({ ...editForm, contrasenya: e.target.value })} minLength={6} style={{ width: '100%' }} />
                  </div>
                  <button type="submit">Desar canvis</button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
