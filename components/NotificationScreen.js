import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS, getApiUrl } from '../config/api.config';

const NotificationItem = ({ item, onPress }) => {
    const isRead = item.read;

    // Format date
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    };

    return (
        <TouchableOpacity
            style={[styles.notificationCard, !isRead && styles.unreadCard]}
            onPress={() => onPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.iconContainer}>
                <View style={[styles.iconCircle, !isRead ? styles.unreadIconCircle : styles.readIconCircle]}>
                    <Ionicons
                        name={item.type === 'CLAIM_UPDATE' ? 'document-text' : 'notifications'}
                        size={20}
                        color={!isRead ? '#2E7D32' : '#757575'}
                    />
                </View>
            </View>

            <View style={styles.contentContainer}>
                <View style={styles.headerRow}>
                    <Text style={[styles.title, !isRead && styles.unreadText]} numberOfLines={1}>
                        {item.title}
                    </Text>
                    <Text style={styles.time}>{formatDate(item.createdAt)}</Text>
                </View>
                <Text style={styles.message} numberOfLines={2}>
                    {item.message}
                </Text>
            </View>

            {!isRead && <View style={styles.activeDot} />}
        </TouchableOpacity>
    );
};

const NotificationScreen = () => {
    const navigation = useNavigation();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                setLoading(false);
                setRefreshing(false);
                return;
            }

            const response = await fetch(getApiUrl(API_ENDPOINTS.GET_NOTIFICATIONS), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (response.ok) {
                // Handle both structure formats (array or object with notifications array)
                if (Array.isArray(data)) {
                    setNotifications(data);
                } else if (data.notifications && Array.isArray(data.notifications)) {
                    setNotifications(data.notifications);
                }
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const handleNotificationPress = async (item) => {
        // Ideally call API to mark as read here
        // For now, just navigation or expansion logic if needed
        if (item.type === 'CLAIM_UPDATE' && item.metadata?.claimId) {
            // Navigate to claim details if we had that screen
            // navigation.navigate('ClaimDetails', { claimId: item.metadata.claimId });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#2E7D32" />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={({ item }) => <NotificationItem item={item} onPress={handleNotificationPress} />}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="notifications-off-outline" size={60} color="#ccc" />
                            <Text style={styles.emptyText}>No notifications yet</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        marginTop: 0,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        alignItems: 'flex-start',
    },
    unreadCard: {
        backgroundColor: '#F1F8E9', // Light green for unread
        borderLeftWidth: 4,
        borderLeftColor: '#2E7D32',
    },
    iconContainer: {
        marginRight: 12,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unreadIconCircle: {
        backgroundColor: '#E8F5E9',
    },
    readIconCircle: {
        backgroundColor: '#f0f0f0',
    },
    contentContainer: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        marginRight: 8,
    },
    unreadText: {
        color: '#1B5E20',
    },
    time: {
        fontSize: 12,
        color: '#757575',
    },
    message: {
        fontSize: 14,
        color: '#616161',
        lineHeight: 20,
    },
    activeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#2E7D32',
        position: 'absolute',
        top: 16,
        right: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#757575',
    }
});

export default NotificationScreen;
