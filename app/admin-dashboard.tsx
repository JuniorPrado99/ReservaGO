import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LayoutDashboard, CheckCircle, XCircle, TrendingUp, Users, Home, ChevronLeft, AlertOctagon, Star, ShieldAlert } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { AdminStats, getPendingProperties, getReports, getStats, resolveReport } from '../services/adminService';
import { approveProperty } from '../services/propertyService';
import type { Property as DbProperty, Report } from '../services/types';

// Ranking de mais reservadas e o gerenciador de destaques não têm função
// correspondente em services/ ainda (getStats() traz só contagens gerais) -
// continuam ilustrativos de propósito, marcados como tal na tela. O resto
// (estatísticas, aprovações, denúncias) usa dados reais do adminService.
const topCabins = [
  { id: '1', name: 'Recanto das Águas', reservations: 145, rating: 4.9 },
  { id: '2', name: 'Chalé Suíço', reservations: 120, rating: 4.8 },
  { id: '3', name: 'Cabana Isolada', reservations: 95, rating: 4.7 },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [tab, setTab] = useState<'stats' | 'approvals' | 'reports' | 'highlights'>('stats');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [pendingCabins, setPendingCabins] = useState<DbProperty[]>([]);
  const [loadingCabins, setLoadingCabins] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  const loadStats = () => {
    if (!isAdmin) { setLoadingStats(false); return; }
    setLoadingStats(true);
    getStats().then(({ data, error }) => {
      if (error) console.log('[admin] getStats falhou ->', error);
      setStats(data);
      setLoadingStats(false);
    });
  };

  const loadPending = () => {
    if (!isAdmin) { setLoadingCabins(false); return; }
    setLoadingCabins(true);
    getPendingProperties().then(({ data, error }) => {
      if (error) console.log('[admin] getPendingProperties falhou ->', error);
      setPendingCabins(data ?? []);
      setLoadingCabins(false);
    });
  };

  const loadReports = () => {
    if (!isAdmin) { setLoadingReports(false); return; }
    setLoadingReports(true);
    getReports().then(({ data, error }) => {
      if (error) console.log('[admin] getReports falhou ->', error);
      setReports((data ?? []).filter((r) => r.status === 'pendente' || r.status === 'em_analise'));
      setLoadingReports(false);
    });
  };

  useEffect(() => {
    loadStats();
    loadPending();
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const handleApprove = async (property: DbProperty, aprovado: boolean) => {
    const { error } = await approveProperty(property.id, aprovado);
    if (error) {
      Alert.alert('Erro', 'Não foi possível atualizar esse anúncio agora. Tente novamente.');
      return;
    }
    Alert.alert('Sucesso', `"${property.title}" foi ${aprovado ? 'aprovada' : 'reprovada'}.`);
    loadPending();
    loadStats();
  };

  const handleResolveReport = async (report: Report) => {
    const { error } = await resolveReport(report.id, user?.id);
    if (error) {
      Alert.alert('Erro', 'Não foi possível resolver essa denúncia agora. Tente novamente.');
      return;
    }
    Alert.alert('Denúncia resolvida', 'A denúncia foi marcada como resolvida.');
    loadReports();
    loadStats();
  };

  // Protege o acesso: só role === 'admin' vê o painel. A garantia de
  // verdade é a RLS no banco (properties_admin_update, reports_admin_*),
  // isto aqui é só pra não nem mostrar a UI pra quem não é admin.
  if (!isAdmin) {
    return (
      <View style={styles.deniedContainer}>
        <ShieldAlert size={48} color="#EF4444" />
        <Text style={styles.deniedTitle}>Acesso restrito</Text>
        <Text style={styles.deniedText}>Esta área é exclusiva para administradores.</Text>
        <TouchableOpacity style={styles.deniedBtn} onPress={() => router.back()}>
          <Text style={styles.deniedBtnText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statCards = stats
    ? [
        { label: 'Usuários cadastrados', value: String(stats.totalUsers), icon: Users, color: '#3B82F6' },
        { label: 'Cabanas na plataforma', value: String(stats.totalProperties), icon: Home, color: '#F59E0B' },
        { label: 'Reservas totais', value: String(stats.totalBookings), icon: TrendingUp, color: '#10B981' },
        { label: 'Anúncios pendentes', value: String(stats.pendingProperties), icon: CheckCircle, color: '#8B5CF6' },
      ]
    : [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft color="#1F2937" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Painel de Controle</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity style={[styles.tab, tab === 'stats' && styles.activeTab]} onPress={() => setTab('stats')}>
            <LayoutDashboard size={18} color={tab === 'stats' ? '#2D5A27' : '#9CA3AF'} />
            <Text style={[styles.tabText, tab === 'stats' && styles.activeTabText]}>Dados</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tab, tab === 'approvals' && styles.activeTab]} onPress={() => setTab('approvals')}>
            <CheckCircle size={18} color={tab === 'approvals' ? '#2D5A27' : '#9CA3AF'} />
            <Text style={[styles.tabText, tab === 'approvals' && styles.activeTabText]}>
              Aprovações{pendingCabins.length > 0 ? ` (${pendingCabins.length})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tab, tab === 'reports' && styles.activeTab]} onPress={() => setTab('reports')}>
            <AlertOctagon size={18} color={tab === 'reports' ? '#EF4444' : '#9CA3AF'} />
            <Text style={[styles.tabText, tab === 'reports' && { color: '#EF4444' }]}>
              Denúncias{reports.length > 0 ? ` (${reports.length})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tab, tab === 'highlights' && styles.activeTab]} onPress={() => setTab('highlights')}>
            <Star size={18} color={tab === 'highlights' ? '#2D5A27' : '#9CA3AF'} />
            <Text style={[styles.tabText, tab === 'highlights' && styles.activeTabText]}>Destaques</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>

        {tab === 'stats' && (
          <View>
            <Text style={styles.sectionTitle}>Estatísticas da Plataforma</Text>
            {loadingStats ? (
              <ActivityIndicator size="large" color="#2D5A27" style={{ marginVertical: 20 }} />
            ) : (
              <View style={styles.statsGrid}>
                {statCards.map((item, index) => (
                  <View key={index} style={styles.statCard}>
                    <item.icon size={24} color={item.color} />
                    <Text style={styles.statValue}>{item.value}</Text>
                    <Text style={styles.statLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Ranking: Cabanas Mais Usadas</Text>
            <Text style={styles.mockNotice}>Dados ilustrativos - ranking real ainda não conectado.</Text>
            {topCabins.map((cabin, index) => (
              <View key={cabin.id} style={styles.rankingCard}>
                <View style={styles.rankNumber}><Text style={{ color: '#fff', fontWeight: 'bold' }}>{index + 1}</Text></View>
                <View style={{ flex: 1, marginLeft: 15 }}>
                  <Text style={styles.cabinName}>{cabin.name}</Text>
                  <Text style={styles.cabinHost}>{cabin.reservations} reservas efetuadas</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Star size={16} color="#F59E0B" fill="#F59E0B" />
                  <Text style={{ fontWeight: 'bold', marginLeft: 4 }}>{cabin.rating}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {tab === 'approvals' && (
          <View>
            <Text style={styles.sectionTitle}>Anúncios Pendentes ({pendingCabins.length})</Text>
            {loadingCabins ? (
              <ActivityIndicator size="large" color="#2D5A27" style={{ marginVertical: 20 }} />
            ) : pendingCabins.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum anúncio aguardando aprovação.</Text>
            ) : (
              pendingCabins.map((cabin) => (
                <View key={cabin.id} style={styles.cabinCard}>
                  <View style={styles.cabinInfo}>
                    <Text style={styles.cabinName}>{cabin.title}</Text>
                    <Text style={styles.cabinHost}>{cabin.location || 'Localização não informada'}</Text>
                    <Text style={styles.cabinPrice}>R$ {cabin.price}/noite</Text>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity onPress={() => handleApprove(cabin, true)}>
                      <CheckCircle size={32} color="#10B981" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleApprove(cabin, false)}>
                      <XCircle size={32} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {tab === 'reports' && (
          <View>
            <Text style={styles.sectionTitle}>Denúncias pendentes</Text>
            {loadingReports ? (
              <ActivityIndicator size="large" color="#2D5A27" style={{ marginVertical: 20 }} />
            ) : reports.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma denúncia pendente no momento.</Text>
            ) : (
              reports.map((report) => (
                <View key={report.id} style={styles.reportCard}>
                  <Text style={{ fontWeight: 'bold', color: '#1F2937', fontSize: 16 }}>Motivo</Text>
                  <Text style={{ color: '#EF4444', fontStyle: 'italic', marginVertical: 10 }}>"{report.reason}"</Text>
                  {!!report.details && <Text style={{ color: '#4B5563', marginBottom: 10 }}>{report.details}</Text>}
                  <TouchableOpacity style={styles.banBtn} onPress={() => handleResolveReport(report)}>
                    <Text style={styles.banText}>Marcar como resolvida</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {tab === 'highlights' && (
          <View>
            <Text style={styles.sectionTitle}>Gerenciar Tela Explorar</Text>
            <Text style={styles.mockNotice}>Ilustrativo - ainda não conectado a nenhuma tabela real.</Text>
            <Text style={{ color: '#6B7280', marginBottom: 20 }}>Altere como os carrosséis de cabanas aparecem para os usuários na tela principal.</Text>

            <View style={styles.carrosselSetting}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>Modo de Exibição</Text>
                <Text style={styles.settingDesc}>Definir cabanas em destaque manualmente ou deixar o sistema escolher baseado em popularidade.</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.settingBtnActive}>
               <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Automático (Baseado no Ranking)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingBtnOutline}>
               <Text style={{ color: '#2D5A27', fontWeight: 'bold', textAlign: 'center' }}>Manual (Escolher Cabanas)</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingTop: 60, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', paddingBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },

  deniedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#fff' },
  deniedTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginTop: 16 },
  deniedText: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8, marginBottom: 24 },
  deniedBtn: { backgroundColor: '#2D5A27', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  deniedBtnText: { color: '#fff', fontWeight: 'bold' },

  tabBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, paddingHorizontal: 20, gap: 8 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#2D5A27' },
  tabText: { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
  activeTabText: { color: '#2D5A27' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#374151' },
  mockNotice: { fontSize: 12, color: '#9CA3AF', fontStyle: 'italic', marginTop: -14, marginBottom: 14 },
  emptyText: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', paddingVertical: 30 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { backgroundColor: '#fff', width: '48%', padding: 20, borderRadius: 15, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 15 },
  statValue: { fontSize: 24, fontWeight: 'bold', marginVertical: 8 },
  statLabel: { fontSize: 12, color: '#6B7280' },

  rankingCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
  rankNumber: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#2D5A27', justifyContent: 'center', alignItems: 'center' },

  cabinCard: { backgroundColor: '#fff', padding: 20, borderRadius: 15, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6' },
  cabinInfo: { flex: 1 },
  cabinName: { fontSize: 16, fontWeight: 'bold' },
  cabinHost: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  cabinPrice: { fontSize: 14, color: '#2D5A27', fontWeight: '700', marginTop: 4 },
  actionButtons: { flexDirection: 'row', gap: 15 },

  reportCard: { backgroundColor: '#FEF2F2', padding: 20, borderRadius: 15, borderWidth: 1, borderColor: '#FEE2E2', marginBottom: 15 },
  banBtn: { backgroundColor: '#EF4444', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  banText: { color: '#fff', fontWeight: 'bold' },

  carrosselSetting: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 15, borderWidth: 1, borderColor: '#EEE', marginBottom: 20 },
  settingTitle: { fontWeight: 'bold', fontSize: 16 },
  settingDesc: { color: '#6B7280', fontSize: 13, marginTop: 5 },
  settingBtnActive: { backgroundColor: '#2D5A27', padding: 15, borderRadius: 12, marginBottom: 10 },
  settingBtnOutline: { borderWidth: 1, borderColor: '#2D5A27', padding: 15, borderRadius: 12 },
});
