import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions, Alert, TouchableOpacity } from 'react-native';
import { Text, Card, ActivityIndicator, Button, Chip, Badge } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl, API_ENDPOINTS } from '../config/api.config';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const MyPoliciesScreen = () => {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation();

    const fetchPolicies = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('Session Expired', 'Please login again.');
                navigation.navigate('LoginviaMobile');
                return;
            }

            const API_URL = getApiUrl(API_ENDPOINTS.GET_MY_POLICIES);
            const response = await fetch(API_URL, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setPolicies(data);
            } else {
                const errorData = await response.json();
                // If 404, it might just mean no policies, but usually returns empty array
                // If 401, token expired
                if (response.status === 401) {
                    Alert.alert('Session Expired', 'Please login again.');
                    navigation.navigate('LoginviaMobile');
                }
            }
        } catch (error) {
            console.error('Error fetching policies:', error);
            Alert.alert('Error', 'Failed to fetch policies. Please check your connection.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPolicies();
    }, []);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchPolicies();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return '#4CAF50';
            case 'Issued': return '#4CAF50';
            case 'Expired': return '#F44336';
            case 'Pending': return '#FF9800';
            case 'Approved': return '#2196F3';
            case 'Rejected': return '#F44336';
            default: return '#757575';
        }
    };

    const renderPolicyCard = (item) => (
        <Card style={styles.card} key={item._id || item.id}>
            <Card.Content>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.cropName}>{item.cropName || item.cropDetails?.cropName || 'Unknown Crop'}</Text>
                        <Text style={styles.policyNumber}>{item.policyNumber}</Text>
                    </View>
                    <Chip
                        style={{ backgroundColor: getStatusColor(item.viewStatus || item.status) + '20' }}
                        textStyle={{ color: getStatusColor(item.viewStatus || item.status) }}
                    >
                        {item.viewStatus || item.status}
                    </Chip>
                </View>

                <View style={styles.divider} />

                <View style={styles.row}>
                    <View style={styles.column}>
                        <Text style={styles.label}>Sum Insured</Text>
                        <Text style={styles.value}>₹{item.sumInsured?.toLocaleString()}</Text>
                    </View>
                    <View style={styles.column}>
                        <Text style={styles.label}>Premium Paid</Text>
                        <Text style={styles.value}>₹{item.premium?.toLocaleString()}</Text>
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={styles.column}>
                        <Text style={styles.label}>Insurer</Text>
                        <Text style={styles.value}>{item.insurerName || 'N/A'}</Text>
                    </View>
                    <View style={styles.column}>
                        <Text style={styles.label}>Season</Text>
                        <Text style={styles.value}>{item.cultivationSeason || item.cropDetails?.cultivationSeason || 'N/A'}</Text>
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={styles.column}>
                        <Text style={styles.label}>Policy Period</Text>
                        <Text style={styles.value}>
                            {item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A'} - 
                            {item.endDate ? new Date(item.endDate).toLocaleDateString() : 'N/A'}
                        </Text>
                    </View>
                </View>

                {item.canRenew && (
                    <Button
                        mode="contained"
                        style={styles.renewButton}
                        labelStyle={{ fontSize: 12 }}
                        onPress={() => Alert.alert('Renew', 'Renewal feature coming soon!')}
                    >
                        Renew Policy
                    </Button>
                )}
            </Card.Content>
        </Card>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1B5E20', '#2E7D32', '#388E3C']}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity 
                        style={styles.backButton} 
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>My Policies</Text>
                        <Text style={styles.headerSubtitle}>{policies.length} Policies Found</Text>
                    </View>
                </View>
            </LinearGradient>

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#2E7D32" />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    {policies.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No policies found.</Text>
                            <Button mode="outlined" onPress={onRefresh} style={{ marginTop: 20 }}>
                                Refresh
                            </Button>
                        </View>
                    ) : (
                        policies.map(renderPolicyCard)
                    )}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 15,
        padding: 5,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 5,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        marginBottom: 16,
        borderRadius: 16,
        elevation: 4,
        backgroundColor: '#FFF',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cropName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    policyNumber: {
        fontSize: 12,
        color: '#757575',
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    column: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        color: '#757575',
        marginBottom: 2,
    },
    value: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    renewButton: {
        marginTop: 8,
        backgroundColor: '#FF9800',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#757575'
    }
});

export default MyPoliciesScreen;
