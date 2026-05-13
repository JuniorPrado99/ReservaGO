import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Camera, MapPin, DollarSign, AlignLeft, Home } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

// --- NÍVEIS DE ISOLAMENTO ---
const ISOLATION_LEVELS = [
  {
    id: 'urbano',
    emoji: '🏘️',
    label: 'Vizinhos próximos',
    description: 'Área residencial ou vila, vizinhos a menos de 500m.',
  },
  {
    id: 'semi',
    emoji: '🌲',
    label: 'Alguma privacidade',
    description: 'Área rural tranquila, vizinhos a mais de 1km.',
  },
  {
    id: 'isolado',
    emoji: '🏕️',
    label: 'Bem isolado',
    description: 'Vizinho mais próximo a mais de 3km. Silêncio total.',
  },
  {
    id: 'extremo',
    emoji: '🌄',
    label: 'Isolamento total',
    description: 'Acesso restrito. Natureza selvagem ao redor.',
  },
];

export default function CreateListingScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  // ✅ Novo estado para nível de isolamento
  const [isolationLevel, setIsolationLevel] = useState<string | null>(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
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

        {/* Upload de Foto */}
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

        {/* Título */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Título do Anúncio</Text>
          <View style={styles.inputWrapper}>
            <Home size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Ex: Refúgio das Araucárias"
              value={title}
              onChangeText={setTitle}
            />
          </View>
        </View>

        {/* Localização */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Localização</Text>
          <View style={styles.inputWrapper}>
            <MapPin size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Cidade e Estado"
              value={location}
              onChangeText={setLocation}
            />
          </View>
        </View>

        {/* Preço */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Valor por Noite (R$)</Text>
          <View style={styles.inputWrapper}>
            <DollarSign size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="0,00"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
          </View>
        </View>

        {/* Descrição */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descrição do Espaço</Text>
          <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
            <AlignLeft size={20} color="#9CA3AF" style={styles.textAreaIcon} />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Fale um pouco sobre o que torna sua cabana especial..."
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </View>

        {/* ✅ NÍVEL DE ISOLAMENTO */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nível de Isolamento</Text>
          <Text style={styles.labelSub}>Ajuda hóspedes a entender o quanto sua cabana é remota.</Text>
          <View style={styles.isolationGrid}>
            {ISOLATION_LEVELS.map((level) => {
              const isSelected = isolationLevel === level.id;
              return (
                <TouchableOpacity
                  key={level.id}
                  style={[styles.isolationCard, isSelected && styles.isolationCardActive]}
                  onPress={() => setIsolationLevel(level.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.isolationEmoji}>{level.emoji}</Text>
                  <Text style={[styles.isolationLabel, isSelected && styles.isolationLabelActive]}>
                    {level.label}
                  </Text>
                  <Text style={[styles.isolationDesc, isSelected && styles.isolationDescActive]}>
                    {level.description}
                  </Text>
                  {isSelected && (
                    <View style={styles.isolationCheckBadge}>
                      <Text style={styles.isolationCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
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
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  scrollContent: { padding: 20, paddingBottom: 100 },

  photoUploadArea: {
    height: 180, backgroundColor: '#F9FAFB', borderRadius: 16,
    borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', marginBottom: 25, overflow: 'hidden',
  },
  photoUploadText: { color: '#6B7280', marginTop: 10, fontWeight: '500' },
  uploadedImage: { width: '100%', height: '100%', resizeMode: 'cover' },

  inputGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 },
  labelSub: { fontSize: 12, color: '#9CA3AF', marginBottom: 12 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#1F2937' },
  textAreaWrapper: { alignItems: 'flex-start', paddingTop: 14 },
  textAreaIcon: { marginRight: 10, marginTop: 2 },
  textArea: { height: 120, paddingTop: 0 },

  footer: {
    padding: 20, paddingBottom: 35, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  saveButton: { backgroundColor: '#2D5A27', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // ✅ Estilos do Seletor de Isolamento
  isolationGrid: { gap: 12 },
  isolationCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    position: 'relative',
  },
  isolationCardActive: {
    borderColor: '#2D5A27',
    backgroundColor: '#F0F7F0',
  },
  isolationEmoji: { fontSize: 24, marginBottom: 6 },
  isolationLabel: {
    fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 3,
  },
  isolationLabelActive: { color: '#2D5A27' },
  isolationDesc: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  isolationDescActive: { color: '#374151' },
  isolationCheckBadge: {
    position: 'absolute', top: 14, right: 14,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#2D5A27',
    alignItems: 'center', justifyContent: 'center',
  },
  isolationCheckText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
});