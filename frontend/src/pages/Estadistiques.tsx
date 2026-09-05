import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ServeiEstadistiques, obtenirDadesEstadistiques } from '../services/serveis';
import { Agrupacio, llistarAgrupacions } from '../services/agrupacions';
import { getUsuariActual } from '../services/api';
import { svgAPng } from '../services/pdf';

const COLORS = ['#c2410c', '#f59e0b', '#7c2d12', '#15803d', '#0369a1', '#a5690a', '#6d28d9'];

export default function Estadistiques({ embedded = false }: { embedded?: boolean } = {}) {
  const usuariActual = getUsuariActual();
  const esFederacio = usuariActual?.rol === 'FEDERACIO';
  const [agrupacions, setAgrupacions] = useState<Agrupacio[]>([]);
  const [agrupacioSeleccionada, setAgrupacioSeleccionada] = useState('');
  const [dades, setDades] = useState<ServeiEstadistiques[]>([]);
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState('');
  const [generantPdf, setGenerantPdf] = useState(false);

  const refHoresVoluntari = useRef<HTMLDivElement>(null);
  const refServeisPerTipus = useRef<HTMLDivElement>(null);
  const refAssistenciaMes = useRef<HTMLDivElement>(null);

  async function carregar() {
    setCarregant(true);
    setError('');
    try {
      const ags = esFederacio ? await llistarAgrupacions() : [];
      setAgrupacions(ags);
      if (esFederacio && !agrupacioSeleccionada) {
        setDades([]);
        return;
      }
      const d = await obtenirDadesEstadistiques(esFederacio ? agrupacioSeleccionada : undefined);
      setDades(d);
    } catch {
      setError('No s\'han pogut carregar les estadístiques');
    } finally {
      setCarregant(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agrupacioSeleccionada]);

  const horesPerVoluntari = useMemo(() => {
    const mapa = new Map<string, { nom: string; hores: number; serveis: number }>();
    for (const s of dades) {
      for (const a of s.assistencies) {
        if (!a.confirmat) continue;
        const nom = `${a.voluntari.nom} ${a.voluntari.cognoms}`;
        const actual = mapa.get(a.voluntari.id) || { nom, hores: 0, serveis: 0 };
        actual.hores += a.horesRealitzades || 0;
        actual.serveis += 1;
        mapa.set(a.voluntari.id, actual);
      }
    }
    return [...mapa.values()].sort((a, b) => b.hores - a.hores);
  }, [dades]);

  const serveisPerTipus = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const s of dades) {
      const clau = s.tipus || 'Sense tipus';
      mapa.set(clau, (mapa.get(clau) || 0) + 1);
    }
    return [...mapa.entries()].map(([tipus, quantitat]) => ({ tipus, quantitat }));
  }, [dades]);

  const assistenciaPerMes = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const s of dades) {
      const mes = s.dataInici.slice(0, 7);
      const confirmats = s.assistencies.filter((a) => a.confirmat).length;
      mapa.set(mes, (mapa.get(mes) || 0) + confirmats);
    }
    return [...mapa.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([mes, assistents]) => ({ mes, assistents }));
  }, [dades]);

  const totalHores = horesPerVoluntari.reduce((s, v) => s + v.hores, 0);
  const totalServeis = dades.length;

  async function handleExportarPdf() {
    setGenerantPdf(true);
    setError('');
    try {
      const doc = new jsPDF();
      const nomAssociacio = esFederacio ? agrupacions.find((a) => a.id === agrupacioSeleccionada)?.nom : usuariActual?.agrupacioNom;
      doc.setFontSize(16);
      doc.text('Informe d\'estadístiques', 14, 18);
      doc.setFontSize(11);
      doc.text(`${nomAssociacio || ''} · Generat el ${new Date().toLocaleDateString('ca-ES')}`, 14, 26);
      doc.setFontSize(10);
      doc.text(`Total de serveis: ${totalServeis}   ·   Total d'hores registrades: ${totalHores}`, 14, 34);

      let y = 44;
      for (const ref of [refServeisPerTipus, refHoresVoluntari, refAssistenciaMes]) {
        const svg = ref.current?.querySelector('svg');
        if (!svg) continue;
        const { dataUrl, width, height } = await svgAPng(svg);
        const amplePdf = 180;
        const altPdf = (height / width) * amplePdf;
        if (y + altPdf > 280) {
          doc.addPage();
          y = 20;
        }
        doc.addImage(dataUrl, 'PNG', 14, y, amplePdf, altPdf);
        y += altPdf + 10;
      }

      doc.addPage();
      doc.setFontSize(13);
      doc.text('Hores per voluntari', 14, 18);
      autoTable(doc, {
        startY: 24,
        head: [['Voluntari', 'Serveis', 'Hores']],
        body: horesPerVoluntari.map((v) => [v.nom, String(v.serveis), String(v.hores)]),
      });

      doc.save(`estadistiques-${(nomAssociacio || 'avpc').toLowerCase().replace(/\s+/g, '-')}.pdf`);
    } catch {
      setError('No s\'ha pogut generar el PDF');
    } finally {
      setGenerantPdf(false);
    }
  }

  return (
    <div className={embedded ? undefined : 'page'}>
      {!embedded && <h1>Estadístiques</h1>}

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

      {error && <p className="text-error">{error}</p>}

      {carregant ? (
        <p className="text-muted">Carregant estadístiques...</p>
      ) : esFederacio && !agrupacioSeleccionada ? (
        <p className="text-muted">Selecciona una associació per veure les seves estadístiques.</p>
      ) : dades.length === 0 ? (
        <p className="text-muted">Encara no hi ha serveis registrats.</p>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button onClick={handleExportarPdf} disabled={generantPdf}>
              {generantPdf ? 'Generant PDF...' : '📄 Exportar PDF'}
            </button>
          </div>

          <div className="card" style={{ marginBottom: 16, maxWidth: 480 }}>
            <p style={{ margin: 0 }}>
              <strong>{totalServeis}</strong> serveis registrats · <strong>{totalHores}</strong> hores acumulades
            </p>
          </div>

          <div className="card" style={{ marginBottom: 16, maxWidth: 640 }}>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Serveis per tipus</p>
            <div ref={refServeisPerTipus} style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={serveisPerTipus} dataKey="quantitat" nameKey="tipus" cx="50%" cy="50%" outerRadius={90} label>
                    {serveisPerTipus.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16, maxWidth: 640 }}>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Hores per voluntari</p>
            <div ref={refHoresVoluntari} style={{ height: Math.max(200, horesPerVoluntari.length * 32) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={horesPerVoluntari} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="nom" width={140} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="hores" fill="#c2410c" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16, maxWidth: 640 }}>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Assistència per mes</p>
            <div ref={refAssistenciaMes} style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assistenciaPerMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="assistents" fill="#0369a1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ overflowX: 'auto', maxWidth: 480 }}>
            <table>
              <thead>
                <tr>
                  <th>Voluntari</th>
                  <th>Serveis</th>
                  <th>Hores</th>
                </tr>
              </thead>
              <tbody>
                {horesPerVoluntari.map((v) => (
                  <tr key={v.nom}>
                    <td>{v.nom}</td>
                    <td>{v.serveis}</td>
                    <td>{v.hores}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
