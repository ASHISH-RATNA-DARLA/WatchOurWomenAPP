import BatteryMonitor from '@/components/home/BatteryMonitor';
import DefenseManualViewer from '@/components/home/DefenseManualViewer';
import EmergencyButton from '@/components/home/EmergencyButton';
import SafetyGearCard from '@/components/home/SafetyGearCard';
import TravelingStatus from '@/components/home/TravelingStatus';
import Colors from '@/constants/Colors';
import BatteryService from '@/services/battery';
import ContentService from '@/services/content';
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
  const [battery, setBattery] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [batteryError, setBatteryError] = useState<string | null>(null);
  const [isManualVisible, setIsManualVisible] = useState(false);
  
  // Use our custom battery service with real device data
  useEffect(() => {
    let batteryLevelSubscription: { remove: () => void } | null = null;
    let chargingStateSubscription: { remove: () => void } | null = null;
    
    // Function to get battery level and charging status
    const getBatteryInfo = async () => {
      try {
        // Get real battery data from the device
        const level = await BatteryService.getBatteryLevel();
        const charging = await BatteryService.isBatteryCharging();
        
        setBattery(level);
        setIsCharging(charging);
        setBatteryError(null);
        
        console.log(`Battery level: ${level}%, Charging: ${charging}`);
      } catch (error) {
        console.error('Error getting battery info:', error);
        setBatteryError('Unable to fetch battery data');
      }
    };
    
    // Initial fetch
    getBatteryInfo();
    
    // Set up listeners for real-time updates
    try {
      batteryLevelSubscription = BatteryService.addBatteryLevelListener((newLevel) => {
        setBattery(newLevel);
        setBatteryError(null);
        console.log(`Battery level changed: ${newLevel}%`);
      });
      
      chargingStateSubscription = BatteryService.addChargingStateListener((charging) => {
        setIsCharging(charging);
        console.log(`Charging state changed: ${charging}`);
      });
    } catch (error) {
      console.error('Error setting up battery listeners:', error);
      setBatteryError('Unable to monitor battery status');
    }
    
    // Fallback polling every 30 seconds in case listeners don't work
    const intervalId = setInterval(getBatteryInfo, 30000);
    
    // Clean up function
    return () => {
      // Remove battery listeners
      if (batteryLevelSubscription) {
        batteryLevelSubscription.remove();
      }
      
      if (chargingStateSubscription) {
        chargingStateSubscription.remove();
      }
      
      // Clear interval
      clearInterval(intervalId);
    };
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
            isManual={true}
            onOpenManual={() => setIsManualVisible(true)}
          />
        </View>

        <BatteryMonitor level={battery} isCharging={isCharging} error={batteryError} />
      </ScrollView>

      <EmergencyButton />
      
      {/* Defense Manual Viewer Modal */}
      <DefenseManualViewer 
        isVisible={isManualVisible} 
        onClose={() => setIsManualVisible(false)} 
      />
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