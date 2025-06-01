import PrimaryButton from '@/components/ui/PrimaryButton';
import Colors from '@/constants/Colors';
import { mockCrimeData } from '@/constants/mockData';
import { getLocationAsync } from '@/services/location';
import { TriangleAlert as AlertTriangle, Clock, MapPin, Navigation, Search, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-simple-toast';

// We'll move the default export to the end of the file after NavigationScreen is defined

// Mock navigation destinations
const DESTINATIONS = [
  { id: 1, name: 'Home', lat: 28.6139, lng: 77.2090 },
  { id: 2, name: 'Work', lat: 28.6129, lng: 77.2295 },
  { id: 3, name: 'Mall', lat: 28.6304, lng: 77.2177 },
  { id: 4, name: 'Park', lat: 28.6018, lng: 77.2332 },
  { id: 5, name: 'Gym', lat: 28.6250, lng: 77.2100 },
  { id: 6, name: 'Restaurant', lat: 28.6350, lng: 77.2200 },
  { id: 7, name: 'Library', lat: 28.6100, lng: 77.2250 },
];

// Export the component for use in index.js
export function NavigationScreen() {
  const mapRef = useRef(null);
  const [currentLocation, setCurrentLocation] = useState({ latitude: 28.6139, longitude: 77.2090 });
  const [destination, setDestination] = useState(null);
  const [route, setRoute] = useState([]);
  const [dangerZones, setDangerZones] = useState([]);
  const [dangerAlert, setDangerAlert] = useState(false);
  const [showDestinations, setShowDestinations] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // Get current location on mount
  useEffect(() => {
    (async () => {
      try {
        const location = await getLocationAsync();
        if (location) {
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      } catch (error) {
        console.error('Failed to get location:', error);
      }
    })();
  }, []);

  // Generate route when destination changes
  useEffect(() => {
    if (!destination) return;
    
    // Generate route using MapmyIndia API or fallback to mock
    generateRoute(currentLocation, destination);
    
    // Check for danger zones
    const dangerZonesNearRoute = checkDangerZones();
    setDangerZones(dangerZonesNearRoute);
    setDangerAlert(dangerZonesNearRoute.length > 0);
    
    // Calculate estimated time
    calculateEstimatedTime(currentLocation, destination);
  }, [destination]);

  const generateRoute = async (start, end) => {
    try {
      console.log('Generating mock route');
      
      // Generate a mock route since we're not using any routing API
      generateMockRoute(start, end);
      
      // Calculate estimated time based on distance
      calculateEstimatedTime(start, end);
      
    } catch (error) {
      console.error('Failed to generate route:', error);
      // Fallback to simple route in case of error
      generateMockRoute(start, end);
    }
  };
  
  const generateMockRoute = (start, end) => {
    // Generate a simple route with 5 points between start and end
    const route = [];
    route.push({ latitude: start.latitude, longitude: start.longitude });
    
    for (let i = 1; i <= 5; i++) {
      const lat = start.latitude + ((end.latitude - start.latitude) * i / 6);
      const lng = start.longitude + ((end.longitude - start.longitude) * i / 6);
      route.push({ latitude: lat, longitude: lng });
    }
    
    route.push({ latitude: end.latitude, longitude: end.longitude });
    setRoute(route);
  };

  const calculateEstimatedTime = (start, end) => {
    // In a real app, this would use a routing API
    // For demo, we'll calculate a simple estimate based on distance
    
    // Calculate distance in km using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = (end.latitude - start.latitude) * Math.PI / 180;
    const dLon = (end.longitude - start.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(start.latitude * Math.PI / 180) * Math.cos(end.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    // Assume average speed of 30 km/h in city
    const timeInHours = distance / 30;
    const timeInMinutes = Math.round(timeInHours * 60);
    
    setEstimatedTime(timeInMinutes);
  };

  const checkDangerZones = () => {
    // This would analyze the GeoJSON in a real app
    // For now, we'll use mock crime data
    return mockCrimeData.filter(point => {
      const isNearRoute = route.some(routePoint => 
        Math.abs(routePoint.latitude - point.latitude) < 0.01 &&
        Math.abs(routePoint.longitude - point.longitude) < 0.01
      );
      
      return isNearRoute;
    });
  };

  const selectDestination = (dest) => {
    setDestination({
      latitude: dest.lat,
      longitude: dest.lng,
      name: dest.name,
    });
    setShowDestinations(false);
    setSearchQuery('');
  };

  const rerouteAway = () => {
    // In a real app, this would generate a new route
    // For now, we'll just clear the danger alert
    Alert.alert("Rerouting", "Finding a safer route...");
    setDangerAlert(false);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.length > 0) {
      setIsSearching(true);
      // In a real app, this would call a search API
      // For demo, we'll just filter the destinations
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowDestinations(false);
  };

  const startNavigation = async () => {
    setIsNavigating(true);
    
    try {
      // For demo, we'll just show an alert
      Toast.show(`Navigating to ${destination.name}. Estimated arrival in ${estimatedTime} minutes.`, Toast.LONG);
      
      // Set isNavigating to false after a delay to simulate navigation starting
      setTimeout(() => {
        setIsNavigating(false);
        Alert.alert(
          "Navigation Started",
          `Following route to ${destination.name}. Please drive safely.`
        );
      }, 1500);
    } catch (error) {
      console.error('Failed to start navigation:', error);
      setIsNavigating(false);
      Alert.alert(
        "Navigation Error",
        "Failed to start navigation. Please try again."
      );
    }
  };

  const filteredDestinations = searchQuery
    ? DESTINATIONS.filter(dest => 
        dest.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : DESTINATIONS;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search destination or select below"
            value={searchQuery}
            onChangeText={handleSearch}
            onFocus={() => setShowDestinations(true)}
            placeholderTextColor={Colors.textTertiary}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={clearSearch}>
              <X size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setShowDestinations(!showDestinations)}>
              <MapPin size={20} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        
        {showDestinations && (
          <View style={styles.destinationDropdown}>
            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={Colors.primary} />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : filteredDestinations.length > 0 ? (
              filteredDestinations.map((dest) => (
                <TouchableOpacity 
                  key={dest.id} 
                  style={styles.destinationItem}
                  onPress={() => selectDestination(dest)}
                >
                  <MapPin size={16} color={Colors.textSecondary} />
                  <Text style={styles.destinationItemText}>{dest.name}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>No destinations found</Text>
              </View>
            )}
          </View>
        )}
      </View>
      
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        region={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {/* Current location marker */}
        <Marker
          coordinate={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }}
          title="You are here"
        >
          <View style={{
            height: 25,
            width: 25,
            backgroundColor: Colors.primary,
            borderRadius: 50,
            borderColor: '#fff',
            borderWidth: 2
          }} />
        </Marker>
        
        {/* Destination marker */}
        {destination && (
          <Marker
            coordinate={{
              latitude: destination.latitude,
              longitude: destination.longitude,
            }}
            title={destination.name}
          >
            <View style={{
              height: 25,
              width: 25,
              backgroundColor: Colors.accent,
              borderRadius: 50,
              borderColor: '#fff',
              borderWidth: 2
            }} />
          </Marker>
        )}
        
        {/* Route line */}
        {route.length > 0 && (
          <Polyline
            coordinates={route}
            strokeColor={Colors.primary}
            strokeWidth={4}
          />
        )}
        
        {/* Danger zone markers */}
        {dangerZones.map((zone, index) => (
          <Marker
            key={`danger-${index}`}
            coordinate={{
              latitude: zone.latitude,
              longitude: zone.longitude,
            }}
            title="Danger Zone"
          >
            <View style={styles.dangerMarker}>
              <AlertTriangle size={16} color={Colors.white} />
            </View>
          </Marker>
        ))}
      </MapView>
      
      {/* Estimated time banner */}
      {destination && estimatedTime && (
        <View style={styles.estimatedTimeBanner}>
          <Clock size={20} color={Colors.primary} />
          <Text style={styles.estimatedTimeText}>
            Estimated time: {estimatedTime} minutes
          </Text>
        </View>
      )}
      
      {/* Danger alert banner */}
      {dangerAlert && (
        <View style={styles.dangerBanner}>
          <AlertTriangle size={20} color={Colors.white} />
          <Text style={styles.dangerText}>
            ⚠️ Caution: Approaching crime-prone area
          </Text>
          <TouchableOpacity 
            style={styles.rerouteButton}
            onPress={rerouteAway}
          >
            <Text style={styles.rerouteText}>Reroute</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {destination && (
        <View style={styles.navigationControls}>
          <PrimaryButton
            title="Start Navigation"
            onPress={startNavigation}
            isLoading={isNavigating}
            icon={<Navigation size={20} color={Colors.white} />}
            style={styles.startNavButton}
          />
        </View>
      )}
      
      {/* Navigation status message */}
      {isNavigating && destination && (
        <View style={styles.navigationStatusContainer}>
          <Text style={styles.navigationStatusText}>
            Starting navigation to {destination.name}...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  map: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
    height: 40,
  },
  destinationPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  destinationText: {
    flex: 1,
    marginLeft: 8,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
  },
  destinationDropdown: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    maxHeight: 300,
  },
  destinationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  destinationItemText: {
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsText: {
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
  },
  dangerMarker: {
    backgroundColor: Colors.error,
    borderRadius: 20,
    padding: 4,
  },
  estimatedTimeBanner: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  estimatedTimeText: {
    marginLeft: 8,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
  },
  dangerBanner: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error,
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  dangerText: {
    flex: 1,
    marginLeft: 8,
    fontFamily: 'Inter-Medium',
    color: Colors.white,
  },
  rerouteButton: {
    backgroundColor: Colors.white,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  rerouteText: {
    fontFamily: 'Inter-Medium',
    color: Colors.error,
    fontSize: 12,
  },
  navigationControls: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
  },
  startNavButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  startNavText: {
    marginLeft: 8,
    fontFamily: 'Inter-Bold',
    color: Colors.white,
    fontSize: 16,
  },
  navigationStatusContainer: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  navigationStatusText: {
    fontFamily: 'Inter-Medium',
    color: Colors.white,
    fontSize: 14,
  },
});

// Add the default export at the end of the file after NavigationScreen is defined
export default function NavigationScreenDefault() {
  // This will be rendered by Expo Router
  return (
    <View style={{ flex: 1 }}>
      <NavigationScreen />
    </View>
  );
}