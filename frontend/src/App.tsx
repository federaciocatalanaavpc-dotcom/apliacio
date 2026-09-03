import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Associacions from './pages/Associacions';
import GestioUsuaris from './pages/GestioUsuaris';
import Vehicles from './pages/Vehicles';
import Material from './pages/Material';
import Documents from './pages/Documents';
import DocumentacioPropia from './pages/DocumentacioPropia';
import Formacio from './pages/Formacio';
import Avisos from './pages/Avisos';
import CanviarContrasenya from './pages/CanviarContrasenya';
import RutaProtegida from './components/RutaProtegida';
import RutaFederacio from './components/RutaFederacio';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RutaProtegida>
              <Dashboard />
            </RutaProtegida>
          }
        />
        <Route
          path="/agrupacions"
          element={
            <RutaProtegida>
              <Associacions />
            </RutaProtegida>
          }
        />
        <Route
          path="/usuaris"
          element={
            <RutaFederacio>
              <GestioUsuaris />
            </RutaFederacio>
          }
        />
        <Route
          path="/vehicles"
          element={
            <RutaProtegida>
              <Vehicles />
            </RutaProtegida>
          }
        />
        <Route
          path="/material"
          element={
            <RutaProtegida>
              <Material />
            </RutaProtegida>
          }
        />
        <Route
          path="/documents"
          element={
            <RutaProtegida>
              <Documents />
            </RutaProtegida>
          }
        />
        <Route
          path="/documentacio-propia"
          element={
            <RutaProtegida>
              <DocumentacioPropia />
            </RutaProtegida>
          }
        />
        <Route
          path="/formacio"
          element={
            <RutaProtegida>
              <Formacio />
            </RutaProtegida>
          }
        />
        <Route
          path="/avisos"
          element={
            <RutaProtegida>
              <Avisos />
            </RutaProtegida>
          }
        />
        <Route
          path="/canviar-contrasenya"
          element={
            <RutaProtegida>
              <CanviarContrasenya />
            </RutaProtegida>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
