import { useEffect, useState } from 'react';
import {
  Vehicle,
  crearVehicle,
  editarVehicle,
  eliminarVehicle,
  llistarVehicles,
} from '../services/vehicles';
import { Agrupacio, llistarAgrupacions } from '../services/agrupacions';
import { TipusVehicle, crearTipusVehicle, editarTipusVehicle, eliminarTipusVehicle, llistarTipusVehicles } from '../services/tipusVehicles';
import { getUsuariActual } from '../services/api';
import BotoTornar from '../components/BotoTornar';
import GestorCataleg from '../components/GestorCataleg';

function aDataInput(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10);
}

const LED = {
  verd: '#2ecc71',
  taronja: '#f39c12',
  vermell: '#e74c3c',
  gris: '#b0b0b0',
};

function estatData(iso: string | null): { text: string; color: string; led: string } {
  if (!iso) return { text: 'Sense programar', color: 'var(--c-text-muted)', led: LED.gris };
  const data = new Date(iso);
  const avui = new Date();
  avui.setHours(0, 0, 0, 0);
  const dies = Math.floor((data.getTime() - avui.getTime()) / (1000 * 60 * 60 * 24));
  const dataText = data.toLocaleDateString('ca-ES');
  if (dies < 0) return { text: `${dataText} (vençuda)`, color: 'var(--c-error)', led: LED.vermell };
  if (dies <= 10) return { text: `${dataText} (caduca en ${dies} dies)`, color: '#b8860b', led: LED.taronja };
  return { text: dataText, color: 'inherit', led: LED.verd };
}

function Led({ color }: { color: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        backgroundColor: color,
        marginRight: 6,
        flexShrink: 0,
      }}
    />
  );
}

function propera(v: Vehicle): number {
  return v.proximaRevisio ? new Date(v.proximaRevisio).getTime() : Infinity;
}

const buit = {
  agrupacioId: '',
  matricula: '',
  tipus: '',
  marca: '',
  model: '',
  propietat: 'PROPI' as 'PROPI' | 'RENTING' | 'CEDIT',
  empresaRenting: '',
  proximaRevisio: '',
  notes: '',
};

export default function Vehicles({
  embedded = false,
  filtreAgrupacioId,
}: { embedded?: boolean; filtreAgrupacioId?: string } = {}) {
  const usuariActual = getUsuariActual();
  const esFederacio = usuariActual?.rol === 'FEDERACIO';
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [agrupacions, setAgrupacions] = useState<Agrupacio[]>([]);
  const [tipusVehicles, setTipusVehicles] = useState<TipusVehicle[]>([]);
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState('');
  const [mostrarFormulari, setMostrarFormulari] = useState(false);
  const [mostrarTipus, setMostrarTipus] = useState(false);
  const [form, setForm] = useState(buit);

  const [editantId, setEditantId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(buit);

  async function carregar() {
    setCarregant(true);
    try {
      const [dades, ags, tipus] = await Promise.all([
        llistarVehicles(),
        esFederacio ? llistarAgrupacions() : Promise.resolve([]),
        llistarTipusVehicles(),
      ]);
      setVehicles([...dades].sort((a, b) => propera(a) - propera(b)));
      setAgrupacions(ags);
      setTipusVehicles(tipus);
    } catch {
      setError('No s\'han pogut carregar els vehicles');
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
      await crearVehicle({
        agrupacioId: esFederacio ? form.agrupacioId : undefined,
        matricula: form.matricula,
        tipus: form.tipus || undefined,
        marca: form.marca || undefined,
        model: form.model || undefined,
        propietat: form.propietat,
        empresaRenting: form.propietat === 'RENTING' ? form.empresaRenting || undefined : undefined,
        proximaRevisio: form.proximaRevisio || undefined,
        notes: form.notes || undefined,
      });
      setForm(buit);
      setMostrarFormulari(false);
      carregar();
    } catch {
      setError('No s\'ha pogut crear el vehicle (revisa que la matrícula no estigui repetida)');
    }
  }

  function obrirEdicio(v: Vehicle) {
    setEditantId(editantId === v.id ? null : v.id);
    setEditForm({
      agrupacioId: v.agrupacioId,
      matricula: v.matricula,
      tipus: v.tipus || '',
      marca: v.marca || '',
      model: v.model || '',
      propietat: v.propietat,
      empresaRenting: v.empresaRenting || '',
      proximaRevisio: aDataInput(v.proximaRevisio),
      notes: v.notes || '',
    });
  }

  async function handleGuardarEdicio(e: React.FormEvent) {
    e.preventDefault();
    if (!editantId) return;
    setError('');
    try {
      await editarVehicle(editantId, {
        matricula: editForm.matricula,
        tipus: editForm.tipus || undefined,
        marca: editForm.marca || undefined,
        model: editForm.model || undefined,
        propietat: editForm.propietat,
        empresaRenting: editForm.propietat === 'RENTING' ? editForm.empresaRenting || undefined : undefined,
        proximaRevisio: editForm.proximaRevisio || undefined,
        notes: editForm.notes || undefined,
      } as any);
      setEditantId(null);
      carregar();
    } catch {
      setError('No s\'han pogut desar els canvis del vehicle');
    }
  }

  async function handleEliminar(id: string) {
    try {
      await eliminarVehicle(id);
      carregar();
    } catch {
      setError('No s\'ha pogut eliminar el vehicle');
    }
  }

  if (carregant) return <p className={embedded ? 'text-muted' : 'page text-muted'}>Carregant vehicles...</p>;

  const llistaFiltrada = filtreAgrupacioId ? vehicles.filter((v) => v.agrupacioId === filtreAgrupacioId) : vehicles;

  return (
    <div className={embedded ? undefined : 'page'}>
      {!embedded && <BotoTornar />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {!embedded && <h1>Vehicles</h1>}
        <button onClick={() => setMostrarFormulari(!mostrarFormulari)}>
          {mostrarFormulari ? 'Cancel·lar' : '+ Nou vehicle'}
        </button>
      </div>

      <p className="text-muted" style={{ fontSize: 13 }}>
        Control de la data de revisió dels vehicles de l'agrupació, propis, de renting o cedits.
      </p>

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
          <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Matrícula</label>
              <input value={form.matricula} onChange={(e) => setForm({ ...form, matricula: e.target.value })} required style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Propietat</label>
              <select value={form.propietat} onChange={(e) => setForm({ ...form, propietat: e.target.value as any })} style={{ width: '100%' }}>
                <option value="PROPI">Propi</option>
                <option value="RENTING">Renting</option>
                <option value="CEDIT">Cedit</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 6 }}>
            <label>Tipus (opcional)</label>
            <select value={form.tipus} onChange={(e) => setForm({ ...form, tipus: e.target.value })} style={{ width: '100%' }}>
              <option value="">Sense especificar</option>
              {tipusVehicles.map((t) => (
                <option key={t.id} value={t.nom}>{t.nom}</option>
              ))}
            </select>
          </div>
          <button type="button" onClick={() => setMostrarTipus(!mostrarTipus)} style={{ fontSize: 12, marginBottom: 10 }}>
            {mostrarTipus ? 'Amagar gestió de tipus' : 'Gestionar tipus de vehicle'}
          </button>
          {mostrarTipus && (
            <GestorCataleg
              items={tipusVehicles}
              placeholder="Nou tipus (p.ex. Pickup)"
              onAfegir={async (nom) => { await crearTipusVehicle(nom); carregar(); }}
              onEditar={async (id, nom) => { await editarTipusVehicle(id, nom); carregar(); }}
              onEliminar={async (id) => { await eliminarTipusVehicle(id); carregar(); }}
            />
          )}
          <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Marca (opcional)</label>
              <input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Model (opcional)</label>
              <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} style={{ width: '100%' }} />
            </div>
          </div>
          {form.propietat === 'RENTING' && (
            <div style={{ marginBottom: 10 }}>
              <label>Empresa de renting</label>
              <input value={form.empresaRenting} onChange={(e) => setForm({ ...form, empresaRenting: e.target.value })} style={{ width: '100%' }} />
            </div>
          )}
          <div style={{ marginBottom: 10 }}>
            <label>Propera revisió (opcional)</label>
            <input type="date" value={form.proximaRevisio} onChange={(e) => setForm({ ...form, proximaRevisio: e.target.value })} style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Notes (opcional)</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} style={{ width: '100%' }} />
          </div>
          <button type="submit">Crear vehicle</button>
        </form>
      )}

      {llistaFiltrada.length === 0 ? (
        <p className="text-muted">Encara no hi ha cap vehicle registrat.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {llistaFiltrada.map((v) => {
            const revisio = estatData(v.proximaRevisio);
            return (
              <div key={v.id} className="card" style={{ maxWidth: 480 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <Led color={revisio.led} />
                    <strong>{v.matricula}</strong>
                  </span>
                  <span className="badge badge--role">
                    {v.propietat === 'PROPI' ? 'Propi' : v.propietat === 'RENTING' ? 'Renting' : 'Cedit'}
                  </span>
                </div>
                {esFederacio && v.agrupacio && (
                  <p className="text-muted" style={{ fontSize: 12, margin: '2px 0' }}>{v.agrupacio.nom}</p>
                )}
                {v.tipus && <p className="text-muted" style={{ fontSize: 12, margin: '2px 0' }}>{v.tipus}</p>}
                {(v.marca || v.model) && (
                  <p className="text-muted" style={{ fontSize: 13, margin: '4px 0' }}>
                    {[v.marca, v.model].filter(Boolean).join(' ')}
                    {v.propietat === 'RENTING' && v.empresaRenting ? ` · ${v.empresaRenting}` : ''}
                  </p>
                )}
                <p style={{ fontSize: 13, margin: '6px 0 8px', display: 'flex', alignItems: 'center' }}>
                  <Led color={revisio.led} />
                  Revisió: <span style={{ color: revisio.color, fontWeight: 600, marginLeft: 4 }}>{revisio.text}</span>
                </p>
                {v.notes && <p className="text-muted" style={{ fontSize: 12, margin: '0 0 8px' }}>{v.notes}</p>}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => obrirEdicio(v)} style={{ fontSize: 12 }}>
                    {editantId === v.id ? 'Cancel·lar' : 'Editar'}
                  </button>
                  <button onClick={() => handleEliminar(v.id)} style={{ fontSize: 12, color: 'var(--c-error)' }}>
                    Eliminar
                  </button>
                </div>

                {editantId === v.id && (
                  <form onSubmit={handleGuardarEdicio} style={{ borderTop: '1px solid var(--c-border)', marginTop: 10, paddingTop: 10 }}>
                    <div style={{ marginBottom: 8, display: 'flex', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <label>Matrícula</label>
                        <input value={editForm.matricula} onChange={(e) => setEditForm({ ...editForm, matricula: e.target.value })} required style={{ width: '100%' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label>Propietat</label>
                        <select value={editForm.propietat} onChange={(e) => setEditForm({ ...editForm, propietat: e.target.value as any })} style={{ width: '100%' }}>
                          <option value="PROPI">Propi</option>
                          <option value="RENTING">Renting</option>
                          <option value="CEDIT">Cedit</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label>Tipus</label>
                      <select value={editForm.tipus} onChange={(e) => setEditForm({ ...editForm, tipus: e.target.value })} style={{ width: '100%' }}>
                        <option value="">Sense especificar</option>
                        {tipusVehicles.map((t) => (
                          <option key={t.id} value={t.nom}>{t.nom}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ marginBottom: 8, display: 'flex', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <label>Marca</label>
                        <input value={editForm.marca} onChange={(e) => setEditForm({ ...editForm, marca: e.target.value })} style={{ width: '100%' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label>Model</label>
                        <input value={editForm.model} onChange={(e) => setEditForm({ ...editForm, model: e.target.value })} style={{ width: '100%' }} />
                      </div>
                    </div>
                    {editForm.propietat === 'RENTING' && (
                      <div style={{ marginBottom: 8 }}>
                        <label>Empresa de renting</label>
                        <input value={editForm.empresaRenting} onChange={(e) => setEditForm({ ...editForm, empresaRenting: e.target.value })} style={{ width: '100%' }} />
                      </div>
                    )}
                    <div style={{ marginBottom: 8 }}>
                      <label>Propera revisió</label>
                      <input type="date" value={editForm.proximaRevisio} onChange={(e) => setEditForm({ ...editForm, proximaRevisio: e.target.value })} style={{ width: '100%' }} />
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label>Notes</label>
                      <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={2} style={{ width: '100%' }} />
                    </div>
                    <button type="submit">Desar canvis</button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
