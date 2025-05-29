import Colors from '@/constants/Colors';
import { sendEmergencyAlert } from '@/services/emergency';
import { getLocationAsync } from '@/services/location';
import { Buffer } from 'buffer';
import { Battery, Bluetooth, RefreshCw } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// We'll create the BLE manager instance inside the component to ensure it's only initialized when needed

function SOSScreen() {
  // Create BLE manager with useRef to ensure it's only created once
  const managerRef = useRef<BleManager | null>(null);
  
  // Initialize other state variables
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [lastButtonPress, setLastButtonPress] = useState<{
    pressCount: number;
    timestamp: string;
  } | null>(null);
  const [logs, setLogs] = useState<Array<{ timestamp: string; message: string }>>([]);
  
  // Store references to BLE subscriptions for proper cleanup
  const subscriptionsRef = useRef<any[]>([]);
  
  // Use a stable indicator instead of animation
  const connectionIndicator = useSharedValue(0);
  
  // Style for connected status - using a subtle border glow instead of scaling
  const animatedStyle = useAnimatedStyle(() => {
    return {
      borderColor: Colors.success,
      borderWidth: 2,
      shadowColor: Colors.success,
      // Fix: Properly nest shadowOffset in the style object
      style: {
        shadowOffset: { width: 0, height: 0 },
      },
      shadowOpacity: connectionIndicator.value,
      shadowRadius: 8,
      elevation: 4 * connectionIndicator.value,
    };
  });

  // Initialize BLE manager and request permissions on mount
  useEffect(() => {
    // Create BLE manager instance - using a more reliable initialization approach
    if (!managerRef.current) {
      try {
        // Import the BleManager dynamically to ensure it's fully loaded
        const BleManagerModule = require('react-native-ble-plx').BleManager;
        managerRef.current = new BleManagerModule();
        addLog('BLE manager initialized successfully');
      } catch (error) {
        console.error('Failed to initialize BLE manager:', error);
        addLog(`BLE initialization error: ${error.message || 'Unknown error'}`);
        Alert.alert(
          'BLE Error',
          'Failed to initialize Bluetooth. Please ensure Bluetooth is enabled on your device.',
          [{ text: 'OK' }]
        );
      }
    }
    
    // Request permissions
    requestPermissions();
    
    // Clean up on unmount
    return () => {
      // Clean up all BLE subscriptions first
      if (subscriptionsRef.current.length > 0) {
        console.log(`Cleaning up ${subscriptionsRef.current.length} BLE subscriptions on unmount`);
        subscriptionsRef.current.forEach(subscription => {
          try {
            if (subscription && typeof subscription.remove === 'function') {
              subscription.remove();
            }
          } catch (subError) {
            console.warn('Error removing subscription on unmount:', subError);
          }
        });
        subscriptionsRef.current = [];
      }
      
      // Then disconnect from device if connected
      if (connectedDevice) {
        disconnectFromDevice();
      }
      
      // Finally destroy the BLE manager
      if (managerRef.current) {
        managerRef.current.destroy();
        managerRef.current = null;
      }
    };
  }, []);

  // Set connection indicator when connected
  useEffect(() => {
    if (connectedDevice) {
      // Smoothly fade in the border glow effect
      connectionIndicator.value = withTiming(0.7, { duration: 800 });
    } else {
      // Fade out when disconnected
      connectionIndicator.value = withTiming(0, { duration: 500 });
    }
  }, [connectedDevice]);
  
  // Monitor connection state to detect unexpected disconnections
  useEffect(() => {
    if (!connectedDevice) return;
    
    let isUnmounted = false;
    let connectionCheckInterval: ReturnType<typeof setInterval>;
    
    // Set up periodic connection check
    connectionCheckInterval = setInterval(async () => {
      if (isUnmounted || !connectedDevice) return;
      
      try {
        const isConnected = await connectedDevice.isConnected();
        if (!isConnected && !isUnmounted) {
          // Device was unexpectedly disconnected
          addLog('Device unexpectedly disconnected');
          
          // Clear device state and cached devices list
          setConnectedDevice(null);
          setBatteryLevel(null);
          setAlertMessage('');
          setDevices([]); // Clear the cached devices list
          
          // Show popup notification
          Alert.alert(
            'Device Disconnected',
            'The SOS device has been disconnected. This may happen if the device was powered off or moved out of range.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Error checking connection status:', error);
        // If we can't check connection status, assume disconnected
        if (!isUnmounted) {
          addLog(`Connection check error: ${error.message}`);
          setConnectedDevice(null);
          setBatteryLevel(null);
          setAlertMessage('');
          setDevices([]); // Clear the cached devices list
          
          Alert.alert(
            'Connection Lost',
            'Lost connection to the SOS device. Please check if the device is powered on and in range.',
            [{ text: 'OK' }]
          );
        }
      }
    }, 5000); // Check every 5 seconds
    
    // Clean up interval on unmount or when device changes
    return () => {
      isUnmounted = true;
      if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
      }
    };
  }, [connectedDevice]);

  // Request necessary permissions for BLE
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        
        const allGranted = Object.values(granted).every(
          status => status === PermissionsAndroid.RESULTS.GRANTED
        );
        
        if (allGranted) {
          addLog('All permissions granted');
        } else {
          addLog('Some permissions were denied');
          Alert.alert(
            'Permissions Required',
            'Bluetooth and location permissions are required for SOS device connection.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        addLog(`Error requesting permissions: ${error.message}`);
      }
    }
  };

  // Start scanning for BLE devices
  const startScan = async () => {
    try {
      // Check if BLE manager is initialized
      if (!managerRef.current) {
        // Try to initialize BLE manager again if it failed the first time
        try {
          const BleManagerModule = require('react-native-ble-plx').BleManager;
          managerRef.current = new BleManagerModule();
          addLog('BLE manager initialized on demand');
        } catch (initError) {
          addLog('BLE manager initialization failed');
          Alert.alert(
            'BLE Error', 
            'Bluetooth manager could not be initialized. Please ensure Bluetooth is enabled and restart the app.',
            [{ text: 'OK' }]
          );
          return;
        }
      }
      
      // Check if Bluetooth is powered on
      const state = await managerRef.current.state();
      if (state !== 'PoweredOn') {
        addLog(`Bluetooth is not powered on (state: ${state})`);
        Alert.alert(
          'Bluetooth Not Ready', 
          'Please enable Bluetooth on your device and try again.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      setDevices([]);
      setIsScanning(true);
      addLog('Scanning for BLE devices...');
      
      managerRef.current.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          addLog(`Scan error: ${error.message}`);
          Alert.alert('Scan Error', error.message);
          setIsScanning(false);
          return;
        }
        
        // Filter for devices with names containing "SOS" or "XIAO_SOS"
        // You can adjust this filter based on your actual device name
        if (device?.name && (device.name.includes('SOS') || device.name.includes('XIAO_SOS'))) {
          setDevices(prev => {
            if (!prev.find(d => d.id === device.id)) {
              addLog(`Found device: ${device.name || 'Unnamed'} (${device.id})`);
              return [...prev, device];
            }
            return prev;
          });
        }
      });
      
      // Stop scan after 15 seconds (increased from 10 to give more time to find devices)
      setTimeout(() => {
        if (managerRef.current) {
          managerRef.current.stopDeviceScan();
        }
        setIsScanning(false);
        addLog('Scan completed');
        
        // If no devices found, show message
        if (devices.length === 0) {
          addLog('No SOS devices found');
          Alert.alert(
            'No Devices', 
            'No SOS devices were found. Please make sure your device is powered on and in range.',
            [{ text: 'OK' }]
          );
        }
      }, 15000);
    } catch (error) {
      setIsScanning(false);
      addLog(`Error starting scan: ${error.message}`);
      Alert.alert('Scan Error', error.message);
    }
  };

  // Connect to a BLE device
  const connectToDevice = async (device: Device) => {
    try {
      // Check if BLE manager is initialized
      if (!managerRef.current) {
        addLog('BLE manager not initialized');
        Alert.alert('BLE Error', 'Bluetooth manager is not initialized. Please restart the app.');
        return;
      }
      
      // Check if device is already connected
      if (connectedDevice && connectedDevice.id === device.id) {
        addLog(`Already connected to ${device.name || 'device'}`);
        Alert.alert('Already Connected', 'You are already connected to this device.');
        return;
      }
      
      // Disconnect from any existing device first
      if (connectedDevice) {
        addLog('Disconnecting from previous device before connecting to new one');
        await disconnectFromDevice();
      }
      
      addLog(`Connecting to ${device.name || 'device'} (${device.id})...`);
      
      // Connect to the device with timeout
      const connectPromise = device.connect({ timeout: 15000 });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 15000)
      );
      
      const connected = await Promise.race([connectPromise, timeoutPromise]) as Device;
      addLog('Device connected, discovering services...');
      
      // Discover services and characteristics with timeout
      const discoverPromise = connected.discoverAllServicesAndCharacteristics();
      const discoverTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Service discovery timeout')), 15000)
      );
      
      await Promise.race([discoverPromise, discoverTimeoutPromise]);
      addLog('Services discovered');
      
      // Set the connected device
      setConnectedDevice(connected);
      
      try {
        // First, try to read the battery level to check if the service is available
        try {
          const batteryCharacteristic = await connected.readCharacteristicForService(
            '0000180F-0000-1000-8000-00805f9b34fb', // Battery Service
            '00002A19-0000-1000-8000-00805f9b34fb'  // Battery Level
          );
          
          if (batteryCharacteristic?.value) {
            const initialBatteryValue = Buffer.from(batteryCharacteristic.value, 'base64')[0];
            setBatteryLevel(initialBatteryValue);
            addLog(`Initial battery level: ${initialBatteryValue}%`);
          }
        } catch (readError) {
          // If reading fails, the service might not be available
          console.warn('Could not read battery level:', readError);
          addLog('Battery service not available, will try alternative services');
        }
        
        // Set up monitoring for button presses
        // Try multiple service/characteristic combinations to increase compatibility
        
        // First try the standard Battery service
        const batteryMonitor = connected.monitorCharacteristicForService(
          '0000180F-0000-1000-8000-00805f9b34fb', // Battery Service
          '00002A19-0000-1000-8000-00805f9b34fb', // Battery Level
          (error, characteristic) => {
            if (error) {
              console.error('Battery monitoring error:', error);
              addLog(`Battery monitoring error: ${error.message}`);
              
              // Check if the error indicates the device was disconnected
              if (error.message && error.message.includes('disconnected')) {
                // Device was disconnected during monitoring
                if (connectedDevice && connectedDevice.id === connected.id) {
                  // Only handle if this is still our current connected device
                  setConnectedDevice(null);
                  setBatteryLevel(null);
                  setAlertMessage('');
                  setDevices([]); // Clear the devices list
                  
                  // Show popup notification
                  Alert.alert(
                    'Device Disconnected',
                    'The SOS device has been disconnected during monitoring. This may happen if the device was powered off or moved out of range.',
                    [{ text: 'OK' }]
                  );
                }
              } else if (error.message && error.message.includes('cancelled')) {
                // This is an expected error when we disconnect properly
                addLog('Battery monitoring cancelled (expected during disconnect)');
              }
              return;
            }
            
            if (characteristic?.value) {
              try {
                // First try to decode as a string (how the SOS device is sending data)
                const decodedString = Buffer.from(characteristic.value, 'base64').toString('ascii');
                addLog(`Received value: ${decodedString}`);
                
                // Check if it's one of our emergency codes
                if (decodedString === "100" || decodedString === "108" || decodedString === "112") {
                  // Map the emergency codes to press counts
                  let pressCount = 1; // Default
                  if (decodedString === "108") pressCount = 2;
                  if (decodedString === "112") pressCount = 3;
                  
                  handleButtonPress(pressCount);
                  setAlertMessage(`⚠ Alert Received: ${decodedString} (${pressCount} press(es))`);
                } else {
                  // Fallback to the old method for backward compatibility
                  const batteryValue = Buffer.from(characteristic.value, 'base64')[0];
                  setBatteryLevel(batteryValue);
                  
                  if (batteryValue >= 1 && batteryValue <= 3) {
                    handleButtonPress(batteryValue);
                    setAlertMessage(`⚠ Alert Received: ${batteryValue} press(es) detected`);
                  }
                }
              } catch (decodeError) {
                console.error('Error decoding value:', decodeError);
                addLog(`Error decoding data: ${decodeError.message}`);
              }
            }
          }
        );
        
        // Store the battery monitor subscription for proper cleanup
        subscriptionsRef.current.push(batteryMonitor);
        addLog('Battery monitoring subscription stored for cleanup');
        
        // Also try a custom SOS service if available (for devices specifically designed for this app)
        // This is a made-up UUID that a real SOS device might use
        try {
          const sosMonitor = connected.monitorCharacteristicForService(
            '00000001-0000-1000-8000-00805f9b34fb', // Custom SOS Service
            '00000002-0000-1000-8000-00805f9b34fb', // SOS Button Characteristic
            (error, characteristic) => {
              if (error) {
                // Just log this error, don't alert as this is a fallback service
                console.warn('SOS service monitoring error:', error);
                return;
              }
              
              if (characteristic?.value) {
                try {
                  // Decode the characteristic value as a string
                  const decodedString = Buffer.from(characteristic.value, 'base64').toString('ascii');
                  addLog(`SOS button value received: ${decodedString}`);
                  
                  // Check if it's one of our emergency codes
                  if (decodedString === "100" || decodedString === "108" || decodedString === "112") {
                    // Map the emergency codes to press counts
                    let pressCount = 1; // Default
                    if (decodedString === "108") pressCount = 2;
                    if (decodedString === "112") pressCount = 3;
                    
                    handleButtonPress(pressCount);
                    setAlertMessage(`⚠ Emergency Alert: ${decodedString} (${pressCount} press(es))`);
                  } else {
                    // Try to parse as a number if it's not one of our known codes
                    const buttonValue = parseInt(decodedString, 10);
                    if (!isNaN(buttonValue) && buttonValue >= 1 && buttonValue <= 3) {
                      handleButtonPress(buttonValue);
                      setAlertMessage(`⚠ Emergency Alert: ${buttonValue} press(es) detected`);
                    } else {
                      // Handle as a generic message
                      addLog(`Received unknown SOS code: ${decodedString}`);
                      setAlertMessage(`⚠ Emergency Alert: ${decodedString}`);
                    }
                  }
                } catch (decodeError) {
                  console.error('Error decoding SOS button value:', decodeError);
                }
              }
            }
          );
          
          // Store the SOS monitor subscription for proper cleanup
          subscriptionsRef.current.push(sosMonitor);
          addLog('Monitoring SOS button service');
        } catch (sosMonitorError) {
          // This is expected to fail on devices that don't have this service
          console.warn('SOS service not available:', sosMonitorError);
        }
      } catch (monitorError) {
        console.error('Error setting up monitoring:', monitorError);
        addLog(`Error setting up monitoring: ${monitorError.message}`);
        // Continue even if monitoring setup fails
      }
      
      // Show success message
      Alert.alert(
        'Connected',
        `Connected to ${device.name || 'SOS device'}. The device will now send emergency alerts when the physical button is pressed.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Connection error:', error);
      addLog(`Connection error: ${error.message}`);
      
      // Check for specific error types
      const errorMessage = error.message || '';
      
      // Handle "already connected" error specifically
      if (errorMessage.includes('already connected')) {
        // Device is already connected but our state doesn't reflect it
        // This can happen if the app lost track of the connection state
        
        // First try to disconnect
        try {
          await device.cancelConnection();
          addLog('Disconnected from device that was already connected');
        } catch (disconnectError) {
          console.warn('Error disconnecting from already connected device:', disconnectError);
        }
        
        // Clear state
        setConnectedDevice(null);
        setBatteryLevel(null);
        setAlertMessage('');
        
        // Clear the devices list to force a fresh scan
        setDevices([]);
        
        Alert.alert(
          'Connection Issue',
          'The device appears to be in an inconsistent state. Please try scanning again.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Handle "operation cancelled" error
      if (errorMessage.includes('cancelled')) {
        // This usually happens when the device disconnects during connection attempt
        Alert.alert(
          'Connection Cancelled',
          'The connection was cancelled. The device may have been turned off or moved out of range.',
          [{ text: 'OK' }]
        );
      } else {
        // Generic error handling
        Alert.alert('Connection Failed', error.message);
      }
      
      // Make sure we clean up any partial connection
      if (connectedDevice) {
        try {
          await connectedDevice.cancelConnection();
        } catch (cleanupError) {
          console.error('Error during connection cleanup:', cleanupError);
        }
        setConnectedDevice(null);
      }
      
      // Clear the devices list to force a fresh scan
      setDevices([]);
    }
  };

  // Disconnect from the device
  const disconnectFromDevice = async () => {
    if (connectedDevice) {
      try {
        addLog(`Disconnecting from ${connectedDevice.name || 'device'}...`);
        
        // Create a local reference to the device to avoid race conditions
        const deviceToDisconnect = connectedDevice;
        
        // First, clean up all BLE subscriptions to prevent "Operation was cancelled" errors
        if (subscriptionsRef.current.length > 0) {
          addLog(`Cleaning up ${subscriptionsRef.current.length} BLE subscriptions`);
          subscriptionsRef.current.forEach(subscription => {
            try {
              if (subscription && typeof subscription.remove === 'function') {
                subscription.remove();
              }
            } catch (subError) {
              console.warn('Error removing subscription:', subError);
            }
          });
          // Clear the subscriptions array
          subscriptionsRef.current = [];
        }
        
        // Reset state variables to update UI immediately
        setConnectedDevice(null);
        setBatteryLevel(null);
        setAlertMessage('');
        setDevices([]); // Clear the devices list to force a fresh scan
        
        // Check if the device is still connected before trying to disconnect
        try {
          const isConnected = await deviceToDisconnect.isConnected();
          if (isConnected) {
            // Set a timeout to ensure the disconnect operation doesn't hang
            const disconnectPromise = deviceToDisconnect.cancelConnection();
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Disconnect timeout')), 5000)
            );
            
            await Promise.race([disconnectPromise, timeoutPromise]);
            addLog('Device disconnected successfully');
          } else {
            addLog('Device was already disconnected');
          }
        } catch (connectionCheckError) {
          console.warn('Error checking connection status:', connectionCheckError);
          // Try to disconnect anyway
          try {
            await deviceToDisconnect.cancelConnection();
          } catch (forcedDisconnectError) {
            console.warn('Forced disconnect error:', forcedDisconnectError);
          }
          addLog('Forced device disconnection');
        }
      } catch (error) {
        addLog(`Disconnection error: ${error.message}`);
        console.error('Disconnection error:', error);
        
        // No need to reset state variables again as we did it at the beginning
        
        // Only show an alert for significant errors
        if (error.message !== 'Disconnect timeout') {
          Alert.alert('Disconnection Error', error.message);
        }
      } finally {
        // Ensure the BLE manager is still scanning for devices if needed
        if (isScanning && managerRef.current) {
          addLog('Resuming scan after disconnection');
          try {
            managerRef.current.startDeviceScan(null, null, (error, device) => {
              // Scan callback logic (simplified to avoid duplication)
              if (!error && device?.name && 
                  (device.name.includes('SOS') || device.name.includes('XIAO_SOS'))) {
                setDevices(prev => {
                  if (!prev.find(d => d.id === device.id)) {
                    return [...prev, device];
                  }
                  return prev;
                });
              }
            });
          } catch (scanError) {
            console.warn('Error resuming scan:', scanError);
          }
        }
      }
    }
  };

  // Add a log entry
  const addLog = (message: string) => {
    try {
      const timestamp = new Date().toLocaleTimeString();
      setLogs(prev => [{ timestamp, message }, ...prev].slice(0, 10));
    } catch (error) {
      console.error('Error adding log:', error);
    }
  };

  // Handle button press from the device
  const handleButtonPress = async (pressCount: number) => {
    try {
      // Update last button press info
      const timestamp = new Date().toISOString();
      setLastButtonPress({
        pressCount,
        timestamp,
      });
      
      // Log the button press
      addLog(`SOS button pressed ${pressCount} time(s)`);
      
      // Determine emergency type based on press count
      let emergencyType = '';
      let phoneNumber = '';
      
      switch (pressCount) {
        case 1:
          emergencyType = 'Police';
          phoneNumber = '100';
          break;
        case 2:
          emergencyType = 'Medical';
          phoneNumber = '108';
          break;
        case 3:
          emergencyType = 'National Emergency';
          phoneNumber = '112';
          break;
        default:
          emergencyType = 'General';
          phoneNumber = '112';
      }
      
      // Show confirmation dialog
      Alert.alert(
        'Emergency Alert Received',
        `The SOS button was pressed ${pressCount} time(s), indicating a ${emergencyType} emergency. Do you want to send an alert?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              addLog(`${emergencyType} emergency cancelled by user`);
            }
          },
          {
            text: 'Send Alert',
            style: 'destructive',
            onPress: async () => {
              // Get current location
              const location = await getLocationAsync();
              
              // Send alert to emergency contact with location
              if (location) {
                sendEmergencyAlert({
                  type: emergencyType,
                  location: {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  },
                  timestamp: new Date().toISOString(),
                });
                addLog('Emergency alert sent with location data');
              } else {
                sendEmergencyAlert({
                  type: emergencyType,
                  timestamp: new Date().toISOString(),
                });
                addLog('Emergency alert sent without location data');
              }
              
              // Show confirmation to user
              Alert.alert(
                'Alert Sent',
                `${emergencyType} emergency alert has been sent. Emergency services will be notified.`,
                [{ text: 'OK' }]
              );
            }
          }
        ],
        { cancelable: false }
      );
    } catch (error) {
      addLog(`Error handling button press: ${error.message}`);
      Alert.alert('Error', 'Failed to process emergency button press');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Calming header with softer colors */}
      <View style={styles.header}>
        <Text style={styles.title}>Emergency Connect</Text>
        <View style={[
          styles.statusIndicator, 
          { backgroundColor: connectedDevice ? Colors.successLight : Colors.background }
        ]}>
          <Text style={[
            styles.statusText,
            { color: connectedDevice ? Colors.success : Colors.textSecondary }
          ]}>
            {connectedDevice ? 'Connected' : 'Ready to Connect'}
          </Text>
        </View>
      </View>

      {/* Main content area with more breathing space */}
      <View style={styles.contentContainer}>
        {/* Connected device state */}
        {connectedDevice ? (
          <Animated.View style={[styles.deviceInfoContainer, animatedStyle]}>
            <View style={styles.deviceHeader}>
              <View style={styles.deviceIcon}>
                <Bluetooth size={24} color={Colors.white} />
              </View>
              <View style={styles.deviceTitleContainer}>
                <Text style={styles.deviceName}>{connectedDevice.name || 'SOS Device'}</Text>
                <Text style={styles.deviceStatus}>Ready for emergencies</Text>
              </View>
            </View>
            
            <View style={styles.deviceDetails}>
              {batteryLevel !== null && (
                <View style={styles.batteryCard}>
                  <Battery size={20} color={
                    batteryLevel > 50 ? Colors.success : 
                    batteryLevel > 20 ? Colors.warning : Colors.error
                  } />
                  <Text style={styles.batteryText}>
                    Battery: <Text style={{fontFamily: 'Inter-Medium'}}>{batteryLevel}%</Text>
                  </Text>
                </View>
              )}
              
              {alertMessage && (
                <View style={styles.alertMessageContainer}>
                  <Text style={styles.alertMessageText}>{alertMessage}</Text>
                </View>
              )}
            </View>
            
            {/* Emergency instructions card */}
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsTitle}>Emergency Button Guide</Text>
              <View style={styles.instructionsList}>
                <View style={styles.instructionItem}>
                  <View style={[styles.instructionDot, {backgroundColor: Colors.error}]} />
                  <Text style={styles.instructionText}>Press <Text style={{fontWeight: 'bold'}}>once</Text> for Police (100)</Text>
                </View>
                <View style={styles.instructionItem}>
                  <View style={[styles.instructionDot, {backgroundColor: Colors.warning}]} />
                  <Text style={styles.instructionText}>Press <Text style={{fontWeight: 'bold'}}>twice</Text> for Medical (108)</Text>
                </View>
                <View style={styles.instructionItem}>
                  <View style={[styles.instructionDot, {backgroundColor: Colors.primary}]} />
                  <Text style={styles.instructionText}>Press <Text style={{fontWeight: 'bold'}}>three times</Text> for National Emergency (112)</Text>
                </View>
              </View>
            </View>
            
            {/* Device ID shown in a less prominent way */}
            <Text style={styles.deviceIdText}>Device ID: {connectedDevice.id}</Text>
            
            <TouchableOpacity 
              style={styles.disconnectButton}
              onPress={disconnectFromDevice}
            >
              <Text style={styles.disconnectText}>Disconnect</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          /* Not connected state */
          <View style={styles.notConnectedContainer}>
            {/* Calming illustration/message */}
            <View style={styles.welcomeCard}>
              <Text style={styles.welcomeTitle}>SOS Emergency Device</Text>
              <Text style={styles.welcomeText}>
                Connect your emergency button to send alerts quickly in critical situations.
              </Text>
            </View>
            
            {/* Emergency instructions */}
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsTitle}>Emergency Button Guide</Text>
              <View style={styles.instructionsList}>
                <View style={styles.instructionItem}>
                  <View style={[styles.instructionDot, {backgroundColor: Colors.error}]} />
                  <Text style={styles.instructionText}>Press <Text style={{fontWeight: 'bold'}}>once</Text> for Police (100)</Text>
                </View>
                <View style={styles.instructionItem}>
                  <View style={[styles.instructionDot, {backgroundColor: Colors.warning}]} />
                  <Text style={styles.instructionText}>Press <Text style={{fontWeight: 'bold'}}>twice</Text> for Medical (108)</Text>
                </View>
                <View style={styles.instructionItem}>
                  <View style={[styles.instructionDot, {backgroundColor: Colors.primary}]} />
                  <Text style={styles.instructionText}>Press <Text style={{fontWeight: 'bold'}}>three times</Text> for National Emergency (112)</Text>
                </View>
              </View>
            </View>
            
            {/* Scanning state */}
            {isScanning ? (
              <View style={styles.scanningContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.scanningText}>Looking for devices...</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.scanButton}
                onPress={startScan}
                disabled={isScanning}
              >
                <RefreshCw size={20} color={Colors.white} />
                <Text style={styles.scanButtonText}>Find SOS Device</Text>
              </TouchableOpacity>
            )}
            
            {/* Available devices list with cleaner design */}
            {devices.length > 0 && (
              <View style={styles.deviceList}>
                <Text style={styles.deviceListTitle}>Available Devices</Text>
                <FlatList
                  data={devices}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={styles.deviceItem}>
                      <View style={styles.deviceItemInfo}>
                        <View style={styles.deviceItemIcon}>
                          <Bluetooth size={16} color={Colors.white} />
                        </View>
                        <View>
                          <Text style={styles.deviceItemName}>{item.name || 'Unnamed Device'}</Text>
                          <Text style={styles.deviceItemId}>{item.id.substring(0, 8)}...</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.connectButton}
                        onPress={() => connectToDevice(item)}
                      >
                        <Text style={styles.connectButtonText}>Connect</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  style={styles.flatList}
                />
              </View>
            )}
          </View>
        )}
      </View>
      
      {/* Last button press notification with calmer design */}
      {lastButtonPress && (
        <View style={styles.lastActionContainer}>
          <View style={styles.lastActionIcon}>
            <Text style={styles.lastActionCount}>{lastButtonPress.pressCount}</Text>
          </View>
          <View style={styles.lastActionInfo}>
            <Text style={styles.lastActionTitle}>Last Emergency Signal</Text>
            <Text style={styles.lastActionText}>
              {new Date(lastButtonPress.timestamp).toLocaleTimeString()} • {
                lastButtonPress.pressCount === 1 ? 'Police' :
                lastButtonPress.pressCount === 2 ? 'Medical' : 'National Emergency'
              }
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

export default SOSScreen;

const styles = StyleSheet.create({
  // Base container
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  // Header styles - more calming and less clinical
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    color: Colors.primary,
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  
  // Main content container
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  
  // Connected device styles - more visually appealing
  deviceInfoContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    // Default border color - will be overridden by animatedStyle when connected
    borderColor: Colors.border,
    shadowColor: '#000',
    // Fix: Properly nest shadowOffset in the style object for Animated.View
    style: {
      shadowOffset: { width: 0, height: 2 },
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deviceTitleContainer: {
    flex: 1,
  },
  deviceName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  deviceStatus: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.success,
  },
  deviceDetails: {
    marginBottom: 20,
  },
  batteryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  batteryText: {
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
    marginLeft: 8,
    fontSize: 14,
  },
  deviceIdText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginVertical: 16,
  },
  
  // Instructions card - clear and calming
  instructionsCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  instructionsList: {
    marginTop: 8,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  instructionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  
  // Not connected state
  notConnectedContainer: {
    alignItems: 'center',
  },
  welcomeCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    // Fix: Properly nest shadowOffset in the style object
    style: {
      shadowOffset: { width: 0, height: 2 },
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  welcomeTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: Colors.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Scanning state
  scanningContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 8,
  },
  scanningText: {
    fontFamily: 'Inter-Medium',
    color: Colors.primary,
    marginTop: 12,
    fontSize: 15,
  },
  
  // Scan button - more inviting
  scanButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    marginTop: 16,
    shadowColor: '#000',
    // Fix: Properly nest shadowOffset in the style object
    style: {
      shadowOffset: { width: 0, height: 2 },
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scanButtonText: {
    fontFamily: 'Inter-Medium',
    color: Colors.white,
    marginLeft: 10,
    fontSize: 16,
  },
  
  // Device list - cleaner and more organized
  deviceList: {
    marginTop: 24,
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  deviceListTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  flatList: {
    maxHeight: 220,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  deviceItemInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deviceItemName: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  deviceItemId: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.textTertiary,
  },
  
  // Connect/disconnect buttons
  connectButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  connectButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.white,
  },
  disconnectButton: {
    backgroundColor: Colors.white,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.error,
  },
  disconnectText: {
    fontFamily: 'Inter-Medium',
    color: Colors.error,
    fontSize: 15,
  },
  
  // Alert message - less alarming but still noticeable
  alertMessageContainer: {
    marginTop: 8,
    marginBottom: 16,
    padding: 12,
    backgroundColor: Colors.errorLight,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  alertMessageText: {
    fontFamily: 'Inter-Medium',
    color: Colors.error,
    fontSize: 14,
  },
  
  // Last action container - more informative and calming
  lastActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  lastActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  lastActionCount: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: Colors.primary,
  },
  lastActionInfo: {
    flex: 1,
  },
  lastActionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  lastActionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
});