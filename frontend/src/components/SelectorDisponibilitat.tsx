import { Disponibilitat } from '../services/voluntaris';

export const DISPONIBILITAT_LABEL: Record<Disponibilitat, string> = {
  PRESENCIAL: 'Presencial',
  IMMEDIATA: 'Immediata',
  DIFERIDA: 'Diferida',
  NO_DISPONIBLE: 'No disponible',
};

export const DISPONIBILITAT_COLOR: Record<Disponibilitat, string> = {
  PRESENCIAL: 'var(--c-success)',
  IMMEDIATA: 'var(--c-success)',
  DIFERIDA: 'var(--c-warning)',
  NO_DISPONIBLE: 'var(--c-error)',
};

export default function SelectorDisponibilitat({
  valor,
  onCanviar,
  desactivat = false,
}: {
  valor: Disponibilitat;
  onCanviar: (disponibilitat: Disponibilitat) => void;
  desactivat?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {(Object.entries(DISPONIBILITAT_LABEL) as [Disponibilitat, string][]).map(([opcio, etiqueta]) => {
        const activa = valor === opcio;
        return (
          <button
            key={opcio}
            onClick={() => onCanviar(opcio)}
            disabled={desactivat}
            style={{
              fontSize: 13,
              fontWeight: 700,
              padding: '8px 12px',
              borderRadius: 999,
              border: `1.5px solid ${activa ? DISPONIBILITAT_COLOR[opcio] : 'var(--c-border)'}`,
              background: activa ? DISPONIBILITAT_COLOR[opcio] : 'transparent',
              color: activa ? '#fff' : 'var(--c-text)',
            }}
          >
            {etiqueta}
          </button>
        );
      })}
    </div>
  );
}
