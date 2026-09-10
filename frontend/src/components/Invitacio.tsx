import { useState } from 'react';
export default function Invitacio({url,onClose}:{url:string;onClose:()=>void}) {
 const [copiat,setCopiat]=useState(false);
 return <section className="card" role="status" style={{marginBottom:16}}>
  <strong>Enllaç privat d’accés</strong><p>Caduca en 24 hores i només es pot fer servir una vegada. L’usuari crearà la seva contrasenya. Comparteix-lo només amb la persona destinatària, després de verificar-ne la identitat.</p>
  <input aria-label="Enllaç privat d’accés" readOnly value={url} style={{width:'100%'}}/>
  <button onClick={async()=>{try{await navigator.clipboard.writeText(url);setCopiat(true);}catch{setCopiat(false);}}}>{copiat?'Copiat':'Copiar enllaç'}</button>{' '}
  <button onClick={onClose}>Tancar</button>
 </section>;
}
