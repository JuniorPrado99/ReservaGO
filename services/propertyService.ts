import { supabase } from '../lib/supabase';
import { NewProperty, Property, PropertyFilters, ServiceResult, toResult } from './types';

// Acesso à tabela `properties` (supabase/schema.sql). Nenhuma lógica de UI
// aqui - só monta a query e devolve { data, error }.

export async function getProperties(filtros?: PropertyFilters): Promise<ServiceResult<Property[]>> {
  let query = supabase.from('properties').select('*').eq('status', filtros?.status ?? 'ativo');

  if (filtros?.category) query = query.eq('category', filtros.category);
  if (filtros?.subCategory) query = query.eq('sub_category', filtros.subCategory);
  if (filtros?.isolationLevel) query = query.eq('isolation_level', filtros.isolationLevel);
  if (filtros?.maxPrice !== undefined) query = query.lte('price', filtros.maxPrice);
  if (filtros?.minPrice !== undefined) query = query.gte('price', filtros.minPrice);
  if (filtros?.search) {
    // idx_properties_search (gin/to_tsvector) cobre title+location; ilike
    // simples aqui pra não depender de sintaxe de full-text no client.
    query = query.or(`title.ilike.%${filtros.search}%,location.ilike.%${filtros.search}%`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  return toResult(data, error);
}

export async function getPropertyById(id: string): Promise<ServiceResult<Property>> {
  const { data, error } = await supabase.from('properties').select('*').eq('id', id).single();
  return toResult(data, error);
}

export async function getPropertiesByHost(hostId: string): Promise<ServiceResult<Property[]>> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('owner_id', hostId)
    .order('created_at', { ascending: false });
  return toResult(data, error);
}

export async function createProperty(dados: NewProperty): Promise<ServiceResult<Property>> {
  // status default 'pendente' vem do banco se omitido (properties.status
  // NOT NULL DEFAULT 'pendente') - moderação entra em aprovada via approveProperty.
  const { data, error } = await supabase.from('properties').insert(dados).select().single();
  return toResult(data, error);
}

export async function approveProperty(id: string, aprovado: boolean): Promise<ServiceResult<Property>> {
  // cabin_status não tem um valor "rejeitado" dedicado - usamos 'ativo' pra
  // aprovar e 'inativo' pra reprovar (RLS properties_admin_update permite
  // update por role='admin'; ver schema.sql linha 567).
  const { data, error } = await supabase
    .from('properties')
    .update({ status: aprovado ? 'ativo' : 'inativo' })
    .eq('id', id)
    .select()
    .single();
  return toResult(data, error);
}
