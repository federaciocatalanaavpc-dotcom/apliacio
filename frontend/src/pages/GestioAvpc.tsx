import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import '../workspace.css';
import Voluntaris from './Voluntaris';
import Serveis from './Serveis';
import Estadistiques from './Estadistiques';
import Proveidors from './Proveidors';
import Inventari from './Inventari';
import AlertaRapida from '../components/AlertaRapida';
import { getUsuariActual } from '../services/api';

type Seccio = 'alertaRapida' | 'voluntaris' | 'serveis' | 'estadistiques' | 'proveidors' | 'inventari';

const SECCIONS: { valor: Seccio; icona: string; etiqueta: string; descripcio: string }[] = [
  { valor: 'alertaRapida', icona: '🚨', etiqueta: 'Alerta ràpida', descripcio: 'Activa una comunicació urgent per als voluntaris.' },
  { valor: 'voluntaris', icona: '👥', etiqueta: 'Voluntariat', descripcio: 'Gestió de membres, dades i disponibilitat.' },
  { valor: 'serveis', icona: '🚒', etiqueta: 'Serveis', descripcio: 'Planifica i consulta serveis i dispositius.' },
  { valor: 'estadistiques', icona: '📊', etiqueta: 'Estadístiques', descripcio: 'Consulta activitat, hores i participació.' },
  { valor: 'proveidors', icona: '🤝', etiqueta: 'Proveïdors', descripcio: 'Contactes i recursos externs de l’agrupació.' },
  { valor: 'inventari', icona: '📦', etiqueta: 'Inventari', descripcio: 'Material, equipament i recursos disponibles.' },
];

export default function GestioAvpc() {
  const usuariActual = getUsuariActual();
  const [seccio, setSeccio] = useState<Seccio | null>(null);

  if (usuariActual?.rol === 'VOLUNTARI') {
    return <Navigate to="/voluntari/serveis" replace />;
  }

  const nomAgrupacio = usuariActual?.agrupacioNom || usuariActual?.nom || 'La teva AVPC';
  const seccioActual = SECCIONS.find((s) => s.valor === seccio);

  if (seccio !== null) {
    return (
      <main className="page workspace-page workspace-page--avpc">
        <div className="workspace-subnav">
          <button onClick={() => setSeccio(null)} className="workspace-back-button">← Gestió AVPC</button>
          {usuariActual?.rol !== 'ADMIN_AVPC' && (<Link to="/federacio" className="workspace-switch-link">Canviar a Federació →</Link>)}
        </div>

        <section className="workspace-inner-hero workspace-inner-hero--avpc">
          <span className="workspace-inner-hero__icon" aria-hidden="true">{seccioActual?.icona}</span>
          <div>
            <span className="dashboard-eyebrow">Gestió AVPC</span>
            <h1>{seccioActual?.etiqueta}</h1>
            <p>{seccioActual?.descripcio}</p>
          </div>
        </section>

        <section className="workspace-content-card">
          {seccio === 'alertaRapida' && <AlertaRapida incrustat />}
          {seccio === 'voluntaris' && <Voluntaris embedded />}
          {seccio === 'serveis' && <Serveis embedded />}
          {seccio === 'estadistiques' && <Estadistiques embedded />}
          {seccio === 'proveidors' && <Proveidors embedded />}
          {seccio === 'inventari' && <Inventari embedded />}
        </section>
      </main>
    );
  }

  return (
    <main className="page workspace-page workspace-page--avpc">
      <div className="workspace-subnav">
        <Link to="/" className="workspace-back-link">← Inici</Link>
        {usuariActual?.rol !== 'ADMIN_AVPC' && (<Link to="/federacio" className="workspace-switch-link">Canviar a Federació →</Link>)}
      </div>

      <section className="workspace-home-hero workspace-home-hero--avpc">
        <div>
          <span className="workspace-home-hero__kicker">Espai de l’agrupació</span>
          <h1>Gestió AVPC</h1>
          <p>{nomAgrupacio}</p>
        </div>
        <div className="workspace-home-hero__badge">AVPC</div>
      </section>

      <section className="workspace-intro-row">
        <div>
          <span className="dashboard-eyebrow dashboard-eyebrow--orange">Gestió operativa</span>
          <h2>Què vols gestionar?</h2>
        </div>
        <p>Tot el dia a dia de l’agrupació, organitzat en un únic espai.</p>
      </section>

      <div className="module-grid">
        {SECCIONS.map((s) => (
          <button key={s.valor} onClick={() => setSeccio(s.valor)} className="module-card module-card--avpc">
            <span className="module-card__icon" aria-hidden="true">{s.icona}</span>
            <span className="module-card__copy">
              <strong>{s.etiqueta}</strong>
              <small>{s.descripcio}</small>
            </span>
            <span className="module-card__arrow" aria-hidden="true">→</span>
          </button>
        ))}
      </div>

      <section className="workspace-tip workspace-tip--avpc">
        <div>
          <strong>Dades connectades amb la Federació</strong>
          <p>La informació compartida es manté vinculada entre els dos espais segons els permisos de cada usuari.</p>
        </div>
        {usuariActual?.rol !== 'ADMIN_AVPC' && (<Link to="/federacio">Anar a Federació →</Link>)}
      </section>
    </main>
  );
}
