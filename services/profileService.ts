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

export async function updateRole(id: string, role: UserRole): Promise<ServiceResult<Profile>> {
  const { data, error } = await supabase.from('profiles').update({ role }).eq('id', id).select().single();
  return toResult(data, error);
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
