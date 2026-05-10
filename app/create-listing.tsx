import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Camera, MapPin, DollarSign, AlignLeft, Home } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker'; // <-- Importação nova

export default function CreateListingScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  
  // Novo estado para guardar a imagem escolhida
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Função para abrir a galeria
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9], // Formato legal para cabanas
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nova Cabana</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Nova Lógica de Upload de Foto */}
        <TouchableOpacity style={styles.photoUploadArea} activeOpacity={0.7} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
          ) : (
            <>
              <Camera size={32} color="#9CA3AF" />
              <Text style={styles.photoUploadText}>Adicionar Foto Principal</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Formulário (Mantido igual) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Título do Anúncio</Text>
          <View style={styles.inputWrapper}>
            <Home size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Ex: Refúgio das Araucárias" value={title} onChangeText={setTitle} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Localização</Text>
          <View style={styles.inputWrapper}>
            <MapPin size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Cidade e Estado" value={location} onChangeText={setLocation} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Valor por Noite (R$)</Text>
          <View style={styles.inputWrapper}>
            <DollarSign size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="0,00" keyboardType="numeric" value={price} onChangeText={setPrice} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descrição do Espaço</Text>
          <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
            <AlignLeft size={20} color="#9CA3AF" style={styles.textAreaIcon} />
            <TextInput style={[styles.input, styles.textArea]} placeholder="Fale um pouco sobre o que torna sua cabana especial..." multiline numberOfLines={5} textAlignVertical="top" value={description} onChangeText={setDescription} />
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Publicar Anúncio</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // ... (Mantenha todos os estilos que já estavam aí, e apenas adicione este abaixo no final):
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  photoUploadArea: { height: 180, backgroundColor: '#F9FAFB', borderRadius: 16, borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 25, overflow: 'hidden' }, // Adicionado overflow: 'hidden'
  photoUploadText: { color: '#6B7280', marginTop: 10, fontWeight: '500' },
  uploadedImage: { width: '100%', height: '100%', resizeMode: 'cover' }, // Novo estilo para a imagem selecionada
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#1F2937' },
  textAreaWrapper: { alignItems: 'flex-start', paddingTop: 14 },
  textAreaIcon: { marginRight: 10, marginTop: 2 },
  textArea: { height: 120, paddingTop: 0 },
  footer: { padding: 20, paddingBottom: 35, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  saveButton: { backgroundColor: '#2D5A27', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});