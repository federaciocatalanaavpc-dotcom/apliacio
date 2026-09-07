import { Link } from 'react-router-dom';
import { getUsuariActual } from '../services/api';
import AlertaAFederacio from '../components/AlertaAFederacio';
import NotificacioAssociacions from '../components/NotificacioAssociacions';

const enllacos = [
  { to: '/agrupacions', icon: '🏛️', label: 'Associacions', text: 'Consulta i gestiona les AVPC adherides.' },
  { to: '/inventari', icon: '🚗', label: 'Inventari', text: 'Vehicles, material i recursos compartits.' },
  { to: '/mapa', icon: '🗺️', label: 'Mapa', text: 'Visualitza les agrupacions sobre el territori.' },
  { to: '/documents', icon: '📄', label: 'Documentació', text: 'Documents, normativa i fitxers comuns.' },
  { to: '/formacio', icon: '🎓', label: 'Formació', text: 'Cursos, recursos i seguiment formatiu.' },
];

export default function Federacio() {
  const usuari = getUsuariActual();
  const esFederacio = usuari?.rol === 'FEDERACIO';

  return (
    <main className="page workspace-page workspace-page--federacio">
      <div className="workspace-subnav">
        <Link to="/" className="workspace-back-link">← Inici</Link>
        <Link to="/gestio-avpc" className="workspace-switch-link">Canviar a Gestió AVPC →</Link>
      </div>

      <section className="workspace-home-hero workspace-home-hero--federacio">
        <div>
          <span className="workspace-home-hero__kicker">Coordinació territorial</span>
          <h1>Federació</h1>
          <p>Federació Catalana d’Associacions de Voluntaris de Protecció Civil</p>
        </div>
        <div className="workspace-home-hero__badge">FED</div>
      </section>

      <section className="workspace-alert-zone">
        {!esFederacio && <AlertaAFederacio />}
        {esFederacio && <NotificacioAssociacions />}
      </section>

      <section className="workspace-intro-row">
        <div>
          <span className="dashboard-eyebrow">Gestió federativa</span>
          <h2>Panell de Federació</h2>
        </div>
        <p>Consulta informació global, coordina recursos i accedeix a les eines compartides.</p>
      </section>

      <div className="module-grid">
        {enllacos.map((e) => (
          <Link key={e.to} to={e.to} className="module-card module-card--federacio">
            <span className="module-card__icon" aria-hidden="true">{e.icon}</span>
            <span className="module-card__copy">
              <strong>{e.label}</strong>
              <small>{e.text}</small>
            </span>
            <span className="module-card__arrow" aria-hidden="true">→</span>
          </Link>
        ))}

        <Link to="/documentacio-propia" className="module-card module-card--federacio">
          <span className="module-card__icon" aria-hidden="true">📁</span>
          <span className="module-card__copy">
            <strong>Documentació pròpia</strong>
            <small>Espai privat de documentació de l’entitat.</small>
          </span>
          <span className="module-card__arrow" aria-hidden="true">→</span>
        </Link>

        {esFederacio && (
          <Link to="/usuaris" className="module-card module-card--federacio module-card--admin">
            <span className="module-card__icon" aria-hidden="true">👥</span>
            <span className="module-card__copy">
              <strong>Gestionar usuaris</strong>
              <small>Administració d’accessos, comptes i permisos.</small>
            </span>
            <span className="module-card__arrow" aria-hidden="true">→</span>
          </Link>
        )}
      </div>

      <section className="workspace-tip workspace-tip--federacio">
        <div>
          <strong>Una visió global de totes les AVPC</strong>
          <p>La Federació pot consultar i coordinar la informació compartida per les agrupacions segons els permisos establerts.</p>
        </div>
        <Link to="/agrupacions">Veure associacions →</Link>
      </section>
    </main>
  );
}
