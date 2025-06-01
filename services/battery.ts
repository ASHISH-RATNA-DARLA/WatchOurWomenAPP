import * as Battery from 'expo-battery';
import { useEffect, useState } from 'react';

// Battery service using the real Expo Battery API
export const BatteryService = {
  // Get current battery level (0-100)
  getBatteryLevel: async (): Promise<number> => {
    try {
      const batteryLevel = await Battery.getBatteryLevelAsync();
      // Convert from 0-1 to 0-100 and round to nearest integer
      return Math.round(batteryLevel * 100);
    } catch (error) {
      console.error('Error getting battery level:', error);
      // Signal error with -1 instead of providing a default value
      throw new Error('Unable to fetch battery data');
    }
  },

  // Check if the device is currently charging
  isBatteryCharging: async (): Promise<boolean> => {
    try {
      const powerState = await Battery.getPowerStateAsync();
      return powerState.batteryState === Battery.BatteryState.CHARGING || 
             powerState.batteryState === Battery.BatteryState.FULL;
    } catch (error) {
      console.error('Error checking charging status:', error);
      throw new Error('Unable to fetch battery charging status');
    }
  },

  // Start monitoring battery changes
  startMonitoring: (): void => {
    // No explicit start needed with Expo Battery
    console.log('Battery monitoring started');
  },

  // Stop monitoring battery changes
  stopMonitoring: (): void => {
    // No explicit stop needed with Expo Battery
    console.log('Battery monitoring stopped');
  },

  // Add a listener for battery level changes
  addBatteryLevelListener: (callback: (level: number) => void) => {
    try {
      const subscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
        // Convert from 0-1 to 0-100 and round to nearest integer
        callback(Math.round(batteryLevel * 100));
      });
      
      // Create a wrapper to match the expected interface
      return {
        remove: () => {
          Battery.removeBatteryLevelListener(subscription);
        }
      };
    } catch (error) {
      console.error('Error adding battery level listener:', error);
      return { remove: () => {} };
    }
  },

  // Add a listener for charging state changes
  addChargingStateListener: (callback: (isCharging: boolean) => void) => {
    try {
      const subscription = Battery.addPowerStateListener(({ batteryState }) => {
        const isCharging = batteryState === Battery.BatteryState.CHARGING || 
                          batteryState === Battery.BatteryState.FULL;
        callback(isCharging);
      });
      
      // Create a wrapper to match the expected interface
      return {
        remove: () => {
          Battery.removePowerStateListener(subscription);
        }
      };
    } catch (error) {
      console.error('Error adding charging state listener:', error);
      return { remove: () => {} };
    }
  }
};

// Export a hook for easy use in components
export const useBatteryStatus = () => {
  const [level, setLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [isLow, setIsLow] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let levelSubscription: { remove: () => void } | null = null;
    let chargingSubscription: { remove: () => void } | null = null;

    // Initial fetch
    const fetchBatteryStatus = async () => {
      try {
        const batteryLevel = await BatteryService.getBatteryLevel();
        const charging = await BatteryService.isBatteryCharging();
        
        setLevel(batteryLevel);
        setIsCharging(charging);
        setIsLow(batteryLevel <= 20);
        setError(null);
      } catch (error) {
        console.error('Error fetching battery status:', error);
        setError('Unable to fetch battery data');
      }
    };

    fetchBatteryStatus();

    // Set up listeners
    try {
      levelSubscription = BatteryService.addBatteryLevelListener((newLevel) => {
        setLevel(newLevel);
        setIsLow(newLevel <= 20);
        setError(null);
      });

      chargingSubscription = BatteryService.addChargingStateListener((charging) => {
        setIsCharging(charging);
      });
    } catch (error) {
      console.error('Error setting up battery listeners:', error);
      setError('Unable to monitor battery status');
    }

    // Clean up
    return () => {
      if (levelSubscription) levelSubscription.remove();
      if (chargingSubscription) chargingSubscription.remove();
    };
  }, []);

  return { level, isCharging, isLow, error };
};

export default BatteryService;