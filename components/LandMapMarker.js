import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Dimensions, Image, ScrollView } from 'react-native';
import { 
  Modal, 
  Portal, 
  Button, 
  Text, 
  Surface, 
  IconButton,
  ActivityIndicator,
  Chip
} from 'react-native-paper';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

const LandMapMarker = ({ visible, onClose, onSave, initialData, capturedImages }) => {
  const mapRef = useRef(null);
  
  const [imageQueue, setImageQueue] = useState([]);
  const [polygonCoordinates, setPolygonCoordinates] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const [mapRegion, setMapRegion] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Process captured images when modal becomes visible
  useEffect(() => {
    if (visible && capturedImages && Object.keys(capturedImages).length > 0) {
      processImagesFromParent(capturedImages);
    } else if (!visible) {
      // Reset state when modal closes
      setSelectedImage(null);
      setIsProcessing(false);
    }
  }, [visible]);

  // Load initial data if editing
  useEffect(() => {
    if (visible && initialData && initialData.coordinates && initialData.coordinates.length > 0) {
      setPolygonCoordinates(initialData.coordinates);
      setImageQueue(initialData.imageQueue || []);
      setCanProceed(true);
      setHasUnsavedChanges(false);
      
      // Center map on existing polygon
      if (initialData.coordinates.length >= 3) {
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.fitToCoordinates(initialData.coordinates, {
              edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
              animated: true,
            });
          }
        }, 500);
      }
    }
  }, [visible, initialData]);

  const processImagesFromParent = (images) => {
    if (!images || Object.keys(images).length === 0) {
      setCanProceed(false);
      return;
    }

    const validImages = [];
    
    for (let i = 1; i <= 8; i++) {
      const imageUri = images[`land_image_${i}`];
      const gpsData = images[`land_image_${i}_gps`];
      
      if (imageUri && gpsData && gpsData.latitude && gpsData.longitude) {
        validImages.push({
          id: i,
          uri: imageUri,
          latitude: gpsData.latitude,
          longitude: gpsData.longitude,
          accuracy: gpsData.accuracy,
          timestamp: gpsData.timestamp,
        });
      }
    }

    setImageQueue(validImages);
    
    if (validImages.length >= 4) {
      setCanProceed(true);
      
      // Only auto-draw if there's no existing polygon data
      if (!initialData || !initialData.coordinates || initialData.coordinates.length === 0) {
        setHasUnsavedChanges(false); // Don't mark as unsaved on initial load
      }
      
      // Center map on markers
      if (validImages.length > 0) {
        centerMapOnMarkers(validImages);
      }
    } else {
      setCanProceed(false);
      setPolygonCoordinates([]);
    }
  };

  const drawAutomaticPolygon = () => {
    if (imageQueue.length < 4) {
      Alert.alert('Insufficient Images', 'At least 4 images are required to draw the land boundary.');
      return;
    }

    setIsProcessing(true);

    try {
      const first4Images = imageQueue.slice(0, 4);
      const sortedCoords = sortCoordinatesForPolygon(first4Images);
      
      const coordinates = sortedCoords.map(img => ({
        latitude: img.latitude,
        longitude: img.longitude,
      }));

      setPolygonCoordinates(coordinates);
      setHasUnsavedChanges(true);

      setTimeout(() => {
        if (mapRef.current && coordinates.length >= 3) {
          mapRef.current.fitToCoordinates(coordinates, {
            edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
            animated: true,
          });
        }
      }, 300);

      Alert.alert('Success', 'Land boundary drawn successfully! Please review and save.');

    } catch (error) {
      console.error('Error drawing polygon:', error);
      Alert.alert('Error', 'Failed to draw land boundary. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const sortCoordinatesForPolygon = (images) => {
    const centroid = {
      latitude: images.reduce((sum, img) => sum + img.latitude, 0) / images.length,
      longitude: images.reduce((sum, img) => sum + img.longitude, 0) / images.length,
    };

    return images.sort((a, b) => {
      const angleA = Math.atan2(a.latitude - centroid.latitude, a.longitude - centroid.longitude);
      const angleB = Math.atan2(b.latitude - centroid.latitude, b.longitude - centroid.longitude);
      return angleA - angleB;
    });
  };

  const centerMapOnMarkers = (images) => {
    if (images.length === 0) return;

    const latitudes = images.map(img => img.latitude);
    const longitudes = images.map(img => img.longitude);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const region = {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.01),
      longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.01),
    };

    setMapRegion(region);
    
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.animateToRegion(region, 1000);
      }
    }, 300);
  };

  const calculatePolygonArea = (coordinates) => {
    if (coordinates.length < 3) return 0;

    const earthRadius = 6371000;
    let area = 0;

    for (let i = 0; i < coordinates.length; i++) {
      const j = (i + 1) % coordinates.length;
      const xi = coordinates[i].longitude * Math.PI / 180;
      const yi = coordinates[i].latitude * Math.PI / 180;
      const xj = coordinates[j].longitude * Math.PI / 180;
      const yj = coordinates[j].latitude * Math.PI / 180;

      area += xi * Math.sin(yj) - xj * Math.sin(yi);
    }

    area = Math.abs(area * earthRadius * earthRadius / 2);
    return area;
  };

  const handleSave = () => {
    if (!canProceed) {
      Alert.alert('Cannot Save', 'Please capture at least 4 images before saving.');
      return;
    }

    if (polygonCoordinates.length < 3) {
      Alert.alert('No Shape Drawn', 'Please draw the land boundary shape before saving.');
      return;
    }

    const area = calculatePolygonArea(polygonCoordinates);
    const areaInHectares = (area / 10000).toFixed(2);

    const dataToSave = {
      coordinates: polygonCoordinates,
      area: areaInHectares,
      imageQueue: imageQueue,
      timestamp: new Date().toISOString(),
    };

    onSave(dataToSave);
    setHasUnsavedChanges(false);
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved land boundary data. Are you sure you want to close without saving?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Close Without Saving', 
            style: 'destructive',
            onPress: () => {
              setHasUnsavedChanges(false);
              onClose();
            }
          },
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleClose}
        contentContainerStyle={styles.modalContainer}
      >
        <Surface style={styles.surface} elevation={5}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <IconButton icon="map-marker-radius" size={28} iconColor="#1976d2" />
              <View>
                <Text style={styles.headerTitle}>Land Boundary Marker</Text>
                <Text style={styles.headerSubtitle}>
                  {imageQueue.length} image{imageQueue.length !== 1 ? 's' : ''} captured
                </Text>
              </View>
            </View>
            <IconButton
              icon="close"
              size={24}
              onPress={handleClose}
              iconColor="#666"
            />
          </View>

          {/* Status Chips */}
          <View style={styles.statusBar}>
            <Chip 
              icon={imageQueue.length >= 4 ? "check-circle" : "alert-circle"}
              style={[
                styles.statusChip,
                imageQueue.length >= 4 ? styles.statusChipSuccess : styles.statusChipWarning
              ]}
              textStyle={styles.statusChipText}
              compact
            >
              {imageQueue.length >= 4 ? 'Ready to Draw' : `${4 - imageQueue.length} more needed`}
            </Chip>
            
            {polygonCoordinates.length > 0 && (
              <Chip 
                icon="vector-polygon"
                style={styles.statusChipInfo}
                textStyle={styles.statusChipText}
                compact
              >
                {calculatePolygonArea(polygonCoordinates) > 0 
                  ? `${(calculatePolygonArea(polygonCoordinates) / 10000).toFixed(2)} hectares`
                  : 'Shape drawn'}
              </Chip>
            )}
          </View>

          {/* Map View */}
          <View style={styles.mapContainer}>
            {isProcessing && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color="#1976d2" />
                <Text style={styles.processingText}>Drawing land boundary...</Text>
              </View>
            )}

            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={mapRegion || {
                latitude: 22.7196,
                longitude: 75.8577,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              mapType="satellite"
              showsUserLocation
              showsMyLocationButton
            >
              {/* Draw polygon if coordinates exist */}
              {polygonCoordinates.length >= 3 && (
                <Polygon
                  coordinates={polygonCoordinates}
                  fillColor="rgba(76, 175, 80, 0.3)"
                  strokeColor="#2e7d32"
                  strokeWidth={3}
                />
              )}

              {/* First 4 images as polygon vertices (red pins) */}
              {imageQueue.slice(0, 4).map((img, index) => (
                <Marker
                  key={`boundary-${img.id}`}
                  coordinate={{
                    latitude: img.latitude,
                    longitude: img.longitude,
                  }}
                  pinColor="red"
                  title={`Boundary Point ${index + 1}`}
                  description={`Image ${img.id} - ${img.latitude.toFixed(6)}, ${img.longitude.toFixed(6)}`}
                  onPress={() => setSelectedImage(img)}
                >
                  <View style={styles.boundaryMarker}>
                    <Text style={styles.boundaryMarkerText}>{index + 1}</Text>
                  </View>
                </Marker>
              ))}

              {/* Additional images (5+) as overlays inside/along polygon (blue pins) */}
              {imageQueue.slice(4).map((img) => (
                <Marker
                  key={`additional-${img.id}`}
                  coordinate={{
                    latitude: img.latitude,
                    longitude: img.longitude,
                  }}
                  pinColor="blue"
                  title={`Additional Image ${img.id}`}
                  description={`${img.latitude.toFixed(6)}, ${img.longitude.toFixed(6)}`}
                  onPress={() => setSelectedImage(img)}
                >
                  <View style={styles.additionalMarker}>
                    <Text style={styles.additionalMarkerText}>{img.id}</Text>
                  </View>
                </Marker>
              ))}
            </MapView>
          </View>

          {/* Selected Image Preview */}
          {selectedImage && (
            <Surface style={styles.imagePreviewCard} elevation={3}>
              <View style={styles.imagePreviewHeader}>
                <Text style={styles.imagePreviewTitle}>Image {selectedImage.id}</Text>
                <IconButton
                  icon="close"
                  size={20}
                  onPress={() => setSelectedImage(null)}
                />
              </View>
              <Image
                source={{ uri: selectedImage.uri }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
              <View style={styles.imagePreviewInfo}>
                <Text style={styles.imagePreviewText}>
                  📍 {selectedImage.latitude.toFixed(6)}, {selectedImage.longitude.toFixed(6)}
                </Text>
                <Text style={styles.imagePreviewText}>
                  ⏱ {new Date(selectedImage.timestamp).toLocaleString()}
                </Text>
              </View>
            </Surface>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              mode="contained"
              icon="vector-polygon"
              onPress={drawAutomaticPolygon}
              disabled={!canProceed || isProcessing}
              style={[styles.actionButton, styles.drawButton]}
              contentStyle={styles.buttonContent}
            >
              {polygonCoordinates.length > 0 ? 'Redraw Shape' : 'Draw Shape'}
            </Button>

            <Button
              mode="contained"
              icon="content-save"
              onPress={handleSave}
              disabled={!canProceed || polygonCoordinates.length < 3}
              style={[styles.actionButton, styles.saveButton]}
              contentStyle={styles.buttonContent}
            >
              Save Land Data
            </Button>
          </View>

          {/* Info Footer */}
          <View style={styles.infoFooter}>
            <Text style={styles.infoText}>
              ℹ️ First 4 images define boundary corners. Additional images are marked inside the shape.
            </Text>
          </View>
        </Surface>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  surface: {
    width: width * 0.95,
    height: height * 0.9,
    borderRadius: 16,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1976d2',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  statusBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#f5f5f5',
  },
  statusChip: {
    backgroundColor: '#fff',
  },
  statusChipSuccess: {
    backgroundColor: '#c8e6c9',
  },
  statusChipWarning: {
    backgroundColor: '#fff3e0',
  },
  statusChipInfo: {
    backgroundColor: '#e3f2fd',
  },
  statusChipText: {
    fontSize: 12,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  processingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#1976d2',
    fontWeight: '600',
  },
  boundaryMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#d32f2f',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  boundaryMarkerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  additionalMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  additionalMarkerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  imagePreviewCard: {
    position: 'absolute',
    bottom: 180,
    left: 12,
    right: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
  },
  imagePreviewTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  imagePreview: {
    width: '100%',
    height: 150,
  },
  imagePreviewInfo: {
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  imagePreviewText: {
    fontSize: 12,
    color: '#666',
    marginVertical: 2,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flex: 1,
  },
  drawButton: {
    backgroundColor: '#1976d2',
  },
  saveButton: {
    backgroundColor: '#2e7d32',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  infoFooter: {
    padding: 12,
    backgroundColor: '#e3f2fd',
  },
  infoText: {
    fontSize: 12,
    color: '#1565c0',
    textAlign: 'center',
  },
});

export default LandMapMarker;