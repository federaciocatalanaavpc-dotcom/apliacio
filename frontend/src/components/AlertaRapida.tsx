import { useEffect, useState } from 'react';
import { crearAvis } from '../services/avisos';
import { Agrupacio, llistarAgrupacions } from '../services/agrupacions';
import { getUsuariActual } from '../services/api';

function araPerInput(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const buit = { titol: '🚨 Alerta d\'emergència', missatge: '', hora: '' };

export default function AlertaRapida() {
  const usuariActual = getUsuariActual();
  const esFederacio = usuariActual?.rol === 'FEDERACIO';
  const [obert, setObert] = useState(false);
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
      await crearAvis({
        titol: form.titol.trim() || buit.titol,
        cos: form.missatge.trim(),
        agrupacioId: esFederacio ? agrupacioSeleccionada : undefined,
        dataEnviament: form.hora ? new Date(form.hora).toISOString() : undefined,
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
    <form onSubmit={handleEnviar} className="card" style={{ marginTop: 16, borderColor: 'var(--c-error)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <strong style={{ color: 'var(--c-error)' }}>🚨 Alerta ràpida</strong>
        <button type="button" onClick={() => setObert(false)} style={{ fontSize: 12 }}>Tancar</button>
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
      <div style={{ marginBottom: 10 }}>
        <label>Hora d'enviament</label>
        <input
          type="datetime-local"
          value={form.hora}
          min={araPerInput()}
          onChange={(e) => setForm({ ...form, hora: e.target.value })}
          style={{ width: '100%' }}
        />
        <p className="text-muted" style={{ fontSize: 12, margin: '4px 0 0' }}>
          Deixa-ho en blanc per enviar-la immediatament.
        </p>
      </div>

      {error && <p className="text-error" style={{ fontSize: 13 }}>{error}</p>}
      {enviada && <p style={{ color: 'var(--c-success)', fontSize: 13 }}>Alerta enviada.</p>}

      <button type="submit" className="btn-danger" disabled={enviant}>
        {enviant ? 'Enviant...' : form.hora ? 'Programar alerta' : 'Enviar alerta ara'}
      </button>
    </form>
  );
}
