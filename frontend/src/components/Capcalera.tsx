import { Link, useNavigate } from 'react-router-dom';
import { getUsuariActual, logout } from '../services/api';

export default function Capcalera() {
  const usuari = getUsuariActual();
  const navigate = useNavigate();
  const esVoluntari = usuari?.rol === 'VOLUNTARI';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img src="/logo.png" alt="App Federació" style={{ height: 32, marginRight: 10 }} />
        <strong style={{ color: '#fff', fontSize: 16, letterSpacing: '-0.01em' }}>
          App Federació
        </strong>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        {!esVoluntari && (
          <Link to="/avisos" style={{ color: '#fff', fontSize: 22, lineHeight: 1, display: 'flex' }} title="Avisos">
            📢
          </Link>
        )}
        <Link to="/canviar-contrasenya" style={{ color: '#fff', fontSize: 13, whiteSpace: 'nowrap' }}>🔑 Contrasenya</Link>
        <button onClick={handleLogout} style={{ fontSize: 13 }}>Sortir</button>
      </div>
    </div>
  );
}
