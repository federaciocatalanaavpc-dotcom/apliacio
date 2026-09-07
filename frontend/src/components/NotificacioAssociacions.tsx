import { useState } from 'react';
import { enviarNotificacioAssociacions } from '../services/notificacioAssociacions';

const buit = { titol: '', missatge: '' };

export default function NotificacioAssociacions() {
  const [obert, setObert] = useState(false);
  const [form, setForm] = useState(buit);
  const [enviant, setEnviant] = useState(false);
  const [enviada, setEnviada] = useState<number | null>(null);
  const [error, setError] = useState('');

  function obrir() {
    setObert(true);
    setEnviada(null);
    setError('');
    setForm(buit);
  }

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setEnviada(null);
    setEnviant(true);
    try {
      const { notificats } = await enviarNotificacioAssociacions({ titol: form.titol.trim(), missatge: form.missatge.trim() });
      setEnviada(notificats);
      setForm(buit);
    } catch {
      setError("No s'ha pogut enviar la notificació");
    } finally {
      setEnviant(false);
    }
  }

  if (!obert) {
    return (
      <button onClick={obrir} className="card card--clickable" style={{ width: '100%', textAlign: 'left', border: 'none' }}>
        🔔 Notificar a totes les associacions
      </button>
    );
  }

  return (
    <form onSubmit={handleEnviar} className="card" style={{ maxWidth: 460 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <strong>🔔 Notificar a totes les associacions</strong>
        <button type="button" onClick={() => setObert(false)} style={{ fontSize: 12 }}>Tancar</button>
      </div>
      <p className="text-muted" style={{ fontSize: 12, margin: '0 0 10px' }}>
        Envia una notificació push a totes les associacions amb compte a l'app.
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
          rows={4}
          required
          style={{ width: '100%' }}
        />
      </div>

      {error && <p className="text-error" style={{ fontSize: 13 }}>{error}</p>}
      {enviada !== null && (
        <p style={{ color: 'var(--c-success)', fontSize: 13 }}>Notificació enviada a {enviada} associacions.</p>
      )}

      <button type="submit" disabled={enviant}>
        {enviant ? 'Enviant...' : 'Enviar a totes les associacions'}
      </button>
    </form>
  );
}
