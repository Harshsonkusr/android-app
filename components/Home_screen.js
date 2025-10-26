
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.name}>
            Mr. Ravi Sharma<Text style={styles.wave}>👋</Text>
          </Text>
        </View>
        <Image
          source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
          style={styles.profilePic}
        />
      </View>

      {/* Cards */}
      <ScrollView contentContainerStyle={styles.cardContainer}>
        <View style={styles.row}>
          {/* New Claim */}
          <View style={styles.claimCard}>
            <Image
              source={require('../assets/newclaim.jpg')}
              style={styles.cardImage}
            />
            <Text style={styles.cardTitle}>New Claim</Text>
            <Text style={styles.cardSub}>Start a new insurance claim</Text>
            <View style={styles.cardBottom}>
              <Text style={styles.price}></Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('NewClaim')}
              >
                <Ionicons name="add" size={20} color="white" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={() => navigation.navigate('NewClaim')}
            />
          </View>

          {/* Previous Claims */}
          <View style={styles.claimCard}>
            <Image
              source={require('../assets/prevclaim.jpg')}
              style={styles.cardImage}
            />
            <Text style={styles.cardTitle}>Previous Claims</Text>
            <Text style={styles.cardSub}>Review past claim details</Text>
            <View style={styles.cardBottom}>
              <Text style={styles.price}>History</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('PreviousClaims')}
              >
                <Ionicons name="arrow-forward" size={20} color="white" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={() => navigation.navigate('PreviousClaims')}
            />
          </View>
        </View>
      </ScrollView>

      {/* ChatBot Floating Button */}
      <TouchableOpacity
        style={styles.chatbotButton}
        onPress={() => navigation.navigate('Chatbot')}
      >
        <Image
          source={require('../assets/chatbot.jpg')}
          style={styles.chatbotIcon}
        />
      </TouchableOpacity>

      {/* Bottom NavBar */}
      <View style={styles.navBar}>
  <TouchableOpacity onPress={() => navigation.navigate('languageSelect')}>
    <Ionicons name="home" size={28} color="white" />
  </TouchableOpacity>
  <TouchableOpacity onPress={() => navigation.navigate('FarmerProfile')}>
    <Ionicons name="person" size={28} color="white" />
  </TouchableOpacity>
</View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D0F0C0',
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  greeting: {
    fontSize: 18,
    color: '#555',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
  },
  wave: {
    fontSize: 20,
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  cardContainer: {
    marginTop: 30,
    paddingBottom: 200, // Space for navBar
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 20,
  },
  claimCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16,
    position: 'relative',
  },
  cardImage: {
    width: 50,
    height: 50,
    alignSelf: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  cardSub: {
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 14,
    color: '#555',
  },
  addButton: {
    backgroundColor: '#50C878',
    borderRadius: 20,
    padding: 6,
  },
  // navBar: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-around',
  //   backgroundColor: '#333',
  //   paddingVertical: 15,
  //   borderRadius: 20,
  // },
  navBar: {
  position: 'absolute',
  bottom: 45, // Move it slightly up from the bottom (was 20 or default)
  left: 20,
  right: 20,
  flexDirection: 'row',
  justifyContent: 'space-around',
  backgroundColor: '#333',
  paddingVertical: 15,
  borderRadius: 20,
  elevation: 5,
},

  chatbotButton: {
    position: 'absolute',
    bottom: 110,
    right: 30,
  },
  chatbotIcon: {
    width: 80,
    height: 80,
    borderRadius: 50,
  },  
});

export default HomeScreen;
