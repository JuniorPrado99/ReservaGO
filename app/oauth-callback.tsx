import { useRouter } from 'expo-router';
import { useURL } from 'expo-linking';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';

// Rota: /oauth-callback (reservago://oauth-callback, ou exp://.../--/oauth-callback
// dentro do Expo Go — o "--/" é inserido automaticamente pelo Expo Go, não faz
// parte do nome do arquivo).
//
// O Google redireciona pro Supabase (callback já configurado no client OAuth),
// e o Supabase redireciona pra cá com "?code=" na URL (fluxo PKCE). Essa tela
// só troca esse código pela sessão — o AuthContext escuta
// supabase.auth.onAuthStateChange e atualiza o usuário sozinho a partir daí.
export default function OAuthCallback() {
  const url = useURL();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    // Um código PKCE só pode ser trocado uma vez — evita reprocessar se este
    // efeito rodar de novo com a mesma URL.
    if (!url || handledRef.current) return;
    handledRef.current = true;

    (async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(url);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      router.replace('/(tabs)');
    })();
  }, [url]);

  if (errorMessage) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Não foi possível entrar</Text>
        <Text style={styles.message}>{errorMessage}</Text>
        <Text style={styles.link} onPress={() => router.replace('/login')}>
          Voltar para o login
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2D5A27" />
      <Text style={styles.message}>Concluindo login com Google…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#fff',
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', textAlign: 'center' },
  message: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  link: { fontSize: 15, color: '#2D5A27', fontWeight: '600', marginTop: 10 },
});
