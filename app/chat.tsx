import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Send } from 'lucide-react-native';

// Estrutura de uma mensagem
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'host';
  time: string;
}

export default function ChatScreen() {
  const router = useRouter();
  // Pegando os dados que enviamos lá do details.tsx
  const { hostName, propertyTitle } = useLocalSearchParams();
  
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Mensagens iniciais falsas para a tela não ficar vazia
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Olá! Vi que você está interessado na cabana "${propertyTitle || 'que anunciei'}". Como posso ajudar?`,
      sender: 'host',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const sendMessage = () => {
    if (inputText.trim() === '') return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');

    // Simular uma resposta automática do anfitrião depois de 1.5 segundos
    setTimeout(() => {
      const hostReply: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Certo! Vou verificar essa informação para você. Só um momento.',
        sender: 'host',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, hostReply]);
    }, 1500);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.messageWrapper, isUser ? styles.messageWrapperUser : styles.messageWrapperHost]}>
        {!isUser && (
          <Image source={{ uri: 'https://i.pravatar.cc/100?img=12' }} style={styles.avatar} />
        )}
        <View style={[styles.messageBubble, isUser ? styles.messageUser : styles.messageHost]}>
          <Text style={[styles.messageText, isUser && styles.messageTextUser]}>{item.text}</Text>
          <Text style={[styles.messageTime, isUser && styles.messageTimeUser]}>{item.time}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* CABEÇALHO */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.hostName}>{hostName || 'Anfitrião'}</Text>
          <Text style={styles.propertyName} numberOfLines={1}>
            {propertyTitle || 'Detalhes da reserva'}
          </Text>
        </View>
      </View>

      {/* ÁREA DE MENSAGENS */}
      <KeyboardAvoidingView 
        style={styles.keyboardContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* BARRA DE DIGITAÇÃO */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Escreva uma mensagem..."
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, inputText.trim() === '' && { opacity: 0.5 }]} 
            onPress={sendMessage}
            disabled={inputText.trim() === ''}
          >
            <Send size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Para usar a SafeArea do React Native corretamente em telas sem header nativo
const { SafeAreaView } = require('react-native-safe-area-context');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    marginRight: 15,
  },
  headerInfo: {
    flex: 1,
  },
  hostName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  propertyName: {
    fontSize: 13,
    color: '#6B7280',
  },
  keyboardContainer: {
    flex: 1,
  },
  messageList: {
    padding: 20,
    gap: 15,
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  messageWrapperUser: {
    justifyContent: 'flex-end',
  },
  messageWrapperHost: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 18,
  },
  messageHost: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  messageUser: {
    backgroundColor: '#2D5A27',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 20,
  },
  messageTextUser: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 10,
    color: '#9CA3AF',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  messageTimeUser: {
    color: '#D1D5DB',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
    minHeight: 40,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#2D5A27',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});