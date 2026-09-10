import 'dotenv/config';
import 'express-async-errors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import usuarisRoutes from './routes/usuaris.routes';
import agrupacionsRoutes from './routes/agrupacions.routes';
import provinciesRoutes from './routes/provincies.routes';
import tipusVehiclesRoutes from './routes/tipusVehicles.routes';
import tipusMaterialRoutes from './routes/tipusMaterial.routes';
import vehiclesRoutes from './routes/vehicles.routes';
import materialRoutes from './routes/material.routes';
import documentsRoutes from './routes/documents.routes';
import formacioRoutes from './routes/formacio.routes';
import avisosRoutes from './routes/avisos.routes';
import pushRoutes from './routes/push.routes';
import voluntarisRoutes from './routes/voluntaris.routes';
import serveisRoutes from './routes/serveis.routes';
import tipusServeiRoutes from './routes/tipusServei.routes';
import categoriaServeiRoutes from './routes/categoriaServei.routes';
import proveidorsRoutes from './routes/proveidors.routes';
import equipamentRoutes from './routes/equipament.routes';
import localitatServeiRoutes from './routes/localitatServei.routes';
import sollicitantServeiRoutes from './routes/sollicitantServei.routes';
import nomEquipamentRoutes from './routes/nomEquipament.routes';
import alertaFederacioRoutes from './routes/alertaFederacio.routes';
import notificacioAssociacionsRoutes from './routes/notificacioAssociacions.routes';
import auditoriaRoutes from './routes/auditoria.routes';
import { iniciarPlanificadorAvisos } from './services/scheduler.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet());
const allowedOrigins = [process.env.FRONTEND_URL || 'https://avpc-federacio-frontend.onrender.com', ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:5173','http://localhost:5174','http://127.0.0.1:4173'] : [])];
app.use(cors({origin:(origin,done)=>done(null,!origin || allowedOrigins.includes(origin))}));
app.use(express.json({limit:'100kb'}));
app.use('/api',(_req,res,next)=>{res.setHeader('Cache-Control','no-store, private');res.setHeader('Pragma','no-cache');next();});
app.use('/api/auth',rateLimit({windowMs:15*60_000,limit:60,skipSuccessfulRequests:true,skip:req=>req.method==='GET',standardHeaders:'draft-8',legacyHeaders:false,message:{error:'Massa intents. Torna-ho a provar més tard.'}}));

app.use('/api/auth', authRoutes);
app.use('/api/usuaris', usuarisRoutes);
app.use('/api/agrupacions', agrupacionsRoutes);
app.use('/api/provincies', provinciesRoutes);
app.use('/api/tipus-vehicles', tipusVehiclesRoutes);
app.use('/api/tipus-material', tipusMaterialRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/material', materialRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/formacio', formacioRoutes);
app.use('/api/avisos', avisosRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/voluntaris', voluntarisRoutes);
app.use('/api/serveis', serveisRoutes);
app.use('/api/tipus-servei', tipusServeiRoutes);
app.use('/api/categoria-servei', categoriaServeiRoutes);
app.use('/api/proveidors', proveidorsRoutes);
app.use('/api/equipament', equipamentRoutes);
app.use('/api/localitat-servei', localitatServeiRoutes);
app.use('/api/sollicitant-servei', sollicitantServeiRoutes);
app.use('/api/nom-equipament', nomEquipamentRoutes);
app.use('/api/alerta-federacio', alertaFederacioRoutes);
app.use('/api/notificacio-associacions', notificacioAssociacionsRoutes);
app.use('/api/auditoria', auditoriaRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use((err:any,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{
  const status=err.code==='LIMIT_FILE_SIZE'?413:err.code==='P2002'?409:err.status===400?400:500;
  res.status(status).json({error:status===413?'El fitxer supera els 10 MB':status===409?'Aquest registre ja existeix':status===400?'Dades no vàlides':'No s’ha pogut completar l’operació'});
});
export default app;
if (require.main === module) app.listen(PORT, () => {
  console.log(`Servidor AVPC Federació backend escoltant al port ${PORT}`);
  iniciarPlanificadorAvisos();
  console.log("Planificador d'avisos iniciat (revisió cada minut)");
});
