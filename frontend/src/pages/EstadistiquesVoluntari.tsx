import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AssistenciaPropia, obtenirEstadistiquesPropies } from '../services/voluntaris';
import BotoTornar from '../components/BotoTornar';

const COLORS = ['#1d4ed8', '#3b82f6', '#0ea5e9', '#16a34a', '#f59e0b', '#7c3aed', '#db2777'];

export default function EstadistiquesVoluntari() {
  const [dades, setDades] = useState<AssistenciaPropia[]>([]);
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenirEstadistiquesPropies()
      .then(setDades)
      .catch(() => setError('No s\'han pogut carregar les estadístiques'))
      .finally(() => setCarregant(false));
  }, []);

  const confirmades = useMemo(() => dades.filter((a) => a.confirmat), [dades]);
  const totalHores = confirmades.reduce((s, a) => s + (a.horesRealitzades || 0), 0);
  const totalServeis = confirmades.length;

  const horesPerMes = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const a of confirmades) {
      const mes = a.servei.dataInici.slice(0, 7);
      mapa.set(mes, (mapa.get(mes) || 0) + (a.horesRealitzades || 0));
    }
    return [...mapa.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([mes, hores]) => ({ mes, hores }));
  }, [confirmades]);

  const horesPerTipus = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const a of confirmades) {
      const clau = a.servei.tipus || 'Sense tipus';
      mapa.set(clau, (mapa.get(clau) || 0) + (a.horesRealitzades || 0));
    }
    return [...mapa.entries()].map(([tipus, hores]) => ({ tipus, hores })).filter((x) => x.hores > 0);
  }, [confirmades]);

  const horesPerAny = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const a of confirmades) {
      const any = a.servei.dataInici.slice(0, 4);
      mapa.set(any, (mapa.get(any) || 0) + (a.horesRealitzades || 0));
    }
    return [...mapa.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([any, hores]) => ({ any, hores }));
  }, [confirmades]);

  return (
    <div className="page">
      <BotoTornar />
      <h1>Les meves estadístiques</h1>

      {error && <p className="text-error">{error}</p>}

      {carregant ? (
        <p className="text-muted">Carregant...</p>
      ) : totalServeis === 0 ? (
        <p className="text-muted">Encara no tens cap servei confirmat.</p>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 16, maxWidth: 460 }}>
            <p style={{ margin: 0 }}>
              <strong>{totalServeis}</strong> serveis fets · <strong>{totalHores}</strong> hores acumulades
            </p>
          </div>

          {horesPerTipus.length > 0 && (
            <div className="card" style={{ marginBottom: 16, maxWidth: 460 }}>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>Hores per tipus de servei</p>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={horesPerTipus} dataKey="hores" nameKey="tipus" cx="50%" cy="50%" outerRadius={80} label>
                      {horesPerTipus.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="card" style={{ marginBottom: 16, maxWidth: 460 }}>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Hores per any</p>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={horesPerAny}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="any" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="hores" fill="#15803d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16, maxWidth: 460 }}>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Hores per mes</p>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={horesPerMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="hores" fill="#1d4ed8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
