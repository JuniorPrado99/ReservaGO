import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { PropertyCard } from '../../components/PropertyCard';
import { PROPERTIES } from '../../constants/Properties';
import { Waves, TreePine, Droplets } from 'lucide-react-native';

const CATEGORIES = [
  { id: '1', name: 'Praia Privativa', icon: Waves },
  { id: '2', name: 'Campo', icon: TreePine },
  { id: '3', name: 'Cachoeira', icon: Droplets },
];

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState('Praia Privativa');

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
            <View key={item.id} style={{ width: 300, marginRight: 15 }}>
              <PropertyCard {...item} />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER AJUSTADO PARA O TOPO */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.searchBar}>
          <View style={styles.searchInside}>
            <Text style={styles.searchTitle}>Para onde vamos?</Text>
            <Text style={styles.searchSubtitle}>Qualquer lugar • Qualquer semana</Text>
          </View>
        </TouchableOpacity>
        
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
              <cat.icon size={22} color={selectedCategory === cat.name ? "#2D5A27" : "#6B7280"} />
              <Text style={[
                styles.categoryText,
                selectedCategory === cat.name && styles.categoryTextActive
              ]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {selectedCategory === 'Praia Privativa' && (
          <>
            {renderSection("🔥 Populares", "Populares")}
            {renderSection("☀️ Praias do Nordeste", "Nordeste")}
            {renderSection("🌊 Praias do Sul", "Sul")}
          </>
        )}

        {selectedCategory === 'Campo' && (
          <>
            {renderSection("🔥 Populares", "Populares")}
            {renderSection("🏔️ Nas Montanhas", "Montanhas")}
            {renderSection("🌾 Nas Planícies", "Planícies")}
          </>
        )}

        {selectedCategory === 'Cachoeira' && (
          <>
            {renderSection("🔥 Populares", "Populares")}
            {renderSection("🌿 Centro-Oeste", "Centro-Oeste")}
            {renderSection("💦 Sudeste", "Sudeste")}
          </>
        )}

        <TouchableOpacity style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>Explorar todas as opções</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { 
    paddingTop: 60, // Aumentado para dar espaço da barra de status do celular
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#EEE',
    elevation: 2, // Sombra leve no Android
    shadowColor: '#000', // Sombra leve no iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  // Removi o estilo logo: já que não vamos usar o texto
  searchBar: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 12,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginTop: 10, // Respiro extra em relação ao topo
  },
  searchInside: { paddingLeft: 10 },
  searchTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  searchSubtitle: { fontSize: 12, color: '#6B7280' },
  categoriesContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 0 },
  categoryItem: { alignItems: 'center', paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
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
    color: '#1F2937' 
  },
  horizontalScroll: { paddingLeft: 20, paddingRight: 20 },
  
  seeAllButton: {
    margin: 20,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    marginTop: 40
  },
  seeAllText: { fontWeight: '600', color: '#374151' },
});