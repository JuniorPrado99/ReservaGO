import { supabase } from '../lib/supabase';
import { Property, Report, ReportStatus, ServiceResult, toResult } from './types';

// Estatísticas e moderação pro admin-dashboard.tsx. `AdminStats` não é uma
// tabela do schema - é um agregado montado a partir de properties/bookings/
// profiles/reports pra alimentar o painel.
export interface AdminStats {
  totalProperties: number;
  totalBookings: number;
  totalUsers: number;
  pendingProperties: number;
  pendingReports: number;
}

export async function getStats(): Promise<ServiceResult<AdminStats>> {
  const [properties, bookings, users, pendingProperties, pendingReports] = await Promise.all([
    supabase.from('properties').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
  ]);

  const firstError = [properties, bookings, users, pendingProperties, pendingReports].find((r) => r.error)?.error;
  if (firstError) return toResult<AdminStats>(null, firstError);

  return {
    data: {
      totalProperties: properties.count ?? 0,
      totalBookings: bookings.count ?? 0,
      totalUsers: users.count ?? 0,
      pendingProperties: pendingProperties.count ?? 0,
      pendingReports: pendingReports.count ?? 0,
    },
    error: null,
  };
}

export async function getPendingProperties(): Promise<ServiceResult<Property[]>> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('status', 'pendente')
    .order('created_at', { ascending: true });
  return toResult(data, error);
}

export async function getReports(status?: ReportStatus): Promise<ServiceResult<Report[]>> {
  let query = supabase.from('reports').select('*');
  if (status) query = query.eq('status', status);
  const { data, error } = await query.order('created_at', { ascending: false });
  return toResult(data, error);
}

export async function resolveReport(
  id: string,
  resolvedBy?: string,
  resolution?: string
): Promise<ServiceResult<Report>> {
  const { data, error } = await supabase
    .from('reports')
    .update({
      status: 'resolvido',
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy ?? null,
      resolution: resolution ?? null,
    })
    .eq('id', id)
    .select()
    .single();
  return toResult(data, error);
}
