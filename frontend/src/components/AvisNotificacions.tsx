import { useCallback, useEffect, useState } from 'react';
import {
  activarNotificacions,
  enviarNotificacioProva,
  esIosSenseInstallar,
  estatNotificacions,
  sincronitzarNotificacions,
} from '../services/push';
import './AvisNotificacions.css';

type Estat = 'comprovant' | 'ok' | 'default' | 'denied' | 'no-suportat' | 'ios' | 'error';

const CLAU_MODAL = 'avpc-avis-notis-vist';

// Avís que es mostra a cada inici de sessió mentre el dispositiu no tingui
// les notificacions push realment operatives: un modal (un cop per sessió) i
// una franja fixa que no es pot tancar fins que s'activin. Si el permís ja
// hi és, refà la subscripció en silenci a cada sessió.
export default function AvisNotificacions() {
  const [estat, setEstat] = useState<Estat>('comprovant');
  const [modalObert, setModalObert] = useState(false);
  const [treballant, setTreballant] = useState(false);

  const comprovar = useCallback(async () => {
    const permis = await estatNotificacions();
    if (permis === 'no-suportat') return setEstat(esIosSenseInstallar() ? 'ios' : 'no-suportat');
    if (esIosSenseInstallar()) return setEstat('ios');
    if (permis === 'denied') return setEstat('denied');
    if (permis === 'default') return setEstat('default');
    setEstat((await sincronitzarNotificacions()) ? 'ok' : 'error');
  }, []);

  useEffect(() => {
    comprovar();
    const alTornar = () => {
      if (document.visibilityState === 'visible') comprovar();
    };
    document.addEventListener('visibilitychange', alTornar);
    return () => document.removeEventListener('visibilitychange', alTornar);
  }, [comprovar]);

  useEffect(() => {
    if (estat === 'comprovant' || estat === 'ok') return;
    if (!sessionStorage.getItem(CLAU_MODAL)) {
      sessionStorage.setItem(CLAU_MODAL, '1');
      setModalObert(true);
    }
  }, [estat]);

  async function activar() {
    setTreballant(true);
    const ok = await activarNotificacions();
    await comprovar();
    setTreballant(false);
    if (ok) {
      setModalObert(false);
      enviarNotificacioProva().catch(() => {});
    }
  }

  if (estat === 'comprovant' || estat === 'ok') return null;

  const missatges: Record<Exclude<Estat, 'comprovant' | 'ok'>, { titol: string; text: string; accio?: string }> = {
    default: {
      titol: 'Activa les notificacions',
      text: 'Sense notificacions no rebràs els avisos i alertes d\'emergència. Toca el botó i accepta el permís del navegador.',
      accio: 'Activar notificacions',
    },
    error: {
      titol: 'Les notificacions no estan registrades en aquest dispositiu',
      text: 'El permís hi és però no s\'ha pogut deixar la subscripció activa. Torna-ho a provar.',
      accio: 'Tornar-ho a provar',
    },
    denied: {
      titol: 'Notificacions bloquejades pel navegador',
      text: 'Has denegat el permís. Cal desbloquejar-lo manualment: toca el cadenat (o els ajustos del lloc) al costat de l\'adreça, permet les Notificacions i torna a obrir l\'app.',
    },
    ios: {
      titol: 'Instal·la l\'app per rebre notificacions',
      text: 'A iPhone/iPad les notificacions només funcionen amb l\'app instal·lada: a Safari toca Compartir (⬆️) → "Afegeix a la pantalla d\'inici", obre l\'app des de la nova icona i torna a iniciar sessió.',
    },
    'no-suportat': {
      titol: 'Aquest navegador no admet notificacions',
      text: 'Utilitza Chrome, Edge, Firefox o Safari (iOS amb l\'app instal·lada) per rebre els avisos i alertes.',
    },
  };
  const m = missatges[estat];

  return (
    <>
      <div className="avis-notis" role="alert">
        <span className="avis-notis__icona" aria-hidden="true">🔕</span>
        <div className="avis-notis__text">
          <strong>{m.titol}</strong>
          <span>{m.text}</span>
        </div>
        {m.accio && (
          <button className="avis-notis__boto" onClick={activar} disabled={treballant}>
            {treballant ? 'Activant...' : m.accio}
          </button>
        )}
      </div>

      {modalObert && (
        <div className="avis-notis-modal" role="dialog" aria-modal="true" aria-labelledby="avis-notis-titol">
          <div className="avis-notis-modal__caixa">
            <div className="avis-notis-modal__icona" aria-hidden="true">🔔</div>
            <h2 id="avis-notis-titol">{m.titol}</h2>
            <p>{m.text}</p>
            <div className="avis-notis-modal__accions">
              {m.accio && (
                <button className="avis-notis__boto" onClick={activar} disabled={treballant}>
                  {treballant ? 'Activant...' : m.accio}
                </button>
              )}
              <button className="avis-notis-modal__secundari" onClick={() => setModalObert(false)}>
                Ara no
              </button>
            </div>
            <small>Aquest avís tornarà a sortir cada cop que iniciïs sessió mentre no estiguin activades.</small>
          </div>
        </div>
      )}
    </>
  );
}
