import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { getUsuariActual } from '../services/api';
import { obtenirVoluntariPropi } from '../services/voluntaris';
import { DISPONIBILITAT_LABEL } from '../components/SelectorDisponibilitat';
import './volunteer-dashboard.css';

const EINES_COMPARTIDES = [
  { to: '/avisos', icon: '🔔', label: 'Avisos', text: 'Comunicacions i alertes' },
  { to: '/documents', icon: '📄', label: 'Documents', text: 'Documentació compartida' },
  { to: '/formacio', icon: '🎓', label: 'Formació', text: 'Cursos i recursos formatius' },
];

const ACCESSOS_VOLUNTARI = [
  { to: '/voluntari/serveis', icon: '🚒', label: 'Serveis', text: 'Consulta el calendari i confirma assistències', className: 'vol-home-card--primary' },
  { to: '/voluntari/disponibilitat', icon: '●', label: 'Disponibilitat', text: 'Actualitza el teu estat per a nous serveis', className: 'vol-home-card--availability' },
  { to: '/voluntari/roba', icon: '🦺', label: 'Roba i EPI', text: 'Consulta el material que tens assignat' },
  { to: '/voluntari/estadistiques', icon: '📊', label: 'Estadístiques', text: 'Revisa hores i activitat acumulada' },
  { to: '/voluntari/alertes', icon: '🔔', label: 'Alertes', text: 'Avisos operatius del teu espai' },
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
  }, [esVoluntari]);

  if (esVoluntari) {
    return (
      <main className="vol-home">
        <section className="vol-home-hero">
          <div className="vol-home-hero__copy">
            <span className="vol-home-kicker">El meu espai</span>
            <h1>Hola, {nomMostrat}</h1>
            <p>Tot el que necessites com a voluntari, en un únic lloc.</p>
          </div>
          <div className="vol-home-status">
            <span className="vol-home-status__label">Disponibilitat actual</span>
            <strong>{disponibilitat ? DISPONIBILITAT_LABEL[disponibilitat] : 'Consultant...'}</strong>
            <Link to="/voluntari/disponibilitat">Canviar estat →</Link>
          </div>
        </section>

        <section className="vol-home-section">
          <div className="vol-home-section__heading">
            <div>
              <span className="vol-home-kicker">Accés ràpid</span>
              <h2>Què vols fer?</h2>
            </div>
          </div>

          <div className="vol-home-grid">
            {ACCESSOS_VOLUNTARI.map((item) => (
              <Link key={item.to} to={item.to} className={`vol-home-card ${item.className || ''}`}>
                <span className="vol-home-card__icon" aria-hidden="true">{item.icon}</span>
                <span className="vol-home-card__copy">
                  <strong>{item.label}</strong>
                  <small>{item.text}</small>
                  {item.to === '/voluntari/disponibilitat' && disponibilitat && (
                    <span className="vol-home-card__state">Ara: {DISPONIBILITAT_LABEL[disponibilitat]}</span>
                  )}
                </span>
                <span className="vol-home-card__arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="vol-home-tip">
          <span aria-hidden="true">💡</span>
          <div>
            <strong>Mantén la disponibilitat al dia</strong>
            <p>Així la teva agrupació pot saber ràpidament amb qui comptar quan apareix un servei.</p>
          </div>
        </section>
      </main>
    );
  }

  if (usuari?.rol === 'ADMIN_AVPC') return <Navigate to="/gestio-avpc" replace />;

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
