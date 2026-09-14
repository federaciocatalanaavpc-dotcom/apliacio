import {AuthRequest,potGestionarAgrupacio} from '../middleware/auth.middleware';
export type AmbParticipants={id:string;agrupacioId:string;conjunt:boolean;participants:{agrupacioId:string;coordinadora:boolean}[]};
export function participa(s:AmbParticipants,id:string|null){return !!id && (s.conjunt?s.participants.some(p=>p.agrupacioId===id):s.agrupacioId===id);}
export function coordina(req:AuthRequest,s:AmbParticipants){
 if(req.usuari!.rol==='FEDERACIO')return true;
 if(!['AGRUPACIO','ADMIN_AVPC'].includes(req.usuari!.rol))return false;
 return s.conjunt?s.participants.some(p=>p.agrupacioId===req.usuari!.agrupacioId && p.coordinadora):potGestionarAgrupacio(req,s.agrupacioId);
}
export function gestionaAssistents(req:AuthRequest,s:AmbParticipants,id:string){return participa(s,id) && (coordina(req,s)||potGestionarAgrupacio(req,id));}
export function consultaServei(req:AuthRequest,s:AmbParticipants){return req.usuari!.rol!=='VOLUNTARI' && (coordina(req,s)||participa(s,req.usuari!.agrupacioId));}
export function editaServei(req:AuthRequest,s:{agrupacioId:string;conjunt:boolean}){return s.conjunt?req.usuari!.rol==='FEDERACIO':potGestionarAgrupacio(req,s.agrupacioId);}
export const seleccioParticipants={include:{agrupacio:{select:{id:true,nom:true}}}} as const;
