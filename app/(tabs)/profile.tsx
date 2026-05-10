import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import {
  User,
  Settings,
  Bell,
  ShieldCheck,
  LogOut,
  ChevronRight,
  LogIn,
  LayoutDashboard,
  Home,
  FileText,
  Trash2,
  Star,
  MapPin,
  Calendar,
  X,
  Camera,
  Check
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

// --- MOCKS DE DADOS DO HÓSPEDE ---
const PAST_TRIPS = [
  { id: '1', title: 'Refúgio das Pedras', date: 'Dez 2024', image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=300&q=80' },
  { id: '2', title: 'Cabana Suíça', date: 'Out 2024', image: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=300&q=80' },
];

const ALL_INTERESTS = [
  'Atividades ao ar livre', 'Esportes aquáticos', 'Gastronomia', 
  'Vinho', 'Trilhas', 'Neve', 'Praia', 'Isolamento'
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // --- ESTADOS DE EDIÇÃO DE PERFIL ---
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || 'Visitante');
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || 'https://i.pravatar.cc/150?img=11');
  const [profileBio, setProfileBio] = useState('Apaixonado por natureza e lugares calmos. Sempre em busca da próxima fogueira e um bom vinho sob as estrelas.');
  const [profileInterests, setProfileInterests] = useState(['Atividades ao ar livre', 'Gastronomia', 'Vinho']);

  // Estados temporários (para o modal)
  const [tempName, setTempName] = useState(profileName);
  const [tempAvatar, setTempAvatar] = useState(profileAvatar);
  const [tempBio, setTempBio] = useState(profileBio);
  const [tempInterests, setTempInterests] = useState(profileInterests);

  // --- FUNÇÃO PARA ABRIR A GALERIA ---
  const pickProfileImage = async () => {
    try {
      // 1. Pede permissão
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permissão Necessária", "Você precisa permitir o acesso à galeria para alterar a foto!");
        return;
      }

      // 2. Abre a galeria
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Formato quadrado
        quality: 0.8,
      });

      // 3. Salva a foto no "tempAvatar" para aparecer no Modal
      if (!result.canceled) {
        setTempAvatar(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Erro", "Ocorreu um problema ao tentar abrir a galeria.");
      console.log(error);
    }
  };

  const openEditModal = () => {
    setTempName(profileName);
    setTempAvatar(profileAvatar);
    setTempBio(profileBio);
    setTempInterests(profileInterests);
    setEditModalVisible(true);
  };

  const saveProfile = () => {
    setProfileName(tempName);
    setProfileAvatar(tempAvatar);
    setProfileBio(tempBio);
    setProfileInterests(tempInterests);
    setEditModalVisible(false);
  };

  const toggleInterest = (interest: string) => {
    if (tempInterests.includes(interest)) {
      setTempInterests(tempInterests.filter(i => i !== interest));
    } else {
      setTempInterests([...tempInterests, interest]);
    }
  };

  const MenuItem = ({
    icon: Icon,
    title,
    subtitle,
    onPress,
    color = "#4B5563",
    showBadge = false,
  }: {
    icon: any;
    title: string;
    subtitle?: string;
    onPress: () => void;
    color?: string;
    showBadge?: boolean;
  }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIconContainer}>
        <Icon size={22} color={color} />
        {showBadge && <View style={styles.notificationBadge} />}
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuTitle, { color: color === "#EF4444" ? "#EF4444" : "#374151" }]}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <ChevronRight size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );

  // --- 1. VISÃO DO CONVIDADO (Não logado) ---
  if (!user) {
    return (
      <View style={styles.containerCenter}>
        <View style={styles.guestContent}>
          <View style={styles.iconCircle}>
            <User size={40} color="#2D5A27" />
          </View>
          <Text style={styles.headerTitle}>Seu Perfil</Text>
          <Text style={styles.guestSubtitle}>
            Faça login para planejar sua próxima viagem, gerenciar suas cabanas e ver suas mensagens.
          </Text>

          <TouchableOpacity style={styles.loginButton} onPress={() => router.push('../login')}>
            <LogIn size={20} color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.loginButtonText}>Entrar ou Cadastrar-se</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- 2. VISÃO DO USUÁRIO LOGADO ---
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Perfil</Text>

          <View style={styles.userCard}>
            <Image source={{ uri: profileAvatar }} style={styles.avatar} />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{profileName}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* --- PAINEL EXCLUSIVO DO HÓSPEDE --- */}
        {user.role === 'hospede' && (
          <View style={styles.guestDashboard}>
            {/* Estatísticas */}
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Star size={24} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.statValue}>4.9</Text>
                <Text style={styles.statLabel}>Avaliação</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <MapPin size={24} color="#2D5A27" />
                <Text style={styles.statValue}>12</Text>
                <Text style={styles.statLabel}>Viagens</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Calendar size={24} color="#6B7280" />
                <Text style={styles.statValue}>2023</Text>
                <Text style={styles.statLabel}>Membro desde</Text>
              </View>
            </View>

            {/* Sobre mim */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionSubTitle}>Sobre mim</Text>
              <Text style={styles.bioText}>{profileBio}</Text>
            </View>

            {/* Interesses */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionSubTitle}>Interesses</Text>
              <View style={styles.interestsGrid}>
                {profileInterests.map((interest, index) => (
                  <View key={index} style={styles.interestChip}>
                    <Text style={styles.interestChipText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Viagens Anteriores */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionSubTitle}>Viagens Anteriores</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
                {PAST_TRIPS.map(trip => (
                  <View key={trip.id} style={styles.pastTripCard}>
                    <Image source={{ uri: trip.image }} style={styles.pastTripImage} />
                    <View style={styles.pastTripOverlay}>
                      <Text style={styles.pastTripTitle}>{trip.title}</Text>
                      <Text style={styles.pastTripDate}>{trip.date}</Text>
                    </View>
                  </View>
                ))}
                {/* Espaçador no final do scroll */}
                <View style={{ width: 20 }} />
              </ScrollView>
            </View>
          </View>
        )}

        {/* SEÇÃO HOSPEDAGEM (Anfitrião e Admin) */}
        {(user.role === 'anfitriao' || user.role === 'admin') && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Hospedagem</Text>
            <MenuItem
              icon={Settings}
              title="Anunciar nova cabana"
              subtitle="Cadastre um novo imóvel no sistema"
              onPress={() => router.push('../create-listing')}
            />
            <MenuItem
              icon={ShieldCheck}
              title="Painel de Gerenciamento"
              subtitle="Ver reservas e editar anúncios"
              onPress={() => router.push('../my-cabins')}
            />
          </View>
        )}

        {/* SEÇÃO HÓSPEDE (Para virar anfitrião) */}
        {user.role === 'hospede' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Ganhe dinheiro com seu espaço</Text>
            <MenuItem
              icon={Home}
              title="Torne-se um anfitrião"
              subtitle="Anuncie sua cabana e comece a lucrar"
              onPress={() => router.push('../select-role')} 
            />
          </View>
        )}

        {/* SEÇÃO ADMIN */}
        {user.role === 'admin' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Administração</Text>
            <MenuItem
              icon={LayoutDashboard}
              title="Painel de Controle"
              subtitle="Gerenciar cabanas e ver estatísticas"
              onPress={() => router.push('../admin-dashboard')}
            />
          </View>
        )}

        {/* SEÇÃO GERAL / CONFIGURAÇÕES */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Configurações da Conta</Text>

          <MenuItem
            icon={User}
            title="Editar Perfil"
            subtitle="Informações pessoais e interesses"
            onPress={openEditModal}
          />

          <MenuItem
            icon={Bell}
            title="Notificações"
            subtitle="Você tem 2 novos alertas"
            onPress={() => {}}
            showBadge={true}
          />

          <MenuItem
            icon={ShieldCheck}
            title="Privacidade"
            subtitle="Recibos de leitura e visibilidade"
            onPress={() => {}}
          />
          
          <MenuItem
            icon={FileText}
            title="Termos de Serviço"
            subtitle="Regras e políticas do ReservaGO"
            onPress={() => {}}
          />
        </View>

        {/* BOTÕES DE SAÍDA E EXCLUSÃO */}
        <View style={styles.dangerZone}>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Sair da conta</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={() => { /* Lógica de excluir conta */ }}>
            <Trash2 size={20} color="#EF4444" />
            <Text style={styles.deleteText}>Excluir conta</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>Versão 1.0.0 Beta</Text>
      </ScrollView>

      {/* --- MODAL DE EDIÇÃO DE PERFIL --- */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.closeModalBtn}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
              {/* Foto do Perfil */}
              <View style={styles.editAvatarContainer}>
                <Image source={{ uri: tempAvatar }} style={styles.editAvatarImage} />
                <TouchableOpacity style={styles.editAvatarBtn} onPress={pickProfileImage}>
                  <Camera size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Nome */}
              <Text style={styles.inputLabel}>Nome completo</Text>
              <TextInput 
                style={styles.input} 
                value={tempName} 
                onChangeText={setTempName} 
              />

              {/* Bio */}
              <Text style={styles.inputLabel}>Sobre mim</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                value={tempBio} 
                onChangeText={setTempBio} 
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* Interesses Toggle */}
              <Text style={styles.inputLabel}>Seus Interesses</Text>
              <View style={styles.interestsEditGrid}>
                {ALL_INTERESTS.map((interest) => {
                  const isSelected = tempInterests.includes(interest);
                  return (
                    <TouchableOpacity 
                      key={interest} 
                      style={[styles.interestEditChip, isSelected && styles.interestEditChipActive]}
                      onPress={() => toggleInterest(interest)}
                    >
                      <Text style={[styles.interestEditChipText, isSelected && styles.interestEditChipTextActive]}>
                        {interest}
                      </Text>
                      {isSelected && <Check size={14} color="#fff" style={{ marginLeft: 6 }} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
                <Text style={styles.saveBtnText}>Salvar Alterações</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  containerCenter: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    padding: 30,
  },
  guestContent: { alignItems: 'center' },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F7F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  guestSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: '#2D5A27',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  header: { paddingTop: 60, paddingHorizontal: 20, marginBottom: 15 },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 15 },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  userEmail: { fontSize: 14, color: '#6B7280' },
  roleBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  roleText: { fontSize: 10, color: '#2D5A27', fontWeight: 'bold' },

  /* Estilos do Dashboard do Hóspede */
  guestDashboard: { paddingHorizontal: 20, marginBottom: 30 },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  statBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statDivider: { width: 1, backgroundColor: '#E5E7EB', marginVertical: 10 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  
  infoSection: { marginBottom: 20 },
  sectionSubTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 10 },
  bioText: { fontSize: 14, color: '#4B5563', lineHeight: 22 },
  
  interestsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestChip: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  interestChipText: { color: '#4B5563', fontSize: 13, fontWeight: '500' },

  pastTripCard: { width: 160, height: 110, marginRight: 15, borderRadius: 12, overflow: 'hidden', backgroundColor: '#EEE' },
  pastTripImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  pastTripOverlay: { position: 'absolute', bottom: 0, width: '100%', padding: 10, backgroundColor: 'rgba(0,0,0,0.5)' },
  pastTripTitle: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  pastTripDate: { color: '#ddd', fontSize: 11 },

  /* Outras seções */
  section: { paddingHorizontal: 20, marginBottom: 25 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  menuIconContainer: { marginRight: 15, position: 'relative' },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#fff',
  },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '500', color: '#374151' },
  menuSubtitle: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  dangerZone: { marginTop: 10, marginBottom: 20 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 15,
    borderRadius: 15,
    backgroundColor: '#FEF2F2',
  },
  logoutText: { marginLeft: 10, color: '#EF4444', fontWeight: 'bold', fontSize: 16 },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 15,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  deleteText: { marginLeft: 10, color: '#EF4444', fontWeight: 'bold', fontSize: 16 },
  versionText: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginVertical: 20 },

  /* Estilos do Modal de Edição */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  closeModalBtn: { padding: 5 },
  
  editAvatarContainer: { alignItems: 'center', marginBottom: 20, position: 'relative' },
  editAvatarImage: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E5E7EB' },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: '#2D5A27',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },

  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 10 },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 10,
  },
  textArea: { height: 100 },

  interestsEditGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 30 },
  interestEditChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  interestEditChipActive: { backgroundColor: '#2D5A27', borderColor: '#2D5A27' },
  interestEditChipText: { fontSize: 14, color: '#4B5563', fontWeight: '500' },
  interestEditChipTextActive: { color: '#fff', fontWeight: 'bold' },

  saveBtn: { backgroundColor: '#2D5A27', padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 10, marginBottom: 30 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});