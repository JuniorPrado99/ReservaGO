import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LayoutDashboard, CheckCircle, XCircle, TrendingUp, Users, Home, ChevronLeft } from 'lucide-react-native';

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<'stats' | 'approvals'>('stats');

  // Dados simulados para o Admin
  const stats = [
    { label: 'Reservas Hoje', value: '12', icon: TrendingUp, color: '#10B981' },
    { label: 'Novos Usuários', value: '48', icon: Users, color: '#3B82F6' },
    { label: 'Cabanas Ativas', value: '156', icon: Home, color: '#F59E0B' },
  ];

  const pendingCabins = [
    { id: '1', name: 'Cabana do Pico Azul', host: 'João Silva', price: '450' },
    { id: '2', name: 'Refúgio na Mata', host: 'Maria Oliveira', price: '320' },
  ];

  const handleAction = (name: string, action: 'aprovar' | 'reprovar') => {
    Alert.alert("Sucesso", `Cabana "${name}" foi ${action}da com sucesso!`);
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
        <TouchableOpacity 
          style={[styles.tab, tab === 'stats' && styles.activeTab]} 
          onPress={() => setTab('stats')}
        >
          <LayoutDashboard size={20} color={tab === 'stats' ? '#2D5A27' : '#9CA3AF'} />
          <Text style={[styles.tabText, tab === 'stats' && styles.activeTabText]}>Estatísticas</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, tab === 'approvals' && styles.activeTab]} 
          onPress={() => setTab('approvals')}
        >
          <CheckCircle size={20} color={tab === 'approvals' ? '#2D5A27' : '#9CA3AF'} />
          <Text style={[styles.tabText, tab === 'approvals' && styles.activeTabText]}>Aprovações</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* CONTEÚDO B: ESTATÍSTICAS */}
        {tab === 'stats' && (
          <View>
            <Text style={styles.sectionTitle}>Visão Geral</Text>
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
              <Text style={styles.chartText}>[ Gráfico de Crescimento Semanal ]</Text>
            </View>
          </View>
        )}

        {/* CONTEÚDO A: APROVAÇÕES */}
        {tab === 'approvals' && (
          <View>
            <Text style={styles.sectionTitle}>Pendentes ({pendingCabins.length})</Text>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingTop: 60, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', paddingBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, gap: 8 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#2D5A27' },
  tabText: { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
  activeTabText: { color: '#2D5A27' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#374151' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  statCard: { backgroundColor: '#fff', width: '47%', padding: 20, borderRadius: 15, borderWidth: 1, borderColor: '#F3F4F6' },
  statValue: { fontSize: 24, fontWeight: 'bold', marginVertical: 8 },
  statLabel: { fontSize: 12, color: '#6B7280' },
  chartPlaceholder: { height: 150, backgroundColor: '#E5E7EB', borderRadius: 15, marginTop: 20, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#9CA3AF' },
  chartText: { color: '#6B7280', fontSize: 14 },
  cabinCard: { backgroundColor: '#fff', padding: 20, borderRadius: 15, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6' },
  cabinInfo: { flex: 1 },
  cabinName: { fontSize: 16, fontWeight: 'bold' },
  cabinHost: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  cabinPrice: { fontSize: 14, color: '#2D5A27', fontWeight: '700', marginTop: 4 },
  actionButtons: { flexDirection: 'row', gap: 15 },
});