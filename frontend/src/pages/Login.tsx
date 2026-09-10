import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, login, desarSessio, RespostaAcces } from '../services/api';

export default function Login() {
  const [nomUsuari, setNomUsuari] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [invitation] = useState(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get('invitacio');
    if (token) window.history.replaceState(null, '', window.location.pathname);
    return token;
  });
  const [step, setStep] = useState<'login' | 'invite' | 'password'>(invitation ? 'invite' : 'login');
  const [challenge, setChallenge] = useState('');
  const navigate = useNavigate();

  function receive(data: RespostaAcces) {
    setPassword('');
    setConfirm('');
    if (data.token) {
      desarSessio(data);
      navigate('/');
      return;
    }
    if (data.pas !== 'password' || !data.repte) throw new Error('Torna a iniciar sessió. Si la pàgina és antiga, recarrega-la.');
    setChallenge(data.repte);
    setStep('password');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (step === 'login') {
        receive(await login(nomUsuari.trim().toLowerCase(), password));
      } else {
        if (password !== confirm) throw new Error('Les contrasenyes no coincideixen');
        const { data } = await api.post(
          step === 'invite' ? '/auth/invitacio' : '/auth/completar-contrasenya',
          step === 'invite' ? { token: invitation, contrasenya: password } : { repte: challenge, contrasenya: password },
        );
        receive(data);
      }
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'No s’ha pogut completar l’accés');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20 }}>
      <section className="card" style={{ maxWidth: 440, width: '100%', padding: 28 }}>
        <div style={{ textAlign: 'center' }}><img src="/logo.png" alt="App Federació" width={160} height={160} /></div>
        <form onSubmit={submit}>
          {step === 'login' ? <>
            <label htmlFor="login-name">Nom d’usuari</label>
            <input id="login-name" autoComplete="username" required value={nomUsuari} onChange={e => setNomUsuari(e.target.value)} style={{ width: '100%' }} />
          </> : <>
            <h1 style={{ fontSize: 22 }}>Crea la teva contrasenya</h1>
            <p>Fes servir almenys 12 caràcters. Tria una frase pròpia que no utilitzis en altres webs.</p>
          </>}
          <label htmlFor="login-password">{step === 'login' ? 'Contrasenya' : 'Nova contrasenya'}</label>
          <input id="login-password" type="password" autoComplete={step === 'login' ? 'current-password' : 'new-password'} required minLength={step === 'login' ? undefined : 12} value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%' }} />
          {step !== 'login' && <>
            <label htmlFor="confirm-password">Repeteix la contrasenya</label>
            <input id="confirm-password" type="password" autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} style={{ width: '100%' }} />
          </>}
          {error && <p className="text-error" role="alert">{error}</p>}
          <button disabled={busy} type="submit" style={{ width: '100%', marginTop: 16 }}>{busy ? 'Comprovant…' : step === 'login' ? 'Entrar' : 'Continuar'}</button>
          {step === 'login' ? <p className="text-muted" style={{ fontSize: 13 }}>Si has oblidat la contrasenya, demana al teu administrador un enllaç de recuperació. La Federació gestiona els comptes de les associacions.</p> : <button type="button" onClick={() => window.location.replace('/login')} style={{ marginTop: 12 }}>Tornar a l’inici de sessió</button>}
        </form>
      </section>
    </main>
  );
}
