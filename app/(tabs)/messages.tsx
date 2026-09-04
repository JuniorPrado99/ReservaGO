import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, StyleSheet, Text, View, FlatList, Image,
  TouchableOpacity, Modal, TextInput, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { Mail, ChevronRight, Send, X, ShieldCheck } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  getConversations,
  getMessages,
  getUnreadConversationIds,
  markAsRead as markMessagesRead,
  sendMessage as sendMessageRemote,
  subscribeToMessages,
} from '../../services/messageService';
import { markMessageNotificationsAsRead } from '../../services/notificationService';
import type { ConversationWithParticipants, Message as DbMessage } from '../../services/types';

type Message = {
  id: string;
  from: 'me' | 'them';
  text: string;
};

type Chat = {
  id: string;
  hostName: string;
  lastMessage: string;
  time: string;
  avatar: string | null;
  unread: boolean;
  isSupport: boolean;
  messages: Message[];
  /** true = veio do Supabase (conversations reais); ausente/false = mock local ou fallback. */
  isReal?: boolean;
};

// Usado só como fallback: usuário estático de dev, ou quando getConversations falha.
const INITIAL_CHATS: Chat[] = [
  {
    id: 'support',
    hostName: 'Suporte ReservaGO',
    lastMessage: 'Olá! Como podemos te ajudar hoje?',
    time: 'Agora',
    avatar: null,
    unread: true,
    isSupport: true,
    messages: [
      { id: '1', from: 'them', text: 'Olá! Bem-vindo ao suporte ReservaGO. Como podemos te ajudar hoje?' },
    ],
  },
  {
    id: '1',
    hostName: 'Carlos (Cabana do Lago)',
    lastMessage: 'Olá! O check-in está liberado a partir das 14h.',
    time: '10:30',
    avatar: 'https://i.pravatar.cc/100?img=12',
    unread: true,
    isSupport: false,
    messages: [
      { id: '1', from: 'them', text: 'Olá! Seja bem-vindo à Cabana do Lago Azul! 🌿' },
      { id: '2', from: 'them', text: 'O check-in está liberado a partir das 14h.' },
    ],
  },
  {
    id: '2',
    hostName: 'Ana (Refúgio na Montanha)',
    lastMessage: 'A senha do Wi-Fi é montanha2024.',
    time: 'Ontem',
    avatar: 'https://i.pravatar.cc/100?img=5',
    unread: false,
    isSupport: false,
    messages: [
      { id: '1', from: 'them', text: 'Boa tarde! Tudo pronto para a sua chegada.' },
      { id: '2', from: 'them', text: 'A senha do Wi-Fi é montanha2024.' },
    ],
  },
];

const SUPPORT_REPLY: Message = {
  id: '',
  from: 'them',
  text: 'Obrigado por entrar em contato! Nossa equipe responderá em breve. Tempo médio: 15 minutos. 🌿',
};

function formatTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ontem';
  return `${days}d`;
}

function mapConversation(conv: ConversationWithParticipants, userId: string, unreadIds: Set<string>): Chat {
  const isGuest = conv.guest_id === userId;
  const other = isGuest ? conv.host : conv.guest;
  return {
    id: conv.id,
    hostName: other?.name || 'Usuário removido',
    lastMessage: conv.last_message ?? 'Conversa iniciada',
    time: conv.last_message_at ? formatTime(conv.last_message_at) : '',
    avatar: other?.avatar_url ?? null,
    unread: unreadIds.has(conv.id),
    isSupport: false,
    messages: [],
    isReal: true,
  };
}

function mapMessage(m: DbMessage, userId: string): Message {
  return { id: m.id, from: m.sender_id === userId ? 'me' : 'them', text: m.content };
}

export default function MessagesScreen() {
  const { user } = useAuth();
  const { refresh: refreshNotifications } = useNotifications();

  // Usuário estático (__DEV__) não existe em profiles/auth - fica só no
  // mock local, como sempre funcionou.
  const isStaticUser = !!user?.id && user.id.startsWith('static-');
  const isConnected = !!user?.id && !isStaticUser;

  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [loading, setLoading] = useState(isConnected);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [inputText, setInputText] = useState('');
  const activeChatIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeChatIdRef.current = activeChat?.id ?? null;
  }, [activeChat?.id]);

  const loadConversations = () => {
    if (!isConnected || !user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([getConversations(user.id), getUnreadConversationIds(user.id)]).then(
      ([convResult, unreadResult]) => {
        if (convResult.error || !convResult.data) {
          console.log('[messages] getConversations falhou, usando mock local ->', convResult.error);
          setLoading(false);
          return;
        }
        const unreadIds = new Set(unreadResult.data ?? []);
        setChats(convResult.data.map((c) => mapConversation(c, user.id, unreadIds)));
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    loadConversations();
    if (!isConnected || !user?.id) return;

    const unsubscribe = subscribeToMessages(user.id, (message) => {
      if (message.conversation_id === activeChatIdRef.current) {
        setActiveChat((prev) => {
          if (!prev) return prev;
          if (prev.messages.some((m) => m.id === message.id)) return prev; // eco da própria mensagem
          return { ...prev, messages: [...prev.messages, mapMessage(message, user.id)] };
        });
        if (message.sender_id !== user.id) {
          markMessagesRead([message.id]);
          markMessageNotificationsAsRead([message.id]);
          refreshNotifications();
        }
      }
      // Recarrega a lista (last_message/hora/badge de não lida) - mais
      // simples e confiável do que remendar o estado local aqui.
      loadConversations();
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, user?.id]);

  const openChat = (chat: Chat) => {
    setChats((prev) => prev.map((c) => (c.id === chat.id ? { ...c, unread: false } : c)));

    if (!chat.isReal || !user?.id) {
      setActiveChat({ ...chat, unread: false });
      return;
    }

    setActiveChat({ ...chat, unread: false, messages: [] });

    getMessages(chat.id).then(({ data, error }) => {
      if (error || !data) {
        console.log('[messages] getMessages falhou ->', error);
        return;
      }
      const mapped = data.map((m) => mapMessage(m, user.id));
      setActiveChat((prev) => (prev && prev.id === chat.id ? { ...prev, messages: mapped } : prev));

      const unreadIncoming = data.filter((m) => m.sender_id !== user.id && !m.read_at).map((m) => m.id);
      if (unreadIncoming.length > 0) {
        markMessagesRead(unreadIncoming);
        markMessageNotificationsAsRead(unreadIncoming);
        refreshNotifications();
      }
    });
  };

  const sendMessage = () => {
    const text = inputText.trim();
    if (!text || !activeChat) return;

    if (!activeChat.isReal || !user?.id) {
      // Fluxo local de sempre (mock / usuário estático)
      const newMsg: Message = { id: String(Date.now()), from: 'me', text };
      const updatedChat: Chat = {
        ...activeChat,
        messages: [...activeChat.messages, newMsg],
        lastMessage: text,
        time: 'Agora',
      };
      setActiveChat(updatedChat);
      setChats((prev) => prev.map((c) => (c.id === activeChat.id ? updatedChat : c)));
      setInputText('');

      if (activeChat.isSupport) {
        setTimeout(() => {
          const reply: Message = { ...SUPPORT_REPLY, id: String(Date.now() + 1) };
          setActiveChat((prev) => prev ? { ...prev, messages: [...prev.messages, reply] } : prev);
        }, 1200);
      }
      return;
    }

    setInputText('');
    sendMessageRemote({ conversation_id: activeChat.id, sender_id: user.id, content: text }).then(
      ({ data, error }) => {
        if (error || !data) {
          console.log('[messages] sendMessage falhou ->', error);
          return;
        }
        setActiveChat((prev) => {
          if (!prev || prev.id !== activeChat.id) return prev;
          if (prev.messages.some((m) => m.id === data.id)) return prev; // já chegou via Realtime
          return { ...prev, messages: [...prev.messages, mapMessage(data, user.id)] };
        });
      }
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mensagens</Text>
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#2D5A27" />
        </View>
      ) : chats.length > 0 ? (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.chatCard} onPress={() => openChat(item)}>
              {item.isSupport ? (
                <View style={styles.supportAvatar}>
                  <ShieldCheck size={24} color="#2D5A27" />
                </View>
              ) : (
                <Image source={{ uri: item.avatar ?? undefined }} style={styles.avatar} />
              )}

              <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                  <Text style={[styles.hostName, item.isSupport && { color: '#2D5A27' }]}>
                    {item.hostName}
                    {item.isSupport && '  ✓'}
                  </Text>
                  <Text style={styles.time}>{item.time}</Text>
                </View>
                <Text
                  style={[styles.message, item.unread && styles.unreadText]}
                  numberOfLines={1}
                >
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
          <Text style={styles.emptySub}>
            Quando você reservar um lugar, as conversas com os anfitriões aparecerão aqui.
          </Text>
        </View>
      )}

      <Modal visible={!!activeChat} animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: '#fff' }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <View style={styles.chatModalHeader}>
            <TouchableOpacity onPress={() => setActiveChat(null)}>
              <X size={24} color="#1F2937" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.chatModalTitle}>{activeChat?.hostName}</Text>
              {activeChat?.isSupport && (
                <Text style={styles.chatModalSub}>Equipe oficial ReservaGO</Text>
              )}
            </View>
            {activeChat?.isSupport ? (
              <View style={styles.supportAvatarSm}>
                <ShieldCheck size={18} color="#2D5A27" />
              </View>
            ) : (
              <Image source={{ uri: activeChat?.avatar ?? undefined }} style={styles.chatModalAvatar} />
            )}
          </View>

          <ScrollView
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
          >
            {activeChat?.messages.map((msg) => (
              <View
                key={msg.id}
                style={[styles.bubble, msg.from === 'me' ? styles.bubbleMe : styles.bubbleThem]}
              >
                <Text style={msg.from === 'me' ? styles.bubbleTextMe : styles.bubbleTextThem}>
                  {msg.text}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.inputBar}>
            <TextInput
              style={styles.messageInput}
              placeholder="Digite uma mensagem..."
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
              <Send size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    borderBottomColor: '#F3F4F6',
  },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1F2937' },
  chatCard: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: 12 },
  supportAvatar: {
    width: 52, height: 52, borderRadius: 26, marginRight: 12,
    backgroundColor: '#F0F7F0', justifyContent: 'center', alignItems: 'center',
  },
  chatContent: { flex: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  hostName: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  time: { fontSize: 12, color: '#9CA3AF' },
  message: { fontSize: 14, color: '#6B7280' },
  unreadText: { color: '#1F2937', fontWeight: '600' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2D5A27', marginRight: 10 },
  chatModalHeader: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#fff',
  },
  chatModalTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  chatModalSub: { fontSize: 12, color: '#2D5A27' },
  chatModalAvatar: { width: 40, height: 40, borderRadius: 20 },
  supportAvatarSm: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F0F7F0', justifyContent: 'center', alignItems: 'center',
  },
  messagesList: { padding: 16, paddingBottom: 20 },
  bubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: '#2D5A27',
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  bubbleTextMe: { color: '#fff', fontSize: 14, lineHeight: 20 },
  bubbleTextThem: { color: '#1F2937', fontSize: 14, lineHeight: 20 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 10,
    backgroundColor: '#fff',
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2D5A27',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginTop: 15 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8 },
});
