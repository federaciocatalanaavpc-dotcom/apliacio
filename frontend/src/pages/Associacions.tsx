import { useEffect, useState } from 'react';
import {
  Agrupacio,
  crearAgrupacio,
  editarAgrupacio,
  eliminarAgrupacio,
  llistarAgrupacions,
} from '../services/agrupacions';
import { Provincia, llistarProvincies } from '../services/provincies';
import { geocodificarAdreca } from '../services/geocodificacio';
import { getUsuariActual } from '../services/api';
import BotoTornar from '../components/BotoTornar';
import SelectorMapa from '../components/SelectorMapa';

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
  latitud: null as number | null,
  longitud: null as number | null,
};

export default function Associacions() {
  const usuariActual = getUsuariActual();
  const esFederacio = usuariActual?.rol === 'FEDERACIO';
  const potEditar = (a: Agrupacio) => esFederacio || a.id === usuariActual?.agrupacioId;
  const [agrupacions, setAgrupacions] = useState<Agrupacio[]>([]);
  const [provincies, setProvincies] = useState<Provincia[]>([]);
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState('');
  const [mostrarFormulari, setMostrarFormulari] = useState(false);
  const [form, setForm] = useState(buit);

  const [editantId, setEditantId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(buit);
  const [geocodificant, setGeocodificant] = useState(false);

  async function carregar() {
    setCarregant(true);
    try {
      const [ags, provs] = await Promise.all([llistarAgrupacions(), llistarProvincies()]);
      setAgrupacions(ags);
      setProvincies(provs);
    } catch {
      setError('No s\'han pogut carregar les associacions');
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
        provincia: form.provincia || undefined,
        municipi: form.municipi || undefined,
        comarca: form.comarca || undefined,
        adreca: form.adreca || undefined,
        telefon: form.telefon || undefined,
        email: form.email || undefined,
        president: form.president || undefined,
        dataFundacio: form.dataFundacio || undefined,
        latitud: form.latitud ?? undefined,
        longitud: form.longitud ?? undefined,
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
      latitud: a.latitud,
      longitud: a.longitud,
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
        latitud: editForm.latitud ?? undefined,
        longitud: editForm.longitud ?? undefined,
      } as any);
      setEditantId(null);
      carregar();
    } catch {
      setError('No s\'han pogut desar els canvis');
    }
  }

  async function handleGeocodificar(adreca: string, aplicar: (lat: number, lng: number) => void) {
    if (!adreca.trim()) {
      setError('Escriu primer una adreça per poder-la cercar al mapa');
      return;
    }
    setError('');
    setGeocodificant(true);
    try {
      const resultat = await geocodificarAdreca(adreca);
      if (!resultat) {
        setError('No s\'ha trobat cap ubicació per a aquesta adreça; marca-la manualment al mapa');
        return;
      }
      aplicar(resultat.lat, resultat.lng);
    } catch {
      setError('No s\'ha pogut cercar la ubicació de l\'adreça');
    } finally {
      setGeocodificant(false);
    }
  }

  async function handleEliminar(id: string) {
    try {
      await eliminarAgrupacio(id);
      carregar();
    } catch {
      setError('No s\'ha pogut eliminar l\'associació (desactiva-la si té dades associades)');
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

      {esFederacio && mostrarFormulari && (
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
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>President/a (opcional)</label>
            <input value={form.president} onChange={(e) => setForm({ ...form, president: e.target.value })} style={{ width: '100%' }} />
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
          <div style={{ marginBottom: 10 }}>
            <label>Ubicació de la seu (opcional)</label>
            <button
              type="button"
              onClick={() => handleGeocodificar(form.adreca, (lat, lng) => setForm({ ...form, latitud: lat, longitud: lng }))}
              disabled={geocodificant}
              style={{ fontSize: 12, marginBottom: 6 }}
            >
              {geocodificant ? 'Cercant...' : '📍 Situar al mapa a partir de l\'adreça'}
            </button>
            <SelectorMapa
              latitud={form.latitud}
              longitud={form.longitud}
              onCanviar={(lat, lng) => setForm({ ...form, latitud: lat, longitud: lng })}
            />
          </div>
          <button type="submit">Crear associació</button>
        </form>
      )}

      {agrupacions.length === 0 ? (
        <p className="text-muted">Encara no hi ha cap associació registrada.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {agrupacions.map((a) => (
            <div key={a.id} className="card" style={{ maxWidth: 480 }}>
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

              {potEditar(a) && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button onClick={() => obrirEdicio(a)} style={{ fontSize: 12 }}>
                    {editantId === a.id ? 'Cancel·lar' : 'Editar'}
                  </button>
                  {esFederacio && (
                    <button onClick={() => handleEliminar(a.id)} style={{ fontSize: 12, color: 'var(--c-error)' }}>
                      Eliminar
                    </button>
                  )}
                </div>
              )}

              {potEditar(a) && editantId === a.id && (
                <form onSubmit={handleGuardarEdicio} style={{ borderTop: '1px solid var(--c-border)', marginTop: 10, paddingTop: 10 }}>
                  {esFederacio && (
                    <>
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
                    </>
                  )}
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
                  <div style={{ marginBottom: 8 }}>
                    <label>Ubicació de la seu</label>
                    <button
                      type="button"
                      onClick={() => handleGeocodificar(editForm.adreca, (lat, lng) => setEditForm({ ...editForm, latitud: lat, longitud: lng }))}
                      disabled={geocodificant}
                      style={{ fontSize: 12, marginBottom: 6 }}
                    >
                      {geocodificant ? 'Cercant...' : '📍 Situar al mapa a partir de l\'adreça'}
                    </button>
                    <SelectorMapa
                      latitud={editForm.latitud}
                      longitud={editForm.longitud}
                      onCanviar={(lat, lng) => setEditForm({ ...editForm, latitud: lat, longitud: lng })}
                    />
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
