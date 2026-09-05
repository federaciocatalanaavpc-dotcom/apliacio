import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Servei, crearServei, editarServei, eliminarServei, llistarServeis, obtenirServei, marcarAssistencia } from '../services/serveis';
import { Voluntari, llistarVoluntaris } from '../services/voluntaris';
import { Agrupacio, llistarAgrupacions } from '../services/agrupacions';
import { TipusServei, crearTipusServei, editarTipusServei, eliminarTipusServei, llistarTipusServei } from '../services/tipusServei';
import { CategoriaServei, crearCategoriaServei, editarCategoriaServei, eliminarCategoriaServei, llistarCategoriesServei } from '../services/categoriaServei';
import { getUsuariActual } from '../services/api';
import GestorCataleg from '../components/GestorCataleg';
import SelectorMapa from '../components/SelectorMapa';

const DESTINATARIS_OPCIONS = [
  { valor: 'PRESENCIAL', etiqueta: 'Disponibles: Presencial' },
  { valor: 'IMMEDIATA', etiqueta: 'Disponibles: Immediata' },
  { valor: 'DIFERIDA', etiqueta: 'Disponibles: Diferida' },
];

function aDatetimeLocal(iso: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 16);
}

const buit = {
  titol: '',
  numeracio: '',
  maxAssistents: '',
  collaboracioEmergencies: false,
  dataInici: '',
  dataFi: '',
  limitInscripcio: '',
  tipus: '',
  categoria: '',
  localitat: '',
  sollicitant: '',
  latitud: null as number | null,
  longitud: null as number | null,
  adreca: '',
  descripcio: '',
  destinataris: [] as string[],
};

export default function ServeisPage({ embedded = false }: { embedded?: boolean } = {}) {
  const usuariActual = getUsuariActual();
  const esFederacio = usuariActual?.rol === 'FEDERACIO';
  const [serveis, setServeis] = useState<Servei[]>([]);
  const [agrupacions, setAgrupacions] = useState<Agrupacio[]>([]);
  const [tipusServei, setTipusServei] = useState<TipusServei[]>([]);
  const [categories, setCategories] = useState<CategoriaServei[]>([]);
  const [voluntaris, setVoluntaris] = useState<Voluntari[]>([]);
  const [agrupacioSeleccionada, setAgrupacioSeleccionada] = useState('');
  const [pestanya, setPestanya] = useState<'oberts' | 'arxivats'>('oberts');
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState('');
  const [mostrarFormulari, setMostrarFormulari] = useState(false);
  const [mostrarTipus, setMostrarTipus] = useState(false);
  const [mostrarCategoria, setMostrarCategoria] = useState(false);
  const [form, setForm] = useState(buit);
  const [gestionantId, setGestionantId] = useState<string | null>(null);

  async function carregar() {
    setCarregant(true);
    try {
      const [ags, tipus, cats] = await Promise.all([
        esFederacio ? llistarAgrupacions() : Promise.resolve([]),
        llistarTipusServei(),
        llistarCategoriesServei(),
      ]);
      setAgrupacions(ags);
      setTipusServei(tipus);
      setCategories(cats);
      const s = await llistarServeis({
        agrupacioId: esFederacio ? agrupacioSeleccionada || undefined : undefined,
        arxivat: pestanya === 'arxivats',
      });
      setServeis(s);
      const v = await llistarVoluntaris(esFederacio ? agrupacioSeleccionada || undefined : undefined);
      setVoluntaris(v);
    } catch {
      setError('No s\'han pogut carregar els serveis');
    } finally {
      setCarregant(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agrupacioSeleccionada, pestanya]);

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (esFederacio && !agrupacioSeleccionada) {
      setError('Selecciona primer una associació');
      return;
    }
    try {
      await crearServei({
        agrupacioId: esFederacio ? agrupacioSeleccionada : undefined,
        titol: form.titol,
        numeracio: form.numeracio || undefined,
        maxAssistents: form.maxAssistents ? Number(form.maxAssistents) : undefined,
        collaboracioEmergencies: form.collaboracioEmergencies,
        dataInici: form.dataInici,
        dataFi: form.dataFi,
        limitInscripcio: form.limitInscripcio || undefined,
        tipus: form.tipus || undefined,
        categoria: form.categoria || undefined,
        localitat: form.localitat || undefined,
        sollicitant: form.sollicitant || undefined,
        latitud: form.latitud ?? undefined,
        longitud: form.longitud ?? undefined,
        adreca: form.adreca || undefined,
        descripcio: form.descripcio || undefined,
        destinataris: form.destinataris.length === 0 ? 'TOTS' : form.destinataris.join(','),
      });
      setForm(buit);
      setMostrarFormulari(false);
      carregar();
    } catch {
      setError('No s\'ha pogut crear el servei');
    }
  }

  async function handleEliminar(id: string) {
    try {
      await eliminarServei(id);
      carregar();
    } catch {
      setError('No s\'ha pogut eliminar el servei');
    }
  }

  async function handleArxivar(s: Servei) {
    try {
      await editarServei(s.id, { arxivat: !s.arxivat } as any);
      carregar();
    } catch {
      setError('No s\'ha pogut arxivar el servei');
    }
  }

  function toggleDestinatari(valor: string) {
    setForm((f) => ({
      ...f,
      destinataris: f.destinataris.includes(valor) ? f.destinataris.filter((d) => d !== valor) : [...f.destinataris, valor],
    }));
  }

  if (carregant) return <p className={embedded ? 'text-muted' : 'page text-muted'}>Carregant serveis...</p>;

  return (
    <div className={embedded ? undefined : 'page'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {!embedded && <h1>Serveis</h1>}
        <button onClick={() => setMostrarFormulari(!mostrarFormulari)}>
          {mostrarFormulari ? 'Cancel·lar' : '+ Nou servei'}
        </button>
      </div>

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

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setPestanya('oberts')} style={pestanya === 'oberts' ? { background: 'var(--gradient)', color: '#fff', border: 'none' } : {}}>
          Oberts
        </button>
        <button onClick={() => setPestanya('arxivats')} style={pestanya === 'arxivats' ? { background: 'var(--gradient)', color: '#fff', border: 'none' } : {}}>
          Arxivats
        </button>
      </div>

      {error && <p className="text-error">{error}</p>}

      {mostrarFormulari && (
        <form onSubmit={handleCrear} className="card" style={{ marginBottom: 20, maxWidth: 520 }}>
          <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
            <div style={{ flex: 2 }}>
              <label>Títol</label>
              <input value={form.titol} onChange={(e) => setForm({ ...form, titol: e.target.value })} required style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Numeració</label>
              <input value={form.numeracio} onChange={(e) => setForm({ ...form, numeracio: e.target.value })} style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ marginBottom: 10, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label>Màxim assistents</label>
              <input type="number" min={0} value={form.maxAssistents} onChange={(e) => setForm({ ...form, maxAssistents: e.target.value })} style={{ width: '100%' }} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <input type="checkbox" checked={form.collaboracioEmergencies} onChange={(e) => setForm({ ...form, collaboracioEmergencies: e.target.checked })} style={{ width: 'auto' }} />
              Col·laboració amb altres serveis d'emergències
            </label>
          </div>
          <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Data i hora d'inici</label>
              <input type="datetime-local" value={form.dataInici} onChange={(e) => setForm({ ...form, dataInici: e.target.value })} required style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Data i hora de finalització</label>
              <input type="datetime-local" value={form.dataFi} onChange={(e) => setForm({ ...form, dataFi: e.target.value })} required style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Límit d'inscripció</label>
            <input type="datetime-local" value={form.limitInscripcio} onChange={(e) => setForm({ ...form, limitInscripcio: e.target.value })} style={{ width: '100%' }} />
          </div>

          <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Tipus</label>
              <select value={form.tipus} onChange={(e) => setForm({ ...form, tipus: e.target.value })} style={{ width: '100%' }}>
                <option value="">Sense especificar</option>
                {tipusServei.map((t) => (
                  <option key={t.id} value={t.nom}>{t.nom}</option>
                ))}
              </select>
              <button type="button" onClick={() => setMostrarTipus(!mostrarTipus)} style={{ fontSize: 11, marginTop: 4 }}>
                {mostrarTipus ? 'Amagar' : 'Gestionar tipus'}
              </button>
            </div>
            <div style={{ flex: 1 }}>
              <label>Categoria</label>
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} style={{ width: '100%' }}>
                <option value="">Sense especificar</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.nom}>{c.nom}</option>
                ))}
              </select>
              <button type="button" onClick={() => setMostrarCategoria(!mostrarCategoria)} style={{ fontSize: 11, marginTop: 4 }}>
                {mostrarCategoria ? 'Amagar' : 'Gestionar categories'}
              </button>
            </div>
          </div>
          {mostrarTipus && (
            <GestorCataleg
              items={tipusServei}
              placeholder="Nou tipus (p.ex. Trasllat)"
              onAfegir={async (nom) => { await crearTipusServei(nom); carregar(); }}
              onEditar={async (id, nom) => { await editarTipusServei(id, nom); carregar(); }}
              onEliminar={async (id) => { await eliminarTipusServei(id); carregar(); }}
            />
          )}
          {mostrarCategoria && (
            <GestorCataleg
              items={categories}
              placeholder="Nova categoria (p.ex. Reunions)"
              onAfegir={async (nom) => { await crearCategoriaServei(nom); carregar(); }}
              onEditar={async (id, nom) => { await editarCategoriaServei(id, nom); carregar(); }}
              onEliminar={async (id) => { await eliminarCategoriaServei(id); carregar(); }}
            />
          )}

          <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Localitat</label>
              <input value={form.localitat} onChange={(e) => setForm({ ...form, localitat: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Sol·licitant</label>
              <input value={form.sollicitant} onChange={(e) => setForm({ ...form, sollicitant: e.target.value })} style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Adreça (opcional)</label>
            <input value={form.adreca} onChange={(e) => setForm({ ...form, adreca: e.target.value })} style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Ubicació GPS (opcional)</label>
            <SelectorMapa latitud={form.latitud} longitud={form.longitud} onCanviar={(lat, lng) => setForm({ ...form, latitud: lat, longitud: lng })} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Descripció (opcional)</label>
            <textarea value={form.descripcio} onChange={(e) => setForm({ ...form, descripcio: e.target.value })} rows={3} style={{ width: '100%' }} />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label>Enviar a destinataris</label>
            <p className="text-muted" style={{ fontSize: 12, margin: '2px 0 6px' }}>
              Si no marques cap opció, s'envia a tots els voluntaris.
            </p>
            {DESTINATARIS_OPCIONS.map((opt) => (
              <label key={opt.valor} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <input type="checkbox" checked={form.destinataris.includes(opt.valor)} onChange={() => toggleDestinatari(opt.valor)} style={{ width: 'auto' }} />
                {opt.etiqueta}
              </label>
            ))}
          </div>
          <button type="submit">Crear servei</button>
        </form>
      )}

      {serveis.length === 0 ? (
        <p className="text-muted">Encara no hi ha cap servei {pestanya === 'arxivats' ? 'arxivat' : 'obert'}.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {serveis.map((s) => (
            <div key={s.id} className="card" style={{ maxWidth: 560 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong>{s.titol}</strong>
                <span className="badge badge--role">{s._count?.assistencies || 0} assistents</span>
              </div>
              <p className="text-muted" style={{ fontSize: 13, margin: '4px 0' }}>
                {new Date(s.dataInici).toLocaleString('ca-ES')}
                {s.tipus ? ` · ${s.tipus}` : ''}
                {s.categoria ? ` · ${s.categoria}` : ''}
              </p>
              {s.descripcio && <p className="text-muted" style={{ fontSize: 13, margin: '4px 0' }}>{s.descripcio}</p>}

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => setGestionantId(gestionantId === s.id ? null : s.id)} style={{ fontSize: 12 }}>
                  {gestionantId === s.id ? 'Tancar' : 'Gestionar assistents'}
                </button>
                <button onClick={() => handleArxivar(s)} style={{ fontSize: 12 }}>
                  {s.arxivat ? 'Desarxivar' : 'Arxivar'}
                </button>
                <button onClick={() => handleEliminar(s.id)} style={{ fontSize: 12, color: 'var(--c-error)' }}>
                  Eliminar
                </button>
              </div>

              {gestionantId === s.id && (
                <GestioAssistents serveiId={s.id} voluntaris={voluntaris} onCanvi={carregar} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GestioAssistents({ serveiId, voluntaris, onCanvi }: { serveiId: string; voluntaris: Voluntari[]; onCanvi: () => void }) {
  const [servei, setServei] = useState<Servei | null>(null);
  const [error, setError] = useState('');
  const [generantPdf, setGenerantPdf] = useState(false);

  async function carregar() {
    try {
      setServei(await obtenirServei(serveiId));
    } catch {
      setError('No s\'ha pogut carregar el servei');
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serveiId]);

  async function handleHores(voluntariId: string, hores: string) {
    setError('');
    try {
      await marcarAssistencia(serveiId, voluntariId, { horesRealitzades: hores === '' ? undefined : Number(hores), confirmat: true });
      await carregar();
      onCanvi();
    } catch {
      setError('No s\'han pogut desar les hores');
    }
  }

  function handleGenerarInforme() {
    if (!servei) return;
    setGenerantPdf(true);
    setError('');
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(servei.titol, 14, 18);
      doc.setFontSize(10);
      const dades = [
        `Associació: ${servei.agrupacio?.nom || ''}`,
        `Inici: ${new Date(servei.dataInici).toLocaleString('ca-ES')}`,
        `Fi: ${new Date(servei.dataFi).toLocaleString('ca-ES')}`,
        servei.tipus ? `Tipus: ${servei.tipus}` : '',
        servei.categoria ? `Categoria: ${servei.categoria}` : '',
        servei.localitat ? `Localitat: ${servei.localitat}` : '',
        servei.sollicitant ? `Sol·licitant: ${servei.sollicitant}` : '',
        servei.adreca ? `Adreça: ${servei.adreca}` : '',
      ].filter(Boolean);
      let y = 26;
      for (const linia of dades) {
        doc.text(linia, 14, y);
        y += 6;
      }
      if (servei.descripcio) {
        y += 2;
        doc.setFontSize(11);
        doc.text('Descripció', 14, y);
        y += 6;
        doc.setFontSize(10);
        const linies = doc.splitTextToSize(servei.descripcio, 180);
        doc.text(linies, 14, y);
        y += linies.length * 5 + 6;
      }
      autoTable(doc, {
        startY: y + 4,
        head: [['Voluntari', 'Confirmat', 'Hores']],
        body: (servei.assistencies || []).map((a) => [
          `${a.voluntari?.nom || ''} ${a.voluntari?.cognoms || ''}`,
          a.confirmat ? 'Sí' : 'No',
          a.horesRealitzades != null ? String(a.horesRealitzades) : '—',
        ]),
      });
      doc.save(`informe-servei-${servei.titol.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    } catch {
      setError('No s\'ha pogut generar el PDF');
    } finally {
      setGenerantPdf(false);
    }
  }

  const assistenciesPerVoluntari = new Map((servei?.assistencies || []).map((a) => [a.voluntariId, a]));

  return (
    <div style={{ borderTop: '1px solid var(--c-border)', marginTop: 10, paddingTop: 10 }}>
      {error && <p className="text-error" style={{ fontSize: 12 }}>{error}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
        {voluntaris.map((v) => {
          const assistencia = assistenciesPerVoluntari.get(v.id);
          return (
            <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <span style={{ flex: 1 }}>
                {v.nom} {v.cognoms}
                {assistencia?.confirmat && <span className="badge" style={{ marginLeft: 6, color: 'var(--c-success)', background: 'var(--c-success-bg)' }}>Confirmat</span>}
              </span>
              <input
                type="number"
                min={0}
                step={0.5}
                placeholder="Hores"
                defaultValue={assistencia?.horesRealitzades ?? ''}
                onBlur={(e) => handleHores(v.id, e.target.value)}
                style={{ width: 80, fontSize: 12 }}
              />
            </div>
          );
        })}
      </div>
      <button onClick={handleGenerarInforme} disabled={!servei || generantPdf} style={{ fontSize: 12 }}>
        {generantPdf ? 'Generant...' : '📄 Generar informe PDF'}
      </button>
    </div>
  );
}
