import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { Star, MapPin, Calendar } from 'lucide-react-native';
import { PAST_TRIPS } from './profileContent';

export type GuestDashboardProps = {
  bio: string;
  interests: string[];
};

export function GuestDashboard({ bio, interests }: GuestDashboardProps) {
  return (
    <View style={styles.guestDashboard}>
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

      <View style={styles.infoSection}>
        <Text style={styles.sectionSubTitle}>Sobre mim</Text>
        <Text style={styles.bioText}>{bio}</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionSubTitle}>Interesses</Text>
        <View style={styles.interestsGrid}>
          {interests.map((interest, index) => (
            <View key={index} style={styles.interestChip}>
              <Text style={styles.interestChipText}>{interest}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionSubTitle}>Viagens Anteriores</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
          {PAST_TRIPS.map((trip) => (
            <View key={trip.id} style={styles.pastTripCard}>
              <Image source={{ uri: trip.image }} style={styles.pastTripImage} />
              <View style={styles.pastTripOverlay}>
                <Text style={styles.pastTripTitle}>{trip.title}</Text>
                <Text style={styles.pastTripDate}>{trip.date}</Text>
              </View>
            </View>
          ))}
          <View style={{ width: 20 }} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  guestDashboard: { paddingHorizontal: 20, marginBottom: 30 },
  statsContainer: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 15,
    borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4,
    elevation: 2, marginBottom: 20,
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
});
