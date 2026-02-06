import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const FarmBoundaryMap = ({ coordinates }) => {
    const mapRef = useRef(null);

    useEffect(() => {
        if (mapRef.current && coordinates && coordinates.length >= 3) {
            setTimeout(() => {
                mapRef.current.fitToCoordinates(coordinates, {
                    edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                    animated: true,
                });
            }, 500);
        }
    }, [coordinates]);

    if (!coordinates || coordinates.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="map-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No Boundary Data Available</Text>
            </View>
        );
    }

    return (
        <Surface style={styles.container} elevation={2}>
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                mapType="satellite"
                scrollEnabled={false}
                zoomEnabled={true}
                pitchEnabled={false}
                rotateEnabled={false}
            >
                {coordinates.length >= 3 && (
                    <Polygon
                        coordinates={coordinates}
                        fillColor="rgba(76, 175, 80, 0.35)"
                        strokeColor="#1B5E20"
                        strokeWidth={3}
                    />
                )}
                {coordinates.map((coord, index) => (
                    <Marker
                        key={`point-${index}`}
                        coordinate={coord}
                    >
                        <View style={styles.markerContainer}>
                            <Text style={styles.markerText}>{index + 1}</Text>
                        </View>
                    </Marker>
                ))}
            </MapView>
        </Surface>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 250,
        borderRadius: 20,
        overflow: 'hidden',
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    map: {
        flex: 1,
    },
    emptyContainer: {
        width: '100%',
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: 20,
        marginTop: 10,
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: '#cbd5e1',
    },
    emptyText: {
        marginTop: 10,
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '600',
    },
    markerContainer: {
        backgroundColor: '#1B5E20',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#fff',
        minWidth: 24,
        alignItems: 'center',
    },
    markerText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
    },
});

export default FarmBoundaryMap;
