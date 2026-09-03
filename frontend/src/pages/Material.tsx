import { Fragment, useEffect, useState } from 'react';
import { Material, crearMaterial, editarMaterial, eliminarMaterial, llistarMaterial } from '../services/material';
import { Agrupacio, llistarAgrupacions } from '../services/agrupacions';
import { getUsuariActual } from '../services/api';
import BotoTornar from '../components/BotoTornar';

const ESTAT_LABEL: Record<string, string> = {
  OPERATIU: 'Operatiu',
  MANTENIMENT: 'En manteniment',
  BAIXA: 'De baixa',
};

const ESTAT_COLOR: Record<string, string> = {
  OPERATIU: 'var(--c-success)',
  MANTENIMENT: 'var(--c-warning)',
  BAIXA: 'var(--c-error)',
};

const buit = {
  agrupacioId: '',
  nom: '',
  categoria: '',
  quantitat: 1,
  estat: 'OPERATIU' as 'OPERATIU' | 'MANTENIMENT' | 'BAIXA',
  notes: '',
};

export default function MaterialPage() {
  const usuariActual = getUsuariActual();
  const esFederacio = usuariActual?.rol === 'FEDERACIO';
  const [material, setMaterial] = useState<Material[]>([]);
  const [agrupacions, setAgrupacions] = useState<Agrupacio[]>([]);
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState('');
  const [mostrarFormulari, setMostrarFormulari] = useState(false);
  const [form, setForm] = useState(buit);
  const [editantId, setEditantId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(buit);
  const [nomesMeu, setNomesMeu] = useState(false);

  async function carregar() {
    setCarregant(true);
    try {
      const [dades, ags] = await Promise.all([llistarMaterial(), esFederacio ? llistarAgrupacions() : Promise.resolve([])]);
      setMaterial(dades);
      setAgrupacions(ags);
    } catch {
      setError('No s\'ha pogut carregar el material');
    } finally {
      setCarregant(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function potEditar(m: Material): boolean {
    return esFederacio || m.agrupacioId === usuariActual?.agrupacioId;
  }

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await crearMaterial({
        agrupacioId: esFederacio ? form.agrupacioId : undefined,
        nom: form.nom,
        categoria: form.categoria || undefined,
        quantitat: form.quantitat,
        estat: form.estat,
        notes: form.notes || undefined,
      });
      setForm(buit);
      setMostrarFormulari(false);
      carregar();
    } catch {
      setError('No s\'ha pogut crear el material');
    }
  }

  function obrirEdicio(m: Material) {
    setEditantId(editantId === m.id ? null : m.id);
    setEditForm({
      agrupacioId: m.agrupacioId,
      nom: m.nom,
      categoria: m.categoria || '',
      quantitat: m.quantitat,
      estat: m.estat,
      notes: m.notes || '',
    });
  }

  async function handleGuardarEdicio(e: React.FormEvent) {
    e.preventDefault();
    if (!editantId) return;
    setError('');
    try {
      await editarMaterial(editantId, {
        nom: editForm.nom,
        categoria: editForm.categoria || undefined,
        quantitat: editForm.quantitat,
        estat: editForm.estat,
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
      await eliminarMaterial(id);
      carregar();
    } catch {
      setError('No s\'ha pogut eliminar el material');
    }
  }

  if (carregant) return <p className="page text-muted">Carregant material...</p>;

  const llistaFiltrada = nomesMeu ? material.filter((m) => m.agrupacioId === usuariActual?.agrupacioId) : material;

  return (
    <div className="page">
      <BotoTornar />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Material</h1>
        <button onClick={() => setMostrarFormulari(!mostrarFormulari)}>
          {mostrarFormulari ? 'Cancel·lar' : '+ Nou material'}
        </button>
      </div>

      <p className="text-muted" style={{ fontSize: 13 }}>
        Es veu el material de totes les agrupacions (només lectura fora de la teva), perquè en cas
        d'emergència es pugui saber ràpidament què hi ha disponible a prop.
      </p>

      {!esFederacio && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <input type="checkbox" checked={nomesMeu} onChange={(e) => setNomesMeu(e.target.checked)} style={{ width: 'auto' }} />
          Mostra només el material de la meva agrupació
        </label>
      )}

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
            <div style={{ flex: 2 }}>
              <label>Nom del material</label>
              <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Quantitat</label>
              <input type="number" min={0} value={form.quantitat} onChange={(e) => setForm({ ...form, quantitat: Number(e.target.value) })} style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Categoria (opcional)</label>
              <input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="p.ex. comunicacions, EPI..." style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Estat</label>
              <select value={form.estat} onChange={(e) => setForm({ ...form, estat: e.target.value as any })} style={{ width: '100%' }}>
                <option value="OPERATIU">Operatiu</option>
                <option value="MANTENIMENT">En manteniment</option>
                <option value="BAIXA">De baixa</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Notes (opcional)</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} style={{ width: '100%' }} />
          </div>
          <button type="submit">Crear material</button>
        </form>
      )}

      {llistaFiltrada.length === 0 ? (
        <p className="text-muted">No hi ha cap material registrat.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th>Agrupació</th>
                <th>Categoria</th>
                <th>Quantitat</th>
                <th>Estat</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {llistaFiltrada.map((m) => (
                <Fragment key={m.id}>
                  <tr>
                    <td>{m.nom}</td>
                    <td className="text-muted">{m.agrupacio?.nom}{m.agrupacio?.municipi ? ` (${m.agrupacio.municipi})` : ''}</td>
                    <td className="text-muted">{m.categoria || '—'}</td>
                    <td>{m.quantitat}</td>
                    <td><span style={{ color: ESTAT_COLOR[m.estat], fontWeight: 600 }}>{ESTAT_LABEL[m.estat]}</span></td>
                    <td>
                      {potEditar(m) ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => obrirEdicio(m)} style={{ fontSize: 12 }}>
                            {editantId === m.id ? 'Cancel·lar' : 'Editar'}
                          </button>
                          <button onClick={() => handleEliminar(m.id)} style={{ fontSize: 12, color: 'var(--c-error)' }}>
                            Eliminar
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted" style={{ fontSize: 12 }}>Només lectura</span>
                      )}
                    </td>
                  </tr>
                  {editantId === m.id && (
                    <tr>
                      <td colSpan={6}>
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
                            <label>Quantitat</label>
                            <input type="number" min={0} value={editForm.quantitat} onChange={(e) => setEditForm({ ...editForm, quantitat: Number(e.target.value) })} style={{ width: 90 }} />
                          </div>
                          <div>
                            <label>Estat</label>
                            <select value={editForm.estat} onChange={(e) => setEditForm({ ...editForm, estat: e.target.value as any })}>
                              <option value="OPERATIU">Operatiu</option>
                              <option value="MANTENIMENT">En manteniment</option>
                              <option value="BAIXA">De baixa</option>
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
