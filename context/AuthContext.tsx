import React, { createContext, useState, useContext } from 'react';
import { Alert } from 'react-native'; // Importamos o Alert para uma mensagem mais bonita que o 'alert'

// 1. Definindo os tipos de usuários
export type UserRole = 'hospede' | 'anfitriao' | 'admin';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

// 2. Lista de e-mails autorizados (Substitua pelo seu e-mail real aqui)
const ADMIN_WHITELIST = [
  'seu-email@gmail.com',
  'admin@reservago.com.br'
];

// 3. Tipagem do que o Contexto oferece para o restante do App
interface AuthContextData {
  user: User | null;
  loginWithGoogle: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Função para simular o Login
  const loginWithGoogle = (role: UserRole) => {
    // Simulando o e-mail que viria do Google
    const userEmail = 'seu-email@gmail.com'; 

    let finalRole = role;

    // VALIDAÇÃO DE SEGURANÇA ADMIN
    if (role === 'admin' && !ADMIN_WHITELIST.includes(userEmail)) {
      Alert.alert(
        "Acesso Negado", 
        "Seu e-mail não está na lista de administradores autorizados. Você entrará como Hóspede."
      );
      finalRole = 'hospede'; // Rebaixa para hóspede se não estiver na lista
    }

    setUser({
      id: '123',
      name: 'Usuário Validado',
      email: userEmail,
      role: finalRole,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};