import BatteryMonitor from '@/components/home/BatteryMonitor';
import EmergencyButton from '@/components/home/EmergencyButton';
import SafetyGearCard from '@/components/home/SafetyGearCard';
import TravelingStatus from '@/components/home/TravelingStatus';
import Colors from '@/constants/Colors';
import { getLocationAsync } from '@/services/location';
import { Shield } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [isTraveling, setIsTraveling] = useState(false);
  const [battery, setBattery] = useState(100);
  
  // Simulated data - would come from battery API in real app
  useEffect(() => {
    // Simulating battery level
    setBattery(Math.floor(Math.random() * 100));
    
    const intervalId = setInterval(() => {
      const newLevel = Math.floor(Math.random() * 100);
      setBattery(newLevel);
    }, 30000); // Update every 30 seconds for demo purposes
    
    return () => clearInterval(intervalId);
  }, []);

  // Simulate location tracking when traveling
  useEffect(() => {
    if (!isTraveling) return;
    
    let locationInterval: NodeJS.Timeout;
    
    const startLocationTracking = async () => {
      try {
        const location = await getLocationAsync();
        console.log('Location tracked:', location);
        
        // In a real app, would send this to API
        // api.sendLocation(location);
        
      } catch (error) {
        console.error('Failed to track location:', error);
      }
    };
    
    // Track immediately when enabled
    startLocationTracking();
    
    // Then track every 5 minutes
    locationInterval = setInterval(startLocationTracking, 5 * 60 * 1000);
    
    return () => {
      if (locationInterval) clearInterval(locationInterval);
    };
  }, [isTraveling]);

  const toggleTraveling = () => {
    setIsTraveling(!isTraveling);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Shield size={24} color={Colors.primary} />
          <Text style={styles.title}>W.O.W</Text>
        </View>
        <View style={styles.travelToggleContainer}>
          <Text style={styles.travelLabel}>
            {isTraveling ? 'Traveling' : 'Not Traveling'}
          </Text>
          <Switch
            value={isTraveling}
            onValueChange={toggleTraveling}
            trackColor={{ false: Colors.lightGray, true: Colors.primaryLight }}
            thumbColor={isTraveling ? Colors.primary : Colors.gray}
            ios_backgroundColor={Colors.lightGray}
          />
        </View>
      </View>

      {isTraveling && <TravelingStatus />}

      <ScrollView style={styles.scrollView}>
        <Text style={styles.sectionTitle}>Safety Gear</Text>
        <View style={styles.gearContainer}>
          <SafetyGearCard
            title="Pepper Spray"
            image="https://images.pexels.com/photos/5453811/pexels-photo-5453811.jpeg"
            description="Compact and easy to carry pepper spray with 10ft range."
          />
          <SafetyGearCard
            title="SOS Keychain"
            image="https://images.pexels.com/photos/821754/pexels-photo-821754.jpeg"
            description="One-press SOS keychain with loud alarm and LED light."
          />
        </View>
        <View style={styles.gearContainer}>
          <SafetyGearCard
            title="Smart ID Card"
            image="https://images.pexels.com/photos/6177645/pexels-photo-6177645.jpeg"
            description="ID card with built-in SOS button and GPS tracker."
          />
          <SafetyGearCard
            title="Defense Manual"
            image="https://images.pexels.com/photos/256450/pexels-photo-256450.jpeg"
            description="Comprehensive guide to self-defense techniques for women."
          />
        </View>

        <BatteryMonitor level={battery} />
      </ScrollView>

      <EmergencyButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: Colors.primary,
    marginLeft: 8,
  },
  travelToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  travelLabel: {
    marginRight: 8,
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  gearContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
});