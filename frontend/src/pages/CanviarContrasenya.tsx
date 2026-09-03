import { useState } from 'react';
import { canviarContrasenya } from '../services/api';
import BotoTornar from '../components/BotoTornar';

export default function CanviarContrasenya() {
  const [contrasenyaActual, setContrasenyaActual] = useState('');
  const [contrasenyaNova, setContrasenyaNova] = useState('');
  const [confirmacio, setConfirmacio] = useState('');
  const [error, setError] = useState('');
  const [fet, setFet] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setFet(false);
    if (contrasenyaNova !== confirmacio) {
      setError('La nova contrasenya i la confirmació no coincideixen');
      return;
    }
    try {
      await canviarContrasenya(contrasenyaActual, contrasenyaNova);
      setContrasenyaActual('');
      setContrasenyaNova('');
      setConfirmacio('');
      setFet(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No s\'ha pogut canviar la contrasenya');
    }
  }

  return (
    <div className="page">
      <BotoTornar />
      <h1>Canviar contrasenya</h1>

      {fet && <p className="text-success">Contrasenya actualitzada correctament.</p>}
      {error && <p className="text-error">{error}</p>}

      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 380 }}>
        <div style={{ marginBottom: 10 }}>
          <label>Contrasenya actual</label>
          <input
            type="password"
            value={contrasenyaActual}
            onChange={(e) => setContrasenyaActual(e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Contrasenya nova</label>
          <input
            type="password"
            value={contrasenyaNova}
            onChange={(e) => setContrasenyaNova(e.target.value)}
            required
            minLength={6}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label>Confirma la contrasenya nova</label>
          <input
            type="password"
            value={confirmacio}
            onChange={(e) => setConfirmacio(e.target.value)}
            required
            minLength={6}
            style={{ width: '100%' }}
          />
        </div>
        <button type="submit">Desar contrasenya</button>
      </form>
    </div>
  );
}
