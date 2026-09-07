import { useState } from 'react';
import { enviarAlertaFederacio } from '../services/alertaFederacio';

const buit = {
  titol: '',
  missatge: '',
  esEmergencia: false,
  tipusEmergencia: '',
  efectius: '',
  vehicles: '',
  durada: '',
};

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
      const detalls: string[] = [];
      if (form.esEmergencia && form.tipusEmergencia.trim()) detalls.push(`🆘 Tipus d'emergència: ${form.tipusEmergencia.trim()}`);
      if (form.esEmergencia && form.efectius.trim()) detalls.push(`👥 Efectius necessaris: ${form.efectius.trim()}`);
      if (form.esEmergencia && form.vehicles.trim()) detalls.push(`🚒 Vehicles necessaris: ${form.vehicles.trim()}`);
      if (form.esEmergencia && form.durada.trim()) detalls.push(`⏱️ Durada estimada: ${form.durada.trim()}`);
      const missatge = detalls.length > 0 ? `${form.missatge.trim()}\n\n${detalls.join('\n')}` : form.missatge.trim();
      await enviarAlertaFederacio({ titol: form.titol.trim(), missatge });
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
      <button
        onClick={obrir}
        className="btn-danger"
        style={{ width: '100%', fontSize: 15, fontWeight: 700, padding: '14px 16px' }}
      >
        📨 Alerta a Federació
      </button>
    );
  }

  return (
    <form onSubmit={handleEnviar} className="card" style={{ maxWidth: 460, borderColor: 'var(--c-error)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <strong style={{ color: 'var(--c-error)' }}>📨 Alerta a Federació</strong>
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

      <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <input
          type="checkbox"
          checked={form.esEmergencia}
          onChange={(e) => setForm({ ...form, esEmergencia: e.target.checked })}
          style={{ width: 'auto' }}
        />
        És una emergència (indicar efectius, vehicles i tipus necessaris)
      </label>

      {form.esEmergencia && (
        <div className="card" style={{ background: 'var(--c-surface-alt)', marginBottom: 10 }}>
          <div style={{ marginBottom: 10 }}>
            <label>Tipus d'emergència</label>
            <input
              value={form.tipusEmergencia}
              onChange={(e) => setForm({ ...form, tipusEmergencia: e.target.value })}
              placeholder="p.ex. Incendi forestal, accident, inundació..."
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Efectius necessaris</label>
              <input
                value={form.efectius}
                onChange={(e) => setForm({ ...form, efectius: e.target.value })}
                placeholder="p.ex. 6 voluntaris"
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label>Vehicles necessaris</label>
              <input
                value={form.vehicles}
                onChange={(e) => setForm({ ...form, vehicles: e.target.value })}
                placeholder="p.ex. 2 tot terreny"
                style={{ width: '100%' }}
              />
            </div>
          </div>
          <div>
            <label>Durada estimada</label>
            <input
              value={form.durada}
              onChange={(e) => setForm({ ...form, durada: e.target.value })}
              placeholder="p.ex. 3 hores"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )}

      {error && <p className="text-error" style={{ fontSize: 13 }}>{error}</p>}
      {enviada && <p style={{ color: 'var(--c-success)', fontSize: 13 }}>Alerta enviada a la federació.</p>}

      <button type="submit" className="btn-danger" disabled={enviant}>
        {enviant ? 'Enviant...' : 'Enviar a Federació'}
      </button>
    </form>
  );
}
