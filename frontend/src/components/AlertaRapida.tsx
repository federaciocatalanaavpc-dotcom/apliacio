import { useEffect, useState } from 'react';
import { crearAvis } from '../services/avisos';
import { Agrupacio, llistarAgrupacions } from '../services/agrupacions';
import { getUsuariActual } from '../services/api';

const buit = {
  titol: '🚨 Alerta d\'emergència',
  missatge: '',
  horaInici: '',
  esEmergencia: false,
  tipusEmergencia: '',
  efectius: '',
  vehicles: '',
  durada: '',
};

export default function AlertaRapida({ incrustat = false }: { incrustat?: boolean } = {}) {
  const usuariActual = getUsuariActual();
  const esFederacio = usuariActual?.rol === 'FEDERACIO';
  const [obert, setObert] = useState(incrustat);
  const [agrupacions, setAgrupacions] = useState<Agrupacio[]>([]);
  const [agrupacioSeleccionada, setAgrupacioSeleccionada] = useState('');
  const [form, setForm] = useState(buit);
  const [enviant, setEnviant] = useState(false);
  const [enviada, setEnviada] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (obert && esFederacio) {
      llistarAgrupacions().then(setAgrupacions).catch(() => {});
    }
  }, [obert, esFederacio]);

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
    if (esFederacio && !agrupacioSeleccionada) {
      setError('Selecciona primer una associació');
      return;
    }
    setEnviant(true);
    try {
      const detalls: string[] = [];
      if (form.esEmergencia && form.tipusEmergencia.trim()) detalls.push(`🆘 Tipus d'emergència: ${form.tipusEmergencia.trim()}`);
      if (form.esEmergencia && form.efectius.trim()) detalls.push(`👥 Efectius necessaris: ${form.efectius.trim()}`);
      if (form.esEmergencia && form.vehicles.trim()) detalls.push(`🚒 Vehicles necessaris: ${form.vehicles.trim()}`);
      if (form.esEmergencia && form.durada.trim()) detalls.push(`⏱️ Durada estimada: ${form.durada.trim()}`);
      if (form.horaInici) detalls.push(`🕐 Hora d'inici del servei: ${form.horaInici}`);
      const cos = detalls.length > 0 ? `${form.missatge.trim()}\n\n${detalls.join('\n')}` : form.missatge.trim();
      await crearAvis({
        titol: form.titol.trim() || buit.titol,
        cos,
        agrupacioId: esFederacio ? agrupacioSeleccionada : undefined,
      });
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
      <button onClick={obrir} className="btn-danger" style={{ width: '100%', fontSize: 15, fontWeight: 700, padding: '14px 16px', marginTop: 16 }}>
        🚨 Alerta ràpida
      </button>
    );
  }

  return (
    <form onSubmit={handleEnviar} className="card" style={incrustat ? { borderColor: 'var(--c-error)', maxWidth: 460 } : { marginTop: 16, borderColor: 'var(--c-error)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <strong style={{ color: 'var(--c-error)' }}>🚨 Alerta ràpida</strong>
        {!incrustat && (
          <button type="button" onClick={() => setObert(false)} style={{ fontSize: 12 }}>Tancar</button>
        )}
      </div>
      <p className="text-muted" style={{ fontSize: 12, margin: '0 0 10px' }}>
        Envia una notificació d'emergència als voluntaris de {esFederacio ? "l'associació seleccionada" : 'la teva associació'}.
      </p>

      {esFederacio && (
        <div style={{ marginBottom: 10 }}>
          <label>Associació</label>
          <select value={agrupacioSeleccionada} onChange={(e) => setAgrupacioSeleccionada(e.target.value)} required style={{ width: '100%' }}>
            <option value="">Selecciona una associació...</option>
            {agrupacions.map((a) => (
              <option key={a.id} value={a.id}>{a.nom}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ marginBottom: 10 }}>
        <label>Títol</label>
        <input value={form.titol} onChange={(e) => setForm({ ...form, titol: e.target.value })} required style={{ width: '100%' }} />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label>Text breu</label>
        <textarea
          value={form.missatge}
          onChange={(e) => setForm({ ...form, missatge: e.target.value })}
          placeholder="Descriu breument l'emergència..."
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

      <div style={{ marginBottom: 10 }}>
        <label>Hora d'inici del servei (opcional)</label>
        <input
          type="time"
          value={form.horaInici}
          onChange={(e) => setForm({ ...form, horaInici: e.target.value })}
          style={{ width: '100%' }}
        />
      </div>

      {error && <p className="text-error" style={{ fontSize: 13 }}>{error}</p>}
      {enviada && <p style={{ color: 'var(--c-success)', fontSize: 13 }}>Alerta enviada.</p>}

      <button type="submit" className="btn-danger" disabled={enviant}>
        {enviant ? 'Enviant...' : 'Enviar alerta ara'}
      </button>
    </form>
  );
}
