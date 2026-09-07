import { Fragment, useEffect, useMemo, useState } from 'react';
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

type Vista = 'tots' | 'meus';

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
  const [vista, setVista] = useState<Vista>('tots');
  const [cerca, setCerca] = useState('');

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

  const proveidorsVisibles = useMemo(() => {
    const text = cerca.trim().toLowerCase();
    return proveidors.filter((p) => {
      const esMeu = esFederacio || p.agrupacioId === usuariActual?.agrupacioId;
      if (vista === 'meus' && !esMeu) return false;
      if (!text) return true;
      return [p.nom, p.categoria, p.contacte, p.telefon, p.email, p.adreca, p.agrupacio?.nom, p.agrupacio?.municipi]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase().includes(text));
    });
  }, [proveidors, cerca, vista, esFederacio, usuariActual?.agrupacioId]);

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
      setVista('tots');
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          {!embedded && <h1 style={{ marginBottom: 6 }}>Proveïdors compartits</h1>}
          <p className="text-muted" style={{ marginTop: 0, maxWidth: 720 }}>
            Directori compartit entre les AVPC. Cada associació pot afegir els seus proveïdors perquè la resta els pugui consultar i aprofitar contactes útils.
          </p>
        </div>
        <button onClick={() => setMostrarFormulari(!mostrarFormulari)}>
          {mostrarFormulari ? 'Cancel·lar' : '+ Nou proveïdor'}
        </button>
      </div>

      <div className="card" style={{ marginBottom: 18, padding: 14 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="tabs" style={{ marginBottom: 0 }}>
            <button className={`tab ${vista === 'tots' ? 'tab--active' : ''}`} onClick={() => setVista('tots')}>
              Tots els proveïdors
            </button>
            <button className={`tab ${vista === 'meus' ? 'tab--active' : ''}`} onClick={() => setVista('meus')}>
              {esFederacio ? 'Gestionables' : 'Els meus'}
            </button>
          </div>
          <input
            value={cerca}
            onChange={(e) => setCerca(e.target.value)}
            placeholder="Cerca per nom, categoria, municipi..."
            style={{ minWidth: 260, flex: 1 }}
          />
          <span className="badge badge--role">{proveidorsVisibles.length} resultats</span>
        </div>
      </div>

      {error && <p className="text-error">{error}</p>}

      {mostrarFormulari && (
        <form onSubmit={handleCrear} className="card" style={{ marginBottom: 20, maxWidth: 560 }}>
          <h3 style={{ marginTop: 0 }}>Afegir proveïdor al directori</h3>
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
          <div style={{ marginBottom: 6, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label>Persona de contacte</label>
              <input value={form.contacte} onChange={(e) => setForm({ ...form, contacte: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ flex: '1 1 160px' }}>
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
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} style={{ width: '100%' }} />
          </div>
          <button type="submit">Compartir proveïdor</button>
        </form>
      )}

      {proveidorsVisibles.length === 0 ? (
        <div className="card">
          <p className="text-muted" style={{ margin: 0 }}>No hi ha cap proveïdor que coincideixi amb els filtres.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Categoria</th>
                <th>Associació</th>
                <th>Contacte</th>
                <th>Telèfon</th>
                <th>Email</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {proveidorsVisibles.map((p) => {
                const potGestionar = esFederacio || p.agrupacioId === usuariActual?.agrupacioId;
                return (
                  <Fragment key={p.id}>
                    <tr>
                      <td><strong>{p.nom}</strong></td>
                      <td className="text-muted">{p.categoria || '—'}</td>
                      <td>
                        <span className="badge badge--role">
                          {p.agrupacio?.nom || 'Associació'}{p.agrupacio?.municipi ? ` · ${p.agrupacio.municipi}` : ''}
                        </span>
                      </td>
                      <td>{p.contacte || '—'}</td>
                      <td>{p.telefon || '—'}</td>
                      <td>{p.email ? <a href={`mailto:${p.email}`}>{p.email}</a> : '—'}</td>
                      <td>
                        {potGestionar ? (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => obrirEdicio(p)} style={{ fontSize: 12 }}>
                              {editantId === p.id ? 'Cancel·lar' : 'Editar'}
                            </button>
                            <button onClick={() => handleEliminar(p.id)} className="btn-danger" style={{ fontSize: 12 }}>
                              Eliminar
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted" style={{ fontSize: 12 }}>Compartit</span>
                        )}
                      </td>
                    </tr>
                    {editantId === p.id && potGestionar && (
                      <tr>
                        <td colSpan={7}>
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
