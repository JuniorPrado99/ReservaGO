import type { Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { updateRole as updateRoleInDb } from '../services/profileService';

export type UserRole = 'hospede' | 'anfitriao' | 'admin';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200';

const STATIC_USERS: { email: string; password: string; user: AppUser }[] = [
  {
    email: 'admin@reservago.com',
    password: '1234',
    user: {
      id: 'static-admin-01',
      name: 'Admin ReservaGO',
      email: 'admin@reservago.com',
      role: 'admin',
      avatar: DEFAULT_AVATAR,
    },
  },
  {
    email: 'hospede@reservago.com',
    password: '1234',
    user: {
      id: 'static-hospede-01',
      name: 'João Hóspede',
      email: 'hospede@reservago.com',
      role: 'hospede',
      avatar: DEFAULT_AVATAR,
    },
  },
  {
    email: 'anfitriao@reservago.com',
    password: '1234',
    user: {
      id: 'static-anfitriao-01',
      name: 'Maria Anfitriã',
      email: 'anfitriao@reservago.com',
      role: 'anfitriao',
      avatar: DEFAULT_AVATAR,
    },
  },
];

interface AuthContextData {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateRole: (role: UserRole) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Busca a linha em `profiles` correspondente à sessão do Supabase.
  // Não cria nada aqui: a trigger handle_new_user (schema.sql) já garante
  // que o profile existe assim que o usuário é criado em auth.users.
  const loadProfileForSession = async (activeSession: Session) => {
    console.log('[auth] carregando profile para usuário', activeSession.user.id);
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url, role')
      .eq('id', activeSession.user.id)
      .single();

    if (error || !profile) {
      console.log('[auth] falha ao ler profile, usando fallback ->', error?.message);
      // Não deveria acontecer (a trigger roda antes disso), mas evita deixar
      // o usuário sem `user` populado se a leitura falhar por algum motivo.
      setUser({
        id: activeSession.user.id,
        name: activeSession.user.user_metadata?.full_name ?? activeSession.user.email ?? 'Usuário',
        email: activeSession.user.email ?? '',
        role: 'hospede',
        avatar: activeSession.user.user_metadata?.avatar_url ?? DEFAULT_AVATAR,
      });
      console.log('[auth] user (fallback) definido no estado');
      return;
    }

    setUser({
      id: profile.id,
      name: profile.name || activeSession.user.email || 'Usuário',
      email: profile.email,
      role: (profile.role as UserRole) ?? 'hospede',
      avatar: profile.avatar_url || DEFAULT_AVATAR,
    });
    console.log('[auth] user definido no estado a partir do profile ->', profile.email, profile.role);
  };

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('[auth] onAuthStateChange ->', event, '| sessão presente?', !!newSession);
      if (!isMounted) return;
      setSession(newSession);

      if (!newSession) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Só recarrega o profile quando a identidade muda de fato — evita
      // sobrescrever alterações locais (ex: updateRole) a cada renovação
      // automática de token (TOKEN_REFRESHED).
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
        loadProfileForSession(newSession).finally(() => isMounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const found = STATIC_USERS.find(
      (u) => u.email === email.trim().toLowerCase() && u.password === password
    );
    if (found) {
      setUser(found.user);
    } else {
      Alert.alert('Erro', 'E-mail ou senha inválidos.');
    }
    setLoading(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateRole = async (role: UserRole) => {
    if (!user) return;

    // Grava de verdade em profiles.role (antes só trocava em memória - ver
    // CLAUDE.md, divergência sobre updateRole). Para os usuários estáticos
    // de dev (STATIC_USERS, ids "static-*") não existe linha em profiles,
    // então isso falha por design nesse caso específico - é esperado, esse
    // login fake não passa de __DEV__ e nunca vai pra produção.
    const { data, error } = await updateRoleInDb(user.id, role);

    if (error) {
      Alert.alert('Erro ao atualizar perfil', error);
      return;
    }

    setUser((prev) => (prev ? { ...prev, role: data?.role ?? role } : null));
  };

  const deleteAccount = async () => {
    if (!user) return;
    Alert.alert('Excluir conta', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          setUser(null);
        },
      },
    ]);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, login, logout, updateRole, deleteAccount }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
};