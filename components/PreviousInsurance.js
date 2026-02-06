import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getApiUrl, API_ENDPOINTS } from '../config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../constants/Colors';

const stages = ['Filed', 'Under Review', 'Verification Done', 'Approved', 'Claim Settled'];

const { width } = Dimensions.get('window');

const InsuranceHistoryScreen = ({ navigation }) => {
  const [claimsData, setClaimsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [activeNavTab, setActiveNavTab] = useState('claims');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    fetchClaims();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const fetchClaims = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Please login again to view your claims');
        return;
      }

      setLoading(true);
      const API_URL = getApiUrl(API_ENDPOINTS.GET_MY_CLAIMS);
      const response = await fetch(API_URL, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Transform backend data to frontend format if needed
        const formattedData = data.map(claim => ({
          id: claim.id,
          name: claim.farmer?.name || 'Self',
          date: new Date(claim.dateOfIncident || claim.createdAt).toLocaleDateString(),
          location: claim.locationOfIncident || 'Geolocation',
          time: new Date(claim.dateOfIncident || claim.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          insuranceName: claim.policy?.cropType || 'Claim',
          insuranceType: claim.policy?.cropType || 'Agriculture',
          stage: getStageNumber(claim.status),
          claimAmount: `₹${claim.amountClaimed || 0}`,
          approvedAmount: (claim.approvedAmount || claim.payoutAmount) ? `₹${claim.approvedAmount || claim.payoutAmount}` : '-',
          status: mapStatus(claim.status),
          policyNumber: claim.policy?.policyNumber || 'N/A',
          claimId: claim.claimId || claim.id, // Add human-readable claimId
          description: claim.description,
          aiDamagePercent: claim.aiDamagePercent, // Map AI field
          verificationStatus: claim.verificationStatus
        }));
        setClaimsData(formattedData);
      } else if (response.status === 401) {
        Alert.alert('Error', 'Your session has expired. Please login again.');
        // Optionally clear token and navigate to login
        await AsyncStorage.removeItem('token');
      } else {
        Alert.alert('Error', `Failed to fetch claims. Server returned: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching claims:', error);
      if (error.message.includes('Network request failed')) {
        Alert.alert('Connection Error', 'Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        Alert.alert('Error', `Failed to fetch claims: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStageNumber = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'pending') return 1;
    if (statusLower === 'aiprocessing' || statusLower === 'aicompleted' || statusLower === 'under review') return 2;
    if (statusLower === 'verified' || statusLower === 'forwardedtoinsurer') return 3;
    if (statusLower === 'approved') return 4;
    if (statusLower === 'settled' || statusLower === 'resolved' || statusLower === 'rejected') return 5;
    return 1;
  };

  const mapStatus = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'pending') return 'Filed';
    if (statusLower === 'aiprocessing') return 'AI Analysis';
    if (statusLower === 'aicompleted') return 'Under Review';
    if (statusLower === 'forwardedtoinsurer') return 'In Progress';
    if (statusLower === 'verified') return 'Under Review';
    if (statusLower === 'approved') return 'Approved';
    if (statusLower === 'settled') return 'Settled';
    if (statusLower === 'resolved') return 'Settled';
    if (statusLower === 'rejected') return 'Rejected';
    return status || 'Pending';
  };

  const openModal = (claim) => {
    setSelectedClaim(claim);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => setSelectedClaim(null), 300);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Settled':
        return [Colors.success, Colors.primaryDark];
      case 'Approved':
        return [Colors.secondary, '#1e40af'];
      case 'In Progress':
        return [Colors.warning, '#d97706'];
      case 'Under Review':
        return ['#9333ea', '#7e22ce'];
      case 'Rejected':
        return [Colors.error, '#991b1b'];
      default:
        return [Colors.textMuted, '#4b5563'];
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Agriculture':
      case 'Crop':
        return 'leaf-outline';
      case 'Animal':
      case 'Livestock':
        return 'paw-outline';
      case 'Natural Calamity':
      case 'Disaster':
        return 'thunderstorm-outline';
      case 'Machinery':
        return 'construct-outline';
      default:
        return 'document-text-outline';
    }
  };

  const filters = ['All', 'In Progress', 'Approved', 'Settled'];
  const filteredClaims = filterStatus === 'All'
    ? claimsData
    : claimsData.filter(claim => claim.status === filterStatus);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Claims History</Text>
            <Text style={styles.headerSubtitle}>{claimsData.length} total claims filed</Text>
          </View>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="filter-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                filterStatus === filter && styles.filterTabActive
              ]}
              onPress={() => setFilterStatus(filter)}
            >
              <Text style={[
                styles.filterText,
                filterStatus === filter && styles.filterTextActive
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Fetching your claims...</Text>
          </View>
        ) : filteredClaims.map((claim, index) => (
          <Animated.View
            key={claim.id}
            style={[
              {
                opacity: fadeAnim,
                transform: [{
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 30],
                    outputRange: [0, 30 * (index + 1)],
                  })
                }]
              }
            ]}
          >
            <TouchableOpacity
              style={styles.card}
              onPress={() => openModal(claim)}
              activeOpacity={0.9}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons name={getTypeIcon(claim.insuranceType)} size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.headerInfo}>
                    <Text style={styles.insuranceTitle}>{claim.insuranceName}</Text>
                    <Text style={styles.policyNumber}>Claim ID: {claim.claimId}</Text>
                    <Text style={styles.policyNumber}>Policy: {claim.policyNumber}</Text>
                  </View>
                </View>
                <LinearGradient
                  colors={getStatusColor(claim.status)}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.statusBadge}
                >
                  <Text style={styles.statusText}>{claim.status}</Text>
                </LinearGradient>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Ionicons name="location-outline" size={16} color={Colors.primary} />
                    <Text style={styles.infoText} numberOfLines={1}>{claim.location}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
                    <Text style={styles.infoText}>{claim.date}</Text>
                  </View>
                </View>

                <View style={styles.amountContainer}>
                  <View style={styles.amountItem}>
                    <Text style={styles.amountLabel}>Claimed</Text>
                    <Text style={styles.amountValue}>{claim.claimAmount}</Text>
                  </View>
                  {claim.approvedAmount !== '-' && (
                    <View style={styles.amountItem}>
                      <Text style={styles.amountLabel}>Approved</Text>
                      <Text style={[styles.amountValue, styles.approvedAmount]}>
                        {claim.approvedAmount}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* AI Analysis Badge */}
              {claim.aiDamagePercent !== undefined && claim.aiDamagePercent !== null && (
                <View style={styles.aiBadgeContainer}>
                  <View style={styles.aiBadge}>
                    <Ionicons name="pulse" size={14} color="#9333ea" />
                    <Text style={styles.aiBadgeText}>AI Analysis: {claim.aiDamagePercent}% Damage</Text>
                  </View>
                </View>
              )}

              <View style={styles.cardFooter}>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBar}>
                    <LinearGradient
                      colors={[Colors.primaryLight, Colors.primary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.progressFill, { width: `${(claim.stage / 5) * 100}%` }]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    Stage {claim.stage} of 5: {(claim.status === 'Rejected' 
                      ? ['Filed', 'Under Review', 'Verification Done', 'Insurer Review', 'Rejected']
                      : ['Filed', 'Under Review', 'Verification Done', 'Approved', 'Claim Settled']
                    )[claim.stage - 1]}
                  </Text>
                </View>
                <View style={styles.viewDetailsButton}>
                  <Text style={styles.viewDetailsText}>Details</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}

        {filteredClaims.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="document-text-outline" size={64} color={Colors.primaryLight} />
            </View>
            <Text style={styles.emptyText}>No claims found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters or file a new claim</Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => navigation.navigate('ClaimSubmissionScreen')}
            >
              <Text style={styles.emptyButtonText}>File New Claim</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.navBarContainer}>
        <LinearGradient
          colors={['#1B5E20', '#2E7D32']}
          style={styles.navBar}
        >
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              setActiveNavTab('home');
              navigation.navigate('Home');
            }}
            accessibilityLabel="Home"
            accessibilityRole="button"
            accessibilityState={{ selected: activeNavTab === 'home' }}
            accessible={true}
          >
            <Ionicons
              name={activeNavTab === 'home' ? 'home' : 'home-outline'}
              size={22}
              color={activeNavTab === 'home' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
            />
            <Text style={[
              styles.navLabel,
              activeNavTab === 'home' && styles.navLabelActive
            ]}>
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              setActiveNavTab('claims');
              navigation.navigate('PreviousClaims');
            }}
            accessibilityLabel="Claims"
            accessibilityRole="button"
            accessibilityState={{ selected: activeNavTab === 'claims' }}
            accessible={true}
          >
            <Ionicons
              name={activeNavTab === 'claims' ? 'document-text' : 'document-text-outline'}
              size={22}
              color={activeNavTab === 'claims' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
            />
            <Text style={[
              styles.navLabel,
              activeNavTab === 'claims' && styles.navLabelActive
            ]}>
              Claims
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              setActiveNavTab('profile');
              navigation.navigate('FarmerProfile');
            }}
            accessibilityLabel="Profile"
            accessibilityRole="button"
            accessibilityState={{ selected: activeNavTab === 'profile' }}
            accessible={true}
          >
            <Ionicons
              name={activeNavTab === 'profile' ? 'person' : 'person-outline'}
              size={22}
              color={activeNavTab === 'profile' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
            />
            <Text style={[
              styles.navLabel,
              activeNavTab === 'profile' && styles.navLabelActive
            ]}>
              Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              setActiveNavTab('settings');
              navigation.navigate('FarmerProfile');
            }}
            accessibilityLabel="Settings"
            accessibilityRole="button"
            accessibilityState={{ selected: activeNavTab === 'settings' }}
            accessible={true}
          >
            <Ionicons
              name={activeNavTab === 'settings' ? 'settings' : 'settings-outline'}
              size={22}
              color={activeNavTab === 'settings' ? '#FFFFFF' : '#B0BEC5'}
            />
            <Text style={[
              styles.navLabel,
              activeNavTab === 'settings' && styles.navLabelActive
            ]}>
              Settings
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Enhanced Modal */}
      <Modal transparent={true} visible={modalVisible} animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalBackground}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Claim Progress</Text>
                <Text style={styles.modalSubtitle}>{selectedClaim?.claimId}</Text>
                <Text style={styles.modalSubtitle}>{selectedClaim?.insuranceName} • Policy: {selectedClaim?.policyNumber}</Text>
              </View>
              <TouchableOpacity onPress={closeModal} style={styles.closeIconButton}>
                <Ionicons name="close-circle" size={32} color={Colors.error} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalDivider} />

            {/* Claim Summary */}
            <View style={styles.claimSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Incident Date</Text>
                <Text style={styles.summaryValue}>{selectedClaim?.date} at {selectedClaim?.time}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Claimed Amount</Text>
                <Text style={styles.summaryValue}>{selectedClaim?.claimAmount}</Text>
              </View>
              {selectedClaim?.approvedAmount !== '-' && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Approved Amount</Text>
                  <Text style={[styles.summaryValue, styles.summaryValueGreen]}>
                    {selectedClaim?.approvedAmount}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.modalDivider} />

            {/* Progress Timeline */}
            <ScrollView style={styles.timelineScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.flowContainer}>
                {(selectedClaim?.status === 'Rejected' 
                  ? ['Filed', 'Under Review', 'Verification Done', 'Insurer Review', 'Rejected']
                  : ['Filed', 'Under Review', 'Verification Done', 'Approved', 'Claim Settled']
                ).map((stage, index) => {
                  const isCompleted = index + 1 < (selectedClaim?.stage || 0);
                  const isActive = index + 1 === (selectedClaim?.stage || 0);
                  const isRejected = selectedClaim?.status === 'Rejected' && isActive && index === 4;

                  return (
                    <View key={index} style={styles.flowItem}>
                      <View style={styles.iconContainer}>
                        {isCompleted ? (
                          <LinearGradient
                            colors={[Colors.success, Colors.primaryDark]}
                            style={styles.completedCircle}
                          >
                            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                          </LinearGradient>
                        ) : isActive ? (
                          <LinearGradient
                            colors={isRejected ? [Colors.error, '#991b1b'] : [Colors.secondary, '#1e40af']}
                            style={styles.activeCircle}
                          >
                            <View style={styles.activePulse} />
                          </LinearGradient>
                        ) : (
                          <View style={styles.pendingCircle}>
                            <View style={styles.pendingDot} />
                          </View>
                        )}
                        {index < 4 && (
                          <View 
                            style={[
                              styles.verticalLine,
                              { backgroundColor: isCompleted ? Colors.primary : '#e2e8f0' }
                            ]}
                          />
                        )}
                      </View>
                      <View style={[
                        styles.labelContainer,
                        isActive && styles.labelContainerActive,
                        isRejected && { borderColor: Colors.error + '40', backgroundColor: Colors.error + '10' }
                      ]}>
                        <Text style={styles.stepText}>STEP {index + 1}</Text>
                        <Text style={[
                          styles.stageText,
                          isActive && styles.stageTextActive,
                          isCompleted && styles.stageTextCompleted,
                          isRejected && { color: Colors.error }
                        ]}>
                          {stage}
                        </Text>
                        {isCompleted && (
                          <Text style={styles.completedText}>Completed</Text>
                        )}
                        {isActive && (
                          <Text style={[
                            styles.activeText,
                            isRejected && { color: Colors.error }
                          ]}>
                            {isRejected ? 'Final Decision' : 'In Progress'}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                style={styles.closeButtonGradient}
              >
                <Text style={styles.closeText}>Close Window</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
    fontWeight: '500',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    paddingLeft: 20,
  },
  filterContent: {
    paddingRight: 20,
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterTabActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  filterTextActive: {
    color: Colors.primaryDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  headerInfo: {
    flex: 1,
  },
  insuranceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 2,
  },
  policyNumber: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16,
  },
  cardBody: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 10,
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  amountItem: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 4,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  amountValue: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  approvedAmount: {
    color: Colors.success,
  },
  aiBadgeContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9d5ff',
    gap: 6,
    alignSelf: 'flex-start',
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9333ea',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  progressBarContainer: {
    flex: 1,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '700',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  closeIconButton: {
    padding: 4,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 24,
  },
  claimSummary: {
    padding: 20,
    backgroundColor: '#f8fafc',
    marginHorizontal: 24,
    marginVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  summaryValueGreen: {
    color: Colors.success,
  },
  timelineScroll: {
    maxHeight: 350,
    paddingHorizontal: 24,
  },
  flowContainer: {
    paddingVertical: 16,
  },
  flowItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  iconContainer: {
    alignItems: 'center',
    width: 40,
    position: 'relative',
  },
  completedCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  activeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  activePulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  pendingCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    zIndex: 2,
  },
  pendingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e2e8f0',
  },
  verticalLine: {
    width: 3,
    height: 40,
    position: 'absolute',
    top: 40,
    borderRadius: 2,
    zIndex: 1,
  },
  labelContainer: {
    marginLeft: 16,
    flex: 1,
    paddingVertical: 4,
  },
  labelContainerActive: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  stepText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '800',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  stageText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  stageTextActive: {
    color: Colors.primaryDark,
  },
  stageTextCompleted: {
    color: Colors.success,
  },
  completedText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '700',
    marginTop: 4,
  },
  activeText: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: '700',
    marginTop: 4,
  },
  closeButton: {
    margin: 24,
    marginTop: 16,
    borderRadius: 18,
    overflow: 'hidden',
  },
  closeButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  closeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  navBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 15,
    paddingBottom: 15,
    backgroundColor: 'transparent',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 5,
    paddingBottom: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 5,
    flex: 1,
  },
  navLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
    fontWeight: '600',
  },
  navLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default InsuranceHistoryScreen;