import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";

export default function LoginSelectionScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Logo and App Name */}
      <View style={styles.logoContainer}>
        <Image source={require('../assets/logo.jpg')} style={styles.logo} />
        <Text style={styles.appName}>Claim Easy</Text>
        <Text style={styles.tagline}>Bridging Farmers & Insurers</Text>
      </View>

      {/* Welcome Section */}
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeTitle}>Welcome</Text>
        <Text style={styles.welcomeText}>
          Empowering farmers and insurance companies through faster, smarter claim settlements.
        </Text>

        <View style={styles.buttonColumn}>
          <TouchableOpacity
            style={styles.greenButton}
            onPress={() => navigation.navigate("LoginviaMobile")}
          >
            <Text style={styles.greenButtonText}>Login via Mobile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineButton}
            onPress={() => navigation.navigate("LoginviaAadhar")}
          >
            <Text style={styles.outlineButtonText}>Login via Aadhar</Text>
          </TouchableOpacity>

          <Text style={styles.welcomeText}>
            --------- Get Register Yourself ---------
          </Text>

          <TouchableOpacity
            style={styles.outlineButton}
            onPress={() => navigation.navigate("RegisterUser")}
          >
            <Text style={styles.outlineButtonText}>Get Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "space-between",
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 60,
  },
  logo: {
    width: 180,
    height: 180,
    resizeMode: "contain",
    marginBottom: 10,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  tagline: {
    fontSize: 14,
    color: "#757575",
    letterSpacing: 1,
    marginBottom: 20,
  },
  welcomeContainer: {
    backgroundColor: "#3B8751",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 14,
    color: "#e0e0e0",
    marginBottom: 30,
  },
  buttonColumn: {
    gap: 16,
  },
  greenButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  greenButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  outlineButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#4CAF50",
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
  },
  outlineButtonText: {
    color: "#4CAF50",
    fontWeight: "bold",
    fontSize: 16,
  },
});
