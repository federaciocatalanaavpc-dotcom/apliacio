import {useEffect,useState} from 'react';
import {api,getUsuariActual} from '../services/api';
export default function IdentitatAvpc({editable=false}:{editable?:boolean}){
 const u=getUsuariActual(),[url,setUrl]=useState(''),[versio,setVersio]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let active=true,object='';if(u?.agrupacioId)api.get('/auth/associacio/logo',{responseType:'blob'}).then(r=>{if(active){object=URL.createObjectURL(r.data);setUrl(object);}}).catch(()=>{if(active)setUrl('');});return()=>{active=false;if(object)URL.revokeObjectURL(object);};},[u?.agrupacioId,versio]);
 if(!u?.agrupacioId)return null;
 async function pujar(file:File){setBusy(true);setError('');let source='';try{
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10*1024*1024)throw Error('Tria un PNG, JPG o WebP de fins a 10 MB');
  source=URL.createObjectURL(file);const img=new Image();img.src=source;await img.decode();if(!img.naturalWidth||img.naturalWidth*img.naturalHeight>40000000)throw Error('La imatge és massa gran');
  const factor=Math.min(1,512/img.naturalWidth,512/img.naturalHeight),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*factor));canvas.height=Math.max(1,Math.round(img.naturalHeight*factor));canvas.getContext('2d')!.drawImage(img,0,0,canvas.width,canvas.height);
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('No es pot preparar la imatge')),'image/png'));const form=new FormData();form.append('logo',blob,'logo.png');await api.put('/auth/associacio/logo',form);setVersio(v=>v+1);
 }catch(e:any){setError(e.response?.data?.error||e.message||'No s’ha pogut desar el logotip');}finally{if(source)URL.revokeObjectURL(source);setBusy(false);}}
 return <section aria-label="La teva AVPC" style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap',margin:'16px 0'}}>
 {url?<img src={url} alt={'Logotip de '+u.agrupacioNom} width={80} height={80} style={{objectFit:'contain',borderRadius:12,background:'#fff',padding:6}}/>:<span aria-hidden="true" style={{fontSize:36}}>🏛️</span>}
 <div><small>La teva associació</small><strong style={{display:'block',fontSize:18}}>{u.agrupacioNom||'AVPC'}</strong>
 {editable&&['AGRUPACIO','ADMIN_AVPC','FEDERACIO'].includes(u.rol)&&<div><label style={{fontSize:13}}>Canviar logotip<input disabled={busy} type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{const f=e.target.files?.[0];if(f)pujar(f);e.target.value='';}}/></label>{url&&<button disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await api.delete('/auth/associacio/logo');setVersio(v=>v+1);}catch{setError('No s’ha pogut retirar el logotip');}finally{setBusy(false);}}}>Retirar logotip</button>}{busy&&<p>Desant…</p>}</div>}
 {error&&<p role="alert" className="text-error">{error}</p>}</div></section>;
}
