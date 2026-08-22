import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const mockUser = { id: 'user-1', name: 'Hóspede Teste', email: 'h@t.com', role: 'hospede' as const, avatar: '' };
jest.mock('../AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

import { FavoritesProvider, useFavorites } from '../FavoritesContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <FavoritesProvider>{children}</FavoritesProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('FavoritesContext', () => {
  it('adiciona um id aos favoritos', async () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalled());

    act(() => {
      result.current.toggleFavorite('property-1');
    });

    expect(result.current.favorites).toEqual(['property-1']);
  });

  it('remove um id que já estava nos favoritos (toggle de novo)', async () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalled());

    act(() => {
      result.current.toggleFavorite('property-1');
    });
    expect(result.current.favorites).toEqual(['property-1']);

    act(() => {
      result.current.toggleFavorite('property-1');
    });
    expect(result.current.favorites).toEqual([]);
  });

  it('persiste os favoritos no AsyncStorage com a chave por usuário', async () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalled());

    act(() => {
      result.current.toggleFavorite('property-9');
    });

    await waitFor(() =>
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        `@reservago:favorites:${mockUser.id}`,
        JSON.stringify(['property-9'])
      )
    );
  });
});
