import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Agrupacions from './pages/Agrupacions';
import GestioUsuaris from './pages/GestioUsuaris';
import Membres from './pages/Membres';
import Vehicles from './pages/Vehicles';
import Material from './pages/Material';
import Documents from './pages/Documents';
import Formacio from './pages/Formacio';
import Avisos from './pages/Avisos';
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
            <RutaFederacio>
              <Agrupacions />
            </RutaFederacio>
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
          path="/membres"
          element={
            <RutaProtegida>
              <Membres />
            </RutaProtegida>
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
      </Routes>
    </BrowserRouter>
  );
}
