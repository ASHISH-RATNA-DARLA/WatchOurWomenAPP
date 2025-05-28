import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, TriangleAlert as AlertTriangle, Navigation, Search, Clock, X } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { mockCrimeData } from '@/constants/mockData';
import { getLocationAsync } from '@/services/location';
import PrimaryButton from '@/components/ui/PrimaryButton';

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

export default function NavigationScreen() {
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

  // Generate mock route when destination changes
  useEffect(() => {
    if (!destination) return;
    
    // Mock route generation
    generateMockRoute(currentLocation, destination);
    
    // Check for danger zones
    const dangerZonesNearRoute = checkDangerZones();
    setDangerZones(dangerZonesNearRoute);
    setDangerAlert(dangerZonesNearRoute.length > 0);
    
    // Calculate estimated time
    calculateEstimatedTime(currentLocation, destination);
  }, [destination]);

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

  const startNavigation = () => {
    setIsNavigating(true);
    // In a real app, this would start turn-by-turn navigation
    // For demo, we'll just show an alert
    setTimeout(() => {
      Alert.alert(
        "Navigation Started",
        `Navigating to ${destination.name}. Estimated arrival in ${estimatedTime} minutes.`,
        [{ text: "OK", onPress: () => setIsNavigating(false) }]
      );
    }, 1500);
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
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.0121,
        }}
      >
        {/* Current location marker */}
        <Marker
          coordinate={currentLocation}
          title="You are here"
          pinColor={Colors.primary}
        />
        
        {/* Destination marker */}
        {destination && (
          <Marker
            coordinate={{
              latitude: destination.latitude,
              longitude: destination.longitude,
            }}
            title={destination.name}
            pinColor={Colors.accent}
          />
        )}
        
        {/* Route line */}
        {route.length > 0 && (
          <Polyline
            coordinates={route}
            strokeWidth={4}
            strokeColor={Colors.primary}
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
            description={zone.description}
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
  },
});