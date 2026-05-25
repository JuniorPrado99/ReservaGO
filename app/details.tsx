import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  Linking,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  Heart,
  Star,
  MapPin,
  Wifi,
  Flame,
  Trees,
  Users,
  MessageCircle,
  Flag,
  ChevronRight,
  X,
  CreditCard,
  Check,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Footprints,
} from 'lucide-react-native';
import { useBookings } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';

const ISOLATION_MAP: Record<string, { emoji: string; title: string; sub: string }> = {
  urbano: {
    emoji: '🏘️',
    title: 'Vizinhos próximos',
    sub: 'Área residencial ou vila. Vizinhos a menos de 500m de distância.',
  },
  semi: {
    emoji: '🌲',
    title: 'Alguma privacidade',
    sub: 'Área rural tranquila, vizinhos a mais de 1km. Boa para descanso.',
  },
  isolado: {
    emoji: '🏕️',
    title: 'Você é a única alma aqui',
    sub: 'Vizinho mais próximo a mais de 3km, dentro de uma reserva particular.',
  },
  extremo: {
    emoji: '🌄',
    title: 'Isolamento total',
    sub: 'Acesso restrito. Natureza selvagem ao redor. Sem sinal de celular.',
  },
};

const DEFAULT_ISOLATION = {
  emoji: '🏕️',
  title: 'Informação não disponível',
  sub: 'O anfitrião não informou o nível de isolamento desta cabana.',
};

const REVIEWS = [
  { id: '1', author: 'Fernanda M.', avatar: 'https://i.pravatar.cc/100?img=1', rating: 5, date: 'Mar 2025', comment: 'Lugar incrível, silêncio total e natureza por todos os lados. Voltaremos com certeza!' },
  { id: '2', author: 'Rafael S.', avatar: 'https://i.pravatar.cc/100?img=3', rating: 5, date: 'Fev 2025', comment: 'Estrutura impecável, trilha privativa sensacional. Superou todas as expectativas.' },
];

const AMENITIES = [
  { icon: Wifi, label: 'Wi-Fi de alta velocidade' },
  { icon: Flame, label: 'Lareira a lenha' },
  { icon: Footprints, label: 'Trilha privativa' },
  { icon: Trees, label: 'Reserva particular' },
];

export default function DetailsScreen() {
  const router = useRouter();
  const { addBooking } = useBookings();
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  
  // ✅ hostId adicionado via desestruturação dos params locais
  const { id, title, price, location, description, image, isolationLevel, hostId } = useLocalSearchParams();
  const isFav = favorites.includes(id as string);

  const [modalVisible, setModalVisible] = useState(false);
  const [step, setStep] = useState<'dates' | 'payment'>('dates');
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectingDate, setSelectingDate] = useState<'checkIn' | 'checkOut'>('checkIn');
  const [payMethod, setPayMethod] = useState<'pix' | 'card'>('pix');
  const [reviewsModal, setReviewsModal] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'positive' | 'negative' | 'recent'>('all');

  const priceNum = Number(price) || 0;
  
  const nightCount = useMemo(() => {
    if (checkInDate && checkOutDate) {
      const start = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate());
      const end = new Date(checkOutDate.getFullYear(), checkOutDate.getMonth(), checkOutDate.getDate());
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 1;
    }
    return 1;
  }, [checkInDate, checkOutDate]);

  const datesAreValid = checkInDate !== null && checkOutDate !== null && checkOutDate > checkInDate;
  const subtotal = priceNum * nightCount;
  const serviceFee = subtotal * 0.1;
  const total = subtotal + serviceFee;

  const filteredReviews = useMemo(() => {
    let result = [...REVIEWS];
    if (reviewFilter === 'positive') result = result.filter(r => r.rating >= 4);
    return result;
  }, [reviewFilter]);

  const openReserveFlow = () => {
    if (!user) {
      Alert.alert('Perfil necessário', 'Você precisa estar logado para fazer uma reserva.', [
        { text: 'Depois' },
        { text: 'Login', onPress: () => router.push('../login') },
      ]);
      return;
    }
    setStep('dates');
    setModalVisible(true);
  };

  const confirmBooking = () => {
    // ✅ Agora enviando de forma correta e limpa o hostId exigido pelo banco do Supabase
    addBooking(id as string, {
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights: nightCount,
      payMethod,
      total: payMethod === 'pix' ? total * 0.95 : total,
      hostId: hostId as string, 
    });
    setModalVisible(false);
    Alert.alert('Reserva Confirmada! 🌿', 'Sua viagem foi registrada com sucesso.', [
      { text: 'Ver viagens', onPress: () => router.replace('/(tabs)/bookings') },
    ]);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Selecionar';
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  const openMap = () => {
    const query = encodeURIComponent(location as string);
    Linking.openURL(`http://maps.google.com/?q=${query}`);
  };

  const renderCalendarDays = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = [];
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstWeekDay = new Date(currentYear, currentMonth, 1).getDay();

    for (let i = 0; i < firstWeekDay; i++) {
      days.push(<View key={`empty-${i}`} style={{ width: 35, height: 35 }} />);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(currentYear, currentMonth, i);
      const isPast = dateObj < today;
      const isCheckIn = checkInDate?.getDate() === i && checkInDate?.getMonth() === currentMonth;
      const isCheckOut = checkOutDate?.getDate() === i && checkOutDate?.getMonth() === currentMonth;
      const isSelected = isCheckIn || isCheckOut;
      const isInRange = checkInDate && checkOutDate && dateObj > checkInDate && dateObj < checkOutDate && dateObj.getMonth() === currentMonth;

      days.push(
        <TouchableOpacity
          key={i}
          disabled={isPast}
          style={[
            styles.calDay,
            isSelected && styles.calDaySelected,
            isInRange && styles.calDayInRange,
            isPast && { opacity: 0.2 },
          ]}
          onPress={() => {
            if (selectingDate === 'checkIn') {
              setCheckInDate(dateObj);
              setCheckOutDate(null);
              setSelectingDate('checkOut');
            } else {
              if (checkInDate && dateObj <= checkInDate) {
                Alert.alert('Erro', 'O Check-out deve ser depois do Check-in.');
                return;
              }
              setCheckOutDate(dateObj);
              setCalendarVisible(false);
            }
          }}
        >
          <Text style={[styles.calDayText, isSelected && styles.calDayTextSelected, isInRange && styles.calDayTextInRange]}>{i}</Text>
        </TouchableOpacity>
      );
    }
    return days;
  };

  const isolationInfo = ISOLATION_MAP[String(isolationLevel).toLowerCase()] ?? DEFAULT_ISOLATION;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.imageHeader}>
          <Image source={{ uri: image as string }} style={styles.mainImage} />
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft color="#000" size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.heartButton} onPress={() => toggleFavorite(id as string)}>
            <Heart size={24} color={isFav ? '#FF385C' : '#fff'} fill={isFav ? '#FF385C' : 'rgba(0,0,0,0.3)'} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.row}>
            <MapPin size={14} color="#6B7280" />
            <Text style={styles.locationText}> {location}</Text>
          </View>
          <TouchableOpacity style={styles.ratingRow} onPress={() => setReviewsModal(true)}>
            <Star size={16} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.ratingValue}> 4,98</Text>
            <Text style={styles.ratingCount}> · {REVIEWS.length} avaliações</Text>
            <ChevronRight size={14} color="#9CA3AF" style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Sobre o lugar</Text>
          <Text style={styles.bodyText}>{description || 'Um refúgio único rodeado pela natureza.'}</Text>
          
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>🌿 Nível de isolamento</Text>
          <View style={styles.isolationCard}>
            <Text style={styles.isolationEmoji}>{isolationInfo.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.isolationTitle}>{isolationInfo.title}</Text>
              <Text style={styles.isolationSub}>{isolationInfo.sub}</Text>
            </View>
          </View>

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Comodidades</Text>
          <View style={styles.amenitiesGrid}>
            {AMENITIES.map((a, i) => (
              <View key={i} style={styles.amenityItem}>
                <a.icon size={22} color="#2D5A27" />
                <Text style={styles.amenityLabel}>{a.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Localização</Text>
          <TouchableOpacity style={styles.mapPlaceholder} onPress={openMap} activeOpacity={0.8}>
            <Image
              source={{ uri: `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(location as string)}&zoom=12&size=600x200&maptype=terrain&key=STATIC_MAP_MOCK` }}
              style={styles.mapImage}
            />
            <View style={styles.mapOverlay}>
              <MapPin size={20} color="#fff" />
              <Text style={styles.mapText}>Ver no mapa · {location}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerPrice}>R$ {price}</Text>
          <Text style={styles.footerNight}>por noite</Text>
        </View>
        <TouchableOpacity style={styles.reserveButton} onPress={openReserveFlow}>
          <Text style={styles.reserveText}>Reservar</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirmar sua viagem</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>
            {step === 'dates' && (
              <ScrollView style={{ padding: 20 }}>
                <View style={styles.dateRow}>
                  <TouchableOpacity style={styles.dateField} onPress={() => { setSelectingDate('checkIn'); setCalendarVisible(true); }}>
                    <Text style={styles.dateLabel}>CHECK-IN</Text>
                    <Text style={styles.dateInput}>{formatDate(checkInDate)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dateField} onPress={() => { setSelectingDate('checkOut'); setCalendarVisible(true); }}>
                    <Text style={styles.dateLabel}>CHECK-OUT</Text>
                    <Text style={styles.dateInput}>{formatDate(checkOutDate)}</Text>
                  </TouchableOpacity>
                </View>
                {calendarVisible && (
                  <View style={styles.calendarContainer}>
                    <View style={styles.calWeekRow}>
                      {['D','S','T','Q','Q','S','S'].map((d, idx) => <Text key={idx} style={styles.calWeekLabel}>{d}</Text>)}
                    </View>
                    <View style={styles.calendarGrid}>{renderCalendarDays()}</View>
                  </View>
                )}
                <TouchableOpacity style={[styles.advanceBtn, !datesAreValid && { backgroundColor: '#CCC' }]} disabled={!datesAreValid} onPress={() => setStep('payment')}>
                  <Text style={styles.advanceBtnText}>Continuar</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
            {step === 'payment' && (
              <View style={{ padding: 20 }}>
                <TouchableOpacity style={[styles.payOption, payMethod === 'pix' && styles.payOptionActive]} onPress={() => setPayMethod('pix')}>
                  <Text style={{ fontWeight: 'bold' }}>Pagar com PIX (5% OFF)</Text>
                  {payMethod === 'pix' && <Check size={20} color="#2D5A27" />}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.payOption, payMethod === 'card' && styles.payOptionActive]} onPress={() => setPayMethod('card')}>
                  <Text style={{ fontWeight: 'bold' }}>Cartão de Crédito</Text>
                  {payMethod === 'card' && <Check size={20} color="#2D5A27" />}
                </TouchableOpacity>
                <TouchableOpacity style={styles.advanceBtn} onPress={confirmBooking}>
                  <Text style={styles.advanceBtnText}>Confirmar Pagamento</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  imageHeader: { height: 350 },
  mainImage: { width: '100%', height: '100%' },
  backButton: { position: 'absolute', top: 50, left: 20, backgroundColor: '#fff', padding: 8, borderRadius: 25 },
  heartButton: { position: 'absolute', top: 50, right: 20, backgroundColor: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 25 },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold' },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  locationText: { color: '#6B7280' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  ratingValue: { fontWeight: 'bold' },
  ratingCount: { color: '#6B7280' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  bodyText: { color: '#4B5563', lineHeight: 22 },
  isolationCard: { flexDirection: 'row', backgroundColor: '#F0F7F0', padding: 16, borderRadius: 14, gap: 12, alignItems: 'flex-start' },
  isolationEmoji: { fontSize: 28 },
  isolationTitle: { fontSize: 15, fontWeight: '700' },
  isolationSub: { fontSize: 13, color: '#4B5563', marginTop: 4, lineHeight: 18 },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  amenityItem: { flexDirection: 'row', alignItems: 'center', width: '45%', gap: 8 },
  amenityLabel: { fontSize: 14 },
  mapPlaceholder: { height: 150, borderRadius: 14, overflow: 'hidden', backgroundColor: '#EEE' },
  mapImage: { width: '100%', height: '100%' },
  mapOverlay: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(0,0,0,0.4)', padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  mapText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderColor: '#EEE', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerPrice: { fontSize: 20, fontWeight: 'bold' },
  footerNight: { color: '#6B7280' },
  reserveButton: { backgroundColor: '#2D5A27', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12 },
  reserveText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '85%' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#DDD', alignSelf: 'center', marginVertical: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  dateRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#DDD', borderRadius: 12, marginBottom: 20 },
  dateField: { flex: 1, padding: 15, alignItems: 'center' },
  dateLabel: { fontSize: 10, fontWeight: 'bold', color: '#999' },
  dateInput: { fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  calendarContainer: { padding: 15, backgroundColor: '#F9F9F9', borderRadius: 12, marginBottom: 20 },
  calDay: { width: 35, height: 35, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#EEE' },
  calDayInRange: { backgroundColor: '#D1E8CF', borderColor: '#D1E8CF' },
  calDaySelected: { backgroundColor: '#2D5A27', borderColor: '#2D5A27' },
  calDayTextSelected: { color: '#fff', fontWeight: 'bold' },
  calDayTextInRange: { color: '#2D5A27', fontWeight: '600' },
  calWeekRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 6, gap: 5 },
  calWeekLabel: { width: 35, textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#9CA3AF' },
  calDayText: { fontSize: 12 },
  advanceBtn: { backgroundColor: '#2D5A27', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 20 },
  advanceBtnText: { color: '#fff', fontWeight: 'bold' },
  payOption: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderWidth: 1, borderColor: '#DDD', borderRadius: 12, marginBottom: 10 },
  payOptionActive: { borderColor: '#2D5A27', backgroundColor: '#F0F7F0' },
});