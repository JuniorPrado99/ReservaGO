import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Plus, Edit, Trash2, TrendingUp, CalendarDays, MapPin } from 'lucide-react-native';

const MY_CABINS = [
  { 
    id: '1', 
    title: 'Cabana das Montanhas', 
    location: 'Campos do Jordão, SP', 
    price: 450, 
    image: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=400&q=80', 
    bookings: 3 
  },
  { 
    id: '2', 
    title: 'Refúgio de Inverno', 
    location: 'Gramado, RS', 
    price: 600, 
    image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=400&q=80', 
    bookings: 1 
  },
];

export default function MyCabinsScreen() {
  const router = useRouter();

  const handleDelete = (title: string) => {
    Alert.alert('Excluir Anúncio', `Tem certeza que deseja remover "${title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive' }
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Painel do Anfitrião</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        
        {/* Estatísticas Rápidas */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <TrendingUp size={24} color="#2D5A27" />
            <Text style={styles.statValue}>R$ 3.450</Text>
            <Text style={styles.statLabel}>Ganhos no mês</Text>
          </View>
          <View style={styles.statCard}>
            <CalendarDays size={24} color="#F59E0B" />
            <Text style={styles.statValue}>4</Text>
            <Text style={styles.statLabel}>Reservas ativas</Text>
          </View>
        </View>

        {/* Lista de Cabanas */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Minhas Cabanas ({MY_CABINS.length})</Text>
        </View>

        {MY_CABINS.map((cabin) => (
          <View key={cabin.id} style={styles.cabinCard}>
            <Image source={{ uri: cabin.image }} style={styles.cabinImage} />
            
            <View style={styles.cabinInfo}>
              <Text style={styles.cabinTitle} numberOfLines={1}>{cabin.title}</Text>
              
              <View style={styles.cabinLocationRow}>
                <MapPin size={14} color="#6B7280" />
                <Text style={styles.cabinLocation}>{cabin.location}</Text>
              </View>
              
              <Text style={styles.cabinPrice}>R$ {cabin.price} <Text style={styles.perNight}>/ noite</Text></Text>
              
              {cabin.bookings > 0 && (
                <View style={styles.bookingBadge}>
                  <Text style={styles.bookingBadgeText}>{cabin.bookings} reserva(s) em breve</Text>
                </View>
              )}
            </View>

            {/* Ações */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionBtn}>
                <Edit size={18} color="#4B5563" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(cabin.title)}>
                <Trash2 size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Botão Flutuante para Novo Anúncio */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8}
        onPress={() => router.push('/create-listing')}
      >
        <Plus size={24} color="#fff" />
        <Text style={styles.fabText}>Novo Anúncio</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  
  statsContainer: { flexDirection: 'row', gap: 15, marginBottom: 30 },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },

  cabinCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    overflow: 'hidden',
  },
  cabinImage: { width: 100, height: '100%', resizeMode: 'cover' },
  cabinInfo: { flex: 1, padding: 12 },
  cabinTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  cabinLocationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cabinLocation: { fontSize: 12, color: '#6B7280', marginLeft: 4 },
  cabinPrice: { fontSize: 15, fontWeight: 'bold', color: '#2D5A27', marginBottom: 8 },
  perNight: { fontSize: 12, color: '#6B7280', fontWeight: 'normal' },
  
  bookingBadge: {
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bookingBadgeText: { fontSize: 10, color: '#D97706', fontWeight: 'bold' },

  actionButtons: { justifyContent: 'center', padding: 10, borderLeftWidth: 1, borderLeftColor: '#F3F4F6', backgroundColor: '#F9FAFB' },
  actionBtn: { padding: 10, marginVertical: 4, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },

  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#2D5A27',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  fabText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
});