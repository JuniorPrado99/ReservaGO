import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity } from 'react-native';
import { PROPERTIES } from '../../constants/Properties';
import { useBookings } from '../../context/BookingContext';
import { Calendar, MapPin, ChevronRight } from 'lucide-react-native';

export default function BookingsScreen() {
  const { bookings } = useBookings();

  // Função para desenhar cada reserva na lista
  const renderBookingItem = ({ item }: { item: any }) => {
    // Procuramos os detalhes do imóvel usando o ID que está na reserva
    const property = PROPERTIES.find(p => p.id === item.propertyId);
    
    if (!property) return null;

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.8}>
        <Image source={{ uri: property.image }} style={styles.cardImage} />
        
        <View style={styles.cardInfo}>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusDot, 
              { backgroundColor: item.status === 'reservada' ? '#2D5A27' : '#6B7280' }
            ]} />
            <Text style={styles.statusText}>
              {item.status === 'reservada' ? 'Confirmada' : 'Realizada'}
            </Text>
          </View>

          <Text style={styles.cardTitle} numberOfLines={1}>{property.title}</Text>
          
          <View style={styles.detailsRow}>
            <Calendar size={12} color="#6B7280" />
            <Text style={styles.detailText}>{item.date}</Text>
          </View>

          <View style={styles.detailsRow}>
            <MapPin size={12} color="#6B7280" />
            <Text style={styles.detailText} numberOfLines={1}>{property.location}</Text>
          </View>
        </View>

        <View style={styles.arrowContainer}>
          <ChevronRight size={20} color="#E5E7EB" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Cabeçalho da Tela */}
      <View style={styles.header}>
        <Text style={styles.title}>Minhas Viagens</Text>
      </View>

      {/* Lista de Reservas */}
      {bookings.length > 0 ? (
        <FlatList
          data={bookings}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderBookingItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        /* Estado Vazio: O que aparece quando não há reservas */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Calendar size={40} color="#2D5A27" />
          </View>
          <Text style={styles.emptyTitle}>Ainda não tens reservas</Text>
          <Text style={styles.emptySub}>
            As tuas próximas aventuras aparecerão aqui assim que clicares em reservar.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { 
    paddingTop: 60, 
    paddingHorizontal: 20, 
    paddingBottom: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6' 
  },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1F2937' },
  list: { padding: 20, paddingBottom: 100 },
  
  card: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: '#F3F4F6', 
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardImage: { width: 100, height: 110 },
  cardInfo: { padding: 12, flex: 1, justifyContent: 'center' },
  
  statusContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' },
  
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  detailsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  detailText: { fontSize: 13, color: '#6B7280', marginLeft: 5 },
  
  arrowContainer: { justifyContent: 'center', paddingRight: 10 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIconCircle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: '#F0F7F0', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 20
  },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  emptySub: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginTop: 10, lineHeight: 22 }
});