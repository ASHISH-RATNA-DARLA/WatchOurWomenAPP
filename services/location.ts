import * as Location from 'expo-location';

export async function getLocationAsync() {
  try {
    // Request permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      throw new Error('Location permission not granted');
    }
    
    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    
    return location;
  } catch (error) {
    console.error('Error getting location:', error);
    throw error;
  }
}

export async function startLocationTracking(callback: (location: Location.LocationObject) => void) {
  try {
    // Request background permissions if needed
    if (Platform.OS !== 'web') {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      
      if (status !== 'granted') {
        throw new Error('Background location permission not granted');
      }
    }
    
    // Start watching position
    const locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5 * 60 * 1000, // 5 minutes
        distanceInterval: 100, // 100 meters
      },
      callback
    );
    
    return locationSubscription;
  } catch (error) {
    console.error('Error starting location tracking:', error);
    throw error;
  }
}