import { useEffect, useState } from 'react';
import {
  Agrupacio,
  crearAgrupacio,
  editarAgrupacio,
  eliminarAgrupacio,
  llistarAgrupacions,
} from '../services/agrupacions';
import BotoTornar from '../components/BotoTornar';

const buit = {
  nom: '',
  municipi: '',
  comarca: '',
  adreca: '',
  telefon: '',
  email: '',
  president: '',
  dataFundacio: '',
};

export default function Agrupacions() {
  const [agrupacions, setAgrupacions] = useState<Agrupacio[]>([]);
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState('');
  const [mostrarFormulari, setMostrarFormulari] = useState(false);
  const [form, setForm] = useState(buit);

  const [editantId, setEditantId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(buit);

  async function carregar() {
    setCarregant(true);
    try {
      const dades = await llistarAgrupacions();
      setAgrupacions(dades);
    } catch {
      setError('No s\'han pogut carregar les agrupacions');
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
      await crearAgrupacio({
        nom: form.nom,
        municipi: form.municipi,
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
      setError('No s\'ha pogut crear l\'agrupació');
    }
  }

  function obrirEdicio(a: Agrupacio) {
    setEditantId(editantId === a.id ? null : a.id);
    setEditForm({
      nom: a.nom,
      municipi: a.municipi,
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
        municipi: editForm.municipi,
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

  async function handleEliminar(id: string) {
    try {
      await eliminarAgrupacio(id);
      carregar();
    } catch {
      setError('No s\'ha pogut eliminar l\'agrupació (desactiva-la si té dades associades)');
    }
  }

  if (carregant) return <p className="page text-muted">Carregant agrupacions...</p>;

  return (
    <div className="page">
      <BotoTornar />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Agrupacions</h1>
        <button onClick={() => setMostrarFormulari(!mostrarFormulari)}>
          {mostrarFormulari ? 'Cancel·lar' : '+ Nova agrupació'}
        </button>
      </div>

      {error && <p className="text-error">{error}</p>}

      {mostrarFormulari && (
        <form onSubmit={handleCrear} className="card" style={{ marginBottom: 20, maxWidth: 460 }}>
          <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Nom de l'agrupació</label>
              <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Municipi</label>
              <input value={form.municipi} onChange={(e) => setForm({ ...form, municipi: e.target.value })} required style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
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
          <button type="submit">Crear agrupació</button>
        </form>
      )}

      {agrupacions.length === 0 ? (
        <p className="text-muted">Encara no hi ha cap agrupació registrada.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {agrupacions.map((a) => (
            <div key={a.id} className="card" style={{ maxWidth: 480 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong>{a.nom}</strong>
                {!a.actiu && <span className="badge" style={{ color: 'var(--c-error)', background: 'var(--c-error-bg)' }}>Inactiva</span>}
              </div>
              <p className="text-muted" style={{ fontSize: 13, margin: '4px 0' }}>
                {a.municipi}{a.comarca ? ` · ${a.comarca}` : ''}
              </p>
              {a.president && <p style={{ fontSize: 13, margin: '4px 0' }}>President/a: {a.president}</p>}
              {(a.telefon || a.email) && (
                <p className="text-muted" style={{ fontSize: 12, margin: '4px 0' }}>
                  {[a.telefon, a.email].filter(Boolean).join(' · ')}
                </p>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => obrirEdicio(a)} style={{ fontSize: 12 }}>
                  {editantId === a.id ? 'Cancel·lar' : 'Editar'}
                </button>
                <button onClick={() => handleEliminar(a.id)} style={{ fontSize: 12, color: 'var(--c-error)' }}>
                  Eliminar
                </button>
              </div>

              {editantId === a.id && (
                <form onSubmit={handleGuardarEdicio} style={{ borderTop: '1px solid var(--c-border)', marginTop: 10, paddingTop: 10 }}>
                  <div style={{ marginBottom: 8, display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label>Nom</label>
                      <input value={editForm.nom} onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })} required style={{ width: '100%' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label>Municipi</label>
                      <input value={editForm.municipi} onChange={(e) => setEditForm({ ...editForm, municipi: e.target.value })} required style={{ width: '100%' }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 8, display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label>Comarca</label>
                      <input value={editForm.comarca} onChange={(e) => setEditForm({ ...editForm, comarca: e.target.value })} style={{ width: '100%' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label>President/a</label>
                      <input value={editForm.president} onChange={(e) => setEditForm({ ...editForm, president: e.target.value })} style={{ width: '100%' }} />
                    </div>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
