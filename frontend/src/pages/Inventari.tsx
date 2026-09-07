import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import BotoTornar from '../components/BotoTornar';
import Vehicles from './Vehicles';
import Material from './Material';
import Equipament from './Equipament';

export default function Inventari({ embedded = false }: { embedded?: boolean } = {}) {
  const [pestanya, setPestanya] = useState<'vehicles' | 'material' | 'roba' | 'epi'>('vehicles');
  const [params] = useSearchParams();
  const agrupacioId = params.get('agrupacio') || undefined;
  const agrupacioNom = params.get('nom');

  return (
    <div className={embedded ? undefined : 'page'}>
      {!embedded && <BotoTornar />}
      {!embedded && <h1>Inventari</h1>}

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
        <button onClick={() => setPestanya('roba')} className={`tab ${pestanya === 'roba' ? 'tab--active' : ''}`}>
          Roba
        </button>
        <button onClick={() => setPestanya('epi')} className={`tab ${pestanya === 'epi' ? 'tab--active' : ''}`}>
          EPI
        </button>
      </div>

      {pestanya === 'vehicles' && <Vehicles embedded filtreAgrupacioId={agrupacioId} />}
      {pestanya === 'material' && <Material embedded filtreAgrupacioId={agrupacioId} />}
      {pestanya === 'roba' && <Equipament tipus="ROBA" titol="Roba" embedded filtreAgrupacioId={agrupacioId} />}
      {pestanya === 'epi' && <Equipament tipus="EPI" titol="EPI" embedded filtreAgrupacioId={agrupacioId} />}
    </div>
  );
}
