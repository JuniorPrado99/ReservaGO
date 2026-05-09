import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { User, Home, ShieldCheck } from 'lucide-react-native';

export default function SelectRoleScreen() {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();

  // Estado para o "Segredo" do Admin — agora exige 10 cliques
  const [adminVisible, setAdminVisible] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const handleAdminUnlock = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    // Libera o botão secreto somente após 10 cliques
    if (newCount === 10) {
      setAdminVisible(true);
      Alert.alert(
        'Modo Desenvolvedor',
        'Acesso administrativo liberado para esta sessão.',
      );
    }
  };

  const handleSelection = (role: 'hospede' | 'anfitriao' | 'admin') => {
    loginWithGoogle(role);
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      {/* Clicar no título 10 vezes desbloqueia o botão Admin */}
      <TouchableOpacity onPress={handleAdminUnlock} activeOpacity={1}>
        <Text style={styles.title}>Como você prefere usar o app?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => handleSelection('hospede')}
      >
        <User size={32} color="#2D5A27" />
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>Sou Hóspede</Text>
          <Text style={styles.cardSub}>Quero buscar e reservar cabanas.</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => handleSelection('anfitriao')}
      >
        <Home size={32} color="#2D5A27" />
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>Sou Anfitrião</Text>
          <Text style={styles.cardSub}>
            Quero anunciar meu imóvel e ganhar dinheiro.
          </Text>
        </View>
      </TouchableOpacity>

      {/* Botão de Admin — só aparece após 10 cliques no título */}
      {adminVisible && (
        <TouchableOpacity
          style={[styles.card, styles.adminCard]}
          onPress={() => handleSelection('admin')}
        >
          <ShieldCheck size={24} color="#6B7280" />
          <Text style={styles.adminText}>Acesso Admin</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 25,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    backgroundColor: '#F9FAFB',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardText: { marginLeft: 15 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  cardSub: { fontSize: 14, color: '#6B7280' },
  adminCard: {
    marginTop: 30,
    opacity: 0.7,
    backgroundColor: '#fff',
    borderStyle: 'dashed',
  },
  adminText: { marginLeft: 10, color: '#6B7280', fontWeight: '500' },
});
