import React, { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';

export type UserRole = 'hospede' | 'anfitriao' | 'admin';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

const STATIC_USERS: { email: string; password: string; user: AppUser }[] = [
  {
    email: 'admin@reservago.com',
    password: '1234',
    user: {
      id: 'static-admin-01',
      name: 'Admin ReservaGO',
      email: 'admin@reservago.com',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
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
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
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
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    },
  },
];

interface AuthContextData {
  user: AppUser | null;
  session: null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateRole: (role: UserRole) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(false);

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
    setUser(null);
  };

  const updateRole = async (role: UserRole) => {
    if (!user) return;
    setUser((prev) => (prev ? { ...prev, role } : null));
  };

  const deleteAccount = async () => {
    if (!user) return;
    Alert.alert('Excluir conta', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => setUser(null) },
    ]);
  };

  return (
    <AuthContext.Provider
      value={{ user, session: null, loading, login, logout, updateRole, deleteAccount }}
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