import { useRouter } from 'expo-router';
import {
  ChevronDown, ChevronUp,
  Droplets, Search,
  SlidersHorizontal,
  TreePine,
  Waves,
  X,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Keyboard, Modal,
  ScrollView,
  StyleSheet, Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { PropertyCard } from '../../components/PropertyCard';
import { useAuth } from '../../context/AuthContext';
import { Listing, useListings } from '../../context/ListingContext';
import { getProperties } from '../../services/propertyService';
import type { Property as DbProperty } from '../../services/types';

// Converte a linha do Supabase (snake_case) pro formato Listing que a tela
// já usa (camelCase) - assim os filtros/seções abaixo não mudam de lógica.
// (Renomeado pra DbProperty porque a tela já tem seu próprio `type Property
// = Listing` mais abaixo, usado nos filtros locais.)
function mapPropertyToListing(p: DbProperty): Listing {
  return {
    id: p.id,
    title: p.title,
    location: p.location,
    price: p.price,
    description: p.description,
    image: p.images?.[0] ?? null,
    isolationLevel: p.isolation_level,
    createdAt: p.created_at,
    bookingsCount: p.bookings_count,
    rating: p.rating,
    category: p.category,
    subCategory: p.sub_category ?? undefined,
    hostId: p.owner_id,
  };
}

const CATEGORIES = [
  { id: '1', name: 'Praia Privativa', icon: Waves },
  { id: '2', name: 'Campo', icon: TreePine },
  { id: '3', name: 'Cachoeira', icon: Droplets },
];

const ISOLATION_OPTIONS = [
  { id: 'todos', label: 'Todos', emoji: '🗺️' },
  { id: 'urbano', label: 'Vizinhos próximos', emoji: '🏘️' },
  { id: 'semi', label: 'Alguma privacidade', emoji: '🌲' },
  { id: 'isolado', label: 'Bem isolado', emoji: '🏕️' },
  { id: 'extremo', label: 'Isolamento total', emoji: '🌄' },
];

const PRICE_RANGES = [
  { id: 'todos', label: 'Qualquer preço', min: 0, max: Infinity },
  { id: 'ate500', label: 'Até R$ 500', min: 0, max: 500 },
  { id: '500a800', label: 'R$ 500 – R$ 800', min: 500, max: 800 },
  { id: 'acima800', label: 'Acima de R$ 800', min: 800, max: Infinity },
];

const SECTIONS: Record<string, { title: string; subCategory: string }[]> = {
  'Praia Privativa': [
    { title: '🔥 Populares', subCategory: 'Populares' },
    { title: '☀️ Praias do Nordeste', subCategory: 'Nordeste' },
    { title: '🌊 Praias do Sul', subCategory: 'Sul' },
  ],
  Campo: [
    { title: '🔥 Populares', subCategory: 'Populares' },
    { title: '🏔️ Nas Montanhas', subCategory: 'Montanhas' },
    { title: '🌾 Nas Planícies', subCategory: 'Planícies' },
  ],
  Cachoeira: [
    { title: '🔥 Populares', subCategory: 'Populares' },
    { title: '🌿 Centro-Oeste', subCategory: 'Centro-Oeste' },
    { title: '💦 Sudeste', subCategory: 'Sudeste' },
  ],
};

type Property = Listing;

type PriceRange = (typeof PRICE_RANGES)[number];
type IsolationOption = (typeof ISOLATION_OPTIONS)[number];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { allProperties: localProperties = [] } = useListings() || {};

  // Usuário estático (__DEV__, ids "static-*") não existe em profiles/auth -
  // nesse caso (e se a query falhar por qualquer outro motivo) caímos pros
  // dados locais do ListingContext, pra não deixar a Explorar em branco.
  const isStaticUser = !!user?.id && user.id.startsWith('static-');
  const [remoteProperties, setRemoteProperties] = useState<Listing[] | null>(null);
  const [loadingProperties, setLoadingProperties] = useState(!isStaticUser);

  useEffect(() => {
    if (isStaticUser) {
      setRemoteProperties(null);
      setLoadingProperties(false);
      return;
    }

    let cancelled = false;
    setLoadingProperties(true);

    getProperties()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          console.log('[index] getProperties falhou, usando fallback local ->', error);
          setRemoteProperties(null);
        } else {
          setRemoteProperties(data.map(mapPropertyToListing));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingProperties(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isStaticUser]);

  const allProperties = useMemo(
    () => remoteProperties ?? localProperties,
    [remoteProperties, localProperties]
  );

  const [selectedCategory, setSelectedCategory] = useState('Praia Privativa');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isExploreAll, setIsExploreAll] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceRange>(PRICE_RANGES[0]);
  const [selectedIsolation, setSelectedIsolation] = useState<IsolationOption>(ISOLATION_OPTIONS[0]);
  const [tempPriceRange, setTempPriceRange] = useState<PriceRange>(PRICE_RANGES[0]);
  const [tempIsolation, setTempIsolation] = useState<IsolationOption>(ISOLATION_OPTIONS[0]);

  const activeFiltersCount = [
    selectedPriceRange.id !== 'todos',
    selectedIsolation.id !== 'todos',
  ].filter(Boolean).length;

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isSearching) { cancelSearch(); return true; }
      if (isExploreAll) { setIsExploreAll(false); return true; }
      return false;
    });
    return () => backHandler.remove();
  }, [isSearching, isExploreAll]);

  const cancelSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    Keyboard.dismiss();
  };

  const openFilterModal = () => {
    setTempPriceRange(selectedPriceRange);
    setTempIsolation(selectedIsolation);
    setFilterModalVisible(true);
  };

  const applyFilters = () => {
    setSelectedPriceRange(tempPriceRange);
    setSelectedIsolation(tempIsolation);
    setFilterModalVisible(false);
  };

  const clearFilters = () => {
    setTempPriceRange(PRICE_RANGES[0]);
    setTempIsolation(ISOLATION_OPTIONS[0]);
  };

  const applyActiveFilters = (list: Property[]) =>
    list.filter((item) => {
      const passPrice = item.price >= selectedPriceRange.min && item.price <= selectedPriceRange.max;
      const passIsolation =
        selectedIsolation.id === 'todos' ||
        (item.isolationLevel ?? '').toLowerCase() === selectedIsolation.id.toLowerCase();
      return passPrice && passIsolation;
    });

  const navigateToDetails = (item: Property) => {
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
        hostId: item.hostId,
      },
    });
  };

  const searchResults = useMemo(
    () =>
      applyActiveFilters(
        allProperties.filter((item) => {
          if (!searchQuery.trim()) return false;
          const query = searchQuery.toLowerCase().trim();
          return (
            item.title?.toLowerCase().includes(query) ||
            item.location?.toLowerCase().includes(query)
          );
        })
      ),
    [allProperties, searchQuery, selectedPriceRange, selectedIsolation]
  );

  const exploreAllResults = useMemo(
    () => applyActiveFilters(allProperties.filter((item) => item.category === selectedCategory)),
    [allProperties, selectedCategory, selectedPriceRange, selectedIsolation]
  );

  const renderSection = (title: string, subCategoryName: string) => {
    const filtered = applyActiveFilters(
      allProperties.filter(
        (item) => item.category === selectedCategory && item.subCategory === subCategoryName
      )
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
              onPress={() => navigateToDetails(item)}
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
              onSubmitEditing={() => Keyboard.dismiss()}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 5 }}>
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {isSearching ? (
            <TouchableOpacity onPress={cancelSearch} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.filterButton} onPress={openFilterModal}>
              <SlidersHorizontal size={18} color={activeFiltersCount > 0 ? '#fff' : '#2D5A27'} />
              {activeFiltersCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        {!isSearching && activeFiltersCount > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.activeFiltersRow}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          >
            {selectedPriceRange.id !== 'todos' && (
              <TouchableOpacity
                style={styles.activeFilterChip}
                onPress={() => setSelectedPriceRange(PRICE_RANGES[0])}
              >
                <Text style={styles.activeFilterChipText}>{selectedPriceRange.label}</Text>
                <X size={12} color="#2D5A27" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}
            {selectedIsolation.id !== 'todos' && (
              <TouchableOpacity
                style={styles.activeFilterChip}
                onPress={() => setSelectedIsolation(ISOLATION_OPTIONS[0])}
              >
                <Text style={styles.activeFilterChipText}>
                  {selectedIsolation.emoji} {selectedIsolation.label}
                </Text>
                <X size={12} color="#2D5A27" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}
          </ScrollView>
        )}

        {!isSearching && (
          <View style={styles.categoriesContainer}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryItem, selectedCategory === cat.name && styles.categoryActive]}
                onPress={() => { setSelectedCategory(cat.name); setIsExploreAll(false); }}
              >
                <cat.icon size={22} color={selectedCategory === cat.name ? '#2D5A27' : '#6B7280'} />
                <Text style={[styles.categoryText, selectedCategory === cat.name && styles.categoryTextActive]}>
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
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.searchResults}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <View style={{ height: 20 }} />}
              renderItem={({ item }) => (
                <TouchableOpacity activeOpacity={0.9} onPress={() => navigateToDetails(item)}>
                  <PropertyCard {...item} />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      ) : isExploreAll ? (
        <View style={{ flex: 1 }}>
          <View style={styles.exploreAllHeader}>
            <TouchableOpacity onPress={() => setIsExploreAll(false)} style={styles.exploreBackBtn}>
              <ChevronUp size={18} color="#2D5A27" />
              <Text style={styles.exploreBackText}>Voltar</Text>
            </TouchableOpacity>
            <Text style={styles.exploreAllTitle}>
              {selectedCategory} · {exploreAllResults.length} opções
            </Text>
          </View>
          {exploreAllResults.length === 0 ? (
            <View style={styles.searchHint}>
              <Text style={styles.searchHintText}>
                Nenhuma cabana encontrada com os filtros aplicados.
              </Text>
            </View>
          ) : (
            <FlatList
              data={exploreAllResults}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.searchResults}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ height: 20 }} />}
              renderItem={({ item }) => (
                <TouchableOpacity activeOpacity={0.9} onPress={() => navigateToDetails(item)}>
                  <PropertyCard {...item} />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      ) : loadingProperties ? (
        <View style={styles.searchHint}>
          <ActivityIndicator size="large" color="#2D5A27" />
        </View>
      ) : allProperties.length === 0 ? (
        <View style={styles.searchHint}>
          <Text style={styles.searchHintText}>Nenhuma cabana disponível no momento.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {SECTIONS[selectedCategory]?.map(({ title, subCategory }) => (
            <View key={title}>
              {renderSection(title, subCategory)}
            </View>
          ))}
          <TouchableOpacity style={styles.seeAllButton} onPress={() => setIsExploreAll(true)}>
            <Text style={styles.seeAllText}>Explorar todas as opções</Text>
            <ChevronDown size={16} color="#374151" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </ScrollView>
      )}

      <Modal visible={filterModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <X size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.filterSectionLabel}>Faixa de Preço</Text>
              <View style={styles.filterOptionsGrid}>
                {PRICE_RANGES.map((range) => (
                  <TouchableOpacity
                    key={range.id}
                    style={[styles.filterOptionChip, tempPriceRange.id === range.id && styles.filterOptionChipActive]}
                    onPress={() => setTempPriceRange(range)}
                  >
                    <Text style={[styles.filterOptionText, tempPriceRange.id === range.id && styles.filterOptionTextActive]}>
                      {range.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.filterDivider} />
              <Text style={styles.filterSectionLabel}>Nível de Isolamento</Text>
              <View style={styles.filterIsolationList}>
                {ISOLATION_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.filterIsolationItem, tempIsolation.id === opt.id && styles.filterIsolationItemActive]}
                    onPress={() => setTempIsolation(opt)}
                  >
                    <Text style={styles.filterIsolationEmoji}>{opt.emoji}</Text>
                    <Text style={[styles.filterIsolationLabel, tempIsolation.id === opt.id && styles.filterIsolationLabelActive]}>
                      {opt.label}
                    </Text>
                    {tempIsolation.id === opt.id && <View style={styles.filterCheckDot} />}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
                <Text style={styles.clearBtnText}>Limpar filtros</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                <Text style={styles.applyBtnText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 16, marginTop: 10,
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', paddingHorizontal: 15, paddingVertical: 12,
    borderRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, borderWidth: 1, borderColor: '#F3F4F6',
  },
  searchBarActive: { borderColor: '#2D5A27' },
  searchInput: { flex: 1, fontSize: 15, color: '#1F2937', paddingVertical: 0 },
  cancelButton: { marginLeft: 12, paddingVertical: 6 },
  cancelText: { fontSize: 15, color: '#2D5A27', fontWeight: '600' },
  filterButton: {
    marginLeft: 10, width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#F0F7F0', borderWidth: 1, borderColor: '#2D5A27',
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  filterBadge: {
    position: 'absolute', top: -4, right: -4, width: 18, height: 18,
    borderRadius: 9, backgroundColor: '#2D5A27', justifyContent: 'center', alignItems: 'center',
  },
  filterBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  activeFiltersRow: { marginBottom: 8 },
  activeFilterChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9',
    borderWidth: 1, borderColor: '#2D5A27', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  activeFilterChipText: { fontSize: 12, color: '#2D5A27', fontWeight: '600' },
  categoriesContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 0 },
  categoryItem: { alignItems: 'center', paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  categoryActive: { borderBottomColor: '#2D5A27' },
  categoryText: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  categoryTextActive: { color: '#2D5A27', fontWeight: 'bold' },
  scrollContent: { paddingBottom: 30 },
  sectionContainer: { marginTop: 25 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 20, marginBottom: 15, color: '#1F2937' },
  horizontalScroll: { paddingLeft: 20, paddingRight: 20 },
  seeAllButton: {
    margin: 20, marginTop: 40, padding: 15, borderRadius: 12, borderWidth: 1,
    borderColor: '#E5E7EB', alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
  },
  seeAllText: { fontWeight: '600', color: '#374151' },
  searchResults: { padding: 20, paddingBottom: 100 },
  searchHint: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  searchHintText: { fontSize: 15, color: '#9CA3AF', textAlign: 'center', lineHeight: 22 },
  exploreAllHeader: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 12,
  },
  exploreBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  exploreBackText: { fontSize: 14, color: '#2D5A27', fontWeight: '600' },
  exploreAllTitle: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '80%' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#DDD', alignSelf: 'center', marginVertical: 12, borderRadius: 2 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  modalBody: { padding: 20, paddingBottom: 10 },
  filterSectionLabel: {
    fontSize: 14, fontWeight: '700', color: '#374151',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14,
  },
  filterOptionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  filterOptionChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB',
  },
  filterOptionChipActive: { borderColor: '#2D5A27', backgroundColor: '#F0F7F0' },
  filterOptionText: { fontSize: 13, color: '#4B5563', fontWeight: '500' },
  filterOptionTextActive: { color: '#2D5A27', fontWeight: '700' },
  filterDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 20 },
  filterIsolationList: { gap: 10 },
  filterIsolationItem: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB',
  },
  filterIsolationItemActive: { borderColor: '#2D5A27', backgroundColor: '#F0F7F0' },
  filterIsolationEmoji: { fontSize: 20, marginRight: 12 },
  filterIsolationLabel: { flex: 1, fontSize: 14, color: '#4B5563', fontWeight: '500' },
  filterIsolationLabelActive: { color: '#2D5A27', fontWeight: '700' },
  filterCheckDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2D5A27' },
  modalFooter: {
    flexDirection: 'row', gap: 12, padding: 20,
    paddingBottom: 34, borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  clearBtn: { flex: 1, padding: 15, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  clearBtnText: { fontWeight: '600', color: '#374151', fontSize: 15 },
  applyBtn: { flex: 2, padding: 15, borderRadius: 14, backgroundColor: '#2D5A27', alignItems: 'center' },
  applyBtnText: { fontWeight: 'bold', color: '#fff', fontSize: 15 },
});