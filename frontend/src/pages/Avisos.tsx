import { useEffect, useState } from 'react';
import { Avis, SeguimentAvis, crearAvis, eliminarAvis, llistarAvisos, obtenirSeguimentAvis } from '../services/avisos';
import { Agrupacio, llistarAgrupacions } from '../services/agrupacions';
import { getUsuariActual } from '../services/api';
import BotoTornar from '../components/BotoTornar';
import NotificacionsCard from '../components/NotificacionsCard';

export default function Avisos() {
  const usuariActual = getUsuariActual();
  const esFederacio = usuariActual?.rol === 'FEDERACIO';
  const [avisos, setAvisos] = useState<Avis[]>([]);
  const [agrupacions, setAgrupacions] = useState<Agrupacio[]>([]);
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState('');

  const [titol, setTitol] = useState('');
  const [cos, setCos] = useState('');
  const [agrupacioId, setAgrupacioId] = useState('');
  const [dataEnviament, setDataEnviament] = useState('');
  const [demanaResposta, setDemanaResposta] = useState(false);
  const [seguimentObertId, setSeguimentObertId] = useState<string | null>(null);
  const [seguiment, setSeguiment] = useState<SeguimentAvis | null>(null);

  async function carregar() {
    setCarregant(true);
    try {
      const [a, ags] = await Promise.all([llistarAvisos(), esFederacio ? llistarAgrupacions() : Promise.resolve([])]);
      setAvisos(a);
      setAgrupacions(ags);
    } catch {
      setError('No s\'han pogut carregar els avisos');
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
      await crearAvis({
        titol,
        cos,
        agrupacioId: esFederacio ? agrupacioId || null : undefined,
        dataEnviament: dataEnviament || undefined,
        demanaResposta,
      });
      setTitol('');
      setCos('');
      setAgrupacioId('');
      setDataEnviament('');
      setDemanaResposta(false);
      carregar();
    } catch {
      setError('No s\'ha pogut crear l\'avís');
    }
  }

  // Mentre el seguiment és obert es refresca cada 10 s per veure les respostes en directe.
  useEffect(() => {
    if (!seguimentObertId) return;
    let cancelat = false;
    const carregarSeguiment = () =>
      obtenirSeguimentAvis(seguimentObertId).then((s) => !cancelat && setSeguiment(s)).catch(() => {});
    carregarSeguiment();
    const interval = setInterval(carregarSeguiment, 10_000);
    return () => {
      cancelat = true;
      clearInterval(interval);
    };
  }, [seguimentObertId]);

  function alternarSeguiment(id: string) {
    setSeguiment(null);
    setSeguimentObertId(seguimentObertId === id ? null : id);
  }

  async function handleEliminar(id: string) {
    try {
      await eliminarAvis(id);
      carregar();
    } catch {
      setError('No s\'ha pogut eliminar l\'avís');
    }
  }

  if (carregant) return <p className="page text-muted">Carregant avisos...</p>;

  return (
    <div className="page">
      <BotoTornar />
      <h1>Avisos</h1>

      <NotificacionsCard />

      {error && <p className="text-error">{error}</p>}

      <form onSubmit={handleCrear} className="card" style={{ marginBottom: 20, maxWidth: 420 }}>
        <div style={{ marginBottom: 10 }}>
          <label>Títol</label>
          <input value={titol} onChange={(e) => setTitol(e.target.value)} required style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Missatge</label>
          <textarea value={cos} onChange={(e) => setCos(e.target.value)} required rows={3} style={{ width: '100%' }} />
        </div>
        {esFederacio && (
          <div style={{ marginBottom: 10 }}>
            <label>Destinataris</label>
            <select value={agrupacioId} onChange={(e) => setAgrupacioId(e.target.value)} style={{ width: '100%' }}>
              <option value="">Tota la federació</option>
              {agrupacions.map((a) => (
                <option key={a.id} value={a.id}>{a.nom} ({a.municipi})</option>
              ))}
            </select>
          </div>
        )}
        <div style={{ marginBottom: 10 }}>
          <label>Programar per a més tard (opcional)</label>
          <input type="datetime-local" value={dataEnviament} onChange={(e) => setDataEnviament(e.target.value)} style={{ width: '100%' }} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <input type="checkbox" checked={demanaResposta} onChange={(e) => setDemanaResposta(e.target.checked)} style={{ width: 'auto' }} />
          Demana confirmació (vaig / no puc) i mostra'n el seguiment
        </label>
        <button type="submit">Enviar avís</button>
      </form>

      {avisos.length === 0 && <p className="text-muted">No hi ha cap avís.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {avisos.map((a) => (
          <div key={a.id} className="card" style={{ maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <strong>{a.titol}</strong>
              {!a.enviat && <span className="badge" style={{ color: 'var(--c-warning)', background: 'var(--c-warning-bg)' }}>Programat</span>}
            </div>
            <p style={{ margin: '4px 0', fontSize: 14 }}>{a.cos}</p>
            <p className="text-muted" style={{ margin: '4px 0 8px', fontSize: 12 }}>
              {a.agrupacio ? a.agrupacio.nom : 'Tota la federació'} · {new Date(a.dataEnviament).toLocaleString('ca-ES')}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {a.enviat && (
                <button onClick={() => alternarSeguiment(a.id)} style={{ fontSize: 12 }}>
                  {seguimentObertId === a.id ? 'Amagar seguiment' : '📊 Seguiment'}
                </button>
              )}
              <button onClick={() => handleEliminar(a.id)} className="btn-danger" style={{ fontSize: 12 }}>
                Eliminar
              </button>
            </div>
            {seguimentObertId === a.id && (
              <div style={{ marginTop: 10, borderTop: '1px solid var(--c-border)', paddingTop: 10 }}>
                {!seguiment ? (
                  <p className="text-muted" style={{ fontSize: 12 }}>Carregant seguiment...</p>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                      {seguiment.demanaResposta && <span style={{ color: 'var(--c-success)' }}>✅ Vaig: {seguiment.vaig}</span>}
                      {seguiment.demanaResposta && <span className="text-muted">❌ No puc: {seguiment.noPuc}</span>}
                      <span>👁️ Llegit: {seguiment.llegits}/{seguiment.total}</span>
                      <span style={{ color: 'var(--c-warning)' }}>⏳ Sense llegir: {seguiment.pendents}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 260, overflowY: 'auto' }}>
                      {seguiment.destinataris.map((d) => (
                        <div key={d.nom} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span>{d.nom}</span>
                          <span className="text-muted">
                            {d.estat === 'VAIG' ? '✅ Vaig' : d.estat === 'NO_PUC' ? '❌ No puc' : d.estat === 'LLEGIT' ? '👁️ Llegit' : '⏳ Pendent'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
