import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, login, desarSessio, RespostaAcces } from '../services/api';

export default function Login() {
 const [nomUsuari,setNomUsuari]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState('');
 const [code,setCode]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [invitation]=useState(()=>{const t=new URLSearchParams(window.location.hash.slice(1)).get('invitacio');if(t)window.history.replaceState(null,'',window.location.pathname);return t;});
 const [step,setStep]=useState<'login'|'invite'|'password'|'enrol'|'mfa'|'recovery'>(invitation?'invite':'login');
 const [challenge,setChallenge]=useState(''),[secret,setSecret]=useState(''),[codes,setCodes]=useState<string[]>([]);
 const [pending,setPending]=useState<RespostaAcces|null>(null);
 const navigate=useNavigate();
 async function receive(data:RespostaAcces){
  setPassword('');setConfirm('');setCode('');
  if(data.recovery){setCodes(data.recovery);setPending(data);setStep('recovery');return;}
  if(data.token){desarSessio(data);navigate('/');return;}
  if(!data.pas||!data.repte)throw new Error('Resposta d’accés no vàlida');
  setChallenge(data.repte);setStep(data.pas);
  if(data.pas==='enrol'){
   const r=await api.post('/auth/mfa/iniciar',{repte:data.repte});setSecret(r.data.secret);
  }
 }
 async function submit(e:React.FormEvent){
  e.preventDefault();setError('');setBusy(true);
  try{
   if(step==='login')await receive(await login(nomUsuari.trim().toLowerCase(),password));
   else if(step==='password'||step==='invite'){
    if(password!==confirm)throw new Error('Les contrasenyes no coincideixen');
    const r=await api.post(step==='invite'?'/auth/invitacio':'/auth/completar-contrasenya',step==='invite'?{token:invitation,contrasenya:password}:{repte:challenge,contrasenya:password});await receive(r.data);
   }else if(step==='enrol'||step==='mfa'){
    const r=await api.post(step==='enrol'?'/auth/mfa/activar':'/auth/mfa/verificar',{repte:challenge,codi:code.trim()});await receive(r.data);
   }
  }catch(e:any){setError(e.response?.data?.error||e.message||'No s’ha pogut completar l’accés');}finally{setBusy(false);}
 }
 return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:20}}>
  <section className="card" style={{maxWidth:440,width:'100%',padding:28}}>
   <div style={{textAlign:'center'}}><img src="/logo.png" alt="App Federació" width={160} height={160}/></div>
   {step==='recovery'?<>
    <h1 style={{fontSize:22}}>Guarda els codis de recuperació</h1>
    <p>Et permeten entrar si perds l’autenticador. Cada codi funciona una sola vegada. Desa’ls en un gestor de contrasenyes; només es mostren ara.</p>
    <textarea aria-label="Codis de recuperació" readOnly rows={8} value={codes.join('\n')} style={{width:'100%'}}/>
    <button onClick={()=>{if(pending){desarSessio(pending);setCodes([]);setPending(null);navigate('/');}}}>He guardat els codis. Entrar</button>
   </>:<form onSubmit={submit}>
    {step==='login'&&<><label htmlFor="login-name">Nom d’usuari</label><input id="login-name" autoComplete="username" required value={nomUsuari} onChange={e=>setNomUsuari(e.target.value)} style={{width:'100%'}}/></>}
    {(step==='password'||step==='invite')&&<><h1 style={{fontSize:22}}>Crea la teva contrasenya</h1><p>Fes servir almenys 12 caràcters. Tria una frase pròpia que no utilitzis en altres webs.</p></>}
    {['login','invite','password'].includes(step)&&<>
     <label htmlFor="login-password">{step==='login'?'Contrasenya':'Nova contrasenya'}</label>
     <input id="login-password" type="password" autoComplete={step==='login'?'current-password':'new-password'} required minLength={step==='login'?undefined:12} value={password} onChange={e=>setPassword(e.target.value)} style={{width:'100%'}}/>
     {step!=='login'&&<><label htmlFor="confirm-password">Repeteix la contrasenya</label><input id="confirm-password" type="password" autoComplete="new-password" required value={confirm} onChange={e=>setConfirm(e.target.value)} style={{width:'100%'}}/></>}
    </>}
    {step==='enrol'&&<>
     <h1 style={{fontSize:22}}>Protegeix el teu compte</h1>
     <p>Com a administrador, necessites un segon factor. Afegeix un compte a la teva aplicació autenticadora mitjançant «Introduir clau de configuració», amb codis basats en el temps.</p>
     <label htmlFor="mfa-secret">Clau de configuració (privada)</label><input id="mfa-secret" value={secret} readOnly style={{width:'100%',fontFamily:'monospace'}}/>
    </>}
    {(step==='enrol'||step==='mfa')&&<>
     {step==='mfa'&&<><h1 style={{fontSize:22}}>Verificació en dos passos</h1><p>Introdueix el codi de l’autenticador o un dels codis de recuperació que vas guardar.</p></>}
     <label htmlFor="mfa-code">Codi de verificació</label><input id="mfa-code" autoComplete="one-time-code" required value={code} onChange={e=>setCode(e.target.value)} style={{width:'100%'}}/>
    </>}
    {error&&<p className="text-error" role="alert">{error}</p>}
    <button disabled={busy||(step==='enrol'&&!secret)} type="submit" style={{width:'100%',marginTop:16}}>{busy?'Comprovant…':step==='login'?'Entrar':'Continuar'}</button>
    {step==='login'?<p className="text-muted" style={{fontSize:13}}>Si has oblidat la contrasenya, demana al teu administrador un enllaç de recuperació. La Federació gestiona els comptes de les associacions.</p>:<button type="button" onClick={()=>window.location.replace('/login')} style={{marginTop:12}}>Tornar a l’inici de sessió</button>}
   </form>}
  </section>
 </main>;
}
