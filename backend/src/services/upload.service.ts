import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import path from 'path';
const allowed:Record<string,string>={'.pdf':'application/pdf','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','.pptx':'application/vnd.openxmlformats-officedocument.presentationml.presentation'};
export const pujadaDocumentsAgrupacio=multer({storage:multer.memoryStorage(),limits:{fileSize:10*1024*1024,files:1,fields:12,fieldSize:100*1024},fileFilter:(_req,file,cb)=>{
 const mime=allowed[path.extname(file.originalname).toLowerCase()];
 if(!mime)return cb(Object.assign(new Error('Format no admès'),{status:400}));
 cb(null,true);
}});
export function validarFitxer(req:Request,res:Response,next:NextFunction){
 if(!req.file)return next();
 const ext=path.extname(req.file.originalname).toLowerCase(), b=req.file.buffer;
 const ok=ext==='.pdf'?b.subarray(0,5).toString()==='%PDF-':ext==='.png'?b.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')):['.jpg','.jpeg'].includes(ext)?b.subarray(0,3).equals(Buffer.from('ffd8ff','hex')):ext==='.webp'?b.subarray(0,4).toString()==='RIFF'&&b.subarray(8,12).toString()==='WEBP':b.subarray(0,4).equals(Buffer.from('504b0304','hex'));
 if(!ok)return res.status(400).json({error:'El contingut del fitxer no correspon al format indicat'});
 req.file.mimetype=allowed[ext]; next();
}
