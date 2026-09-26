import { useEffect, useState } from 'react';
import { Caducitat, crearCaducitat, editarCaducitat, eliminarCaducitat, llistarCaducitats } from '../services/caducitats';
import { Vehicle, llistarVehicles } from '../services/vehicles';
import { Material, llistarMaterial } from '../services/material';
import { Agrupacio, llistarAgrupacions } from '../services/agrupacions';
import { getUsuariActual } from '../services/api';

const CONCEPTES = ['ITV', 'Assegurança', 'Revisió', 'Extintor', 'Farmaciola', 'Bateria', 'Homologació', 'Impost de circulació'];
const COLOR = { CADUCAT: 'var(--c-error)', PROPERA: 'var(--c-warning)', OK: 'var(--c-success)' } as const;
const FONS = { CADUCAT: 'var(--c-error-bg)', PROPERA: 'var(--c-warning-bg)', OK: 'var(--c-success-bg)' } as const;
const buit = { tipusElement: 'vehicle' as 'vehicle' | 'material', elementId: '', concepte: '', dataCaducitat: '', notes: '' };

function etiquetaDies(c: Caducitat) {
  if (c.estat === 'CADUCAT') return c.dies === 0 ? 'Caduca avui' : `Caducat fa ${-c.dies} dies`;
  return c.dies === 1 ? 'Caduca demà' : `Falten ${c.dies} dies`;
}

export default function Caducitats({ filtreAgrupacioId }: { filtreAgrupacioId?: string } = {}) {
  const usuari = getUsuariActual();
  const esFederacio = usuari?.rol === 'FEDERACIO';
  const [agrupacions, setAgrupacions] = useState<Agrupacio[]>([]);
  const [agrupacioSeleccionada, setAgrupacioSeleccionada] = useState(filtreAgrupacioId || '');
  const [caducitats, setCaducitats] = useState<Caducitat[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [material, setMaterial] = useState<Material[]>([]);
  const [error, setError] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(buit);
  const [renovantId, setRenovantId] = useState<string | null>(null);
  const [novaData, setNovaData] = useState('');

  const agrupacioActiva = esFederacio ? agrupacioSeleccionada : usuari?.agrupacioId || '';

  async function carregar() {
    try {
      const [cad, veh, mat, ags] = await Promise.all([
        llistarCaducitats(esFederacio ? agrupacioSeleccionada || undefined : undefined),
        llistarVehicles(),
        llistarMaterial(),
        esFederacio ? llistarAgrupacions() : Promise.resolve([]),
      ]);
      setCaducitats(cad);
      setVehicles(veh);
      setMaterial(mat);
      setAgrupacions(ags);
    } catch {
      setError("No s'han pogut carregar les caducitats");
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agrupacioSeleccionada]);

  const elements =
    form.tipusElement === 'vehicle'
      ? vehicles.filter((v) => v.agrupacioId === agrupacioActiva).map((v) => ({ id: v.id, nom: [v.matricula, v.marca, v.model].filter(Boolean).join(' ') || 'Vehicle sense matrícula' }))
      : material.filter((m) => m.agrupacioId === agrupacioActiva).map((m) => ({ id: m.id, nom: m.nom }));

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!agrupacioActiva) return setError('Selecciona primer una associació');
    try {
      await crearCaducitat({
        agrupacioId: esFederacio ? agrupacioActiva : undefined,
        vehicleId: form.tipusElement === 'vehicle' ? form.elementId : undefined,
        materialId: form.tipusElement === 'material' ? form.elementId : undefined,
        concepte: form.concepte,
        dataCaducitat: form.dataCaducitat,
        notes: form.notes || undefined,
      });
      setForm(buit);
      setMostrarForm(false);
      carregar();
    } catch {
      setError("No s'ha pogut afegir la caducitat");
    }
  }

  async function handleRenovar(id: string) {
    if (!novaData) return;
    try {
      await editarCaducitat(id, { dataCaducitat: novaData });
      setRenovantId(null);
      setNovaData('');
      carregar();
    } catch {
      setError("No s'ha pogut renovar");
    }
  }

  async function handleEliminar(id: string) {
    try {
      await eliminarCaducitat(id);
      carregar();
    } catch {
      setError("No s'ha pogut eliminar");
    }
  }

  const caducades = caducitats.filter((c) => c.estat === 'CADUCAT').length;
  const properes = caducitats.filter((c) => c.estat === 'PROPERA').length;

  return (
    <div>
      <p className="text-muted" style={{ fontSize: 13 }}>
        Controla ITV, assegurances, extintors, farmacioles... Rebràs una notificació 30, 15, 7 i 1 dia abans del venciment, i
        cada setmana mentre estigui caducat.
      </p>

      {esFederacio && (
        <div style={{ marginBottom: 12, maxWidth: 320 }}>
          <label>Associació</label>
          <select value={agrupacioSeleccionada} onChange={(e) => setAgrupacioSeleccionada(e.target.value)} style={{ width: '100%' }}>
            <option value="">Totes (només visualització)</option>
            {agrupacions.map((a) => (
              <option key={a.id} value={a.id}>{a.nom}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <span style={{ color: COLOR.CADUCAT, fontWeight: 700 }}>⛔ Caducades: {caducades}</span>
        <span style={{ color: COLOR.PROPERA, fontWeight: 700 }}>⚠️ Properes (30 dies): {properes}</span>
        <button onClick={() => setMostrarForm(!mostrarForm)} disabled={esFederacio && !agrupacioSeleccionada} style={{ marginLeft: 'auto' }}>
          {mostrarForm ? 'Cancel·lar' : '+ Nova caducitat'}
        </button>
      </div>

      {error && <p className="text-error">{error}</p>}

      {mostrarForm && (
        <form onSubmit={handleCrear} className="card" style={{ marginBottom: 16, maxWidth: 460 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Element</label>
              <select value={form.tipusElement} onChange={(e) => setForm({ ...form, tipusElement: e.target.value as 'vehicle' | 'material', elementId: '' })} style={{ width: '100%' }}>
                <option value="vehicle">Vehicle</option>
                <option value="material">Material</option>
              </select>
            </div>
            <div style={{ flex: 2 }}>
              <label>{form.tipusElement === 'vehicle' ? 'Vehicle' : 'Material'}</label>
              <select value={form.elementId} onChange={(e) => setForm({ ...form, elementId: e.target.value })} required style={{ width: '100%' }}>
                <option value="">Selecciona...</option>
                {elements.map((el) => (
                  <option key={el.id} value={el.id}>{el.nom}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Concepte</label>
              <input list="conceptes-caducitat" value={form.concepte} onChange={(e) => setForm({ ...form, concepte: e.target.value })} required style={{ width: '100%' }} />
              <datalist id="conceptes-caducitat">
                {CONCEPTES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div style={{ flex: 1 }}>
              <label>Data de caducitat</label>
              <input type="date" value={form.dataCaducitat} onChange={(e) => setForm({ ...form, dataCaducitat: e.target.value })} required style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Notes (opcional)</label>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ width: '100%' }} />
          </div>
          <button type="submit">Afegir caducitat</button>
        </form>
      )}

      {caducitats.length === 0 ? (
        <p className="text-muted">Encara no hi ha cap caducitat registrada.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {caducitats.map((c) => (
            <div key={c.id} className="card" style={{ maxWidth: 560, borderLeft: `5px solid ${COLOR[c.estat]}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <strong>{c.concepte}</strong>
                <span className="badge" style={{ color: COLOR[c.estat], background: FONS[c.estat] }}>{etiquetaDies(c)}</span>
              </div>
              <p className="text-muted" style={{ margin: '4px 0', fontSize: 13 }}>
                {c.vehicle ? `🚗 ${[c.vehicle.matricula, c.vehicle.marca, c.vehicle.model].filter(Boolean).join(' ')}` : `📦 ${c.material?.nom}`}
                {esFederacio && c.agrupacio ? ` · ${c.agrupacio.nom}` : ''} · {new Date(c.dataCaducitat).toLocaleDateString('ca-ES')}
              </p>
              {c.notes && <p className="text-muted" style={{ margin: '2px 0', fontSize: 12 }}>{c.notes}</p>}
              {renovantId === c.id ? (
                <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
                  <input type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} />
                  <button onClick={() => handleRenovar(c.id)} disabled={!novaData} style={{ fontSize: 12 }}>Desar</button>
                  <button onClick={() => setRenovantId(null)} style={{ fontSize: 12 }}>Cancel·lar</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <button onClick={() => { setRenovantId(c.id); setNovaData(''); }} style={{ fontSize: 12 }}>🔄 Renovar</button>
                  <button onClick={() => handleEliminar(c.id)} className="btn-danger" style={{ fontSize: 12 }}>Eliminar</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
