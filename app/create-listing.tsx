import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, MapPin, DollarSign, AlignLeft, Info } from 'lucide-react-native';

export default function CreateListingScreen() {
  const router = useRouter();
  
  // Estados do formulário
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = () => {
    if (!title || !price || !location) {
      Alert.alert("Erro", "Por favor, preencha os campos principais.");
      return;
    }

    // Aqui no futuro enviaremos para o Banco de Dados (Supabase/Firebase)
    Alert.alert(
      "Sucesso!",
      "Sua cabana foi enviada para análise do Administrador.",
      [{ text: "OK", onPress: () => router.back() }]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Anunciar Cabana</Text>
        <Text style={styles.headerSub}>Preencha os detalhes para atrair hóspedes.</Text>
      </View>

      <View style={styles.form}>
        {/* Upload de Foto (Simulado) */}
        <TouchableOpacity style={styles.photoUpload}>
          <Camera size={32} color="#2D5A27" />
          <Text style={styles.photoText}>Adicionar Fotos</Text>
        </TouchableOpacity>

        {/* Campo: Título */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome da Cabana</Text>
          <View style={styles.inputWrapper}>
            <Info size={18} color="#9CA3AF" style={{ marginRight: 10 }} />
            <TextInput 
              style={styles.input} 
              placeholder="Ex: Cabana do Lago Luxo"
              value={title}
              onChangeText={setTitle}
            />
          </View>
        </View>

        {/* Campo: Localização */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Onde ela fica?</Text>
          <View style={styles.inputWrapper}>
            <MapPin size={18} color="#9CA3AF" style={{ marginRight: 10 }} />
            <TextInput 
              style={styles.input} 
              placeholder="Ex: Campos do Jordão, SP"
              value={location}
              onChangeText={setLocation}
            />
          </View>
        </View>

        {/* Campo: Preço */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Preço por Noite</Text>
          <View style={styles.inputWrapper}>
            <DollarSign size={18} color="#9CA3AF" style={{ marginRight: 10 }} />
            <TextInput 
              style={styles.input} 
              placeholder="Ex: 450"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
          </View>
        </View>

        {/* Campo: Descrição */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descrição detalhada</Text>
          <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingTop: 12 }]}>
            <AlignLeft size={18} color="#9CA3AF" style={{ marginRight: 10 }} />
            <TextInput 
              style={[styles.input, { height: 100 }]} 
              placeholder="Conte sobre o conforto, vista, Wi-Fi..."
              multiline
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSave}>
          <Text style={styles.submitText}>Publicar Anúncio</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 25, paddingTop: 60, backgroundColor: '#F0F7F0' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  headerSub: { fontSize: 14, color: '#4B5563', marginTop: 5 },
  form: { padding: 20 },
  photoUpload: { 
    height: 150, 
    backgroundColor: '#F9FAFB', 
    borderRadius: 15, 
    borderWidth: 2, 
    borderColor: '#E5E7EB', 
    borderStyle: 'dashed', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 25
  },
  photoText: { marginTop: 10, color: '#2D5A27', fontWeight: '600' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F9FAFB', 
    borderRadius: 12, 
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#1F2937' },
  submitButton: { 
    backgroundColor: '#2D5A27', 
    padding: 18, 
    borderRadius: 15, 
    alignItems: 'center', 
    marginTop: 10 
  },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});