import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
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
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const MenuItem = ({
    icon: Icon,
    title,
    subtitle,
    onPress,
  }: {
    icon: any;
    title: string;
    subtitle?: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIconContainer}>
        <Icon size={22} color="#4B5563" />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <ChevronRight size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );

  // --- 1. VISÃO DO CONVIDADO ---
  if (!user) {
    return (
      <View style={styles.containerCenter}>
        <View style={styles.guestContent}>
          <View style={styles.iconCircle}>
            <User size={40} color="#2D5A27" />
          </View>
          <Text style={styles.headerTitle}>Seu Perfil</Text>
          <Text style={styles.guestSubtitle}>
            Faça login para planejar sua próxima viagem, gerenciar suas cabanas
            e ver suas mensagens.
          </Text>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('../login')}
          >
            <LogIn size={20} color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.loginButtonText}>Entrar ou Cadastrar-se</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- 2. VISÃO DO USUÁRIO LOGADO ---
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>

        <View style={styles.userCard}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* SEÇÃO HOSPEDAGEM
          - Anfitrião e Admin: veem "Anunciar nova cabana" + "Painel de Gerenciamento"
          - Hóspede: NÃO vê o botão "Anuncie sua cabana" aqui
            (o botão para se tornar anfitrião virá em outra seção, no Grupo 2)
      */}
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

      {/* SEÇÃO ADMIN — aparece somente para perfil admin */}
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

      {/* SEÇÃO GERAL — para todos os perfis logados */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Conta</Text>

        <MenuItem
          icon={Bell}
          title="Notificações"
          subtitle="Gerencie seus alertas"
          onPress={() => {}}
        />

        <MenuItem
          icon={ShieldCheck}
          title="Privacidade"
          subtitle="Controle seus dados"
          onPress={() => {}}
        />
      </View>

      {/* LOGOUT */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <LogOut size={20} color="#EF4444" />
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Versão 1.0.0 Beta</Text>
    </ScrollView>
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

  header: { paddingTop: 60, paddingHorizontal: 20, marginBottom: 25 },
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
  menuIconContainer: { marginRight: 15 },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '500', color: '#374151' },
  menuSubtitle: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 10,
    padding: 15,
    borderRadius: 15,
    backgroundColor: '#FEF2F2',
  },
  logoutText: {
    marginLeft: 10,
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 16,
  },
  versionText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    marginVertical: 30,
  },
});
