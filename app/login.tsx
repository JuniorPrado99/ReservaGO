import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    setIsLoading(true);
    await login(email, password);
    setIsLoading(false);
  };

  // Abre o fluxo de OAuth do Google gerenciado pelo Supabase. A troca do
  // código pela sessão (e o redirecionamento pra Explorar) acontece em
  // app/oauth-callback.tsx, que recebe o deep link de volta.
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const redirectTo = Linking.createURL('oauth-callback');
      console.log('[login] iniciando OAuth Google | redirectTo =', redirectTo, '| platform =', Platform.OS);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: Platform.OS !== 'web',
        },
      });

      console.log('[login] resposta signInWithOAuth ->', {
        url: data?.url ?? null,
        error: error?.message ?? null,
      });

      if (error) throw error;

      if (Platform.OS !== 'web' && data?.url) {
        console.log('[login] abrindo sessão de autenticação (WebBrowser) em', data.url);
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        console.log('[login] openAuthSessionAsync retornou ->', result);
      }
    } catch (err: any) {
      console.log('[login] erro no login com Google ->', err?.message ?? err);
      Alert.alert('Erro ao entrar com Google', err?.message ?? 'Tente novamente.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>

          <View style={styles.header}>
            <FontAwesome name="tree" size={60} color="#2D5A27" />
            <Text style={styles.title}>Bem-vindo ao ReservaGO</Text>
            <Text style={styles.subtitle}>Sua conta para as melhores cabanas do Brasil.</Text>
          </View>

          <View style={styles.form}>
            <TouchableOpacity
              style={[styles.googleButton, isGoogleLoading && styles.loginButtonDisabled]}
              onPress={handleGoogleLogin}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color="#1F2937" />
              ) : (
                <>
                  <FontAwesome name="google" size={18} color="#1F2937" style={{ marginRight: 10 }} />
                  <Text style={styles.googleText}>Entrar com Google</Text>
                </>
              )}
            </TouchableOpacity>

            {__DEV__ && (
              <>
                <Text style={styles.devDivider}>— apenas em desenvolvimento —</Text>

                <TextInput
                  style={styles.input}
                  placeholder="E-mail"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  editable={!isLoading}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Senha"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!isLoading}
                />

                <TouchableOpacity
                  style={[styles.loginButton, (!email || !password || isLoading) && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={!email || !password || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.loginText}>Entrar (login fake)</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              disabled={isLoading || isGoogleLoading}
            >
              <Text style={styles.backText}>Voltar e explorar</Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 30, justifyContent: 'space-around' },
  header: { alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1F2937', marginTop: 20, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginTop: 10 },
  form: { gap: 15 },
  googleButton: {
    flexDirection: 'row', backgroundColor: '#fff', padding: 18, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center', minHeight: 58,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  googleText: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  devDivider: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 5 },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 15,
    padding: 18, fontSize: 16, color: '#1F2937', backgroundColor: '#F9FAFB',
  },
  loginButton: {
    backgroundColor: '#2D5A27', padding: 18, borderRadius: 15,
    alignItems: 'center', minHeight: 58, justifyContent: 'center',
  },
  loginButtonDisabled: { opacity: 0.5 },
  loginText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  backButton: { alignItems: 'center', padding: 10 },
  backText: { color: '#6B7280', textDecorationLine: 'underline' },
});