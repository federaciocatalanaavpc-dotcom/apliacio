import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getUsuariActual } from '../services/api';
import './VoluntariShell.css';

const OPCIONS = [
  { path: '/voluntari/serveis', icon: '📅', label: 'Serveis' },
  { path: '/voluntari/disponibilitat', icon: '🟢', label: 'Disponibilitat' },
  { path: '/voluntari/roba', icon: '🦺', label: 'Roba i EPI' },
  { path: '/voluntari/estadistiques', icon: '📊', label: 'Estadístiques' },
  { path: '/voluntari/alertes', icon: '🚨', label: 'Alertes' },
];

export default function VoluntariShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const usuari = getUsuariActual();
  const nom = usuari?.nom || 'Voluntari';

  return (
    <main className="voluntari-shell">
      <section className="voluntari-shell__hero">
        <div>
          <span className="voluntari-shell__eyebrow">Espai personal</span>
          <h1>Hola, {nom} 👋</h1>
          <p>Consulta els teus serveis, disponibilitat, equipament, activitat i avisos des d’un únic espai.</p>
        </div>
        <div className="voluntari-shell__badge">Voluntariat</div>
      </section>

      <nav className="voluntari-shell__nav" aria-label="Navegació de voluntariat">
        {OPCIONS.map((opcio) => {
          const activa = location.pathname === opcio.path;
          return (
            <Link key={opcio.path} to={opcio.path} className={`voluntari-shell__tab${activa ? ' voluntari-shell__tab--active' : ''}`}>
              <span aria-hidden="true">{opcio.icon}</span>
              <span>{opcio.label}</span>
            </Link>
          );
        })}
      </nav>

      <section className="voluntari-shell__content">{children}</section>
    </main>
  );
}
