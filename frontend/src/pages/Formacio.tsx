import { useEffect, useState } from 'react';
import {
  EstatFormacio,
  Formacio,
  crearFormacio,
  eliminarFormacio,
  eliminarInscripcio,
  inscriureMembre,
  llistarFormacions,
} from '../services/formacio';
import { Membre, llistarMembres } from '../services/membres';
import { Agrupacio, llistarAgrupacions } from '../services/agrupacions';
import { getUsuariActual } from '../services/api';
import BotoTornar from '../components/BotoTornar';

const buit = {
  nom: '',
  descripcio: '',
  dataProgramada: '',
  obligatoria: false,
  agrupacioId: '',
};

export default function FormacioPage() {
  const usuariActual = getUsuariActual();
  const esFederacio = usuariActual?.rol === 'FEDERACIO';
  const [formacions, setFormacions] = useState<Formacio[]>([]);
  const [membres, setMembres] = useState<Membre[]>([]);
  const [agrupacions, setAgrupacions] = useState<Agrupacio[]>([]);
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState('');
  const [mostrarFormulari, setMostrarFormulari] = useState(false);
  const [form, setForm] = useState(buit);
  const [obertId, setObertId] = useState<string | null>(null);
  const [nouMembreId, setNouMembreId] = useState('');

  async function carregar() {
    setCarregant(true);
    try {
      const [f, m, ags] = await Promise.all([
        llistarFormacions(),
        llistarMembres(),
        esFederacio ? llistarAgrupacions() : Promise.resolve([]),
      ]);
      setFormacions(f);
      setMembres(m);
      setAgrupacions(ags);
    } catch {
      setError('No s\'han pogut carregar les formacions');
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
      await crearFormacio({
        nom: form.nom,
        descripcio: form.descripcio || undefined,
        agrupacioId: esFederacio ? form.agrupacioId || null : undefined,
        dataProgramada: form.dataProgramada || undefined,
        obligatoria: form.obligatoria,
      });
      setForm(buit);
      setMostrarFormulari(false);
      carregar();
    } catch {
      setError('No s\'ha pogut crear la formació');
    }
  }

  async function handleEliminar(id: string) {
    try {
      await eliminarFormacio(id);
      carregar();
    } catch {
      setError('No s\'ha pogut eliminar la formació');
    }
  }

  async function handleInscriure(formacioId: string) {
    if (!nouMembreId) return;
    try {
      await inscriureMembre(formacioId, nouMembreId, 'PENDENT');
      setNouMembreId('');
      carregar();
    } catch {
      setError('No s\'ha pogut inscriure el membre');
    }
  }

  async function handleCanviarEstat(formacioId: string, membreId: string, estat: EstatFormacio) {
    try {
      await inscriureMembre(formacioId, membreId, estat);
      carregar();
    } catch {
      setError('No s\'ha pogut actualitzar la inscripció');
    }
  }

  async function handleTreureInscripcio(id: string) {
    try {
      await eliminarInscripcio(id);
      carregar();
    } catch {
      setError('No s\'ha pogut treure la inscripció');
    }
  }

  if (carregant) return <p className="page text-muted">Carregant formacions...</p>;

  return (
    <div className="page">
      <BotoTornar />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Formació</h1>
        <button onClick={() => setMostrarFormulari(!mostrarFormulari)}>
          {mostrarFormulari ? 'Cancel·lar' : '+ Nova formació'}
        </button>
      </div>

      {error && <p className="text-error">{error}</p>}

      {mostrarFormulari && (
        <form onSubmit={handleCrear} className="card" style={{ marginBottom: 20, maxWidth: 460 }}>
          <div style={{ marginBottom: 10 }}>
            <label>Nom de la formació</label>
            <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Descripció (opcional)</label>
            <textarea value={form.descripcio} onChange={(e) => setForm({ ...form, descripcio: e.target.value })} rows={2} style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Data programada (opcional)</label>
            <input type="date" value={form.dataProgramada} onChange={(e) => setForm({ ...form, dataProgramada: e.target.value })} style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>
              <input type="checkbox" checked={form.obligatoria} onChange={(e) => setForm({ ...form, obligatoria: e.target.checked })} style={{ width: 'auto', marginRight: 6 }} />
              Obligatòria
            </label>
          </div>
          {esFederacio && (
            <div style={{ marginBottom: 10 }}>
              <label>Agrupació</label>
              <select value={form.agrupacioId} onChange={(e) => setForm({ ...form, agrupacioId: e.target.value })} style={{ width: '100%' }}>
                <option value="">Comuna (tota la federació)</option>
                {agrupacions.map((a) => (
                  <option key={a.id} value={a.id}>{a.nom} ({a.municipi})</option>
                ))}
              </select>
            </div>
          )}
          <button type="submit">Crear formació</button>
        </form>
      )}

      {formacions.length === 0 ? (
        <p className="text-muted">Encara no hi ha cap formació registrada.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {formacions.map((f) => {
            const completades = f.inscripcions.filter((i) => i.estat === 'COMPLETADA').length;
            return (
              <div key={f.id} className="card" style={{ maxWidth: 560 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong>{f.nom}</strong>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {!f.agrupacioId && <span className="badge badge--role">Comuna</span>}
                    {f.obligatoria && <span className="badge" style={{ color: 'var(--c-warning)', background: 'var(--c-warning-bg)' }}>Obligatòria</span>}
                  </div>
                </div>
                {f.descripcio && <p className="text-muted" style={{ fontSize: 13, margin: '4px 0' }}>{f.descripcio}</p>}
                <p className="text-muted" style={{ fontSize: 12, margin: '4px 0' }}>
                  {f.dataProgramada ? new Date(f.dataProgramada).toLocaleDateString('ca-ES') + ' · ' : ''}
                  {completades}/{f.inscripcions.length} completats
                </p>

                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button onClick={() => setObertId(obertId === f.id ? null : f.id)} style={{ fontSize: 12 }}>
                    {obertId === f.id ? 'Amagar inscrits' : 'Veure inscrits'}
                  </button>
                  <button onClick={() => handleEliminar(f.id)} style={{ fontSize: 12, color: 'var(--c-error)' }}>
                    Eliminar
                  </button>
                </div>

                {obertId === f.id && (
                  <div style={{ borderTop: '1px solid var(--c-border)', marginTop: 10, paddingTop: 10 }}>
                    {f.inscripcions.length === 0 ? (
                      <p className="text-muted" style={{ fontSize: 13 }}>Encara no hi ha ningú inscrit.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                        {f.inscripcions.map((i) => (
                          <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                            <span>{i.membre.nom} {i.membre.cognoms}</span>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <select
                                value={i.estat}
                                onChange={(e) => handleCanviarEstat(f.id, i.membreId, e.target.value as EstatFormacio)}
                                style={{ fontSize: 12 }}
                              >
                                <option value="PENDENT">Pendent</option>
                                <option value="COMPLETADA">Completada</option>
                              </select>
                              <button onClick={() => handleTreureInscripcio(i.id)} style={{ fontSize: 11, color: 'var(--c-error)' }}>
                                Treure
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select value={nouMembreId} onChange={(e) => setNouMembreId(e.target.value)} style={{ flex: 1 }}>
                        <option value="">Selecciona un membre...</option>
                        {membres
                          .filter((m) => !f.inscripcions.some((i) => i.membreId === m.id))
                          .map((m) => (
                            <option key={m.id} value={m.id}>{m.nom} {m.cognoms}</option>
                          ))}
                      </select>
                      <button onClick={() => handleInscriure(f.id)}>Inscriure</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
