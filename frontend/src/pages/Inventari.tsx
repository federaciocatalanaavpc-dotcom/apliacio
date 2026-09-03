import { useState } from 'react';
import BotoTornar from '../components/BotoTornar';
import Vehicles from './Vehicles';
import Material from './Material';

export default function Inventari() {
  const [pestanya, setPestanya] = useState<'vehicles' | 'material'>('vehicles');

  return (
    <div className="page">
      <BotoTornar />
      <h1>Inventari</h1>

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

      {pestanya === 'vehicles' ? <Vehicles embedded /> : <Material embedded />}
    </div>
  );
}
