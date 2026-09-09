import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getUsuariActual, logout } from '../services/api';
import './Capcalera.css';

function obtenirContext(pathname: string) {
  if (pathname.startsWith('/gestio-avpc')) return { label: 'Gestió AVPC', classe: 'app-header--avpc' };
  if (pathname.startsWith('/federacio') || ['/agrupacions', '/inventari', '/mapa', '/documents', '/formacio', '/documentacio-propia', '/usuaris'].some((p) => pathname.startsWith(p))) {
    return { label: 'Federació', classe: 'app-header--federacio' };
  }
  if (pathname.startsWith('/voluntari')) return { label: 'Espai voluntari', classe: 'app-header--voluntari' };
  return { label: 'Plataforma', classe: '' };
}

export default function Capcalera() {
  const usuari = getUsuariActual();
  const navigate = useNavigate();
  const location = useLocation();
  const esVoluntari = usuari?.rol === 'VOLUNTARI';
  const context = usuari?.rol === 'ADMIN_AVPC' ? { label: 'Gestió AVPC', classe: 'app-header--avpc' } : obtenirContext(location.pathname);
  const inicial = (usuari?.nom || usuari?.agrupacioNom || 'U').trim().charAt(0).toUpperCase();
  const nomVisible = usuari?.nom || usuari?.agrupacioNom || 'Usuari';
  const rolVisible = usuari?.rol === 'ADMIN_AVPC' ? 'Administrador AVPC' : usuari?.rol === 'FEDERACIO' ? 'Administrador Federació' : usuari?.rol === 'AGRUPACIO' ? 'Associació' : 'Voluntari';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className={`topbar app-header ${context.classe}`}>
      <div className="app-header__inner">
        <Link to="/" className="app-header__brand" aria-label="Anar a l'inici">
          <img src="/logo.png" alt="" className="app-header__logo" />
          <span className="app-header__brand-copy">
            <strong>App Federació</strong>
            <small>{context.label}</small>
          </span>
        </Link>

        <nav className="app-header__actions" aria-label="Accions d'usuari">
          {!esVoluntari && (
            <Link to="/avisos" className="app-header__icon-button" title="Avisos" aria-label="Avisos">
              <span aria-hidden="true">🔔</span>
            </Link>
          )}

          <div className="app-header__user">
            <span className="app-header__avatar" aria-hidden="true">{inicial}</span>
            <span className="app-header__user-copy">
              <strong>{nomVisible}</strong>
              <small>{rolVisible}</small>
            </span>
          </div>

          <Link to="/canviar-contrasenya" className="app-header__secondary-action">
            Contrasenya
          </Link>
          <button onClick={handleLogout} className="app-header__logout">Sortir</button>
        </nav>
      </div>
    </header>
  );
}
