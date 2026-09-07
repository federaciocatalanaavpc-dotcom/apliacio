import { useEffect, useState } from 'react';
import { getUsuariActual, logout } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { obtenirVoluntariPropi } from '../services/voluntaris';
import { DISPONIBILITAT_LABEL, DISPONIBILITAT_COLOR } from '../components/SelectorDisponibilitat';

const BOTONS_GRANS = [
  { to: '/gestio-avpc', icon: '🛠️', label: 'Gestió AVPC' },
  { to: '/federacio', icon: '🏛️', label: 'Federació' },
];

export default function Dashboard() {
  const usuari = getUsuariActual();
  const navigate = useNavigate();
  const esVoluntari = usuari?.rol === 'VOLUNTARI';
  const nomMostrat = usuari?.rol === 'FEDERACIO' || esVoluntari ? usuari?.nom : usuari?.agrupacioNom || usuari?.nom;
  const [disponibilitat, setDisponibilitat] = useState<keyof typeof DISPONIBILITAT_LABEL | null>(null);

  useEffect(() => {
    if (esVoluntari) {
      obtenirVoluntariPropi().then((v) => setDisponibilitat(v.disponibilitat)).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>Hola, {nomMostrat} 👋</h1>
          <span className="badge badge--role">
            {usuari?.rol === 'FEDERACIO' ? 'Federació' : esVoluntari ? 'Voluntari' : 'Associació'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link to="/canviar-contrasenya" style={{ fontSize: 13 }}>🔑 Contrasenya</Link>
          <button onClick={handleLogout}>Sortir</button>
        </div>
      </div>

      {esVoluntari ? (
        <div className="nav-grid" style={{ marginTop: 16 }}>
          <Link
            to="/voluntari/disponibilitat"
            className="card card--clickable nav-tile"
            style={
              disponibilitat
                ? { background: DISPONIBILITAT_COLOR[disponibilitat], borderColor: 'transparent', color: '#fff' }
                : undefined
            }
          >
            <span className="nav-tile__icon">🟢</span>
            Disponibilitat{disponibilitat ? `: ${DISPONIBILITAT_LABEL[disponibilitat]}` : ''}
            <span className="nav-tile__arrow">→</span>
          </Link>
          <Link to="/voluntari/serveis" className="card card--clickable nav-tile">
            <span className="nav-tile__icon">🚒</span>
            Serveis
            <span className="nav-tile__arrow">→</span>
          </Link>
          <Link to="/voluntari/roba" className="card card--clickable nav-tile">
            <span className="nav-tile__icon">👕</span>
            Roba
            <span className="nav-tile__arrow">→</span>
          </Link>
          <Link to="/voluntari/estadistiques" className="card card--clickable nav-tile">
            <span className="nav-tile__icon">📊</span>
            Estadístiques
            <span className="nav-tile__arrow">→</span>
          </Link>
          <Link to="/voluntari/alertes" className="card card--clickable nav-tile">
            <span className="nav-tile__icon">🔔</span>
            Alertes
            <span className="nav-tile__arrow">→</span>
          </Link>
        </div>
      ) : (
        <div className="nav-grid" style={{ marginTop: 16 }}>
          {BOTONS_GRANS.map((b) => (
            <Link
              key={b.to}
              to={b.to}
              className="card card--clickable"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '18px 20px',
                background: 'var(--gradient)',
                border: 'none',
                color: '#fff',
              }}
            >
              <span style={{ fontSize: 28 }}>{b.icon}</span>
              <span style={{ fontSize: 17, fontWeight: 700, flex: 1 }}>{b.label}</span>
              <span className="nav-tile__arrow">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
