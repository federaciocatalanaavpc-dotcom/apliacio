import { Fragment, useEffect, useState } from 'react';
import { Proveidor, crearProveidor, editarProveidor, eliminarProveidor, llistarProveidors } from '../services/proveidors';
import { Agrupacio, llistarAgrupacions } from '../services/agrupacions';
import { getUsuariActual } from '../services/api';
import BotoTornar from '../components/BotoTornar';

const buit = {
  agrupacioId: '',
  nom: '',
  categoria: '',
  contacte: '',
  telefon: '',
  email: '',
  adreca: '',
  notes: '',
};

export default function Proveidors({ embedded = false }: { embedded?: boolean } = {}) {
  const usuariActual = getUsuariActual();
  const esFederacio = usuariActual?.rol === 'FEDERACIO';
  const [proveidors, setProveidors] = useState<Proveidor[]>([]);
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
      const [dades, ags] = await Promise.all([
        llistarProveidors(),
        esFederacio ? llistarAgrupacions() : Promise.resolve([]),
      ]);
      setProveidors(dades);
      setAgrupacions(ags);
    } catch {
      setError('No s\'han pogut carregar els proveïdors');
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
      await crearProveidor({
        agrupacioId: esFederacio ? form.agrupacioId : undefined,
        nom: form.nom,
        categoria: form.categoria || undefined,
        contacte: form.contacte || undefined,
        telefon: form.telefon || undefined,
        email: form.email || undefined,
        adreca: form.adreca || undefined,
        notes: form.notes || undefined,
      });
      setForm(buit);
      setMostrarFormulari(false);
      carregar();
    } catch {
      setError('No s\'ha pogut crear el proveïdor');
    }
  }

  function obrirEdicio(p: Proveidor) {
    setEditantId(editantId === p.id ? null : p.id);
    setEditForm({
      agrupacioId: p.agrupacioId,
      nom: p.nom,
      categoria: p.categoria || '',
      contacte: p.contacte || '',
      telefon: p.telefon || '',
      email: p.email || '',
      adreca: p.adreca || '',
      notes: p.notes || '',
    });
  }

  async function handleGuardarEdicio(e: React.FormEvent) {
    e.preventDefault();
    if (!editantId) return;
    setError('');
    try {
      await editarProveidor(editantId, {
        nom: editForm.nom,
        categoria: editForm.categoria || undefined,
        contacte: editForm.contacte || undefined,
        telefon: editForm.telefon || undefined,
        email: editForm.email || undefined,
        adreca: editForm.adreca || undefined,
        notes: editForm.notes || undefined,
      } as any);
      setEditantId(null);
      carregar();
    } catch {
      setError('No s\'han pogut desar els canvis');
    }
  }

  async function handleEliminar(id: string) {
    try {
      await eliminarProveidor(id);
      carregar();
    } catch {
      setError('No s\'ha pogut eliminar el proveïdor');
    }
  }

  if (carregant) return <p className={embedded ? 'text-muted' : 'page text-muted'}>Carregant proveïdors...</p>;

  return (
    <div className={embedded ? undefined : 'page'}>
      {!embedded && <BotoTornar />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {!embedded && <h1>Proveïdors</h1>}
        <button onClick={() => setMostrarFormulari(!mostrarFormulari)}>
          {mostrarFormulari ? 'Cancel·lar' : '+ Nou proveïdor'}
        </button>
      </div>

      {error && <p className="text-error">{error}</p>}

      {mostrarFormulari && (
        <form onSubmit={handleCrear} className="card" style={{ marginBottom: 20, maxWidth: 460 }}>
          {esFederacio && (
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
          <div style={{ marginBottom: 10 }}>
            <label>Nom</label>
            <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Categoria (opcional)</label>
            <input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="p.ex. Taller, Combustible, Assegurança..." style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 6, display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Persona de contacte</label>
              <input value={form.contacte} onChange={(e) => setForm({ ...form, contacte: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Telèfon</label>
              <input value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })} style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Adreça</label>
            <input value={form.adreca} onChange={(e) => setForm({ ...form, adreca: e.target.value })} style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Notes (opcional)</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} style={{ width: '100%' }} />
          </div>
          <button type="submit">Crear proveïdor</button>
        </form>
      )}

      {proveidors.length === 0 ? (
        <p className="text-muted">No hi ha cap proveïdor registrat.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Categoria</th>
                {esFederacio && <th>Associació</th>}
                <th>Contacte</th>
                <th>Telèfon</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {proveidors.map((p) => (
                <Fragment key={p.id}>
                  <tr>
                    <td>{p.nom}</td>
                    <td className="text-muted">{p.categoria || '—'}</td>
                    {esFederacio && <td className="text-muted">{p.agrupacio?.nom}{p.agrupacio?.municipi ? ` (${p.agrupacio.municipi})` : ''}</td>}
                    <td>{p.contacte || '—'}</td>
                    <td>{p.telefon || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => obrirEdicio(p)} style={{ fontSize: 12 }}>
                          {editantId === p.id ? 'Cancel·lar' : 'Editar'}
                        </button>
                        <button onClick={() => handleEliminar(p.id)} className="btn-danger" style={{ fontSize: 12 }}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editantId === p.id && (
                    <tr>
                      <td colSpan={esFederacio ? 6 : 5}>
                        <form onSubmit={handleGuardarEdicio} style={{ padding: '8px 0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                          <div>
                            <label>Nom</label>
                            <input value={editForm.nom} onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })} required />
                          </div>
                          <div>
                            <label>Categoria</label>
                            <input value={editForm.categoria} onChange={(e) => setEditForm({ ...editForm, categoria: e.target.value })} />
                          </div>
                          <div>
                            <label>Contacte</label>
                            <input value={editForm.contacte} onChange={(e) => setEditForm({ ...editForm, contacte: e.target.value })} />
                          </div>
                          <div>
                            <label>Telèfon</label>
                            <input value={editForm.telefon} onChange={(e) => setEditForm({ ...editForm, telefon: e.target.value })} />
                          </div>
                          <div>
                            <label>Email</label>
                            <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                          </div>
                          <div>
                            <label>Adreça</label>
                            <input value={editForm.adreca} onChange={(e) => setEditForm({ ...editForm, adreca: e.target.value })} />
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
