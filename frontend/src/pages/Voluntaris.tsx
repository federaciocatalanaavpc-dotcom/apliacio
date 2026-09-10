import Invitacio from '../components/Invitacio';
import { generarInvitacio } from '../services/api';
import { Fragment, useEffect, useState } from 'react';
import {
  Voluntari,
  Disponibilitat,
  crearVoluntari,
  editarVoluntari,
  eliminarVoluntari,
  llistarVoluntaris,
  exportarVoluntari,
} from '../services/voluntaris';
import { Agrupacio, llistarAgrupacions } from '../services/agrupacions';
import { Provincia, llistarProvincies } from '../services/provincies';
import { RegistreAuditoria, llistarAuditoria } from '../services/auditoria';
import { getUsuariActual } from '../services/api';

const DISPONIBILITAT_LABEL: Record<Disponibilitat, string> = {
  PRESENCIAL: 'Presencial',
  IMMEDIATA: 'Immediata',
  DIFERIDA: 'Diferida',
  NO_DISPONIBLE: 'No disponible',
};

const DISPONIBILITAT_COLOR: Record<Disponibilitat, string> = {
  PRESENCIAL: 'var(--c-success)',
  IMMEDIATA: 'var(--c-warning)',
  DIFERIDA: 'var(--c-warning)',
  NO_DISPONIBLE: 'var(--c-error)',
};

const buit = {
  nom: '',
  cognoms: '',
  telefon: '',
  dataIngres: '',
  numeroIdentificacio: '',
  indicatiu: '',
  carrec: '',
  disponibilitat: 'NO_DISPONIBLE' as Disponibilitat,
  consentimentDades: false,
  rolAcces: 'VOLUNTARI' as 'VOLUNTARI' | 'ADMIN_AVPC',
  emailAcces: '',
};

export default function VoluntarisPage({ embedded = false }: { embedded?: boolean } = {}) {
  const usuariActual = getUsuariActual();
  const esFederacio = usuariActual?.rol === 'FEDERACIO';
  const [voluntaris, setVoluntaris] = useState<Voluntari[]>([]);
  const [agrupacions, setAgrupacions] = useState<Agrupacio[]>([]);
  const [agrupacioSeleccionada, setAgrupacioSeleccionada] = useState('');
  const [invitacioUrl,setInvitacioUrl]=useState('');
  async function recuperar(id:string) {try {setInvitacioUrl(await generarInvitacio(id));}catch(e:any){setError(e.response?.data?.error || 'No s’ha pogut generar l’enllaç');}}
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState('');
  const [mostrarFormulari, setMostrarFormulari] = useState(false);
  const [form, setForm] = useState(buit);
  const [editantId, setEditantId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(buit);
  const [mostrarAuditoria, setMostrarAuditoria] = useState(false);
  const [auditoria, setAuditoria] = useState<RegistreAuditoria[]>([]);

  async function carregar() {
    setCarregant(true);
    try {
      const ags = esFederacio ? await llistarAgrupacions() : [];
      setAgrupacions(ags);
      const v = await llistarVoluntaris(esFederacio ? agrupacioSeleccionada || undefined : undefined);
      setVoluntaris(v);
    } catch {
      setError('No s\'han pogut carregar els voluntaris');
    } finally {
      setCarregant(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agrupacioSeleccionada]);

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (esFederacio && !agrupacioSeleccionada) {
      setError('Selecciona primer una associació');
      return;
    }
    try {
      const creat = await crearVoluntari({
        agrupacioId: esFederacio ? agrupacioSeleccionada : undefined,
        nom: form.nom,
        cognoms: form.cognoms,
        telefon: form.telefon || undefined,
        dataIngres: form.dataIngres || undefined,
        numeroIdentificacio: form.numeroIdentificacio || undefined,
        indicatiu: form.indicatiu || undefined,
        carrec: form.carrec || undefined,
        disponibilitat: form.disponibilitat,
        consentimentDades: form.consentimentDades,
        rolAcces: form.rolAcces,
        emailAcces: form.emailAcces || undefined,
      });
      setInvitacioUrl(creat.invitacioUrl || '');
      setForm(buit);
      setMostrarFormulari(false);
      carregar();
    } catch {
      setError('No s\'ha pogut crear el voluntari');
    }
  }

  function obrirEdicio(v: Voluntari) {
    setEditantId(editantId === v.id ? null : v.id);
    setEditForm({
      nom: v.nom,
      cognoms: v.cognoms,
      telefon: v.telefon || '',
      dataIngres: v.dataIngres ? v.dataIngres.slice(0, 10) : '',
      numeroIdentificacio: v.numeroIdentificacio || '',
      indicatiu: v.indicatiu || '',
      carrec: v.carrec || '',
      disponibilitat: v.disponibilitat,
      consentimentDades: v.consentimentDades,
      rolAcces: v.usuari?.rol === 'ADMIN_AVPC' ? 'ADMIN_AVPC' : 'VOLUNTARI',
      emailAcces: '',
    });
  }

  async function handleGuardarEdicio(e: React.FormEvent) {
    e.preventDefault();
    if (!editantId) return;
    setError('');
    try {
      await editarVoluntari(editantId, {
        nom: editForm.nom,
        cognoms: editForm.cognoms,
        telefon: editForm.telefon || undefined,
        dataIngres: editForm.dataIngres || undefined,
        numeroIdentificacio: editForm.numeroIdentificacio || undefined,
        indicatiu: editForm.indicatiu || undefined,
        carrec: editForm.carrec || undefined,
        disponibilitat: editForm.disponibilitat,
        rolAcces: voluntaris.find((v) => v.id === editantId)?.usuari ? editForm.rolAcces : undefined,
      });
      setEditantId(null);
      carregar();
    } catch {
      setError('No s\'han pogut desar els canvis');
    }
  }

  async function canviarEstat(v: Voluntari) {
    if (!window.confirm(v.actiu ? 'Donar de baixa i tancar l’accés d’aquest voluntari?' : 'Reactivar aquest voluntari i el seu accés?')) return;
    try { await editarVoluntari(v.id, { actiu: !v.actiu, dataBaixa: null }); await carregar(); }
    catch { setError('No s’ha pogut canviar l’estat'); }
  }

  async function handleEliminar(id: string) {
    if (!window.confirm('Eliminar definitivament aquesta fitxa? Si cal conservar-ne l’historial, dona-la de baixa.')) return;
    try {
      await eliminarVoluntari(id);
      carregar();
    } catch {
      setError('No s\'ha pogut eliminar el voluntari');
    }
  }

  async function handleExportar(v: Voluntari) {
    try {
      const dades = await exportarVoluntari(v.id);
      const blob = new Blob([JSON.stringify(dades, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const enllac = document.createElement('a');
      enllac.href = url;
      enllac.download = `dades-${v.nom}-${v.cognoms}.json`.toLowerCase().replace(/\s+/g, '-');
      enllac.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('No s\'han pogut exportar les dades');
    }
  }

  async function carregarAuditoria() {
    try {
      const registres = await llistarAuditoria({
        agrupacioId: esFederacio ? agrupacioSeleccionada || undefined : undefined,
        entitat: 'Voluntari',
      });
      setAuditoria(registres);
    } catch {
      setError('No s\'ha pogut carregar el registre d\'auditoria');
    }
  }

  function toggleAuditoria() {
    const mostrar = !mostrarAuditoria;
    setMostrarAuditoria(mostrar);
    if (mostrar) carregarAuditoria();
  }

  const actius = voluntaris.filter((v) => v.actiu);
  const baixes = voluntaris.filter((v) => !v.actiu);

  return (
    <div className={embedded ? undefined : 'page'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        {!embedded && <h1>Voluntaris</h1>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={toggleAuditoria} style={{ fontSize: 13 }}>
            {mostrarAuditoria ? 'Amagar auditoria' : '🛡️ Registre d\'auditoria'}
          </button>
          <button onClick={() => setMostrarFormulari(!mostrarFormulari)}>
            {mostrarFormulari ? 'Cancel·lar' : '+ Nou voluntari'}
          </button>
        </div>
      </div>

      {mostrarAuditoria && (
        <div className="card" style={{ marginTop: 10, marginBottom: 20, maxWidth: 640 }}>
          <p style={{ fontWeight: 600, margin: '0 0 8px' }}>Registre d'auditoria (voluntaris)</p>
          {auditoria.length === 0 ? (
            <p className="text-muted" style={{ fontSize: 13 }}>Encara no hi ha cap registre.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
              {auditoria.map((r) => (
                <div key={r.id} style={{ fontSize: 12, borderBottom: '1px solid var(--c-border)', paddingBottom: 6 }}>
                  <strong>{r.accio}</strong> · {r.detall || r.entitat} — <span className="text-muted">{r.usuari.nom}, {new Date(r.creatEl).toLocaleString('ca-ES')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {esFederacio && (
        <div style={{ marginBottom: 14, maxWidth: 320 }}>
          <label>Associació</label>
          <select value={agrupacioSeleccionada} onChange={(e) => setAgrupacioSeleccionada(e.target.value)} style={{ width: '100%' }}>
            <option value="">Selecciona una associació...</option>
            {agrupacions.map((a) => (
              <option key={a.id} value={a.id}>{a.nom}</option>
            ))}
          </select>
        </div>
      )}

      {invitacioUrl && <Invitacio url={invitacioUrl} onClose={()=>setInvitacioUrl('')}/>}
      {error && <p className="text-error">{error}</p>}

      {mostrarFormulari && (
        <form onSubmit={handleCrear} className="card" style={{ marginBottom: 20, maxWidth: 520 }}>
          <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Nom</label>
              <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Cognoms</label>
              <input value={form.cognoms} onChange={(e) => setForm({ ...form, cognoms: e.target.value })} required style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Telèfon</label>
              <input value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })} style={{ width: '100%' }} />
            </div>

          </div>



          <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Data d'ingrés</label>
              <input type="date" value={form.dataIngres} onChange={(e) => setForm({ ...form, dataIngres: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Nº identificació</label>
              <input value={form.numeroIdentificacio} onChange={(e) => setForm({ ...form, numeroIdentificacio: e.target.value })} style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Indicatiu</label>
              <input value={form.indicatiu} onChange={(e) => setForm({ ...form, indicatiu: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Càrrec/Rang</label>
              <input value={form.carrec} onChange={(e) => setForm({ ...form, carrec: e.target.value })} style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Disponibilitat</label>
            <select value={form.disponibilitat} onChange={(e) => setForm({ ...form, disponibilitat: e.target.value as Disponibilitat })} style={{ width: '100%' }}>
              {Object.entries(DISPONIBILITAT_LABEL).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>{etiqueta}</option>
              ))}
            </select>
          </div>



          <div style={{ borderTop: '1px solid var(--c-border)', marginTop: 6, paddingTop: 12 }}>
            <p style={{ fontWeight: 600, margin: '0 0 4px' }}>Accés a l'app (opcional)</p>
            <p className="text-muted" style={{ fontSize: 12, margin: '0 0 10px' }}>
              Si li dones un email, es generarà una invitació perquè creï la seva contrasenya i pugui confirmar
              assistència als serveis. Si ho deixes en blanc, l'associació gestionarà els seus serveis directament.
            </p>
<div style={{ marginBottom: 10 }}>
              <label>Tipus de compte</label>
              <select aria-label="Tipus de compte" value={form.rolAcces} onChange={(e) => setForm({ ...form, rolAcces: e.target.value as 'VOLUNTARI' | 'ADMIN_AVPC' })}>
                <option value="VOLUNTARI">Voluntari</option>
                <option value="ADMIN_AVPC">Administrador AVPC</option>
              </select>
              <p className="text-muted" style={{ fontSize: 12 }}>L'administrador gestiona només la seva AVPC: voluntaris, serveis, estadístiques, proveïdors, inventari i alertes.</p>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label>Email d'accés</label>
              <input type="email" value={form.emailAcces} onChange={(e) => setForm({ ...form, emailAcces: e.target.value })} style={{ width: '100%' }} />
            </div>

          </div>

          <div className="card" style={{ background: 'var(--c-surface-alt)', marginTop: 12, marginBottom: 12 }}>
            <p className="text-muted" style={{ fontSize: 12, margin: '0 0 8px' }}>
              Només es recullen les dades necessàries per gestionar l'activitat del voluntari. Facilita-li la informació de protecció de dades de la seva AVPC abans de crear la fitxa.
            </p>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <input
                type="checkbox"
                checked={form.consentimentDades}
                onChange={(e) => setForm({ ...form, consentimentDades: e.target.checked })}
                required
                style={{ width: 'auto', marginTop: 2 }}
              />
              He facilitat al voluntari la informació sobre el tractament de les seves dades
            </label>
          </div>

          <button type="submit">Crear voluntari</button>
        </form>
      )}

      {carregant ? (
        <p className="text-muted">Carregant voluntaris...</p>
      ) : voluntaris.length === 0 ? (
        <p className="text-muted">{esFederacio && !agrupacioSeleccionada ? 'Selecciona una associació per veure els seus voluntaris.' : 'Encara no hi ha cap voluntari registrat.'}</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Indicatiu</th>
                <th>Nom</th>

                <th>Telèfon</th>
                <th>Disponibilitat</th>
                <th>Accés app</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[...actius, ...baixes].map((v) => (
                <Fragment key={v.id}>
                  <tr>
                    <td>{v.indicatiu || '—'}</td>
                    <td>{v.nom} {v.cognoms}{!v.actiu && <span className="badge" style={{ marginLeft: 6, color: 'var(--c-error)', background: 'var(--c-error-bg)' }}>Baixa</span>}</td>

                    <td className="text-muted">{v.telefon || '—'}</td>
                    <td><span style={{ color: DISPONIBILITAT_COLOR[v.disponibilitat], fontWeight: 600 }}>{DISPONIBILITAT_LABEL[v.disponibilitat]}</span></td>
                    <td className="text-muted">{v.usuari ? (v.usuari.rol === 'ADMIN_AVPC' ? 'Administrador AVPC' : 'Voluntari') : 'No'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {v.usuari && <button onClick={()=>recuperar(v.usuari!.id)}>Generar enllaç d’accés</button>}
                        <button onClick={() => obrirEdicio(v)} style={{ fontSize: 12 }}>
                          {editantId === v.id ? 'Cancel·lar' : 'Editar'}
                        </button>
                        <button onClick={() => handleExportar(v)} style={{ fontSize: 12 }} title="Exportar les seves dades (dret d'accés)">
                          Exportar dades
                        </button>
                        <button onClick={() => canviarEstat(v)} style={{fontSize:12}}>{v.actiu ? 'Donar de baixa' : 'Reactivar'}</button>
                        <button onClick={() => handleEliminar(v.id)} className="btn-danger" style={{ fontSize: 12 }}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editantId === v.id && (
                    <tr>
                      <td colSpan={6}>
                        <form onSubmit={handleGuardarEdicio} style={{ padding: '10px 0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                          <div>
                            <label>Nom</label>
                            <input value={editForm.nom} onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })} required />
                          </div>
                          <div>
                            <label>Cognoms</label>
                            <input value={editForm.cognoms} onChange={(e) => setEditForm({ ...editForm, cognoms: e.target.value })} required />
                          </div>
                          <div>
                            <label>Telèfon</label>
                            <input value={editForm.telefon} onChange={(e) => setEditForm({ ...editForm, telefon: e.target.value })} />
                          </div>

                          <div>
                            <label>Indicatiu</label>
                            <input value={editForm.indicatiu} onChange={(e) => setEditForm({ ...editForm, indicatiu: e.target.value })} style={{ width: 90 }} />
                          </div>
                          <div>
                            <label>Càrrec</label>
                            <input value={editForm.carrec} onChange={(e) => setEditForm({ ...editForm, carrec: e.target.value })} />
                          </div>
                          <div>
                            <label>Disponibilitat</label>
                            <select value={editForm.disponibilitat} onChange={(e) => setEditForm({ ...editForm, disponibilitat: e.target.value as Disponibilitat })}>
                              {Object.entries(DISPONIBILITAT_LABEL).map(([valor, etiqueta]) => (
                                <option key={valor} value={valor}>{etiqueta}</option>
                              ))}
                            </select>
                          </div>
                          {v.usuari && (<div style={{ marginBottom: 10 }}>
              <label>Tipus de compte</label>
              <select aria-label="Tipus de compte" value={editForm.rolAcces} onChange={(e) => setEditForm({ ...editForm, rolAcces: e.target.value as 'VOLUNTARI' | 'ADMIN_AVPC' })}>
                <option value="VOLUNTARI">Voluntari</option>
                <option value="ADMIN_AVPC">Administrador AVPC</option>
              </select>
              <p className="text-muted" style={{ fontSize: 12 }}>L'administrador gestiona només la seva AVPC: voluntaris, serveis, estadístiques, proveïdors, inventari i alertes.</p>
            </div>)}
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
