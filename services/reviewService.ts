import { supabase } from '../lib/supabase';
import { NewReview, Review, ServiceResult, toResult } from './types';

// Acesso à tabela `reviews` (supabase/schema.sql). O trigger
// reviews_rating_trigger (linha 243) recalcula properties.rating/reviews_count
// sozinho a cada INSERT/UPDATE/DELETE - não precisa duplicar essa conta aqui.

export async function createReview(dados: NewReview): Promise<ServiceResult<Review>> {
  const { data, error } = await supabase.from('reviews').insert(dados).select().single();
  return toResult(data, error);
}

export async function getReviewsByProperty(propertyId: string): Promise<ServiceResult<Review[]>> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });
  return toResult(data, error);
}

/** UNIQUE(booking_id, author_id) em reviews (schema.sql linha 221) é a mesma regra checada aqui. */
export async function hasReviewed(guestId: string, bookingId: string): Promise<ServiceResult<boolean>> {
  const { data, error } = await supabase
    .from('reviews')
    .select('id')
    .eq('author_id', guestId)
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (error) return toResult<boolean>(null, error);
  return { data: data !== null, error: null };
}
