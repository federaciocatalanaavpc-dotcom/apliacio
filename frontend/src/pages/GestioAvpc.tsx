import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import BotoTornar from '../components/BotoTornar';
import Voluntaris from './Voluntaris';
import Serveis from './Serveis';
import Estadistiques from './Estadistiques';
import { getUsuariActual } from '../services/api';

type Seccio = 'voluntaris' | 'serveis' | 'estadistiques';

const SECCIONS: { valor: Seccio; icona: string; etiqueta: string }[] = [
  { valor: 'voluntaris', icona: '👤', etiqueta: 'Voluntaris' },
  { valor: 'serveis', icona: '🚒', etiqueta: 'Serveis' },
  { valor: 'estadistiques', icona: '📊', etiqueta: 'Estadístiques' },
];

export default function GestioAvpc() {
  const usuariActual = getUsuariActual();
  const [seccio, setSeccio] = useState<Seccio | null>(null);

  if (usuariActual?.rol === 'VOLUNTARI') {
    return <Navigate to="/voluntari/serveis" replace />;
  }

  if (seccio === null) {
    return (
      <div className="page">
        <BotoTornar />
        <h1>Gestió AVPC</h1>
        <div className="nav-grid">
          {SECCIONS.map((s) => (
            <button
              key={s.valor}
              onClick={() => setSeccio(s.valor)}
              className="card card--clickable nav-tile"
              style={{ textAlign: 'left', width: '100%', border: 'none' }}
            >
              <span className="nav-tile__icon">{s.icona}</span>
              {s.etiqueta}
              <span className="nav-tile__arrow">→</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <button onClick={() => setSeccio(null)} style={{ fontSize: 13, marginBottom: 16 }}>
        ← Tornar a Gestió AVPC
      </button>
      <h1>{SECCIONS.find((s) => s.valor === seccio)?.etiqueta}</h1>

      {seccio === 'voluntaris' && <Voluntaris embedded />}
      {seccio === 'serveis' && <Serveis embedded />}
      {seccio === 'estadistiques' && <Estadistiques embedded />}
    </div>
  );
}
