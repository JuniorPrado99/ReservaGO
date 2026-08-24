import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  ScrollView, Alert,
} from 'react-native';
import {
  User, Settings, Bell, ShieldCheck, LogOut,
  LogIn, LayoutDashboard, Home, FileText, Trash2,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { MenuItem } from '../../components/profile/MenuItem';
import { InfoModal } from '../../components/profile/InfoModal';
import { EditProfileModal } from '../../components/profile/EditProfileModal';
import { GuestDashboard } from '../../components/profile/GuestDashboard';
import { PRIVACY_SECTIONS, TERMS_SECTIONS } from '../../components/profile/profileContent';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { unreadCount: UNREAD_NOTIFICATIONS } = useNotifications();

  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [isPrivacyVisible, setPrivacyVisible] = useState(false);
  const [isTermsVisible, setTermsVisible] = useState(false);

  const [profileName, setProfileName] = useState(user?.name || 'Visitante');
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || 'https://i.pravatar.cc/150?img=11');
  const [profileBio, setProfileBio] = useState('Apaixonado por natureza e lugares calmos. Sempre em busca da próxima fogueira e um bom vinho sob as estrelas.');
  const [profileInterests, setProfileInterests] = useState(['Atividades ao ar livre', 'Gastronomia', 'Vinho']);

  const [tempName, setTempName] = useState(profileName);
  const [tempAvatar, setTempAvatar] = useState(profileAvatar);
  const [tempBio, setTempBio] = useState(profileBio);
  const [tempInterests, setTempInterests] = useState(profileInterests);

  const pickProfileImage = async () => {
    try {
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        Alert.alert('Permissão Necessária', 'Você precisa permitir o acesso à galeria para alterar a foto!');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) setTempAvatar(result.assets[0].uri);
    } catch {
      Alert.alert('Erro', 'Ocorreu um problema ao tentar abrir a galeria.');
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
    setTempInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

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

        {user.role === 'hospede' && <GuestDashboard bio={profileBio} interests={profileInterests} />}

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
            subtitle={`${UNREAD_NOTIFICATIONS} não lidas · Toque para ver`}
            onPress={() => router.push('../notifications')}
            showBadge={UNREAD_NOTIFICATIONS > 0}
          />
          <MenuItem
            icon={ShieldCheck}
            title="Privacidade"
            subtitle="Coleta de dados e visibilidade"
            onPress={() => setPrivacyVisible(true)}
          />
          <MenuItem
            icon={FileText}
            title="Termos de Serviço"
            subtitle="Regras e políticas do ReservaGO"
            onPress={() => setTermsVisible(true)}
          />
        </View>

        <View style={styles.dangerZone}>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Sair da conta</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={() => {}}>
            <Trash2 size={20} color="#EF4444" />
            <Text style={styles.deleteText}>Excluir conta</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>Versão 1.0.0 Beta</Text>
      </ScrollView>

      <EditProfileModal
        visible={isEditModalVisible}
        onClose={() => setEditModalVisible(false)}
        avatar={tempAvatar}
        onPickImage={pickProfileImage}
        name={tempName}
        onChangeName={setTempName}
        bio={tempBio}
        onChangeBio={setTempBio}
        interests={tempInterests}
        onToggleInterest={toggleInterest}
        onSave={saveProfile}
      />

      <InfoModal
        visible={isPrivacyVisible}
        onClose={() => setPrivacyVisible(false)}
        title="Privacidade"
        subtitle="Como protegemos seus dados"
        sections={PRIVACY_SECTIONS}
        footerText="Última atualização: Janeiro de 2025 · Em conformidade com a LGPD (Lei nº 13.709/2018)"
      />
      <InfoModal
        visible={isTermsVisible}
        onClose={() => setTermsVisible(false)}
        title="Termos de Serviço"
        subtitle="Regras e políticas do ReservaGO"
        sections={TERMS_SECTIONS}
        footerText="Ao usar o ReservaGO, você concorda com estes termos. Dúvidas? contato@reservago.com.br"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  containerCenter: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', padding: 30 },
  guestContent: { alignItems: 'center' },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#F0F7F0', justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  guestSubtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  loginButton: {
    flexDirection: 'row', backgroundColor: '#2D5A27', width: '100%',
    padding: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  header: { paddingTop: 60, paddingHorizontal: 20, marginBottom: 15 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1F2937', marginBottom: 20 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
    padding: 15, borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6',
  },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 15 },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  userEmail: { fontSize: 14, color: '#6B7280' },
  roleBadge: {
    backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 6, alignSelf: 'flex-start', marginTop: 4,
  },
  roleText: { fontSize: 10, color: '#2D5A27', fontWeight: 'bold' },
  section: { paddingHorizontal: 20, marginBottom: 25 },
  sectionLabel: {
    fontSize: 14, fontWeight: '700', color: '#9CA3AF',
    marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1,
  },
  dangerZone: { marginTop: 10, marginBottom: 20 },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 20, marginBottom: 12, padding: 15, borderRadius: 15, backgroundColor: '#FEF2F2',
  },
  logoutText: { marginLeft: 10, color: '#EF4444', fontWeight: 'bold', fontSize: 16 },
  deleteButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 20, padding: 15, borderRadius: 15,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#FEE2E2',
  },
  deleteText: { marginLeft: 10, color: '#EF4444', fontWeight: 'bold', fontSize: 16 },
  versionText: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginVertical: 20 },
});
