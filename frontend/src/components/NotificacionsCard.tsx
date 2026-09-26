import { useEffect, useState } from 'react';
import { estatNotificacions, activarNotificacions, enviarNotificacioProva, esIosSenseInstallar, descriureProva } from '../services/push';

// Targeta reutilitzable per activar les notificacions push del dispositiu.
export default function NotificacionsCard() {
  const [permis, setPermis] = useState<string>('default');
  const [error, setError] = useState('');
  const [resultatProva, setResultatProva] = useState<{ ok: boolean; text: string } | null>(null);
  const [provant, setProvant] = useState(false);

  async function actualitzarEstatNotis() {
    setPermis(await estatNotificacions());
  }

  useEffect(() => {
    actualitzarEstatNotis();
  }, []);

  async function handleActivarNotis() {
    setError('');
    const ok = await activarNotificacions();
    await actualitzarEstatNotis();
    if (ok) {
      try {
        await enviarNotificacioProva();
      } catch {
        // si la notificació de prova falla, no cal bloquejar la resta
      }
    } else {
      setError('No s\'han pogut activar les notificacions en aquest navegador');
    }
  }

  async function handleProvar() {
    setProvant(true);
    setResultatProva(null);
    try {
      setResultatProva(descriureProva(await enviarNotificacioProva()));
    } catch {
      setResultatProva({ ok: false, text: "No s'ha pogut fer la prova. Comprova la connexió." });
    } finally {
      setProvant(false);
    }
  }

  return (
    <div className="card" style={{ marginBottom: 20, maxWidth: 420 }}>
      <p style={{ margin: '0 0 8px', fontWeight: 'bold' }}>
        Notificacions: {permis === 'granted' ? 'Activades' : permis === 'denied' ? 'Bloquejades pel navegador' : 'No activades'}
      </p>
      <p className="text-muted" style={{ fontSize: 13, margin: '0 0 10px' }}>
        Activa-les per rebre avisos de nous serveis al mòbil o ordinador encara que no tinguis la web oberta.
      </p>
      {error && <p className="text-error" style={{ fontSize: 13 }}>{error}</p>}
      {permis !== 'granted' && esIosSenseInstallar() ? (
        <p style={{ fontSize: 13, color: 'var(--c-warning)', margin: 0 }}>
          En un iPhone/iPad, per rebre notificacions primer cal afegir aquesta app a la pantalla d'inici:
          toca el botó de compartir de Safari (⬆️) i tria "Afegeix a la pantalla d'inici". Després obre l'app
          des d'aquesta icona (no des de Safari) i torna aquí per activar-les.
        </p>
      ) : (
        permis !== 'granted' && <button onClick={handleActivarNotis}>Activar notificacions</button>
      )}
      {permis === 'granted' && (
        <>
          <button onClick={handleProvar} disabled={provant}>{provant ? 'Enviant...' : 'Provar la recepció'}</button>
          {resultatProva && (
            <p style={{ fontSize: 13, margin: '10px 0 0', color: resultatProva.ok ? 'var(--c-success)' : 'var(--c-error)' }}>
              {resultatProva.text}
            </p>
          )}
        </>
      )}
    </div>
  );
}
