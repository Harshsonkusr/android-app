import React from 'react';
import { View, ScrollView, ImageBackground, StyleSheet, Image, Dimensions } from 'react-native';
import { Avatar, Title, Text, Caption, Divider, List, Chip } from 'react-native-paper';

const PROFILE_BG = 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80';
const AVATAR_IMG = 'https://randomuser.me/api/portraits/men/32.jpg';

const LAND_PHOTOS = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1468421870903-4df1664e4045?auto=format&fit=crop&w=600&q=80'
];

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <ImageBackground source={{ uri: PROFILE_BG }} style={styles.headerBg}>
        <View style={styles.headerOverlay} />
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>210</Text>
            <Caption style={styles.statLabel}>Following</Caption>
          </View>
          <Avatar.Image size={82} source={{ uri: AVATAR_IMG }} style={styles.avatar} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>359K</Text>
            <Caption style={styles.statLabel}>Followers</Caption>
          </View>
        </View>
        <Title style={styles.title}>Mayur Patil</Title>
        <Text style={styles.handle}>@mayurpatil</Text>
      </ImageBackground>

      {/* Personal Info */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Personal Info</Text>
        <ProfileRow label="Name" value="Mayur Patil" icon="account" />
        <ProfileRow label="Aadhaar No" value="123456789012" icon="fingerprint" />
        <ProfileRow label="Mobile No" value="9876543210" icon="cellphone" />
        <ProfileRow label="Village" value="Ganeshpur" icon="home" />
        <ProfileRow label="Tehsil" value="Taloda" icon="map-marker-outline" />
        <ProfileRow label="District" value="Nandurbar" icon="city" />
        <ProfileRow label="State" value="Maharashtra" icon="flag" />
      </View>

      <Divider style={styles.divider} />

      {/* Crop & Land Details */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Land & Crop Details</Text>
        <ProfileRow label="Crop Name" value="Cotton" icon="leaf" />
        <ProfileRow label="Crop Season" value="Kharif" icon="calendar" />
        <ProfileRow label="Land Area (Acres)" value="4" icon="land-plot" />
        <ProfileRow label="Land Area (Hectares)" value="1.618" icon="seed" />
        <ProfileRow label="Land Record (Khasra)" value="K1234" icon="file-document-outline" />
        <ProfileRow label="Land Record (Khatauni)" value="KH5678" icon="file-document-outline" />
        <ProfileRow label="Survey Number" value="SR9987" icon="clipboard-text-outline" />
      </View>

      <Divider style={styles.divider} />

      {/* Banking Info */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Bank & Financial Info</Text>
        <ProfileRow label="Bank Name" value="State Bank of India" icon="bank" />
        <ProfileRow label="Account Number" value="12345678901" icon="credit-card" />
        <ProfileRow label="IFSC Code" value="SBIN0001234" icon="barcode" />
        <View style={styles.chipRow}>
          <Chip style={styles.chip} icon={true}>{'Loan Status: No'}</Chip>
          <Chip style={[styles.chip, styles.chipAccent]} icon={true}>{'Insurance Linked: Yes'}</Chip>
        </View>
      </View>

      <Divider style={styles.divider} />

      {/* Land Photos */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Land Photos</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
          {LAND_PHOTOS.map((uri, i) => (
            <Image key={i} source={{ uri }} style={styles.photo} />
          ))}
        </ScrollView>
      </View>
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

// Custom row layout for field/value pairs
function ProfileRow({ label, value, icon }) {
  return (
    <View style={styles.infoRow}>
      <List.Icon icon={icon} color="#7e57c2" />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f8fc" },
  headerBg: { width: '100%', height: 175, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  headerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(67,0,111,0.13)', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', width: "90%", marginTop: 18 },
  statBox: { alignItems: 'center', marginBottom: 18 },
  statNum: { fontWeight: 'bold', fontSize: 18, color: '#6a1b9a' },
  statLabel: { color: "#567", fontSize: 12 },
  avatar: { marginHorizontal: 12, borderWidth: 2, borderColor: '#fff', backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: "bold", color: "#102027", textAlign: 'center', marginTop: 10 },
  handle: { fontSize: 14, color: "#888", textAlign: "center", marginBottom: 6 },
  card: { backgroundColor: "#fff", borderRadius: 13, elevation: 2, marginHorizontal: 14, marginVertical: 7, padding: 14 },
  divider: { marginVertical: 12, marginHorizontal: 14 },
  sectionTitle: { fontWeight: "bold", fontSize: 16, color: "#7e57c2", marginVertical: 7 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginVertical: 6 },
  infoLabel: { fontSize: 15, color: "#444", width: 130 },
  infoValue: { color: "#686", fontWeight: "bold", fontSize: 15 },
  chipRow: { flexDirection: 'row', marginTop: 5 },
  chip: { marginRight: 10, backgroundColor: '#c8e6c9' },
  chipAccent: { backgroundColor: "#bbdefb" },
  photoRow: { marginVertical: 8 },
  photo: {
    width: width * 0.40,
    height: 120,
    borderRadius: 14,
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#eee',
    shadowColor: '#6a1b9a',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 9,
    elevation: 7,
  }
});
