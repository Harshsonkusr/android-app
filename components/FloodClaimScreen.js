import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, ScrollView, Alert, ActivityIndicator, Modal
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

// Firebase imports
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, firestore } from '../firebase'; // adjust path if needed
import { doc, setDoc } from 'firebase/firestore';

// Helper function to generate plus code
const getPlusCode = (latitude, longitude) => {
  const lat = Math.abs(latitude);
  const lng = Math.abs(longitude);
  const latCode = Math.floor(lat * 8000).toString(36).toUpperCase();
  const lngCode = Math.floor(lng * 8000).toString(36).toUpperCase();
  return `${latCode.slice(-3)}${lngCode.slice(-3)}+${latCode.slice(-2)}${lngCode.slice(-2)}`;
};

// Improved Firebase upload function with better error handling
const uploadImageToFirebase = async (photo) => {
  try {
    console.log('Starting upload for photo:', photo.id);
    
    let blob;
    
    // Method 1: Try standard fetch approach
    try {
      console.log('Attempting fetch method...');
      const response = await fetch(photo.uri);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      blob = await response.blob();
      console.log('Blob created successfully via fetch, size:', blob.size);
      
    } catch (fetchError) {
      console.log('Fetch method failed:', fetchError.message);
      
      // Method 2: Fallback to XMLHttpRequest approach
      try {
        console.log('Attempting XMLHttpRequest method...');
        blob = await createBlobFromUri(photo.uri);
        console.log('Blob created successfully via XMLHttpRequest, size:', blob.size);
        
      } catch (xhrError) {
        console.log('XMLHttpRequest method failed:', xhrError.message);
        throw new Error('Failed to create blob from image URI');
      }
    }

    // Validate blob
    if (!blob || blob.size === 0) {
      throw new Error('Invalid blob created - size is 0');
    }

    // Create storage reference with timestamp to avoid conflicts
    const timestamp = Date.now();
    const fileName = `${photo.id}_${timestamp}.jpg`;
    const storageRef = ref(storage, `claims/${fileName}`);
    
    console.log('Uploading to Firebase Storage...');
    
    // Upload with timeout
    const uploadPromise = uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg',
      customMetadata: {
        'originalId': photo.id.toString(),
        'uploadTime': new Date().toISOString()
      }
    });
    
    // Add timeout to upload
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
    );
    
    const snapshot = await Promise.race([uploadPromise, timeoutPromise]);
    console.log('Upload successful, getting download URL...');

    const downloadURL = await getDownloadURL(storageRef);
    console.log('Download URL obtained:', downloadURL);

    // Store metadata in Firestore with retry logic
    let firestoreSuccess = false;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (!firestoreSuccess && attempts < maxAttempts) {
      try {
        await setDoc(doc(firestore, 'claims', fileName), {
          uri: downloadURL,
          latitude: photo.latitude,
          longitude: photo.longitude,
          accuracy: photo.accuracy,
          timestamp: photo.timestamp,
          plusCode: photo.plusCode,
          uploadedAt: new Date().toISOString(),
          originalId: photo.id
        });
        firestoreSuccess = true;
        console.log('Metadata saved to Firestore successfully');
      } catch (firestoreError) {
        attempts++;
        console.log(`Firestore attempt ${attempts} failed:`, firestoreError.message);
        if (attempts >= maxAttempts) {
          console.warn('Failed to save metadata to Firestore after 3 attempts');
          // Don't throw error here - the image is uploaded successfully
        } else {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    return downloadURL;
    
  } catch (error) {
    console.error('Firebase Upload Error Details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      photoId: photo.id
    });
    
    // Provide more specific error messages
    let userMessage = 'Could not upload photo to Firebase.';
    
    if (error.message.includes('network')) {
      userMessage = 'Network error. Please check your internet connection and try again.';
    } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
      userMessage = 'Permission denied. Please check Firebase storage rules.';
    } else if (error.message.includes('timeout')) {
      userMessage = 'Upload timed out. Please try again with a smaller image.';
    } else if (error.message.includes('blob')) {
      userMessage = 'Failed to process image. Please try taking another photo.';
    }
    
    Alert.alert('Upload Failed', userMessage);
    return null;
  }
};

// Alternative blob creation method using XMLHttpRequest
const createBlobFromUri = (uri) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      try {
        const blob = xhr.response;
        if (blob && blob.size > 0) {
          resolve(blob);
        } else {
          reject(new Error('Empty response from XMLHttpRequest'));
        }
      } catch (error) {
        reject(error);
      }
    };
    
    xhr.onerror = function () {
      reject(new Error('XMLHttpRequest failed'));
    };
    
    xhr.ontimeout = function () {
      reject(new Error('XMLHttpRequest timed out'));
    };
    
    xhr.responseType = 'blob';
    xhr.timeout = 15000; // 15 second timeout
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
};

const ClaimScreen = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);

  // Enhanced photo capture with better error handling
  const takePhoto = async () => {
    setLoading(true);
    try {
      console.log('Starting photo capture process...');
      
      const [cameraPerm, locationPerm] = await Promise.all([
        ImagePicker.requestCameraPermissionsAsync(),
        Location.requestForegroundPermissionsAsync()
      ]);

      if (cameraPerm.status !== 'granted' || locationPerm.status !== 'granted') {
        Alert.alert('Permissions Required', 'Camera and location permissions are needed to capture geotagged photos.');
        setLoading(false);
        return;
      }

      console.log('Permissions granted, capturing photo and location...');
      
      const [cameraResult, locationResult] = await Promise.all([
        ImagePicker.launchCameraAsync({
          allowsEditing: false,
          quality: 0.8, // Slightly higher quality
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        }),
        Location.getCurrentPositionAsync({ 
          accuracy: Location.Accuracy.High,
          timeout: 10000 // 10 second timeout for location
        })
      ]);

      if (!cameraResult || cameraResult.canceled || !cameraResult.assets?.length) {
        console.log('Camera capture was cancelled');
        setLoading(false);
        return;
      }

      console.log('Photo captured, processing...');
      
      const coords = locationResult?.coords || {};
      const now = new Date();
      const readableTimestamp = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });

      const newPhoto = {
        uri: cameraResult.assets[0].uri,
        latitude: coords.latitude || 0,
        longitude: coords.longitude || 0,
        accuracy: coords.accuracy || -1,
        timestamp: now.toISOString(),
        readableTimestamp,
        plusCode: getPlusCode(coords.latitude || 0, coords.longitude || 0),
        id: `${Date.now()}_${Math.floor(Math.random() * 1000)}`, // More unique ID
      };

      console.log('Photo object created:', {
        id: newPhoto.id,
        hasUri: !!newPhoto.uri,
        location: `${newPhoto.latitude}, ${newPhoto.longitude}`
      });

      // Upload to Firebase
      const downloadURL = await uploadImageToFirebase(newPhoto);

      if (downloadURL) {
        setPhotos(prev => [...prev, { ...newPhoto, uri: downloadURL }]);
        Alert.alert('Success', 'Photo uploaded to Firebase successfully!');
      } else {
        // Keep local photo even if upload failed
        setPhotos(prev => [...prev, newPhoto]);
      }

    } catch (error) {
      console.error('Photo capture error:', error);
      Alert.alert('Error', error.message || 'Failed to capture photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitAllPhotos = () => {
    if (photos.length === 0) {
      Alert.alert('No Photos', 'Please take at least one photo before submitting.');
      return;
    }
    
    const uploadedPhotos = photos.filter(photo => photo.uri.startsWith('https://'));
    const localPhotos = photos.filter(photo => !photo.uri.startsWith('https://'));
    
    if (localPhotos.length > 0) {
      Alert.alert(
        'Incomplete Upload', 
        `${localPhotos.length} photo(s) failed to upload. Do you want to retry uploading them?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: retryFailedUploads },
          { text: 'Submit Anyway', onPress: () => submitWithPartialUpload(uploadedPhotos) }
        ]
      );
    } else {
      Alert.alert('Submit', `You have ${photos.length} photo(s) ready to submit!`);
    }
  };

  const retryFailedUploads = async () => {
    const localPhotos = photos.filter(photo => !photo.uri.startsWith('https://'));
    
    for (const photo of localPhotos) {
      const downloadURL = await uploadImageToFirebase(photo);
      if (downloadURL) {
        setPhotos(prev => prev.map(p => 
          p.id === photo.id ? { ...p, uri: downloadURL } : p
        ));
      }
    }
  };

  const submitWithPartialUpload = (uploadedPhotos) => {
    Alert.alert('Submit', `Submitting ${uploadedPhotos.length} successfully uploaded photo(s).`);
  };

  const removePhoto = (photoId) => setPhotos(prev => prev.filter(photo => photo.id !== photoId));

  return (
    <View style={styles.background}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Claim the Insurance</Text>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#1b5e20" size="large" />
            <Text style={styles.loadingText}>Processing photo...</Text>
          </View>
        )}

        <TouchableOpacity style={styles.cameraButton} onPress={takePhoto} disabled={loading}>
          <Text style={styles.cameraButtonText}>📸 Take Geotagged Photo</Text>
        </TouchableOpacity>

        <View style={styles.photosContainer}>
          {photos.map(photo => (
            <View key={photo.id} style={styles.photoCard}>
              <TouchableOpacity onPress={() => setSelectedImageUri(photo.uri)}>
                <Image source={{ uri: photo.uri }} style={styles.photo} />
              </TouchableOpacity>
              
              {/* Upload status indicator */}
              <View style={[styles.statusIndicator, { 
                backgroundColor: photo.uri.startsWith('https://') ? '#4caf50' : '#ff9800' 
              }]}>
                <Text style={styles.statusText}>
                  {photo.uri.startsWith('https://') ? '✓' : '⏳'}
                </Text>
              </View>
              
              <View style={styles.overlay}>
                <Text style={styles.overlayText}>📅 {photo.readableTimestamp} IST</Text>
                <Text style={styles.overlayText}>📍 Lat: {photo.latitude.toFixed(6)}</Text>
                <Text style={styles.overlayText}>📍 Lon: {photo.longitude.toFixed(6)}</Text>
                <Text style={styles.overlayText}>📶 Accuracy: {photo.accuracy >= 0 ? `${photo.accuracy.toFixed(1)}m` : 'Unknown'}</Text>
                <Text style={styles.overlayText}>🏷️ Plus Code: {photo.plusCode}</Text>
              </View>
              <TouchableOpacity style={styles.removeButton} onPress={() => removePhoto(photo.id)}>
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {photos.length > 0 && (
          <TouchableOpacity style={styles.submitButton} onPress={submitAllPhotos}>
            <Text style={styles.submitButtonText}>🚀 Submit All Photos ({photos.length})</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Fullscreen Modal */}
      <Modal visible={!!selectedImageUri} transparent onRequestClose={() => setSelectedImageUri(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalCloseArea} onPress={() => setSelectedImageUri(null)} />
          <View style={styles.fullscreenImageWrapper}>
            {selectedImageUri && <Image source={{ uri: selectedImageUri }} style={styles.fullImage} />}
          </View>
          <TouchableOpacity style={styles.modalCloseArea} onPress={() => setSelectedImageUri(null)} />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#e8f5e9' },
  container: { padding: 20, alignItems: 'center' },
  title: { fontSize: 26, color: '#1b5e20', fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  loadingContainer: { marginVertical: 12, alignItems: 'center' },
  loadingText: { color: '#1b5e20', marginTop: 5 },
  cameraButton: {
    backgroundColor: '#66bb6a', paddingVertical: 14, paddingHorizontal: 40,
    borderRadius: 16, marginBottom: 20, elevation: 3,
  },
  cameraButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  photosContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 },
  photoCard: {
    backgroundColor: '#f1f8e9', borderRadius: 15, padding: 10, margin: 8, alignItems: 'center',
    elevation: 4, width: 220, position: 'relative',
  },
  photo: { width: 200, height: 180, borderRadius: 12, resizeMode: 'cover' },
  overlay: { position: 'absolute', bottom: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.65)', padding: 6, borderRadius: 8 },
  overlayText: { color: '#fff', fontSize: 10 },
  removeButton: {
    position: 'absolute', top: 5, right: 5, backgroundColor: '#f44336',
    borderRadius: 15, width: 25, height: 25, justifyContent: 'center', alignItems: 'center',
  },
  removeButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  statusIndicator: {
    position: 'absolute', top: 5, left: 5, borderRadius: 12, width: 24, height: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  submitButton: {
    backgroundColor: '#4caf50', paddingVertical: 15, paddingHorizontal: 30,
    borderRadius: 25, marginTop: 10, minWidth: 200, elevation: 3,
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  modalCloseArea: { flex: 0.05, width: '100%' },
  fullscreenImageWrapper: { width: '100%', height: '85%', justifyContent: 'center', alignItems: 'center' },
  fullImage: { width: '100%', height: '100%', resizeMode: 'contain' },
});

export default ClaimScreen;