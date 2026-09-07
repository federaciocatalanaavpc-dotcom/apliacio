import { Fragment, useEffect, useState } from 'react';
import {
  ArticleEquipament,
  AssignacioEquipament,
  TipusEquipament,
  crearArticleEquipament,
  crearAssignacioEquipament,
  editarArticleEquipament,
  eliminarArticleEquipament,
  eliminarAssignacioEquipament,
  llistarArticlesEquipament,
  llistarAssignacionsEquipament,
  retornarAssignacioEquipament,
} from '../services/equipament';
import { Voluntari, llistarVoluntaris } from '../services/voluntaris';
import { Agrupacio, llistarAgrupacions } from '../services/agrupacions';
import { getUsuariActual } from '../services/api';

const articleBuit = { nom: '', talla: '', estocTotal: '0', notes: '' };
const assignacioBuida = { voluntariId: '', articleId: '', quantitat: '1', notes: '' };

export default function Equipament({
  tipus,
  titol,
  embedded = false,
  filtreAgrupacioId,
}: {
  tipus: TipusEquipament;
  titol: string;
  embedded?: boolean;
  filtreAgrupacioId?: string;
}) {
  const usuariActual = getUsuariActual();
  const esFederacio = usuariActual?.rol === 'FEDERACIO';
  const [agrupacions, setAgrupacions] = useState<Agrupacio[]>([]);
  const [agrupacioSeleccionada, setAgrupacioSeleccionada] = useState(filtreAgrupacioId || '');
  const [pestanya, setPestanya] = useState<'estoc' | 'assignacions'>('estoc');
  const [articles, setArticles] = useState<ArticleEquipament[]>([]);
  const [voluntaris, setVoluntaris] = useState<Voluntari[]>([]);
  const [assignacions, setAssignacions] = useState<AssignacioEquipament[]>([]);
  const [mostrarRetornades, setMostrarRetornades] = useState(false);
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState('');

  const [mostrarFormArticle, setMostrarFormArticle] = useState(false);
  const [formArticle, setFormArticle] = useState(articleBuit);
  const [editantArticleId, setEditantArticleId] = useState<string | null>(null);
  const [editArticle, setEditArticle] = useState(articleBuit);

  const [mostrarFormAssignacio, setMostrarFormAssignacio] = useState(false);
  const [formAssignacio, setFormAssignacio] = useState(assignacioBuida);

  const agrupacioActiva = esFederacio ? agrupacioSeleccionada || undefined : usuariActual?.agrupacioId || undefined;

  async function carregar() {
    setCarregant(true);
    try {
      const [ags, arts, vols, assigs] = await Promise.all([
        esFederacio ? llistarAgrupacions() : Promise.resolve([]),
        llistarArticlesEquipament({ tipus, agrupacioId: agrupacioActiva }),
        agrupacioActiva || !esFederacio ? llistarVoluntaris(agrupacioActiva) : Promise.resolve([]),
        llistarAssignacionsEquipament({ tipus, agrupacioId: agrupacioActiva, actives: mostrarRetornades ? undefined : true }),
      ]);
      setAgrupacions(ags);
      setArticles(arts);
      setVoluntaris(vols);
      setAssignacions(assigs);
    } catch {
      setError("No s'han pogut carregar les dades");
    } finally {
      setCarregant(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agrupacioSeleccionada, mostrarRetornades]);

  async function handleCrearArticle(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (esFederacio && !agrupacioSeleccionada) {
      setError('Selecciona primer una associació');
      return;
    }
    try {
      await crearArticleEquipament({
        agrupacioId: esFederacio ? agrupacioSeleccionada : undefined,
        tipus,
        nom: formArticle.nom,
        talla: formArticle.talla || undefined,
        estocTotal: Number(formArticle.estocTotal) || 0,
        notes: formArticle.notes || undefined,
      });
      setFormArticle(articleBuit);
      setMostrarFormArticle(false);
      carregar();
    } catch {
      setError("No s'ha pogut crear l'article");
    }
  }

  function obrirEdicioArticle(a: ArticleEquipament) {
    setEditantArticleId(editantArticleId === a.id ? null : a.id);
    setEditArticle({ nom: a.nom, talla: a.talla || '', estocTotal: String(a.estocTotal), notes: a.notes || '' });
  }

  async function handleGuardarArticle(e: React.FormEvent) {
    e.preventDefault();
    if (!editantArticleId) return;
    setError('');
    try {
      await editarArticleEquipament(editantArticleId, {
        nom: editArticle.nom,
        talla: editArticle.talla || undefined,
        estocTotal: Number(editArticle.estocTotal) || 0,
        notes: editArticle.notes || undefined,
      } as any);
      setEditantArticleId(null);
      carregar();
    } catch {
      setError("No s'han pogut desar els canvis");
    }
  }

  async function handleEliminarArticle(id: string) {
    try {
      await eliminarArticleEquipament(id);
      carregar();
    } catch {
      setError("No s'ha pogut eliminar l'article (potser té assignacions registrades)");
    }
  }

  async function handleCrearAssignacio(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await crearAssignacioEquipament({
        articleId: formAssignacio.articleId,
        voluntariId: formAssignacio.voluntariId,
        quantitat: Number(formAssignacio.quantitat) || 1,
        notes: formAssignacio.notes || undefined,
      });
      setFormAssignacio(assignacioBuida);
      setMostrarFormAssignacio(false);
      carregar();
    } catch (err: any) {
      setError(err?.response?.data?.error || "No s'ha pogut crear l'assignació");
    }
  }

  async function handleRetornar(id: string) {
    try {
      await retornarAssignacioEquipament(id);
      carregar();
    } catch {
      setError("No s'ha pogut marcar com a retornat");
    }
  }

  async function handleEliminarAssignacio(id: string) {
    try {
      await eliminarAssignacioEquipament(id);
      carregar();
    } catch {
      setError("No s'ha pogut eliminar l'assignació");
    }
  }

  if (carregant) return <p className={embedded ? 'text-muted' : 'page text-muted'}>Carregant {titol.toLowerCase()}...</p>;

  return (
    <div className={embedded ? undefined : 'page'}>
      {!embedded && <h1>{titol}</h1>}

      {esFederacio && (
        <div style={{ marginBottom: 14, maxWidth: 320 }}>
          <label>Associació</label>
          <select value={agrupacioSeleccionada} onChange={(e) => setAgrupacioSeleccionada(e.target.value)} style={{ width: '100%' }}>
            <option value="">Totes (només visualització)</option>
            {agrupacions.map((a) => (
              <option key={a.id} value={a.id}>{a.nom}</option>
            ))}
          </select>
        </div>
      )}

      <div className="tabs">
        <button onClick={() => setPestanya('estoc')} className={`tab ${pestanya === 'estoc' ? 'tab--active' : ''}`}>
          Estoc
        </button>
        <button onClick={() => setPestanya('assignacions')} className={`tab ${pestanya === 'assignacions' ? 'tab--active' : ''}`}>
          Assignat a voluntaris
        </button>
      </div>

      {error && <p className="text-error">{error}</p>}

      {pestanya === 'estoc' && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <button onClick={() => setMostrarFormArticle(!mostrarFormArticle)} disabled={esFederacio && !agrupacioSeleccionada}>
              {mostrarFormArticle ? 'Cancel·lar' : `+ Nou article de ${titol.toLowerCase()}`}
            </button>
          </div>

          {mostrarFormArticle && (
            <form onSubmit={handleCrearArticle} className="card" style={{ marginBottom: 20, maxWidth: 460 }}>
              <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
                <div style={{ flex: 2 }}>
                  <label>Nom</label>
                  <input value={formArticle.nom} onChange={(e) => setFormArticle({ ...formArticle, nom: e.target.value })} required style={{ width: '100%' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Talla (opcional)</label>
                  <input value={formArticle.talla} onChange={(e) => setFormArticle({ ...formArticle, talla: e.target.value })} style={{ width: '100%' }} />
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label>Estoc total (unitats)</label>
                <input type="number" min={0} value={formArticle.estocTotal} onChange={(e) => setFormArticle({ ...formArticle, estocTotal: e.target.value })} style={{ width: '100%' }} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label>Notes (opcional)</label>
                <textarea value={formArticle.notes} onChange={(e) => setFormArticle({ ...formArticle, notes: e.target.value })} rows={2} style={{ width: '100%' }} />
              </div>
              <button type="submit">Crear article</button>
            </form>
          )}

          {articles.length === 0 ? (
            <p className="text-muted">Encara no hi ha cap article de {titol.toLowerCase()} registrat.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Talla</th>
                    {esFederacio && !agrupacioSeleccionada && <th>Associació</th>}
                    <th>Estoc total</th>
                    <th>Assignat</th>
                    <th>Lliure</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((a) => (
                    <Fragment key={a.id}>
                      <tr>
                        <td>{a.nom}</td>
                        <td className="text-muted">{a.talla || '—'}</td>
                        {esFederacio && !agrupacioSeleccionada && <td className="text-muted">{a.agrupacio?.nom}</td>}
                        <td>{a.estocTotal}</td>
                        <td>{a.estocAssignat}</td>
                        <td style={{ fontWeight: 700, color: a.estocLliure > 0 ? 'var(--c-success)' : 'var(--c-error)' }}>{a.estocLliure}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => obrirEdicioArticle(a)} style={{ fontSize: 12 }}>
                              {editantArticleId === a.id ? 'Cancel·lar' : 'Editar'}
                            </button>
                            <button onClick={() => handleEliminarArticle(a.id)} className="btn-danger" style={{ fontSize: 12 }}>
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                      {editantArticleId === a.id && (
                        <tr>
                          <td colSpan={7}>
                            <form onSubmit={handleGuardarArticle} style={{ padding: '8px 0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                              <div>
                                <label>Nom</label>
                                <input value={editArticle.nom} onChange={(e) => setEditArticle({ ...editArticle, nom: e.target.value })} required />
                              </div>
                              <div>
                                <label>Talla</label>
                                <input value={editArticle.talla} onChange={(e) => setEditArticle({ ...editArticle, talla: e.target.value })} />
                              </div>
                              <div>
                                <label>Estoc total</label>
                                <input type="number" min={0} value={editArticle.estocTotal} onChange={(e) => setEditArticle({ ...editArticle, estocTotal: e.target.value })} style={{ width: 90 }} />
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
      )}

      {pestanya === 'assignacions' && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={mostrarRetornades} onChange={(e) => setMostrarRetornades(e.target.checked)} style={{ width: 'auto' }} />
              Mostra també les retornades
            </label>
            <button onClick={() => setMostrarFormAssignacio(!mostrarFormAssignacio)} disabled={esFederacio && !agrupacioSeleccionada}>
              {mostrarFormAssignacio ? 'Cancel·lar' : '+ Assignar a un voluntari'}
            </button>
          </div>

          {mostrarFormAssignacio && (
            <form onSubmit={handleCrearAssignacio} className="card" style={{ marginBottom: 20, maxWidth: 460 }}>
              <div style={{ marginBottom: 10 }}>
                <label>Voluntari</label>
                <select value={formAssignacio.voluntariId} onChange={(e) => setFormAssignacio({ ...formAssignacio, voluntariId: e.target.value })} required style={{ width: '100%' }}>
                  <option value="">Selecciona un voluntari...</option>
                  {voluntaris.map((v) => (
                    <option key={v.id} value={v.id}>{v.nom} {v.cognoms}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
                <div style={{ flex: 2 }}>
                  <label>Article</label>
                  <select value={formAssignacio.articleId} onChange={(e) => setFormAssignacio({ ...formAssignacio, articleId: e.target.value })} required style={{ width: '100%' }}>
                    <option value="">Selecciona un article...</option>
                    {articles.map((a) => (
                      <option key={a.id} value={a.id}>{a.nom}{a.talla ? ` (${a.talla})` : ''} — {a.estocLliure} lliures</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label>Quantitat</label>
                  <input type="number" min={1} value={formAssignacio.quantitat} onChange={(e) => setFormAssignacio({ ...formAssignacio, quantitat: e.target.value })} style={{ width: '100%' }} />
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label>Notes (opcional)</label>
                <textarea value={formAssignacio.notes} onChange={(e) => setFormAssignacio({ ...formAssignacio, notes: e.target.value })} rows={2} style={{ width: '100%' }} />
              </div>
              <button type="submit">Assignar</button>
            </form>
          )}

          {assignacions.length === 0 ? (
            <p className="text-muted">No hi ha cap assignació registrada.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Voluntari</th>
                    <th>Article</th>
                    <th>Quantitat</th>
                    <th>Des de</th>
                    <th>Estat</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {assignacions.map((a) => (
                    <tr key={a.id}>
                      <td>{a.voluntari?.nom} {a.voluntari?.cognoms}</td>
                      <td>{a.article?.nom}{a.article?.talla ? ` (${a.article.talla})` : ''}</td>
                      <td>{a.quantitat}</td>
                      <td className="text-muted">{new Date(a.dataAssignacio).toLocaleDateString('ca-ES')}</td>
                      <td>
                        {a.dataRetorn ? (
                          <span className="text-muted">Retornat el {new Date(a.dataRetorn).toLocaleDateString('ca-ES')}</span>
                        ) : (
                          <span style={{ color: 'var(--c-success)', fontWeight: 700 }}>Assignat</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {!a.dataRetorn && (
                            <button onClick={() => handleRetornar(a.id)} style={{ fontSize: 12 }}>Retornar</button>
                          )}
                          <button onClick={() => handleEliminarAssignacio(a.id)} className="btn-danger" style={{ fontSize: 12 }}>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
