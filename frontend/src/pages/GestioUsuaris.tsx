import { useEffect, useState } from 'react';
import { Usuari, crearUsuari, editarUsuari, eliminarUsuari, llistarUsuaris } from '../services/usuaris';
import { Agrupacio, llistarAgrupacions } from '../services/agrupacions';
import BotoTornar from '../components/BotoTornar';

const buit = {
  nom: '',
  usuari: '',
  contrasenya: '',
  rol: 'AGRUPACIO' as 'FEDERACIO' | 'AGRUPACIO',
  agrupacioId: '',
};

export default function GestioUsuaris() {
  const [usuaris, setUsuaris] = useState<Usuari[]>([]);
  const [agrupacions, setAgrupacions] = useState<Agrupacio[]>([]);
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState('');
  const [mostrarFormulari, setMostrarFormulari] = useState(false);
  const [form, setForm] = useState(buit);

  const [editantId, setEditantId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nom: '', rol: 'AGRUPACIO' as 'FEDERACIO' | 'AGRUPACIO', agrupacioId: '', actiu: true, contrasenya: '' });

  async function carregar() {
    setCarregant(true);
    try {
      const [u, a] = await Promise.all([llistarUsuaris(), llistarAgrupacions()]);
      setUsuaris(u);
      setAgrupacions(a);
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
    try {
      await crearUsuari({
        nom: form.nom,
        usuari: form.usuari.toLowerCase(),
        contrasenya: form.contrasenya,
        rol: form.rol,
        agrupacioId: form.rol === 'AGRUPACIO' ? form.agrupacioId : undefined,
      });
      setForm(buit);
      setMostrarFormulari(false);
      carregar();
    } catch {
      setError('No s\'ha pogut crear l\'usuari (revisa que el nom d\'usuari no estigui repetit)');
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

      {mostrarFormulari && (
        <form onSubmit={handleCrear} className="card" style={{ marginBottom: 20, maxWidth: 420 }}>
          <div style={{ marginBottom: 10 }}>
            <label>Nom</label>
            <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Nom d'usuari</label>
            <input value={form.usuari} onChange={(e) => setForm({ ...form, usuari: e.target.value })} required style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Contrasenya</label>
            <input type="password" value={form.contrasenya} onChange={(e) => setForm({ ...form, contrasenya: e.target.value })} required minLength={6} style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Rol</label>
            <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value as any })} style={{ width: '100%' }}>
              <option value="AGRUPACIO">Associació</option>
              <option value="FEDERACIO">Federació</option>
            </select>
          </div>
          {form.rol === 'AGRUPACIO' && (
            <div style={{ marginBottom: 10 }}>
              <label>Associació</label>
              <select value={form.agrupacioId} onChange={(e) => setForm({ ...form, agrupacioId: e.target.value })} required style={{ width: '100%' }}>
                <option value="">Selecciona una associació...</option>
                {agrupacions.map((a) => (
                  <option key={a.id} value={a.id}>{a.nom} ({a.municipi})</option>
                ))}
              </select>
            </div>
          )}
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
                          <option key={a.id} value={a.id}>{a.nom} ({a.municipi})</option>
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
                    <label>Nova contrasenya (opcional)</label>
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
