import { useState } from 'react';
import { enviarAlertaFederacio } from '../services/alertaFederacio';

const buit = { titol: '', missatge: '' };

export default function AlertaAFederacio() {
  const [obert, setObert] = useState(false);
  const [form, setForm] = useState(buit);
  const [enviant, setEnviant] = useState(false);
  const [enviada, setEnviada] = useState(false);
  const [error, setError] = useState('');

  function obrir() {
    setObert(true);
    setEnviada(false);
    setError('');
    setForm(buit);
  }

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setEnviada(false);
    setEnviant(true);
    try {
      await enviarAlertaFederacio({ titol: form.titol.trim(), missatge: form.missatge.trim() });
      setEnviada(true);
      setForm(buit);
    } catch {
      setError("No s'ha pogut enviar l'alerta");
    } finally {
      setEnviant(false);
    }
  }

  if (!obert) {
    return (
      <button onClick={obrir} className="card card--clickable" style={{ width: '100%', textAlign: 'left', border: 'none' }}>
        📨 Alerta a Federació
      </button>
    );
  }

  return (
    <form onSubmit={handleEnviar} className="card" style={{ maxWidth: 460 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <strong>📨 Alerta a Federació</strong>
        <button type="button" onClick={() => setObert(false)} style={{ fontSize: 12 }}>Tancar</button>
      </div>
      <p className="text-muted" style={{ fontSize: 12, margin: '0 0 10px' }}>
        Envia una notificació només a la federació, per a alguna cosa urgent que calgui escalar-hi.
      </p>

      <div style={{ marginBottom: 10 }}>
        <label>Títol</label>
        <input value={form.titol} onChange={(e) => setForm({ ...form, titol: e.target.value })} required style={{ width: '100%' }} />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label>Missatge</label>
        <textarea
          value={form.missatge}
          onChange={(e) => setForm({ ...form, missatge: e.target.value })}
          rows={3}
          required
          style={{ width: '100%' }}
        />
      </div>

      {error && <p className="text-error" style={{ fontSize: 13 }}>{error}</p>}
      {enviada && <p style={{ color: 'var(--c-success)', fontSize: 13 }}>Alerta enviada a la federació.</p>}

      <button type="submit" disabled={enviant}>
        {enviant ? 'Enviant...' : 'Enviar a Federació'}
      </button>
    </form>
  );
}
