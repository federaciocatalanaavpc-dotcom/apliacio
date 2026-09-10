import { Navigate } from 'react-router-dom';
import { getUsuariActual } from '../services/api';
import RutaProtegida from './RutaProtegida';
export default function RutaFederacio({children}:{children:React.ReactNode}) {
 if (!sessionStorage.getItem('token'))return <Navigate to="/login" replace/>;
 if (getUsuariActual()?.rol!=='FEDERACIO')return <Navigate to="/" replace/>;
 return <RutaProtegida>{children}</RutaProtegida>;
}
