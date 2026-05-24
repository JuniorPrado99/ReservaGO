import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';


// OBRIGATÓRIO: fecha o navegador embutido automaticamente após o redirect
WebBrowser.maybeCompleteAuthSession();

export type UserRole = 'hospede' | 'anfitriao' | 'admin';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

interface AuthContextData {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateRole: (role: UserRole) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

function profileToAppUser(profile: any): AppUser {
  return {
    id: profile.id,
    name: profile.name || 'Usuário',
    email: profile.email || '',
    role: (profile.role as UserRole) || 'hospede',
    avatar:
      profile.avatar_url ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Carrega sessão salva (AsyncStorage) ao abrir o app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) loadProfile(session.user);
      else setLoading(false);
    });

    // 2. Reage a qualquer mudança de estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('[Auth] onAuthStateChange:', _event, session?.user?.email);
        setSession(session);
        if (session?.user) {
          await loadProfile(session.user);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // 3. Escuta deep links enquanto o app está aberto (fallback)
    //    O WebBrowser já intercepta o redirect — isso é só garantia extra
    const linkSub = Linking.addEventListener('url', async ({ url }) => {
      if (url.includes('access_token') || url.includes('code=')) {
        await supabase.auth.exchangeCodeForSession(url);
      }
    });

    return () => {
      subscription.unsubscribe();
      linkSub.remove();
    };
  }, []);

  async function loadProfile(supabaseUser: SupabaseUser) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error || !data) {
        // Usuário novo — cria perfil automaticamente
        const newProfile = {
          id: supabaseUser.id,
          name:
            supabaseUser.user_metadata?.full_name ||
            supabaseUser.email?.split('@')[0] ||
            'Usuário',
          email: supabaseUser.email || '',
          avatar_url: supabaseUser.user_metadata?.avatar_url || null,
          role: 'hospede' as UserRole,
        };

        const { data: created } = await supabase
          .from('profiles')
          .upsert(newProfile)
          .select()
          .single();

        if (created) setUser(profileToAppUser(created));
      } else {
        setUser(profileToAppUser(data));
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    } finally {
      setLoading(false);
    }
  }

  const loginWithGoogle = async () => {
  try {
    const redirectUrl = 'reservago://oauth-callback';
    console.log('[OAuth] redirect URL:', redirectUrl);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
        queryParams: {
          acess_type: 'access_type',
          prompt: 'select_account',
        }
      },
    });

    if (error || !data?.url) {
      Alert.alert('Erro', error?.message || 'Não foi possível iniciar o login com Google.');
      return;
    }

    await WebBrowser.warmUpAsync();
const result = await WebBrowser.openAuthSessionAsync(
  data.url,
  'reservago://oauth-callback',
  { preferEphemeralSession: true }
);
    console.log('[OAuth] result type:', result.type);

    if (result.type === 'success' && result.url) {
      console.log('[OAuth] success URL:', result.url);
      const { error: sessionError } = await supabase.auth.setSession({
  access_token: new URL(result.url.replace('#', '?')).searchParams.get('access_token') || '',
  refresh_token: new URL(result.url.replace('#', '?')).searchParams.get('refresh_token') || '',
});
if (sessionError) {
  console.error('Erro ao criar sessão:', sessionError.message);
  Alert.alert('Erro de login', 'Não foi possível completar a autenticação.');
}
    } else {
      // Tenta buscar sessão mesmo assim
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[OAuth] session após browser:', session?.user?.email);
      if (session?.user) await loadProfile(session.user);
    }
  } catch (err) {
    Alert.alert('Erro', 'Não foi possível conectar ao Google. Tente novamente.');
    console.error('[OAuth] Erro:', err);
  }
};
  const updateRole = async (role: UserRole) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', user.id);
    if (error) {
      Alert.alert('Erro', 'Não foi possível atualizar seu perfil.');
      return;
    }
    setUser((prev) => (prev ? { ...prev, role } : null));
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Erro', 'Não foi possível sair. Tente novamente.');
  };

  const deleteAccount = async () => {
    if (!user) return;
    Alert.alert(
      'Excluir conta',
      'Tem certeza? Seus dados serão removidos. Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await supabase
              .from('profiles')
              .update({ deleted_at: new Date().toISOString() })
              .eq('id', user.id);
            await supabase.auth.signOut();
          },
        },
      ]
    );
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, loginWithGoogle, logout, updateRole, deleteAccount }}
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