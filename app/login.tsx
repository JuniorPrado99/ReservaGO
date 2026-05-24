import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await loginWithGoogle();
      // Não precisa navegar aqui — o onAuthStateChange no AuthContext
      // detecta a sessão e o _layout.tsx redireciona automaticamente
    } catch (error: any) {
      Alert.alert('Erro de Autenticação', error?.message || 'Não foi possível conectar ao Google.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <FontAwesome name="tree" size={60} color="#2D5A27" />
          <Text style={styles.title}>Bem-vindo ao ReservaGO</Text>
          <Text style={styles.subtitle}>Sua conta para as melhores cabanas do Brasil.</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.googleButton, isLoading && { opacity: 0.7 }]}
            onPress={handleGoogleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#2D5A27" />
            ) : (
              <>
                <FontAwesome name="google" size={20} color="#EA4335" />
                <Text style={styles.googleText}>Continuar com Google</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={isLoading}
          >
            <Text style={styles.backText}>Voltar e explorar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 30, justifyContent: 'space-around' },
  header: { alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1F2937', marginTop: 20, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginTop: 10 },
  buttonContainer: { gap: 15 },
  googleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 18, borderRadius: 15, borderWidth: 1, borderColor: '#E5E7EB',
    backgroundColor: '#fff', minHeight: 58,
  },
  googleText: { marginLeft: 12, fontSize: 16, fontWeight: '600', color: '#1F2937' },
  backButton: { alignItems: 'center', padding: 10 },
  backText: { color: '#6B7280', textDecorationLine: 'underline' },
});