import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUsuariActual } from '../services/api';
import { obtenirVoluntariPropi } from '../services/voluntaris';
import { DISPONIBILITAT_LABEL, DISPONIBILITAT_COLOR } from '../components/SelectorDisponibilitat';

const EINES_COMPARTIDES = [
  { to: '/avisos', icon: '🔔', label: 'Avisos', text: 'Comunicacions i alertes' },
  { to: '/documents', icon: '📄', label: 'Documents', text: 'Documentació compartida' },
  { to: '/formacio', icon: '🎓', label: 'Formació', text: 'Cursos i recursos formatius' },
];

export default function Dashboard() {
  const usuari = getUsuariActual();
  const esVoluntari = usuari?.rol === 'VOLUNTARI';
  const nomMostrat = usuari?.rol === 'FEDERACIO' || esVoluntari ? usuari?.nom : usuari?.agrupacioNom || usuari?.nom;
  const [disponibilitat, setDisponibilitat] = useState<keyof typeof DISPONIBILITAT_LABEL | null>(null);

  useEffect(() => {
    if (esVoluntari) {
      obtenirVoluntariPropi().then((v) => setDisponibilitat(v.disponibilitat)).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (esVoluntari) {
    return (
      <main className="page dashboard-shell">
        <section className="dashboard-hero dashboard-hero--compact">
          <div>
            <span className="dashboard-eyebrow">Espai personal</span>
            <h1>Hola, {nomMostrat} 👋</h1>
            <p>Consulta la teva disponibilitat, serveis, roba, estadístiques i alertes.</p>
          </div>
          <span className="badge badge--role">Voluntari</span>
        </section>

        <div className="nav-grid dashboard-volunteer-grid">
          <Link
            to="/voluntari/disponibilitat"
            className="card card--clickable nav-tile"
            style={
              disponibilitat
                ? { background: DISPONIBILITAT_COLOR[disponibilitat], borderColor: 'transparent', color: '#fff' }
                : undefined
            }
          >
            <span className="nav-tile__icon">●</span>
            <span>
              <strong>Disponibilitat</strong>
              {disponibilitat && <small>{DISPONIBILITAT_LABEL[disponibilitat]}</small>}
            </span>
            <span className="nav-tile__arrow">→</span>
          </Link>
          <Link to="/voluntari/serveis" className="card card--clickable nav-tile">
            <span className="nav-tile__icon">🚒</span>
            <strong>Serveis</strong>
            <span className="nav-tile__arrow">→</span>
          </Link>
          <Link to="/voluntari/roba" className="card card--clickable nav-tile">
            <span className="nav-tile__icon">👕</span>
            <strong>Roba</strong>
            <span className="nav-tile__arrow">→</span>
          </Link>
          <Link to="/voluntari/estadistiques" className="card card--clickable nav-tile">
            <span className="nav-tile__icon">📊</span>
            <strong>Estadístiques</strong>
            <span className="nav-tile__arrow">→</span>
          </Link>
          <Link to="/voluntari/alertes" className="card card--clickable nav-tile">
            <span className="nav-tile__icon">🔔</span>
            <strong>Alertes</strong>
            <span className="nav-tile__arrow">→</span>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page dashboard-shell">
      <section className="dashboard-hero">
        <div className="dashboard-hero__copy">
          <span className="dashboard-eyebrow">Plataforma de gestió</span>
          <h1>Benvingut, {nomMostrat} 👋</h1>
          <p>
            Tria l'espai de treball. Gestió AVPC i Federació comparteixen informació,
            però mantenen eines i funcions diferenciades.
          </p>
        </div>
        <span className="badge badge--role">
          {usuari?.rol === 'FEDERACIO' ? 'Administrador Federació' : 'Associació'}
        </span>
      </section>

      <section className="dashboard-section" aria-labelledby="espais-titol">
        <div className="dashboard-section__heading">
          <div>
            <span className="dashboard-eyebrow">Accés principal</span>
            <h2 id="espais-titol">Espais de treball</h2>
          </div>
          <p>Dos entorns connectats, una sola plataforma.</p>
        </div>

        <div className="workspace-grid">
          <Link to="/gestio-avpc" className="workspace-card workspace-card--avpc">
            <div className="workspace-card__top">
              <span className="workspace-card__icon" aria-hidden="true">🛠</span>
              <span className="workspace-card__tag">Agrupació</span>
            </div>
            <div className="workspace-card__body">
              <h3>Gestió AVPC</h3>
              <p>Gestiona voluntariat, serveis, inventari, proveïdors i recursos de l'agrupació.</p>
            </div>
            <div className="workspace-card__action">
              <span>Entrar a Gestió AVPC</span>
              <span aria-hidden="true">→</span>
            </div>
          </Link>

          <Link to="/federacio" className="workspace-card workspace-card--federacio">
            <div className="workspace-card__top">
              <span className="workspace-card__icon" aria-hidden="true">🏛</span>
              <span className="workspace-card__tag">Coordinació</span>
            </div>
            <div className="workspace-card__body">
              <h3>Federació</h3>
              <p>Accedeix a la gestió global de les AVPC, documentació, recursos i coordinació federativa.</p>
            </div>
            <div className="workspace-card__action">
              <span>Entrar a Federació</span>
              <span aria-hidden="true">→</span>
            </div>
          </Link>
        </div>
      </section>

      <section className="dashboard-section" aria-labelledby="eines-titol">
        <div className="dashboard-section__heading dashboard-section__heading--compact">
          <div>
            <span className="dashboard-eyebrow">Compartit</span>
            <h2 id="eines-titol">Eines comunes</h2>
          </div>
        </div>

        <div className="shared-tools-grid">
          {EINES_COMPARTIDES.map((eina) => (
            <Link key={eina.to} to={eina.to} className="shared-tool-card">
              <span className="shared-tool-card__icon" aria-hidden="true">{eina.icon}</span>
              <span className="shared-tool-card__copy">
                <strong>{eina.label}</strong>
                <small>{eina.text}</small>
              </span>
              <span className="shared-tool-card__arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
