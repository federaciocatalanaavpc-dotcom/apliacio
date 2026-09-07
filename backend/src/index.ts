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
import { iniciarPlanificadorAvisos } from './services/scheduler.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

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

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Servidor AVPC Federació backend escoltant al port ${PORT}`);
  iniciarPlanificadorAvisos();
  console.log("Planificador d'avisos iniciat (revisió cada minut)");
});
