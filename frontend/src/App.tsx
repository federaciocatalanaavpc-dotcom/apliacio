import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Associacions from './pages/Associacions';
import GestioUsuaris from './pages/GestioUsuaris';
import Inventari from './pages/Inventari';
import Mapa from './pages/Mapa';
import Documents from './pages/Documents';
import DocumentacioPropia from './pages/DocumentacioPropia';
import Formacio from './pages/Formacio';
import GestioAvpc from './pages/GestioAvpc';
import Federacio from './pages/Federacio';
import PerfilVoluntari from './pages/PerfilVoluntari';
import RobaVoluntari from './pages/RobaVoluntari';
import DisponibilitatVoluntari from './pages/DisponibilitatVoluntari';
import EstadistiquesVoluntari from './pages/EstadistiquesVoluntari';
import AlertesVoluntari from './pages/AlertesVoluntari';
import Avisos from './pages/Avisos';
import CanviarContrasenya from './pages/CanviarContrasenya';
import RutaProtegida from './components/RutaProtegida';
import RutaFederacio from './components/RutaFederacio';
import EstatConnexio from './components/EstatConnexio';
import VoluntariShell from './components/VoluntariShell';

export default function App() {
  return (
    <BrowserRouter>
      <EstatConnexio />
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
        <Route path="/federacio" element={<RutaProtegida><Federacio /></RutaProtegida>} />
        <Route path="/voluntari/serveis" element={<RutaProtegida><VoluntariShell><PerfilVoluntari /></VoluntariShell></RutaProtegida>} />
        <Route path="/voluntari/roba" element={<RutaProtegida><VoluntariShell><RobaVoluntari /></VoluntariShell></RutaProtegida>} />
        <Route path="/voluntari/disponibilitat" element={<RutaProtegida><VoluntariShell><DisponibilitatVoluntari /></VoluntariShell></RutaProtegida>} />
        <Route path="/voluntari/estadistiques" element={<RutaProtegida><VoluntariShell><EstadistiquesVoluntari /></VoluntariShell></RutaProtegida>} />
        <Route path="/voluntari/alertes" element={<RutaProtegida><VoluntariShell><AlertesVoluntari /></VoluntariShell></RutaProtegida>} />
        <Route path="/avisos" element={<RutaProtegida><Avisos /></RutaProtegida>} />
        <Route path="/canviar-contrasenya" element={<RutaProtegida><CanviarContrasenya /></RutaProtegida>} />
      </Routes>
    </BrowserRouter>
  );
}
