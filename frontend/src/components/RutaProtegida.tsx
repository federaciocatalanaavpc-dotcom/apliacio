import { Navigate, useLocation } from 'react-router-dom';
import { getUsuariActual } from '../services/api';
import Capcalera from './Capcalera';

export default function RutaProtegida({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const usuari = getUsuariActual();
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (usuari?.rol === 'ADMIN_AVPC' && !['/', '/gestio-avpc', '/inventari', '/avisos', '/canviar-contrasenya', '/voluntari/roba', '/voluntari/disponibilitat', '/voluntari/estadistiques', '/voluntari/alertes'].includes(pathname)) {
    return <Navigate to="/gestio-avpc" replace />;
  }
  return (
    <>
      <Capcalera />
      {children}
    </>
  );
}
