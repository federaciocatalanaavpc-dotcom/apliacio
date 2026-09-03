import { getUsuariActual, logout } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

const enllacos = [
  { to: '/membres', icon: '🧑‍🤝‍🧑', label: 'Membres' },
  { to: '/vehicles', icon: '🚗', label: 'Vehicles' },
  { to: '/material', icon: '🎒', label: 'Material' },
  { to: '/documents', icon: '📄', label: "Estatuts i llibre d'actes" },
  { to: '/formacio', icon: '🎓', label: 'Formació' },
  { to: '/avisos', icon: '📢', label: 'Avisos' },
];

export default function Dashboard() {
  const usuari = getUsuariActual();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>Hola, {usuari?.nom} 👋</h1>
          <span className="badge badge--role">
            {usuari?.rol === 'FEDERACIO' ? 'Federació' : 'Agrupació'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={handleLogout}>Sortir</button>
        </div>
      </div>

      <div className="nav-grid">
        {enllacos.map((e) => (
          <Link key={e.to} to={e.to} className="card card--clickable nav-tile">
            <span className="nav-tile__icon">{e.icon}</span>
            {e.label}
            <span className="nav-tile__arrow">→</span>
          </Link>
        ))}
      </div>

      {usuari?.rol === 'FEDERACIO' && (
        <div className="nav-grid" style={{ marginTop: 20 }}>
          <Link to="/agrupacions" className="card card--clickable nav-tile">
            <span className="nav-tile__icon">🏛️</span>
            Agrupacions
            <span className="nav-tile__arrow">→</span>
          </Link>
          <Link to="/usuaris" className="card card--clickable nav-tile">
            <span className="nav-tile__icon">👥</span>
            Gestionar usuaris
            <span className="nav-tile__arrow">→</span>
          </Link>
        </div>
      )}
    </div>
  );
}
