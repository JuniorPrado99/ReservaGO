import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
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
  Phone,
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
    comment:
      'Lugar incrível, silêncio total e natureza por todos os lados. Voltaremos com certeza!',
  },
  {
    id: '2',
    author: 'Rafael S.',
    avatar: 'https://i.pravatar.cc/100?img=3',
    rating: 5,
    date: 'Fev 2025',
    comment:
      'Estrutura impecável, trilha privativa sensacional. Superou todas as expectativas.',
  },
  {
    id: '3',
    author: 'Juliana K.',
    avatar: 'https://i.pravatar.cc/100?img=5',
    rating: 4,
    date: 'Jan 2025',
    comment:
      'Muito bonito e tranquilo. O único ponto foi a chegada um pouco difícil à noite.',
  },
];

const AMENITIES = [
  { icon: Wifi, label: 'Wi-Fi de alta velocidade' },
  { icon: Flame, label: 'Lareira a lenha' },
  { icon: Footprints, label: 'Trilha privativa' },
  { icon: Trees, label: 'Reserva particular' },
];

// ─── Funções utilitárias de data ───────────────────────────────────────────────

/**
 * Converte string "DD/MM/AAAA" em objeto Date.
 * Retorna null se o formato for inválido.
 */
function parseDate(str: string): Date | null {
  const parts = str.split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y || y < 2024) return null;
  const date = new Date(y, m - 1, d);
  // Verifica se a data é válida (ex: 31/02 ficaria fora do mês)
  if (
    date.getDate() !== d ||
    date.getMonth() !== m - 1 ||
    date.getFullYear() !== y
  )
    return null;
  return date;
}

/**
 * Calcula diferença em noites entre check-in e check-out.
 * Retorna null se alguma data for inválida ou checkout <= checkin.
 */
function calcNights(checkIn: string, checkOut: string): number | null {
  const d1 = parseDate(checkIn);
  const d2 = parseDate(checkOut);
  if (!d1 || !d2) return null;
  const diff = Math.round(
    (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24),
  );
  return diff > 0 ? diff : null;
}

// ─── Componente principal ──────────────────────────────────────────────────────
export default function DetailsScreen() {
  const router = useRouter();
  const { addBooking } = useBookings();
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();

  const { id, title, price, location, description, image } =
    useLocalSearchParams();
  const isFav = favorites.includes(id as string);

  // Modal de reserva – etapas: 'dates' | 'payment'
  const [modalVisible, setModalVisible] = useState(false);
  const [step, setStep] = useState<'dates' | 'payment'>('dates');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('1');
  const [payMethod, setPayMethod] = useState<'pix' | 'card'>('pix');

  // Modal avaliações
  const [reviewsModal, setReviewsModal] = useState(false);

  const priceNum = Number(price) || 0;

  // ── CÁLCULO DINÂMICO DE NOITES ──────────────────────────────────────────────
  // Se as datas forem válidas, usa a diferença real; caso contrário, usa 1 como
  // placeholder para não exibir valor zerado antes de preencher.
  const nightCount = calcNights(checkIn, checkOut) ?? 1;
  const datesAreValid = calcNights(checkIn, checkOut) !== null;

  const subtotal = priceNum * nightCount;
  const serviceFee = subtotal * 0.1;
  const total = subtotal + serviceFee;

  // ── Funções ──────────────────────────────────────────────────────────────────
  const openReserveFlow = () => {
    if (!user) {
      Alert.alert(
        'Perfil necessário',
        'Você precisa estar logado para fazer uma reserva.',
        [
          { text: 'Depois', style: 'cancel' },
          { text: 'Fazer Login', onPress: () => router.push('../login') },
        ],
      );
      return;
    }
    setStep('dates');
    setModalVisible(true);
  };

  const handleAdvanceToPayment = () => {
    if (!datesAreValid) {
      Alert.alert(
        'Datas inválidas',
        'Preencha o check-in e o check-out no formato DD/MM/AAAA e verifique se o check-out é posterior ao check-in.',
      );
      return;
    }
    setStep('payment');
  };

  const confirmBooking = () => {
    addBooking(id as string);
    setModalVisible(false);
    Alert.alert('Reserva Confirmada! 🌿', 'Sua viagem foi registrada com sucesso.', [
      {
        text: 'Ver minhas viagens',
        onPress: () => router.replace('/(tabs)/bookings'),
      },
    ]);
  };

  const openMap = () => {
    const query = encodeURIComponent(location as string);
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${query}`,
    );
  };

  const openHostContact = () => {
    Alert.alert('Contato do Anfitrião', 'Deseja iniciar uma conversa?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Ir para Mensagens',
        onPress: () => router.push('/(tabs)/messages'),
      },
    ]);
  };

  const handleReport = () => {
    Alert.alert(
      'Denunciar Anúncio',
      'Tem certeza que deseja denunciar este anúncio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Denunciar',
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              'Obrigado',
              'Sua denúncia foi registrada e será analisada pela equipe ReservaGO.',
            ),
        },
      ],
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* ── SCROLL PRINCIPAL ─────────────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* HERO IMAGE */}
        <View style={styles.imageHeader}>
          <Image
            source={{ uri: image as string }}
            style={styles.mainImage}
          />

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft color="#000" size={24} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.heartButton}
            onPress={() => toggleFavorite(id as string)}
          >
            <Heart
              size={24}
              color={isFav ? '#FF385C' : '#fff'}
              fill={isFav ? '#FF385C' : 'rgba(0,0,0,0.3)'}
            />
          </TouchableOpacity>
        </View>

        {/* CONTEÚDO */}
        <View style={styles.content}>
          {/* Título + localização */}
          <Text style={styles.title}>{title}</Text>
          <View style={styles.row}>
            <MapPin size={14} color="#6B7280" />
            <Text style={styles.locationText}> {location}</Text>
          </View>

          {/* Avaliação + botão ver todas */}
          <TouchableOpacity
            style={styles.ratingRow}
            onPress={() => setReviewsModal(true)}
          >
            <Star size={16} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.ratingValue}> 4,98</Text>
            <Text style={styles.ratingCount}>
              {' '}
              · {REVIEWS.length} avaliações
            </Text>
            <ChevronRight size={14} color="#9CA3AF" style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Sobre o lugar */}
          <Text style={styles.sectionTitle}>Sobre o lugar</Text>
          <Text style={styles.bodyText}>
            {description ||
              'Um refúgio único rodeado pela natureza, perfeito para quem busca descanso e privacidade total.'}
          </Text>

          <View style={styles.divider} />

          {/* Nível de isolamento */}
          <Text style={styles.sectionTitle}>🌿 Nível de isolamento</Text>
          <View style={styles.isolationCard}>
            <Text style={styles.isolationEmoji}>🏕️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.isolationTitle}>
                Você é a única alma aqui
              </Text>
              <Text style={styles.isolationSub}>
                O vizinho mais próximo fica a 4,5 km de distância, dentro de
                uma reserva particular de 20 hectares.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Comodidades */}
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

          {/* Mapa */}
          <Text style={styles.sectionTitle}>Localização</Text>
          <TouchableOpacity
            style={styles.mapPlaceholder}
            onPress={openMap}
            activeOpacity={0.8}
          >
            <Image
              source={{
                uri: `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(location as string)}&zoom=12&size=600x200&maptype=terrain`,
              }}
              style={styles.mapImage}
            />
            <View style={styles.mapOverlay}>
              <MapPin size={20} color="#fff" />
              <Text style={styles.mapText}>
                Ver no mapa · {location}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Diretrizes da hospedagem */}
          <Text style={styles.sectionTitle}>Diretrizes da hospedagem</Text>
          <View style={styles.rulesList}>
            <RuleRow icon={Users} text="Máximo de 4 hóspedes" />
            <RuleRow icon={Clock} text="Check-in: 14h · Check-out: 11h" />
            <RuleRow icon={Ban} text="Não é permitido fumar dentro" />
            <RuleRow
              icon={ShieldCheck}
              text="Extintor e kit de primeiros socorros disponíveis"
            />
            <RuleRow
              icon={AlertTriangle}
              text="Cancelamento gratuito até 7 dias antes da chegada"
            />
          </View>

          <View style={styles.divider} />

          {/* Contato do anfitrião */}
          <Text style={styles.sectionTitle}>Anfitrião</Text>
          <View style={styles.hostCard}>
            <Image
              source={{ uri: 'https://i.pravatar.cc/100?img=12' }}
              style={styles.hostAvatar}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.hostName}>Carlos Mendes</Text>
              <Text style={styles.hostSub}>
                Anfitrião desde 2022 · Superhost ⭐
              </Text>
            </View>
            <TouchableOpacity
              style={styles.contactBtn}
              onPress={openHostContact}
            >
              <MessageCircle size={18} color="#2D5A27" />
              <Text style={styles.contactBtnText}>Contato</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Denunciar */}
          <TouchableOpacity
            style={styles.reportButton}
            onPress={handleReport}
          >
            <Flag size={16} color="#EF4444" />
            <Text style={styles.reportText}>Denunciar este anúncio</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── FOOTER FIXO ──────────────────────────────────────────────────────── */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerPrice}>R$ {price}</Text>
          <Text style={styles.footerNight}>por noite</Text>
        </View>
        <TouchableOpacity
          style={styles.reserveButton}
          onPress={openReserveFlow}
          activeOpacity={0.85}
        >
          <Text style={styles.reserveText}>Reservar</Text>
        </TouchableOpacity>
      </View>

      {/* ── MODAL: FLUXO DE RESERVA ──────────────────────────────────────────── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            {/* Header do modal */}
            <View style={styles.modalHeader}>
              <Image
                source={{ uri: image as string }}
                style={styles.modalThumb}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.modalTitle} numberOfLines={2}>
                  {title}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Star size={12} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.modalSubtitle}>
                    {' '}
                    4,98 · {location}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* ETAPA 1: Datas e hóspedes */}
            {step === 'dates' && (
              <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text style={styles.stepTitle}>Escolha as datas</Text>

                {/* Campos de data */}
                <View style={styles.dateRow}>
                  <View style={styles.dateField}>
                    <Text style={styles.dateLabel}>CHECK-IN</Text>
                    <TextInput
                      style={styles.dateInput}
                      placeholder="DD/MM/AAAA"
                      value={checkIn}
                      onChangeText={setCheckIn}
                      keyboardType="numeric"
                      maxLength={10}
                    />
                  </View>
                  <View style={styles.dateSeparator} />
                  <View style={styles.dateField}>
                    <Text style={styles.dateLabel}>CHECK-OUT</Text>
                    <TextInput
                      style={styles.dateInput}
                      placeholder="DD/MM/AAAA"
                      value={checkOut}
                      onChangeText={setCheckOut}
                      keyboardType="numeric"
                      maxLength={10}
                    />
                  </View>
                </View>

                {/* Indicador de noites — só aparece quando as datas são válidas */}
                {datesAreValid && (
                  <View style={styles.nightsBadge}>
                    <Calendar size={14} color="#2D5A27" />
                    <Text style={styles.nightsBadgeText}>
                      {nightCount} {nightCount === 1 ? 'noite' : 'noites'} selecionada
                      {nightCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                )}

                {/* Seletor de hóspedes */}
                <Text
                  style={[styles.dateLabel, { marginTop: 20, marginBottom: 6 }]}
                >
                  HÓSPEDES
                </Text>
                <View style={styles.guestRow}>
                  <TouchableOpacity
                    style={styles.guestBtn}
                    onPress={() =>
                      setGuests(g => String(Math.max(1, Number(g) - 1)))
                    }
                  >
                    <Text style={styles.guestBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.guestCount}>
                    {guests} hóspede{Number(guests) > 1 ? 's' : ''}
                  </Text>
                  <TouchableOpacity
                    style={styles.guestBtn}
                    onPress={() =>
                      setGuests(g => String(Math.min(4, Number(g) + 1)))
                    }
                  >
                    <Text style={styles.guestBtnText}>+</Text>
                  </TouchableOpacity>
                </View>

                {/* Resumo de preço — dinâmico */}
                <View style={styles.priceSummary}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>
                      R$ {price} × {nightCount}{' '}
                      {nightCount === 1 ? 'noite' : 'noites'}
                      {!datesAreValid && ' (preencha as datas)'}
                    </Text>
                    <Text style={styles.priceValue}>
                      R$ {subtotal.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Taxa de serviço</Text>
                    <Text style={styles.priceValue}>
                      R$ {serviceFee.toFixed(2)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.priceRow,
                      {
                        marginTop: 10,
                        borderTopWidth: 1,
                        borderTopColor: '#F3F4F6',
                        paddingTop: 10,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priceLabel,
                        { fontWeight: 'bold', color: '#1F2937' },
                      ]}
                    >
                      Total
                    </Text>
                    <Text
                      style={[
                        styles.priceValue,
                        { fontWeight: 'bold', color: '#1F2937' },
                      ]}
                    >
                      R$ {total.toFixed(2)}
                    </Text>
                  </View>
                  {datesAreValid && (
                    <View style={[styles.priceRow, { marginTop: 4 }]}>
                      <Text style={styles.installText}>
                        ou em até 12x de R${' '}
                        {(total / 12).toFixed(2)} no cartão
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.cancelBadge}>
                  <Check size={14} color="#2D5A27" />
                  <Text style={styles.cancelText}>
                    Cancelamento gratuito até 7 dias antes
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.advanceBtn}
                  onPress={handleAdvanceToPayment}
                >
                  <Text style={styles.advanceBtnText}>Avançar →</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {/* ETAPA 2: Pagamento */}
            {step === 'payment' && (
              <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text style={styles.stepTitle}>Forma de pagamento</Text>

                <TouchableOpacity
                  style={[
                    styles.payOption,
                    payMethod === 'pix' && styles.payOptionActive,
                  ]}
                  onPress={() => setPayMethod('pix')}
                >
                  <Text style={styles.payIcon}>PIX</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.payLabel}>Pagar com PIX</Text>
                    <Text style={styles.payDesc}>
                      Confirmação instantânea · 5% de desconto
                    </Text>
                  </View>
                  {payMethod === 'pix' && (
                    <Check size={18} color="#2D5A27" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.payOption,
                    payMethod === 'card' && styles.payOptionActive,
                  ]}
                  onPress={() => setPayMethod('card')}
                >
                  <CreditCard
                    size={24}
                    color={payMethod === 'card' ? '#2D5A27' : '#9CA3AF'}
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.payLabel}>Cartão de crédito</Text>
                    <Text style={styles.payDesc}>Em até 12x sem juros</Text>
                  </View>
                  {payMethod === 'card' && (
                    <Check size={18} color="#2D5A27" />
                  )}
                </TouchableOpacity>

                {/* Resumo final com desconto PIX aplicado */}
                <View style={styles.priceSummary}>
                  <View style={styles.priceRow}>
                    <Text
                      style={[
                        styles.priceLabel,
                        { fontWeight: 'bold', color: '#1F2937' },
                      ]}
                    >
                      Total a pagar
                    </Text>
                    <Text
                      style={[
                        styles.priceValue,
                        { fontWeight: 'bold', color: '#1F2937' },
                      ]}
                    >
                      R${' '}
                      {payMethod === 'pix'
                        ? (total * 0.95).toFixed(2)
                        : total.toFixed(2)}
                    </Text>
                  </View>
                  {payMethod === 'pix' && (
                    <Text
                      style={{ color: '#2D5A27', fontSize: 12, marginTop: 4 }}
                    >
                      🎉 Desconto PIX de 5% aplicado!
                    </Text>
                  )}
                  <Text style={[styles.installText, { marginTop: 6 }]}>
                    {nightCount} {nightCount === 1 ? 'noite' : 'noites'} ·
                    check-in {checkIn} · check-out {checkOut}
                  </Text>
                </View>

                <View style={styles.cancelBadge}>
                  <Check size={14} color="#2D5A27" />
                  <Text style={styles.cancelText}>
                    Cancelamento gratuito até 7 dias antes
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                  <TouchableOpacity
                    style={styles.backStepBtn}
                    onPress={() => setStep('dates')}
                  >
                    <Text style={styles.backStepText}>← Voltar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.advanceBtn, { flex: 1, marginTop: 0 }]}
                    onPress={confirmBooking}
                  >
                    <Text style={styles.advanceBtnText}>
                      Confirmar Reserva
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── MODAL: AVALIAÇÕES ────────────────────────────────────────────────── */}
      <Modal visible={reviewsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '80%' }]}>
            <View style={styles.modalHandle} />
            <View style={[styles.modalHeader, { padding: 20 }]}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', flex: 1 }}>
                Avaliações
              </Text>
              <TouchableOpacity onPress={() => setReviewsModal(false)}>
                <X size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={REVIEWS}
              keyExtractor={item => item.id}
              contentContainerStyle={{ padding: 20, paddingTop: 0 }}
              renderItem={({ item }) => (
                <View style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Image
                      source={{ uri: item.avatar }}
                      style={styles.reviewAvatar}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewAuthor}>{item.author}</Text>
                      <Text style={styles.reviewDate}>{item.date}</Text>
                    </View>
                    <View style={styles.reviewStars}>
                      {[...Array(item.rating)].map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          color="#F59E0B"
                          fill="#F59E0B"
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewText}>{item.comment}</Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function RuleRow({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.ruleRow}>
      <Icon size={18} color="#4B5563" />
      <Text style={styles.ruleText}>{text}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  // Hero
  imageHeader: { height: 350, backgroundColor: '#EEE' },
  mainImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 8,
    borderRadius: 25,
    zIndex: 10,
  },
  heartButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.25)',
    padding: 8,
    borderRadius: 25,
    zIndex: 10,
  },

  // Content
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  locationText: { color: '#6B7280', fontSize: 14 },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  ratingValue: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  ratingCount: { fontSize: 14, color: '#6B7280' },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  bodyText: { color: '#4B5563', lineHeight: 22, fontSize: 15 },

  // Isolation
  isolationCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F7F0',
    padding: 16,
    borderRadius: 14,
    gap: 12,
    alignItems: 'flex-start',
  },
  isolationEmoji: { fontSize: 28 },
  isolationTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  isolationSub: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 4,
    lineHeight: 19,
  },

  // Amenities
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '47%',
    gap: 8,
  },
  amenityLabel: { fontSize: 14, color: '#374151' },

  // Map
  mapPlaceholder: {
    height: 140,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  mapImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // Rules
  rulesList: { gap: 14 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ruleText: { fontSize: 14, color: '#374151', flex: 1 },

  // Host
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  hostAvatar: { width: 52, height: 52, borderRadius: 26, marginRight: 12 },
  hostName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  hostSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F7F0',
    padding: 10,
    borderRadius: 10,
  },
  contactBtnText: { color: '#2D5A27', fontWeight: '700', fontSize: 13 },

  // Report
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  reportText: {
    color: '#EF4444',
    fontSize: 14,
    textDecorationLine: 'underline',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: 35,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerPrice: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  footerNight: { color: '#6B7280', fontSize: 13 },
  reserveButton: {
    backgroundColor: '#2D5A27',
    paddingVertical: 15,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  reserveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // Modal base
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 0,
  },
  modalThumb: { width: 64, height: 64, borderRadius: 10 },
  modalTitle: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  modalSubtitle: { fontSize: 12, color: '#6B7280' },

  // Dates step
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  dateField: { flex: 1, padding: 14 },
  dateLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
  },
  dateInput: { fontSize: 15, color: '#1F2937', marginTop: 4 },
  dateSeparator: { width: 1, height: '70%', backgroundColor: '#E5E7EB' },

  // Indicador de noites selecionadas
  nightsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#F0F7F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  nightsBadgeText: {
    fontSize: 13,
    color: '#2D5A27',
    fontWeight: '600',
  },

  // Guest selector
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  guestBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestBtnText: { fontSize: 20, color: '#374151', lineHeight: 24 },
  guestCount: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },

  // Price summary
  priceSummary: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: { fontSize: 14, color: '#6B7280' },
  priceValue: { fontSize: 14, color: '#374151' },
  installText: { fontSize: 12, color: '#6B7280' },

  // Cancel badge
  cancelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F7F0',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  cancelText: { fontSize: 13, color: '#2D5A27', fontWeight: '600' },

  // Buttons
  advanceBtn: {
    backgroundColor: '#2D5A27',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  advanceBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  backStepBtn: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backStepText: { color: '#6B7280', fontSize: 15, fontWeight: '600' },

  // Pay options
  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  payOptionActive: { borderColor: '#2D5A27', backgroundColor: '#F0F7F0' },
  payIcon: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2D5A27',
    marginRight: 12,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  payLabel: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  payDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  // Reviews modal
  reviewCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20 },
  reviewAuthor: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
  reviewDate: { fontSize: 12, color: '#9CA3AF' },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewText: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
});
