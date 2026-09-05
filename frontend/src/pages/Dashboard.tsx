import { getUsuariActual, logout } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

const enllacos = [
  { to: '/agrupacions', icon: '🏛️', label: 'Associacions' },
  { to: '/inventari', icon: '🚗', label: 'Inventari' },
  { to: '/mapa', icon: '🗺️', label: 'Mapa' },
  { to: '/documents', icon: '📄', label: 'Documentació' },
  { to: '/formacio', icon: '🎓', label: 'Formació' },
  { to: '/avisos', icon: '📢', label: 'Avisos' },
];

export default function Dashboard() {
  const usuari = getUsuariActual();
  const navigate = useNavigate();
  const esVoluntari = usuari?.rol === 'VOLUNTARI';
  const nomMostrat = usuari?.rol === 'FEDERACIO' || esVoluntari ? usuari?.nom : usuari?.agrupacioNom || usuari?.nom;

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
          <Link to="/voluntari/serveis" className="card card--clickable nav-tile">
            <span className="nav-tile__icon">🚒</span>
            Serveis
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
        <>
          <div className="nav-grid">
            {enllacos.map((e) => (
              <Link key={e.to} to={e.to} className="card card--clickable nav-tile">
                <span className="nav-tile__icon">{e.icon}</span>
                {e.label}
                <span className="nav-tile__arrow">→</span>
              </Link>
            ))}
          </div>

          <div className="nav-grid" style={{ marginTop: 20 }}>
            <Link to="/documentacio-propia" className="card card--clickable nav-tile">
              <span className="nav-tile__icon">📁</span>
              Documentació pròpia
              <span className="nav-tile__arrow">→</span>
            </Link>
            {usuari?.rol === 'FEDERACIO' && (
              <Link to="/usuaris" className="card card--clickable nav-tile">
                <span className="nav-tile__icon">👥</span>
                Gestionar usuaris
                <span className="nav-tile__arrow">→</span>
              </Link>
            )}
            <Link to="/gestio-avpc" className="card card--clickable nav-tile">
              <span className="nav-tile__icon">🛠️</span>
              Gestió AVPC
              <span className="nav-tile__arrow">→</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
