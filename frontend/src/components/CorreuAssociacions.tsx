import { useState } from 'react';
import { enviarCorreuAssociacions } from '../services/correuAssociacions';

const buit = { titol: '', missatge: '' };

export default function CorreuAssociacions() {
  const [obert, setObert] = useState(false);
  const [form, setForm] = useState(buit);
  const [enviant, setEnviant] = useState(false);
  const [resultat, setResultat] = useState<{ total: number; enviats: number } | null>(null);
  const [error, setError] = useState('');

  function obrir() {
    setObert(true);
    setResultat(null);
    setError('');
    setForm(buit);
  }

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResultat(null);
    setEnviant(true);
    try {
      const { total, enviats } = await enviarCorreuAssociacions({ titol: form.titol.trim(), missatge: form.missatge.trim() });
      setResultat({ total, enviats });
      setForm(buit);
    } catch (err: any) {
      setError(err?.response?.data?.error || "No s'ha pogut enviar el correu");
    } finally {
      setEnviant(false);
    }
  }

  if (!obert) {
    return (
      <button onClick={obrir} className="card card--clickable" style={{ width: '100%', textAlign: 'left', border: 'none' }}>
        📧 Correu a totes les associacions
      </button>
    );
  }

  return (
    <form onSubmit={handleEnviar} className="card" style={{ maxWidth: 460 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <strong>📧 Correu a totes les associacions</strong>
        <button type="button" onClick={() => setObert(false)} style={{ fontSize: 12 }}>Tancar</button>
      </div>
      <p className="text-muted" style={{ fontSize: 12, margin: '0 0 10px' }}>
        Envia un correu a totes les associacions que tinguin una adreça de correu registrada a la seva fitxa.
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
      {resultat && (
        <p style={{ color: 'var(--c-success)', fontSize: 13 }}>
          Enviat a {resultat.enviats} de {resultat.total} associacions amb correu registrat.
        </p>
      )}

      <button type="submit" disabled={enviant}>
        {enviant ? 'Enviant...' : 'Enviar a totes les associacions'}
      </button>
    </form>
  );
}
