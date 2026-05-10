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
  Calendar,
  CreditCard,
  Check,
  ShieldCheck,
  Clock,
  Ban,
  AlertTriangle,
  Footprints,
} from 'lucide-react-native';
import { useBookings } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';

// ─── Dados estáticos de exemplo ───────────────────────────────────────────────
const REVIEWS = [
  {
    id: '1',
    author: 'Fernanda M.',
    avatar: 'https://i.pravatar.cc/100?img=1',
    rating: 5,
    date: 'Mar 2025',
    comment: 'Lugar incrível, silêncio total e natureza por todos os lados. Voltaremos com certeza!',
  },
  {
    id: '2',
    author: 'Rafael S.',
    avatar: 'https://i.pravatar.cc/100?img=3',
    rating: 5,
    date: 'Fev 2025',
    comment: 'Estrutura impecável, trilha privativa sensacional. Superou todas as expectativas.',
  },
  {
    id: '3',
    author: 'Juliana K.',
    avatar: 'https://i.pravatar.cc/100?img=5',
    rating: 2,
    date: 'Jan 2025',
    comment: 'Achei o acesso muito difícil à noite e choveu muito, o que estragou um pouco a experiência.',
  },
  {
    id: '4',
    author: 'Carlos T.',
    avatar: 'https://i.pravatar.cc/100?img=8',
    rating: 4,
    date: 'Abr 2025',
    comment: 'Muito bonito e tranquilo. A lareira é um charme à parte.',
  },
];

const AMENITIES = [
  { icon: Wifi, label: 'Wi-Fi de alta velocidade' },
  { icon: Flame, label: 'Lareira a lenha' },
  { icon: Footprints, label: 'Trilha privativa' },
  { icon: Trees, label: 'Reserva particular' },
];

// ─── Componente principal ──────────────────────────────────────────────────────
export default function DetailsScreen() {
  const router = useRouter();
  const { addBooking } = useBookings();
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();

  const { id, title, price, location, description, image } = useLocalSearchParams();
  const isFav = favorites.includes(id as string);

  // Estados do Modal e Reserva
  const [modalVisible, setModalVisible] = useState(false);
  const [step, setStep] = useState<'dates' | 'payment'>('dates');
  
  // Datas e Calendário
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectingDate, setSelectingDate] = useState<'checkIn' | 'checkOut'>('checkIn');

  const [guests, setGuests] = useState('1');
  const [payMethod, setPayMethod] = useState<'pix' | 'card'>('pix');

  // Modal avaliações e filtros
  const [reviewsModal, setReviewsModal] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'positive' | 'negative' | 'recent'>('all');

  const priceNum = Number(price) || 0;

  // ── CÁLCULO DINÂMICO DE PREÇO (RESTAURADO E CORRIGIDO) ────────────────────────
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

  // Filtro de Avaliações
  const filteredReviews = useMemo(() => {
    let result = [...REVIEWS];
    if (reviewFilter === 'positive') result = result.filter(r => r.rating >= 4);
    else if (reviewFilter === 'negative') result = result.filter(r => r.rating <= 3);
    else if (reviewFilter === 'recent') result = [...result].reverse();
    return result;
  }, [reviewFilter]);

  // ── Funções ──────────────────────────────────────────────────────────────────
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
    addBooking(id as string);
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
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const renderCalendarDays = () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const days = [];
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(currentYear, currentMonth, i);
      const isPast = dateObj < today;
      let isSelected = (checkInDate?.getDate() === i && checkInDate?.getMonth() === currentMonth) || 
                       (checkOutDate?.getDate() === i && checkOutDate?.getMonth() === currentMonth);

      days.push(
        <TouchableOpacity 
          key={i} 
          disabled={isPast}
          style={[styles.calDay, isSelected && styles.calDaySelected, isPast && { opacity: 0.2 }]}
          onPress={() => {
            if (selectingDate === 'checkIn') {
              setCheckInDate(dateObj);
              setSelectingDate('checkOut');
            } else {
              if (checkInDate && dateObj <= checkInDate) {
                Alert.alert("Erro", "O Check-out deve ser depois do Check-in.");
                return;
              }
              setCheckOutDate(dateObj);
              setCalendarVisible(false);
            }
          }}
        >
          <Text style={[styles.calDayText, isSelected && styles.calDayTextSelected]}>{i}</Text>
        </TouchableOpacity>
      );
    }
    return days;
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* HERO IMAGE */}
        <View style={styles.imageHeader}>
          <Image source={{ uri: image as string }} style={styles.mainImage} />
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft color="#000" size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.heartButton} onPress={() => toggleFavorite(id as string)}>
            <Heart size={24} color={isFav ? '#FF385C' : '#fff'} fill={isFav ? '#FF385C' : 'rgba(0,0,0,0.3)'} />
          </TouchableOpacity>
        </View>

        {/* CONTEÚDO RESTAURADO */}
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
          <Text style={styles.bodyText}>
            {description || 'Um refúgio único rodeado pela natureza, perfeito para quem busca descanso e privacidade total.'}
          </Text>

          <View style={styles.divider} />

          {/* SEÇÃO DE ISOLAMENTO (RESTAURADA) */}
          <Text style={styles.sectionTitle}>🌿 Nível de isolamento</Text>
          <View style={styles.isolationCard}>
            <Text style={styles.isolationEmoji}>🏕️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.isolationTitle}>Você é a única alma aqui</Text>
              <Text style={styles.isolationSub}>O vizinho mais próximo fica a 4,5 km de distância, dentro de uma reserva particular.</Text>
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

          {/* LOCALIZAÇÃO (RESTAURADA) */}
          <Text style={styles.sectionTitle}>Localização</Text>
          <TouchableOpacity style={styles.mapPlaceholder} onPress={openMap} activeOpacity={0.8}>
            <Image
              source={{ uri: `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(location as string)}&zoom=12&size=600x200&maptype=terrain` }}
              style={styles.mapImage}
            />
            <View style={styles.mapOverlay}>
              <MapPin size={20} color="#fff" />
              <Text style={styles.mapText}>Ver no mapa · {location}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* DIRETRIZES (RESTAURADA) */}
          <Text style={styles.sectionTitle}>Diretrizes da hospedagem</Text>
          <View style={styles.rulesList}>
            <RuleRow icon={Users} text="Máximo de 4 hóspedes" />
            <RuleRow icon={Clock} text="Check-in: 14h · Check-out: 11h" />
            <RuleRow icon={ShieldCheck} text="Extintor e kit de primeiros socorros" />
            <RuleRow icon={AlertTriangle} text="Cancelamento gratuito até 7 dias" />
          </View>

          <View style={styles.divider} />

          {/* ANFITRIÃO (RESTAURADO) */}
          <Text style={styles.sectionTitle}>Anfitrião</Text>
          <View style={styles.hostCard}>
            <Image source={{ uri: 'https://i.pravatar.cc/100?img=12' }} style={styles.hostAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.hostName}>Carlos Mendes</Text>
              <Text style={styles.hostSub}>Superhost ⭐ · No ReservaGO desde 2022</Text>
            </View>
            <TouchableOpacity style={styles.contactBtn} onPress={() => Alert.alert('Chat', 'Abrindo conversa...')}>
              <MessageCircle size={18} color="#2D5A27" />
              <Text style={styles.contactBtnText}>Contato</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.reportButton} onPress={() => Alert.alert('Denúncia', 'Recebemos seu relato.')}>
            <Flag size={16} color="#EF4444" />
            <Text style={styles.reportText}>Denunciar este anúncio</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* FOOTER FIXO */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerPrice}>R$ {price}</Text>
          <Text style={styles.footerNight}>por noite</Text>
        </View>
        <TouchableOpacity style={styles.reserveButton} onPress={openReserveFlow}>
          <Text style={styles.reserveText}>Reservar</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL RESERVA COMPLETO */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirmar sua viagem</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><X size={24} color="#000" /></TouchableOpacity>
            </View>

            {step === 'dates' && (
              <ScrollView style={{ padding: 20 }}>
                <View style={styles.dateRow}>
                  <TouchableOpacity style={styles.dateField} onPress={() => {setSelectingDate('checkIn'); setCalendarVisible(true)}}>
                    <Text style={styles.dateLabel}>CHECK-IN</Text>
                    <Text style={styles.dateInput}>{formatDate(checkInDate)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dateField} onPress={() => {setSelectingDate('checkOut'); setCalendarVisible(true)}}>
                    <Text style={styles.dateLabel}>CHECK-OUT</Text>
                    <Text style={styles.dateInput}>{formatDate(checkOutDate)}</Text>
                  </TouchableOpacity>
                </View>

                {calendarVisible && (
                  <View style={styles.calendarContainer}>
                    <Text style={{fontWeight:'bold', marginBottom:10, textAlign:'center'}}>
                      Selecione {selectingDate === 'checkIn' ? 'entrada' : 'saída'}
                    </Text>
                    <View style={styles.calendarGrid}>{renderCalendarDays()}</View>
                  </View>
                )}

                <View style={styles.priceSummary}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>R$ {price} x {nightCount} noites</Text>
                    <Text style={styles.priceValue}>R$ {subtotal.toFixed(2)}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Taxa de serviço (10%)</Text>
                    <Text style={styles.priceValue}>R$ {serviceFee.toFixed(2)}</Text>
                  </View>
                  <View style={[styles.priceRow, {marginTop:10, borderTopWidth:1, borderColor:'#EEE', paddingTop:10}]}>
                    <Text style={{fontWeight:'bold', fontSize:16}}>Total</Text>
                    <Text style={{fontWeight:'bold', fontSize:16, color:'#2D5A27'}}>R$ {total.toFixed(2)}</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.advanceBtn, !datesAreValid && {backgroundColor:'#CCC'}]} 
                  disabled={!datesAreValid}
                  onPress={() => setStep('payment')}
                >
                  <Text style={styles.advanceBtnText}>Continuar</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {step === 'payment' && (
              <View style={{ padding: 20 }}>
                <TouchableOpacity style={[styles.payOption, payMethod === 'pix' && styles.payOptionActive]} onPress={() => setPayMethod('pix')}>
                   <Text style={{fontWeight:'bold'}}>Pagar com PIX (5% OFF)</Text>
                   {payMethod === 'pix' && <Check size={20} color="#2D5A27" />}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.payOption, payMethod === 'card' && styles.payOptionActive]} onPress={() => setPayMethod('card')}>
                   <Text style={{fontWeight:'bold'}}>Cartão de Crédito</Text>
                   {payMethod === 'card' && <Check size={20} color="#2D5A27" />}
                </TouchableOpacity>
                <Text style={{textAlign:'center', marginTop:20, fontSize:18, fontWeight:'bold'}}>
                  Total: R$ {payMethod === 'pix' ? (total * 0.95).toFixed(2) : total.toFixed(2)}
                </Text>
                <TouchableOpacity style={styles.advanceBtn} onPress={confirmBooking}>
                  <Text style={styles.advanceBtnText}>Confirmar Pagamento</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL AVALIAÇÕES COM FILTROS */}
      <Modal visible={reviewsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { height: '85%' }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Avaliações</Text>
              <TouchableOpacity onPress={() => setReviewsModal(false)}><X size={24} color="#000" /></TouchableOpacity>
            </View>
            <View style={styles.filterBar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['all', 'positive', 'negative', 'recent'].map((f) => (
                  <TouchableOpacity 
                    key={f} 
                    style={[styles.filterChip, reviewFilter === f && styles.filterActive]} 
                    onPress={() => setReviewFilter(f as any)}
                  >
                    <Text style={reviewFilter === f ? {color:'#fff'} : {color:'#666'}}>
                      {f === 'all' ? 'Todas' : f === 'positive' ? 'Positivas' : f === 'negative' ? 'Críticas' : 'Recentes'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <FlatList
              data={filteredReviews}
              keyExtractor={item => item.id}
              contentContainerStyle={{ padding: 20 }}
              renderItem={({ item }) => (
                <View style={styles.reviewItem}>
                   <View style={{flexDirection:'row', gap:10, marginBottom:5}}>
                      <Image source={{uri: item.avatar}} style={{width:40, height:40, borderRadius:20}} />
                      <View>
                        <Text style={{fontWeight:'bold'}}>{item.author}</Text>
                        <Text style={{fontSize:12, color:'#999'}}>{item.date}</Text>
                      </View>
                   </View>
                   <Text style={{color:'#444'}}>{item.comment}</Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Helper das Regras
function RuleRow({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.ruleRow}>
      <Icon size={18} color="#4B5563" />
      <Text style={styles.ruleText}>{text}</Text>
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
  isolationCard: { flexDirection: 'row', backgroundColor: '#F0F7F0', padding: 16, borderRadius: 14, gap: 12 },
  isolationEmoji: { fontSize: 28 },
  isolationTitle: { fontSize: 15, fontWeight: '700' },
  isolationSub: { fontSize: 13, color: '#4B5563', marginTop: 4 },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  amenityItem: { flexDirection: 'row', alignItems: 'center', width: '45%', gap: 8 },
  amenityLabel: { fontSize: 14 },
  mapPlaceholder: { height: 150, borderRadius: 14, overflow: 'hidden', backgroundColor: '#EEE' },
  mapImage: { width: '100%', height: '100%' },
  mapOverlay: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(0,0,0,0.4)', padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  mapText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  rulesList: { gap: 12 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ruleText: { color: '#4B5563' },
  hostCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 15, borderRadius: 14, borderWidth: 1, borderColor: '#EEE' },
  hostAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  hostName: { fontWeight: 'bold' },
  hostSub: { fontSize: 12, color: '#6B7280' },
  contactBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#E8F5E9', padding: 10, borderRadius: 10 },
  contactBtnText: { color: '#2D5A27', fontWeight: 'bold', fontSize: 12 },
  reportButton: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  reportText: { color: '#EF4444', textDecorationLine: 'underline' },
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
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center' },
  calDay: { width: 35, height: 35, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#EEE' },
  calDaySelected: { backgroundColor: '#2D5A27' },
  calDayText: { fontSize: 12 },
  calDayTextSelected: { color: '#fff', fontWeight: 'bold' },
  priceSummary: { backgroundColor: '#F9FAFB', padding: 15, borderRadius: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLabel: { color: '#666' },
  priceValue: { fontWeight: 'bold' },
  advanceBtn: { backgroundColor: '#2D5A27', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 20 },
  advanceBtnText: { color: '#fff', fontWeight: 'bold' },
  payOption: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderWidth: 1, borderColor: '#DDD', borderRadius: 12, marginBottom: 10 },
  payOptionActive: { borderColor: '#2D5A27', backgroundColor: '#F0F7F0' },
  filterBar: { paddingHorizontal: 20, marginBottom: 10 },
  filterChip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 10 },
  filterActive: { backgroundColor: '#2D5A27' },
  reviewItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
});