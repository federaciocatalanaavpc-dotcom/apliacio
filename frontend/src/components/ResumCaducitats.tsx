import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { resumCaducitats } from '../services/caducitats';

// Avís a la pantalla d'inici quan hi ha caducitats d'inventari vençudes o
// properes (només es mostra si n'hi ha).
export default function ResumCaducitats() {
  const [resum, setResum] = useState<{ caducades: number; properes: number } | null>(null);

  useEffect(() => {
    resumCaducitats().then(setResum).catch(() => {});
  }, []);

  if (!resum || resum.caducades + resum.properes === 0) return null;

  return (
    <Link
      to="/inventari?pestanya=caducitats"
      className="card card--clickable"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        borderLeft: `5px solid ${resum.caducades ? 'var(--c-error)' : 'var(--c-warning)'}`,
      }}
    >
      <span style={{ fontSize: 26 }} aria-hidden="true">{resum.caducades ? '⛔' : '⚠️'}</span>
      <span style={{ flex: 1 }}>
        <strong>Caducitats d'inventari</strong>
        <br />
        <small className="text-muted">
          {resum.caducades > 0 && `${resum.caducades} caducada(es)`}
          {resum.caducades > 0 && resum.properes > 0 && ' · '}
          {resum.properes > 0 && `${resum.properes} caduquen en menys de 30 dies`}
        </small>
      </span>
      <span aria-hidden="true">→</span>
    </Link>
  );
}
