import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { ConversationWithParticipants, Message, NewMessage, ServiceResult, toResult } from './types';

// Acesso a `conversations` e `messages` (supabase/schema.sql). Realtime já
// está habilitado pra `messages` (ALTER PUBLICATION supabase_realtime ADD
// TABLE messages, schema.sql linha 665).

export async function getConversations(userId: string): Promise<ServiceResult<ConversationWithParticipants[]>> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*, guest:profiles!conversations_guest_id_fkey(name, avatar_url), host:profiles!conversations_host_id_fkey(name, avatar_url)')
    .or(`guest_id.eq.${userId},host_id.eq.${userId}`)
    .order('last_message_at', { ascending: false });
  return toResult(data as unknown as ConversationWithParticipants[] | null, error);
}

/** IDs de conversas com pelo menos 1 mensagem não lida recebida por esse usuário (RLS já restringe às conversas dele). */
export async function getUnreadConversationIds(userId: string): Promise<ServiceResult<string[]>> {
  const { data, error } = await supabase
    .from('messages')
    .select('conversation_id')
    .neq('sender_id', userId)
    .is('read_at', null);

  if (error) return toResult<string[]>(null, error);
  const ids = Array.from(new Set((data ?? []).map((m: { conversation_id: string }) => m.conversation_id)));
  return { data: ids, error: null };
}

export async function getMessages(conversationId: string): Promise<ServiceResult<Message[]>> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  return toResult(data, error);
}

export async function sendMessage(dados: NewMessage): Promise<ServiceResult<Message>> {
  // messages_last_trigger (schema.sql linha 294) já atualiza
  // conversations.last_message/last_message_at sozinho.
  const { data, error } = await supabase.from('messages').insert(dados).select().single();
  return toResult(data, error);
}

/**
 * Assina novas mensagens em tempo real. O parâmetro `userId` identifica o
 * canal (não filtra no Postgres - `messages` não tem coluna de usuário
 * direta, só `conversation_id`/`sender_id`); quem realmente restringe quais
 * INSERTs este usuário recebe é a policy `messages_participant_read`
 * (schema.sql linha 619), que o Realtime do Supabase respeita.
 * Retorna a função de unsubscribe.
 */
export function subscribeToMessages(
  userId: string,
  callback: (message: Message) => void
): () => void {
  const channel = supabase
    .channel(`messages:${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload: RealtimePostgresChangesPayload<Message>) => {
        callback(payload.new as Message);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function markAsRead(ids: string[]): Promise<ServiceResult<Message[]>> {
  if (ids.length === 0) return { data: [], error: null };
  const { data, error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .in('id', ids)
    .select();
  return toResult(data, error);
}
