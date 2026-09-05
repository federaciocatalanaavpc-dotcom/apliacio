import BotoTornar from '../components/BotoTornar';
import NotificacionsCard from '../components/NotificacionsCard';

export default function AlertesVoluntari() {
  return (
    <div className="page">
      <BotoTornar />
      <h1>Alertes</h1>
      <p className="text-muted" style={{ fontSize: 13 }}>
        Activa les notificacions per assabentar-te de seguida quan hi hagi un servei nou.
      </p>
      <NotificacionsCard />
    </div>
  );
}
