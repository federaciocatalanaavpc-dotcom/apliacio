import { useState } from 'react';
import { getUsuariActual } from '../services/api';

interface Item {
  id: string;
  nom: string;
}

export default function GestorCataleg({
  items,
  onAfegir,
  onEditar,
  onEliminar,
  placeholder,
}: {
  items: Item[];
  onAfegir: (nom: string) => Promise<void>;
  onEditar: (id: string, nom: string) => Promise<void>;
  onEliminar: (id: string) => Promise<void>;
  placeholder?: string;
}) {
  const esFederacio = getUsuariActual()?.rol === 'FEDERACIO';
  const [nou, setNou] = useState('');
  const [editantId, setEditantId] = useState<string | null>(null);
  const [editNom, setEditNom] = useState('');
  const [error, setError] = useState('');

  async function handleAfegir() {
    if (!nou.trim()) return;
    setError('');
    try {
      await onAfegir(nou.trim());
      setNou('');
    } catch {
      setError('No s\'ha pogut afegir (potser ja existeix)');
    }
  }

  async function handleEditar(id: string) {
    setError('');
    try {
      await onEditar(id, editNom);
      setEditantId(null);
    } catch {
      setError('No s\'han pogut desar els canvis');
    }
  }

  async function handleEliminar(id: string) {
    setError('');
    try {
      await onEliminar(id);
    } catch {
      setError('No s\'ha pogut eliminar (potser està en ús)');
    }
  }

  return (
    <div className="card" style={{ marginBottom: 10, background: 'var(--c-surface-alt)' }}>
      {items.length === 0 && <p className="text-muted" style={{ fontSize: 12 }}>Encara no hi ha cap opció.</p>}
      {error && <p className="text-error" style={{ fontSize: 12 }}>{error}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
        {items.map((item) => (
          <div key={item.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {editantId === item.id ? (
              <>
                <input value={editNom} onChange={(e) => setEditNom(e.target.value)} style={{ flex: 1, fontSize: 13 }} />
                <button type="button" onClick={() => handleEditar(item.id)} style={{ fontSize: 11 }}>
                  Desar
                </button>
              </>
            ) : (
              <span style={{ flex: 1, fontSize: 13 }}>{item.nom}</span>
            )}
            {esFederacio && editantId !== item.id && (
              <button type="button" onClick={() => { setEditantId(item.id); setEditNom(item.nom); }} style={{ fontSize: 11 }}>
                Editar
              </button>
            )}
            {esFederacio && (
              <button type="button" onClick={() => handleEliminar(item.id)} style={{ fontSize: 11, color: 'var(--c-error)' }}>
                Eliminar
              </button>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input value={nou} onChange={(e) => setNou(e.target.value)} placeholder={placeholder} style={{ flex: 1, fontSize: 13 }} />
        <button type="button" onClick={handleAfegir} style={{ fontSize: 12 }}>Afegir</button>
      </div>
    </div>
  );
}
