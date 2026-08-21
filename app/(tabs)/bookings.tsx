import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import { useListings } from '../../context/ListingContext';
import { useBookings } from '../../context/BookingContext';
import { Calendar, MapPin, ChevronRight, X, CreditCard } from 'lucide-react-native';
import { useRouter } from 'expo-router';

type Booking = {
  propertyId: string;
  status: string;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  date?: string;
  total?: number;
  payMethod?: string;
};

export default function BookingsScreen() {
  const { bookings, cancelBooking } = useBookings();
  const { allProperties } = useListings();
  const router = useRouter();

  const handleCancel = (propertyId: string, propertyTitle: string) => {
    Alert.alert(
      'Cancelar reserva',
      `Tem certeza que deseja cancelar a reserva de "${propertyTitle}"?`,
      [
        { text: 'Não', style: 'cancel' },
        { text: 'Sim, cancelar', style: 'destructive', onPress: () => cancelBooking(propertyId) },
      ]
    );
  };

  const renderBookingItem = ({ item }: { item: Booking }) => {
    const property = allProperties.find((p) => p.id === item.propertyId);
    if (!property) return null;
    const isActive = item.status === 'reservada';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() =>
          router.push({
            pathname: '/details',
            params: {
              id: property.id,
              title: property.title,
              price: String(property.price),
              location: property.location,
              description: property.description,
              image: property.image,
              isolationLevel: property.isolationLevel,
              hostId: property.hostId,
            },
          })
        }
      >
        <Image source={{ uri: property.image ?? undefined }} style={styles.cardImage} />
        <View style={styles.cardInfo}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: isActive ? '#2D5A27' : '#9CA3AF' }]} />
            <Text style={styles.statusText}>{isActive ? 'Confirmada' : 'Realizada'}</Text>
          </View>
          <Text style={styles.cardTitle} numberOfLines={1}>{property.title}</Text>
          <View style={styles.detailsRow}>
            <Calendar size={12} color="#6B7280" />
            <Text style={styles.detailText}>
              {item.checkIn && item.checkOut
                ? `${item.checkIn} → ${item.checkOut}${item.nights ? ` · ${item.nights} noite${item.nights > 1 ? 's' : ''}` : ''}`
                : item.date}
            </Text>
          </View>
          <View style={styles.detailsRow}>
            <MapPin size={12} color="#6B7280" />
            <Text style={styles.detailText} numberOfLines={1}>{property.location}</Text>
          </View>
          {item.total && (
            <View style={styles.detailsRow}>
              <CreditCard size={12} color="#6B7280" />
              <Text style={styles.detailText}>
                {item.payMethod === 'pix' ? 'PIX' : 'Cartão'} · R$ {item.total.toFixed(2)}
              </Text>
            </View>
          )}
          {isActive && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => handleCancel(property.id, property.title)}
            >
              <X size={12} color="#EF4444" />
              <Text style={styles.cancelBtnText}>Cancelar reserva</Text>
            </TouchableOpacity>
          )}
        </View>
        <ChevronRight size={20} color="#E5E7EB" style={{ alignSelf: 'center' }} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Minhas Viagens</Text>
      </View>
      {bookings.length > 0 ? (
        <FlatList
          data={bookings}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderBookingItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
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
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1F2937' },
  list: { padding: 20, paddingBottom: 100 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6', overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  cardImage: { width: 100, height: '100%', minHeight: 130 },
  cardInfo: { padding: 12, flex: 1, justifyContent: 'center' },
  statusContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  detailsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  detailText: { fontSize: 13, color: '#6B7280', marginLeft: 5 },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, paddingVertical: 5, paddingHorizontal: 8, backgroundColor: '#FEF2F2', borderRadius: 8, alignSelf: 'flex-start' },
  cancelBtnText: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0F7F0', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  emptySub: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginTop: 10, lineHeight: 22 },
});