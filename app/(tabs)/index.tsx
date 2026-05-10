import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  BackHandler,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router'; // ✅ Importado o useRouter
import { PropertyCard } from '../../components/PropertyCard';
import { PROPERTIES } from '../../constants/Properties';
import { Waves, TreePine, Droplets, Search, X } from 'lucide-react-native';

const CATEGORIES = [
  { id: '1', name: 'Praia Privativa', icon: Waves },
  { id: '2', name: 'Campo', icon: TreePine },
  { id: '3', name: 'Cachoeira', icon: Droplets },
];

export default function HomeScreen() {
  const router = useRouter(); // ✅ Inicializado o router
  const [selectedCategory, setSelectedCategory] = useState('Praia Privativa');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Fecha a busca ao pressionar o botão físico Voltar no Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isSearching) {
        cancelSearch();
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [isSearching]);

  const cancelSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    Keyboard.dismiss();
  };

  // Filtro de pesquisa reforçado para evitar erros de undefined
  const searchResults = PROPERTIES.filter(item => {
    if (!searchQuery.trim()) return false;
    
    const query = searchQuery.toLowerCase().trim();
    const title = item.title ? item.title.toLowerCase() : '';
    const location = item.location ? item.location.toLowerCase() : '';
    
    return title.includes(query) || location.includes(query);
  });

  const renderSection = (title: string, subCategoryName: string) => {
    const filtered = PROPERTIES.filter(
      item => item.category === selectedCategory && item.subCategory === subCategoryName
    );
    
    if (filtered.length === 0) return null;

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {filtered.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={{ width: 300, marginRight: 15 }}
              activeOpacity={0.9}
              onPress={() => {
                // ✅ Rota adicionada com todos os parâmetros
                router.push({
                  pathname: '/details',
                  params: {
                    id: item.id,
                    title: item.title,
                    price: item.price,
                    location: item.location,
                    description: item.description,
                    image: item.image,
                    isolationLevel: item.isolationLevel,
                  }
                });
              }}
            >
              <PropertyCard {...item} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchRow}>
          {/* Transformado em TouchableOpacity para focar ao clicar em qualquer parte da barra */}
          <TouchableOpacity 
            activeOpacity={1} 
            style={[styles.searchBar, isSearching && styles.searchBarActive]}
            onPress={() => inputRef.current?.focus()}
          >
            <Search size={18} color="#6B7280" style={{ marginRight: 10 }} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Buscar cabanas, lugares..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearching(true)}
              returnKeyType="search"
              onSubmitEditing={() => Keyboard.dismiss()} // Oculta o teclado ao dar "Enter"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 5 }}>
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {isSearching && (
            <TouchableOpacity onPress={cancelSearch} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>

        {!isSearching && (
          <View style={styles.categoriesContainer}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryItem,
                  selectedCategory === cat.name && styles.categoryActive
                ]}
                onPress={() => setSelectedCategory(cat.name)}
              >
                <cat.icon
                  size={22}
                  color={selectedCategory === cat.name ? '#2D5A27' : '#6B7280'}
                />
                <Text style={[
                  styles.categoryText,
                  selectedCategory === cat.name && styles.categoryTextActive
                ]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {isSearching ? (
        <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
          {searchQuery.trim().length === 0 ? (
            <View style={styles.searchHint}>
              <Text style={styles.searchHintText}>
                Digite o nome de uma cabana, cidade ou região para buscar.
              </Text>
            </View>
          ) : searchResults.length === 0 ? (
            <View style={styles.searchHint}>
              <Text style={styles.searchHintText}>
                Nenhum resultado encontrado para "{searchQuery}".
              </Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.searchResults}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled" // Garante que o clique funcione com o teclado aberto
              ItemSeparatorComponent={() => <View style={{ height: 20 }} />} // Espaço entre os cards
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => {
                    // ✅ Rota adicionada também nos resultados da busca
                    router.push({
                      pathname: '/details',
                      params: {
                        id: item.id,
                        title: item.title,
                        price: item.price,
                        location: item.location,
                        description: item.description,
                        image: item.image,
                        isolationLevel: item.isolationLevel,
                      }
                    });
                  }}
                >
                  <PropertyCard {...item} />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {selectedCategory === 'Praia Privativa' && (
            <>
              {renderSection('🔥 Populares', 'Populares')}
              {renderSection('☀️ Praias do Nordeste', 'Nordeste')}
              {renderSection('🌊 Praias do Sul', 'Sul')}
            </>
          )}
          {selectedCategory === 'Campo' && (
            <>
              {renderSection('🔥 Populares', 'Populares')}
              {renderSection('🏔️ Nas Montanhas', 'Montanhas')}
              {renderSection('🌾 Nas Planícies', 'Planícies')}
            </>
          )}
          {selectedCategory === 'Cachoeira' && (
            <>
              {renderSection('🔥 Populares', 'Populares')}
              {renderSection('🌿 Centro-Oeste', 'Centro-Oeste')}
              {renderSection('💦 Sudeste', 'Sudeste')}
            </>
          )}

          <TouchableOpacity style={styles.seeAllButton}>
            <Text style={styles.seeAllText}>Explorar todas as opções</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    marginTop: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  searchBarActive: {
    borderColor: '#2D5A27',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    paddingVertical: 0, // Ajuste para alinhar o texto verticalmente
  },
  cancelButton: {
    marginLeft: 12,
    paddingVertical: 6,
  },
  cancelText: {
    fontSize: 15,
    color: '#2D5A27',
    fontWeight: '600',
  },
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 0,
  },
  categoryItem: {
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  categoryActive: { borderBottomColor: '#2D5A27' },
  categoryText: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  categoryTextActive: { color: '#2D5A27', fontWeight: 'bold' },
  scrollContent: { paddingBottom: 30 },
  sectionContainer: { marginTop: 25 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 20,
    marginBottom: 15,
    color: '#1F2937',
  },
  horizontalScroll: { paddingLeft: 20, paddingRight: 20 },
  seeAllButton: {
    margin: 20,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    marginTop: 40,
  },
  seeAllText: { fontWeight: '600', color: '#374151' },
  searchResults: { padding: 20, paddingBottom: 100 },
  searchHint: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  searchHintText: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
  },
});