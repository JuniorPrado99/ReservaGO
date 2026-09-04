import { supabase } from '../lib/supabase';
import { Profile, ServiceResult, UserRole, toResult } from './types';

// Acesso à tabela `profiles` (supabase/schema.sql). updateRole() aqui é o
// que falta pra context/AuthContext.tsx parar de trocar a role só em
// memória (ver Tarefa 6).

export async function getProfile(id: string): Promise<ServiceResult<Profile>> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  return toResult(data, error);
}

export async function updateProfile(
  id: string,
  dados: Partial<Pick<Profile, 'name' | 'avatar_url' | 'phone' | 'bio' | 'interests'>>
): Promise<ServiceResult<Profile>> {
  const { data, error } = await supabase.from('profiles').update(dados).eq('id', id).select().single();
  return toResult(data, error);
}

/**
 * Única forma sancionada de um usuário trocar a PRÓPRIA role. Chama a
 * function set_own_role() (supabase/schema.sql / migração 001), que é
 * SECURITY DEFINER e só afeta a linha de auth.uid() - por isso não recebe
 * mais um `id`: não é possível (nem faz sentido) trocar a role de outra
 * pessoa por aqui. UPDATE direto na coluna role NÃO funciona mais - a
 * policy profiles_self_update passou a ter um WITH CHECK que bloqueia
 * qualquer mudança de role feita fora desta function.
 */
export async function updateRole(role: UserRole): Promise<ServiceResult<Profile>> {
  if (role === 'admin') {
    // set_own_role também recusa isso (RAISE EXCEPTION lá dentro) - checamos
    // aqui antes pra falhar rápido, sem round-trip, com mensagem previsível.
    return { data: null, error: 'Não é permitido definir a própria role como admin.' };
  }

  const { data, error } = await supabase.rpc('set_own_role', { new_role: role });
  return toResult(data as Profile | null, error);
}

/** Soft delete - grava profiles.deleted_at, não remove a linha nem o usuário do auth.users. */
export async function deleteAccount(id: string): Promise<ServiceResult<Profile>> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return toResult(data, error);
}
