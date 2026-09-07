import { Link } from 'react-router-dom';
import { getUsuariActual } from '../services/api';

export default function Capcalera() {
  const usuari = getUsuariActual();
  const esVoluntari = usuari?.rol === 'VOLUNTARI';

  return (
    <div className="topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img src="/logo.png" alt="App Federació" style={{ height: 32, marginRight: 10 }} />
        <strong style={{ color: '#fff', fontSize: 16, letterSpacing: '-0.01em' }}>
          App Federació
        </strong>
      </div>
      {!esVoluntari && (
        <Link to="/avisos" style={{ color: '#fff', fontSize: 22, lineHeight: 1, display: 'flex' }} title="Avisos">
          📢
        </Link>
      )}
    </div>
  );
}
