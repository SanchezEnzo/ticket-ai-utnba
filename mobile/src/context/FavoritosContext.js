import { createContext, useState, useContext, useCallback } from 'react';
import { listarFavoritos as apiListarFavoritos } from '../api/favoritos.js';
import { marcarFavorito as apiMarcarFavorito } from '../api/favoritos.js';
import { quitarFavorito as apiQuitarFavorito } from '../api/favoritos.js';

const FavoritosContext = createContext(null);

function FavoritosProvider({ children }) {
  const [favoritos, setFavoritos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Conjunto de IDs para consulta rápida
  const idsSet = new Set(favoritos.map((e) => e.id));

  const cargarFavoritos = useCallback(async (token) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const lista = await apiListarFavoritos(token);
      setFavoritos(lista || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const esFavorito = useCallback(
    (eventoId) => idsSet.has(eventoId),
    [idsSet]
  );

  const alternar = useCallback(
    async (evento, token) => {
      if (!token) return;
      const eraFavorito = idsSet.has(evento.id);

      // Actualización optimista
      if (eraFavorito) {
        setFavoritos((prev) => prev.filter((e) => e.id !== evento.id));
      } else {
        setFavoritos((prev) => [...prev, evento]);
      }
      setError(null);

      try {
        if (eraFavorito) {
          await apiQuitarFavorito(evento.id, token);
        } else {
          await apiMarcarFavorito(evento.id, token);
        }
      } catch (err) {
        // Rollback: revierte el estado optimista
        if (eraFavorito) {
          setFavoritos((prev) => [...prev, evento]);
        } else {
          setFavoritos((prev) => prev.filter((e) => e.id !== evento.id));
        }
        setError(err.message);
      }
    },
    [idsSet]
  );

  const quitarDeLista = useCallback((eventoId) => {
    setFavoritos((prev) => prev.filter((e) => e.id !== eventoId));
  }, []);

  const limpiar = useCallback(() => {
    setFavoritos([]);
    setError(null);
    setLoading(false);
  }, []);

  const value = {
    favoritos,
    loading,
    error,
    cargarFavoritos,
    esFavorito,
    alternar,
    quitarDeLista,
    limpiar,
  };

  return (
    <FavoritosContext.Provider value={value}>
      {children}
    </FavoritosContext.Provider>
  );
}

function useFavoritos() {
  const context = useContext(FavoritosContext);
  if (!context) {
    throw new Error('useFavoritos debe usarse dentro de un FavoritosProvider');
  }
  return context;
}

export { FavoritosProvider, useFavoritos };
