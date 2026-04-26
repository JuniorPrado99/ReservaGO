import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();

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
            style={styles.googleButton}
            onPress={() => router.push('../select-role')} // Próximo passo: escolher o papel
          >
            <FontAwesome name="google" size={20} color="#EA4335" />
            <Text style={styles.googleText}>Continuar com Google</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
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
  title: { fontSize: 28, fontWeight: 'bold', color: '#1F2937', marginTop: 20 },
  subtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginTop: 10 },
  buttonContainer: { gap: 15 },
  googleButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 18, 
    borderRadius: 15, 
    borderWidth: 1, 
    borderColor: '#E5E7EB',
    backgroundColor: '#fff'
  },
  googleText: { marginLeft: 12, fontSize: 16, fontWeight: '600' },
  backButton: { alignItems: 'center', padding: 10 },
  backText: { color: '#6B7280', textDecorationLine: 'underline' }
});