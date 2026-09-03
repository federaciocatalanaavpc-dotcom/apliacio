import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth.routes';
import usuarisRoutes from './routes/usuaris.routes';
import agrupacionsRoutes from './routes/agrupacions.routes';
import provinciesRoutes from './routes/provincies.routes';
import vehiclesRoutes from './routes/vehicles.routes';
import materialRoutes from './routes/material.routes';
import documentsRoutes from './routes/documents.routes';
import formacioRoutes from './routes/formacio.routes';
import avisosRoutes from './routes/avisos.routes';
import pushRoutes from './routes/push.routes';
import { requireAuth } from './middleware/auth.middleware';
import { iniciarPlanificadorAvisos } from './services/scheduler.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Els fitxers pujats (estatuts, actes...) només es poden descarregar amb sessió iniciada.
app.use('/uploads', requireAuth, express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/usuaris', usuarisRoutes);
app.use('/api/agrupacions', agrupacionsRoutes);
app.use('/api/provincies', provinciesRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/material', materialRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/formacio', formacioRoutes);
app.use('/api/avisos', avisosRoutes);
app.use('/api/push', pushRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Servidor AVPC Federació backend escoltant al port ${PORT}`);
  iniciarPlanificadorAvisos();
  console.log("Planificador d'avisos iniciat (revisió cada minut)");
});
