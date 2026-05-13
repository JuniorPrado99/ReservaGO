import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

interface FavoritesContextData {
  favorites: string[];
  toggleFavorite: (id: string) => void;
}

const FavoritesContext = createContext<FavoritesContextData>({
  favorites: [],
  toggleFavorite: () => {},
});

const STORAGE_KEY = '@reservago:favorites';

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const { user } = useAuth();

  // Carrega favoritos do AsyncStorage quando o usuário loga
  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      // Limpa os favoritos da memória ao deslogar
      setFavorites([]);
    }
  }, [user]);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(`${STORAGE_KEY}:${user?.id}`);
      if (stored) setFavorites(JSON.parse(stored));
    } catch (e) {
      console.error('Erro ao carregar favoritos:', e);
    }
  };

  const saveFavorites = async (newFavorites: string[]) => {
    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEY}:${user?.id}`,
        JSON.stringify(newFavorites)
      );
    } catch (e) {
      console.error('Erro ao salvar favoritos:', e);
    }
  };

  const toggleFavorite = (id: string) => {
    if (!user) {
      if (Platform.OS === 'web') {
        window.alert('Faça login para salvar seus lugares favoritos.');
      } else {
        Alert.alert(
          'Login necessário',
          'Faça login para salvar seus lugares favoritos.',
          [{ text: 'Cancelar', style: 'cancel' }]
        );
      }
      return;
    }

    const updated = favorites.includes(id)
      ? favorites.filter(favId => favId !== id)
      : [...favorites, id];

    setFavorites(updated);
    saveFavorites(updated);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);
