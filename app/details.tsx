import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, MapPin, Star, Heart } from 'lucide-react-native';
import { useBookings } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';

export default function DetailsScreen() {
  const router = useRouter();
  const { addBooking } = useBookings();
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();

  const { id, title, price, location, description, image } = useLocalSearchParams();
  const isFavorite = favorites.includes(id as string);

  const handleReserve = () => {
    if (!id) return;

    if (!user) {
      Alert.alert(
        "Perfil necessário",
        "Você precisa estar logado para fazer uma reserva. Deseja entrar agora?",
        [
          { text: "Depois", style: "cancel" },
          { text: "Fazer Login", onPress: () => router.push('../login') }
        ]
      );
      return;
    }

    addBooking(id as string);

    Alert.alert(
      "Reserva Confirmada! 🌿",
      "Sua viagem foi registrada com sucesso.",
      [{ text: "Ver minhas viagens", onPress: () => router.replace("/(tabs)/bookings") }]
    );
  };

  const handleFavorite = () => {
    if (!user) {
      if (Platform.OS === 'web') {
        window.alert('Faça login para salvar seus lugares favoritos.');
      } else {
        Alert.alert(
          'Login necessário',
          'Faça login para salvar seus lugares favoritos.',
          [{ text: 'Cancelar', style: 'cancel' }]
        );
      }
      return;
    }
    toggleFavorite(id as string);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageHeader}>
          <Image
            source={{ uri: image as string }}
            style={styles.mainImage}
          />

          {/* Botão Voltar */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft color="#000" size={24} />
          </TouchableOpacity>

          {/* Botão Favoritar */}
          <TouchableOpacity
            style={styles.heartButton}
            onPress={handleFavorite}
          >
            <Heart
              size={24}
              color={isFavorite ? "#FF385C" : "#fff"}
              fill={isFavorite ? "#FF385C" : "rgba(0,0,0,0.3)"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.row}>
            <Star size={16} color="#f1c40f" fill="#f1c40f" />
            <Text style={styles.rating}> 4.9 • 12 avaliações</Text>
          </View>

          <Text style={styles.location}>
            <MapPin size={14} color="#6B7280" /> {location}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Sobre o lugar</Text>
          <Text style={styles.description}>{description}</Text>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerPrice}>R$ {price}</Text>
          <Text style={styles.footerText}>noite</Text>
        </View>

        <TouchableOpacity
          style={styles.reserveButton}
          onPress={handleReserve}
          activeOpacity={0.8}
        >
          <Text style={styles.reserveButtonText}>Reservar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  imageHeader: { height: 350, backgroundColor: '#EEE' },
  mainImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 8,
    borderRadius: 25,
    zIndex: 10
  },
  heartButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.25)',
    padding: 8,
    borderRadius: 25,
    zIndex: 10
  },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold' },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  rating: { fontSize: 14, fontWeight: '600' },
  location: { color: '#6B7280', marginTop: 10, flexDirection: 'row', alignItems: 'center' },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  description: { color: '#4B5563', lineHeight: 22 },
  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: 35,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  footerPrice: { fontSize: 20, fontWeight: 'bold' },
  footerText: { color: '#6B7280' },
  reserveButton: {
    backgroundColor: '#2D5A27',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12
  },
  reserveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
