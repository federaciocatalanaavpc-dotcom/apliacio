import { Link } from 'react-router-dom';
import { getUsuariActual } from '../services/api';
import BotoTornar from '../components/BotoTornar';
import AlertaAFederacio from '../components/AlertaAFederacio';
import CorreuAssociacions from '../components/CorreuAssociacions';

const enllacos = [
  { to: '/agrupacions', icon: '🏛️', label: 'Associacions' },
  { to: '/inventari', icon: '🚗', label: 'Inventari' },
  { to: '/mapa', icon: '🗺️', label: 'Mapa' },
  { to: '/documents', icon: '📄', label: 'Documentació' },
  { to: '/formacio', icon: '🎓', label: 'Formació' },
];

export default function Federacio() {
  const usuari = getUsuariActual();

  return (
    <div className="page">
      <BotoTornar />
      <h1>Federació</h1>

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
      </div>

      {usuari?.rol !== 'FEDERACIO' && (
        <div style={{ marginTop: 20 }}>
          <AlertaAFederacio />
        </div>
      )}

      {usuari?.rol === 'FEDERACIO' && (
        <div style={{ marginTop: 20 }}>
          <CorreuAssociacions />
        </div>
      )}
    </div>
  );
}
