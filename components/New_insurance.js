

import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ImageBackground, Animated, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const claimTypes = [
  {
    label: "Flood Damage",
    value: "flood",
    icon: "water",
    img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=200&q=80"
  },
  {
    label: "Crop Damage",
    value: "crop",
    icon: "corn",
    img: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=200&q=80"
  },
  {
    label: "Hail Storm",
    value: "hail",
    icon: "weather-hail",
    img: "https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?auto=format&fit=crop&w=200&q=80"
  },
  {
    label: "Lightning",
    value: "lightning",
    icon: "weather-lightning",
    img: "https://images.unsplash.com/photo-1468421870903-4df1664e4045?auto=format&fit=crop&w=200&q=80"
  },
  {
    label: "Heavy Rain",
    value: "rain",
    icon: "weather-pouring",
    img: "https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?auto=format&fit=crop&w=200&q=80"
  }
];

const BG_IMG = "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80";

export default function ClaimTypeSelectScreen({ navigation }) {
  const [selected, setSelected] = useState(claimTypes[0].value);

  // Fade-in animation for card
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
  }, []);

  // Button pulse animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 650, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 650, useNativeDriver: true })
      ])
    ).start();
  }, []);

  // Find selected info for image/icon display
  const selectedType = claimTypes.find(t => t.value === selected);

  const handleProceed = () => {
  navigation.navigate('FloodClaimScreen', { claimType: selected });
};


  return (
    <ImageBackground source={{ uri: BG_IMG }} style={styles.bg} blurRadius={3}>
      <View style={styles.overlay} />
      <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: fadeAnim }] }]}>
        <Text style={styles.title}>Start a New Claim</Text>
        <View style={styles.featureImageBox}>
          <Image source={{ uri: selectedType.img }} style={styles.featureImage} />
          <MaterialCommunityIcons name={selectedType.icon} size={32} color="#1565c0" style={styles.featureIcon} />
        </View>
        <Text style={styles.label}>Choose the type of damage:</Text>
        <View style={styles.dropdownBox}>
          <Picker
            selectedValue={selected}
            onValueChange={v => setSelected(v)}
            style={styles.dropdown}
            itemStyle={styles.dropdownItem}
          >
            {claimTypes.map(t =>
              <Picker.Item
                label={t.label}
                value={t.value}
                key={t.value}
                color="#4a148c"
              />
            )}
          </Picker>
        </View>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity style={styles.button} onPress={handleProceed}>
            <MaterialCommunityIcons name="arrow-right-bold-circle" color="#fff" size={26} />
            <Text style={styles.buttonText}>Proceed</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, justifyContent: "center", alignItems: "center" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(63,81,181,0.18)",
    zIndex: 1
  },
  card: {
    marginTop: 40, marginBottom: 40,
    width: "92%",
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 25,
    shadowColor: "#333",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.19,
    shadowRadius: 25,
    elevation: 9,
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: 23,
    zIndex: 2
  },
  title: { fontSize: 26, fontWeight: "bold", color: "#1976d2", marginBottom: 12 },
  label: { fontSize: 18, color: "#333", marginVertical: 10 },
  dropdownBox: {
    width: "99%", minHeight: 56,
    backgroundColor: "#e3f2fd",
    borderRadius: 16,
    marginVertical: 8
  },
  dropdown: { height: 56, color: "#37474f", fontSize: 17 },
  dropdownItem: { fontSize: 17, height: 56 },
  button: {
    flexDirection: "row",
    backgroundColor: "#1769aa",
    paddingVertical: 14,
    paddingHorizontal: 44,
    marginVertical: 26,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1769aa",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.19,
    shadowRadius: 15,
    elevation: 6
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 18, marginLeft: 8 },
  featureImageBox: {
    alignItems: "center",
    marginBottom: 4
  },
  featureImage: {
    width: 74, height: 74,
    borderRadius: 18,
    borderWidth: 3, borderColor: "#1976d2",
    marginBottom: -12,
    marginTop: 7
  },
  featureIcon: {
    marginTop: -10,
    marginBottom: 7,
    backgroundColor: "#e3f2fd",
    borderRadius: 18,
    padding: 4
  }
});
