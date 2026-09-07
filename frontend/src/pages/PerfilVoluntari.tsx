import { useEffect, useState } from 'react';
import {
  Voluntari,
  Disponibilitat,
  obtenirVoluntariPropi,
  actualitzarDisponibilitatPropia,
} from '../services/voluntaris';
import { Servei, llistarServeis, confirmarAssistencia, cancelarAssistencia } from '../services/serveis';
import BotoTornar from '../components/BotoTornar';

const DISPONIBILITAT_LABEL: Record<Disponibilitat, string> = {
  PRESENCIAL: 'Presencial',
  IMMEDIATA: 'Immediata',
  DIFERIDA: 'Diferida',
  NO_DISPONIBLE: 'No disponible',
};

const DIES_SETMANA = ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'];
const MESOS = [
  'Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny',
  'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre',
];

function mateixDia(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function inicioSetmana(d: Date) {
  const dt = new Date(d);
  const dow = (dt.getDay() + 6) % 7;
  dt.setDate(dt.getDate() - dow);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function graellaDelMes(ancora: Date) {
  const primerDia = new Date(ancora.getFullYear(), ancora.getMonth(), 1);
  const inici = inicioSetmana(primerDia);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(inici);
    d.setDate(inici.getDate() + i);
    return d;
  });
}

export default function PerfilVoluntari() {
  const [voluntari, setVoluntari] = useState<Voluntari | null>(null);
  const [serveis, setServeis] = useState<Servei[]>([]);
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState('');
  const [ancora, setAncora] = useState(new Date());
  const [seleccionat, setSeleccionat] = useState(new Date());

  async function carregar() {
    setCarregant(true);
    try {
      const [v, s] = await Promise.all([obtenirVoluntariPropi(), llistarServeis()]);
      setVoluntari(v);
      setServeis(s);
    } catch {
      setError('No s\'han pogut carregar les dades');
    } finally {
      setCarregant(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleDisponibilitat(disponibilitat: Disponibilitat) {
    setError('');
    try {
      const v = await actualitzarDisponibilitatPropia(disponibilitat);
      setVoluntari(v);
      carregar();
    } catch {
      setError('No s\'ha pogut actualitzar la disponibilitat');
    }
  }

  async function handleConfirmar(serveiId: string) {
    setError('');
    try {
      await confirmarAssistencia(serveiId);
      carregar();
    } catch {
      setError('No s\'ha pogut confirmar l\'assistència');
    }
  }

  async function handleCancelar(serveiId: string) {
    setError('');
    try {
      await cancelarAssistencia(serveiId);
      carregar();
    } catch {
      setError('No s\'ha pogut cancel·lar l\'assistència');
    }
  }

  function moure(delta: number) {
    const nova = new Date(ancora);
    nova.setMonth(nova.getMonth() + delta);
    setAncora(nova);
  }

  function anarAvui() {
    const avui = new Date();
    setAncora(avui);
    setSeleccionat(avui);
  }

  if (carregant) {
    return (
      <div className="page">
        <BotoTornar />
        <p className="text-muted">Carregant...</p>
      </div>
    );
  }
  if (!voluntari) {
    return (
      <div className="page">
        <BotoTornar />
        <p className="text-error">No s'ha trobat la teva fitxa de voluntari.</p>
      </div>
    );
  }

  const totalHores = serveis.reduce((suma, s) => suma + (s.assistenciaPropia?.horesRealitzades || 0), 0);
  const avui = new Date();
  const esAvuiSeleccionat = mateixDia(seleccionat, avui);
  const diesVisibles = graellaDelMes(ancora);
  const serveisDe = (d: Date) => serveis.filter((s) => mateixDia(new Date(s.dataInici), d));
  const serveisDelDia = serveisDe(seleccionat);

  return (
    <div className="page">
      <BotoTornar />
      <h1>Serveis</h1>
      <div className="card" style={{ marginBottom: 16, maxWidth: 460 }}>
        <p style={{ margin: 0, fontWeight: 700 }}>{voluntari.nom} {voluntari.cognoms}</p>
        {voluntari.indicatiu && <p className="text-muted" style={{ fontSize: 13, margin: '4px 0' }}>Indicatiu: {voluntari.indicatiu}</p>}
        <p className="text-muted" style={{ fontSize: 13, margin: '4px 0' }}>Hores acumulades: <strong>{totalHores}</strong></p>
        <div style={{ marginTop: 10 }}>
          <label>La meva disponibilitat</label>
          <select value={voluntari.disponibilitat} onChange={(e) => handleDisponibilitat(e.target.value as Disponibilitat)} style={{ width: '100%' }}>
            {Object.entries(DISPONIBILITAT_LABEL).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>{etiqueta}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-error">{error}</p>}

      <div className="calendar-toolbar">
        <button onClick={() => moure(-1)}>‹</button>
        <span className="calendar-toolbar__label">{MESOS[ancora.getMonth()]} {ancora.getFullYear()}</span>
        <button onClick={() => moure(1)}>›</button>
        <button onClick={anarAvui}>Avui</button>
      </div>

      <div className="calendar-grid">
        {DIES_SETMANA.map((d) => (
          <div key={d} className="calendar-weekday">{d}</div>
        ))}
        {diesVisibles.map((d, i) => {
          const esDelMesActual = d.getMonth() === ancora.getMonth();
          const classes = ['calendar-cell'];
          if (!esDelMesActual) classes.push('calendar-cell--muted');
          if (mateixDia(d, avui)) classes.push('calendar-cell--today');
          if (mateixDia(d, seleccionat)) classes.push('calendar-cell--selected');
          const teServeis = serveisDe(d).length > 0;
          return (
            <div key={i} className={classes.join(' ')} onClick={() => setSeleccionat(d)}>
              <span>{d.getDate()}</span>
              {teServeis && (
                <div className="calendar-dots">
                  <span className="calendar-dot calendar-dot--servei" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <h2 style={{ fontSize: 18, margin: '24px 0 8px' }}>
        {seleccionat.toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        {esAvuiSeleccionat && ' (avui)'}
      </h2>

      {serveisDelDia.length === 0 ? (
        <p className="text-muted">No hi ha cap servei aquest dia.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {serveisDelDia.map((s) => (
            <div key={s.id} className="card" style={{ maxWidth: 460 }}>
              <p style={{ margin: 0, fontWeight: 600 }}>{s.titol}</p>
              <p className="text-muted" style={{ fontSize: 13, margin: '4px 0' }}>
                {new Date(s.dataInici).toLocaleString('ca-ES')}
                {s.localitat ? ` · ${s.localitat}` : ''}
              </p>
              {s.descripcio && <p className="text-muted" style={{ fontSize: 13, margin: '4px 0' }}>{s.descripcio}</p>}
              <div style={{ marginTop: 8 }}>
                {s.assistenciaPropia?.confirmat ? (
                  <>
                    <span className="badge" style={{ color: 'var(--c-success)', background: 'var(--c-success-bg)', marginRight: 8 }}>
                      Assistència confirmada
                    </span>
                    <button onClick={() => handleCancelar(s.id)} style={{ fontSize: 12 }}>Cancel·lar</button>
                  </>
                ) : (
                  <button onClick={() => handleConfirmar(s.id)} style={{ fontSize: 12 }}>Confirmar assistència</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
