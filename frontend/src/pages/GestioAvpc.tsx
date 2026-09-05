import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import BotoTornar from '../components/BotoTornar';
import Voluntaris from './Voluntaris';
import Serveis from './Serveis';
import Estadistiques from './Estadistiques';
import { getUsuariActual } from '../services/api';

export default function GestioAvpc() {
  const usuariActual = getUsuariActual();
  const [pestanya, setPestanya] = useState<'voluntaris' | 'serveis' | 'estadistiques'>('voluntaris');

  if (usuariActual?.rol === 'VOLUNTARI') {
    return <Navigate to="/voluntari/serveis" replace />;
  }

  return (
    <div className="page">
      <BotoTornar />
      <h1>Gestió AVPC</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setPestanya('voluntaris')}
          style={pestanya === 'voluntaris' ? { background: 'var(--gradient)', color: '#fff', border: 'none' } : {}}
        >
          Voluntaris
        </button>
        <button
          onClick={() => setPestanya('serveis')}
          style={pestanya === 'serveis' ? { background: 'var(--gradient)', color: '#fff', border: 'none' } : {}}
        >
          Serveis
        </button>
        <button
          onClick={() => setPestanya('estadistiques')}
          style={pestanya === 'estadistiques' ? { background: 'var(--gradient)', color: '#fff', border: 'none' } : {}}
        >
          Estadístiques
        </button>
      </div>

      {pestanya === 'voluntaris' && <Voluntaris embedded />}
      {pestanya === 'serveis' && <Serveis embedded />}
      {pestanya === 'estadistiques' && <Estadistiques embedded />}
    </div>
  );
}
