import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity } from 'react-native';
import { Mail, ChevronRight } from 'lucide-react-native';

// Simulando conversas com donos de cabanas
const CHATS = [
  {
    id: '1',
    hostName: 'Carlos (Cabana do Lago)',
    lastMessage: 'Olá! O check-in está liberado a partir das 14h.',
    time: '10:30',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100',
    unread: true,
  },
  {
    id: '2',
    hostName: 'Ana (Refúgio na Montanha)',
    lastMessage: 'A senha do Wi-Fi é montanha2024.',
    time: 'Ontem',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    unread: false,
  }
];

export default function MessagesScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mensagens</Text>
      </View>

      {CHATS.length > 0 ? (
        <FlatList
          data={CHATS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.chatCard}>
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
              
              <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                  <Text style={styles.hostName}>{item.hostName}</Text>
                  <Text style={styles.time}>{item.time}</Text>
                </View>
                
                <Text style={[styles.message, item.unread && styles.unreadText]} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              </View>

              {item.unread && <View style={styles.unreadDot} />}
              <ChevronRight size={18} color="#E5E7EB" />
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Mail size={48} color="#E5E7EB" />
          <Text style={styles.emptyTitle}>Nenhuma mensagem ainda</Text>
          <Text style={styles.emptySub}>Quando você reservar um lugar, as conversas com os anfitriões aparecerão aqui.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1F2937' },
  chatCard: { flexDirection: 'row', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  avatar: { width: 55, height: 55, borderRadius: 27.5, marginRight: 15 },
  chatContent: { flex: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  hostName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  time: { fontSize: 12, color: '#9CA3AF' },
  message: { fontSize: 14, color: '#6B7280' },
  unreadText: { color: '#1F2937', fontWeight: '600' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2D5A27', marginRight: 10 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginTop: 15 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8 },
});