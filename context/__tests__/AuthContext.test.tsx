import React from 'react';
import { Alert } from 'react-native';
import { act, renderHook, waitFor } from '@testing-library/react-native';

// AuthContext importa `supabase` de lib/supabase.ts, que chama createClient()
// de @supabase/supabase-js no carregamento do módulo. A fábrica do mock não
// referencia nenhuma variável externa (só coisas "mock*" seriam permitidas
// pelo babel-plugin-jest-hoist, e mesmo assim a ordem de execução entre
// hoisting de import e de const é frágil) — em vez disso, pegamos as
// referências dos jest.fn() DEPOIS, lendo de volta `supabase.auth.*`.
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      onAuthStateChange: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}));

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

import { supabase } from '../../lib/supabase';
import { AuthProvider, useAuth } from '../AuthContext';

const mockOnAuthStateChange = supabase.auth.onAuthStateChange as jest.Mock;
const mockSignOut = supabase.auth.signOut as jest.Mock;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  // Simula o comportamento real do Supabase: a primeira coisa que o listener
  // recebe é o estado atual da sessão - aqui, nenhuma sessão ativa.
  mockOnAuthStateChange.mockImplementation((callback: (event: string, session: any) => void) => {
    callback('INITIAL_SESSION', null);
    return { data: { subscription: { unsubscribe: jest.fn() } } };
  });
  mockSignOut.mockResolvedValue({ error: null });
});

describe('AuthContext', () => {
  it('estado inicial: sem sessão do Supabase, user e session começam null e loading termina false', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it('login com credenciais estáticas válidas identifica a role correta do usuário', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login('hospede@reservago.com', '1234');
    });

    expect(result.current.user).not.toBeNull();
    expect(result.current.user?.role).toBe('hospede');
    expect(result.current.user?.email).toBe('hospede@reservago.com');
  });

  it('login com credenciais inválidas não autentica e mostra alerta', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login('hospede@reservago.com', 'senha-errada');
    });

    expect(result.current.user).toBeNull();
    expect(Alert.alert).toHaveBeenCalled();
  });

  it('logout chama supabase.auth.signOut() e limpa o user do estado', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login('anfitriao@reservago.com', '1234');
    });
    expect(result.current.user).not.toBeNull();

    await act(async () => {
      await result.current.logout();
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(result.current.user).toBeNull();
  });
});
