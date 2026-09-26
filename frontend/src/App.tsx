import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import {CompartirUbicacioProvider} from './components/CompartirUbicacio';
import Dashboard from './pages/Dashboard';
import RutaProtegida from './components/RutaProtegida';
import RutaFederacio from './components/RutaFederacio';
import EstatConnexio from './components/EstatConnexio';
import VoluntariShell from './components/VoluntariShell';

// Les pantalles pesades (mapes, PDF, gràfics) es descarreguen només quan
// s'obren: la càrrega inicial al mòbil és molt més ràpida.
const Associacions = lazy(() => import('./pages/Associacions'));
const GestioUsuaris = lazy(() => import('./pages/GestioUsuaris'));
const Inventari = lazy(() => import('./pages/Inventari'));
const Mapa = lazy(() => import('./pages/Mapa'));
const Documents = lazy(() => import('./pages/Documents'));
const DocumentacioPropia = lazy(() => import('./pages/DocumentacioPropia'));
const Formacio = lazy(() => import('./pages/Formacio'));
const GestioAvpc = lazy(() => import('./pages/GestioAvpc'));
const Federacio = lazy(() => import('./pages/Federacio'));
const ServeisConjunts = lazy(() => import('./pages/ServeisConjunts'));
const PerfilVoluntari = lazy(() => import('./pages/PerfilVoluntari'));
const RobaVoluntari = lazy(() => import('./pages/RobaVoluntari'));
const DisponibilitatVoluntari = lazy(() => import('./pages/DisponibilitatVoluntari'));
const EstadistiquesVoluntari = lazy(() => import('./pages/EstadistiquesVoluntari'));
const AlertesVoluntari = lazy(() => import('./pages/AlertesVoluntari'));
const Avisos = lazy(() => import('./pages/Avisos'));
const CanviarContrasenya = lazy(() => import('./pages/CanviarContrasenya'));

export default function App() {
  return (
    <BrowserRouter>
      <CompartirUbicacioProvider>
      <EstatConnexio />
      <Suspense fallback={<main className="page"><p className="text-muted">Carregant…</p></main>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RutaProtegida><Dashboard /></RutaProtegida>} />
        <Route path="/agrupacions" element={<RutaProtegida><Associacions /></RutaProtegida>} />
        <Route path="/usuaris" element={<RutaFederacio><GestioUsuaris /></RutaFederacio>} />
        <Route path="/inventari" element={<RutaProtegida><Inventari /></RutaProtegida>} />
        <Route path="/mapa" element={<RutaProtegida><Mapa /></RutaProtegida>} />
        <Route path="/documents" element={<RutaProtegida><Documents /></RutaProtegida>} />
        <Route path="/documentacio-propia" element={<RutaProtegida><DocumentacioPropia /></RutaProtegida>} />
        <Route path="/formacio" element={<RutaProtegida><Formacio /></RutaProtegida>} />
        <Route path="/gestio-avpc" element={<RutaProtegida><GestioAvpc /></RutaProtegida>} />
        <Route path="/serveis-conjunts" element={<RutaProtegida><ServeisConjunts /></RutaProtegida>} />
        <Route path="/federacio" element={<RutaProtegida><Federacio /></RutaProtegida>} />
        <Route path="/voluntari/serveis" element={<RutaProtegida><VoluntariShell><PerfilVoluntari /></VoluntariShell></RutaProtegida>} />
        <Route path="/voluntari/roba" element={<RutaProtegida><VoluntariShell><RobaVoluntari /></VoluntariShell></RutaProtegida>} />
        <Route path="/voluntari/disponibilitat" element={<RutaProtegida><VoluntariShell><DisponibilitatVoluntari /></VoluntariShell></RutaProtegida>} />
        <Route path="/voluntari/estadistiques" element={<RutaProtegida><VoluntariShell><EstadistiquesVoluntari /></VoluntariShell></RutaProtegida>} />
        <Route path="/voluntari/alertes" element={<RutaProtegida><VoluntariShell><AlertesVoluntari /></VoluntariShell></RutaProtegida>} />
        <Route path="/avisos" element={<RutaProtegida><Avisos /></RutaProtegida>} />
        <Route path="/canviar-contrasenya" element={<RutaProtegida><CanviarContrasenya /></RutaProtegida>} />
      </Routes>
      </Suspense>
      </CompartirUbicacioProvider>
    </BrowserRouter>
  );
}
