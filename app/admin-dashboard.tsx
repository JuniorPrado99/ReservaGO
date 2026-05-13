import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LayoutDashboard, CheckCircle, XCircle, TrendingUp, Users, Home, ChevronLeft, AlertOctagon, Star } from 'lucide-react-native';

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<'stats' | 'approvals' | 'reports' | 'highlights'>('stats');
  const [reportFilter, setReportFilter] = useState<'hospedes' | 'anfitrioes'>('hospedes');

  // Dados simulados para Estatísticas
  const stats = [
    { label: 'Hóspedes Registrados', value: '10.245', icon: Users, color: '#3B82F6' },
    { label: 'Anfitriões Ativos', value: '1.450', icon: Users, color: '#8B5CF6' },
    { label: 'Cabanas na Plataforma', value: '3.820', icon: Home, color: '#F59E0B' },
    { label: 'Reservas Hoje', value: '142', icon: TrendingUp, color: '#10B981' },
  ];

  const pendingCabins = [
    { id: '1', name: 'Cabana do Pico Azul', host: 'João Silva', price: '450' },
    { id: '2', name: 'Refúgio na Mata', host: 'Maria Oliveira', price: '320' },
  ];

  // Ranking das mais reservadas
  const topCabins = [
    { id: '1', name: 'Recanto das Águas', reservations: 145, rating: 4.9 },
    { id: '2', name: 'Chalé Suíço', reservations: 120, rating: 4.8 },
    { id: '3', name: 'Cabana Isolada', reservations: 95, rating: 4.7 },
  ];

  // Denúncias simuladas (separadas por tipo de usuário denunciado)
  const reports = {
    hospedes: [
      { id: 'R1', user: 'Carlos Silva', reason: 'Fez festa e quebrou as regras da casa', status: 'pendente' }
    ],
    anfitrioes: [
      { id: 'R2', user: 'Marcos (Anfitrião)', reason: 'Local sujo e diferente das fotos', status: 'pendente' }
    ]
  };

  const handleAction = (name: string, action: 'aprovar' | 'reprovar' | 'remover') => {
    Alert.alert("Sucesso", `Ação "${action}" concluída para "${name}".`);
  };

  return (
    <View style={styles.container}>
      {/* Header com botão voltar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft color="#1F2937" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Painel de Controle</Text>
        <View style={{ width: 28 }} /> 
      </View>

      {/* Tabs de navegação interna */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity style={[styles.tab, tab === 'stats' && styles.activeTab]} onPress={() => setTab('stats')}>
            <LayoutDashboard size={18} color={tab === 'stats' ? '#2D5A27' : '#9CA3AF'} />
            <Text style={[styles.tabText, tab === 'stats' && styles.activeTabText]}>Dados</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tab, tab === 'approvals' && styles.activeTab]} onPress={() => setTab('approvals')}>
            <CheckCircle size={18} color={tab === 'approvals' ? '#2D5A27' : '#9CA3AF'} />
            <Text style={[styles.tabText, tab === 'approvals' && styles.activeTabText]}>Aprovações</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tab, tab === 'reports' && styles.activeTab]} onPress={() => setTab('reports')}>
            <AlertOctagon size={18} color={tab === 'reports' ? '#EF4444' : '#9CA3AF'} />
            <Text style={[styles.tabText, tab === 'reports' && { color: '#EF4444' }]}>Denúncias</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tab, tab === 'highlights' && styles.activeTab]} onPress={() => setTab('highlights')}>
            <Star size={18} color={tab === 'highlights' ? '#2D5A27' : '#9CA3AF'} />
            <Text style={[styles.tabText, tab === 'highlights' && styles.activeTabText]}>Destaques</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        {/* CONTEÚDO 1: ESTATÍSTICAS E RANKING */}
        {tab === 'stats' && (
          <View>
            <Text style={styles.sectionTitle}>Estatísticas Plataforma</Text>
            <View style={styles.statsGrid}>
              {stats.map((item, index) => (
                <View key={index} style={styles.statCard}>
                  <item.icon size={24} color={item.color} />
                  <Text style={styles.statValue}>{item.value}</Text>
                  <Text style={styles.statLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
            
            <View style={styles.chartPlaceholder}>
              <Text style={styles.chartText}>[ Gráfico de Criação de Contas por Mês ]</Text>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Ranking: Cabanas Mais Usadas</Text>
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
                {/* Opção do Admin de remover qualquer cabana do app */}
                <TouchableOpacity style={styles.removeBtn} onPress={() => handleAction(cabin.name, 'remover')}>
                   <XCircle size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* CONTEÚDO 2: APROVAÇÕES (Original) */}
        {tab === 'approvals' && (
          <View>
            <Text style={styles.sectionTitle}>Anúncios Pendentes ({pendingCabins.length})</Text>
            {pendingCabins.map((cabin) => (
              <View key={cabin.id} style={styles.cabinCard}>
                <View style={styles.cabinInfo}>
                  <Text style={styles.cabinName}>{cabin.name}</Text>
                  <Text style={styles.cabinHost}>Anfitrião: {cabin.host}</Text>
                  <Text style={styles.cabinPrice}>R$ {cabin.price}/noite</Text>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity onPress={() => handleAction(cabin.name, 'aprovar')}>
                    <CheckCircle size={32} color="#10B981" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleAction(cabin.name, 'reprovar')}>
                    <XCircle size={32} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* CONTEÚDO 3: MENSAGENS DE DENÚNCIAS */}
        {tab === 'reports' && (
          <View>
            <Text style={styles.sectionTitle}>Central de Denúncias</Text>
            
            <View style={styles.filterRow}>
              <TouchableOpacity 
                style={[styles.filterBtn, reportFilter === 'hospedes' && styles.filterBtnActive]}
                onPress={() => setReportFilter('hospedes')}
              >
                <Text style={[styles.filterText, reportFilter === 'hospedes' && { color: '#fff' }]}>Contra Hóspedes</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterBtn, reportFilter === 'anfitrioes' && styles.filterBtnActive]}
                onPress={() => setReportFilter('anfitrioes')}
              >
                <Text style={[styles.filterText, reportFilter === 'anfitrioes' && { color: '#fff' }]}>Contra Anfitriões</Text>
              </TouchableOpacity>
            </View>

            {reports[reportFilter].map((report) => (
              <View key={report.id} style={styles.reportCard}>
                <Text style={{ fontWeight: 'bold', color: '#1F2937', fontSize: 16 }}>Denunciado: {report.user}</Text>
                <Text style={{ color: '#EF4444', fontStyle: 'italic', marginVertical: 10 }}>Motivo: "{report.reason}"</Text>
                <TouchableOpacity style={styles.banBtn} onPress={() => Alert.alert('Suspensão', `Usuário ${report.user} banido da plataforma.`)}>
                  <Text style={styles.banText}>Suspender Conta</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* CONTEÚDO 4: CARROSSEL MANUAL / AUTOMÁTICO */}
        {tab === 'highlights' && (
          <View>
            <Text style={styles.sectionTitle}>Gerenciar Tela Explorar</Text>
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
  
  tabBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, paddingHorizontal: 20, gap: 8 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#2D5A27' },
  tabText: { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
  activeTabText: { color: '#2D5A27' },
  
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#374151' },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { backgroundColor: '#fff', width: '48%', padding: 20, borderRadius: 15, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 15 },
  statValue: { fontSize: 24, fontWeight: 'bold', marginVertical: 8 },
  statLabel: { fontSize: 12, color: '#6B7280' },
  
  chartPlaceholder: { height: 150, backgroundColor: '#E5E7EB', borderRadius: 15, marginTop: 10, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#9CA3AF' },
  chartText: { color: '#6B7280', fontSize: 14 },
  
  rankingCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
  rankNumber: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#2D5A27', justifyContent: 'center', alignItems: 'center' },
  removeBtn: { padding: 10, marginLeft: 10 },
  
  cabinCard: { backgroundColor: '#fff', padding: 20, borderRadius: 15, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6' },
  cabinInfo: { flex: 1 },
  cabinName: { fontSize: 16, fontWeight: 'bold' },
  cabinHost: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  cabinPrice: { fontSize: 14, color: '#2D5A27', fontWeight: '700', marginTop: 4 },
  actionButtons: { flexDirection: 'row', gap: 15 },

  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  filterBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#E5E7EB', alignItems: 'center' },
  filterBtnActive: { backgroundColor: '#1F2937' },
  filterText: { fontWeight: '600', color: '#4B5563' },

  reportCard: { backgroundColor: '#FEF2F2', padding: 20, borderRadius: 15, borderWidth: 1, borderColor: '#FEE2E2', marginBottom: 15 },
  banBtn: { backgroundColor: '#EF4444', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  banText: { color: '#fff', fontWeight: 'bold' },

  carrosselSetting: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 15, borderWidth: 1, borderColor: '#EEE', marginBottom: 20 },
  settingTitle: { fontWeight: 'bold', fontSize: 16 },
  settingDesc: { color: '#6B7280', fontSize: 13, marginTop: 5 },
  settingBtnActive: { backgroundColor: '#2D5A27', padding: 15, borderRadius: 12, marginBottom: 10 },
  settingBtnOutline: { borderWidth: 1, borderColor: '#2D5A27', padding: 15, borderRadius: 12 },
});