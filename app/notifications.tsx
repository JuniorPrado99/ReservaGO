import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Calendar,
  MessageCircle,
  Tag,
  Bell,
  CheckCheck,
} from 'lucide-react-native';

type NotificationType = 'reserva' | 'mensagem' | 'promocao' | 'aviso';
type FilterType = 'todas' | NotificationType;

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'reserva',
    title: 'Reserva confirmada! 🎉',
    body: 'Sua reserva no Refúgio das Pedras foi confirmada para 15–18 de Jun.',
    time: 'Agora',
    read: false,
  },
  {
    id: '2',
    type: 'mensagem',
    title: 'Carlos Mendes respondeu',
    body: 'Olá! O check-in pode ser feito a partir das 14h. Qualquer dúvida é só chamar.',
    time: '5 min atrás',
    read: false,
  },
  {
    id: '3',
    type: 'promocao',
    title: '🏷️ Oferta especial para você',
    body: 'Use o cupom RESERVAGO15 e ganhe 15% de desconto na sua próxima reserva.',
    time: '1 hora atrás',
    read: false,
  },
  {
    id: '4',
    type: 'aviso',
    title: 'Lembrete de viagem',
    body: 'Sua estadia na Cabana Suíça começa em 3 dias. Confira as diretrizes da hospedagem.',
    time: 'Ontem',
    read: true,
  },
  {
    id: '5',
    type: 'reserva',
    title: 'Reserva pendente',
    body: 'Sua solicitação para a Cabana do Rio está aguardando confirmação do anfitrião.',
    time: 'Ontem',
    read: true,
  },
  {
    id: '6',
    type: 'mensagem',
    title: 'Nova mensagem de Ana Lima',
    body: 'Tudo certo para a chegada de vocês! Deixei as instruções na porta.',
    time: '2 dias atrás',
    read: true,
  },
  {
    id: '7',
    type: 'promocao',
    title: '🌿 Novidade no ReservaGO',
    body: 'Agora você pode filtrar cabanas por nível de isolamento. Experimente!',
    time: '3 dias atrás',
    read: true,
  },
  {
    id: '8',
    type: 'reserva',
    title: 'Reserva cancelada',
    body: 'A reserva no Chalé das Montanhas foi cancelada. O reembolso será processado em até 5 dias úteis.',
    time: '1 semana atrás',
    read: true,
  },
];

const TYPE_CONFIG: Record<NotificationType, { icon: any; color: string; bg: string; label: string }> = {
  reserva: { icon: Calendar, color: '#2D5A27', bg: '#F0F7F0', label: 'Reservas' },
  mensagem: { icon: MessageCircle, color: '#3B82F6', bg: '#EFF6FF', label: 'Mensagens' },
  promocao: { icon: Tag, color: '#F59E0B', bg: '#FFFBEB', label: 'Promoções' },
  aviso: { icon: Bell, color: '#6B7280', bg: '#F9FAFB', label: 'Avisos' },
};

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'reserva', label: 'Reservas' },
  { key: 'mensagem', label: 'Mensagens' },
  { key: 'promocao', label: 'Promoções' },
  { key: 'aviso', label: 'Avisos' },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState<FilterType>('todas');

  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = useMemo(() => {
    if (activeFilter === 'todas') return notifications;
    return notifications.filter(n => n.type === activeFilter);
  }, [notifications, activeFilter]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const config = TYPE_CONFIG[item.type];
    const IconComponent = config.icon;

    return (
      <TouchableOpacity
        style={[styles.notifCard, !item.read && styles.notifCardUnread]}
        onPress={() => markAsRead(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.notifIconCircle, { backgroundColor: config.bg }]}>
          <IconComponent size={20} color={config.color} />
        </View>

        <View style={styles.notifContent}>
          <View style={styles.notifTitleRow}>
            <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.notifTime}>{item.time}</Text>
          </View>
          <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
        </View>

        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificações</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
            <CheckCheck size={18} color="#2D5A27" />
            <Text style={styles.markAllText}>Marcar todas</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 90 }} />
        )}
      </View>

      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadBannerText}>
            {unreadCount} {unreadCount === 1 ? 'notificação não lida' : 'notificações não lidas'}
          </Text>
        </View>
      )}

      <View style={styles.filterWrapper}>
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.key}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === item.key && styles.filterChipActive]}
              onPress={() => setActiveFilter(item.key)}
            >
              <Text style={[styles.filterChipText, activeFilter === item.key && styles.filterChipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Bell size={40} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
            <Text style={styles.emptySubtitle}>Você está em dia por aqui!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  markAllText: { fontSize: 13, color: '#2D5A27', fontWeight: '600' },
  unreadBanner: { backgroundColor: '#F0F7F0', paddingVertical: 8, paddingHorizontal: 20 },
  unreadBannerText: { fontSize: 13, color: '#2D5A27', fontWeight: '500' },
  filterWrapper: { paddingTop: 12 },
  filterList: { paddingHorizontal: 20, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
  filterChipActive: { backgroundColor: '#2D5A27' },
  filterChipText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  filterChipTextActive: { color: '#fff', fontWeight: '700' },
  listContent: { padding: 20, paddingBottom: 40 },
  separator: { height: 1, backgroundColor: '#F9FAFB' },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    gap: 12,
    position: 'relative',
  },
  notifCardUnread: { backgroundColor: '#FAFFFE' },
  notifIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notifContent: { flex: 1 },
  notifTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 8,
  },
  notifTitle: { fontSize: 14, fontWeight: '500', color: '#4B5563', flex: 1 },
  notifTitleUnread: { fontWeight: '700', color: '#1F2937' },
  notifTime: { fontSize: 11, color: '#9CA3AF', flexShrink: 0 },
  notifBody: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2D5A27',
    marginTop: 6,
    flexShrink: 0,
  },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#9CA3AF' },
  emptySubtitle: { fontSize: 14, color: '#D1D5DB' },
});