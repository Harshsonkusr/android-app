import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';

const claimsData = [
  {
    id: 1,
    name: 'John Doe',
    date: '2025-04-01',
    location: 'Nagpur',
    time: '10:30 AM',
    insuranceName: 'Crop Protection',
    insuranceType: 'Agriculture',
    stage: 3,
  },
  {
    id: 2,
    name: 'Jane Smith',
    date: '2025-03-15',
    location: 'Mumbai',
    time: '2:00 PM',
    insuranceName: 'Livestock Damage',
    insuranceType: 'Animal',
    stage: 2,
  },
  {
    id: 3,
    name: 'Amit Patel',
    date: '2025-01-10',
    location: 'Pune',
    time: '9:00 AM',
    insuranceName: 'Flood Loss',
    insuranceType: 'Natural Calamity',
    stage: 4,
  },
];

const stages = ['Filed', 'Under Review', 'Verification Done', 'Approved', 'Claim Settled'];

const InsuranceHistoryScreen = () => {
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const openModal = (claim) => {
    setSelectedClaim(claim);
    setModalVisible(true);
  };

  const closeModal = () => {
    setSelectedClaim(null);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧾 Previous Insurance Claims</Text>
      <ScrollView contentContainerStyle={styles.scrollView}>
        {claimsData.map((claim) => (
          <TouchableOpacity
            key={claim.id}
            style={styles.card}
            onPress={() => openModal(claim)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.insuranceTitle}>{claim.insuranceName}</Text>
              <Text style={styles.insuranceType}>📂 {claim.insuranceType}</Text>
            </View>
            <View style={styles.infoRowSingle}>
              <Text style={styles.infoLabel}>📍 {claim.location}</Text>
            </View>
            <View style={styles.infoRowSingle}>
              <Text style={styles.infoLabel}>📅 {claim.date}</Text>
              <Text style={styles.infoLabel}>⏰ {claim.time}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Modal */}
      <Modal transparent={true} visible={modalVisible} animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Progress</Text>
            <View style={styles.flowContainer}>
              {stages.map((stage, index) => {
                const isCompleted = index + 1 < selectedClaim?.stage;
                const isActive = index + 1 === selectedClaim?.stage;

                return (
                  <View key={index} style={styles.flowItem}>
                    <View style={styles.iconContainer}>
                      {isCompleted ? (
                        <View style={styles.completedCircle}>
                          <Text style={styles.checkmark}>✓</Text>
                        </View>
                      ) : isActive ? (
                        <View style={styles.activeCircle}>
                          <Text style={styles.activeDot}>⬤</Text>
                        </View>
                      ) : (
                        <View style={styles.pendingCircle} />
                      )}
                      {index < stages.length - 1 && (
                        <View style={styles.verticalLine} />
                      )}
                    </View>
                    <View style={styles.labelContainer}>
                      <Text style={styles.stepText}>STEP {index + 1}</Text>
                      <Text style={styles.stageText}>{stage}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8f5e9',
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    color: '#01411C',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  scrollView: {
    paddingBottom: 30,
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginVertical: 10,
    borderRadius: 16,
    width: screenWidth * 0.9,
    shadowColor: '#2e7d32',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 6,
    borderLeftColor: '#66bb6a',
  },
  cardHeader: {
    marginBottom: 10,
  },
  insuranceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1b5e20',
  },
  insuranceType: {
    fontSize: 14,
    color: '#558b2f',
    marginTop: 4,
  },
  infoRowSingle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: '#33691e',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '85%',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2e7d32',
  },
  flowContainer: {
    width: '100%',
  },
  flowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    alignItems: 'center',
    width: 50,
    position: 'relative',
  },
  completedCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  activeCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1e88e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDot: {
    color: 'white',
    fontSize: 18,
  },
  pendingCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ccc',
  },
  verticalLine: {
    width: 2,
    height: 40,
    backgroundColor: '#ccc',
    position: 'absolute',
    top: 32,
  },
  labelContainer: {
    marginLeft: 12,
  },
  stepText: {
    fontSize: 12,
    color: '#757575',
  },
  stageText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#2e7d32',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
  },
  closeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default InsuranceHistoryScreen;
