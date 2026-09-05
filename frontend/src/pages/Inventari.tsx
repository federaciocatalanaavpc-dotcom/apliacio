import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import BotoTornar from '../components/BotoTornar';
import Vehicles from './Vehicles';
import Material from './Material';

export default function Inventari() {
  const [pestanya, setPestanya] = useState<'vehicles' | 'material'>('vehicles');
  const [params] = useSearchParams();
  const agrupacioId = params.get('agrupacio') || undefined;
  const agrupacioNom = params.get('nom');

  return (
    <div className="page">
      <BotoTornar />
      <h1>Inventari</h1>

      {agrupacioId && (
        <p className="text-muted" style={{ fontSize: 13 }}>
          Mostrant només l'inventari de <strong>{agrupacioNom || 'aquesta associació'}</strong> ·{' '}
          <Link to="/inventari">Veure tot l'inventari</Link>
        </p>
      )}

      <div className="tabs">
        <button onClick={() => setPestanya('vehicles')} className={`tab ${pestanya === 'vehicles' ? 'tab--active' : ''}`}>
          Vehicles
        </button>
        <button onClick={() => setPestanya('material')} className={`tab ${pestanya === 'material' ? 'tab--active' : ''}`}>
          Material
        </button>
      </div>

      {pestanya === 'vehicles' ? (
        <Vehicles embedded filtreAgrupacioId={agrupacioId} />
      ) : (
        <Material embedded filtreAgrupacioId={agrupacioId} />
      )}
    </div>
  );
}
