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

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setPestanya('vehicles')}
          style={pestanya === 'vehicles' ? { background: 'var(--gradient)', color: '#fff', border: 'none' } : {}}
        >
          Vehicles
        </button>
        <button
          onClick={() => setPestanya('material')}
          style={pestanya === 'material' ? { background: 'var(--gradient)', color: '#fff', border: 'none' } : {}}
        >
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
